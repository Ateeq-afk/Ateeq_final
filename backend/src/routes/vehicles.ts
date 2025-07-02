import { Router } from 'express';
import { vehicleSchema } from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

router.get('/', requireOrgBranch, async (req, res) => {
  const { orgId, branchId, role } = req as any;
  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('organization_id', orgId);
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireOrgBranch, async (req, res) => {
  const parse = vehicleSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const payload = { ...parse.data };
  const { orgId, branchId, role } = req as any;
  payload['organization_id'] = orgId;
  if (role !== 'admin') {
    payload['branch_id'] = branchId;
  }
  const { data, error } = await supabase.from('vehicles').insert(payload).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data?.[0]);
});

export default router;
