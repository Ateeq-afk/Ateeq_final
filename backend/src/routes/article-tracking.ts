import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

// Get current location of articles
router.get('/current-locations', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    const { booking_id, lr_number, status, warehouse_id } = req.query;

    let query = supabase
      .from('article_current_locations')
      .select('*');

    // Filter by organization through branch
    if (role !== 'superadmin') {
      query = query.in('to_branch', 
        supabase
          .from('branches')
          .select('id')
          .eq('organization_id', orgId)
      );
    }

    // Apply filters
    if (booking_id) {
      query = query.eq('booking_id', booking_id);
    }
    if (lr_number) {
      query = query.eq('lr_number', lr_number);
    }
    if (status) {
      query = query.eq('tracking_status', status);
    }
    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get article tracking history
router.get('/history/:booking_id', requireOrgBranch, async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { orgId } = req as any;

    // First verify the booking belongs to the organization
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        branches!to_branch!inner(
          organization_id
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !bookingData) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check organization access
    if (bookingData.branches.organization_id !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get scan history
    const { data: history, error: historyError } = await supabase
      .from('article_scan_history')
      .select(`
        *,
        scanned_by_user:users!scanned_by(
          id,
          full_name,
          email
        ),
        warehouse:warehouses(
          id,
          name
        ),
        location:warehouse_locations(
          id,
          name,
          location_code
        )
      `)
      .eq('booking_id', booking_id)
      .order('scan_time', { ascending: false });

    if (historyError) {
      return res.status(500).json({ error: historyError.message });
    }

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Scan article (update location)
router.post('/scan', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, userId } = req as any;
    const {
      booking_id,
      scan_type,
      warehouse_location_id,
      notes,
      condition_at_scan,
      gps_coordinates
    } = req.body;

    // Validate required fields
    if (!booking_id || !scan_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: booking_id and scan_type' 
      });
    }

    // Get current tracking record
    const { data: trackingData, error: trackingError } = await supabase
      .from('article_tracking')
      .select(`
        *,
        booking:bookings!inner(
          id,
          to_branch,
          branches!to_branch!inner(
            organization_id
          )
        )
      `)
      .eq('booking_id', booking_id)
      .eq('status', 'active')
      .single();

    if (trackingError || !trackingData) {
      return res.status(404).json({ error: 'Active tracking record not found' });
    }

    // Verify organization access
    if (trackingData.booking.branches.organization_id !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get warehouse and location details if provided
    let warehouseId = trackingData.warehouse_id;
    if (warehouse_location_id) {
      const { data: locationData, error: locationError } = await supabase
        .from('warehouse_locations')
        .select('warehouse_id')
        .eq('id', warehouse_location_id)
        .single();

      if (locationError || !locationData) {
        return res.status(400).json({ error: 'Invalid warehouse location' });
      }
      warehouseId = locationData.warehouse_id;
    }

    // Create scan history record
    const { data: scanRecord, error: scanError } = await supabase
      .from('article_scan_history')
      .insert({
        article_tracking_id: trackingData.id,
        booking_id,
        scan_type,
        scan_location_type: 'warehouse',
        warehouse_id: warehouseId,
        warehouse_location_id,
        scanned_by: userId,
        notes,
        condition_at_scan,
        gps_coordinates
      })
      .select()
      .single();

    if (scanError) {
      return res.status(500).json({ error: scanError.message });
    }

    // Update tracking record based on scan type
    const trackingUpdate: any = {
      last_scan_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: userId
    };

    if (scan_type === 'transfer' && warehouse_location_id) {
      trackingUpdate.warehouse_location_id = warehouse_location_id;
    } else if (scan_type === 'check_out') {
      trackingUpdate.current_location_type = 'vehicle';
      trackingUpdate.warehouse_id = null;
      trackingUpdate.warehouse_location_id = null;
    } else if (scan_type === 'delivery') {
      trackingUpdate.current_location_type = 'delivered';
      trackingUpdate.status = 'completed';
      trackingUpdate.actual_delivery_time = new Date().toISOString();
    }

    const { data: updatedTracking, error: updateError } = await supabase
      .from('article_tracking')
      .update(trackingUpdate)
      .eq('id', trackingData.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // If this was a transfer, update inventory record
    if (scan_type === 'transfer' && warehouse_location_id) {
      const { error: inventoryError } = await supabase
        .from('inventory_movements')
        .insert({
          movement_type: 'transfer',
          movement_reason: 'transfer',
          inventory_record_id: trackingData.id,
          from_location_id: trackingData.warehouse_location_id,
          to_location_id: warehouse_location_id,
          quantity_moved: 1,
          quantity_before: 1,
          quantity_after: 1,
          requested_by: userId,
          created_by: userId
        });

      if (inventoryError) {
        console.error('Error creating inventory movement:', inventoryError);
      }
    }

    res.json({ 
      success: true, 
      data: {
        scan: scanRecord,
        tracking: updatedTracking
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get articles in a specific warehouse
router.get('/warehouse/:warehouse_id', requireOrgBranch, async (req, res) => {
  try {
    const { warehouse_id } = req.params;
    const { orgId } = req as any;
    const { location_id, status } = req.query;

    // Verify warehouse belongs to organization
    const { data: warehouseData, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, organization_id')
      .eq('id', warehouse_id)
      .eq('organization_id', orgId)
      .single();

    if (warehouseError || !warehouseData) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Get articles in warehouse
    let query = supabase
      .from('article_tracking')
      .select(`
        *,
        booking:bookings!inner(
          *,
          article:articles(*),
          customer:customers!receiver_id(
            name,
            phone
          )
        ),
        warehouse_location:warehouse_locations(
          id,
          name,
          location_code
        )
      `)
      .eq('warehouse_id', warehouse_id)
      .eq('current_location_type', 'warehouse')
      .eq('status', 'active');

    if (location_id) {
      query = query.eq('warehouse_location_id', location_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Group by location for better organization
    const articlesByLocation = data?.reduce((acc: any, item: any) => {
      const locationKey = item.warehouse_location?.location_code || 'UNASSIGNED';
      if (!acc[locationKey]) {
        acc[locationKey] = {
          location: item.warehouse_location || { location_code: 'UNASSIGNED', name: 'Unassigned' },
          articles: []
        };
      }
      acc[locationKey].articles.push(item);
      return acc;
    }, {});

    res.json({ 
      success: true, 
      data: {
        warehouse_id,
        total_articles: data?.length || 0,
        articles_by_location: articlesByLocation
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search for article by barcode/QR code
router.get('/search/:code', requireOrgBranch, async (req, res) => {
  try {
    const { code } = req.params;
    const { orgId } = req as any;

    const { data, error } = await supabase
      .from('article_tracking')
      .select(`
        *,
        booking:bookings!inner(
          *,
          article:articles(*),
          branches!to_branch!inner(
            organization_id
          ),
          customer:customers!receiver_id(*)
        ),
        warehouse:warehouses(*),
        warehouse_location:warehouse_locations(*)
      `)
      .eq('barcode', code)
      .eq('booking.branches.organization_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Article not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;