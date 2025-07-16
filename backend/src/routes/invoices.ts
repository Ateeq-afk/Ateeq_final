import { Router } from 'express';
import { z } from 'zod';
import { invoiceService, InvoiceFilters } from '../services/invoiceService';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import fs from 'fs';
import path from 'path';

const router = Router();

// Validation schemas
const generateInvoiceSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  from_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid from_date'),
  to_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid to_date'),
  include_delivered_only: z.boolean().optional().default(false),
  include_paid_bookings: z.boolean().optional().default(false)
});

const invoicePreviewSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  from_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid from_date'),
  to_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid to_date'),
  include_delivered_only: z.boolean().optional().default(false),
  include_paid_bookings: z.boolean().optional().default(false)
});

// ===== INVOICE GENERATION ROUTES =====

// Preview invoice data before generation
router.post('/preview', requireOrgBranch, async (req, res) => {
  try {
    const parse = invoicePreviewSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input', 
        details: parse.error.errors 
      });
    }

    const { orgId, branchId } = req as any;
    
    const filters: InvoiceFilters = {
      ...parse.data,
      organization_id: orgId,
      branch_id: branchId
    };

    // Get bookings that would be included in the invoice
    const bookings = await invoiceService.getCustomerBookingsForInvoice(filters);
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No bookings found for the specified criteria',
        message: 'Try adjusting the date range or filter criteria'
      });
    }

    // Calculate preview totals
    let subtotal = 0;
    const items = bookings.map(booking => {
      const billing = booking.billing_details?.[0] || {};
      const amount = billing.total_amount || 0;
      subtotal += amount;
      
      return {
        lr_number: booking.lr_number,
        booking_date: booking.booking_date,
        from_station: booking.from_station?.name || '',
        to_station: booking.to_station?.name || '',
        articles: booking.articles?.length || 0,
        weight: booking.articles?.reduce((sum: number, article: any) => sum + (article.weight || 0), 0) || 0,
        total_amount: amount,
        status: booking.status,
        payment_status: booking.payment_status
      };
    });

    // Calculate GST (18% for transport services)
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    
    // Determine CGST+SGST vs IGST based on states
    const fromState = bookings[0]?.from_station?.state || '';
    const toState = bookings[0]?.to_station?.state || '';
    const isInterstate = fromState !== toState;

    const gstDetails = isInterstate ? {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total_tax: gstAmount
    } : {
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total_tax: gstAmount
    };

    const grandTotal = subtotal + gstDetails.total_tax;

    const previewData = {
      customer: bookings[0].customer,
      filters,
      summary: {
        total_bookings: bookings.length,
        date_range: {
          from: parse.data.from_date,
          to: parse.data.to_date
        },
        amounts: {
          subtotal,
          ...gstDetails,
          grand_total: grandTotal
        },
        interstate: isInterstate
      },
      items
    };

    res.json({
      success: true,
      data: previewData
    });

  } catch (error: any) {
    console.error('Invoice preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice preview'
    });
  }
});

// Generate invoice
router.post('/generate', requireOrgBranch, async (req, res) => {
  try {
    const parse = generateInvoiceSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input', 
        details: parse.error.errors 
      });
    }

    const { orgId, branchId, userId } = req as any;
    
    const filters: InvoiceFilters = {
      ...parse.data,
      organization_id: orgId,
      branch_id: branchId
    };


    // Generate the complete invoice
    const result = await invoiceService.generateInvoice(filters);

    res.json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoice_id: result.invoice_id,
        invoice_number: result.invoice_number,
        grand_total: result.grand_total,
        pdf_generated: true,
        notification_sent: true
      }
    });

  } catch (error: any) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate invoice'
    });
  }
});

// Get customer invoices
router.get('/customer/:customerId', requireOrgBranch, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { orgId } = req as any;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const invoices = await invoiceService.getCustomerInvoices(customerId, orgId);

    res.json({
      success: true,
      data: invoices
    });

  } catch (error: any) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch invoices'
    });
  }
});

// Download invoice PDF
router.get('/download/:invoiceId', requireOrgBranch, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { orgId } = req as any;

    // Get invoice details from database
    const { data: invoice, error } = await require('../supabaseClient').supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Check if PDF file exists
    const pdfPath = invoice.pdf_path;
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    // Set response headers for PDF download
    const fileName = path.basename(pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download invoice'
    });
  }
});

// Get all invoices for organization/branch
router.get('/', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    const { page = 1, limit = 20, status, customer_id, from_date, to_date } = req.query;

    let query = require('../supabaseClient').supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(id, name, mobile, email),
        invoice_items(count)
      `)
      .eq('organization_id', orgId);

    // Apply branch filter for non-admin users
    if (role !== 'admin' && role !== 'superadmin') {
      query = query.eq('branch_id', branchId);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }
    if (from_date) {
      query = query.gte('created_at', from_date);
    }
    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    // Pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch invoices'
    });
  }
});

// Update invoice status
router.put('/:invoiceId/status', requireOrgBranch, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;
    const { orgId } = req as any;

    if (!['generated', 'sent', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: generated, sent, paid, cancelled'
      });
    }

    const { data, error } = await require('../supabaseClient').supabase
      .from('invoices')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data
    });

  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update invoice status'
    });
  }
});

// Resend invoice notification
router.post('/:invoiceId/resend', requireOrgBranch, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { orgId } = req as any;

    // Get invoice details
    const { data: invoice, error } = await require('../supabaseClient').supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Create invoice data for sending
    const invoiceData = {
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer.name,
      customer_phone: invoice.customer.mobile,
      customer_email: invoice.customer.email,
      grand_total: invoice.grand_total,
      from_date: invoice.from_date,
      to_date: invoice.to_date,
      items: [] // Not needed for resend notification
    };

    // Resend notification
    await invoiceService.sendInvoice(invoiceData as any, invoice.pdf_path);

    res.json({
      success: true,
      message: 'Invoice notification sent successfully'
    });

  } catch (error: any) {
    console.error('Error resending invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resend invoice'
    });
  }
});

export default router;