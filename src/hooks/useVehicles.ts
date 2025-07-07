import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (uuid: string | null): boolean => {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid);
};

export interface Vehicle {
  id: string;
  branch_id: string;
  organization_id: string;
  
  // Basic Information
  vehicle_number: string;
  type: 'own' | 'hired' | 'attached';
  make: string;
  model: string;
  year: number;
  color?: string;
  
  // Technical Specifications
  fuel_type: 'diesel' | 'petrol' | 'cng' | 'electric' | 'hybrid';
  capacity?: string;
  engine_number?: string;
  chassis_number?: string;
  
  // Registration & Compliance
  registration_date?: string;
  registration_valid_till?: string;
  insurance_number?: string;
  insurance_provider?: string;
  insurance_expiry?: string;
  fitness_certificate_number?: string;
  fitness_expiry?: string;
  permit_number?: string;
  permit_type?: string;
  permit_expiry?: string;
  pollution_certificate_number?: string;
  pollution_expiry?: string;
  
  // Status & Maintenance
  status: 'active' | 'maintenance' | 'inactive' | 'sold' | 'accident';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  current_odometer_reading?: number;
  
  // Additional Information
  purchase_date?: string;
  purchase_price?: number;
  vendor_name?: string;
  notes?: string;
  
  // System fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_deleted: boolean;
}

const VEHICLE_COLUMNS = [
  'branch_id',
  'organization_id',
  'vehicle_number',
  'type',
  'make',
  'model',
  'year',
  'color',
  'fuel_type',
  'capacity',
  'engine_number',
  'chassis_number',
  'registration_date',
  'registration_valid_till',
  'insurance_number',
  'insurance_provider',
  'insurance_expiry',
  'fitness_certificate_number',
  'fitness_expiry',
  'permit_number',
  'permit_type',
  'permit_expiry',
  'pollution_certificate_number',
  'pollution_expiry',
  'status',
  'last_maintenance_date',
  'next_maintenance_date',
  'current_odometer_reading',
  'purchase_date',
  'purchase_price',
  'vendor_name',
  'notes',
] as const;

type VehicleInsert = Pick<
  Vehicle,
  (typeof VEHICLE_COLUMNS)[number]
>;

function sanitizeVehicleData(data: Record<string, any>): VehicleInsert {
  const sanitized: Partial<VehicleInsert> = {};
  for (const key of VEHICLE_COLUMNS) {
    if (key in data) {
      const value = data[key];
      if (value === '') {
        sanitized[key] = null as any;
      } else if (value !== undefined) {
        if (key === 'vehicle_number' && typeof value === 'string') {
          sanitized[key] = value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '') as any;
        } else {
          sanitized[key] = value;
        }
      }
    }
  }
  return sanitized as VehicleInsert;
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { selectedBranch } = useBranchSelection();

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If selectedBranch is provided but invalid, return empty array
      if (selectedBranch && !isValidUUID(selectedBranch)) {
        console.log('Invalid branch ID, returning empty array:', selectedBranch);
        setVehicles([]);
        return;
      }

      console.log('Loading vehicles, branchId:', selectedBranch);
      
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number', { ascending: true });
      
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      setVehicles(data || []);
      console.log('Vehicles loaded:', data?.length);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
      setError(err instanceof Error ? err : new Error('Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  async function createVehicle(
    vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      if (vehicleData.branch_id && !isValidUUID(vehicleData.branch_id)) {
        throw new Error('Invalid branch ID format');
      }

      const sanitized = sanitizeVehicleData(vehicleData);

      console.log('Creating vehicle:', sanitized);

      const { data, error: createError } = await supabase
        .from('vehicles')
        .insert(sanitized)
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          throw new Error('Vehicle number already exists');
        }
        throw new Error(createError.message);
      }

      setVehicles(prev => [data, ...prev]);
      console.log('Vehicle created successfully:', data);
      return data;
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      throw err instanceof Error ? err : new Error('Failed to create vehicle');
    }
  }

  async function updateVehicle(id: string, updates: Partial<Vehicle>) {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid vehicle ID format');
      }

      if (updates.branch_id && !isValidUUID(updates.branch_id)) {
        throw new Error('Invalid branch ID format');
      }

      const sanitized = sanitizeVehicleData(updates);

      console.log(`Updating vehicle ${id}:`, sanitized);

      const { data, error: updateError } = await supabase
        .from('vehicles')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('Vehicle number already exists');
        }
        throw new Error(updateError.message);
      }

      setVehicles(prev =>
        prev.map(vehicle => (vehicle.id === id ? data : vehicle))
      );

      console.log('Vehicle updated successfully:', data);
      return data;
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      throw err instanceof Error ? err : new Error('Failed to update vehicle');
    }
  }

  async function deleteVehicle(id: string) {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid vehicle ID format');
      }

      console.log(`Deleting vehicle ${id}`);
      
      // Check if vehicle is used in any OGPL
      const { count, error: countError } = await supabase
        .from('ogpl')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error('Cannot delete vehicle that is used in OGPL records');
      }
      
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      console.log('Vehicle deleted successfully');
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      throw err instanceof Error ? err : new Error('Failed to delete vehicle');
    }
  }

  async function updateVehicleStatus(id: string, status: 'active' | 'maintenance' | 'inactive') {
    try {
      return await updateVehicle(id, { status });
    } catch (err) {
      console.error('Failed to update vehicle status:', err);
      throw err instanceof Error ? err : new Error('Failed to update vehicle status');
    }
  }

  return {
    vehicles,
    loading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
    refresh: loadVehicles
  };
}