import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/apiResponse';

const router = Router();

// Apply auth middleware
router.use(authenticate);

// Schema for assigning OAuth user to organization
const assignUserSchema = z.object({
  userEmail: z.string().email('Invalid email address'),
  organizationId: z.string().uuid('Invalid organization ID'),
  branchId: z.string().uuid('Invalid branch ID'),
  role: z.enum(['operator', 'branch_manager', 'admin']).default('operator'),
  username: z.string().min(3).max(50).optional()
});

// GET unassigned OAuth users (admin only)
router.get('/unassigned-users', asyncHandler(async (req: any, res: any) => {
  const { userRole } = req;
  
  // Only admins and superadmins can view unassigned users
  if (!['admin', 'superadmin'].includes(userRole)) {
    return res.sendForbidden('Admin access required');
  }
  
  const { data, error } = await supabase
    .from('unassigned_oauth_users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return res.sendDatabaseError(error, 'Fetch unassigned OAuth users');
  }
  
  res.sendSuccess(data);
}));

// POST assign OAuth user to organization
router.post('/assign-user', asyncHandler(async (req: any, res: any) => {
  const { userRole, organizationId: adminOrgId } = req;
  
  // Only admins and superadmins can assign users
  if (!['admin', 'superadmin'].includes(userRole)) {
    return res.sendForbidden('Admin access required');
  }
  
  const parse = assignUserSchema.safeParse(req.body);
  if (!parse.success) {
    return res.sendValidationError(parse.error.errors);
  }
  
  const { userEmail, organizationId, branchId, role, username } = parse.data;
  
  // Non-superadmins can only assign to their own organization
  if (userRole === 'admin' && organizationId !== adminOrgId) {
    return res.sendForbidden('Can only assign users to your own organization');
  }
  
  // Verify the branch belongs to the organization
  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('id')
    .eq('id', branchId)
    .eq('organization_id', organizationId)
    .single();
  
  if (branchError || !branch) {
    return res.sendError('Invalid branch for the specified organization', 400);
  }
  
  // Call the database function to assign the user
  const { data, error } = await supabase.rpc('assign_oauth_user_to_organization', {
    p_user_email: userEmail,
    p_organization_id: organizationId,
    p_branch_id: branchId,
    p_role: role,
    p_username: username
  });
  
  if (error) {
    return res.sendDatabaseError(error, 'Assign OAuth user');
  }
  
  if (!data.success) {
    return res.sendError(data.error, 400);
  }
  
  res.sendSuccess(data, 'User successfully assigned to organization');
}));

// GET organizations and branches for assignment form
router.get('/organizations-branches', asyncHandler(async (req: any, res: any) => {
  const { userRole, organizationId: adminOrgId } = req;
  
  // Only admins and superadmins can view this
  if (!['admin', 'superadmin'].includes(userRole)) {
    return res.sendForbidden('Admin access required');
  }
  
  let query = supabase
    .from('organizations')
    .select(`
      id,
      name,
      branches:branches(id, name)
    `)
    .order('name');
  
  // Non-superadmins can only see their own organization
  if (userRole === 'admin') {
    query = query.eq('id', adminOrgId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return res.sendDatabaseError(error, 'Fetch organizations and branches');
  }
  
  res.sendSuccess(data);
}));

// DELETE unassigned OAuth user (in case of spam/invalid accounts)
router.delete('/unassigned-users/:userId', asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  const { userRole } = req;
  
  // Only superadmins can delete OAuth users
  if (userRole !== 'superadmin') {
    return res.sendForbidden('Superadmin access required');
  }
  
  // Verify the user is unassigned
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, organization_id, oauth_provider')
    .eq('id', userId)
    .single();
  
  if (userError || !user) {
    return res.sendNotFound('User');
  }
  
  if (user.organization_id) {
    return res.sendError('Cannot delete user assigned to an organization', 400);
  }
  
  if (!user.oauth_provider) {
    return res.sendError('Can only delete OAuth users', 400);
  }
  
  // Delete the user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  
  if (error) {
    return res.sendDatabaseError(error, 'Delete OAuth user');
  }
  
  res.sendSuccess(null, 'OAuth user deleted successfully');
}));

export default router;