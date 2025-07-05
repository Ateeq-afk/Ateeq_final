import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import { authenticate } from '../middleware/auth';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { validateRequest, commonSchemas } from '../middleware/validation';
import { asyncHandler } from '../utils/apiResponse';
import { podRecordSchema, podAttemptSchema, podTemplateSchema } from '../schemas';

const router = Router();

// Get all POD records for a branch
router.get('/', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    
    let query = supabase
      .from('pod_records')
      .select(`
        *,
        booking:bookings(
          id,
          lr_number,
          sender:customers!sender_id(name, mobile),
          receiver:customers!receiver_id(name, mobile),
          article:articles(name),
          from_branch:branches!from_branch(name, city),
          to_branch:branches!to_branch(name, city)
        )
      `)
      .order('delivered_at', { ascending: false });

    // Apply organization and branch filtering
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    } else if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    // Additional org-level filtering for security
    query = query.eq('organization_id', orgId);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching POD records:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch POD records' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /pod:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get POD record by booking ID
router.get('/booking/:bookingId', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data, error } = await supabase
      .from('pod_records')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching POD record:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch POD record' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /pod/booking/:bookingId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create POD record
router.post('/', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    
    // Validate request body
    const validatedData = podRecordSchema.parse(req.body);
    
    // Check if booking exists and is eligible for POD with organization context
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, pod_status, to_branch, organization_id')
      .eq('id', validatedData.booking_id)
      .eq('organization_id', orgId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    if (booking.pod_status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'POD already completed for this booking' 
      });
    }

    if (!['out_for_delivery', 'delivered'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking must be out for delivery or delivered to create POD' 
      });
    }

    // Create POD record
    const { data: podRecord, error: podError } = await supabase
      .from('pod_records')
      .insert({
        ...validatedData,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (podError) {
      console.error('Error creating POD record:', podError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create POD record' 
      });
    }

    // The trigger will automatically update the booking status

    res.status(201).json({ success: true, data: podRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error in POST /pod:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update POD record
router.put('/:id', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate partial update
    const partialSchema = podRecordSchema.partial();
    const validatedData = partialSchema.parse(req.body);

    const { data, error } = await supabase
      .from('pod_records')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating POD record:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update POD record' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error in PUT /pod/:id:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Record delivery attempt
router.post('/attempts', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const validatedData = podAttemptSchema.parse(req.body);
    
    // Get current attempt count
    const { count, error: countError } = await supabase
      .from('pod_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('booking_id', validatedData.booking_id);

    if (countError) {
      console.error('Error counting attempts:', countError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to count delivery attempts' 
      });
    }

    const attemptNumber = (count || 0) + 1;

    // Create attempt record
    const { data: attempt, error: attemptError } = await supabase
      .from('pod_attempts')
      .insert({
        ...validatedData,
        attempt_number: attemptNumber,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error creating attempt record:', attemptError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to record delivery attempt' 
      });
    }

    // Update booking with attempt count
    await supabase
      .from('bookings')
      .update({
        delivery_attempts: attemptNumber,
        delivery_attempted_at: new Date().toISOString(),
      })
      .eq('id', validatedData.booking_id);

    res.status(201).json({ success: true, data: attempt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error in POST /pod/attempts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get delivery attempts for a booking
router.get('/attempts/:bookingId', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data, error } = await supabase
      .from('pod_attempts')
      .select('*')
      .eq('booking_id', bookingId)
      .order('attempt_number', { ascending: true });

    if (error) {
      console.error('Error fetching delivery attempts:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch delivery attempts' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /pod/attempts/:bookingId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POD Templates endpoints
router.get('/templates', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const { branch_id } = req.query;
    
    let query = supabase
      .from('pod_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name');

    // Get templates for specific branch or global templates
    if (branch_id) {
      query = query.or(`branch_id.eq.${branch_id},branch_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching POD templates:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch POD templates' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /pod/templates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create POD template
router.post('/templates', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const validatedData = podTemplateSchema.parse(req.body);

    const { data, error } = await supabase
      .from('pod_templates')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Error creating POD template:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create POD template' 
      });
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error in POST /pod/templates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get POD statistics
router.get('/stats', authenticate, requireOrgBranch, async (req, res) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    
    // Build base query
    let query = supabase
      .from('bookings')
      .select('id, status, pod_status, to_branch', { count: 'exact' });

    if (branch_id) {
      query = query.eq('to_branch', branch_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Get delivered bookings
    const { count: totalDelivered } = await query
      .eq('status', 'delivered');

    // Get pending PODs
    const { count: pendingPODs } = await query
      .eq('status', 'delivered')
      .eq('pod_status', 'pending');

    // Get completed PODs
    const { count: completedPODs } = await query
      .eq('pod_status', 'completed');

    // Get PODs with photos and signatures
    let podQuery = supabase
      .from('pod_records')
      .select('id, signature_image_url, photo_evidence_url', { count: 'exact' });

    if (branch_id) {
      podQuery = podQuery.eq('branch_id', branch_id);
    }

    const { data: podRecords } = await podQuery;

    const withSignature = podRecords?.filter(p => p.signature_image_url).length || 0;
    const withPhoto = podRecords?.filter(p => p.photo_evidence_url).length || 0;

    res.json({ 
      success: true, 
      data: {
        totalDelivered: totalDelivered || 0,
        pendingPODs: pendingPODs || 0,
        completedPODs: completedPODs || 0,
        withSignature,
        withPhoto,
        completionRate: totalDelivered ? ((completedPODs || 0) / totalDelivered) * 100 : 0,
      }
    });
  } catch (error) {
    console.error('Error in GET /pod/stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;