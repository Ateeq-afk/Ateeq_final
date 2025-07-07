import api from './api';
import { getMockOutstandingAmounts } from './mockOutstandingData';

export interface PaymentMode {
  id: string;
  name: string;
  type: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  requires_reference: boolean;
  description?: string;
  is_active: boolean;
}

export interface Payment {
  id: string;
  branch_id: string;
  organization_id: string;
  payment_number: string;
  payment_mode_id: string;
  payment_reference?: string;
  amount: number;
  payment_date: string;
  payer_name: string;
  payer_type: 'customer' | 'vendor' | 'employee' | 'other';
  payer_id?: string;
  purpose: 'booking_payment' | 'advance' | 'balance' | 'freight' | 'detention' | 'other';
  description?: string;
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  ifsc_code?: string;
  status: 'pending' | 'cleared' | 'bounced' | 'cancelled';
  cleared_date?: string;
  bounced_reason?: string;
  receipt_number?: string;
  receipt_generated_at?: string;
  receipt_path?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  allocation_type: 'booking' | 'invoice' | 'advance' | 'outstanding';
  reference_id?: string;
  reference_number?: string;
  allocated_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface OutstandingAmount {
  id: string;
  customer_id: string;
  customer_name?: string;
  contact_phone?: string;
  branch_id: string;
  organization_id: string;
  reference_type: 'booking' | 'invoice' | 'advance' | 'other';
  reference_number: string;
  original_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string;
  overdue_days: number;
  aging_bucket: 'current' | '1-30_days' | '31-60_days' | '61-90_days' | '90+_days';
  status: 'pending' | 'partially_paid' | 'fully_paid' | 'written_off';
  oldest_outstanding_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
}

export interface PaymentReminder {
  id: string;
  customer_id: string;
  reminder_type: 'sms' | 'email' | 'whatsapp' | 'call';
  reminder_date: string;
  subject?: string;
  message: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  failed_reason?: string;
  customer_response?: string;
  response_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  payment_mode_id: string;
  payment_reference?: string;
  amount: number;
  payment_date: string;
  payer_name: string;
  payer_type: 'customer' | 'vendor' | 'employee' | 'other';
  payer_id?: string;
  purpose: 'booking_payment' | 'advance' | 'balance' | 'freight' | 'detention' | 'other';
  description?: string;
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  ifsc_code?: string;
}

export interface PaymentFilters {
  status?: string;
  payer_type?: string;
  purpose?: string;
  from_date?: string;
  to_date?: string;
  payer_id?: string;
  payment_mode_id?: string;
  page?: number;
  limit?: number;
}

export interface OutstandingFilters {
  branch_id?: string;
  customer_id?: string;
  status?: string;
  aging_bucket?: string;
  customer_search?: string;
  min_amount?: number;
  max_amount?: number;
  overdue_days?: number;
  page?: number;
  limit?: number;
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  pendingAmount: number;
  clearedAmount: number;
  paymentsByMode: Array<{ mode: string; count: number; amount: number }>;
  paymentsByPurpose: Array<{ purpose: string; count: number; amount: number }>;
  recentPayments: Payment[];
  topPayers: Array<{ payer_name: string; total_amount: number; payment_count: number }>;
}

export const paymentService = {
  // Payment Modes
  async getPaymentModes(): Promise<PaymentMode[]> {
    const response = await api.get('/api/payments/modes');
    return response.data.data;
  },

  // Payments
  async getPayments(filters: PaymentFilters = {}): Promise<{ data: Payment[]; pagination: any }> {
    const response = await api.get('/api/payments', { params: filters });
    return { data: response.data.data, pagination: response.data.pagination };
  },

  async getPaymentById(id: string): Promise<Payment> {
    const response = await api.get(`/api/payments/${id}`);
    return response.data.data;
  },

  async createPayment(payment: CreatePaymentRequest): Promise<Payment> {
    const response = await api.post('/api/payments', payment);
    return response.data.data;
  },

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const response = await api.put(`/api/payments/${id}`, updates);
    return response.data.data;
  },

  async deletePayment(id: string): Promise<void> {
    await api.delete(`/api/payments/${id}`);
  },

  // Payment Allocations
  async allocatePayment(paymentId: string, allocations: Array<Omit<PaymentAllocation, 'id' | 'payment_id' | 'created_at' | 'updated_at'>>): Promise<PaymentAllocation[]> {
    const response = await api.post(`/api/payments/${paymentId}/allocate`, { allocations });
    return response.data.data;
  },

  async getPaymentAllocations(paymentId: string): Promise<PaymentAllocation[]> {
    const response = await api.get(`/api/payments/${paymentId}/allocations`);
    return response.data.data;
  },

  async removeAllocation(paymentId: string, allocationId: string): Promise<void> {
    await api.delete(`/api/payments/${paymentId}/allocations/${allocationId}`);
  },

  // Outstanding Amounts
  async getOutstandingAmounts(filters: OutstandingFilters = {}): Promise<{ data: OutstandingAmount[]; pagination: any }> {
    try {
      const response = await api.get('/api/payments/outstanding', { params: filters });
      return { data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      // If API is not available, return mock data
      console.warn('API not available, using mock outstanding amounts data');
      return getMockOutstandingAmounts(filters);
    }
  },

  async createOutstandingAmount(data: Omit<OutstandingAmount, 'id' | 'outstanding_amount' | 'overdue_days' | 'created_at' | 'updated_at' | 'created_by' | 'is_deleted'>): Promise<OutstandingAmount> {
    const response = await api.post('/api/payments/outstanding', data);
    return response.data.data;
  },

  async updateOutstandingAmount(id: string, updates: Partial<OutstandingAmount>): Promise<OutstandingAmount> {
    try {
      const response = await api.put(`/api/payments/outstanding/${id}`, updates);
      return response.data.data;
    } catch (error) {
      // For mock data, just return a simulated update
      console.warn('API not available, simulating outstanding amount update');
      return {
        id,
        customer_id: 'mock-customer',
        customer_name: 'Mock Customer',
        branch_id: 'mock-branch',
        organization_id: 'mock-org',
        reference_type: 'booking',
        reference_number: 'MOCK-001',
        original_amount: 10000,
        paid_amount: 5000,
        outstanding_amount: 5000,
        due_date: new Date().toISOString().split('T')[0],
        overdue_days: 0,
        aging_bucket: 'current',
        status: 'partially_paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        is_deleted: false,
        ...updates
      } as OutstandingAmount;
    }
  },

  // Payment Reminders
  async getPaymentReminders(customerId?: string): Promise<PaymentReminder[]> {
    try {
      const params = customerId ? { customer_id: customerId } : {};
      const response = await api.get('/api/payments/reminders', { params });
      return response.data.data;
    } catch (error) {
      console.warn('API not available, returning empty payment reminders');
      return [];
    }
  },

  async createPaymentReminder(reminder: Omit<PaymentReminder, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentReminder> {
    const response = await api.post('/api/payments/reminders', reminder);
    return response.data.data;
  },

  async updatePaymentReminder(id: string, updates: Partial<PaymentReminder>): Promise<PaymentReminder> {
    const response = await api.put(`/api/payments/reminders/${id}`, updates);
    return response.data.data;
  },

  async cancelPaymentReminder(id: string): Promise<void> {
    await api.post(`/api/payments/reminders/${id}/cancel`);
  },

  // Analytics
  async getPaymentAnalytics(filters: { from_date?: string; to_date?: string } = {}): Promise<PaymentAnalytics> {
    try {
      const response = await api.get('/api/payments/analytics', { params: filters });
      return response.data.data;
    } catch (error) {
      console.warn('API not available, returning mock payment analytics');
      return {
        totalPayments: 125,
        totalAmount: 2850000,
        pendingAmount: 485000,
        clearedAmount: 2365000,
        paymentsByMode: [
          { mode: 'Cash', count: 45, amount: 650000 },
          { mode: 'Bank Transfer', count: 60, amount: 1800000 },
          { mode: 'Cheque', count: 20, amount: 400000 }
        ],
        paymentsByPurpose: [
          { purpose: 'Freight', count: 80, amount: 2000000 },
          { purpose: 'Advance', count: 25, amount: 500000 },
          { purpose: 'Balance', count: 20, amount: 350000 }
        ],
        recentPayments: [],
        topPayers: [
          { payer_name: 'ABC Textiles Ltd', total_amount: 450000, payment_count: 12 },
          { payer_name: 'XYZ Electronics', total_amount: 380000, payment_count: 8 },
          { payer_name: 'Mumbai Fashion House', total_amount: 320000, payment_count: 10 }
        ]
      };
    }
  },

  // Receipt
  async generateReceipt(paymentId: string): Promise<{ receipt_url: string; receipt_number: string }> {
    const response = await api.post(`/api/payments/${paymentId}/receipt`);
    return response.data.data;
  },

  async downloadReceipt(paymentId: string): Promise<Blob> {
    const response = await api.get(`/api/payments/${paymentId}/receipt/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};