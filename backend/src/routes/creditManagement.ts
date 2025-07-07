import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { supabase } from '../supabaseClient';

const router = Router();

// Validation schemas
const creditTransactionSchema = z.object({
  customer_id: z.string().uuid(),
  transaction_type: z.enum(['Booking', 'Payment', 'Adjustment', 'Refund', 'Credit Note', 'Debit Note']),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional(),
  amount: z.number(),
  description: z.string().optional(),
});

const updateCreditLimitSchema = z.object({
  new_limit: z.number().min(0),
  reason: z.string().optional(),
});

const updateCategorySchema = z.object({
  category: z.enum(['Regular', 'Premium', 'Corporate']),
});

const updateCreditStatusSchema = z.object({
  status: z.enum(['Active', 'On Hold', 'Blocked', 'Suspended']),
  reason: z.string().optional(),
});

const customerContractSchema = z.object({
  customer_id: z.string().uuid(),
  contract_number: z.string(),
  contract_type: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
  auto_renew: z.boolean().default(false),
  terms: z.record(z.any()).default({}),
  sla_terms: z.record(z.any()).default({}),
  special_rates: z.record(z.any()).default({}),
  document_url: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Expired', 'Terminated']).default('Active'),
});

// Apply auth middleware to all routes
router.use(authenticate);

// Credit Transactions
router.get('/credit-transactions', async (req, res) => {
  try {
    const supabase = supabase;
    const { customer_id, start_date, end_date, transaction_type, limit = 50, offset = 0 } = req.query;
    const { organization_id, branch_id } = req.user!;

    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('organization_id', organization_id)
      .order('transaction_date', { ascending: false });

    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (start_date) {
      query = query.gte('transaction_date', start_date);
    }

    if (end_date) {
      query = query.lte('transaction_date', end_date);
    }

    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type);
    }

    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch credit transactions' });
  }
});

router.post('/credit-transactions', async (req, res) => {
  try {
    const supabase = supabase;
    const validatedData = creditTransactionSchema.parse(req.body);
    const { organization_id, branch_id, id: user_id } = req.user!;

    // Get current customer balance
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('current_balance')
      .eq('id', validatedData.customer_id)
      .single();

    if (customerError) throw customerError;

    const balance_before = customer.current_balance || 0;
    const balance_after = balance_before + validatedData.amount;

    // Create transaction
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        ...validatedData,
        organization_id,
        branch_id,
        balance_before,
        balance_after,
        created_by: user_id,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating credit transaction:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Failed to create credit transaction' });
  }
});

// Credit Limit Management
router.put('/customers/:customerId/credit-limit', async (req, res) => {
  try {
    const supabase = supabase;
    const { customerId } = req.params;
    const validatedData = updateCreditLimitSchema.parse(req.body);
    const { id: user_id } = req.user!;

    // Get current credit limit
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('credit_limit')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Create history record
    const { error: historyError } = await supabase
      .from('credit_limit_history')
      .insert({
        customer_id: customerId,
        old_limit: customer.credit_limit,
        new_limit: validatedData.new_limit,
        changed_by: user_id,
        change_reason: validatedData.reason,
      });

    if (historyError) throw historyError;

    // Update customer credit limit
    const { data, error } = await supabase
      .from('customers')
      .update({ credit_limit: validatedData.new_limit })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating credit limit:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Failed to update credit limit' });
  }
});

router.get('/customers/:customerId/credit-limit-history', async (req, res) => {
  try {
    const supabase = supabase;
    const { customerId } = req.params;

    const { data, error } = await supabase
      .from('credit_limit_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching credit limit history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch credit limit history' });
  }
});

// Customer Category Management
router.put('/customers/:customerId/category', async (req, res) => {
  try {
    const supabase = supabase;
    const { customerId } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    const { data, error } = await supabase
      .from('customers')
      .update({ category: validatedData.category })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating customer category:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Failed to update customer category' });
  }
});

// Credit Status Management
router.put('/customers/:customerId/credit-status', async (req, res) => {
  try {
    const supabase = supabase;
    const { customerId } = req.params;
    const validatedData = updateCreditStatusSchema.parse(req.body);
    const { organization_id, id: user_id } = req.user!;

    // Update customer credit status
    const { data, error } = await supabase
      .from('customers')
      .update({ credit_status: validatedData.status })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    // Create alert if status is not Active
    if (validatedData.status !== 'Active') {
      await supabase
        .from('credit_alerts')
        .insert({
          organization_id,
          customer_id: customerId,
          alert_type: 'Credit Status Change',
          alert_level: validatedData.status === 'Blocked' || validatedData.status === 'Suspended' ? 'Critical' : 'Warning',
          message: `Credit status changed to ${validatedData.status}. ${validatedData.reason || ''}`,
        });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating credit status:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Failed to update credit status' });
  }
});

// Customer Contracts
router.get('/customer-contracts', async (req, res) => {
  try {
    const supabase = supabase;
    const { customer_id } = req.query;
    const { organization_id } = req.user!;

    let query = supabase
      .from('customer_contracts')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false });

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching customer contracts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer contracts' });
  }
});

router.post('/customer-contracts', async (req, res) => {
  try {
    const supabase = supabase;
    const validatedData = customerContractSchema.parse(req.body);
    const { organization_id, id: user_id } = req.user!;

    const { data, error } = await supabase
      .from('customer_contracts')
      .insert({
        ...validatedData,
        organization_id,
        created_by: user_id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update customer contract dates
    await supabase
      .from('customers')
      .update({
        contract_start_date: validatedData.start_date,
        contract_end_date: validatedData.end_date,
      })
      .eq('id', validatedData.customer_id);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating customer contract:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Failed to create customer contract' });
  }
});

router.put('/customer-contracts/:contractId', async (req, res) => {
  try {
    const supabase = supabase;
    const { contractId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('customer_contracts')
      .update(updates)
      .eq('id', contractId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating customer contract:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer contract' });
  }
});

// Billing Cycles
router.get('/billing-cycles', async (req, res) => {
  try {
    const supabase = supabase;
    const { customer_id, status } = req.query;
    const { organization_id } = req.user!;

    let query = supabase
      .from('billing_cycles')
      .select('*')
      .eq('organization_id', organization_id)
      .order('cycle_start_date', { ascending: false });

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching billing cycles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch billing cycles' });
  }
});

router.post('/billing-cycles/:cycleId/generate-invoice', async (req, res) => {
  try {
    const supabase = supabase;
    const { cycleId } = req.params;
    const { organization_id, branch_id, id: user_id } = req.user!;

    // Get billing cycle details
    const { data: cycle, error: cycleError } = await supabase
      .from('billing_cycles')
      .select('*, customers(*)')
      .eq('id', cycleId)
      .single();

    if (cycleError) throw cycleError;

    // Get all bookings for this cycle
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('sender_id', cycle.customer_id)
      .eq('payment_type', 'To Pay')
      .gte('created_at', cycle.cycle_start_date)
      .lte('created_at', cycle.cycle_end_date);

    if (bookingsError) throw bookingsError;

    // Calculate total amount
    const totalAmount = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id,
        branch_id,
        invoice_number: invoiceNumber,
        customer_id: cycle.customer_id,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: totalAmount,
        status: 'sent',
        created_by: user_id,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Update billing cycle
    await supabase
      .from('billing_cycles')
      .update({
        invoice_id: invoice.id,
        status: 'Invoiced',
        total_amount: totalAmount,
        total_bookings: bookings.length,
      })
      .eq('id', cycleId);

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to generate invoice' });
  }
});

// Customer Portal Access
router.get('/customers/:customerId/portal-access', async (req, res) => {
  try {
    const supabase = supabase;
    const { customerId } = req.params;

    const { data, error } = await supabase
      .from('customer_portal_access')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching portal access:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch portal access' });
  }
});

router.post('/customers/:customerId/reset-portal-pin', async (req, res) => {
  try {
    const supabase = supabase;
    const { customerId } = req.params;

    // Generate new 6-digit PIN
    const newPin = String(Math.floor(100000 + Math.random() * 900000));

    const { data, error } = await supabase
      .from('customers')
      .update({ portal_pin: newPin })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: { pin: newPin } });
  } catch (error) {
    console.error('Error resetting portal PIN:', error);
    res.status(500).json({ success: false, error: 'Failed to reset portal PIN' });
  }
});

// Credit Alerts
router.get('/credit-alerts', async (req, res) => {
  try {
    const supabase = supabase;
    const { customer_id, unread_only } = req.query;
    const { organization_id } = req.user!;

    let query = supabase
      .from('credit_alerts')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false });

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching credit alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch credit alerts' });
  }
});

router.put('/credit-alerts/:alertId/read', async (req, res) => {
  try {
    const supabase = supabase;
    const { alertId } = req.params;
    const { id: user_id } = req.user!;

    const { data, error } = await supabase
      .from('credit_alerts')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user_id,
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark alert as read' });
  }
});

// Credit Summary
router.get('/credit-summary', async (req, res) => {
  try {
    const supabase = supabase;
    const { customer_id } = req.query;
    const { organization_id, branch_id } = req.user!;

    let query = supabase
      .from('customer_credit_summary')
      .select('*')
      .eq('organization_id', organization_id);

    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    if (customer_id) {
      query = query.eq('id', customer_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching credit summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch credit summary' });
  }
});

// Credit Analytics
router.get('/credit-analytics', async (req, res) => {
  try {
    const supabase = supabase;
    const { start_date, end_date, group_by } = req.query;
    const { organization_id, branch_id } = req.user!;

    // Get customers with credit data
    let query = supabase
      .from('customers')
      .select('id, name, category, credit_limit, current_balance, credit_utilized, credit_status, branch_id')
      .eq('organization_id', organization_id);

    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    const { data: customers, error } = await query;

    if (error) throw error;

    // Calculate analytics
    const analytics = {
      total_credit_issued: customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0),
      total_credit_utilized: customers.reduce((sum, c) => sum + (c.credit_utilized || 0), 0),
      total_outstanding: customers.reduce((sum, c) => sum + (c.current_balance || 0), 0),
      customers_by_category: {},
      customers_by_status: {},
      utilization_rate: 0,
    };

    // Group by category
    customers.forEach(customer => {
      const category = customer.category || 'Regular';
      if (!analytics.customers_by_category[category]) {
        analytics.customers_by_category[category] = {
          count: 0,
          credit_limit: 0,
          credit_utilized: 0,
          outstanding: 0,
        };
      }
      analytics.customers_by_category[category].count++;
      analytics.customers_by_category[category].credit_limit += customer.credit_limit || 0;
      analytics.customers_by_category[category].credit_utilized += customer.credit_utilized || 0;
      analytics.customers_by_category[category].outstanding += customer.current_balance || 0;
    });

    // Group by status
    customers.forEach(customer => {
      const status = customer.credit_status || 'Active';
      if (!analytics.customers_by_status[status]) {
        analytics.customers_by_status[status] = {
          count: 0,
          credit_limit: 0,
          credit_utilized: 0,
          outstanding: 0,
        };
      }
      analytics.customers_by_status[status].count++;
      analytics.customers_by_status[status].credit_limit += customer.credit_limit || 0;
      analytics.customers_by_status[status].credit_utilized += customer.credit_utilized || 0;
      analytics.customers_by_status[status].outstanding += customer.current_balance || 0;
    });

    // Calculate utilization rate
    if (analytics.total_credit_issued > 0) {
      analytics.utilization_rate = (analytics.total_credit_utilized / analytics.total_credit_issued) * 100;
    }

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching credit analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch credit analytics' });
  }
});

export default router;