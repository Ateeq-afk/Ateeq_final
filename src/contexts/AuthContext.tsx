import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { tokenManager, secureStorage } from '@/utils/secureStorage'

interface UserPayload extends User {
  username?: string;
  organization_id?: string;
  organization_name?: string;
  organization_code?: string;
  branch_id?: string;
  branch_name?: string;
  role?: string;
  full_name?: string;
}

interface AuthContextType {
  token: string | null
  user: UserPayload | null
  loading: boolean
  error: Error | null
  login: (loginId: string, password: string) => Promise<void>
  signIn: (authData: any) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  getCurrentUserBranch: () => { id: string } | null
  getOrganizationContext: () => { id: string; name: string; code: string } | null
  fetchUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  loading: true,
  error: null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login: async (_u: string, _p: string) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signIn: async (_authData: any) => {},
   
  logout: async () => {},
  refreshToken: async () => false,
  getCurrentUserBranch: () => null,
  getOrganizationContext: () => null,
  fetchUserProfile: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setToken(session?.access_token || null)
      setUser(session?.user || null)
    })

    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || null)
      setUser(data.session?.user || null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function login(loginId: string, password: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginId,
        password
      })
      if (error) throw error
      setToken(data.session?.access_token || null)
      setUser(data.session?.user || null)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setToken(null)
    setUser(null)
  }

  const getCurrentUserBranch = () => {
    const branchId = user?.user_metadata?.branch_id || user?.branch_id
    // console.log('getCurrentUserBranch - user:', user);
    // console.log('getCurrentUserBranch - branchId:', branchId);
    if (branchId) {
      return { id: String(branchId) }
    }
    return null
  }

  const getOrganizationContext = () => {
    const orgId = user?.user_metadata?.organization_id || user?.organization_id;
    const orgName = user?.user_metadata?.organization_name || user?.organization_name || '';
    const orgCode = user?.user_metadata?.organization_code || user?.organization_code || '';
    
    if (orgId) {
      return {
        id: orgId,
        name: orgName,
        code: orgCode
      }
    }
    return null
  }

  async function signIn(authData: any) {
    try {
      setLoading(true)
      
      // Store the custom token and user data securely
      if (authData.token) {
        tokenManager.setToken(authData.token);
        setToken(authData.token);
      }
      
      if (authData.user) {
        // Sanitize and validate user data before storage
        const enrichedUser = {
          id: authData.user.id,
          email: authData.user.email,
          // Only store necessary user metadata
          user_metadata: {
            username: authData.user.username,
            full_name: authData.user.full_name,
            branch_id: authData.user.branch_id,
            role: authData.user.role,
            organization_id: authData.user.organization_id,
            organization_name: authData.user.organization_name,
            organization_code: authData.user.organization_code,
            branch_name: authData.user.branch_name
          }
        } as UserPayload;
        
        setUser(enrichedUser);
        // Use secure storage for user data
        secureStorage.setItem('userData', JSON.stringify(enrichedUser));
      }
      
      // If Supabase session is provided, set it
      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token
        })
      }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }


  // Check for stored auth data on mount with validation
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = tokenManager.getToken();
        const storedUser = secureStorage.getItem('userData');
        
        if (storedToken) {
          setToken(storedToken);
          
          if (storedUser && !user) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // If user data is missing organization context, fetch fresh profile
            if (!userData.organization_id && !userData.user_metadata?.organization_id) {
              console.log('User missing organization context, fetching fresh profile...');
              // Delay profile fetch to ensure token is set
              setTimeout(() => {
                fetchUserProfile();
              }, 100);
            }
          } else if (!user) {
            // No stored user data, fetch from backend
            console.log('No stored user data, fetching profile...');
            setTimeout(() => {
              fetchUserProfile();
            }, 100);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth state:', err);
        // Clear invalid auth data
        tokenManager.removeToken();
        secureStorage.removeItem('userData');
        setToken(null);
        setUser(null);
      } finally {
        // Only set loading to false if we're not fetching profile
        if (!tokenManager.getToken()) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [])

  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!user || !user.user_metadata?.organization_id) {
        return false;
      }

      // Call backend refresh endpoint
      const response = await fetch('http://localhost:4000/auth/org/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization_id: user.user_metadata.organization_id,
          user_id: user.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.token) {
          tokenManager.setToken(data.data.token);
          setToken(data.data.token);
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  };

  // Fetch complete user profile with organization context
  const fetchUserProfile = async () => {
    try {
      if (!token) {
        console.warn('No token available for profile fetch');
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:4000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const profileData = result.data;
        
        // Create enriched user object with organization context
        const enrichedUser = {
          id: profileData.id,
          email: profileData.email,
          user_metadata: {
            username: profileData.username,
            full_name: profileData.full_name,
            role: profileData.finalEffectiveRole,
            organization_id: profileData.userOrganizationId,
            organization_name: profileData.organizationName,
            organization_code: profileData.organizationCode,
            branch_id: profileData.userBranchId,
            branch_name: profileData.branchName
          },
          // Also include at root level for compatibility
          username: profileData.username,
          full_name: profileData.full_name,
          role: profileData.finalEffectiveRole,
          organization_id: profileData.userOrganizationId,
          organization_name: profileData.organizationName,
          organization_code: profileData.organizationCode,
          branch_id: profileData.userBranchId,
          branch_name: profileData.branchName
        } as UserPayload;

        setUser(enrichedUser);
        secureStorage.setItem('userData', JSON.stringify(enrichedUser));
        
        console.log('User profile updated with organization context:', {
          userId: enrichedUser.id,
          orgId: enrichedUser.organization_id,
          branchId: enrichedUser.branch_id,
          role: enrichedUser.role
        });
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Update logout to clear custom auth data securely
  const enhancedLogout = async () => {
    try {
      await logout();
    } finally {
      // Always clear stored data, even if Supabase logout fails
      tokenManager.removeToken();
      secureStorage.removeItem('userData');
      secureStorage.removeItem('selectedBranch');
      setToken(null);
      setUser(null);
      setError(null);
    }
  }

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      loading, 
      error, 
      login, 
      signIn,
      logout: enhancedLogout,
      refreshToken,
      getCurrentUserBranch,
      getOrganizationContext,
      fetchUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
