import { Router } from 'express';
import { z } from 'zod';
import { bookingSchema, updateBookingStatusSchema } from '../schemas';
import { bookingArticleSchema, calculateFreightAmount, validateArticleCombination } from '../schemas/bookingArticle';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { asyncHandler } from '../utils/apiResponse';
import { generateLRNumber } from '../utils/lrGenerator';
import { validateCompleteBooking } from '../utils/businessValidations';
import { branchCache, invalidateCache } from '../middleware/cache';
import { captureBusinessError } from '../middleware/sentry';
import SentryManager from '../config/sentry';
import { bookingSMS } from '../services/smsService';
import { log } from '../utils/logger';

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

// Business validation functions are now in ../utils/businessValidations.ts

// GET all bookings with articles
router.get('/', requireOrgBranch, branchCache(900), asyncHandler(async (req: any, res: any) => {
  const { orgId, branchId, role } = req;
  
  let query = supabase
    .from('bookings')
    .select(`
      *,
      booking_articles (
        *,
        article:articles(*)
      ),
      sender:customers!sender_id(*),
      receiver:customers!receiver_id(*),
      from_branch:branches!from_branch(*),
      to_branch:branches!to_branch(*)
    `)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    return res.sendDatabaseError(error, 'Fetch bookings');
  }
  
  res.sendSuccess(data, `Retrieved ${data?.length || 0} bookings`);
}));

// POST create new booking with multiple articles
router.post('/', requireOrgBranch, invalidateCache((req) => [
  `api:branch:${req.headers['x-branch-id']}:*`,
  `dashboard:*:${req.headers['x-branch-id']}:*`
]), asyncHandler(async (req: any, res: any) => {
  const parse = bookingSchema.safeParse(req.body);
  if (!parse.success) {
    return res.sendValidationError(parse.error.errors);
  }
  
  const payload = { ...parse.data };
  const { orgId, branchId, role, user } = req as any;
  payload['organization_id'] = orgId;
  
  // Determine which branch ID to use
  const effectiveBranchId = role !== 'admin' ? branchId : (payload.branch_id || branchId);
  payload['branch_id'] = effectiveBranchId;
  
  // Extract articles from payload
  const articles = payload.articles;
  delete payload.articles; // Remove from main payload

  try {
    // Calculate total amount for validation
    let totalAmount = 0;
    articles.forEach((article: any) => {
      const freightAmount = article.rate_type === 'per_kg' 
        ? (article.charged_weight || article.actual_weight) * article.rate_per_unit
        : article.quantity * article.rate_per_unit;
      const loadingCharges = (article.loading_charge_per_unit || 0) * article.quantity;
      const unloadingCharges = (article.unloading_charge_per_unit || 0) * article.quantity;
      const otherCharges = (article.insurance_charge || 0) + (article.packaging_charge || 0);
      totalAmount += freightAmount + loadingCharges + unloadingCharges + otherCharges;
    });

    // Comprehensive business validation
    const validation = await validateCompleteBooking({
      sender_id: payload.sender_id,
      receiver_id: payload.receiver_id,
      from_branch: payload.from_branch,
      to_branch: payload.to_branch,
      organization_id: orgId,
      articles: articles,
      total_amount: totalAmount
    });

    if (!validation.valid) {
      return res.sendError(validation.message, 400, validation.details);
    }

    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Booking validation warnings:', validation.warnings);
    }

    // Start transaction
    const { data: booking, error: bookingError } = await supabase.rpc('create_booking_with_articles', {
      booking_data: payload,
      articles_data: articles,
      user_id: user?.id || null
    });

    if (bookingError) {
      throw bookingError;
    }

    // Send booking confirmation SMS
    try {
      await sendBookingConfirmationSMS(booking);
    } catch (smsError) {
      log.warn('Failed to send booking confirmation SMS', {
        bookingId: booking.id,
        error: smsError instanceof Error ? smsError.message : 'Unknown SMS error'
      });
      // Don't fail booking creation if SMS fails
    }
    
    // Return success with validation warnings
    res.sendSuccess(booking, 'Booking created successfully', 201, {
      warnings: validation.warnings,
      validation_details: validation.details
    });

  } catch (error: any) {
    // Capture business error with context for Sentry
    if (error instanceof Error) {
      captureBusinessError(error, {
        operation: 'create_booking',
        entity: 'booking',
        user_id: user?.id,
        branch_id: effectiveBranchId,
        additional_data: {
          articles_count: articles.length,
          total_amount: totalAmount,
          sender_id: payload.sender_id,
          receiver_id: payload.receiver_id
        }
      });
    }

    console.error('Booking creation error:', error);
    return res.sendError(error.message || 'Failed to create booking', 500);
  }
}));

// GET single booking by ID with articles
router.get('/:id', requireOrgBranch, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  let query = supabase
    .from('bookings')
    .select(`
      *,
      booking_articles (
        *,
        article:articles(*)
      ),
      sender:customers!sender_id(*),
      receiver:customers!receiver_id(*),
      from_branch:branches!from_branch(*),
      to_branch:branches!to_branch(*)
    `)
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

// PUT update booking (limited fields only)
router.put('/:id', requireOrgBranch, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // Only allow updating limited fields for existing bookings
  const updateSchema = z.object({
    expected_delivery_date: z.string().optional(),
    delivery_type: z.enum(['Standard', 'Express', 'Same Day']).optional(),
    priority: z.enum(['Normal', 'High', 'Urgent']).optional(),
    reference_number: z.string().optional(),
    remarks: z.string().optional(),
    invoice_number: z.string().optional(),
    invoice_date: z.string().optional(),
    invoice_amount: z.number().optional(),
    eway_bill_number: z.string().optional()
  });

  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.sendValidationError(parse.error.errors);
  }
  
  const updateData = { ...parse.data, updated_at: new Date().toISOString() };
  
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

// DELETE booking (soft delete - cancel)
router.delete('/:id', requireOrgBranch, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // Instead of hard delete, we'll cancel the booking
  let query = supabase
    .from('bookings')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { error } = await query;
  if (error) {
    return res.sendDatabaseError(error, 'Cancel booking');
  }

  // Also update all articles to cancelled status
  await supabase
    .from('booking_articles')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', id);
  
  res.sendSuccess(null, 'Booking cancelled successfully');
}));

// PATCH update booking status
router.patch('/:id/status', requireOrgBranch, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const parse = updateBookingStatusSchema.safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  const { status, pod_required, workflow_context } = parse.data;
  
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
    return res.sendError('Booking not found', 404);
  }
  
  // Validate status transition
  const isValidTransition = validateStatusTransition(booking.status, status);
  if (!isValidTransition.valid) {
    return res.sendError(isValidTransition.message, 400);
  }

  // SECURITY: Restrict certain status changes to specific workflows only
  const restrictedTransitions = ['in_transit', 'unloaded'];
  if (restrictedTransitions.includes(status)) {
    // These transitions should only happen through loading/unloading workflows
    if (workflow_context !== 'loading' && workflow_context !== 'unloading') {
      return res.sendError(
        `Status '${status}' can only be set through proper loading/unloading workflows`,
        403
      );
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

  // Also update article statuses to match booking status
  await supabase
    .from('booking_articles')
    .update({ 
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', id);
  
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
  
  // Send SMS notifications for relevant status changes
  try {
    await sendStatusUpdateSMS(data, booking.status, status);
  } catch (smsError) {
    log.warn('Failed to send SMS notification', {
      bookingId: id,
      status,
      error: smsError instanceof Error ? smsError.message : 'Unknown SMS error'
    });
    // Don't fail the status update if SMS fails
  }
  
  res.sendSuccess(data, 'Booking status updated successfully');
}));

// GET booking articles separately
router.get('/:id/articles', requireOrgBranch, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req as any;
  
  const { data, error } = await supabase
    .from('booking_articles')
    .select(`
      *,
      article:articles(*),
      booking:bookings!inner(organization_id)
    `)
    .eq('booking_id', id)
    .eq('booking.organization_id', orgId);
  
  if (error) {
    return res.sendDatabaseError(error, 'Get booking articles');
  }
  
  res.sendSuccess(data, 'Booking articles retrieved successfully');
}));

// PATCH update individual article status
router.patch('/:bookingId/articles/:articleId/status', requireOrgBranch, asyncHandler(async (req, res) => {
  const { bookingId, articleId } = req.params;
  const { status } = req.body;
  const { orgId } = req as any;
  
  if (!status || !['booked', 'loaded', 'in_transit', 'unloaded', 'out_for_delivery', 'delivered', 'damaged', 'missing', 'cancelled'].includes(status)) {
    return res.sendError('Invalid status', 400);
  }
  
  const { data, error } = await supabase
    .from('booking_articles')
    .update({ 
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'delivered' && { delivered_at: new Date().toISOString() }),
      ...(status === 'loaded' && { loaded_at: new Date().toISOString() }),
      ...(status === 'unloaded' && { unloaded_at: new Date().toISOString() })
    })
    .eq('booking_id', bookingId)
    .eq('id', articleId)
    .select();
  
  if (error) {
    return res.sendDatabaseError(error, 'Update article status');
  }
  
  if (!data || data.length === 0) {
    return res.sendError('Article not found', 404);
  }
  
  res.sendSuccess(data[0], 'Article status updated successfully');
}));

export default router;