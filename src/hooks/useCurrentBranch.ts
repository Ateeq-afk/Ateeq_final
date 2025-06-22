// src/hooks/useCurrentBranch.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Branch } from '@/types/index';
import { useAuth } from '@/contexts/AuthContext';

export function useCurrentBranch() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { role } = useAuth(); 

  useEffect(() => {
    if (role?.branchId) {
      loadBranch(role.branchId);
    } else {
      setBranch(null);
      setLoading(false);
    }
  }, [role?.branchId]);

  async function loadBranch(branchId: string) {
    try {
      setLoading(true);
      setError(null);

      const { data, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single();

      if (branchError) throw branchError;
      setBranch(data);
    } catch (err) {
      console.error('Failed to load current branch:', err);
      setError(err instanceof Error ? err : new Error('Failed to load current branch'));
    } finally {
      setLoading(false);
    }
  }

  return {
    branch,
    loading,
    error,
    refresh: () => role?.branchId ? loadBranch(role.branchId) : Promise.resolve()
  };
}
