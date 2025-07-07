import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { asyncHandler, responseMiddleware } from '../utils/apiResponse';
import { validateVehicleCapacity } from '../utils/businessValidations';

const router = Router();

// Apply response middleware
router.use(responseMiddleware);

// Enhanced schema for OGPL operations with proper validation
const ogplSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  from_station: z.string().uuid('Invalid from station ID'),
  to_station: z.string().uuid('Invalid to station ID'),
  transit_date: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Invalid transit date format'
  }),
  primary_driver_name: z.string().min(1, 'Primary driver name is required'),
  primary_driver_mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  secondary_driver_name: z.string().optional(),
  secondary_driver_mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number').optional(),
  remarks: z.string().max(500, 'Remarks too long').optional(),
  seal_number: z.string().max(50, 'Seal number too long').optional(),
  optimization_strategy: z.enum(['manual', 'route', 'weight', 'value', 'capacity', 'ai']).optional()
});

const loadingSessionSchema = z.object({
  ogpl_id: z.string().uuid('Invalid OGPL ID'),
  booking_ids: z.array(z.string().uuid('Invalid booking ID')).min(1, 'At least one booking is required'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  vehicle_validation: z.boolean().default(true) // Whether to validate vehicle capacity
});

// GET all OGPLs with enhanced details
router.get('/ogpls', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { orgId, branchId, role } = req;
  const { status, vehicle_id, date_from, date_to } = req.query;
  
  let query = supabase
    .from('ogpl')
    .select(`
      *,
      vehicle:vehicles(*),
      from_station:branches!from_station(*),
      to_station:branches!to_station(*),
      booking_articles (
        id,
        booking_id,
        status,
        loaded_at,
        loaded_by,
        actual_weight,
        charged_weight,
        booking:bookings!inner (
          id,
          lr_number,
          status,
          sender:customers!sender_id(name, mobile),
          receiver:customers!receiver_id(name, mobile),
          from_branch,
          to_branch
        ),
        article:articles(name, description)
      )
    `)
    .eq('organization_id', orgId);
    
  // Filter by branch for non-admin users
  if (role !== 'admin') {
    query = query.eq('from_station', branchId);
  }
  
  // Apply filters
  if (status) query = query.eq('status', status);
  if (vehicle_id) query = query.eq('vehicle_id', vehicle_id);
  if (date_from) query = query.gte('transit_date', date_from);
  if (date_to) query = query.lte('transit_date', date_to);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    return res.sendDatabaseError(error, 'Fetch OGPLs');
  }
  
  // Calculate summary statistics for each OGPL
  const enhancedData = data?.map(ogpl => {
    const articles = ogpl.booking_articles || [];
    const totalWeight = articles.reduce((sum: number, article: any) => 
      sum + (article.charged_weight || article.actual_weight || 0), 0
    );
    const totalBookings = new Set(articles.map((a: any) => a.booking_id)).size;
    const loadedArticles = articles.filter((a: any) => a.status === 'loaded').length;
    
    return {
      ...ogpl,
      statistics: {
        total_bookings: totalBookings,
        total_articles: articles.length,
        loaded_articles: loadedArticles,
        total_weight: totalWeight,
        loading_progress: totalBookings > 0 ? (loadedArticles / articles.length) * 100 : 0
      }
    };
  });
  
  res.sendSuccess(enhancedData, `Retrieved ${data?.length || 0} OGPLs`);
}));

// POST create new OGPL with enhanced validation
router.post('/ogpls', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = ogplSchema.safeParse(req.body);
  if (!parse.success) {
    return res.sendValidationError(parse.error.errors);
  }
  
  const payload = { ...parse.data };
  const { orgId, branchId, role, user } = req;
  payload['organization_id'] = orgId;
  
  // Validate that both stations belong to the organization
  const { data: stations, error: stationError } = await supabase
    .from('branches')
    .select('id, name, status')
    .in('id', [payload.from_station, payload.to_station])
    .eq('organization_id', orgId);
  
  if (stationError || !stations || stations.length !== 2) {
    return res.sendError('Invalid stations - both must belong to your organization', 400);
  }
  
  // Check station status
  const inactiveStation = stations.find(s => s.status !== 'active');
  if (inactiveStation) {
    return res.sendError(`Station "${inactiveStation.name}" is not active`, 400);
  }
  
  // Validate vehicle exists and is available
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, vehicle_number, status, capacity')
    .eq('id', payload.vehicle_id)
    .eq('organization_id', orgId)
    .single();
  
  if (vehicleError || !vehicle) {
    return res.sendError('Vehicle not found in your organization', 400);
  }
  
  if (vehicle.status !== 'active') {
    return res.sendError(`Vehicle ${vehicle.vehicle_number} is not active`, 400);
  }
  
  // Check if vehicle is already assigned to another active OGPL
  const { data: existingOGPL, error: ogplCheckError } = await supabase
    .from('ogpl')
    .select('id, ogpl_number')
    .eq('vehicle_id', payload.vehicle_id)
    .in('status', ['created', 'in_transit'])
    .maybeSingle();
  
  if (ogplCheckError) {
    return res.sendDatabaseError(ogplCheckError, 'Check vehicle availability');
  }
  
  if (existingOGPL) {
    return res.sendError(`Vehicle is already assigned to OGPL ${existingOGPL.ogpl_number}`, 400);
  }
  
  // Generate OGPL number
  const branchCode = stations.find(s => s.id === payload.from_station)?.name?.substring(0, 3)?.toUpperCase() || 'DEF';
  const timestamp = Date.now().toString().slice(-6);
  payload['ogpl_number'] = `OGPL${branchCode}${timestamp}`;
  payload['status'] = 'created';
  payload['created_by'] = user?.id;
  
  const { data, error } = await supabase.from('ogpl').insert(payload).select(`
    *,
    vehicle:vehicles(*),
    from_station:branches!from_station(*),
    to_station:branches!to_station(*)
  `).single();
  
  if (error) {
    return res.sendDatabaseError(error, 'Create OGPL');
  }
  
  res.sendSuccess(data, 'OGPL created successfully', 201);
}));

// POST add bookings to OGPL with comprehensive validation
router.post('/ogpls/:id/load-bookings', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = loadingSessionSchema.safeParse({ ...req.body, ogpl_id: req.params.id });
  if (!parse.success) {
    return res.sendValidationError(parse.error.errors);
  }
  
  const { ogpl_id, booking_ids, notes, vehicle_validation } = parse.data;
  const { orgId, branchId, role, user } = req;
  
  // Verify OGPL exists and is editable
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select(`
      *,
      vehicle:vehicles(id, vehicle_number, capacity, status)
    `)
    .eq('id', ogpl_id)
    .eq('organization_id', orgId)
    .single();
  
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.sendError('OGPL not found', 404);
    }
    return res.sendDatabaseError(ogplError, 'Fetch OGPL');
  }
  
  if (!['created', 'loading'].includes(ogpl.status)) {
    return res.sendError('Cannot load bookings - OGPL is not in editable state', 400);
  }
  
  // Verify all bookings exist and are loadable
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      lr_number,
      status,
      from_branch,
      to_branch,
      organization_id,
      booking_articles (
        id,
        article_id,
        quantity,
        actual_weight,
        charged_weight,
        status,
        ogpl_id,
        article:articles(name)
      )
    `)
    .in('id', booking_ids)
    .eq('organization_id', orgId);
  
  if (bookingError) {
    return res.sendDatabaseError(bookingError, 'Fetch bookings');
  }
  
  if (!bookings || bookings.length !== booking_ids.length) {
    return res.sendError('One or more bookings not found', 400);
  }
  
  // Validate booking constraints
  const validationErrors = [];
  let totalWeight = 0;
  const articlesToLoad = [];
  
  for (const booking of bookings) {
    // Check booking status
    if (!['booked', 'loaded'].includes(booking.status)) {
      validationErrors.push(`Booking ${booking.lr_number} is ${booking.status} - cannot load`);
      continue;
    }
    
    // Check route consistency
    if (booking.from_branch !== ogpl.from_station) {
      validationErrors.push(`Booking ${booking.lr_number} origin doesn't match OGPL route`);
      continue;
    }
    
    // Process articles in this booking
    for (const article of booking.booking_articles || []) {
      // Check if article is already loaded in another OGPL
      if (article.ogpl_id && article.ogpl_id !== ogpl_id) {
        validationErrors.push(`Article ${article.article.name} in ${booking.lr_number} is already loaded`);
        continue;
      }
      
      // Add to loading list
      articlesToLoad.push({
        id: article.id,
        booking_id: booking.id,
        weight: article.charged_weight || article.actual_weight || 0
      });
      
      totalWeight += article.charged_weight || article.actual_weight || 0;
    }
  }
  
  if (validationErrors.length > 0) {
    return res.sendError('Validation failed', 400, { errors: validationErrors });
  }
  
  // Validate vehicle capacity if requested
  let capacityWarnings = [];
  if (vehicle_validation && ogpl.vehicle) {
    const capacityValidation = await validateVehicleCapacity(ogpl.vehicle.id, totalWeight);
    if (!capacityValidation.valid) {
      return res.sendError(capacityValidation.message, 400, capacityValidation.details);
    }
    if (capacityValidation.warnings) {
      capacityWarnings = capacityValidation.warnings;
    }
  }
  
  try {
    // Start transaction - update all articles
    const { error: updateError } = await supabase
      .from('booking_articles')
      .update({
        status: 'loaded',
        ogpl_id: ogpl_id,
        loaded_at: new Date().toISOString(),
        loaded_by: user?.id || 'system',
        updated_at: new Date().toISOString()
      })
      .in('id', articlesToLoad.map(a => a.id));
    
    if (updateError) {
      throw updateError;
    }
    
    // Update booking statuses
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        status: 'loaded',
        updated_at: new Date().toISOString()
      })
      .in('id', booking_ids);
    
    if (bookingUpdateError) {
      throw bookingUpdateError;
    }
    
    // Update OGPL status to 'loading' if not already
    if (ogpl.status === 'created') {
      await supabase
        .from('ogpl')
        .update({
          status: 'loading',
          updated_at: new Date().toISOString()
        })
        .eq('id', ogpl_id);
    }
    
    // Create logistics events
    const events = articlesToLoad.map(article => ({
      event_type: 'article_loaded',
      booking_id: article.booking_id,
      branch_id: branchId,
      description: `Article loaded to OGPL ${ogpl.ogpl_number}`,
      metadata: {
        ogpl_id: ogpl_id,
        ogpl_number: ogpl.ogpl_number,
        article_id: article.id,
        loaded_by: user?.id
      }
    }));
    
    await supabase.from('logistics_events').insert(events);
    
    res.sendSuccess({
      loaded_articles: articlesToLoad.length,
      total_weight: totalWeight,
      ogpl_number: ogpl.ogpl_number,
      warnings: capacityWarnings
    }, `Successfully loaded ${articlesToLoad.length} articles to OGPL`, 200);
    
  } catch (error: any) {
    console.error('Loading error:', error);
    return res.sendError('Failed to load articles to OGPL', 500);
  }
}));

// DELETE remove bookings from OGPL with article-level granularity
router.delete('/ogpls/:id/unload-bookings', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { id: ogpl_id } = req.params;
  const { booking_ids, article_ids } = req.body; // Support both booking-level and article-level unloading
  const { orgId, branchId, user } = req;
  
  if ((!booking_ids || !Array.isArray(booking_ids)) && (!article_ids || !Array.isArray(article_ids))) {
    return res.sendError('Either booking_ids or article_ids array is required', 400);
  }
  
  // Verify OGPL exists and is editable
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('id, ogpl_number, status')
    .eq('id', ogpl_id)
    .eq('organization_id', orgId)
    .single();
  
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.sendError('OGPL not found', 404);
    }
    return res.sendDatabaseError(ogplError, 'Fetch OGPL');
  }
  
  if (!['created', 'loading'].includes(ogpl.status)) {
    return res.sendError('Cannot unload - OGPL is not in editable state', 400);
  }
  
  try {
    let unloadedCount = 0;
    
    if (article_ids && article_ids.length > 0) {
      // Article-level unloading
      const { data: articles, error: unloadError } = await supabase
        .from('booking_articles')
        .update({
          status: 'booked',
          ogpl_id: null,
          loaded_at: null,
          loaded_by: null,
          updated_at: new Date().toISOString()
        })
        .in('id', article_ids)
        .eq('ogpl_id', ogpl_id)
        .select('booking_id');
      
      if (unloadError) throw unloadError;
      unloadedCount = articles?.length || 0;
      
      // Update affected bookings status back to 'booked' if all their articles are unloaded
      if (articles && articles.length > 0) {
        const affectedBookingIds = [...new Set(articles.map(a => a.booking_id))];
        
        for (const bookingId of affectedBookingIds) {
          const { data: remainingArticles } = await supabase
            .from('booking_articles')
            .select('id')
            .eq('booking_id', bookingId)
            .not('ogpl_id', 'is', null);
          
          if (!remainingArticles || remainingArticles.length === 0) {
            await supabase
              .from('bookings')
              .update({ status: 'booked', updated_at: new Date().toISOString() })
              .eq('id', bookingId);
          }
        }
      }
      
    } else if (booking_ids && booking_ids.length > 0) {
      // Booking-level unloading (unload all articles in these bookings)
      const { data: articles, error: unloadError } = await supabase
        .from('booking_articles')
        .update({
          status: 'booked',
          ogpl_id: null,
          loaded_at: null,
          loaded_by: null,
          updated_at: new Date().toISOString()
        })
        .in('booking_id', booking_ids)
        .eq('ogpl_id', ogpl_id)
        .select();
      
      if (unloadError) throw unloadError;
      unloadedCount = articles?.length || 0;
      
      // Update booking statuses
      await supabase
        .from('bookings')
        .update({
          status: 'booked',
          updated_at: new Date().toISOString()
        })
        .in('id', booking_ids);
    }
    
    res.sendSuccess({
      unloaded_articles: unloadedCount,
      ogpl_number: ogpl.ogpl_number
    }, `Successfully unloaded ${unloadedCount} articles from OGPL`);
    
  } catch (error: any) {
    console.error('Unloading error:', error);
    return res.sendError('Failed to unload articles from OGPL', 500);
  }
}));

// GET OGPL loading summary and capacity analysis
router.get('/ogpls/:id/summary', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const { orgId } = req;
  
  const { data: ogpl, error } = await supabase
    .from('ogpl')
    .select(`
      *,
      vehicle:vehicles(*),
      from_station:branches!from_station(*),
      to_station:branches!to_station(*),
      booking_articles (
        id,
        booking_id,
        article_id,
        quantity,
        actual_weight,
        charged_weight,
        freight_amount,
        total_amount,
        status,
        loaded_at,
        loaded_by,
        booking:bookings!inner (
          id,
          lr_number,
          sender:customers!sender_id(name, mobile),
          receiver:customers!receiver_id(name, mobile)
        ),
        article:articles(name, description, hsn_code)
      )
    `)
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return res.sendError('OGPL not found', 404);
    }
    return res.sendDatabaseError(error, 'Fetch OGPL summary');
  }
  
  // Calculate comprehensive statistics
  const articles = ogpl.booking_articles || [];
  const totalWeight = articles.reduce((sum: number, article: any) => 
    sum + (article.charged_weight || article.actual_weight || 0), 0
  );
  const totalValue = articles.reduce((sum: number, article: any) => 
    sum + (article.total_amount || 0), 0
  );
  const loadedArticles = articles.filter((a: any) => a.status === 'loaded');
  const bookingGroups = articles.reduce((groups: any, article: any) => {
    const bookingId = article.booking_id;
    if (!groups[bookingId]) {
      groups[bookingId] = {
        booking: article.booking,
        articles: []
      };
    }
    groups[bookingId].articles.push(article);
    return groups;
  }, {});
  
  // Vehicle capacity analysis
  let capacityAnalysis = null;
  if (ogpl.vehicle && totalWeight > 0) {
    const capacityValidation = await validateVehicleCapacity(ogpl.vehicle.id, totalWeight);
    capacityAnalysis = {
      validation: capacityValidation,
      utilization_percent: capacityValidation.details?.capacity_utilization || 0,
      weight_capacity_kg: capacityValidation.details?.weight_capacity_kg,
      is_overweight: !capacityValidation.valid
    };
  }
  
  const summary = {
    ogpl,
    statistics: {
      total_bookings: Object.keys(bookingGroups).length,
      total_articles: articles.length,
      loaded_articles: loadedArticles.length,
      loading_progress: articles.length > 0 ? (loadedArticles.length / articles.length) * 100 : 0,
      total_weight_kg: totalWeight,
      total_value_inr: totalValue
    },
    capacity_analysis: capacityAnalysis,
    booking_groups: Object.values(bookingGroups)
  };
  
  res.sendSuccess(summary, 'OGPL summary retrieved successfully');
}));

export default router;