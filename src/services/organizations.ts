const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface CreateOrganizationData {
  name: string;
  code: string;
  subdomain?: string;
  adminUser: {
    username: string;
    password: string;
    email?: string;
    fullName: string;
  };
  branches: Array<{
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
  }>;
}

export interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization_codes?: {
    code: string;
    subdomain?: string;
  };
  branches?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  users?: Array<{
    count: number;
  }>;
}

export const organizationService = {
  // Create new organization
  async create(data: CreateOrganizationData) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_URL}/organizations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create organization');
    }

    return result.data;
  },

  // Get all organizations
  async getAll() {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_URL}/organizations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch organizations');
    }

    return result.data;
  },

  // Update organization status
  async updateStatus(id: string, is_active: boolean) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_URL}/organizations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update organization status');
    }

    return result;
  },

  // Get organization statistics
  async getStats(id: string) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_URL}/organizations/${id}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch organization statistics');
    }

    return result.data;
  },
};