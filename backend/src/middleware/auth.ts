import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabaseClient';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: any;
  organizationId?: string;
  branchId?: string;
  userRole?: string;
  selectedBranch?: string;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  
  try {
    // First, try to verify as a custom JWT token (organization-based auth)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (decoded.organizationId) {
      // This is an organization-based auth token
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        user_metadata: {
          username: decoded.username,
          organization_id: decoded.organizationId,
          branch_id: decoded.branchId,
          role: decoded.role
        }
      };
      req.organizationId = decoded.organizationId;
      req.branchId = decoded.branchId;
      req.userRole = decoded.role;
      
      // Handle selected branch for JWT auth
      const selectedBranchHeader = req.headers['x-selected-branch'] as string;
      if (selectedBranchHeader && (req.userRole === 'admin' || req.userRole === 'superadmin')) {
        // For JWT auth, trust the selected branch header for admins
        req.branchId = selectedBranchHeader;
        req.selectedBranch = selectedBranchHeader;
      }
      
      return next();
    }
  } catch (jwtError) {
    // If JWT verification fails, try Supabase auth
  }
  
  // Fall back to Supabase token verification
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // Get user profile to include organization context
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, branch_id, role')
      .eq('id', data.user.id)
      .single();
    
    if (userProfile) {
      req.organizationId = userProfile.organization_id;
      req.branchId = userProfile.branch_id;
      req.userRole = userProfile.role;
    }
    
    req.user = data.user;
    
    // Handle selected branch for admins/superadmins
    const selectedBranchHeader = req.headers['x-selected-branch'] as string;
    if (selectedBranchHeader && (req.userRole === 'admin' || req.userRole === 'superadmin')) {
      // Verify the selected branch exists and user has access
      const { data: branchData } = await supabase
        .from('branches')
        .select('id, organization_id')
        .eq('id', selectedBranchHeader)
        .single();
        
      if (branchData) {
        // For superadmins, allow any branch
        // For admins, verify it's in their organization
        if (req.userRole === 'superadmin' || 
            (req.userRole === 'admin' && branchData.organization_id === req.organizationId)) {
          req.branchId = selectedBranchHeader;
          req.selectedBranch = selectedBranchHeader;
        }
      }
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }
}

// Middleware to ensure user belongs to the correct organization
export function requireOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.organizationId) {
    res.status(403).json({ error: 'Organization context required' });
    return;
  }
  next();
}

// Middleware to check for admin role
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!['admin', 'superadmin'].includes(req.userRole || '')) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// Middleware to check for branch manager or above
export function requireBranchManager(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!['admin', 'superadmin', 'branch_manager'].includes(req.userRole || '')) {
    res.status(403).json({ error: 'Branch manager access required' });
    return;
  }
  next();
}
