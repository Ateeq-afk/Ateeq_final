import { z } from 'zod';

import { bookingArticleSchema, validateArticleCombination } from './schemas/bookingArticle';

export const bookingSchema = z.object({
  // Core booking fields
  lr_number: z.string().optional(), // Made optional as it will be generated server-side
  lr_type: z.enum(['system', 'manual']).default('system'),
  manual_lr_number: z.string().optional(),
  branch_id: z.string().optional(), // Optional in request, will be set from context
  organization_id: z.string().optional(), // Optional in request, will be set from context
  
  // Route information
  from_branch: z.string().min(1, 'From branch is required'),
  to_branch: z.string().min(1, 'To branch is required'),
  
  // Customer information
  sender_id: z.string().min(1, 'Sender is required'),
  receiver_id: z.string().min(1, 'Receiver is required'),
  
  // Articles information (NEW - replaces single article_id)
  articles: z.array(bookingArticleSchema).min(1, 'At least one article is required'),
  
  // Payment information
  payment_type: z.enum(['Paid', 'To Pay', 'Quotation']),
  
  // Booking-level options
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']).default('Standard'),
  priority: z.enum(['Normal', 'High', 'Urgent']).default('Normal'),
  expected_delivery_date: z.string().optional(),
  reference_number: z.string().optional(),
  remarks: z.string().optional(),
  
  // Invoice information (booking-level)
  has_invoice: z.boolean().default(false),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_amount: z.number().optional(),
  eway_bill_number: z.string().optional(),
}).refine(data => {
  // If lr_type is manual, manual_lr_number is required
  if (data.lr_type === 'manual' && !data.manual_lr_number) {
    return false;
  }
  return true;
}, {
  message: 'Manual LR number is required when lr_type is manual',
  path: ['manual_lr_number']
}).refine(data => {
  // Validate from_branch and to_branch are different
  if (data.from_branch === data.to_branch) {
    return false;
  }
  return true;
}, {
  message: 'Origin and destination branches cannot be the same',
  path: ['to_branch']
}).refine(data => {
  // If has_invoice is true, invoice details are required
  if (data.has_invoice) {
    return !!data.invoice_number && !!data.invoice_date && !!data.invoice_amount;
  }
  return true;
}, {
  message: 'Invoice details are required when has_invoice is true',
  path: ['invoice_number']
}).refine(data => {
  // Validate articles combination
  const validation = validateArticleCombination(data.articles);
  return validation.valid;
}, {
  message: 'Invalid article combination',
  path: ['articles']
});

export const customerSchema = z.object({
  branch_id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  mobile: z.string(),
});

export const vehicleSchema = z.object({
  branch_id: z.string(),
  organization_id: z.string(),
  vehicle_number: z.string().min(1, 'Vehicle number is required'),
  type: z.enum(['own', 'hired', 'attached']),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  
  // Technical Specifications
  fuel_type: z.enum(['diesel', 'petrol', 'cng', 'electric', 'hybrid']),
  capacity: z.string().optional(),
  engine_number: z.string().optional(),
  chassis_number: z.string().optional(),
  
  // Registration & Compliance
  registration_date: z.string().optional(),
  registration_valid_till: z.string().optional(),
  insurance_number: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_expiry: z.string().optional(),
  fitness_certificate_number: z.string().optional(),
  fitness_expiry: z.string().optional(),
  permit_number: z.string().optional(),
  permit_type: z.string().optional(),
  permit_expiry: z.string().optional(),
  pollution_certificate_number: z.string().optional(),
  pollution_expiry: z.string().optional(),
  
  // Status & Maintenance
  status: z.enum(['active', 'maintenance', 'inactive', 'sold', 'accident']).default('active'),
  last_maintenance_date: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  current_odometer_reading: z.number().optional(),
  
  // Additional Information
  purchase_date: z.string().optional(),
  purchase_price: z.number().optional(),
  vendor_name: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleUpdateSchema = vehicleSchema.partial().omit({
  branch_id: true,
  organization_id: true,
});

export const articleSchema = z.object({
  branch_id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  base_rate: z.number(),
  hsn_code: z.string().optional(),
  tax_rate: z.number().optional(),
  unit_of_measure: z.string().optional(),
  min_quantity: z.number().optional(),
  is_fragile: z.boolean().optional(),
  requires_special_handling: z.boolean().optional(),
  notes: z.string().optional(),
});

export const articleUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  base_rate: z.number().optional(),
  hsn_code: z.string().optional(),
  tax_rate: z.number().optional(),
  unit_of_measure: z.string().optional(),
  min_quantity: z.number().optional(),
  is_fragile: z.boolean().optional(),
  requires_special_handling: z.boolean().optional(),
  notes: z.string().optional(),
});

export const customerArticleRateSchema = z.object({
  customer_id: z.string(),
  article_id: z.string(),
  rate: z.number(),
});

export const branchSchema = z.object({
  organization_id: z.string(),
  name: z.string(),
  city: z.string(),
});

// POD (Proof of Delivery) schemas
export const podRecordSchema = z.object({
  booking_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  delivered_by: z.string().min(1, 'Delivery person name is required'),
  delivery_latitude: z.number().optional(),
  delivery_longitude: z.number().optional(),
  
  // Receiver information
  receiver_name: z.string().min(1, 'Receiver name is required'),
  receiver_phone: z.string().min(10, 'Valid phone number required'),
  receiver_designation: z.string().optional(),
  receiver_company: z.string().optional(),
  receiver_id_type: z.enum(['Aadhaar', 'PAN', 'Driving License', 'Voter ID', 'Other']).optional(),
  receiver_id_number: z.string().optional(),
  
  // Evidence
  signature_image_url: z.string().url().optional(),
  photo_evidence_url: z.string().url().optional(),
  receiver_photo_url: z.string().url().optional(),
  
  // Additional information
  delivery_condition: z.enum(['good', 'damaged', 'partial']).default('good'),
  damage_description: z.string().optional(),
  shortage_description: z.string().optional(),
  remarks: z.string().optional(),
});

export const podAttemptSchema = z.object({
  booking_id: z.string().uuid(),
  attempt_number: z.number().int().positive(),
  attempted_by: z.string().min(1),
  reason_for_failure: z.string().optional(),
  next_attempt_date: z.string().optional(), // ISO date string
  notes: z.string().optional(),
});

export const podTemplateSchema = z.object({
  branch_id: z.string().uuid().optional(),
  template_name: z.string().min(1),
  delivery_instructions: z.string().optional(),
  required_documents: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
});

// Update booking status with POD validation and workflow context
export const updateBookingStatusSchema = z.object({
  status: z.enum(['booked', 'in_transit', 'unloaded', 'out_for_delivery', 'delivered', 'cancelled', 'pod_received']),
  pod_required: z.boolean().optional(),
  workflow_context: z.enum(['loading', 'unloading', 'delivery', 'manual']).optional(),
}).refine((data) => {
  // If marking as delivered, ensure POD is not required or will be handled
  if (data.status === 'delivered' && data.pod_required !== false) {
    return false;
  }
  return true;
}, {
  message: "Cannot mark as delivered without completing POD process",
});

// Warehouse management schemas
export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  branch_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  warehouse_type: z.enum(['general', 'cold_storage', 'hazmat', 'bonded']).default('general'),
  total_capacity_sqft: z.number().positive().optional(),
  manager_name: z.string().optional(),
  manager_contact: z.string().optional(),
  operating_hours: z.record(z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })).optional(),
});

export const warehouseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  warehouse_type: z.enum(['general', 'cold_storage', 'hazmat', 'bonded']).optional(),
  total_capacity_sqft: z.number().positive().optional(),
  manager_name: z.string().optional(),
  manager_contact: z.string().optional(),
  operating_hours: z.record(z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })).optional(),
});

export const warehouseLocationSchema = z.object({
  warehouse_id: z.string().uuid(),
  location_code: z.string().min(1, 'Location code is required'),
  name: z.string().min(1, 'Location name is required'),
  description: z.string().optional(),
  location_type: z.enum(['bin', 'rack', 'shelf', 'floor', 'dock', 'staging']).default('bin'),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.string().default('feet'),
  }).optional(),
  capacity_weight: z.number().positive().optional(),
  capacity_volume: z.number().positive().optional(),
  capacity_units: z.number().int().positive().optional(),
  temperature_controlled: z.boolean().default(false),
  humidity_controlled: z.boolean().default(false),
  min_temperature: z.number().optional(),
  max_temperature: z.number().optional(),
  min_humidity: z.number().optional(),
  max_humidity: z.number().optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance', 'disabled']).default('available'),
  is_hazmat_approved: z.boolean().default(false),
  parent_location_id: z.string().uuid().optional(),
  zone_id: z.string().uuid().optional(),
});

export const warehouseLocationUpdateSchema = z.object({
  location_code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  location_type: z.enum(['bin', 'rack', 'shelf', 'floor', 'dock', 'staging']).optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.string().default('feet'),
  }).optional(),
  capacity_weight: z.number().positive().optional(),
  capacity_volume: z.number().positive().optional(),
  capacity_units: z.number().int().positive().optional(),
  temperature_controlled: z.boolean().optional(),
  humidity_controlled: z.boolean().optional(),
  min_temperature: z.number().optional(),
  max_temperature: z.number().optional(),
  min_humidity: z.number().optional(),
  max_humidity: z.number().optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance', 'disabled']).optional(),
  is_hazmat_approved: z.boolean().optional(),
  parent_location_id: z.string().uuid().optional(),
  zone_id: z.string().uuid().optional(),
});

export const inventoryRecordSchema = z.object({
  warehouse_location_id: z.string().uuid(),
  article_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  item_code: z.string().optional(),
  batch_number: z.string().optional(),
  serial_number: z.string().optional(),
  quantity: z.number().nonnegative(),
  reserved_quantity: z.number().nonnegative().default(0),
  weight_per_unit: z.number().positive().optional(),
  total_weight: z.number().positive().optional(),
  dimensions_per_unit: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.string().default('cm'),
  }).optional(),
  status: z.enum(['available', 'reserved', 'damaged', 'expired', 'quarantine', 'in_transit']).default('available'),
  condition_rating: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']).default('good'),
  received_date: z.string().optional(),
  expiry_date: z.string().optional(),
  unit_cost: z.number().positive().optional(),
  total_cost: z.number().positive().optional(),
  supplier_name: z.string().optional(),
  supplier_batch_ref: z.string().optional(),
  quality_check_status: z.enum(['pending', 'passed', 'failed', 'not_required']).default('pending'),
  quality_check_date: z.string().optional(),
  quality_check_by: z.string().uuid().optional(),
  compliance_certifications: z.record(z.any()).optional(),
  remarks: z.string().optional(),
});

export const inventoryMovementSchema = z.object({
  movement_type: z.enum(['inbound', 'outbound', 'transfer', 'adjustment', 'return']),
  movement_reason: z.enum(['receiving', 'shipping', 'transfer', 'damaged', 'expired', 'lost', 'found', 'correction']).optional(),
  inventory_record_id: z.string().uuid(),
  from_location_id: z.string().uuid().optional(),
  to_location_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  reference_document: z.string().optional(),
  quantity_moved: z.number().positive(),
  quantity_before: z.number().nonnegative(),
  quantity_after: z.number().nonnegative(),
  movement_date: z.string().optional(),
  notes: z.string().optional(),
  requested_by: z.string().uuid().optional(),
  approved_by: z.string().uuid().optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected']).default('approved'),
});

export const warehouseZoneSchema = z.object({
  warehouse_id: z.string().uuid(),
  zone_code: z.string().min(1, 'Zone code is required'),
  name: z.string().min(1, 'Zone name is required'),
  description: z.string().optional(),
  zone_type: z.enum(['general', 'receiving', 'shipping', 'picking', 'storage', 'quarantine', 'returns']).default('general'),
  priority_level: z.number().int().positive().default(1),
  temperature_controlled: z.boolean().default(false),
  humidity_controlled: z.boolean().default(false),
  security_level: z.enum(['standard', 'restricted', 'high_security']).default('standard'),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

// Driver management schemas
export const driverSchema = z.object({
  branch_id: z.string(),
  organization_id: z.string(),
  
  // Personal Information
  employee_code: z.string().min(1, 'Employee code is required'),
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  alternate_mobile: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  date_of_birth: z.string().optional(),
  blood_group: z.string().optional(),
  
  // License Information
  license_number: z.string().min(1, 'License number is required'),
  license_type: z.string().min(1, 'License type is required'),
  license_issue_date: z.string().optional(),
  license_expiry_date: z.string().optional(),
  
  // Employment Information
  joining_date: z.string().min(1, 'Joining date is required'),
  status: z.enum(['active', 'inactive', 'suspended', 'terminated']).default('active'),
  salary: z.number().optional(),
  
  // Additional Documents
  aadhar_number: z.string().optional(),
  pan_number: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
});

export const driverUpdateSchema = driverSchema.partial().omit({
  branch_id: true,
  organization_id: true,
});

// Vehicle assignment schemas
export const vehicleAssignmentSchema = z.object({
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  assignment_type: z.enum(['primary', 'secondary', 'temporary']),
  assigned_from: z.string().default(() => new Date().toISOString().split('T')[0]),
  assigned_till: z.string().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

// Vehicle maintenance schemas
export const vehicleMaintenanceSchema = z.object({
  vehicle_id: z.string().uuid(),
  maintenance_type: z.enum(['routine', 'breakdown', 'accident', 'scheduled']),
  description: z.string().min(1, 'Description is required'),
  service_date: z.string().min(1, 'Service date is required'),
  next_service_date: z.string().optional(),
  
  // Cost Information
  labor_cost: z.number().optional(),
  parts_cost: z.number().optional(),
  total_cost: z.number().optional(),
  
  // Service Provider
  service_provider: z.string().optional(),
  service_location: z.string().optional(),
  bill_number: z.string().optional(),
  
  // Odometer Reading
  odometer_reading: z.number().optional(),
  
  // Parts Replaced
  parts_replaced: z.string().optional(),
  
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  notes: z.string().optional(),
});

// Fuel record schemas
export const fuelRecordSchema = z.object({
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid().optional(),
  
  // Fuel Information
  fuel_date: z.string().default(() => new Date().toISOString().split('T')[0]),
  fuel_type: z.string().min(1, 'Fuel type is required'),
  quantity: z.number().positive('Quantity must be positive'),
  rate_per_unit: z.number().positive('Rate must be positive'),
  total_amount: z.number().positive('Total amount must be positive'),
  
  // Station Information
  fuel_station_name: z.string().optional(),
  location: z.string().optional(),
  bill_number: z.string().optional(),
  
  // Odometer Reading
  odometer_reading: z.number().positive('Odometer reading must be positive'),
  distance_covered: z.number().optional(),
  mileage: z.number().optional(),
  
  payment_mode: z.enum(['cash', 'card', 'credit', 'company_card']).optional(),
});

// Vehicle document schemas
export const vehicleDocumentSchema = z.object({
  vehicle_id: z.string().uuid(),
  document_type: z.string().min(1, 'Document type is required'),
  document_number: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  issuing_authority: z.string().optional(),
  
  // File storage
  file_name: z.string().optional(),
  file_url: z.string().optional(),
  file_size: z.number().optional(),
  
  notes: z.string().optional(),
});

// GPS tracking schemas
export const gpsTrackingSchema = z.object({
  vehicle_id: z.string().uuid(),
  device_id: z.string().min(1, 'Device ID is required'),
  provider: z.string().optional(),
  
  // Current Location
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  
  // Additional Data
  battery_level: z.number().min(0).max(100).optional(),
  signal_strength: z.number().optional(),
  engine_status: z.boolean().optional(),
  ac_status: z.boolean().optional(),
  fuel_level: z.number().min(0).max(100).optional(),
});
