import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Schema for creating new organization
const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Code must contain only lowercase letters, numbers, and hyphens'),
  subdomain: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  adminUser: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8),
    email: z.string().email().optional(),
    fullName: z.string().min(1).max(100),
  }),
  branches: z.array(z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(50),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  })).min(1, 'At least one branch is required'),
});

// Only super admins can create new organizations
router.post('/create', authenticate, requireAdmin, async (req, res) => {
  try {
    const validatedData = createOrganizationSchema.parse(req.body);
    
    // Start a transaction
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: validatedData.name,
        is_active: true,
      })
      .select()
      .single();

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Create organization code mapping
    const { error: codeError } = await supabase
      .from('organization_codes')
      .insert({
        organization_id: organization.id,
        code: validatedData.code,
        subdomain: validatedData.subdomain,
        is_active: true,
      });

    if (codeError) {
      // Rollback
      await supabase.from('organizations').delete().eq('id', organization.id);
      throw new Error(`Organization code already exists: ${codeError.message}`);
    }

    // Create branches
    const branchInserts = validatedData.branches.map(branch => ({
      organization_id: organization.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      pincode: branch.pincode,
      phone: branch.phone,
      email: branch.email,
      is_active: true,
    }));

    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .insert(branchInserts)
      .select();

    if (branchError) {
      // Rollback
      await supabase.from('organization_codes').delete().eq('organization_id', organization.id);
      await supabase.from('organizations').delete().eq('id', organization.id);
      throw new Error(`Failed to create branches: ${branchError.message}`);
    }

    // Create admin user
    const adminEmail = validatedData.adminUser.email || 
      `${validatedData.adminUser.username}@${validatedData.code}.internal`;

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: validatedData.adminUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.adminUser.fullName,
        username: validatedData.adminUser.username,
        organization_id: organization.id,
        branch_id: branches[0].id, // Assign to first branch
        role: 'admin',
      },
    });

    if (authError) {
      // Rollback everything
      await supabase.from('branches').delete().eq('organization_id', organization.id);
      await supabase.from('organization_codes').delete().eq('organization_id', organization.id);
      await supabase.from('organizations').delete().eq('id', organization.id);
      throw new Error(`Failed to create admin user: ${authError.message}`);
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: adminEmail,
        username: validatedData.adminUser.username,
        full_name: validatedData.adminUser.fullName,
        organization_id: organization.id,
        branch_id: branches[0].id,
        role: 'admin',
        is_active: true,
      });

    if (profileError) {
      // Rollback everything including auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('branches').delete().eq('organization_id', organization.id);
      await supabase.from('organization_codes').delete().eq('organization_id', organization.id);
      await supabase.from('organizations').delete().eq('id', organization.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    res.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          code: validatedData.code,
          subdomain: validatedData.subdomain,
        },
        branches: branches,
        adminUser: {
          id: authUser.user.id,
          username: validatedData.adminUser.username,
          email: validatedData.adminUser.email || null,
          fullName: validatedData.adminUser.fullName,
          role: 'admin',
        },
        loginInfo: {
          organizationCode: validatedData.code,
          username: validatedData.adminUser.username,
          temporaryPassword: '(password set during creation)',
        },
      },
    });
  } catch (error: any) {
    console.error('Create organization error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create organization',
    });
  }
});

// Get all organizations (super admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_codes!inner(code, subdomain),
        branches(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: organizations || [],
    });
  } catch (error: any) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations',
    });
  }
});

// Update organization status (activate/deactivate)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_active must be a boolean value',
      });
    }

    // Update organization
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ is_active })
      .eq('id', id);

    if (orgError) {
      throw orgError;
    }

    // Update organization code
    const { error: codeError } = await supabase
      .from('organization_codes')
      .update({ is_active })
      .eq('organization_id', id);

    if (codeError) {
      throw codeError;
    }

    // Update all users' status
    const { error: userError } = await supabase
      .from('users')
      .update({ is_active })
      .eq('organization_id', id);

    if (userError) {
      throw userError;
    }

    res.json({
      success: true,
      message: `Organization ${is_active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: any) {
    console.error('Update organization status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization status',
    });
  }
});

// Get organization details with usage statistics
router.get('/:id/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_codes!inner(code, subdomain),
        branches(id, name, code),
        users(count)
      `)
      .eq('id', id)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    // Get usage statistics
    const { data: bookingStats } = await supabase
      .from('bookings')
      .select('status', { count: 'exact' })
      .eq('organization_id', id);

    const { data: customerCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact' })
      .eq('organization_id', id);

    const { data: vehicleCount } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('organization_id', id);

    res.json({
      success: true,
      data: {
        organization,
        statistics: {
          totalBookings: bookingStats?.length || 0,
          totalCustomers: customerCount?.length || 0,
          totalVehicles: vehicleCount?.length || 0,
          totalBranches: organization.branches?.length || 0,
          totalUsers: organization.users?.[0]?.count || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Get organization stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization statistics',
    });
  }
});

export default router;