import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  error: Error | null;
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
  loading: false,
  error: null,
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
  const [user] = useState(null);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const getCurrentUserBranch = () => {
    return mockUserBranch;
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, getCurrentUserBranch }}>
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