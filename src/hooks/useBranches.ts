import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
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

      // Try backend API first, fallback to direct Supabase if needed
      try {
        const response = await api.get('/api/branches', { timeout: 5000 });
        const data = response.data;
        
        console.log('useBranches - loaded branches from API:', data?.length, data);
        setBranches(data || []);
        return; // Success, exit early
      } catch (apiError) {
        console.warn('Backend API not available, falling back to direct Supabase query:', apiError);
        
        // Fallback to direct Supabase query
        const { supabase } = await import('@/lib/supabaseClient');
        const userRole = user?.user_metadata?.role || user?.role;
        const userBranchId = user?.user_metadata?.branch_id || user?.branch_id;
        const userOrgId = user?.user_metadata?.organization_id || user?.organization_id;
        
        let query = supabase.from('branches').select('*');

        // Apply filtering based on user role
        if (userRole === 'superadmin' || !userRole) {
          query = query.order('name', { ascending: true });
        } else if (userRole === 'admin' && userOrgId) {
          query = query.eq('organization_id', userOrgId).order('name', { ascending: true });
        } else if (userBranchId) {
          query = query.eq('id', userBranchId);
        } else {
          query = query.order('name', { ascending: true });
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        console.log('useBranches - loaded branches from Supabase fallback:', data?.length, data);
        setBranches(data || []);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
      
      // As a last resort, provide demo data for development
      console.warn('Providing demo branch data for development');
      setBranches([
        {
          id: 'demo-branch-1',
          name: 'Main Branch',
          address: 'Mumbai, Maharashtra',
          organization_id: 'demo-org-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-branch-2', 
          name: 'Delhi Branch',
          address: 'Delhi, India',
          organization_id: 'demo-org-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-branch-3',
          name: 'Bangalore Branch', 
          address: 'Bangalore, Karnataka',
          organization_id: 'demo-org-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      
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
      const response = await api.post('/api/branches', branchData);
      const data = response.data.branch || response.data;

      setBranches(prev => [...prev, data]);
      showSuccess('Branch Created', 'Branch created successfully');
      return data;
    } catch (err) {
      console.error('Failed to create branch:', err);
      const message = err instanceof Error ? err.message : 'Failed to create branch';
      showError('Create Branch Failed', message);
      throw err instanceof Error ? err : new Error('Failed to create branch');
    }
  };

  const updateBranch = async (id: string, updates: Partial<Branch>) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid branch ID format');
      }

      const response = await api.put(`/api/branches/${id}`, updates);
      const data = response.data;

      setBranches(prev => prev.map(branch => branch.id === id ? data : branch));
      showSuccess('Branch Updated', 'Branch updated successfully');
      return data;
    } catch (err) {
      console.error('Failed to update branch:', err);
      const message = err instanceof Error ? err.message : 'Failed to update branch';
      showError('Update Branch Failed', message);
      throw err instanceof Error ? err : new Error('Failed to update branch');
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid branch ID format');
      }

      await api.delete(`/api/branches/${id}`);

      setBranches(prev => prev.filter(branch => branch.id !== id));
      showSuccess('Branch Deleted', 'Branch deleted successfully');
    } catch (err) {
      console.error('Failed to delete branch:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete branch';
      showError('Delete Branch Failed', message);
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
