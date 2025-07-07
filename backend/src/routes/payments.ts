import express from 'express';
import { supabase } from '../supabaseClient';
import { authenticate } from '../middleware/auth';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { paymentSMS } from '../services/smsService';
import { log } from '../utils/logger';

const router = express.Router();

/**
 * Send payment confirmation SMS
 */
async function sendPaymentConfirmationSMS(payment: any) {
  if (!payment) return;
  
  try {
    // Get booking and customer info if payment is allocated to bookings
    const { data: allocations } = await supabase
      .from('payment_allocations')
      .select(`
        booking_id,
        amount,
        bookings!inner (
          lr_number,
          sender:customers!sender_id(phone)
        )
      `)
      .eq('payment_id', payment.id);
      
    if (!allocations || allocations.length === 0) {
      log.debug('No booking allocations found for payment', { paymentId: payment.id });
      return;
    }
    
    // Send SMS for each booking
    for (const allocation of allocations) {
      const customerPhone = allocation.bookings?.sender?.phone;
      if (!customerPhone) continue;
      
      const paymentData = {
        amount: allocation.amount.toString(),
        lr_number: allocation.bookings.lr_number,
        receipt_url: `${process.env.FRONTEND_URL || 'https://app.desicargo.com'}/receipt/${payment.payment_number}`
      };
      
      await paymentSMS.sendPaymentConfirmation(customerPhone, paymentData);
      
      log.info('Payment confirmation SMS sent', {
        paymentId: payment.id,
        bookingLR: allocation.bookings.lr_number,
        phone: customerPhone.slice(-4) // Log only last 4 digits for privacy
      });
    }
  } catch (error) {
    log.error('Failed to send payment confirmation SMS', {
      paymentId: payment.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Send payment reminder SMS
 */
export async function sendPaymentReminderSMS(bookingId: string, amount: number) {
  try {
    // Get booking and customer info
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        lr_number,
        sender:customers!sender_id(phone)
      `)
      .eq('id', bookingId)
      .single();
      
    if (!booking?.sender?.phone) {
      log.info('No customer phone found for payment reminder', { bookingId });
      return;
    }
    
    const paymentData = {
      amount: amount.toString(),
      lr_number: booking.lr_number,
      payment_url: `${process.env.FRONTEND_URL || 'https://app.desicargo.com'}/pay/${bookingId}`,
      contact_number: process.env.PAYMENT_CONTACT_NUMBER || '+91-9999999999'
    };
    
    await paymentSMS.sendPaymentReminder(booking.sender.phone, paymentData);
    
    log.info('Payment reminder SMS sent', {
      bookingId,
      lrNumber: booking.lr_number,
      amount,
      phone: booking.sender.phone.slice(-4)
    });
  } catch (error) {
    log.error('Failed to send payment reminder SMS', {
      bookingId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Apply auth middleware to all routes
router.use(authenticate);
router.use(requireOrgBranch);

// Get all payment modes
router.get('/modes', async (req: any, res) => {
  try {
    const { orgId } = req;
    
    const { data, error } = await supabase
      .from('payment_modes')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching payment modes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment modes' });
  }
});

// Get all payments with filtering
router.get('/', async (req: any, res) => {
  try {
    const { orgId, branchId, role } = req;
    const { 
      branch_id, 
      status, 
      payment_mode_id, 
      payer_type,
      date_from, 
      date_to,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        *,
        payment_modes!inner(name, type, requires_reference)
      `)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    // For non-admins, filter by their branch
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    } else if (branch_id) {
      // Admins can optionally filter by branch
      query = query.eq('branch_id', branch_id);
    }
    
    if (status) query = query.eq('status', status);
    if (payment_mode_id) query = query.eq('payment_mode_id', payment_mode_id);
    if (payer_type) query = query.eq('payer_type', payer_type);
    if (date_from) query = query.gte('payment_date', date_from);
    if (date_to) query = query.lte('payment_date', date_to);

    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .order('payment_date', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// Get payment by ID with allocations
router.get('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req;

    // Get payment details
    let query = supabase
      .from('payments')
      .select(`
        *,
        payment_modes (name, type, requires_reference),
        payment_allocations (*)
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);
    
    // Non-admins can only see payments from their branch
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    }
    
    const { data: payment, error: paymentError } = await query.single();

    if (paymentError) throw paymentError;
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

// Create new payment
router.post('/', async (req: any, res) => {
  try {
    const { user, orgId, branchId, role } = req;
    const paymentData = req.body;

    // Generate payment number
    const { data: lastPayment } = await supabase
      .from('payments')
      .select('payment_number')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastPayment && lastPayment.length > 0) {
      const lastNumber = parseInt(lastPayment[0].payment_number.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    const paymentNumber = `PAY-${String(nextNumber).padStart(6, '0')}`;

    // Determine effective branch ID
    const effectiveBranchId = role === 'admin' && paymentData.branch_id ? paymentData.branch_id : branchId;
    
    const payment = {
      ...paymentData,
      payment_number: paymentNumber,
      organization_id: orgId, // Always from auth context
      branch_id: effectiveBranchId,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select('*')
      .single();

    if (error) throw error;

    // If allocations are provided, create them
    if (paymentData.allocations && paymentData.allocations.length > 0) {
      const allocations = paymentData.allocations.map((allocation: any) => ({
        ...allocation,
        payment_id: data.id,
        created_by: user.id
      }));

      const { error: allocationError } = await supabase
        .from('payment_allocations')
        .insert(allocations);

      if (allocationError) throw allocationError;
    }

    // Send payment confirmation SMS if payment is for bookings
    try {
      await sendPaymentConfirmationSMS(data);
    } catch (smsError) {
      log.warn('Failed to send payment confirmation SMS', {
        paymentId: data.id,
        error: smsError instanceof Error ? smsError.message : 'Unknown SMS error'
      });
      // Don't fail payment creation if SMS fails
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { user, orgId, branchId, role } = req;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };
    
    // Remove org/branch from update data to prevent modification
    delete updateData.organization_id;
    delete updateData.branch_id;

    let query = supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);
    
    // Non-admins can only update payments from their branch
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query.select('*').single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment' });
  }
});

// Delete payment (soft delete)
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req;

    let query = supabase
      .from('payments')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);
    
    // Non-admins can only delete payments from their branch
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query.select('*').single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete payment' });
  }
});

// Get outstanding amounts
router.get('/outstanding', async (req: any, res) => {
  try {
    const { orgId, branchId, role } = req;
    const { 
      branch_id, 
      customer_id, 
      status = 'pending',
      aging_bucket,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabase
      .from('outstanding_amounts_detailed')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    // Branch filtering logic
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    } else if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }
    
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (status) query = query.eq('status', status);
    if (aging_bucket) query = query.eq('aging_bucket', aging_bucket);

    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .order('due_date', { ascending: true })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching outstanding amounts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch outstanding amounts' });
  }
});

// Create outstanding amount
router.post('/outstanding', async (req: any, res) => {
  try {
    const { user, orgId, branchId, role } = req;
    
    // Determine effective branch ID
    const effectiveBranchId = role === 'admin' && req.body.branch_id ? req.body.branch_id : branchId;
    
    const outstandingData = {
      ...req.body,
      organization_id: orgId,
      branch_id: effectiveBranchId,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('outstanding_amounts')
      .insert([outstandingData])
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating outstanding amount:', error);
    res.status(500).json({ success: false, error: 'Failed to create outstanding amount' });
  }
});

// Update outstanding amount (mark as paid, partially paid, etc.)
router.put('/outstanding/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };
    
    // Remove org/branch from update data
    delete updateData.organization_id;
    delete updateData.branch_id;

    let query = supabase
      .from('outstanding_amounts')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('is_deleted', false);
    
    // Non-admins can only update their branch data
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query.select('*').single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Outstanding amount not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating outstanding amount:', error);
    res.status(500).json({ success: false, error: 'Failed to update outstanding amount' });
  }
});

// Get payment reminders
router.get('/reminders/list', async (req: any, res) => {
  try {
    const { orgId, branchId, role } = req;
    const { 
      outstanding_id,
      status = 'scheduled',
      reminder_type,
      date_from,
      date_to,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabase
      .from('payment_reminders')
      .select(`
        *,
        outstanding_amounts!inner (
          reference_number,
          outstanding_amount,
          due_date,
          organization_id,
          branch_id,
          customers (name, contact_phone, email)
        )
      `)
      .eq('outstanding_amounts.organization_id', orgId);

    // Branch filtering
    if (role !== 'admin') {
      query = query.eq('outstanding_amounts.branch_id', branchId);
    }
    
    if (outstanding_id) query = query.eq('outstanding_id', outstanding_id);
    if (status) query = query.eq('status', status);
    if (reminder_type) query = query.eq('reminder_type', reminder_type);
    if (date_from) query = query.gte('scheduled_date', date_from);
    if (date_to) query = query.lte('scheduled_date', date_to);

    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .order('scheduled_date', { ascending: true })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payment reminders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment reminders' });
  }
});

// Create payment reminder
router.post('/reminders', async (req: any, res) => {
  try {
    const { user, orgId, branchId, role } = req;
    
    // First verify the outstanding amount belongs to the user's org
    const { data: outstanding, error: outstandingError } = await supabase
      .from('outstanding_amounts')
      .select('id, organization_id, branch_id')
      .eq('id', req.body.outstanding_id)
      .eq('organization_id', orgId)
      .single();
    
    if (outstandingError || !outstanding) {
      return res.status(404).json({ success: false, error: 'Outstanding amount not found' });
    }
    
    // Non-admins can only create reminders for their branch
    if (role !== 'admin' && outstanding.branch_id !== branchId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const reminderData = {
      ...req.body,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('payment_reminders')
      .insert([reminderData])
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating payment reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment reminder' });
  }
});

// Update payment reminder status
router.put('/reminders/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };

    // First get the reminder with its outstanding amount
    const { data: reminder, error: reminderError } = await supabase
      .from('payment_reminders')
      .select(`
        *,
        outstanding_amounts!inner (
          organization_id,
          branch_id
        )
      `)
      .eq('id', id)
      .single();
    
    if (reminderError || !reminder) {
      return res.status(404).json({ success: false, error: 'Payment reminder not found' });
    }
    
    // Verify org access
    if (reminder.outstanding_amounts.organization_id !== orgId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Non-admins can only update reminders for their branch
    if (role !== 'admin' && reminder.outstanding_amounts.branch_id !== branchId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('payment_reminders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Payment reminder not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating payment reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment reminder' });
  }
});

// Get payment analytics/dashboard data
router.get('/analytics/dashboard', async (req: any, res) => {
  try {
    const { orgId, branchId, role } = req;
    const { branch_id, date_from, date_to } = req.query;

    // Get payment summary stats
    let paymentsQuery = supabase
      .from('payments')
      .select('amount, status, payment_date')
      .eq('organization_id', orgId)
      .eq('is_deleted', false);

    // Branch filtering
    if (role !== 'admin') {
      paymentsQuery = paymentsQuery.eq('branch_id', branchId);
    } else if (branch_id) {
      paymentsQuery = paymentsQuery.eq('branch_id', branch_id);
    }
    
    if (date_from) paymentsQuery = paymentsQuery.gte('payment_date', date_from);
    if (date_to) paymentsQuery = paymentsQuery.lte('payment_date', date_to);

    const { data: payments, error: paymentsError } = await paymentsQuery;
    if (paymentsError) throw paymentsError;

    // Get outstanding summary stats
    let outstandingQuery = supabase
      .from('outstanding_amounts')
      .select('outstanding_amount, overdue_days, status')
      .eq('organization_id', orgId)
      .eq('is_deleted', false)
      .gt('outstanding_amount', 0);

    // Branch filtering for outstanding
    if (role !== 'admin') {
      outstandingQuery = outstandingQuery.eq('branch_id', branchId);
    } else if (branch_id) {
      outstandingQuery = outstandingQuery.eq('branch_id', branch_id);
    }

    const { data: outstanding, error: outstandingError } = await outstandingQuery;
    if (outstandingError) throw outstandingError;

    // Calculate analytics
    const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const clearedPayments = payments?.filter(p => p.status === 'cleared').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const pendingPayments = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const totalOutstanding = outstanding?.reduce((sum, o) => sum + Number(o.outstanding_amount), 0) || 0;
    const overdueOutstanding = outstanding?.filter(o => o.overdue_days > 0).reduce((sum, o) => sum + Number(o.outstanding_amount), 0) || 0;

    // Aging analysis
    const agingBuckets = {
      current: outstanding?.filter(o => o.overdue_days === 0).reduce((sum, o) => sum + Number(o.outstanding_amount), 0) || 0,
      '1-30_days': outstanding?.filter(o => o.overdue_days > 0 && o.overdue_days <= 30).reduce((sum, o) => sum + Number(o.outstanding_amount), 0) || 0,
      '31-60_days': outstanding?.filter(o => o.overdue_days > 30 && o.overdue_days <= 60).reduce((sum, o) => sum + Number(o.outstanding_amount), 0) || 0,
      '61-90_days': outstanding?.filter(o => o.overdue_days > 60 && o.overdue_days <= 90).reduce((sum, o) => sum + Number(o.outstanding_amount), 0) || 0,
      '90+_days': outstanding?.filter(o => o.overdue_days > 90).reduce((sum, o) => sum + Number(o.outstanding_amount), 0) || 0
    };

    const analytics = {
      payments: {
        total: totalPayments,
        cleared: clearedPayments,
        pending: pendingPayments,
        count: payments?.length || 0
      },
      outstanding: {
        total: totalOutstanding,
        overdue: overdueOutstanding,
        current: totalOutstanding - overdueOutstanding,
        count: outstanding?.length || 0
      },
      aging: agingBuckets
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment analytics' });
  }
});

// Manual SMS endpoints for admin use
router.post('/send-reminder/:bookingId', async (req: any, res) => {
  try {
    const { bookingId } = req.params;
    const { amount } = req.body;
    const { role } = req;
    
    // Only admins can manually send payment reminders
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    await sendPaymentReminderSMS(bookingId, amount);
    
    res.json({ success: true, message: 'Payment reminder SMS sent' });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to send payment reminder' });
  }
});

// Bulk payment reminder for overdue bookings
router.post('/send-bulk-reminders', async (req: any, res) => {
  try {
    const { orgId, branchId, role } = req;
    const { days_overdue = 7 } = req.body;
    
    // Only admins can send bulk reminders
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    // Get overdue bookings
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - days_overdue);
    
    const { data: overdueBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        lr_number,
        freight_amount,
        payment_mode,
        created_at,
        sender:customers!sender_id(phone)
      `)
      .eq('organization_id', orgId)
      .eq('payment_mode', 'to_pay') // Only to-pay bookings
      .eq('payment_status', 'pending')
      .lt('created_at', overdueDate.toISOString())
      .not('sender.phone', 'is', null);
    
    if (!overdueBookings || overdueBookings.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No overdue bookings found',
        count: 0 
      });
    }
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send reminders in batches to avoid overwhelming the SMS service
    for (const booking of overdueBookings) {
      try {
        await sendPaymentReminderSMS(booking.id, booking.freight_amount);
        sentCount++;
        
        // Add delay between SMS to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failedCount++;
        log.warn('Failed to send reminder for booking', {
          bookingId: booking.id,
          lrNumber: booking.lr_number
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Payment reminders processed`,
      total: overdueBookings.length,
      sent: sentCount,
      failed: failedCount
    });
  } catch (error) {
    console.error('Error sending bulk payment reminders:', error);
    res.status(500).json({ success: false, error: 'Failed to send bulk payment reminders' });
  }
});

export default router;