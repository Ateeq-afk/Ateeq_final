import api from './api';
import { ApiResponse, PaginationParams } from '../types/api';

export interface RateContract {
  id: string;
  organization_id: string;
  branch_id?: string;
  contract_number: string;
  customer_id: string;
  contract_type: 'standard' | 'special' | 'volume' | 'seasonal';
  valid_from: string;
  valid_until: string;
  minimum_business_commitment?: number;
  payment_terms?: string;
  credit_limit?: number;
  base_discount_percentage?: number;
  status: 'draft' | 'pending_approval' | 'active' | 'expired' | 'terminated';
  approved_by?: string;
  approved_at?: string;
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
    gst?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  approved_by_user?: {
    id: string;
    name: string;
  };
  rate_slabs?: RateSlab[];
  surcharge_rules?: SurchargeRule[];
}

export interface RateSlab {
  id: string;
  rate_contract_id: string;
  from_location: string;
  to_location: string;
  article_id?: string;
  article_category?: string;
  weight_from: number;
  weight_to: number;
  rate_per_kg?: number;
  rate_per_unit?: number;
  minimum_charge?: number;
  charge_basis: 'weight' | 'unit' | 'fixed' | 'whichever_higher';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  article?: {
    id: string;
    name: string;
    hsn_code?: string;
  };
}

export interface SurchargeRule {
  id: string;
  organization_id: string;
  rate_contract_id?: string;
  surcharge_type: 'fuel' | 'seasonal' | 'congestion' | 'toll' | 'handling' | 'insurance' | 'cod' | 'door_delivery' | 'urgent';
  calculation_method: 'percentage' | 'fixed' | 'per_kg' | 'per_unit';
  value: number;
  min_amount?: number;
  max_amount?: number;
  applicable_routes?: Array<{ from: string; to: string }>;
  applicable_articles?: string[];
  conditions?: Record<string, any>;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceCalculationRequest {
  rate_contract_id: string;
  from_location: string;
  to_location: string;
  article_id?: string;
  weight: number;
  quantity: number;
  booking_date?: string;
}

export interface PriceCalculationResponse {
  base_amount: number;
  surcharges: Array<{
    type: string;
    amount: number;
    calculation_method: string;
    value: number;
  }>;
  discounts: Array<{
    type: string;
    percentage?: number;
    amount: number;
  }>;
  total_amount: number;
}

export interface ApplicableRateRequest {
  customer_id: string;
  from_location: string;
  to_location: string;
  article_id?: string;
  weight: number;
  booking_date?: string;
}

export interface ApplicableRateResponse {
  hasContract: boolean;
  hasRate: boolean;
  message?: string;
  rate_contract?: RateContract;
  rate_slab?: RateSlab;
}

interface RateContractFilters extends PaginationParams {
  customer_id?: string;
  status?: string;
  active_only?: boolean;
}

interface RateSlabFilters {
  from_location?: string;
  to_location?: string;
  article_id?: string;
}

interface SurchargeFilters extends PaginationParams {
  type?: string;
  active_only?: boolean;
}

export const ratesService = {
  // Rate Contracts
  async getAllContracts(filters?: RateContractFilters): Promise<ApiResponse<RateContract[]>> {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.active_only !== undefined) params.append('active_only', filters.active_only.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    return api.get(`/rates/contracts?${params}`);
  },

  async getContract(id: string): Promise<ApiResponse<RateContract>> {
    return api.get(`/rates/contracts/${id}`);
  },

  async createContract(data: Omit<RateContract, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'status'>): Promise<ApiResponse<RateContract>> {
    return api.post('/rates/contracts', data);
  },

  async updateContract(id: string, data: Partial<RateContract>): Promise<ApiResponse<RateContract>> {
    return api.put(`/rates/contracts/${id}`, data);
  },

  async approveContract(id: string): Promise<ApiResponse<RateContract>> {
    return api.post(`/rates/contracts/${id}/approve`);
  },

  // Rate Slabs
  async getContractSlabs(contractId: string, filters?: RateSlabFilters): Promise<ApiResponse<RateSlab[]>> {
    const params = new URLSearchParams();
    if (filters?.from_location) params.append('from_location', filters.from_location);
    if (filters?.to_location) params.append('to_location', filters.to_location);
    if (filters?.article_id) params.append('article_id', filters.article_id);
    
    return api.get(`/rates/contracts/${contractId}/slabs?${params}`);
  },

  async createSlabs(contractId: string, slabs: Omit<RateSlab, 'id' | 'rate_contract_id' | 'created_at' | 'updated_at'>[]): Promise<ApiResponse<RateSlab[]>> {
    return api.post(`/rates/contracts/${contractId}/slabs`, { slabs });
  },

  async updateSlab(id: string, data: Partial<RateSlab>): Promise<ApiResponse<RateSlab>> {
    return api.put(`/rates/slabs/${id}`, data);
  },

  async deleteSlab(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/rates/slabs/${id}`);
  },

  // Surcharge Rules
  async getAllSurcharges(filters?: SurchargeFilters): Promise<ApiResponse<SurchargeRule[]>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.active_only !== undefined) params.append('active_only', filters.active_only.toString());
    
    return api.get(`/rates/surcharges?${params}`);
  },

  async createSurcharge(data: Omit<SurchargeRule, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<SurchargeRule>> {
    return api.post('/rates/surcharges', data);
  },

  // Price Calculation
  async calculatePrice(data: PriceCalculationRequest): Promise<ApiResponse<PriceCalculationResponse>> {
    return api.post('/rates/calculate-price', data);
  },

  async getApplicableRate(data: ApplicableRateRequest): Promise<ApiResponse<ApplicableRateResponse>> {
    return api.post('/rates/get-applicable-rate', data);
  },
};