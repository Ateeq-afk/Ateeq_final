import api from './api';

export interface BillingCycle {
  id: string;
  branch_id: string;
  organization_id: string;
  name: string;
  type: 'monthly' | 'weekly' | 'fortnightly' | 'quarterly' | 'custom';
  start_date: string;
  end_date: string;
  due_days: number;
  auto_generate: boolean;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
}

export interface Invoice {
  id: string;
  branch_id: string;
  organization_id: string;
  customer_id: string;
  billing_cycle_id?: string;
  invoice_number: string;
  invoice_type: 'regular' | 'supplementary' | 'credit_note' | 'debit_note';
  reference_invoice_id?: string;
  invoice_date: string;
  due_date: string;
  service_period_start?: string;
  service_period_end?: string;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  total_tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
  gstin?: string;
  place_of_supply?: string;
  reverse_charge: boolean;
  notes?: string;
  terms_and_conditions?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  customers?: any;
  billing_cycles?: any;
  invoice_line_items?: InvoiceLineItem[];
  payment_records?: PaymentRecord[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  booking_id?: string;
  description: string;
  hsn_sac_code?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
}

export interface SupplementaryBilling {
  id: string;
  branch_id: string;
  organization_id: string;
  customer_id: string;
  original_invoice_id?: string;
  reference_number: string;
  billing_date: string;
  reason: string;
  description?: string;
  charge_type: 'additional_service' | 'penalty' | 'adjustment' | 'extra_charge';
  amount: number;
  is_taxable: boolean;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'invoiced' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  customers?: any;
}

export interface CreditDebitNote {
  id: string;
  branch_id: string;
  organization_id: string;
  customer_id: string;
  original_invoice_id: string;
  note_number: string;
  note_type: 'credit' | 'debit';
  note_date: string;
  reason: string;
  description?: string;
  adjustment_type: 'discount' | 'return' | 'damage' | 'shortage' | 'rate_correction' | 'other';
  original_amount: number;
  adjustment_amount: number;
  tax_adjustment: number;
  total_adjustment: number;
  status: 'draft' | 'approved' | 'applied' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  customers?: any;
  original_invoice?: any;
}

export interface BulkBillingRun {
  id: string;
  branch_id: string;
  organization_id: string;
  billing_cycle_id?: string;
  run_name: string;
  run_date: string;
  billing_period_start: string;
  billing_period_end: string;
  customer_filter?: any;
  include_supplementary: boolean;
  auto_send_invoices: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_customers: number;
  processed_customers: number;
  successful_invoices: number;
  failed_invoices: number;
  total_invoice_amount: number;
  error_log?: string;
  processing_log?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  created_by: string;
  billing_cycles?: any;
}

export interface PaymentRecord {
  id: string;
  branch_id: string;
  organization_id: string;
  invoice_id: string;
  customer_id: string;
  payment_reference: string;
  payment_date: string;
  payment_method: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'dd' | 'other';
  amount: number;
  bank_name?: string;
  cheque_number?: string;
  transaction_id?: string;
  utr_number?: string;
  status: 'pending' | 'cleared' | 'bounced' | 'cancelled';
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  invoices?: any;
  customers?: any;
}

export interface BillingFilters {
  page?: number;
  limit?: number;
  status?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  invoice_type?: string;
}

export const billingService = {
  // ===================== BILLING CYCLES =====================
  
  getBillingCycles: async (): Promise<BillingCycle[]> => {
    const response = await api.get('/billing/cycles');
    return response.data;
  },

  createBillingCycle: async (data: Partial<BillingCycle>): Promise<BillingCycle> => {
    const response = await api.post('/billing/cycles', data);
    return response.data;
  },

  updateBillingCycle: async (id: string, data: Partial<BillingCycle>): Promise<BillingCycle> => {
    const response = await api.put(`/billing/cycles/${id}`, data);
    return response.data;
  },

  // ===================== INVOICES =====================
  
  getInvoices: async (filters?: BillingFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/billing/invoices?${params.toString()}`);
    return response.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/billing/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (data: {
    customer_id: string;
    billing_cycle_id?: string;
    invoice_date: string;
    due_date: string;
    line_items: Partial<InvoiceLineItem>[];
    notes?: string;
    terms_and_conditions?: string;
    payment_terms?: string;
  }): Promise<Invoice> => {
    const response = await api.post('/billing/invoices', data);
    return response.data;
  },

  updateInvoice: async (id: string, data: Partial<Invoice> & {
    line_items?: Partial<InvoiceLineItem>[];
  }): Promise<Invoice> => {
    const response = await api.put(`/billing/invoices/${id}`, data);
    return response.data;
  },

  generateInvoiceFromBookings: async (data: {
    customer_id: string;
    booking_ids: string[];
    billing_cycle_id?: string;
    invoice_date: string;
    due_date: string;
  }): Promise<Invoice> => {
    const response = await api.post('/billing/invoices/generate-from-bookings', data);
    return response.data;
  },

  // ===================== SUPPLEMENTARY BILLING =====================
  
  getSupplementaryBillings: async (filters?: {
    customer_id?: string;
    status?: string;
  }): Promise<SupplementaryBilling[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await api.get(`/billing/supplementary?${params.toString()}`);
    return response.data;
  },

  createSupplementaryBilling: async (data: {
    customer_id: string;
    original_invoice_id?: string;
    reason: string;
    description?: string;
    charge_type: string;
    amount: number;
    is_taxable?: boolean;
    tax_rate?: number;
  }): Promise<SupplementaryBilling> => {
    const response = await api.post('/billing/supplementary', data);
    return response.data;
  },

  approveSupplementaryBilling: async (id: string): Promise<SupplementaryBilling> => {
    const response = await api.put(`/billing/supplementary/${id}/approve`);
    return response.data;
  },

  // ===================== CREDIT/DEBIT NOTES =====================
  
  getCreditDebitNotes: async (filters?: {
    note_type?: 'credit' | 'debit';
    customer_id?: string;
    status?: string;
  }): Promise<CreditDebitNote[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await api.get(`/billing/credit-debit-notes?${params.toString()}`);
    return response.data;
  },

  createCreditDebitNote: async (data: {
    customer_id: string;
    original_invoice_id: string;
    note_type: 'credit' | 'debit';
    reason: string;
    description?: string;
    adjustment_type: string;
    original_amount: number;
    adjustment_amount: number;
    tax_adjustment?: number;
  }): Promise<CreditDebitNote> => {
    const response = await api.post('/billing/credit-debit-notes', data);
    return response.data;
  },

  // ===================== BULK BILLING =====================
  
  getBulkBillingRuns: async (): Promise<BulkBillingRun[]> => {
    const response = await api.get('/billing/bulk-runs');
    return response.data;
  },

  createBulkBillingRun: async (data: {
    billing_cycle_id?: string;
    run_name: string;
    billing_period_start: string;
    billing_period_end: string;
    customer_filter?: any;
    include_supplementary?: boolean;
    auto_send_invoices?: boolean;
  }): Promise<BulkBillingRun> => {
    const response = await api.post('/billing/bulk-runs', data);
    return response.data;
  },

  executeBulkBillingRun: async (id: string) => {
    const response = await api.post(`/billing/bulk-runs/${id}/execute`);
    return response.data;
  },

  // ===================== PAYMENTS =====================
  
  getPaymentRecords: async (filters?: {
    invoice_id?: string;
    customer_id?: string;
    status?: string;
  }): Promise<PaymentRecord[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await api.get(`/billing/payments?${params.toString()}`);
    return response.data;
  },

  recordPayment: async (data: {
    invoice_id: string;
    customer_id: string;
    payment_reference: string;
    payment_date: string;
    payment_method: string;
    amount: number;
    bank_name?: string;
    cheque_number?: string;
    transaction_id?: string;
    utr_number?: string;
    remarks?: string;
  }): Promise<PaymentRecord> => {
    const response = await api.post('/billing/payments', data);
    return response.data;
  },

  updatePaymentRecord: async (id: string, data: Partial<PaymentRecord>): Promise<PaymentRecord> => {
    const response = await api.put(`/billing/payments/${id}`, data);
    return response.data;
  },

  // ===================== UTILITY FUNCTIONS =====================
  
  calculateGST: (amount: number, rate: number, isIGST = false) => {
    const taxAmount = (amount * rate) / 100;
    if (isIGST) {
      return {
        cgst_rate: 0,
        cgst_amount: 0,
        sgst_rate: 0,
        sgst_amount: 0,
        igst_rate: rate,
        igst_amount: taxAmount,
        total_tax: taxAmount
      };
    } else {
      const halfRate = rate / 2;
      const halfAmount = taxAmount / 2;
      return {
        cgst_rate: halfRate,
        cgst_amount: halfAmount,
        sgst_rate: halfRate,
        sgst_amount: halfAmount,
        igst_rate: 0,
        igst_amount: 0,
        total_tax: taxAmount
      };
    }
  },

  calculateLineItemTotal: (lineItem: Partial<InvoiceLineItem>) => {
    const amount = (lineItem.quantity || 0) * (lineItem.rate || 0);
    const taxableValue = amount - (lineItem.discount_amount || 0);
    
    const gstCalculation = billingService.calculateGST(
      taxableValue,
      (lineItem.cgst_rate || 0) + (lineItem.sgst_rate || 0) + (lineItem.igst_rate || 0)
    );

    return {
      amount,
      taxable_value: taxableValue,
      ...gstCalculation,
      total_amount: taxableValue + gstCalculation.total_tax
    };
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  },

  formatInvoiceNumber: (number: string): string => {
    return number.replace(/^INV-/, 'Invoice #');
  }
};

export default billingService;