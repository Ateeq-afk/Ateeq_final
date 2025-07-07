import express from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';
import { validateBranchAccess } from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// =============================================
// Enhanced Article Tracking Routes
// =============================================

// Get current locations of articles with enhanced data
router.get('/current-locations', async (req, res) => {
  try {
    const { booking_id, lr_number, status, warehouse_id, location_id, barcode } = req.query;
    const userBranches = req.user.branches || [];

    let query = supabase
      .from('article_tracking_enhanced')
      .select(`
        *,
        booking:bookings(
          id,
          lr_number,
          quantity,
          weight,
          status,
          from_branch:branches!bookings_from_branch_id_fkey(name),
          to_branch:branches!bookings_to_branch_id_fkey(name),
          customer:customers(name, phone),
          article:booking_articles(name, description)
        ),
        warehouse:warehouses(id, name),
        warehouse_location:warehouse_locations(id, name, location_code),
        vehicle:vehicles(registration_number)
      `)
      .in('branch_id', userBranches);

    // Apply filters
    if (booking_id) query = query.eq('booking_id', booking_id);
    if (status) query = query.eq('status', status);
    if (warehouse_id) query = query.eq('warehouse_id', warehouse_id);
    if (location_id) query = query.eq('warehouse_location_id', location_id);
    if (barcode) query = query.ilike('barcode', `%${barcode}%`);
    if (lr_number) {
      // Need to join with bookings to filter by LR number
      query = query.eq('booking.lr_number', lr_number);
    }

    const { data, error } = await query.order('last_scan_time', { ascending: false });

    if (error) throw error;

    // Transform data to match frontend interface
    const transformedData = data.map(item => ({
      id: item.id,
      booking_id: item.booking_id,
      article_id: item.article_id,
      lr_number: item.booking.lr_number,
      article_name: item.booking.article?.name || 'Unknown Article',
      article_description: item.booking.article?.description || '',
      quantity: item.booking.quantity,
      weight: item.booking.weight,
      current_location_type: item.current_location_type,
      warehouse_name: item.warehouse?.name,
      location_name: item.warehouse_location?.name,
      location_code: item.warehouse_location?.location_code,
      last_scan_time: item.last_scan_time,
      tracking_status: item.status,
      barcode: item.barcode,
      booking_status: item.booking.status,
      customer_name: item.booking.customer?.name || 'Unknown Customer',
      customer_phone: item.booking.customer?.phone || '',
      current_latitude: item.current_latitude,
      current_longitude: item.current_longitude,
      gps_accuracy: item.gps_accuracy,
      last_gps_update: item.last_gps_update
    }));

    res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Error fetching current locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current locations'
    });
  }
});

// Search article by barcode/QR code
router.get('/search/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const userBranches = req.user.branches || [];

    const { data, error } = await supabase
      .from('article_tracking_enhanced')
      .select(`
        *,
        booking:bookings(
          id,
          lr_number,
          quantity,
          weight,
          status,
          customer:customers(name, phone),
          article:booking_articles(name, description)
        ),
        warehouse:warehouses(name),
        warehouse_location:warehouse_locations(name, location_code)
      `)
      .or(`barcode.eq.${code},qr_code.eq.${code}`)
      .in('branch_id', userBranches)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Article not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        booking_id: data.booking_id,
        article_id: data.article_id,
        current_location_type: data.current_location_type,
        warehouse_id: data.warehouse_id,
        warehouse_location_id: data.warehouse_location_id,
        status: data.status,
        last_scan_time: data.last_scan_time,
        barcode: data.barcode,
        booking: data.booking,
        warehouse: data.warehouse,
        warehouse_location: data.warehouse_location
      }
    });
  } catch (error) {
    console.error('Error searching article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search article'
    });
  }
});

// Scan article (update location and create history)
router.post('/scan', async (req, res) => {
  try {
    const {
      booking_id,
      scan_type,
      warehouse_location_id,
      notes,
      condition_at_scan = 'good',
      gps_coordinates,
      barcode_scanned
    } = req.body;

    const userBranches = req.user.branches || [];
    const userId = req.user.id;

    // Start transaction
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('branch_id, organization_id')
      .eq('id', booking_id)
      .in('branch_id', userBranches)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or access denied'
      });
    }

    // Get or create article tracking record
    let { data: tracking, error: trackingError } = await supabase
      .from('article_tracking_enhanced')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('branch_id', booking.branch_id)
      .single();

    if (trackingError && trackingError.code !== 'PGRST116') {
      throw trackingError;
    }

    if (!tracking) {
      // Create new tracking record
      const { data: newTracking, error: createError } = await supabase
        .from('article_tracking_enhanced')
        .insert({
          booking_id,
          barcode: barcode_scanned,
          current_location_type: warehouse_location_id ? 'warehouse' : 'vehicle',
          warehouse_location_id,
          status: scan_type === 'check_in' ? 'in_warehouse' : 
                  scan_type === 'check_out' ? 'out_for_delivery' :
                  scan_type === 'delivery' ? 'delivered' : 'in_transit',
          last_scan_time: new Date(),
          last_scan_user_id: userId,
          current_latitude: gps_coordinates?.lat,
          current_longitude: gps_coordinates?.lng,
          last_gps_update: gps_coordinates ? new Date() : null,
          branch_id: booking.branch_id,
          organization_id: booking.organization_id,
          created_by: userId
        })
        .select()
        .single();

      if (createError) throw createError;
      tracking = newTracking;
    } else {
      // Update existing tracking record
      const updateData: any = {
        last_scan_time: new Date(),
        last_scan_user_id: userId,
        updated_at: new Date()
      };

      if (warehouse_location_id) {
        updateData.warehouse_location_id = warehouse_location_id;
        updateData.current_location_type = 'warehouse';
      }

      if (scan_type === 'check_in') updateData.status = 'in_warehouse';
      else if (scan_type === 'check_out') updateData.status = 'out_for_delivery';
      else if (scan_type === 'delivery') updateData.status = 'delivered';
      else if (scan_type === 'return') updateData.status = 'returned';

      if (gps_coordinates) {
        updateData.current_latitude = gps_coordinates.lat;
        updateData.current_longitude = gps_coordinates.lng;
        updateData.last_gps_update = new Date();
      }

      const { error: updateError } = await supabase
        .from('article_tracking_enhanced')
        .update(updateData)
        .eq('id', tracking.id);

      if (updateError) throw updateError;
    }

    // Create scan history record
    const { error: historyError } = await supabase
      .from('article_scan_history')
      .insert({
        booking_id,
        article_tracking_id: tracking.id,
        scan_type,
        scan_location_type: warehouse_location_id ? 'warehouse' : 'vehicle',
        barcode_scanned,
        warehouse_location_id,
        scan_latitude: gps_coordinates?.lat,
        scan_longitude: gps_coordinates?.lng,
        gps_accuracy: gps_coordinates?.accuracy,
        scanned_by_user_id: userId,
        notes,
        condition_at_scan,
        scan_session_id: req.headers['x-scan-session-id'] || null,
        device_info: {
          userAgent: req.headers['user-agent'],
          ip: req.ip
        },
        branch_id: booking.branch_id,
        organization_id: booking.organization_id
      });

    if (historyError) throw historyError;

    res.json({
      success: true,
      data: {
        tracking_id: tracking.id,
        scan_time: new Date(),
        status: tracking.status
      }
    });
  } catch (error) {
    console.error('Error processing scan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process scan'
    });
  }
});

// Get article scan history
router.get('/history/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userBranches = req.user.branches || [];

    const { data, error } = await supabase
      .from('article_scan_history')
      .select(`
        *,
        scanned_by_user:users!article_scan_history_scanned_by_user_id_fkey(
          id, full_name, email
        ),
        warehouse:warehouses(id, name),
        warehouse_location:warehouse_locations(id, name, location_code)
      `)
      .eq('booking_id', bookingId)
      .in('branch_id', userBranches)
      .order('scan_time', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(item => ({
        id: item.id,
        scan_type: item.scan_type,
        scan_location_type: item.scan_location_type,
        scan_time: item.scan_time,
        scanned_by_user: item.scanned_by_user,
        warehouse: item.warehouse,
        location: item.warehouse_location,
        notes: item.notes,
        condition_at_scan: item.condition_at_scan,
        scan_latitude: item.scan_latitude,
        scan_longitude: item.scan_longitude
      }))
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan history'
    });
  }
});

// =============================================
// GPS Tracking Routes
// =============================================

// Start GPS tracking session
router.post('/gps/start-session', async (req, res) => {
  try {
    const {
      session_id,
      vehicle_id,
      driver_id,
      session_type = 'delivery',
      purpose,
      initial_location
    } = req.body;

    const userId = req.user.id;
    const userBranches = req.user.branches || [];
    const branchId = userBranches[0]; // Use first branch for now

    // Get organization from branch
    const { data: branch } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', branchId)
      .single();

    const { data, error } = await supabase
      .from('gps_tracking_sessions')
      .insert({
        session_id,
        vehicle_id,
        driver_id,
        user_id: userId,
        session_type,
        purpose,
        branch_id: branchId,
        organization_id: branch.organization_id
      })
      .select()
      .single();

    if (error) throw error;

    // Add initial GPS point if provided
    if (initial_location) {
      await supabase
        .from('gps_location_points')
        .insert({
          tracking_session_id: data.id,
          latitude: initial_location.lat,
          longitude: initial_location.lng,
          accuracy: initial_location.accuracy,
          device_timestamp: new Date(),
          branch_id: branchId,
          organization_id: branch.organization_id
        });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error starting GPS session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start GPS tracking session'
    });
  }
});

// Add GPS location point
router.post('/gps/location', async (req, res) => {
  try {
    const {
      session_id,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed_kmh,
      heading,
      device_timestamp,
      battery_level,
      signal_strength
    } = req.body;

    const userBranches = req.user.branches || [];

    // Get session and verify access
    const { data: session, error: sessionError } = await supabase
      .from('gps_tracking_sessions')
      .select('id, branch_id, organization_id')
      .eq('session_id', session_id)
      .in('branch_id', userBranches)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    const { data, error } = await supabase
      .from('gps_location_points')
      .insert({
        tracking_session_id: session.id,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed_kmh,
        heading,
        device_timestamp: device_timestamp ? new Date(device_timestamp) : new Date(),
        device_info: {
          userAgent: req.headers['user-agent'],
          ip: req.ip
        },
        battery_level,
        signal_strength,
        branch_id: session.branch_id,
        organization_id: session.organization_id
      })
      .select()
      .single();

    if (error) throw error;

    // Update session with latest location
    await supabase
      .from('gps_tracking_sessions')
      .update({
        updated_at: new Date()
      })
      .eq('id', session.id);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error adding GPS location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add GPS location'
    });
  }
});

// End GPS tracking session
router.post('/gps/end-session', async (req, res) => {
  try {
    const { session_id } = req.body;
    const userBranches = req.user.branches || [];

    // Get session stats
    const { data: locationStats } = await supabase
      .rpc('calculate_session_stats', { p_session_id: session_id });

    const { data, error } = await supabase
      .from('gps_tracking_sessions')
      .update({
        end_time: new Date(),
        is_active: false,
        total_distance_km: locationStats?.total_distance || 0,
        total_duration_minutes: locationStats?.duration_minutes || 0,
        waypoints_count: locationStats?.waypoint_count || 0
      })
      .eq('session_id', session_id)
      .in('branch_id', userBranches)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error ending GPS session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end GPS tracking session'
    });
  }
});

// =============================================
// Bulk Operations Routes
// =============================================

// Create bulk operation
router.post('/bulk-operation', async (req, res) => {
  try {
    const {
      operation_type,
      operation_name,
      description,
      operation_data,
      input_data
    } = req.body;

    const userId = req.user.id;
    const userBranches = req.user.branches || [];
    const branchId = userBranches[0];

    const { data: branch } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', branchId)
      .single();

    const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('bulk_operations')
      .insert({
        operation_id: operationId,
        operation_type,
        operation_name,
        description,
        operation_data,
        input_data,
        total_items: Array.isArray(input_data.barcodes) ? input_data.barcodes.length : 0,
        created_by: userId,
        branch_id: branchId,
        organization_id: branch.organization_id
      })
      .select()
      .single();

    if (error) throw error;

    // Create bulk operation items if barcodes provided
    if (input_data.barcodes && Array.isArray(input_data.barcodes)) {
      const items = input_data.barcodes.map((barcode: string, index: number) => ({
        bulk_operation_id: data.id,
        item_sequence: index + 1,
        barcode,
        branch_id: branchId,
        organization_id: branch.organization_id
      }));

      await supabase
        .from('bulk_operation_items')
        .insert(items);
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error creating bulk operation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk operation'
    });
  }
});

// Get bulk operations
router.get('/bulk-operations', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const userBranches = req.user.branches || [];

    let query = supabase
      .from('bulk_operations')
      .select(`
        *,
        created_by_user:users!bulk_operations_created_by_fkey(full_name, email),
        executed_by_user:users!bulk_operations_executed_by_fkey(full_name, email)
      `)
      .in('branch_id', userBranches)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching bulk operations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bulk operations'
    });
  }
});

// =============================================
// Analytics Routes
// =============================================

// Get movement analytics
router.get('/analytics/movements', async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      warehouse_id,
      period = 'daily'
    } = req.query;

    const userBranches = req.user.branches || [];

    let query = supabase
      .from('article_movement_analytics')
      .select('*')
      .in('branch_id', userBranches)
      .eq('analysis_period', period);

    if (start_date) query = query.gte('analysis_date', start_date);
    if (end_date) query = query.lte('analysis_date', end_date);
    if (warehouse_id) query = query.eq('warehouse_id', warehouse_id);

    const { data, error } = await query.order('analysis_date', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching movement analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movement analytics'
    });
  }
});

// Calculate and update analytics
router.post('/analytics/calculate', async (req, res) => {
  try {
    const { analysis_date = new Date().toISOString().split('T')[0] } = req.body;
    const userBranches = req.user.branches || [];

    // Call the analytics calculation function for each user branch
    for (const branchId of userBranches) {
      const { error } = await supabase
        .rpc('calculate_daily_movement_analytics', {
          p_analysis_date: analysis_date,
          p_branch_id: branchId
        });

      if (error) {
        console.error(`Error calculating analytics for branch ${branchId}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Analytics calculation initiated'
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate analytics'
    });
  }
});

export default router;