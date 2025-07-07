import { Router } from 'express';
import { customerSchema } from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { z } from 'zod';
import { branchCache, searchCache, invalidateCache } from '../middleware/cache';

const router = Router();

// Validation schemas
const updateCustomerSchema = customerSchema.partial();
const customerIdSchema = z.object({
  id: z.string().uuid('Invalid customer ID format')
});

// GET all customers with pagination and filtering
router.get('/', requireOrgBranch, searchCache(1200), async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    const { 
      page = '1', 
      pageSize = '10', 
      search = '', 
      type,
      sortBy = 'name',
      sortDirection = 'asc'
    } = req.query;

    let query = supabase
      .from('customers')
      .select('*, branch:branches(name, code)', { count: 'exact' })
      .eq('organization_id', orgId);
    
    // Role-based filtering
    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,gst.ilike.%${search}%`);
    }

    // Type filter
    if (type) {
      query = query.eq('type', type);
    }

    // Sorting
    query = query.order(sortBy as string, { ascending: sortDirection === 'asc' });

    // Pagination
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data: data || [],
      total: count || 0,
      page: pageNum,
      pageSize: pageSizeNum
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET single customer by ID
router.get('/:id', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    const { id } = req.params;

    // Validate ID
    const idValidation = customerIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    let query = supabase
      .from('customers')
      .select('*, branch:branches(name, code)')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single();

    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Customer not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST create new customer
router.post('/', requireOrgBranch, async (req, res) => {
  try {
    const parse = customerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid customer data', details: parse.error });
    }

    const payload = { ...parse.data };
    const { orgId, branchId, role } = req as any;
    payload['organization_id'] = orgId;
    
    if (role !== 'admin') {
      payload['branch_id'] = branchId;
    }

    // Check for duplicate mobile number in the same branch
    if (payload.mobile && payload.branch_id) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('branch_id', payload.branch_id)
        .eq('mobile', payload.mobile)
        .single();

      if (existing) {
        return res.status(409).json({ 
          error: 'A customer with this mobile number already exists for this branch' 
        });
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select('*, branch:branches(name, code)')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Failed to create customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT/PATCH update customer
router.put('/:id', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    const { id } = req.params;

    // Validate ID
    const idValidation = customerIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    // Validate update data
    const parse = updateCustomerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid update data', details: parse.error });
    }

    // Check if customer exists and user has permission
    let checkQuery = supabase
      .from('customers')
      .select('id, branch_id')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single();

    if (role !== 'admin') {
      checkQuery = checkQuery.eq('branch_id', branchId);
    }

    const { data: existingCustomer, error: checkError } = await checkQuery;
    if (checkError || !existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check for duplicate mobile if updating
    if (parse.data.mobile && parse.data.branch_id) {
      const { data: duplicate } = await supabase
        .from('customers')
        .select('id')
        .eq('branch_id', parse.data.branch_id)
        .eq('mobile', parse.data.mobile)
        .neq('id', id)
        .single();

      if (duplicate) {
        return res.status(409).json({ 
          error: 'A customer with this mobile number already exists for this branch' 
        });
      }
    }

    // Update customer
    const { data, error } = await supabase
      .from('customers')
      .update(parse.data)
      .eq('id', id)
      .select('*, branch:branches(name, code)')
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Failed to update customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// PATCH partial update (same as PUT but more semantic)
router.patch('/:id', requireOrgBranch, async (req, res) => {
  return router.put('/:id', requireOrgBranch, async () => {})(req, res);
});

// DELETE customer
router.delete('/:id', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    const { id } = req.params;

    // Validate ID
    const idValidation = customerIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    // Check if customer exists and user has permission
    let checkQuery = supabase
      .from('customers')
      .select('id')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single();

    if (role !== 'admin') {
      checkQuery = checkQuery.eq('branch_id', branchId);
    }

    const { data: existingCustomer, error: checkError } = await checkQuery;
    if (checkError || !existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has bookings
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${id},receiver_id.eq.${id}`);

    if (countError) throw countError;

    if (count && count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete customer with existing bookings' 
      });
    }

    // Delete customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// GET customer statistics
router.get('/stats/summary', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;

    let query = supabase
      .from('customers')
      .select('type, credit_limit', { count: 'exact' })
      .eq('organization_id', orgId);

    if (role !== 'admin') {
      query = query.eq('branch_id', branchId);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const stats = {
      totalCustomers: count || 0,
      individualCustomers: 0,
      companyCustomers: 0,
      totalCreditIssued: 0,
      averageCreditLimit: 0
    };

    if (data && data.length > 0) {
      data.forEach(customer => {
        if (customer.type === 'individual') {
          stats.individualCustomers++;
        } else {
          stats.companyCustomers++;
        }
        stats.totalCreditIssued += customer.credit_limit || 0;
      });

      stats.averageCreditLimit = stats.totalCreditIssued / stats.totalCustomers;
    }

    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer statistics' });
  }
});

export default router;
