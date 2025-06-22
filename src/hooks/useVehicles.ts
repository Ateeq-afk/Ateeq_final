import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (uuid: string | null): boolean => {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid);
};

export interface Vehicle {
  id: string;
  branch_id: string;
  vehicle_number: string;
  type: 'own' | 'hired' | 'attached';
  make: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useVehicles(branchId: string | null = null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If branchId is provided but invalid, return empty array
      if (branchId && !isValidUUID(branchId)) {
        console.log('Invalid branch ID, returning empty array:', branchId);
        setVehicles([]);
        return;
      }

      console.log('Loading vehicles, branchId:', branchId);
      
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number', { ascending: true });
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
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
  }, [branchId]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  async function createVehicle(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
    try {
      if (vehicleData.branch_id && !isValidUUID(vehicleData.branch_id)) {
        throw new Error('Invalid branch ID format');
      }

      console.log('Creating vehicle:', vehicleData);
      
      const { data, error: createError } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();
      
      if (createError) throw createError;
      
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

      console.log(`Updating vehicle ${id}:`, updates);
      
      const { data, error: updateError } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? data : vehicle
      ));
      
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