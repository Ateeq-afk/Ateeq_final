import { supabase } from '../supabaseClient';

/**
 * Validates that a branch belongs to the specified organization
 * @param branchId - The branch ID to validate
 * @param organizationId - The organization ID to check against
 * @returns Promise<boolean> - True if branch belongs to organization, false otherwise
 */
export async function validateBranchBelongsToOrg(
  branchId: string | undefined,
  organizationId: string | undefined
): Promise<boolean> {
  if (!branchId || !organizationId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id')
      .eq('id', branchId)
      .eq('organization_id', organizationId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error validating branch ownership:', error);
    return false;
  }
}

/**
 * Gets the effective branch ID for a request, validating admin access
 * @param requestBranchId - Branch ID from request body
 * @param userBranchId - User's assigned branch ID
 * @param userOrgId - User's organization ID
 * @param userRole - User's role
 * @returns Promise<string | null> - Valid branch ID or null if invalid
 */
export async function getEffectiveBranchId(
  requestBranchId: string | undefined,
  userBranchId: string,
  userOrgId: string,
  userRole: string
): Promise<string | null> {
  // Non-admins must use their own branch
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return userBranchId;
  }

  // Admins can specify a branch, but it must be in their org
  if (requestBranchId) {
    const isValid = await validateBranchBelongsToOrg(requestBranchId, userOrgId);
    return isValid ? requestBranchId : null;
  }

  // Default to user's branch
  return userBranchId;
}

/**
 * Validates that a customer belongs to the specified organization
 * @param customerId - The customer ID to validate
 * @param organizationId - The organization ID to check against
 * @returns Promise<boolean> - True if customer belongs to organization, false otherwise
 */
export async function validateCustomerBelongsToOrg(
  customerId: string | undefined,
  organizationId: string | undefined
): Promise<boolean> {
  if (!customerId || !organizationId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', organizationId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error validating customer ownership:', error);
    return false;
  }
}