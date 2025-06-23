import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any | null;
  clientName: string;
  loading: boolean;
  error: Error | null;
  signIn: (client: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUserBranch: () => Branch | null;
}

interface Branch {
  id: string; 
  name: string;
  code: string;
  city: string;
  state: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  clientName: '',
  loading: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  getCurrentUserBranch: () => null
});

// Create a mock branch for demo purposes
const mockUserBranch: Branch = {
  id: '123e4567-e89b-12d3-a456-426614174000', 
  name: 'Mumbai HQ', 
  code: 'MUM-HQ',
  city: 'Mumbai',
  state: 'Maharashtra'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (client: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      setClientName(client);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClientName('');
  };

  const getCurrentUserBranch = () => {
    return mockUserBranch;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        clientName,
        loading,
        error,
        signIn,
        signOut,
        getCurrentUserBranch,
      }}
    >
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