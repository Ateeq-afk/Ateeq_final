import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const expenseSchema = z.object({
  expense_date: z.string(),
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid().optional(),
  base_amount: z.number().positive(),
  tax_amount: z.number().min(0).default(0),
  total_amount: z.number().positive(),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'cheque', 'upi', 'pending']),
  payment_reference: z.string().optional(),
  vendor_name: z.string().min(1),
  vendor_id: z.string().uuid().optional(),
  vendor_gstin: z.string().optional(),
  bill_number: z.string().optional(),
  bill_date: z.string().optional(),
  allocation_type: z.enum(['general', 'vehicle', 'route', 'booking', 'driver', 'branch']).optional(),
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  route_from: z.string().optional(),
  route_to: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurring_end_date: z.string().optional(),
  line_items: z.array(z.object({
    item_description: z.string().min(1),
    quantity: z.number().positive().default(1),
    unit_price: z.number().positive(),
    amount: z.number().positive(),
    tax_rate: z.number().min(0).default(0),
    tax_amount: z.number().min(0).default(0),
    total_amount: z.number().positive(),
    hsn_code: z.string().optional(),
    sac_code: z.string().optional(),
  })).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  parent_category_id: z.string().uuid().optional(),
  category_type: z.enum(['direct', 'indirect', 'capital', 'administrative']),
  ledger_account_code: z.string().optional(),
  is_tax_deductible: z.boolean().default(true),
  default_tax_rate: z.number().min(0).max(100).default(0),
  requires_approval: z.boolean().default(false),
  approval_limit: z.number().min(0).optional(),
});

const budgetSchema = z.object({
  budget_year: z.number().int().min(2020).max(2050),
  budget_month: z.number().int().min(1).max(12).optional(),
  budget_quarter: z.number().int().min(1).max(4).optional(),
  category_id: z.string().uuid(),
  budget_type: z.enum(['monthly', 'quarterly', 'yearly']),
  allocated_amount: z.number().min(0),
  notes: z.string().optional(),
});

// Get expense categories
router.get('/categories', async (req: any, res: Response) => {
  try {
    const { organizationId } = req;
    const { includeInactive } = req.query;

    let query = supabase
      .from('expense_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('category_type', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    data?.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, subcategories: [] });
    });

    data?.forEach(cat => {
      if (cat.parent_category_id) {
        const parent = categoryMap.get(cat.parent_category_id);
        if (parent) {
          parent.subcategories.push(categoryMap.get(cat.id));
        }
      } else {
        rootCategories.push(categoryMap.get(cat.id));
      }
    });

    res.json({ success: true, data: rootCategories });
  } catch (error: any) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expense categories',
      details: error.message 
    });
  }
});

// Create expense category
router.post('/categories', async (req: any, res: Response) => {
  try {
    const { organizationId, userId } = req;
    const validatedData = categorySchema.parse(req.body);

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating expense category:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create expense category',
      details: error.message 
    });
  }
});

// Get all expenses with filters
router.get('/', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { 
      branch_id,
      category_id,
      start_date,
      end_date,
      payment_status,
      approval_status,
      vendor_id,
      vehicle_id,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories!category_id(name, code, category_type),
        subcategory:expense_categories!subcategory_id(name, code),
        vendor:customers!vendor_id(name, mobile),
        vehicle:vehicles!vehicle_id(registration_number),
        driver:drivers!driver_id(name),
        created_by_user:users!created_by(name),
        approved_by_user:users!approved_by(name)
      `, { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (branch_id || branchId) {
      query = query.eq('branch_id', branch_id || branchId);
    }
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    if (start_date) {
      query = query.gte('expense_date', start_date);
    }
    if (end_date) {
      query = query.lte('expense_date', end_date);
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }
    if (approval_status) {
      query = query.eq('approval_status', approval_status);
    }
    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id);
    }
    if (vehicle_id) {
      query = query.eq('vehicle_id', vehicle_id);
    }

    query = query
      .order('expense_date', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      data,
      pagination: {
        total: count || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expenses',
      details: error.message 
    });
  }
});

// Get single expense with details
router.get('/:id', async (req: any, res: Response) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories!category_id(name, code, category_type),
        subcategory:expense_categories!subcategory_id(name, code),
        vendor:customers!vendor_id(name, mobile, gstin),
        vehicle:vehicles!vehicle_id(registration_number, vehicle_number),
        driver:drivers!driver_id(name, employee_code),
        branch:branches!branch_id(name, code)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (expenseError) throw expenseError;

    // Get line items if any
    const { data: lineItems, error: lineError } = await supabase
      .from('expense_line_items')
      .select('*')
      .eq('expense_id', id)
      .order('created_at');

    if (lineError) throw lineError;

    res.json({ 
      success: true, 
      data: {
        ...expense,
        line_items: lineItems || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expense',
      details: error.message 
    });
  }
});

// Create new expense
router.post('/', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId, userId } = req;
    const validatedData = expenseSchema.parse(req.body);

    const { line_items, ...expenseData } = validatedData;

    // Start transaction
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        ...expenseData,
        organization_id: organizationId,
        branch_id: branchId,
        created_by: userId,
        updated_by: userId,
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Insert line items if provided
    if (line_items && line_items.length > 0) {
      const lineItemsData = line_items.map(item => ({
        ...item,
        expense_id: expense.id,
      }));

      const { error: lineError } = await supabase
        .from('expense_line_items')
        .insert(lineItemsData);

      if (lineError) throw lineError;
    }

    res.json({ success: true, data: expense });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create expense',
      details: error.message 
    });
  }
});

// Update expense
router.put('/:id', async (req: any, res: Response) => {
  try {
    const { organizationId, userId } = req;
    const { id } = req.params;
    const updates = req.body;

    // Check if expense exists and belongs to organization
    const { data: existing } = await supabase
      .from('expenses')
      .select('approval_status')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Expense not found' 
      });
    }

    if (existing.approval_status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot update approved expense' 
      });
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update expense',
      details: error.message 
    });
  }
});

// Approve/Reject expense
router.post('/:id/approval', async (req: any, res: Response) => {
  try {
    const { organizationId, userId } = req;
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid action' 
      });
    }

    const updates: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      [action === 'approve' ? 'approved_by' : 'rejected_by']: userId,
      [action === 'approve' ? 'approved_at' : 'rejected_at']: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (action === 'reject' && rejection_reason) {
      updates.rejection_reason = rejection_reason;
    }

    if (action === 'approve') {
      updates.payment_status = 'pending';
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error processing expense approval:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process expense approval',
      details: error.message 
    });
  }
});

// Record payment for expense
router.post('/:id/payment', async (req: any, res: Response) => {
  try {
    const { organizationId, userId } = req;
    const { id } = req.params;
    const { amount, payment_reference, payment_date } = req.body;

    const { data: expense } = await supabase
      .from('expenses')
      .select('total_amount, paid_amount')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        error: 'Expense not found' 
      });
    }

    const newPaidAmount = (expense.paid_amount || 0) + amount;
    const paymentStatus = newPaidAmount >= expense.total_amount ? 'paid' : 'partial';

    const { data, error } = await supabase
      .from('expenses')
      .update({
        paid_amount: newPaidAmount,
        payment_status: paymentStatus,
        payment_reference,
        paid_date: payment_date || new Date().toISOString(),
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error recording expense payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record expense payment',
      details: error.message 
    });
  }
});

// Get expense summary by category
router.get('/summary/by-category', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { branch_id, start_date, end_date } = req.query;

    const targetBranch = branch_id || branchId;

    let query = supabase
      .from('expenses')
      .select('category_id, total_amount, expense_categories!category_id(name, category_type)')
      .eq('organization_id', organizationId)
      .eq('approval_status', 'approved');

    if (targetBranch) {
      query = query.eq('branch_id', targetBranch);
    }
    if (start_date) {
      query = query.gte('expense_date', start_date);
    }
    if (end_date) {
      query = query.lte('expense_date', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by category
    const summary = data?.reduce((acc: any, expense: any) => {
      const categoryId = expense.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category_id: categoryId,
          category_name: expense.expense_categories.name,
          category_type: expense.expense_categories.category_type,
          total_amount: 0,
          count: 0,
        };
      }
      acc[categoryId].total_amount += expense.total_amount || 0;
      acc[categoryId].count += 1;
      return acc;
    }, {});

    const summaryArray = Object.values(summary || {}).sort((a: any, b: any) => 
      b.total_amount - a.total_amount
    );

    res.json({ success: true, data: summaryArray });
  } catch (error: any) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expense summary',
      details: error.message 
    });
  }
});

// Get budget allocations
router.get('/budgets', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { branch_id, year, month, budget_type } = req.query;

    const targetBranch = branch_id || branchId;

    let query = supabase
      .from('budget_allocations')
      .select(`
        *,
        category:expense_categories!category_id(name, code, category_type)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (targetBranch) {
      query = query.eq('branch_id', targetBranch);
    }
    if (year) {
      query = query.eq('budget_year', year);
    }
    if (month) {
      query = query.eq('budget_month', month);
    }
    if (budget_type) {
      query = query.eq('budget_type', budget_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate utilization percentage
    const budgetsWithUtilization = data?.map(budget => ({
      ...budget,
      utilization_percentage: budget.allocated_amount > 0 
        ? ((budget.utilized_amount || 0) / budget.allocated_amount) * 100 
        : 0,
      remaining_percentage: budget.allocated_amount > 0 
        ? ((budget.available_amount || 0) / budget.allocated_amount) * 100 
        : 0,
    }));

    res.json({ success: true, data: budgetsWithUtilization });
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch budgets',
      details: error.message 
    });
  }
});

// Create/Update budget allocation
router.post('/budgets', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId, userId } = req;
    const validatedData = budgetSchema.parse(req.body);

    const branch_id = req.body.branch_id || branchId;

    const { data, error } = await supabase
      .from('budget_allocations')
      .upsert({
        ...validatedData,
        organization_id: organizationId,
        branch_id,
        created_by: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,branch_id,budget_year,budget_month,category_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating/updating budget:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create/update budget',
      details: error.message 
    });
  }
});

// Get expense trends
router.get('/analytics/trends', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { branch_id, period = 'monthly', months = 6 } = req.query;

    const targetBranch = branch_id || branchId;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - Number(months));

    const { data, error } = await supabase
      .from('expenses')
      .select('expense_date, total_amount, category_id, expense_categories!category_id(category_type)')
      .eq('organization_id', organizationId)
      .eq('approval_status', 'approved')
      .gte('expense_date', startDate.toISOString())
      .lte('expense_date', endDate.toISOString());

    if (error) throw error;

    // Group by period and category type
    const trends = data?.reduce((acc: any, expense: any) => {
      const date = new Date(expense.expense_date);
      const periodKey = period === 'monthly' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;

      if (!acc[periodKey]) {
        acc[periodKey] = {
          period: periodKey,
          total: 0,
          direct: 0,
          indirect: 0,
          administrative: 0,
          capital: 0,
        };
      }

      const categoryType = expense.expense_categories.category_type;
      acc[periodKey].total += expense.total_amount || 0;
      acc[periodKey][categoryType] += expense.total_amount || 0;

      return acc;
    }, {});

    const trendsArray = Object.values(trends || {}).sort((a: any, b: any) => 
      a.period.localeCompare(b.period)
    );

    res.json({ success: true, data: trendsArray });
  } catch (error: any) {
    console.error('Error fetching expense trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expense trends',
      details: error.message 
    });
  }
});

export default router;