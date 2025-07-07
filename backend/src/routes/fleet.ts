import { Router } from 'express';
import { 
  vehicleAssignmentSchema, 
  vehicleMaintenanceSchema, 
  fuelRecordSchema,
  vehicleDocumentSchema,
  gpsTrackingSchema 
} from '../schemas';
import { supabase } from '../supabaseClient';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import { asyncHandler } from '../utils/apiResponse';

const router = Router();

// Vehicle Assignments
router.post('/assignments', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = vehicleAssignmentSchema.safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  const { userId, orgId, branchId, role } = req;
  const payload = { 
    ...parse.data, 
    organization_id: orgId,
    branch_id: branchId,
    created_by: userId 
  };
  
  // Verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', parse.data.vehicle_id)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Verify driver belongs to organization
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('id', parse.data.driver_id)
    .eq('organization_id', orgId)
    .single();
    
  if (!driver) {
    return res.sendNotFound('Driver');
  }
  
  // Check if driver already has an active assignment
  if (parse.data.is_active) {
    const { data: existing } = await supabase
      .from('vehicle_assignments')
      .select('id')
      .eq('driver_id', parse.data.driver_id)
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .single();
      
    if (existing) {
      return res.sendError('Driver already has an active vehicle assignment', 400);
    }
  }
  
  const { data, error } = await supabase
    .from('vehicle_assignments')
    .insert(payload)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}));

router.put('/assignments/:id', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const { orgId, branchId, role } = req;
  const parse = vehicleAssignmentSchema.partial().safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  let query = supabase
    .from('vehicle_assignments')
    .update(parse.data)
    .eq('id', id)
    .eq('organization_id', orgId);
  
  // Non-admins can only update their branch assignments
  if (role !== 'admin' && role !== 'superadmin') {
    query = query.eq('branch_id', branchId);
  }
  
  const { data, error } = await query.select().single();
    
  if (error) return res.sendDatabaseError(error, 'Update vehicle assignment');
  if (!data) return res.sendNotFound('Vehicle assignment');
  res.sendSuccess(data);
}));

// Vehicle Maintenance
router.get('/vehicles/:vehicleId/maintenance', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { vehicleId } = req.params;
  const { orgId, branchId, role } = req;
  const { status, from_date, to_date } = req.query;
  
  // First verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', vehicleId)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only see their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  let query = supabase
    .from('vehicle_maintenance')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('organization_id', orgId)
    .order('service_date', { ascending: false });
    
  if (status) query = query.eq('status', status);
  if (from_date) query = query.gte('service_date', from_date);
  if (to_date) query = query.lte('service_date', to_date);
  
  const { data, error } = await query;
  if (error) return res.sendDatabaseError(error, 'Fetch maintenance records');
  res.sendSuccess(data);
}));

router.post('/maintenance', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = vehicleMaintenanceSchema.safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  const { userId, orgId, branchId, role } = req;
  
  // Verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', parse.data.vehicle_id)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only maintain their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  const payload = { 
    ...parse.data, 
    organization_id: orgId,
    branch_id: vehicle.branch_id,
    created_by: userId 
  };
  
  // Update vehicle's maintenance dates if completed
  if (parse.data.status === 'completed' && parse.data.next_service_date) {
    await supabase
      .from('vehicles')
      .update({
        last_maintenance_date: parse.data.service_date,
        next_maintenance_date: parse.data.next_service_date,
        current_odometer_reading: parse.data.odometer_reading
      })
      .eq('id', parse.data.vehicle_id);
  }
  
  const { data, error } = await supabase
    .from('vehicle_maintenance')
    .insert(payload)
    .select()
    .single();
    
  if (error) return res.sendDatabaseError(error, 'Create maintenance record');
  res.sendSuccess(data, 'Maintenance record created successfully');
}));

router.put('/maintenance/:id', requireOrgBranch, async (req, res) => {
  const { id } = req.params;
  const parse = vehicleMaintenanceSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  
  const { data, error } = await supabase
    .from('vehicle_maintenance')
    .update(parse.data)
    .eq('id', id)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  
  // Update vehicle's maintenance dates if completed
  if (data && data.status === 'completed' && data.next_service_date) {
    await supabase
      .from('vehicles')
      .update({
        last_maintenance_date: data.service_date,
        next_maintenance_date: data.next_service_date,
        current_odometer_reading: data.odometer_reading
      })
      .eq('id', data.vehicle_id);
  }
  
  res.json(data);
});

// Fuel Records
router.get('/vehicles/:vehicleId/fuel', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { vehicleId } = req.params;
  const { orgId, branchId, role } = req;
  const { from_date, to_date } = req.query;
  
  // Verify vehicle access
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', vehicleId)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only see their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  let query = supabase
    .from('fuel_records')
    .select(`
      *,
      drivers!inner (
        name,
        employee_code,
        organization_id
      )
    `)
    .eq('vehicle_id', vehicleId)
    .eq('organization_id', orgId)
    .eq('drivers.organization_id', orgId)
    .order('fuel_date', { ascending: false });
    
  if (from_date) query = query.gte('fuel_date', from_date);
  if (to_date) query = query.lte('fuel_date', to_date);
  
  const { data, error } = await query;
  if (error) return res.sendDatabaseError(error, 'Fetch fuel records');
  res.sendSuccess(data);
}));

router.post('/fuel', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = fuelRecordSchema.safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  const { userId, orgId, branchId, role } = req;
  
  // Verify vehicle and driver belong to organization
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', parse.data.vehicle_id)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only add fuel for their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  if (parse.data.driver_id) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', parse.data.driver_id)
      .eq('organization_id', orgId)
      .single();
      
    if (!driver) {
      return res.sendNotFound('Driver');
    }
  }
  
  const payload = { 
    ...parse.data,
    organization_id: orgId,
    branch_id: vehicle.branch_id,
    created_by: userId 
  };
  
  // Calculate mileage if previous record exists
  const { data: previousRecord } = await supabase
    .from('fuel_records')
    .select('odometer_reading, fuel_date')
    .eq('vehicle_id', parse.data.vehicle_id)
    .eq('organization_id', orgId)
    .lt('odometer_reading', parse.data.odometer_reading)
    .order('odometer_reading', { ascending: false })
    .limit(1)
    .single();
    
  if (previousRecord) {
    const distance = parse.data.odometer_reading - previousRecord.odometer_reading;
    const mileage = distance / parse.data.quantity;
    payload.distance_covered = distance;
    payload.mileage = mileage;
  }
  
  const { data, error } = await supabase
    .from('fuel_records')
    .insert(payload)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  
  // Update vehicle's current odometer reading
  await supabase
    .from('vehicles')
    .update({ current_odometer_reading: parse.data.odometer_reading })
    .eq('id', parse.data.vehicle_id)
    .eq('organization_id', orgId);
    
  res.sendSuccess(data, 'Fuel record created successfully');
}));

// Vehicle Documents
router.get('/vehicles/:vehicleId/documents', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { vehicleId } = req.params;
  const { orgId, branchId, role } = req;
  
  // Verify vehicle access
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', vehicleId)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only see their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  const { data, error } = await supabase
    .from('vehicle_documents')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
    
  if (error) return res.sendDatabaseError(error, 'Fetch vehicle documents');
  res.sendSuccess(data);
}));

router.post('/documents', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = vehicleDocumentSchema.safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  const { userId, orgId, branchId, role } = req;
  
  // Verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', parse.data.vehicle_id)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only add documents for their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  const payload = { 
    ...parse.data,
    organization_id: orgId,
    branch_id: vehicle.branch_id,
    uploaded_by: userId 
  };
  
  const { data, error } = await supabase
    .from('vehicle_documents')
    .insert(payload)
    .select()
    .single();
    
  if (error) return res.sendDatabaseError(error, 'Create vehicle document');
  res.sendSuccess(data, 'Document uploaded successfully');
}));

// GPS Tracking
router.get('/vehicles/:vehicleId/tracking', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { vehicleId } = req.params;
  const { orgId, branchId, role } = req;
  
  // Verify vehicle access
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', vehicleId)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only see their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  const { data, error } = await supabase
    .from('vehicle_gps_tracking')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('organization_id', orgId)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    return res.sendDatabaseError(error, 'Fetch GPS tracking');
  }
  
  res.sendSuccess(data || null);
}));

router.post('/tracking', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const parse = gpsTrackingSchema.safeParse(req.body);
  if (!parse.success) return res.sendValidationError(parse.error.errors);
  
  const { orgId, branchId, role } = req;
  
  // Verify vehicle belongs to organization
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', parse.data.vehicle_id)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only update their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  const payload = { 
    ...parse.data,
    organization_id: orgId,
    branch_id: vehicle.branch_id,
    last_updated: new Date().toISOString() 
  };
  
  const { data, error } = await supabase
    .from('vehicle_gps_tracking')
    .upsert(payload, { 
      onConflict: 'vehicle_id,device_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();
    
  if (error) return res.sendDatabaseError(error, 'Update GPS tracking');
  res.sendSuccess(data);
}));

// Analytics & Reports
router.get('/analytics/mileage/:vehicleId', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { vehicleId } = req.params;
  const { orgId, branchId, role } = req;
  
  // Verify vehicle access
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, branch_id')
    .eq('id', vehicleId)
    .eq('organization_id', orgId)
    .single();
    
  if (!vehicle) {
    return res.sendNotFound('Vehicle');
  }
  
  // Non-admins can only see their branch vehicles
  if (role !== 'admin' && role !== 'superadmin' && vehicle.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this vehicle');
  }
  
  const { data, error } = await supabase
    .rpc('calculate_vehicle_mileage', { 
      p_vehicle_id: vehicleId,
      p_organization_id: orgId 
    });
    
  if (error) return res.sendDatabaseError(error, 'Calculate mileage');
  res.sendSuccess(data?.[0] || {});
}));

router.get('/analytics/upcoming-maintenance', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { days = 30 } = req.query;
  const { orgId, branchId, role } = req;
  
  // Get vehicles for the organization
  let vehicleQuery = supabase
    .from('vehicles')
    .select('id, vehicle_number, next_maintenance_date, branch_id')
    .eq('organization_id', orgId)
    .not('next_maintenance_date', 'is', null);
  
  // Non-admins only see their branch vehicles
  if (role !== 'admin' && role !== 'superadmin') {
    vehicleQuery = vehicleQuery.eq('branch_id', branchId);
  }
  
  const { data: vehicles, error } = await vehicleQuery;
  
  if (error) return res.sendDatabaseError(error, 'Fetch upcoming maintenance');
  
  // Filter vehicles with maintenance due within specified days
  const upcomingDate = new Date();
  upcomingDate.setDate(upcomingDate.getDate() + Number(days));
  
  const filtered = vehicles?.filter(vehicle => {
    const maintenanceDate = new Date(vehicle.next_maintenance_date);
    return maintenanceDate <= upcomingDate;
  }) || [];
  
  res.sendSuccess(filtered);
}));

// Maintenance Alerts
router.get('/alerts', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { orgId, branchId, role } = req;
  const { is_active = true, is_acknowledged = false } = req.query;
  
  let query = supabase
    .from('maintenance_alerts')
    .select(`
      *,
      vehicles!inner (
        id,
        vehicle_number,
        type,
        make,
        model,
        organization_id,
        branch_id
      )
    `)
    .eq('vehicles.organization_id', orgId);
  
  // Non-admins only see their branch alerts
  if (role !== 'admin' && role !== 'superadmin') {
    query = query.eq('vehicles.branch_id', branchId);
  }
    
  if (is_active !== undefined) query = query.eq('is_active', is_active);
  if (is_acknowledged !== undefined) query = query.eq('is_acknowledged', is_acknowledged);
  
  const { data, error } = await query.order('alert_date', { ascending: true });
  if (error) return res.sendDatabaseError(error, 'Fetch maintenance alerts');
  res.sendSuccess(data);
}));

router.put('/alerts/:id/acknowledge', requireOrgBranch, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const { userId, orgId, branchId, role } = req;
  
  // First verify the alert belongs to a vehicle in the user's organization
  const { data: alert } = await supabase
    .from('maintenance_alerts')
    .select(`
      id,
      vehicles!inner (
        organization_id,
        branch_id
      )
    `)
    .eq('id', id)
    .eq('vehicles.organization_id', orgId)
    .single();
  
  if (!alert) {
    return res.sendNotFound('Maintenance alert');
  }
  
  // Non-admins can only acknowledge their branch alerts
  if (role !== 'admin' && role !== 'superadmin' && alert.vehicles.branch_id !== branchId) {
    return res.sendForbidden('Access denied to this alert');
  }
  
  const { data, error } = await supabase
    .from('maintenance_alerts')
    .update({
      is_acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) return res.sendDatabaseError(error, 'Acknowledge alert');
  res.sendSuccess(data);
}));

export default router;