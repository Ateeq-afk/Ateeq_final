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

// GET single vehicle by ID
router.get('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// UPDATE vehicle
router.put('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const parse = vehicleSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  // Don't allow updating organization_id or branch_id
  const updateData = { ...parse.data };
  delete updateData.organization_id;
  delete updateData.branch_id;
  
  let query = supabase
    .from('vehicles')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.select().single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// DELETE vehicle
router.delete('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // Check if vehicle is used in any OGPLs
  const { data: ogpls, error: ogplError } = await supabase
    .from('ogpls')
    .select('id')
    .eq('vehicle_id', id)
    .limit(1);
    
  if (ogplError) {
    return res.status(500).json({ error: ogplError.message });
  }
  
  if (ogpls && ogpls.length > 0) {
    return res.status(400).json({ error: 'Cannot delete vehicle that is used in OGPLs' });
  }
  
  let query = supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.status(204).send();
});

export default router;
