import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { BranchUser } from '@/types';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (uuid: string | null): boolean => {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid);
};

export function useBranchUsers(branchId: string | null) {
  const [users, setUsers] = useState<BranchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUsers = useCallback(async () => {
    if (!branchId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // If branchId is provided but invalid, return empty array
      if (!isValidUUID(branchId)) {
        console.log('Invalid branch ID, returning empty array:', branchId);
        setUsers([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('custom_users')
        .select('*')
        .eq('branch_id', branchId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load branch users:', err);
      setError(err instanceof Error ? err : new Error('Failed to load branch users'));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function addUser(userData: Omit<BranchUser, 'id' | 'created_at' | 'updated_at'>) {
    try {
      if (!isValidUUID(userData.branch_id)) {
        throw new Error('Invalid branch ID format');
      }

      const { data, error: createError } = await supabase
        .from('custom_users')
        .insert(userData)
        .select('*')
        .single();

      if (createError) throw createError;

      setUsers(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Failed to add branch user:', err);
      throw err instanceof Error ? err : new Error('Failed to add branch user');
    }
  }

  async function updateUser(id: string, updates: Partial<BranchUser>) {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid user ID format');
      }

      if (updates.branch_id && !isValidUUID(updates.branch_id)) {
        throw new Error('Invalid branch ID format');
      }

      console.log(`Updating branch user ${id}:`, updates);
      const { data, error: updateError } = await supabase
        .from('custom_users')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      setUsers(prev => prev.map(user => (user.id === id ? data : user)));
      return data;
    } catch (err) {
      console.error('Failed to update branch user:', err);
      throw err instanceof Error ? err : new Error('Failed to update branch user');
    }
  }

  async function removeUser(id: string) {
    try {
      if (!isValidUUID(id)) {
        throw new Error('Invalid user ID format');
      }

      console.log(`Removing branch user ${id}`);
      const { error: deleteError } = await supabase
        .from('custom_users')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error('Failed to remove branch user:', err);
      throw err instanceof Error ? err : new Error('Failed to remove branch user');
    }
  }

  // Basic invitation flow using a Supabase Edge Function
  async function inviteUser(email: string, role: string) {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, branchId, role }
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Failed to invite user:', err);
      throw err instanceof Error ? err : new Error('Failed to invite user');
    }
  }

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    removeUser,
    inviteUser,
    refresh: loadUsers
  };
}