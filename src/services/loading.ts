import api from './api';

export interface OGPL {
  id: string;
  ogpl_number: string;
  vehicle_id: string;
  from_station: string;
  to_station: string;
  transit_date: string;
  primary_driver_name: string;
  primary_driver_mobile: string;
  secondary_driver_name?: string;
  secondary_driver_mobile?: string;
  remarks?: string;
  status: 'created' | 'in_transit' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  vehicle?: any;
  from_station_details?: any;
  to_station_details?: any;
  loading_records?: any[];
}

export interface LoadingSession {
  id: string;
  ogpl_id: string;
  loaded_by: string;
  vehicle_id: string;
  from_branch_id: string;
  to_branch_id: string;
  notes?: string;
  total_items: number;
  loaded_at: string;
  created_at: string;
  ogpl?: OGPL;
  vehicle?: any;
  from_branch?: any;
  to_branch?: any;
}

export const loadingService = {
  // OGPL operations
  async getOGPLs(params?: { status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    const response = await api.get(`/loading/ogpls${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getOGPL(id: string) {
    const response = await api.get(`/loading/ogpls/${id}`);
    return response.data;
  },

  async createOGPL(data: Omit<OGPL, 'id' | 'ogpl_number' | 'status' | 'created_at' | 'updated_at'>) {
    const response = await api.post('/loading/ogpls', data);
    return response.data;
  },

  async updateOGPL(id: string, data: Partial<Omit<OGPL, 'id' | 'ogpl_number' | 'status' | 'created_at' | 'updated_at'>>) {
    const response = await api.put(`/loading/ogpls/${id}`, data);
    return response.data;
  },

  async updateOGPLStatus(id: string, status: OGPL['status']) {
    const response = await api.patch(`/loading/ogpls/${id}/status`, { status });
    return response.data;
  },

  async addBookingsToOGPL(ogplId: string, bookingIds: string[]) {
    const response = await api.post(`/loading/ogpls/${ogplId}/bookings`, { 
      booking_ids: bookingIds 
    });
    return response.data;
  },

  async removeBookingsFromOGPL(ogplId: string, bookingIds: string[]) {
    const response = await api.delete(`/loading/ogpls/${ogplId}/bookings`, { 
      data: { booking_ids: bookingIds }
    });
    return response.data;
  },

  // Loading session operations
  async getLoadingSessions() {
    const response = await api.get('/loading/loading-sessions');
    return response.data;
  },

  async createLoadingSession(data: {
    ogpl_id: string;
    vehicle_id: string;
    from_branch_id: string;
    to_branch_id: string;
    booking_ids: string[];
    notes?: string;
  }) {
    const response = await api.post('/loading/loading-sessions', data);
    return response.data;
  }
};