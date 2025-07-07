import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { supabase } from '../supabaseClient';
import { validateCustomerBelongsToOrg } from '../utils/branchValidation';

interface AuthenticatedRequest extends Request {
  user?: any;
  organizationId?: string;
  branchId?: string;
  userRole?: string;
  selectedBranch?: string;
}

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// ===================== BILLING CYCLES ROUTES =====================

// Get all billing cycles
router.get('/cycles', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const branch_id = req.branchId;
    
    const { data, error } = await supabase
      .from('billing_cycles')
      .select('*')
      .eq('branch_id', branch_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching billing cycles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch billing cycles' 
    });
  }
});

// Create billing cycle
router.post('/cycles', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;
    const billingCycleData = {
      ...req.body,
      branch_id,
      organization_id,
      created_by: user_id
    };

    const { data, error } = await supabase
      .from('billing_cycles')
      .insert(billingCycleData)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating billing cycle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create billing cycle' 
    });
  }
});

// Update billing cycle
router.put('/cycles/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.branchId;

    const { data, error } = await supabase
      .from('billing_cycles')
      .update(req.body)
      .eq('id', id)
      .eq('branch_id', branch_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating billing cycle:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update billing cycle' 
    });
  }
});

// ===================== INVOICES ROUTES =====================

// Get all invoices with pagination and filters
router.get('/invoices', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      customer_id, 
      date_from, 
      date_to,
      invoice_type = 'regular'
    } = req.query;

    let query = supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(name, phone, email, gstin),
        billing_cycles(name, type),
        invoice_line_items(*)
      `)
      .eq('branch_id', branch_id)
      .eq('is_deleted', false)
      .eq('invoice_type', invoice_type);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (date_from) query = query.gte('invoice_date', date_from);
    if (date_to) query = query.lte('invoice_date', date_to);

    // Apply pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });

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
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch invoices' 
    });
  }
});

// Get single invoice with full details
router.get('/invoices/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.branchId;

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(name, phone, email, address, city, state, pincode, gstin),
        billing_cycles(name, type),
        invoice_line_items(*),
        payment_records(*)
      `)
      .eq('id', id)
      .eq('branch_id', branch_id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch invoice' 
    });
  }
});

// Create invoice
router.post('/invoices', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;
    const { line_items, ...invoiceData } = req.body;

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = lastInvoice?.[0]?.invoice_number?.match(/\d+$/)?.[0] || '0';
    const nextNumber = String(parseInt(lastNumber) + 1).padStart(6, '0');
    const invoice_number = `INV-${nextNumber}`;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_number,
        branch_id,
        organization_id,
        created_by: user_id
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create line items if provided
    if (line_items && line_items.length > 0) {
      const lineItemsData = line_items.map((item: any) => ({
        ...item,
        invoice_id: invoice.id
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;
    }

    // Fetch complete invoice data
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(name, phone, email),
        invoice_line_items(*)
      `)
      .eq('id', invoice.id)
      .single();

    if (fetchError) throw fetchError;

    res.json({ success: true, data: completeInvoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create invoice' 
    });
  }
});

// Update invoice
router.put('/invoices/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.branchId;
    const { line_items, ...invoiceData } = req.body;

    // Update invoice
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .eq('branch_id', branch_id)
      .select()
      .single();

    if (error) throw error;

    // Update line items if provided
    if (line_items) {
      // Delete existing line items
      await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', id);

      // Insert new line items
      if (line_items.length > 0) {
        const lineItemsData = line_items.map((item: any) => ({
          ...item,
          invoice_id: id
        }));

        await supabase
          .from('invoice_line_items')
          .insert(lineItemsData);
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update invoice' 
    });
  }
});

// Generate invoice from bookings
router.post('/invoices/generate-from-bookings', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;
    const { customer_id, booking_ids, billing_cycle_id, invoice_date, due_date } = req.body;
    const role = req.userRole;

    // Validate customer belongs to organization
    const isValidCustomer = await validateCustomerBelongsToOrg(customer_id, organization_id);
    if (!isValidCustomer) {
      return res.status(403).json({
        success: false,
        error: 'Invalid customer access'
      });
    }

    // Fetch bookings with their details
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        *,
        articles(*),
        customers!inner(*)
      `)
      .in('id', booking_ids)
      .eq('customer_id', customer_id)
      .eq('organization_id', organization_id);
    
    // Non-admins can only access their branch bookings
    if (role !== 'admin' && role !== 'superadmin') {
      bookingsQuery = bookingsQuery.eq('branch_id', branch_id);
    }
    
    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) throw bookingsError;

    if (!bookings || bookings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid bookings found'
      });
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = lastInvoice?.[0]?.invoice_number?.match(/\d+$/)?.[0] || '0';
    const nextNumber = String(parseInt(lastNumber) + 1).padStart(6, '0');
    const invoice_number = `INV-${nextNumber}`;

    // Create invoice
    const customer = bookings[0].customers;
    const invoiceData = {
      invoice_number,
      customer_id,
      billing_cycle_id,
      invoice_date,
      due_date,
      branch_id,
      organization_id,
      created_by: user_id,
      gstin: customer.gstin,
      place_of_supply: customer.state,
      status: 'draft'
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create line items from bookings
    const lineItems = bookings.map(booking => ({
      invoice_id: invoice.id,
      booking_id: booking.id,
      description: `Freight charges for LR No: ${booking.lr_number}`,
      quantity: 1,
      rate: booking.total_amount || 0,
      amount: booking.total_amount || 0,
      taxable_value: booking.taxable_amount || booking.total_amount || 0,
      cgst_rate: booking.cgst_rate || 0,
      cgst_amount: booking.cgst_amount || 0,
      sgst_rate: booking.sgst_rate || 0,
      sgst_amount: booking.sgst_amount || 0,
      igst_rate: booking.igst_rate || 0,
      igst_amount: booking.igst_amount || 0,
      total_amount: booking.total_amount || 0
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItems);

    if (lineItemsError) throw lineItemsError;

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error generating invoice from bookings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate invoice from bookings' 
    });
  }
});

// ===================== SUPPLEMENTARY BILLING ROUTES =====================

// Get supplementary billings
router.get('/supplementary', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const { customer_id, status } = req.query;

    let query = supabase
      .from('supplementary_billings')
      .select(`
        *,
        customers!inner(name, phone, email)
      `)
      .eq('branch_id', branch_id)
      .eq('is_deleted', false);

    if (customer_id) query = query.eq('customer_id', customer_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching supplementary billings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch supplementary billings' 
    });
  }
});

// Create supplementary billing
router.post('/supplementary', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;

    // Generate reference number
    const { data: lastSupp } = await supabase
      .from('supplementary_billings')
      .select('reference_number')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = lastSupp?.[0]?.reference_number?.match(/\d+$/)?.[0] || '0';
    const nextNumber = String(parseInt(lastNumber) + 1).padStart(6, '0');
    const reference_number = `SUP-${nextNumber}`;

    const suppData = {
      ...req.body,
      reference_number,
      branch_id,
      organization_id,
      created_by: user_id
    };

    const { data, error } = await supabase
      .from('supplementary_billings')
      .insert(suppData)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating supplementary billing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create supplementary billing' 
    });
  }
});

// Approve supplementary billing
router.put('/supplementary/:id/approve', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.branchId;
    const user_id = req.user?.id;

    const { data, error } = await supabase
      .from('supplementary_billings')
      .update({
        status: 'approved',
        approved_by: user_id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('branch_id', branch_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error approving supplementary billing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to approve supplementary billing' 
    });
  }
});

// ===================== CREDIT/DEBIT NOTES ROUTES =====================

// Get credit/debit notes
router.get('/credit-debit-notes', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const { note_type, customer_id, status } = req.query;

    let query = supabase
      .from('credit_debit_notes')
      .select(`
        *,
        customers!inner(name, phone, email),
        original_invoice:invoices!credit_debit_notes_original_invoice_id_fkey(invoice_number, total_amount)
      `)
      .eq('branch_id', branch_id)
      .eq('is_deleted', false);

    if (note_type) query = query.eq('note_type', note_type);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching credit/debit notes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch credit/debit notes' 
    });
  }
});

// Create credit/debit note
router.post('/credit-debit-notes', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;
    const { note_type } = req.body;

    // Generate note number
    const prefix = note_type === 'credit' ? 'CR' : 'DR';
    const { data: lastNote } = await supabase
      .from('credit_debit_notes')
      .select('note_number')
      .eq('organization_id', organization_id)
      .eq('note_type', note_type)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = lastNote?.[0]?.note_number?.match(/\d+$/)?.[0] || '0';
    const nextNumber = String(parseInt(lastNumber) + 1).padStart(6, '0');
    const note_number = `${prefix}-${nextNumber}`;

    const noteData = {
      ...req.body,
      note_number,
      branch_id,
      organization_id,
      created_by: user_id
    };

    const { data, error } = await supabase
      .from('credit_debit_notes')
      .insert(noteData)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating credit/debit note:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create credit/debit note' 
    });
  }
});

// ===================== BULK BILLING ROUTES =====================

// Get bulk billing runs
router.get('/bulk-runs', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;

    const { data, error } = await supabase
      .from('bulk_billing_runs')
      .select(`
        *,
        billing_cycles(name, type)
      `)
      .eq('branch_id', branch_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching bulk billing runs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bulk billing runs' 
    });
  }
});

// Create bulk billing run
router.post('/bulk-runs', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;

    const runData = {
      ...req.body,
      branch_id,
      organization_id,
      created_by: user_id,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('bulk_billing_runs')
      .insert(runData)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating bulk billing run:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create bulk billing run' 
    });
  }
});

// Execute bulk billing run
router.post('/bulk-runs/:id/execute', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;

    // Get the bulk run details
    const { data: bulkRun, error: bulkRunError } = await supabase
      .from('bulk_billing_runs')
      .select('*')
      .eq('id', id)
      .eq('branch_id', branch_id)
      .single();

    if (bulkRunError) throw bulkRunError;

    // Update status to processing
    await supabase
      .from('bulk_billing_runs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', id);

    // This would typically be a background job
    // For now, we'll return success and let the client poll for updates
    res.json({ 
      success: true, 
      message: 'Bulk billing run started',
      data: { id, status: 'processing' }
    });

    // TODO: Implement actual bulk processing logic in a background job
  } catch (error) {
    console.error('Error executing bulk billing run:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to execute bulk billing run' 
    });
  }
});

// ===================== PAYMENT RECORDS ROUTES =====================

// Get payment records
router.get('/payments', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const { invoice_id, customer_id, status } = req.query;

    let query = supabase
      .from('payment_records')
      .select(`
        *,
        invoices!inner(invoice_number, total_amount),
        customers!inner(name, phone, email)
      `)
      .eq('branch_id', branch_id);

    if (invoice_id) query = query.eq('invoice_id', invoice_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching payment records:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payment records' 
    });
  }
});

// Record payment
router.post('/payments', async (req: AuthenticatedRequest, res) => {
  try {
    const branch_id = req.branchId;
    const organization_id = req.organizationId;
    const user_id = req.user?.id;

    const paymentData = {
      ...req.body,
      branch_id,
      organization_id,
      created_by: user_id
    };

    const { data, error } = await supabase
      .from('payment_records')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record payment' 
    });
  }
});

// Update payment status
router.put('/payments/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const branch_id = req.branchId;

    const { data, error } = await supabase
      .from('payment_records')
      .update(req.body)
      .eq('id', id)
      .eq('branch_id', branch_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update payment' 
    });
  }
});

export default router;