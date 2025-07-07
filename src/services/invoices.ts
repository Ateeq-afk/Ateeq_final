import axios from 'axios';

// Create an axios instance for API calls
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface InvoiceFilters {
  customer_id: string;
  from_date: string;
  to_date: string;
  include_delivered_only?: boolean;
  include_paid_bookings?: boolean;
}

export interface InvoicePreviewItem {
  lr_number: string;
  booking_date: string;
  from_station: string;
  to_station: string;
  articles: number;
  weight: number;
  total_amount: number;
  status: string;
  payment_status: string;
}

export interface InvoicePreview {
  customer: {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    gstin?: string;
  };
  filters: InvoiceFilters;
  summary: {
    total_bookings: number;
    date_range: {
      from: string;
      to: string;
    };
    amounts: {
      subtotal: number;
      cgst: number;
      sgst: number;
      igst: number;
      total_tax: number;
      grand_total: number;
    };
    interstate: boolean;
  };
  items: InvoicePreviewItem[];
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  organization_id: string;
  branch_id: string;
  from_date: string;
  to_date: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  grand_total: number;
  status: 'generated' | 'sent' | 'paid' | 'cancelled';
  pdf_path?: string;
  sent_at?: string;
  paid_at?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    mobile: string;
    email?: string;
  };
  invoice_items?: {
    count: number;
  }[];
}

export interface InvoiceGeneration {
  invoice_id: string;
  invoice_number: string;
  grand_total: number;
  pdf_generated: boolean;
  notification_sent: boolean;
}

class InvoiceService {
  
  // Preview invoice before generation
  async previewInvoice(filters: InvoiceFilters): Promise<InvoicePreview> {
    const response = await api.post('/invoices/preview', filters);
    return response.data.data;
  }

  // Generate invoice
  async generateInvoice(filters: InvoiceFilters): Promise<InvoiceGeneration> {
    const response = await api.post('/invoices/generate', filters);
    return response.data.data;
  }

  // Get customer invoices
  async getCustomerInvoices(customerId: string): Promise<Invoice[]> {
    const response = await api.get(`/invoices/customer/${customerId}`);
    return response.data.data;
  }

  // Get all invoices with pagination and filters
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customer_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<{
    data: Invoice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await api.get('/invoices', { params });
    return response.data;
  }

  // Download invoice PDF
  async downloadInvoicePDF(invoiceId: string): Promise<Blob> {
    const response = await api.get(`/invoices/download/${invoiceId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId: string, status: string): Promise<Invoice> {
    const response = await api.put(`/invoices/${invoiceId}/status`, { status });
    return response.data.data;
  }

  // Resend invoice notification
  async resendInvoiceNotification(invoiceId: string): Promise<void> {
    await api.post(`/invoices/${invoiceId}/resend`);
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Helper method to format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'generated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'sent': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  // Helper method to get status icon
  getStatusIcon(status: string): string {
    switch (status) {
      case 'generated': return '📄';
      case 'sent': return '📧';
      case 'paid': return '✅';
      case 'cancelled': return '❌';
      default: return '📄';
    }
  }
}

export const invoiceService = new InvoiceService();