import { z } from 'zod';

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
  
  // Article information
  article_id: z.string().min(1, 'Article is required'),
  description: z.string().optional(),
  uom: z.string(),
  actual_weight: z.number().optional(),
  charged_weight: z.number().optional(),
  quantity: z.number().min(1),
  
  // Payment information
  payment_type: z.enum(['Paid', 'To Pay', 'Quotation']),
  freight_per_qty: z.number().min(0),
  loading_charges: z.number().min(0).default(0),
  unloading_charges: z.number().min(0).default(0),
  
  // Additional fields
  private_mark_number: z.string().optional(),
  remarks: z.string().optional(),
  
  // Invoice information
  has_invoice: z.boolean().default(false),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_amount: z.number().optional(),
  eway_bill_number: z.string().optional(),
  
  // Additional options
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']).default('Standard'),
  insurance_required: z.boolean().default(false),
  insurance_value: z.number().optional(),
  insurance_charge: z.number().min(0).optional(),
  fragile: z.boolean().default(false),
  priority: z.enum(['Normal', 'High', 'Urgent']).default('Normal'),
  expected_delivery_date: z.string().optional(),
  packaging_type: z.string().optional(),
  packaging_charge: z.number().min(0).optional(),
  special_instructions: z.string().optional(),
  reference_number: z.string().optional(),
}).refine(data => {
  // If lr_type is manual, manual_lr_number is required
  if (data.lr_type === 'manual' && !data.manual_lr_number && !data.lr_number) {
    return false;
  }
  return true;
}, {
  message: 'Manual LR number is required when lr_type is manual',
  path: ['manual_lr_number']
}).refine(data => {
  // If has_invoice is true, invoice details are required
  if (data.has_invoice) {
    return !!data.invoice_number && !!data.invoice_date && !!data.invoice_amount;
  }
  return true;
}, {
  message: 'Invoice details are required',
  path: ['invoice_number']
}).refine(data => {
  // If insurance_required is true, insurance_value is required
  if (data.insurance_required) {
    return !!data.insurance_value;
  }
  return true;
}, {
  message: 'Insurance value is required',
  path: ['insurance_value']
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
  number: z.string(),
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

// Update booking status with POD validation
export const updateBookingStatusSchema = z.object({
  status: z.enum(['booked', 'in_transit', 'unloaded', 'out_for_delivery', 'delivered', 'cancelled', 'pod_received']),
  pod_required: z.boolean().optional(),
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
