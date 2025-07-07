import api from './api';

// Types
export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description?: string;
  parent_category_id?: string;
  category_type: 'direct' | 'indirect' | 'capital' | 'administrative';
  ledger_account_code?: string;
  is_tax_deductible: boolean;
  default_tax_rate: number;
  requires_approval: boolean;
  approval_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: ExpenseCategory[];
}

export interface ExpenseLineItem {
  id?: string;
  expense_id?: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  hsn_code?: string;
  sac_code?: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  branch_id: string;
  expense_number: string;
  expense_date: string;
  category_id: string;
  subcategory_id?: string;
  base_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'cheque' | 'upi' | 'pending';
  payment_reference?: string;
  payment_status: 'pending' | 'paid' | 'partial' | 'cancelled';
  paid_amount: number;
  paid_date?: string;
  vendor_name: string;
  vendor_id?: string;
  vendor_gstin?: string;
  vendor_pan?: string;
  bill_number?: string;
  bill_date?: string;
  has_supporting_document: boolean;
  document_url?: string;
  allocation_type?: 'general' | 'vehicle' | 'route' | 'booking' | 'driver' | 'branch';
  vehicle_id?: string;
  driver_id?: string;
  booking_id?: string;
  route_from?: string;
  route_to?: string;
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_end_date?: string;
  parent_expense_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Relations
  category?: ExpenseCategory;
  subcategory?: ExpenseCategory;
  vehicle?: any;
  driver?: any;
  vendor?: any;
  branch?: any;
  line_items?: ExpenseLineItem[];
}

export interface BudgetAllocation {
  id: string;
  organization_id: string;
  branch_id?: string;
  budget_year: number;
  budget_month?: number;
  budget_quarter?: number;
  category_id: string;
  budget_type: 'monthly' | 'quarterly' | 'yearly';
  allocated_amount: number;
  utilized_amount: number;
  committed_amount: number;
  available_amount: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
  utilization_percentage?: number;
  remaining_percentage?: number;
}

export interface ExpenseSummary {
  category_id: string;
  category_name: string;
  category_type: string;
  total_amount: number;
  count: number;
}

export interface ExpenseTrend {
  period: string;
  total: number;
  direct: number;
  indirect: number;
  administrative: number;
  capital: number;
}

// API Service
export const expenseService = {
  // Categories
  async getCategories(includeInactive = false) {
    const params = includeInactive ? { includeInactive: true } : {};
    const response = await api.get('/api/expenses/categories', { params });
    return response.data.data as ExpenseCategory[];
  },

  async createCategory(data: Partial<ExpenseCategory>) {
    const response = await api.post('/api/expenses/categories', data);
    return response.data.data as ExpenseCategory;
  },

  // Expenses
  async getExpenses(params?: {
    branch_id?: string;
    category_id?: string;
    start_date?: string;
    end_date?: string;
    payment_status?: string;
    approval_status?: string;
    vendor_id?: string;
    vehicle_id?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/api/expenses', { params });
    return response.data;
  },

  async getExpense(id: string) {
    const response = await api.get(`/api/expenses/${id}`);
    return response.data.data as Expense;
  },

  async createExpense(data: Partial<Expense>) {
    const response = await api.post('/api/expenses', data);
    return response.data.data as Expense;
  },

  async updateExpense(id: string, data: Partial<Expense>) {
    const response = await api.put(`/api/expenses/${id}`, data);
    return response.data.data as Expense;
  },

  async approveExpense(id: string, rejection_reason?: string) {
    const response = await api.post(`/api/expenses/${id}/approval`, {
      action: 'approve'
    });
    return response.data.data as Expense;
  },

  async rejectExpense(id: string, rejection_reason: string) {
    const response = await api.post(`/api/expenses/${id}/approval`, {
      action: 'reject',
      rejection_reason
    });
    return response.data.data as Expense;
  },

  async recordPayment(id: string, amount: number, payment_reference?: string, payment_date?: string) {
    const response = await api.post(`/api/expenses/${id}/payment`, {
      amount,
      payment_reference,
      payment_date
    });
    return response.data.data as Expense;
  },

  // Summary & Analytics
  async getSummaryByCategory(params?: {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const response = await api.get('/api/expenses/summary/by-category', { params });
    return response.data.data as ExpenseSummary[];
  },

  async getTrends(params?: {
    branch_id?: string;
    period?: 'monthly' | 'quarterly';
    months?: number;
  }) {
    const response = await api.get('/api/expenses/analytics/trends', { params });
    return response.data.data as ExpenseTrend[];
  },

  // Budgets
  async getBudgets(params?: {
    branch_id?: string;
    year?: number;
    month?: number;
    budget_type?: 'monthly' | 'quarterly' | 'yearly';
  }) {
    const response = await api.get('/api/expenses/budgets', { params });
    return response.data.data as BudgetAllocation[];
  },

  async createOrUpdateBudget(data: {
    budget_year: number;
    budget_month?: number;
    budget_quarter?: number;
    category_id: string;
    budget_type: 'monthly' | 'quarterly' | 'yearly';
    allocated_amount: number;
    notes?: string;
    branch_id?: string;
  }) {
    const response = await api.post('/api/expenses/budgets', data);
    return response.data.data as BudgetAllocation;
  },

  // Utility functions
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  getPaymentStatusColor(status: string): string {
    const colors = {
      paid: 'text-green-600 bg-green-50',
      pending: 'text-amber-600 bg-amber-50',
      partial: 'text-blue-600 bg-blue-50',
      cancelled: 'text-red-600 bg-red-50',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  },

  getApprovalStatusColor(status: string): string {
    const colors = {
      approved: 'text-green-600 bg-green-50',
      submitted: 'text-blue-600 bg-blue-50',
      draft: 'text-gray-600 bg-gray-50',
      rejected: 'text-red-600 bg-red-50',
      cancelled: 'text-gray-600 bg-gray-50',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  },

  getCategoryTypeColor(type: string): string {
    const colors = {
      direct: 'text-purple-600 bg-purple-50',
      indirect: 'text-blue-600 bg-blue-50',
      administrative: 'text-orange-600 bg-orange-50',
      capital: 'text-green-600 bg-green-50',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  },
};