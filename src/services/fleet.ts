import api from './api';

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
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  maintenance_type: 'routine' | 'breakdown' | 'accident' | 'scheduled';
  description: string;
  service_date: string;
  next_service_date?: string;
  labor_cost?: number;
  parts_cost?: number;
  total_cost?: number;
  service_provider?: string;
  service_location?: string;
  bill_number?: string;
  odometer_reading?: number;
  parts_replaced?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FuelRecord {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  fuel_date: string;
  fuel_type: string;
  quantity: number;
  rate_per_unit: number;
  total_amount: number;
  fuel_station_name?: string;
  location?: string;
  bill_number?: string;
  odometer_reading: number;
  distance_covered?: number;
  mileage?: number;
  payment_mode?: 'cash' | 'card' | 'credit' | 'company_card';
  created_at: string;
  created_by?: string;
  
  // Relations
  drivers?: {
    name: string;
    employee_code: string;
  };
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  file_name?: string;
  file_url?: string;
  file_size?: number;
  notes?: string;
  created_at: string;
  uploaded_by?: string;
}

export interface GPSTracking {
  id: string;
  vehicle_id: string;
  device_id: string;
  provider?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  battery_level?: number;
  signal_strength?: number;
  engine_status?: boolean;
  ac_status?: boolean;
  fuel_level?: number;
  last_updated: string;
}

export interface MaintenanceAlert {
  id: string;
  vehicle_id: string;
  alert_type: 'maintenance_due' | 'document_expiry' | 'insurance_expiry' | 'fitness_expiry' | 'permit_expiry';
  alert_date: string;
  alert_message: string;
  is_active: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  
  // Relations
  vehicles?: {
    id: string;
    vehicle_number: string;
    type: string;
    make: string;
    model: string;
  };
}

export interface MileageAnalytics {
  average_mileage: number;
  last_mileage: number;
  total_fuel_consumed: number;
  total_distance_covered: number;
}

export interface UpcomingMaintenance {
  vehicle_id: string;
  vehicle_number: string;
  maintenance_type: string;
  due_date: string;
  days_remaining: number;
}

export const fleetService = {
  // Vehicle Assignments
  assignments: {
    create: async (data: Omit<VehicleAssignment, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<VehicleAssignment> => {
      const response = await api.post('/api/fleet/assignments', data);
      return response.data;
    },

    update: async (id: string, data: Partial<VehicleAssignment>): Promise<VehicleAssignment> => {
      const response = await api.put(`/api/fleet/assignments/${id}`, data);
      return response.data;
    }
  },

  // Vehicle Maintenance
  maintenance: {
    getByVehicle: async (vehicleId: string, params?: { status?: string; from_date?: string; to_date?: string }): Promise<VehicleMaintenance[]> => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.from_date) queryParams.append('from_date', params.from_date);
      if (params?.to_date) queryParams.append('to_date', params.to_date);
      
      const url = `/api/fleet/vehicles/${vehicleId}/maintenance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },

    create: async (data: Omit<VehicleMaintenance, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<VehicleMaintenance> => {
      const response = await api.post('/api/fleet/maintenance', data);
      return response.data;
    },

    update: async (id: string, data: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> => {
      const response = await api.put(`/api/fleet/maintenance/${id}`, data);
      return response.data;
    }
  },

  // Fuel Records
  fuel: {
    getByVehicle: async (vehicleId: string, params?: { from_date?: string; to_date?: string }): Promise<FuelRecord[]> => {
      const queryParams = new URLSearchParams();
      if (params?.from_date) queryParams.append('from_date', params.from_date);
      if (params?.to_date) queryParams.append('to_date', params.to_date);
      
      const url = `/api/fleet/vehicles/${vehicleId}/fuel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },

    create: async (data: Omit<FuelRecord, 'id' | 'created_at' | 'created_by' | 'distance_covered' | 'mileage' | 'drivers'>): Promise<FuelRecord> => {
      const response = await api.post('/api/fleet/fuel', data);
      return response.data;
    }
  },

  // Vehicle Documents
  documents: {
    getByVehicle: async (vehicleId: string): Promise<VehicleDocument[]> => {
      const response = await api.get(`/api/fleet/vehicles/${vehicleId}/documents`);
      return response.data;
    },

    create: async (data: Omit<VehicleDocument, 'id' | 'created_at' | 'uploaded_by'>): Promise<VehicleDocument> => {
      const response = await api.post('/api/fleet/documents', data);
      return response.data;
    }
  },

  // GPS Tracking
  tracking: {
    getByVehicle: async (vehicleId: string): Promise<GPSTracking | null> => {
      const response = await api.get(`/api/fleet/vehicles/${vehicleId}/tracking`);
      return response.data;
    },

    update: async (data: Omit<GPSTracking, 'id' | 'last_updated'>): Promise<GPSTracking> => {
      const response = await api.post('/api/fleet/tracking', data);
      return response.data;
    }
  },

  // Analytics
  analytics: {
    getMileage: async (vehicleId: string): Promise<MileageAnalytics> => {
      const response = await api.get(`/api/fleet/analytics/mileage/${vehicleId}`);
      return response.data;
    },

    getUpcomingMaintenance: async (days: number = 30): Promise<UpcomingMaintenance[]> => {
      const response = await api.get(`/api/fleet/analytics/upcoming-maintenance?days=${days}`);
      return response.data;
    }
  },

  // Maintenance Alerts
  alerts: {
    getAll: async (params?: { is_active?: boolean; is_acknowledged?: boolean }): Promise<MaintenanceAlert[]> => {
      const queryParams = new URLSearchParams();
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params?.is_acknowledged !== undefined) queryParams.append('is_acknowledged', params.is_acknowledged.toString());
      
      const url = `/api/fleet/alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    },

    acknowledge: async (id: string): Promise<MaintenanceAlert> => {
      const response = await api.put(`/api/fleet/alerts/${id}/acknowledge`);
      return response.data;
    }
  }
};