import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Branch } from '@/types/index';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';

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
  const { showSuccess, showError } = useNotificationSystem();
  const { user } = useAuth();

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userRole = user?.user_metadata?.role || user?.role;
      const userBranchId = user?.user_metadata?.branch_id || user?.branch_id;
      const userOrgId = user?.user_metadata?.organization_id || user?.organization_id;

      let query = supabase.from('branches').select('*');

      // Apply filtering based on user role
      if (userRole === 'superadmin') {
        // Superadmins can see all branches
        query = query.order('name', { ascending: true });
      } else if (userRole === 'admin' && userOrgId) {
        // Admins can see all branches in their organization
        query = query.eq('organization_id', userOrgId).order('name', { ascending: true });
      } else if (userBranchId) {
        // Regular users can only see their assigned branch
        query = query.eq('id', userBranchId);
      } else {
        // If no branch assignment, return empty array
        setBranches([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setBranches(data || []);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError(err instanceof Error ? err : new Error('Failed to load branches'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const createBranch = async (branchData: Omit<Branch, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      
      const { data, error: createError } = await supabase
        .from('branches')
        .insert(branchData)
        .select()
        .single();
      
      if (createError) throw createError;

      setBranches(prev => [...prev, data]);
      showSuccess('Branch Created', 'Branch created successfully');
      return data;
    } catch (err) {
      console.error('Failed to create branch:', err);
      showError('Create Branch Failed', err instanceof Error ? err.message : 'Failed to create branch');
      throw err instanceof Error ? err : new Error('Failed to create branch');
    }
  };

  const updateBranch = async (id: string, updates: Partial<Branch>) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid branch ID format');
      }

      
      const { data, error: updateError } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;

      setBranches(prev => prev.map(branch => branch.id === id ? data : branch));
      showSuccess('Branch Updated', 'Branch updated successfully');
      return data;
    } catch (err) {
      console.error('Failed to update branch:', err);
      showError('Update Branch Failed', err instanceof Error ? err.message : 'Failed to update branch');
      throw err instanceof Error ? err : new Error('Failed to update branch');
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid branch ID format');
      }

      
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
      showSuccess('Branch Deleted', 'Branch deleted successfully');
    } catch (err) {
      console.error('Failed to delete branch:', err);
      showError('Delete Branch Failed', err instanceof Error ? err.message : 'Failed to delete branch');
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
