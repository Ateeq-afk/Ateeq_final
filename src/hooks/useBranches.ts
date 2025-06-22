import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Branch } from '@/types/index';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (uuid: string | null): boolean => {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid);
};

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setBranches(data || []);
      console.log('Branches loaded:', data?.length);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError(err instanceof Error ? err : new Error('Failed to load branches'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const createBranch = async (branchData: Omit<Branch, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Creating branch:', branchData);
      
      const { data, error: createError } = await supabase
        .from('branches')
        .insert(branchData)
        .select()
        .single();
      
      if (createError) throw createError;
      
      setBranches(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Failed to create branch:', err);
      throw err instanceof Error ? err : new Error('Failed to create branch');
    }
  };

  const updateBranch = async (id: string, updates: Partial<Branch>) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid branch ID format');
      }

      console.log(`Updating branch ${id}:`, updates);
      
      const { data, error: updateError } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      setBranches(prev => prev.map(branch => branch.id === id ? data : branch));
      return data;
    } catch (err) {
      console.error('Failed to update branch:', err);
      throw err instanceof Error ? err : new Error('Failed to update branch');
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid branch ID format');
      }

      console.log(`Deleting branch ${id}`);
      
      // Check for associated data
      const { count: bookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`from_branch.eq.${id},to_branch.eq.${id}`);
      
      if (bookingsError) throw bookingsError;
      
      if (bookingsCount && bookingsCount > 0) {
        throw new Error('Cannot delete branch with existing bookings');
      }
      
      // Check for users
      const { count: usersCount, error: usersError } = await supabase
        .from('branch_users')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', id);
      
      if (usersError) throw usersError;
      
      if (usersCount && usersCount > 0) {
        throw new Error('Cannot delete branch with assigned users');
      }
      
      // If no associated data, proceed with deletion
      const { error: deleteError } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      setBranches(prev => prev.filter(branch => branch.id !== id));
    } catch (err) {
      console.error('Failed to delete branch:', err);
      throw err instanceof Error ? err : new Error('Failed to delete branch');
    }
  };

  return {
    branches,
    loading,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
    refresh: loadBranches
  };
}