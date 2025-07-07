import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { z } from 'zod';
import { responseMiddleware } from '../utils/apiResponse';

const router = Router();

// Apply response middleware
router.use(responseMiddleware);

const schema = z.object({ token: z.string() });

router.post('/signin', async (req, res) => {
  try {
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json(parse.error);
      return;
    }
    const { token } = parse.data;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.json({ user: data.user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile with organization context
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    
    // Try Supabase token first
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.sendError('Invalid or expired token', 401);
    }

    // Get user profile with organization context
    const { data: userProfile, error: profileError } = await supabase
      .from('organization_users')
      .select(`
        id,
        email,
        username,
        full_name,
        role,
        branch_id,
        branch_name,
        organization_id,
        organization_name,
        organization_code,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      // Fallback to basic user data if no organization profile found
      return res.sendSuccess({
        id: authData.user.id,
        email: authData.user.email,
        effectiveRole: 'authenticated',
        finalEffectiveRole: 'authenticated',
        userRole: 'authenticated',
        userEmail: authData.user.email,
        userOrganizationId: undefined,
        userBranchId: undefined,
        needsOrganizationSetup: true
      });
    }

    // Return enriched user profile
    res.sendSuccess({
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      full_name: userProfile.full_name,
      effectiveRole: userProfile.role || 'authenticated',
      finalEffectiveRole: userProfile.role || 'authenticated', 
      userRole: userProfile.role || 'authenticated',
      userEmail: userProfile.email,
      userOrganizationId: userProfile.organization_id,
      userBranchId: userProfile.branch_id,
      organizationName: userProfile.organization_name,
      organizationCode: userProfile.organization_code,
      branchName: userProfile.branch_name,
      isActive: userProfile.is_active
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.sendError('Failed to fetch user profile', 500);
  }
});

export default router;
