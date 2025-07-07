import { Router } from 'express';
import { driverSchema, driverUpdateSchema } from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

// GET all drivers
router.get('/', requireOrgBranch, async (req, res) => {
  const { orgId, branchId, role } = req as any;
  const { status, search } = req.query;
  
  let query = supabase
    .from('drivers')
    .select(`
      *,
      vehicle_assignments!inner (
        vehicle_id,
        assignment_type,
        is_active,
        vehicles (
          vehicle_number,
          type,
          make,
          model
        )
      )
    `)
    .eq('organization_id', orgId)
    .eq('is_deleted', false);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,employee_code.ilike.%${search}%,mobile.ilike.%${search}%`);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET single driver
router.get('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  let query = supabase
    .from('drivers')
    .select(`
      *,
      vehicle_assignments (
        id,
        vehicle_id,
        assignment_type,
        assigned_from,
        assigned_till,
        is_active,
        vehicles (
          id,
          vehicle_number,
          type,
          make,
          model,
          status
        )
      )
    `)
    .eq('id', id)
    .eq('organization_id', orgId)
    .eq('is_deleted', false);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Driver not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// CREATE driver
router.post('/', requireOrgBranch, async (req, res) => {
  const parse = driverSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  
  const payload = { ...parse.data };
  const { orgId, branchId, role, userId } = req as any;
  
  payload['organization_id'] = orgId;
  if (role !== 'admin') {
    payload['branch_id'] = branchId;
  }
  payload['created_by'] = userId;
  
  const { data, error } = await supabase
    .from('drivers')
    .insert(payload)
    .select()
    .single();
    
  if (error) {
    if (error.message.includes('unique_employee_code_per_org')) {
      return res.status(400).json({ error: 'Employee code already exists in this organization' });
    }
    if (error.message.includes('unique_license_number')) {
      return res.status(400).json({ error: 'License number already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data);
});

// UPDATE driver
router.put('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  const parse = driverUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });
  
  const updateData = { ...parse.data };
  
  let query = supabase
    .from('drivers')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', orgId)
    .eq('is_deleted', false);
    
  if (role !== 'admin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.select().single();
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Driver not found' });
    }
    if (error.message.includes('unique_employee_code_per_org')) {
      return res.status(400).json({ error: 'Employee code already exists in this organization' });
    }
    if (error.message.includes('unique_license_number')) {
      return res.status(400).json({ error: 'License number already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// DELETE driver (soft delete)
router.delete('/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  
  // Check if driver has active assignments
  const { data: assignments, error: assignmentError } = await supabase
    .from('vehicle_assignments')
    .select('id')
    .eq('driver_id', id)
    .eq('is_active', true)
    .limit(1);
    
  if (assignmentError) {
    return res.status(500).json({ error: assignmentError.message });
  }
  
  if (assignments && assignments.length > 0) {
    return res.status(400).json({ error: 'Cannot delete driver with active vehicle assignments' });
  }
  
  let query = supabase
    .from('drivers')
    .update({ is_deleted: true, status: 'terminated' })
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

// Get driver's driving history
router.get('/:id/history', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req as any;
  const { from_date, to_date } = req.query;
  
  // First verify the driver belongs to the user's org/branch
  let driverQuery = supabase
    .from('drivers')
    .select('id')
    .eq('id', id)
    .eq('organization_id', orgId)
    .eq('is_deleted', false);
    
  if (role !== 'admin') {
    driverQuery = driverQuery.eq('branch_id', branchId);
  }
  
  const { data: driver, error: driverError } = await driverQuery.single();
  if (driverError || !driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }
  
  // Get vehicle assignments
  let historyQuery = supabase
    .from('vehicle_assignments')
    .select(`
      *,
      vehicles (
        id,
        vehicle_number,
        type,
        make,
        model
      )
    `)
    .eq('driver_id', id)
    .order('assigned_from', { ascending: false });
    
  if (from_date) {
    historyQuery = historyQuery.gte('assigned_from', from_date);
  }
  if (to_date) {
    historyQuery = historyQuery.lte('assigned_from', to_date);
  }
  
  const { data, error } = await historyQuery;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;