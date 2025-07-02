import { Request, Response, NextFunction } from 'express';

export function requireOrgBranch(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as any;
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });

  const metadata = user.user_metadata || {};
  const orgId = metadata.organization_id;
  const branchId = metadata.branch_id;
  const role = metadata.role;

  if (!orgId || (!branchId && role !== 'admin')) {
    return res.status(403).json({ error: 'Missing org or branch assignment' });
  }

  (req as any).orgId = orgId;
  (req as any).branchId = branchId;
  (req as any).role = role;
  next();
}
