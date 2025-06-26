import { Request, Response, NextFunction } from 'express';

export function requireOrgBranch(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as any;
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });
  const orgId = user.user_metadata?.organization_id;
  const branchId = user.user_metadata?.branch_id;
  if (!orgId || !branchId) {
    return res.status(403).json({ error: 'Missing org or branch assignment' });
  }
  (req as any).orgId = orgId;
  (req as any).branchId = branchId;
  next();
}
