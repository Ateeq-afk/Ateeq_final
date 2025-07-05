import { Router } from 'express';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Check if organization code exists
router.post('/check-organization', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Organization code is required'
      });
    }

    // Check if organization code exists and is active
    const { data: orgCode, error } = await supabase
      .from('organization_codes')
      .select('organization_id, code')
      .eq('code', code.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !orgCode) {
      return res.status(404).json({
        success: false,
        error: 'Invalid organization code'
      });
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgCode.organization_id)
      .eq('is_active', true)
      .single();

    if (orgError || !org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: {
        organization_id: org.id,
        organization_name: org.name,
        code: orgCode.code
      }
    });
  } catch (error) {
    console.error('Check organization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check organization'
    });
  }
});

// Organization-based login
router.post('/login', async (req, res) => {
  try {
    const { organizationCode, username, password } = req.body;

    if (!organizationCode || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Organization code, username, and password are required'
      });
    }

    // Get organization ID from code
    const { data: orgCode, error: orgError } = await supabase
      .from('organization_codes')
      .select('organization_id')
      .eq('code', organizationCode.toLowerCase())
      .eq('is_active', true)
      .single();

    if (orgError || !orgCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid organization code'
      });
    }

    // Generate synthetic email for Supabase Auth
    const authEmail = `${username.toLowerCase()}@${organizationCode.toLowerCase()}.internal`;

    // Try to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: password
    });

    if (authError) {
      // Check if it's a user not found error
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }
      throw authError;
    }

    if (!authData.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }

    // Get user details with organization and branch info
    const { data: userData, error: userError } = await supabase
      .from('organization_users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Generate custom JWT with organization context
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        username: userData.username,
        organizationId: userData.organization_id,
        organizationCode: organizationCode,
        branchId: userData.branch_id,
        role: userData.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          role: userData.role,
          branch_id: userData.branch_id,
          branch_name: userData.branch_name,
          organization_id: userData.organization_id,
          organization_name: userData.organization_name,
          organization_code: userData.organization_code
        },
        token,
        session: authData.session
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Create user within organization (admin only)
router.post('/create-user', async (req, res) => {
  try {
    const { 
      organizationCode, 
      username, 
      password, 
      email,
      fullName, 
      branchId, 
      role = 'operator' 
    } = req.body;

    // Verify admin permissions (would come from auth middleware)
    // For now, we'll skip this check

    // Get organization ID
    const { data: orgCode, error: orgError } = await supabase
      .from('organization_codes')
      .select('organization_id')
      .eq('code', organizationCode.toLowerCase())
      .eq('is_active', true)
      .single();

    if (orgError || !orgCode) {
      return res.status(404).json({
        success: false,
        error: 'Invalid organization code'
      });
    }

    // Generate synthetic email if not provided
    const authEmail = email || `${username.toLowerCase()}@${organizationCode.toLowerCase()}.internal`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: username,
        organization_id: orgCode.organization_id,
        branch_id: branchId,
        role: role
      }
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authEmail,
        username: username,
        full_name: fullName,
        organization_id: orgCode.organization_id,
        branch_id: branchId,
        role: role,
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    res.json({
      success: true,
      data: {
        id: userProfile.id,
        username: userProfile.username,
        email: email || null, // Return actual email if provided
        full_name: userProfile.full_name,
        role: userProfile.role,
        branch_id: userProfile.branch_id,
        organization_id: userProfile.organization_id
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

// Get organization branches (for user assignment)
router.get('/organizations/:code/branches', async (req, res) => {
  try {
    const { code } = req.params;

    // Get organization ID from code
    const { data: orgCode, error: orgError } = await supabase
      .from('organization_codes')
      .select('organization_id')
      .eq('code', code.toLowerCase())
      .eq('is_active', true)
      .single();

    if (orgError || !orgCode) {
      return res.status(404).json({
        success: false,
        error: 'Invalid organization code'
      });
    }

    // Get branches for the organization
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, code, city, state')
      .eq('organization_id', orgCode.organization_id)
      .eq('is_active', true)
      .order('name');

    if (branchError) {
      throw branchError;
    }

    res.json({
      success: true,
      data: branches || []
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch branches'
    });
  }
});

export default router;