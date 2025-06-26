import { Router } from 'express';
import { bookingSchema } from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

router.get('/', requireOrgBranch, async (req, res) => {
  const { orgId, branchId } = req as any;
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('organization_id', orgId)
    .eq('branch_id', branchId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireOrgBranch, async (req, res) => {
  const parse = bookingSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const payload = { ...parse.data };
  const { orgId } = req as any;
  payload['organization_id'] = orgId;
  const { data, error } = await supabase.from('bookings').insert(payload).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data?.[0]);
});

export default router;
