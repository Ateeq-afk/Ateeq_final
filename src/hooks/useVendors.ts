import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Vendor } from '@/types';

export function useVendors(branchId: string | null = null) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase.from('vendors').select('*').order('name');
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setVendors(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load vendors'));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  return { vendors, loading, error, refresh: loadVendors };
}
