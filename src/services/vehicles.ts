import api from './api';

export interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  capacity_kg: number;
  driver_id?: string;
  status: string;
  created_at: string;
}

export const vehicleService = {
  async getVehicles(params?: any): Promise<Vehicle[]> {
    try {
      const { data } = await api.get('/api/vehicles', { params });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  },

  async getVehicle(id: string): Promise<Vehicle | null> {
    try {
      const { data } = await api.get(`/api/vehicles/${id}`);
      return data.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  }
};