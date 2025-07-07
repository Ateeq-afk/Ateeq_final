import { Router } from 'express';
import { z } from 'zod';
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
  
  // Validate route: from_branch and to_branch must be different
  if (payload.from_branch && payload.to_branch && payload.from_branch === payload.to_branch) {
    return res.sendValidationError([
      { message: 'Origin and destination branches cannot be the same' }
    ]);
  }
  
  // Validate that both branches exist and belong to the organization
  if (payload.from_branch || payload.to_branch) {
    const branchesToCheck = [payload.from_branch, payload.to_branch].filter(Boolean);
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, organization_id')
      .in('id', branchesToCheck)
      .eq('organization_id', orgId);
    
    if (branchError) {
      console.error('Branch validation error:', branchError);
      return res.sendError('Failed to validate branch information', 500);
    }
    
    if (branches.length !== branchesToCheck.length) {
      return res.sendValidationError([
        { message: 'One or more selected branches do not exist in your organization' }
      ]);
    }
  }
  
  // Handle LR number generation based on lr_type
  if (payload.lr_type === 'manual') {
    // For manual LR type, use the manual_lr_number field
    if (payload.manual_lr_number) {
      // Check for duplicate manual LR number within the organization
      const { data: existingLR, error: lrCheckError } = await supabase
        .from('bookings')
        .select('id, lr_number')
        .eq('lr_number', payload.manual_lr_number)
        .eq('organization_id', orgId)
        .maybeSingle();
      
      if (lrCheckError) {
        console.error('LR duplicate check error:', lrCheckError);
        return res.sendError('Failed to validate LR number uniqueness', 500);
      }
      
      if (existingLR) {
        return res.sendValidationError([
          { message: `LR number '${payload.manual_lr_number}' already exists in your organization` }
        ]);
      }
      
      payload['lr_number'] = payload.manual_lr_number;
    } else {
      return res.sendValidationError([
        { message: 'Manual LR number is required when lr_type is manual' }
      ]);
    }
  } else {
    // For system LR type, generate LR number server-side
    try {
      // Check if this is a quotation
      const isQuotation = payload.payment_type === 'Quotation';
      payload['lr_number'] = await generateLRNumber(effectiveBranchId, { isQuotation });
    } catch (lrError) {
      console.error('LR generation error:', lrError);
      return res.sendError('Failed to generate LR number', 500);
    }
  }
  
  // Clean up the manual_lr_number field as it's not needed in the database
  delete payload.manual_lr_number;
  
  // Calculate total amount automatically
  // Use freight items total if available, otherwise fall back to freight_per_qty calculation
  let freightTotal = 0;
  if (payload.freight_items && Array.isArray(payload.freight_items) && payload.freight_items.length > 0) {
    // Calculate total from freight items
    freightTotal = payload.freight_items.reduce((sum: number, item: any) => {
      return sum + ((item.rate || 0) * (item.quantity || 0));
    }, 0);
  } else {
    // Calculate based on rate type
    if (payload.rate_type === 'per_kg') {
      // For per-kg rate, multiply by actual weight
      freightTotal = (payload.actual_weight || 0) * (payload.freight_per_qty || 0);
    } else {
      // Default per-quantity calculation
      freightTotal = (payload.quantity || 0) * (payload.freight_per_qty || 0);
    }
  }
  
  // Calculate loading and unloading charges based on quantity
  const loadingCharges = (payload.loading_charges || 0) * (payload.quantity || 0);
  const unloadingCharges = (payload.unloading_charges || 0) * (payload.quantity || 0);
  
  const totalAmount = (
    freightTotal +
    loadingCharges +
    unloadingCharges +
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
router.get('/:id', requireOrgBranch, asyncHandler(async (req, res) => {
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
      return res.sendError('Booking not found', 404);
    }
    return res.sendDatabaseError(error, 'Get booking');
  }
  res.sendSuccess(data, 'Booking retrieved successfully');
}));

// UPDATE booking
router.put('/:id', requireOrgBranch, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const parse = z.object({
    lr_number: z.string().optional(),
    lr_type: z.enum(['system', 'manual']).optional(),
    from_branch: z.string().optional(),
    to_branch: z.string().optional(),
    sender_id: z.string().optional(),
    receiver_id: z.string().optional(),
    article_id: z.string().optional(),
    description: z.string().optional(),
    uom: z.string().optional(),
    actual_weight: z.number().optional(),
    charged_weight: z.number().optional(),
    quantity: z.number().optional(),
    payment_type: z.enum(['Paid', 'To Pay', 'Quotation']).optional(),
    rate_type: z.enum(['per_kg', 'per_quantity']).optional(),
    freight_per_qty: z.number().optional(),
    freight_items: z.array(z.object({
      description: z.string(),
      rate: z.number().min(0),
      quantity: z.number().min(0),
      amount: z.number().min(0)
    })).optional(),
    loading_charges: z.number().optional(),
    unloading_charges: z.number().optional(),
    insurance_charge: z.number().optional(),
    packaging_charge: z.number().optional(),
    remarks: z.string().optional()
  }).safeParse(req.body);
  if (!parse.success) {
    return res.sendValidationError(parse.error.errors);
  }
  
  // Don't allow updating organization_id or branch_id
  const updateData = { ...parse.data };
  
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
      return res.sendError('Booking not found', 404);
    }
    return res.sendDatabaseError(error, 'Update booking');
  }
  res.sendSuccess(data, 'Booking updated successfully');
}));

// DELETE booking
router.delete('/:id', requireOrgBranch, asyncHandler(async (req, res) => {
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
    return res.sendDatabaseError(error, 'Delete booking');
  }
  
  res.sendSuccess(null, 'Booking deleted successfully');
}));

// UPDATE booking status
router.patch('/:id/status', requireOrgBranch, asyncHandler(async (req, res) => {
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
    return res.sendDatabaseError(error, 'Update booking status');
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
  
  res.sendSuccess(data, 'Booking status updated successfully');
}));

export default router;
