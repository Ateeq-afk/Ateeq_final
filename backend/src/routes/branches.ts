import { Router } from 'express';
import { branchSchema } from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

router.get('/', requireOrgBranch, async (req, res) => {
  const { orgId } = req as any;
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('organization_id', orgId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Only admins can create new branches
router.post('/', requireOrgBranch, async (req, res) => {
  const { role, orgId, userId } = req as any;
  
  // Only admins can create branches
  if (role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ error: 'Only administrators can create branches' });
  }
  
  const parse = branchSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const payload = { ...parse.data };
  payload['organization_id'] = orgId;
  
  try {
    // Create the branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .insert(payload)
      .select()
      .single();
      
    if (branchError) throw branchError;
    
    // The warehouse will be automatically created by the database trigger
    // But we can also fetch it to return complete data
    const { data: warehouseData } = await supabase
      .from('warehouses')
      .select('*')
      .eq('branch_id', branchData.id)
      .single();
    
    res.status(201).json({ 
      branch: branchData,
      warehouse: warehouseData,
      message: 'Branch created successfully with default warehouse'
    });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return res.status(500).json({ error: error.message || 'Failed to create branch' });
  }
});

// GET single branch by ID
router.get('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  let query = supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId);
  
  // Non-admins can only view their own branch
  if (role !== 'admin' && id !== branchId) {
    return res.status(403).json({ error: 'Access denied to this branch' });
  }
  
  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Branch not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// UPDATE branch - admins only
router.put('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, role } = req as any;
  
  // Only admins can update branches
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update branches' });
  }
  
  const parse = branchSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  // Don't allow updating organization_id
  const updateData = { ...parse.data };
  delete updateData.organization_id;
  
  const { data, error } = await supabase
    .from('branches')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Branch not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// DELETE branch - admins only
router.delete('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // Only admins can delete branches
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete branches' });
  }
  
  // Prevent deleting own branch
  if (id === branchId) {
    return res.status(400).json({ error: 'Cannot delete your own branch' });
  }
  
  // Check if branch has any associated data
  const checks = [
    supabase.from('users').select('id').eq('branch_id', id).limit(1),
    supabase.from('bookings').select('id').eq('branch_id', id).limit(1),
    supabase.from('customers').select('id').eq('branch_id', id).limit(1),
    supabase.from('vehicles').select('id').eq('branch_id', id).limit(1),
    supabase.from('articles').select('id').eq('branch_id', id).limit(1)
  ];
  
  const results = await Promise.all(checks);
  const hasData = results.some(result => result.data && result.data.length > 0);
  
  if (hasData) {
    return res.status(400).json({ 
      error: 'Cannot delete branch with existing data. Please migrate or delete associated records first.' 
    });
  }
  
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.status(204).send();
});

export default router;
