// @ts-nocheck
import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

// ===================== BILLING CYCLES ROUTES =====================

// Get all billing cycles
router.get('/cycles', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId } = req as any;
    
    if (!branchId) {
      res.status(400).json({ 
        success: false, 
        error: 'Branch ID is required' 
      });
      return;
    }

    const { data, error } = await supabase
      .from('billing_cycles')
      .select('*')
      .eq('branch_id', branchId)
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
router.post('/cycles', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId } = req as any;
    const user = (req as any).user;

    if (!branchId || !orgId) {
      res.status(400).json({ 
        success: false, 
        error: 'Branch ID and Organization ID are required' 
      });
      return;
    }

    const billingCycleData = {
      ...req.body,
      branch_id: branchId,
      organization_id: orgId,
      created_by: user?.id
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

// ===================== INVOICES ROUTES =====================

// Get all invoices with pagination and filters
router.get('/invoices', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId } = req as any;
    
    if (!branchId) {
      res.status(400).json({ 
        success: false, 
        error: 'Branch ID is required' 
      });
      return;
    }

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
        billing_cycles(name, type)
      `)
      .eq('branch_id', branchId)
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

// Test route to verify API is working
router.get('/test', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    res.json({ 
      success: true, 
      message: 'Billing API is working',
      user: {
        branchId: branchId,
        organizationId: orgId,
        userRole: role
      }
    });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Test failed' 
    });
  }
});

export default router;