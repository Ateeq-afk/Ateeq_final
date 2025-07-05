import { Router } from 'express';
import { bookingSchema, updateBookingStatusSchema } from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { asyncHandler } from '../utils/apiResponse';
import { generateLRNumber } from '../utils/lrGenerator';

const router = Router();

// Status transition validation
function validateStatusTransition(currentStatus: string, newStatus: string) {
  const statusTransitions: Record<string, string[]> = {
    'booked': ['in_transit', 'cancelled'],
    'in_transit': ['unloaded', 'cancelled'],
    'unloaded': ['out_for_delivery', 'cancelled'],
    'out_for_delivery': ['delivered', 'cancelled'],
    'delivered': ['pod_received'],
    'pod_received': [], // Final state
    'cancelled': [] // Final state
  };

  const allowedTransitions = statusTransitions[currentStatus] || [];
  
  // Allow staying in the same status (for updates without status change)
  if (currentStatus === newStatus) {
    return { valid: true, message: 'Status unchanged' };
  }

  if (allowedTransitions.includes(newStatus)) {
    return { valid: true, message: 'Valid transition' };
  }

  return {
    valid: false,
    message: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
    allowedTransitions
  };
}

router.get('/', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { orgId, branchId, role } = req;
  
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return res.sendDatabaseError(error, 'Fetch bookings');
  }
  
  res.sendSuccess(data, `Retrieved ${data?.length || 0} bookings`);
}));

router.post('/', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = bookingSchema.safeParse(req.body);
  if (!parse.success) {
    return res.sendValidationError(parse.error.errors);
  }
  
  const payload = { ...parse.data };
  const { orgId, branchId, role } = req as any;
  payload['organization_id'] = orgId;
  
  // Determine which branch ID to use
  const effectiveBranchId = role !== 'admin' ? branchId : (payload.branch_id || branchId);
  payload['branch_id'] = effectiveBranchId;
  
  // Handle LR number generation based on lr_type
  if (payload.lr_type === 'manual') {
    // For manual LR type, use the manual_lr_number field
    if (payload.manual_lr_number) {
      payload['lr_number'] = payload.manual_lr_number;
    } else {
      return res.sendValidationError([
        { message: 'Manual LR number is required when lr_type is manual' }
      ]);
    }
  } else {
    // For system LR type, generate LR number server-side
    try {
      payload['lr_number'] = await generateLRNumber(effectiveBranchId);
    } catch (lrError) {
      console.error('LR generation error:', lrError);
      return res.sendError('Failed to generate LR number', 500);
    }
  }
  
  // Clean up the manual_lr_number field as it's not needed in the database
  delete payload.manual_lr_number;
  
  // Calculate total amount automatically
  const totalAmount = (
    (payload.quantity || 0) * (payload.freight_per_qty || 0) +
    (payload.loading_charges || 0) +
    (payload.unloading_charges || 0) +
    (payload.insurance_charge || 0) +
    (payload.packaging_charge || 0)
  );
  
  payload['total_amount'] = totalAmount;
  payload['status'] = 'booked'; // Default status
  
  
  const { data, error } = await supabase.from('bookings').insert(payload).select();
  if (error) {
    return res.sendDatabaseError(error, 'Create booking');
  }
  
  res.sendSuccess(data?.[0], 'Booking created successfully', 201);
}));

// GET single booking by ID
router.get('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// UPDATE booking
router.put('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const parse = bookingSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  // Don't allow updating organization_id or branch_id
  const updateData = { ...parse.data };
  delete updateData.organization_id;
  delete updateData.branch_id;
  
  let query = supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.select().single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// DELETE booking
router.delete('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  let query = supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.status(204).send();
});

// UPDATE booking status
router.patch('/:id/status', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // Validate status update
  const parse = updateBookingStatusSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  const { status, pod_required } = parse.data;
  
  // Check if booking exists and get current status
  let checkQuery = supabase
    .from('bookings')
    .select('id, status, pod_status, pod_required, to_branch')
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    checkQuery = checkQuery.eq('branch_id', branchId);
  }
  
  const { data: booking, error: checkError } = await checkQuery.single();
  
  if (checkError || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  // Validate status transition
  const isValidTransition = validateStatusTransition(booking.status, status);
  if (!isValidTransition.valid) {
    return res.status(400).json({
      error: 'Invalid status transition',
      details: {
        message: isValidTransition.message,
        current_status: booking.status,
        requested_status: status,
        allowed_transitions: isValidTransition.allowedTransitions
      }
    });
  }

  // Special handling for marking as delivered
  if (status === 'delivered' && booking.status !== 'delivered') {
    // Check if POD is required and not completed
    if (booking.pod_required !== false && booking.pod_status !== 'completed') {
      return res.status(400).json({ 
        error: 'Cannot mark as delivered without completing POD process',
        details: {
          message: 'Please complete the Proof of Delivery process before marking this booking as delivered',
          pod_status: booking.pod_status,
          action_required: 'complete_pod'
        }
      });
    }
  }
  
  // Update the status
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (pod_required !== undefined) {
    updateData.pod_required = pod_required;
  }
  
  let updateQuery = supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    updateQuery = updateQuery.eq('branch_id', branchId);
  }
  
  const { data, error } = await updateQuery.select().single();
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  // Log status change event
  await supabase
    .from('logistics_events')
    .insert({
      event_type: 'status_change',
      booking_id: id,
      branch_id: branchId,
      description: `Status changed from ${booking.status} to ${status}`,
      metadata: {
        old_status: booking.status,
        new_status: status,
        changed_by: (req as any).user?.id
      }
    });
  
  res.json(data);
});

export default router;
