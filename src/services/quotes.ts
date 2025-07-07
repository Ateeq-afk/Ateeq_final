import api from './api';
import { ApiResponse, PaginationParams } from '../types/api';
import { Booking } from '../types/booking';

export interface Quote {
  id: string;
  organization_id: string;
  branch_id: string;
  quote_number: string;
  customer_id: string;
  rate_contract_id?: string;
  valid_from: string;
  valid_until: string;
  from_location: string;
  to_location: string;
  estimated_volume: {
    weight: number;
    units: number;
    articles: Array<{
      article_id: string;
      quantity: number;
      weight: number;
    }>;
  };
  base_amount: number;
  surcharges: Array<{
    type: string;
    amount: number;
    description?: string;
  }>;
  discounts: Array<{
    type: string;
    amount: number;
    description?: string;
  }>;
  total_amount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted';
  approved_by?: string;
  approved_at?: string;
  converted_to_booking_id?: string;
  notes?: string;
  terms_and_conditions?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: {
    id: string;
    name: string;
    code: string;
    phone?: string;
    email?: string;
  };
  rate_contract?: {
    id: string;
    contract_number: string;
  };
  approved_by_user?: {
    id: string;
    name: string;
  };
  booking?: {
    id: string;
    booking_number: string;
  };
}

export interface CreateQuoteRequest {
  customer_id: string;
  rate_contract_id?: string;
  valid_from: string;
  valid_until: string;
  from_location: string;
  to_location: string;
  estimated_volume: {
    weight: number;
    units: number;
    articles: Array<{
      article_id: string;
      quantity: number;
      weight: number;
    }>;
  };
  notes?: string;
  terms_and_conditions?: string;
}

export interface ConvertToBookingRequest {
  booking_details: Partial<Booking>;
}

interface QuoteFilters extends PaginationParams {
  customer_id?: string;
  status?: string;
  valid_only?: boolean;
}

export const quotesService = {
  async getAll(filters?: QuoteFilters): Promise<ApiResponse<Quote[]>> {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.valid_only !== undefined) params.append('valid_only', filters.valid_only.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    return api.get(`/quotes?${params}`);
  },

  async getById(id: string): Promise<ApiResponse<Quote>> {
    return api.get(`/quotes/${id}`);
  },

  async create(data: CreateQuoteRequest): Promise<ApiResponse<Quote>> {
    return api.post('/quotes', data);
  },

  async update(id: string, data: Partial<CreateQuoteRequest>): Promise<ApiResponse<Quote>> {
    return api.put(`/quotes/${id}`, data);
  },

  async send(id: string): Promise<ApiResponse<Quote>> {
    return api.post(`/quotes/${id}/send`);
  },

  async approve(id: string): Promise<ApiResponse<Quote>> {
    return api.post(`/quotes/${id}/approve`);
  },

  async reject(id: string, reason?: string): Promise<ApiResponse<Quote>> {
    return api.post(`/quotes/${id}/reject`, { reason });
  },

  async convertToBooking(id: string, bookingDetails: ConvertToBookingRequest): Promise<ApiResponse<{ quote: Quote; booking: Booking }>> {
    return api.post(`/quotes/${id}/convert-to-booking`, bookingDetails);
  },

  async duplicate(id: string): Promise<ApiResponse<Quote>> {
    return api.post(`/quotes/${id}/duplicate`);
  },
};