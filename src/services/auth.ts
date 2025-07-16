import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Helper function to check organization via Supabase
async function checkOrganizationDirect(code: string) {
  const { data, error } = await supabase
    .from('organization_codes')
    .select(`
      code,
      organization_id,
      organizations!inner(id, name)
    `)
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error('Invalid organization code');
  }

  return {
    organization_id: data.organization_id,
    organization_name: (data.organizations as any)?.name || '',
    code: data.code
  };
}

// Helper function for organization login via Supabase
async function organizationLoginDirect(organizationCode: string, username: string, password: string) {
  // First check organization exists
  await checkOrganizationDirect(organizationCode);
  
  // Generate the synthetic email
  const email = `${username}@${organizationCode}.internal`;
  
  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new Error('Invalid credentials');
  }

  // Get user profile with organization context
  const { data: userProfile, error: profileError } = await supabase
    .from('organization_users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !userProfile) {
    throw new Error('User profile not found');
  }

  return {
    user: {
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      full_name: userProfile.full_name,
      role: userProfile.role,
      branch_id: userProfile.branch_id,
      branch_name: userProfile.branch_name,
      organization_id: userProfile.organization_id,
      organization_name: userProfile.organization_name,
      organization_code: userProfile.organization_code,
    },
    token: authData.session?.access_token,
    session: authData.session
  };
}

export interface OrganizationCheckResponse {
  organization_id: string;
  organization_name: string;
  code: string;
}

export interface OrganizationLoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    branch_id: string;
    branch_name: string;
    organization_id: string;
    organization_name: string;
    organization_code: string;
  };
  token: string;
  session: any;
}

export interface CreateUserData {
  organizationCode: string;
  username: string;
  password: string;
  email?: string;
  fullName: string;
  branchId: string;
  role?: string;
}

export const authService = {
  // Check if organization code exists
  async checkOrganization(code: string): Promise<OrganizationCheckResponse> {
    try {
      return await checkOrganizationDirect(code);
    } catch (error) {
      // Fallback to API call if direct Supabase fails
      const response = await fetch(`${API_URL}/auth/org/check-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid organization code');
      }

      return data.data;
    }
  },

  // Organization-based login
  async organizationLogin(
    organizationCode: string,
    username: string,
    password: string
  ): Promise<OrganizationLoginResponse> {
    try {
      return await organizationLoginDirect(organizationCode, username, password);
    } catch (error) {
      // Fallback to API call if direct Supabase fails
      const response = await fetch(`${API_URL}/auth/org/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationCode,
          username,
          password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      return data.data;
    }
  },

  // Create user within organization (admin only)
  async createOrganizationUser(userData: CreateUserData) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_URL}/auth/org/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }

    return data.data;
  },

  // Get branches for an organization
  async getOrganizationBranches(organizationCode: string) {
    const response = await fetch(`${API_URL}/auth/org/organizations/${organizationCode}/branches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch branches');
    }

    return data.data;
  },

  // Google OAuth login
  async googleLogin() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  },

  // Handle OAuth callback
  async handleOAuthCallback() {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }

    if (data.session) {
      // Get or create user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If user doesn't exist, they need to be assigned to an organization
      if (!userProfile) {
        throw new Error('User not assigned to any organization. Please contact your administrator.');
      }

      return {
        user: userProfile,
        session: data.session,
        token: data.session.access_token
      };
    }

    throw new Error('No active session found');
  },

  // Legacy email-based login (for backward compatibility)
  async emailLogin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    
    // Clear custom auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    if (error) {
      throw error;
    }
  },

  // Request OTP
  async requestOtp(phoneNumber: string) {
    const response = await fetch(`${API_URL}/auth/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }

    return data.data;
  },

  // Verify OTP
  async verifyOtp(phoneNumber: string, otp: string) {
    const response = await fetch(`${API_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        phone_number: phoneNumber,
        otp 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify OTP');
    }

    // Store the token and user data
    if (data.data.token) {
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('userData', JSON.stringify(data.data.user));
    }

    return data.data;
  },
};