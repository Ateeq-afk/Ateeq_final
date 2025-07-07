import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { asyncHandler } from '../utils/apiResponse';
import { validateVehicleCapacity } from '../utils/businessValidations';
import { responseMiddleware } from '../utils/apiResponse';

const router = Router();

// Apply response middleware
router.use(responseMiddleware);

// Schema for OGPL operations
const ogplSchema = z.object({
  vehicle_id: z.string().uuid(),
  from_station: z.string().uuid(),
  to_station: z.string().uuid(),
  transit_date: z.string(),
  primary_driver_name: z.string().min(1),
  primary_driver_mobile: z.string().min(10),
  secondary_driver_name: z.string().optional(),
  secondary_driver_mobile: z.string().optional(),
  remarks: z.string().optional(),
  seal_number: z.string().optional(),
  optimization_strategy: z.enum(['manual', 'route', 'weight', 'value', 'capacity', 'ai']).optional()
});

const loadingSessionSchema = z.object({
  ogpl_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  from_branch_id: z.string().uuid(),
  to_branch_id: z.string().uuid(),
  booking_ids: z.array(z.string().uuid()),
  notes: z.string().optional()
});

// GET all OGPLs for a branch
router.get('/ogpls', requireOrgBranch, async (req, res) => {
  const { orgId, branchId, role } = req as any;
  const { status } = req.query;
  
  let query = supabase
    .from('ogpl')
    .select(`
      *,
      vehicle:vehicles(*),
      from_station:branches!from_station(*),
      to_station:branches!to_station(*),
      loading_records(
        id,
        booking_id,
        loaded_at,
        loaded_by,
        booking:bookings(
          *,
          sender:customers!sender_id(*),
          receiver:customers!receiver_id(*),
          article:articles(*)
        )
      )
    `)
    .eq('from_station', branchId);
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    return res.sendDatabaseError(error, 'Fetch OGPLs');
  }
  
  res.sendSuccess(data);
});

// GET single OGPL
router.get('/ogpls/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const { data, error } = await supabase
    .from('ogpl')
    .select(`
      *,
      vehicle:vehicles(*),
      from_station:branches!from_station(*),
      to_station:branches!to_station(*),
      loading_records(
        id,
        booking_id,
        loaded_at,
        loaded_by,
        booking:bookings(
          *,
          sender:customers!sender_id(*),
          receiver:customers!receiver_id(*),
          article:articles(*)
        )
      )
    `)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return res.sendNotFound('OGPL');
    }
    return res.sendDatabaseError(error, 'Fetch OGPL');
  }
  
  res.sendSuccess(data);
});

// CREATE new OGPL
router.post('/ogpls', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = ogplSchema.safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  const { orgId, branchId, userId, role } = req;
  
  // Verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', parse.data.vehicle_id)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Verify from and to stations belong to organization
  const { data: fromStation } = await supabase
    .from('branches')
    .select('id')
    .eq('id', parse.data.from_station)
    .eq('organization_id', orgId)
    .single();
    
  if (!fromStation) {
    return res.sendNotFound('From station');
  }
  
  const { data: toStation } = await supabase
    .from('branches')
    .select('id')
    .eq('id', parse.data.to_station)
    .eq('organization_id', orgId)
    .single();
    
  if (!toStation) {
    return res.sendNotFound('To station');
  }
  
  // Non-admins can only create OGPLs from their branch
  if (role !== 'admin' && role !== 'superadmin' && parse.data.from_station !== branchId) {
    return res.sendForbidden('Can only create OGPLs from your branch');
  }
  
  // Generate OGPL number
  const ogplNumber = `OGPL-${Date.now().toString().slice(-8)}`;
  
  const { data, error } = await supabase
    .from('ogpl')
    .insert({
      ogpl_number: ogplNumber,
      ...parse.data,
      organization_id: orgId,
      created_by: userId,
      status: 'created'
    })
    .select()
    .single();
    
  if (error) {
    return res.sendDatabaseError(error, 'Create OGPL');
  }
  
  res.sendSuccess(data, 'OGPL created successfully');
}));

// UPDATE OGPL
router.put('/ogpls/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId } = req as any;
  
  const parse = ogplSchema.partial().safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  // Don't allow status updates through this endpoint
  const updateData = { ...parse.data };
  delete (updateData as any).status;
  delete (updateData as any).ogpl_number;
  
  const { data, error } = await supabase
    .from('ogpl')
    .update(updateData)
    .eq('id', id)
    .eq('from_station', branchId)
    .select()
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return res.sendNotFound('OGPL');
    }
    return res.sendDatabaseError(error, 'Update OGPL');
  }
  
  res.sendSuccess(data);
});

// UPDATE OGPL status
router.patch('/ogpls/:id/status', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { branchId } = req as any;
  
  if (!['created', 'in_transit', 'completed', 'cancelled'].includes(status)) {
    return res.sendError('Invalid status', 400);
  }
  
  const { data, error } = await supabase
    .from('ogpl')
    .update({ status })
    .eq('id', id)
    .eq('from_station', branchId)
    .select()
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return res.sendNotFound('OGPL');
    }
    return res.sendDatabaseError(error, 'Update OGPL status');
  }
  
  res.sendSuccess(data);
});

// ADD bookings to OGPL
router.post('/ogpls/:id/bookings', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { booking_ids } = req.body;
  const { branchId, userId } = req as any;
  
  if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
    return res.sendError('booking_ids must be a non-empty array', 400);
  }
  
  // Verify OGPL exists and is not completed
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('status')
    .eq('id', id)
    .eq('from_station', branchId)
    .single();
    
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.status(404).json({ error: 'OGPL not found' });
    }
    return res.status(500).json({ error: ogplError.message });
  }
  
  if (ogpl.status === 'completed' || ogpl.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot add bookings to completed or cancelled OGPL' });
  }
  
  // Create loading records
  const loadingRecords = booking_ids.map((booking_id: string) => ({
    ogpl_id: id,
    booking_id,
    loaded_by: userId || 'system'
  }));
  
  const { data, error } = await supabase
    .from('loading_records')
    .insert(loadingRecords)
    .select();
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  // Update booking statuses through the proper API with workflow context
  let hasBookingError = false;
  for (const bookingId of booking_ids) {
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        status: 'in_transit',
        loaded_at: new Date().toISOString(),
        loaded_by: userId || 'system',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
      
    if (bookingError) {
      console.error(`Failed to update booking ${bookingId}:`, bookingError);
      hasBookingError = true;
      break;
    }
  }
    
  if (hasBookingError) {
    // Rollback loading records
    await supabase
      .from('loading_records')
      .delete()
      .in('id', data.map((r: any) => r.id));
      
    return res.status(500).json({ error: 'Failed to update booking statuses' });
  }
  
  res.status(201).json(data);
});

// REMOVE bookings from OGPL
router.delete('/ogpls/:id/bookings', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { booking_ids } = req.body;
  const { branchId } = req as any;
  
  if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
    return res.sendError('booking_ids must be a non-empty array', 400);
  }
  
  // Verify OGPL exists and is not completed
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('status')
    .eq('id', id)
    .eq('from_station', branchId)
    .single();
    
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.status(404).json({ error: 'OGPL not found' });
    }
    return res.status(500).json({ error: ogplError.message });
  }
  
  if (ogpl.status === 'completed' || ogpl.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot remove bookings from completed or cancelled OGPL' });
  }
  
  // Delete loading records
  const { error } = await supabase
    .from('loading_records')
    .delete()
    .eq('ogpl_id', id)
    .in('booking_id', booking_ids);
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  // Update booking statuses back to 'booked'
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ 
      status: 'booked',
      loaded_at: null,
      loaded_by: null,
      updated_at: new Date().toISOString()
    })
    .in('id', booking_ids);
    
  if (bookingError) {
    return res.status(500).json({ error: bookingError.message });
  }
  
  res.status(204).send();
});

// GET loading sessions
router.get('/loading-sessions', requireOrgBranch, async (req, res) => {
  const { branchId } = req as any;
  
  const { data, error } = await supabase
    .from('loading_sessions')
    .select(`
      *,
      ogpl:ogpl(
        *,
        loading_records(
          id,
          booking_id,
          loaded_at,
          loaded_by,
          booking:bookings(
            *,
            sender:customers!sender_id(*),
            receiver:customers!receiver_id(*),
            article:articles(*)
          )
        )
      ),
      vehicle:vehicles(*),
      from_branch:branches!from_branch_id(*),
      to_branch:branches!to_branch_id(*)
    `)
    .eq('from_branch_id', branchId)
    .order('created_at', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json(data);
});

// CREATE loading session
router.post('/loading-sessions', requireOrgBranch, async (req, res) => {
  const parse = loadingSessionSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  const { userId } = req as any;
  const { booking_ids, ...sessionData } = parse.data;
  
  // Create loading session
  const { data: session, error: sessionError } = await supabase
    .from('loading_sessions')
    .insert({
      ...sessionData,
      loaded_by: userId || 'system',
      total_items: booking_ids.length
    })
    .select()
    .single();
    
  if (sessionError) {
    return res.status(500).json({ error: sessionError.message });
  }
  
  // Create loading records
  const loadingRecords = booking_ids.map(booking_id => ({
    ogpl_id: parse.data.ogpl_id,
    booking_id,
    loaded_by: userId || 'system'
  }));
  
  const { error: recordsError } = await supabase
    .from('loading_records')
    .insert(loadingRecords);
    
  if (recordsError) {
    // Rollback session
    await supabase
      .from('loading_sessions')
      .delete()
      .eq('id', session.id);
      
    return res.status(500).json({ error: recordsError.message });
  }
  
  // Update booking statuses
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ 
      status: 'in_transit',
      loaded_at: new Date().toISOString(),
      loaded_by: userId || 'system',
      loading_session_id: session.id,
      updated_at: new Date().toISOString()
    })
    .in('id', booking_ids);
    
  if (bookingError) {
    // Rollback everything
    await supabase
      .from('loading_records')
      .delete()
      .eq('ogpl_id', parse.data.ogpl_id)
      .in('booking_id', booking_ids);
      
    await supabase
      .from('loading_sessions')
      .delete()
      .eq('id', session.id);
      
    return res.status(500).json({ error: bookingError.message });
  }
  
  // Update OGPL status
  await supabase
    .from('ogpl')
    .update({ status: 'in_transit' })
    .eq('id', parse.data.ogpl_id);
  
  res.status(201).json(session);
});

// GET loading checklist for OGPL
router.get('/ogpls/:id/checklist', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { branchId } = req as any;
  
  // Verify OGPL exists and belongs to branch
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('id')
    .eq('id', id)
    .eq('from_station', branchId)
    .single();
    
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.status(404).json({ error: 'OGPL not found' });
    }
    return res.status(500).json({ error: ogplError.message });
  }
  
  const { data, error } = await supabase
    .from('loading_checklist')
    .select('*')
    .eq('ogpl_id', id)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }
  
  res.json(data || {
    ogpl_id: id,
    vehicle_inspected: false,
    documents_verified: false,
    goods_secured: false,
    seal_applied: false,
    photos_captured: false,
    driver_briefed: false
  });
});

// UPDATE loading checklist for OGPL
router.put('/ogpls/:id/checklist', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { branchId, userId } = req as any;
  
  const checklistSchema = z.object({
    vehicle_inspected: z.boolean().optional(),
    documents_verified: z.boolean().optional(),
    goods_secured: z.boolean().optional(),
    seal_applied: z.boolean().optional(),
    photos_captured: z.boolean().optional(),
    driver_briefed: z.boolean().optional()
  });
  
  const parse = checklistSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  // Verify OGPL exists and belongs to branch
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('id')
    .eq('id', id)
    .eq('from_station', branchId)
    .single();
    
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.status(404).json({ error: 'OGPL not found' });
    }
    return res.status(500).json({ error: ogplError.message });
  }
  
  // Upsert checklist
  const { data, error } = await supabase
    .from('loading_checklist')
    .upsert({
      ogpl_id: id,
      ...parse.data,
      completed_by: userId,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json(data);
});

// GET loading photos for OGPL
router.get('/ogpls/:id/photos', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { branchId } = req as any;
  
  // Verify OGPL exists and belongs to branch
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('id')
    .eq('id', id)
    .eq('from_station', branchId)
    .single();
    
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.status(404).json({ error: 'OGPL not found' });
    }
    return res.status(500).json({ error: ogplError.message });
  }
  
  const { data, error } = await supabase
    .from('loading_photos')
    .select('*')
    .eq('ogpl_id', id)
    .order('uploaded_at', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json(data);
});

// POST loading photo for OGPL
router.post('/ogpls/:id/photos', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { branchId, userId } = req as any;
  const { photo_url, photo_type, caption } = req.body;
  
  if (!photo_url) {
    return res.status(400).json({ error: 'photo_url is required' });
  }
  
  // Verify OGPL exists and belongs to branch
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('id')
    .eq('id', id)
    .eq('from_station', branchId)
    .single();
    
  if (ogplError) {
    if (ogplError.code === 'PGRST116') {
      return res.status(404).json({ error: 'OGPL not found' });
    }
    return res.status(500).json({ error: ogplError.message });
  }
  
  const { data, error } = await supabase
    .from('loading_photos')
    .insert({
      ogpl_id: id,
      photo_url,
      photo_type: photo_type || 'general',
      caption,
      uploaded_by: userId
    })
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.status(201).json(data);
});

// POST optimization log
router.post('/optimization-logs', requireOrgBranch, async (req, res) => {
  const { userId } = req as any;
  
  const logSchema = z.object({
    ogpl_id: z.string().uuid().optional(),
    optimization_type: z.enum(['manual', 'route', 'weight', 'value', 'capacity', 'ai']),
    total_bookings: z.number().int().min(0),
    total_weight: z.number().min(0),
    total_value: z.number().min(0),
    vehicles_used: z.number().int().min(0),
    avg_utilization: z.number().min(0).max(100),
    avg_efficiency: z.number().min(0).max(100),
    execution_time_ms: z.number().int().min(0)
  });
  
  const parse = logSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  const { data, error } = await supabase
    .from('loading_optimization_logs')
    .insert({
      ...parse.data,
      created_by: userId
    })
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.status(201).json(data);
});

// GET optimization analytics
router.get('/optimization-analytics', requireOrgBranch, async (req, res) => {
  const { days = 30 } = req.query;
  
  // Get optimization logs for the specified period
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - parseInt(days as string));
  
  const { data, error } = await supabase
    .from('loading_optimization_logs')
    .select('*')
    .gte('created_at', sinceDate.toISOString())
    .order('created_at', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  // Calculate analytics
  const analytics = {
    totalOptimizations: data.length,
    optimizationsByType: data.reduce((acc: any, log) => {
      acc[log.optimization_type] = (acc[log.optimization_type] || 0) + 1;
      return acc;
    }, {}),
    avgEfficiency: data.length > 0 
      ? data.reduce((sum, log) => sum + log.avg_efficiency, 0) / data.length 
      : 0,
    avgUtilization: data.length > 0 
      ? data.reduce((sum, log) => sum + log.avg_utilization, 0) / data.length 
      : 0,
    totalBookingsOptimized: data.reduce((sum, log) => sum + log.total_bookings, 0),
    totalWeightOptimized: data.reduce((sum, log) => sum + log.total_weight, 0),
    totalValueOptimized: data.reduce((sum, log) => sum + log.total_value, 0),
    avgExecutionTime: data.length > 0 
      ? data.reduce((sum, log) => sum + log.execution_time_ms, 0) / data.length 
      : 0
  };
  
  res.json(analytics);
});

// UNLOADING Operations

// POST complete unloading for OGPL
router.post('/ogpls/:id/unload', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { unloading_conditions } = req.body; // { booking_id: { status: 'good|damaged|missing', remarks: '', photo: '' } }
  const { branchId, userId } = req as any;
  
  // Verify OGPL exists and belongs to branch (destination branch for unloading)
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select(`
      *,
      loading_records(
        id,
        booking_id,
        booking:bookings(id, status)
      )
    `)
    .eq('id', id)
    .eq('to_station', branchId) // Unloading happens at destination
    .single();
    
  if (ogplError || !ogpl) {
    return res.status(404).json({ error: 'OGPL not found or not accessible for unloading' });
  }
  
  if (ogpl.status !== 'in_transit') {
    return res.status(400).json({ error: 'OGPL must be in transit to unload' });
  }
  
  // Update all bookings to 'unloaded' status with workflow context
  const bookingIds = ogpl.loading_records.map((record: any) => record.booking_id);
  
  for (const bookingId of bookingIds) {
    const condition = unloading_conditions[bookingId] || { status: 'good' };
    
    // Update booking status to unloaded
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        status: 'unloaded',
        unloaded_at: new Date().toISOString(),
        unloaded_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
      
    if (bookingError) {
      console.error(`Failed to update booking ${bookingId}:`, bookingError);
      return res.status(500).json({ error: `Failed to update booking ${bookingId}` });
    }
    
    // Log unloading event
    await supabase
      .from('logistics_events')
      .insert({
        event_type: 'unloading',
        booking_id: bookingId,
        ogpl_id: id,
        branch_id: branchId,
        description: `Unloaded at ${branchId} - Condition: ${condition.status}`,
        metadata: {
          condition: condition.status,
          remarks: condition.remarks,
          photo: condition.photo,
          unloaded_by: userId
        }
      });
  }
  
  // Update OGPL status to completed
  const { error: ogplUpdateError } = await supabase
    .from('ogpl')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: userId
    })
    .eq('id', id);
    
  if (ogplUpdateError) {
    console.error('Failed to update OGPL status:', ogplUpdateError);
    return res.status(500).json({ error: 'Failed to update OGPL status' });
  }
  
  res.json({ 
    success: true, 
    message: 'Unloading completed successfully',
    ogpl_id: id,
    bookings_unloaded: bookingIds.length
  });
});

// POST unload specific bookings (partial unloading)
router.post('/ogpls/:id/unload-bookings', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { booking_ids, unloading_conditions } = req.body;
  const { branchId, userId } = req as any;
  
  if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
    return res.sendError('booking_ids must be a non-empty array', 400);
  }
  
  // Verify OGPL and bookings
  const { data: ogpl, error: ogplError } = await supabase
    .from('ogpl')
    .select('id, status, to_station')
    .eq('id', id)
    .eq('to_station', branchId)
    .single();
    
  if (ogplError || !ogpl) {
    return res.status(404).json({ error: 'OGPL not found' });
  }
  
  if (ogpl.status !== 'in_transit') {
    return res.status(400).json({ error: 'OGPL must be in transit to unload' });
  }
  
  // Update specified bookings to unloaded status
  for (const bookingId of booking_ids) {
    const condition = unloading_conditions[bookingId] || { status: 'good' };
    
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        status: 'unloaded',
        unloaded_at: new Date().toISOString(),
        unloaded_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
      
    if (bookingError) {
      return res.status(500).json({ error: `Failed to update booking ${bookingId}` });
    }
    
    // Log unloading event
    await supabase
      .from('logistics_events')
      .insert({
        event_type: 'unloading',
        booking_id: bookingId,
        ogpl_id: id,
        branch_id: branchId,
        description: `Unloaded at ${branchId} - Condition: ${condition.status}`,
        metadata: {
          condition: condition.status,
          remarks: condition.remarks,
          photo: condition.photo,
          unloaded_by: userId
        }
      });
  }
  
  res.json({ 
    success: true, 
    message: 'Selected bookings unloaded successfully',
    bookings_unloaded: booking_ids.length
  });
});

export default router;