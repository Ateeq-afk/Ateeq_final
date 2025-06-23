import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Branch } from '@/types';

interface RoleInfo {
  branchId: string;
  role: 'admin' | 'operator';
}

interface AuthContextType {
  user: User | null;
  role: RoleInfo | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUserBranch: () => Branch | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<RoleInfo | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('branch_users')
      .select('branch_id, role')
      .eq('user_id', userId)
      .single();
    if (error) {
      console.error('Failed to fetch role:', error);
      setRole(null);
      setBranch(null);
    } else {
      setRole({ branchId: data.branch_id, role: data.role });
    }
  }, []);

  const fetchBranch = useCallback(async (branchId: string) => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single();
    if (!error) {
      setBranch(data);
    } else {
      console.error('Failed to fetch branch:', error);
      setBranch(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) {
        setError(error);
      } else if (data.user) {
        setUser(data.user);
        await fetchRole(data.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchRole(currentUser.id);
      } else {
        setRole(null);
        setBranch(null);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  useEffect(() => {
    if (role?.branchId) {
      fetchBranch(role.branchId);
    } else {
      setBranch(null);
    }
  }, [role?.branchId, fetchBranch]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error);
      setUser(null);
      setRole(null);
      setBranch(null);
    } else {
      setUser(data.user);
      await fetchRole(data.user.id);
    }
    setLoading(false);
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setBranch(null);
    setLoading(false);
  }, []);

  const getCurrentUserBranch = useCallback(() => branch, [branch]);

  return (
    <AuthContext.Provider value={{ user, role, loading, error, signIn, signOut, getCurrentUserBranch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
