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

      // For demo purposes, we'll use mock data
      const mockUsers: BranchUser[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174100',
          branch_id: branchId,
          user_id: '123e4567-e89b-12d3-a456-426614174200',
          role: 'admin',
          name: 'Rajesh Kumar',
          email: 'rajesh@desicargo.com',
          phone: '+91 9876543210',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174101',
          branch_id: branchId,
          user_id: '123e4567-e89b-12d3-a456-426614174201',
          role: 'operator',
          name: 'Priya Sharma',
          email: 'priya@desicargo.com',
          phone: '+91 9876543211',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174102',
          branch_id: branchId,
          user_id: '123e4567-e89b-12d3-a456-426614174202',
          role: 'operator',
          name: 'Amit Patel',
          email: 'amit@desicargo.com',
          phone: '+91 9876543212',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setUsers(mockUsers);
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

      console.log('Adding branch user:', userData);
      
      // For demo purposes, we'll create a mock user
      const mockUser: BranchUser = {
        id: crypto.randomUUID(),
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUsers(prev => [...prev, mockUser]);
      return mockUser;
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
      
      // For demo purposes, we'll update the local state
      const updatedUser = users.find(u => u.id === id);
      if (!updatedUser) throw new Error('User not found');
      
      const updatedData = {
        ...updatedUser,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      setUsers(prev => prev.map(user => user.id === id ? updatedData : user));
      return updatedData;
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
      
      // For demo purposes, we'll update the local state
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error('Failed to remove branch user:', err);
      throw err instanceof Error ? err : new Error('Failed to remove branch user');
    }
  }

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    removeUser,
    refresh: loadUsers
  };
}