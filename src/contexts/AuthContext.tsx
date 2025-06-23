import React, { createContext, useContext, useState } from 'react';

interface User {
  clientName: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (clientName: string, id: string, password: string) => void;
  logout: () => void;
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
  login: () => {},
  logout: () => {},
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
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const login = (clientName: string, id: string, _password: string) => {
    setUser({ clientName, id });
  };

  const logout = () => {
    setUser(null);
  };

  const getCurrentUserBranch = () => {
    return mockUserBranch;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, getCurrentUserBranch }}
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