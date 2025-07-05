import { Router } from 'express';
import { 
  warehouseSchema, 
  warehouseUpdateSchema,
  warehouseLocationSchema,
  warehouseLocationUpdateSchema,
  inventoryRecordSchema,
  inventoryMovementSchema,
  warehouseZoneSchema
} from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';

const router = Router();

// ===== WAREHOUSE ROUTES =====

// Get all warehouses
router.get('/', requireOrgBranch, async (req, res) => {
  try {
    const { orgId, branchId, role } = req as any;
    const { branch_id } = req.query;
    
    let query = supabase
      .from('warehouses')
      .select(`
        *,
        warehouse_locations(count),
        inventory_records(count)
      `)
      .eq('organization_id', orgId);

    // If branch_id is provided in query params (for admins switching branches)
    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    } else if (role !== 'admin' && role !== 'superadmin') {
      // If not admin and no branch_id specified, filter by user's branch
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single warehouse
router.get('/:id', requireOrgBranch, async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req as any;
    
    let query = supabase
      .from('warehouses')
      .select(`
        *,
        warehouse_locations(*),
        warehouse_zones(*)
      `)
      .eq('id', id)
      .eq('organization_id', orgId);

    if (role !== 'admin' && role !== 'superadmin') {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Warehouse not found' });
      }
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create warehouse
router.post('/', requireOrgBranch, async (req, res) => {
  try {
    const parse = warehouseSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
    }

    const { orgId, branchId, userId, role } = req as any;
    const payload = {
      ...parse.data,
      organization_id: orgId,
      branch_id: role === 'admin' || role === 'superadmin' ? parse.data.branch_id || branchId : branchId,
      created_by: userId,
      updated_by: userId,
    };

    const { data, error } = await supabase
      .from('warehouses')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update warehouse
router.put('/:id', requireOrgBranch, async (req, res) => {
  try {
    const { id } = req.params;
    const parse = warehouseUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
    }

    const { orgId, branchId, userId, role } = req as any;
    
    // Check if warehouse exists and user has permission
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, organization_id, branch_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !existingWarehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    if (role !== 'admin' && role !== 'superadmin' && existingWarehouse.branch_id !== branchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payload = {
      ...parse.data,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('warehouses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete warehouse
router.delete('/:id', requireOrgBranch, async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req as any;
    
    // Check if warehouse exists and user has permission
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, organization_id, branch_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !existingWarehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== WAREHOUSE LOCATION ROUTES =====

// Get all warehouse locations
router.get('/locations', requireOrgBranch, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const { orgId, branchId, role } = req as any;

    let query = supabase
      .from('warehouse_locations')
      .select(`
        *,
        warehouses!inner(id, name, organization_id, branch_id),
        warehouse_zones(id, name, zone_code),
        inventory_records(count)
      `);

    // Filter by organization
    query = query.eq('warehouses.organization_id', orgId);

    // If not admin, filter by branch
    if (role !== 'admin' && role !== 'superadmin') {
      query = query.eq('warehouses.branch_id', branchId);
    }

    // Filter by warehouse if specified
    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id);
    }

    const { data, error } = await query.order('location_code');
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single warehouse location
router.get('/locations/:id', requireOrgBranch, async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req as any;
    
    let query = supabase
      .from('warehouse_locations')
      .select(`
        *,
        warehouses!inner(id, name, organization_id, branch_id),
        warehouse_zones(id, name, zone_code),
        inventory_records(*)
      `)
      .eq('id', id)
      .eq('warehouses.organization_id', orgId);

    if (role !== 'admin' && role !== 'superadmin') {
      query = query.eq('warehouses.branch_id', branchId);
    }

    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Location not found' });
      }
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create warehouse location
router.post('/locations', requireOrgBranch, async (req, res) => {
  try {
    const parse = warehouseLocationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
    }

    const { orgId, branchId, userId, role } = req as any;
    
    // Verify warehouse exists and user has access
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, organization_id, branch_id')
      .eq('id', parse.data.warehouse_id)
      .eq('organization_id', orgId)
      .single();

    if (warehouseError || !warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    if (role !== 'admin' && role !== 'superadmin' && warehouse.branch_id !== branchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payload = {
      ...parse.data,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('warehouse_locations')
      .insert(payload)
      .select(`
        *,
        warehouses(id, name),
        warehouse_zones(id, name, zone_code)
      `)
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Location code already exists in this warehouse' });
      }
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update warehouse location
router.put('/locations/:id', requireOrgBranch, async (req, res) => {
  try {
    const { id } = req.params;
    const parse = warehouseLocationUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
    }

    const { orgId, branchId, userId, role } = req as any;
    
    // Check if location exists and user has permission
    const { data: existingLocation, error: fetchError } = await supabase
      .from('warehouse_locations')
      .select(`
        id,
        warehouses!inner(id, organization_id, branch_id)
      `)
      .eq('id', id)
      .eq('warehouses.organization_id', orgId)
      .single();

    if (fetchError || !existingLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (role !== 'admin' && role !== 'superadmin' && existingLocation.warehouses.branch_id !== branchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payload = {
      ...parse.data,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('warehouse_locations')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        warehouses(id, name),
        warehouse_zones(id, name, zone_code)
      `)
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete warehouse location
router.delete('/locations/:id', requireOrgBranch, async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, branchId, role } = req as any;
    
    // Check if location exists and user has permission
    const { data: existingLocation, error: fetchError } = await supabase
      .from('warehouse_locations')
      .select(`
        id,
        warehouses!inner(id, organization_id, branch_id)
      `)
      .eq('id', id)
      .eq('warehouses.organization_id', orgId)
      .single();

    if (fetchError || !existingLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('warehouse_locations')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== INVENTORY ROUTES =====

// Get inventory records
router.get('/inventory', requireOrgBranch, async (req, res) => {
  try {
    const { location_id, article_id, status, warehouse_id } = req.query;
    const { orgId, branchId, role } = req as any;

    let query = supabase
      .from('inventory_records')
      .select(`
        *,
        warehouse_locations!inner(
          id, location_code, name,
          warehouses!inner(id, name, organization_id, branch_id)
        ),
        articles(id, name, description),
        bookings(id, lr_number)
      `);

    // Filter by organization
    query = query.eq('warehouse_locations.warehouses.organization_id', orgId);

    // If not admin, filter by branch
    if (role !== 'admin' && role !== 'superadmin') {
      query = query.eq('warehouse_locations.warehouses.branch_id', branchId);
    }

    // Apply filters
    if (location_id) {
      query = query.eq('warehouse_location_id', location_id);
    }
    if (article_id) {
      query = query.eq('article_id', article_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (warehouse_id) {
      query = query.eq('warehouse_locations.warehouse_id', warehouse_id);
    }

    const { data, error } = await query.order('last_moved_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory summary
router.get('/inventory/summary', requireOrgBranch, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const { orgId, branchId, role } = req as any;

    let query = supabase
      .from('warehouse_inventory_summary')
      .select('*')
      .eq('organization_id', orgId);

    if (role !== 'admin' && role !== 'superadmin') {
      query = query.eq('branch_id', branchId);
    }

    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id);
    }

    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create inventory record
router.post('/inventory', requireOrgBranch, async (req, res) => {
  try {
    const parse = inventoryRecordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
    }

    const { orgId, branchId, userId, role } = req as any;
    
    // Verify location exists and user has access
    const { data: location, error: locationError } = await supabase
      .from('warehouse_locations')
      .select(`
        id,
        warehouses!inner(id, organization_id, branch_id)
      `)
      .eq('id', parse.data.warehouse_location_id)
      .eq('warehouses.organization_id', orgId)
      .single();

    if (locationError || !location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (role !== 'admin' && role !== 'superadmin' && location.warehouses.branch_id !== branchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payload = {
      ...parse.data,
      created_by: userId,
      updated_by: userId,
    };

    const { data, error } = await supabase
      .from('inventory_records')
      .insert(payload)
      .select(`
        *,
        warehouse_locations(id, location_code, name),
        articles(id, name),
        bookings(id, lr_number)
      `)
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record inventory movement
router.post('/inventory/movements', requireOrgBranch, async (req, res) => {
  try {
    const parse = inventoryMovementSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
    }

    const { orgId, branchId, userId, role } = req as any;
    
    // Start a transaction for inventory movement
    const { data: inventoryRecord, error: fetchError } = await supabase
      .from('inventory_records')
      .select(`
        *,
        warehouse_locations!inner(
          warehouses!inner(organization_id, branch_id)
        )
      `)
      .eq('id', parse.data.inventory_record_id)
      .eq('warehouse_locations.warehouses.organization_id', orgId)
      .single();

    if (fetchError || !inventoryRecord) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    if (role !== 'admin' && role !== 'superadmin' && 
        inventoryRecord.warehouse_locations.warehouses.branch_id !== branchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate new quantity
    const currentQuantity = inventoryRecord.quantity;
    let newQuantity = currentQuantity;

    switch (parse.data.movement_type) {
      case 'inbound':
        newQuantity = currentQuantity + parse.data.quantity_moved;
        break;
      case 'outbound':
        newQuantity = currentQuantity - parse.data.quantity_moved;
        if (newQuantity < 0) {
          return res.status(400).json({ error: 'Insufficient inventory' });
        }
        break;
      case 'adjustment':
        newQuantity = parse.data.quantity_after;
        break;
    }

    // Create movement record
    const movementPayload = {
      ...parse.data,
      quantity_before: currentQuantity,
      quantity_after: newQuantity,
      created_by: userId,
      requested_by: userId,
    };

    const { data: movement, error: movementError } = await supabase
      .from('inventory_movements')
      .insert(movementPayload)
      .select()
      .single();

    if (movementError) {
      return res.status(500).json({ error: movementError.message });
    }

    // Update inventory record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('inventory_records')
      .update({
        quantity: newQuantity,
        last_moved_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', parse.data.inventory_record_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
    
    res.status(201).json({ 
      success: true, 
      data: { 
        movement, 
        updated_record: updatedRecord 
      } 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as default };