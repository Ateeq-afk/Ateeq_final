import api from './api';

export interface Driver {
  id: string;
  branch_id: string;
  organization_id: string;
  
  // Personal Information
  employee_code: string;
  name: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  date_of_birth?: string;
  blood_group?: string;
  
  // License Information
  license_number: string;
  license_type: string;
  license_issue_date?: string;
  license_expiry_date?: string;
  
  // Employment Information
  joining_date: string;
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  salary?: number;
  
  // Additional Documents
  aadhar_number?: string;
  pan_number?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  
  // System fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_deleted: boolean;
  
  // Relations
  vehicle_assignments?: VehicleAssignment[];
}

export interface VehicleAssignment {
  id: string;
  vehicle_id: string;
  driver_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  assigned_from: string;
  assigned_till?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relations
  vehicles?: {
    id: string;
    vehicle_number: string;
    type: string;
    make: string;
    model: string;
    status: string;
  };
}

export interface CreateDriverRequest {
  employee_code: string;
  name: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  date_of_birth?: string;
  blood_group?: string;
  license_number: string;
  license_type: string;
  license_issue_date?: string;
  license_expiry_date?: string;
  joining_date: string;
  status?: 'active' | 'inactive' | 'suspended' | 'terminated';
  salary?: number;
  aadhar_number?: string;
  pan_number?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
}

export interface UpdateDriverRequest extends Partial<CreateDriverRequest> {}

export interface GetDriversParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const driversService = {
  // Get all drivers
  getAll: async (params?: GetDriversParams): Promise<Driver[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/api/drivers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get single driver
  getById: async (id: string): Promise<Driver> => {
    const response = await api.get(`/api/drivers/${id}`);
    return response.data;
  },

  // Create driver
  create: async (data: CreateDriverRequest): Promise<Driver> => {
    const response = await api.post('/api/drivers', data);
    return response.data;
  },

  // Update driver
  update: async (id: string, data: UpdateDriverRequest): Promise<Driver> => {
    const response = await api.put(`/api/drivers/${id}`, data);
    return response.data;
  },

  // Delete driver (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/drivers/${id}`);
  },

  // Get driver's driving history
  getHistory: async (id: string, fromDate?: string, toDate?: string): Promise<VehicleAssignment[]> => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    
    const url = `/api/drivers/${id}/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }
};