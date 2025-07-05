// Branch types
export interface Branch {
  id: string;
  code?: string;
  name: string;
  city: string;
  state?: string;
  is_head_office: boolean;
  phone?: string;
  email?: string;
  status: 'active' | 'maintenance' | 'closed';
  created_at: string;
  updated_at: string;
}
// Customer types
export interface Customer {
  id: string;
  branch_id: string;
  name: string;
  mobile: string;
  gst?: string;
  type: 'individual' | 'company';
  created_at: string;
  updated_at: string;
  branch_name?: string;
  branch_code?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  credit_limit?: number;
  payment_terms?: string;
  organization_id?: string;
}

export interface Vendor {
  id: string;
  branch_id: string;
  name: string;
  type: 'Driver' | 'Labour' | 'Fuel' | 'Rent' | 'Maintenance' | 'Others';
  contact?: string;
  email?: string;
  gst_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerArticleRate {
  id: string;
  customer_id: string;
  article_id: string;
  rate: number;
  created_at: string;
  updated_at: string;
}

// Article types
export interface Article {
  id: string;
  branch_id: string;
  name: string;
  description: string;
  base_rate: number;
  created_at: string;
  updated_at: string;
  branch_name?: string;
  hsn_code?: string;
  tax_rate?: number;
  unit_of_measure?: string;
  min_quantity?: number;
  is_fragile?: boolean;
  requires_special_handling?: boolean;
  notes?: string;
}

// Booking types
export interface Booking {
  id: string;
  branch_id: string;
  lr_number: string;
  lr_type: 'system' | 'manual';
  manual_lr_number?: string;
  from_branch: string;
  to_branch: string;
  article_id: string;
  description?: string;
  uom: string;
  actual_weight: number;
  charged_weight?: number;
  quantity: number;
  freight_per_qty: number;
  loading_charges: number;
  unloading_charges: number;
  total_amount: number;
  private_mark_number?: string;
  remarks?: string;
  payment_type: 'Quotation' | 'To Pay' | 'Paid';
  status:
    | 'booked'
    | 'in_transit'
    | 'unloaded'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'pod_received';
  created_at: string;
  updated_at: string;
  sender?: Customer;
  receiver?: Customer;
  article?: Article;
  from_branch_details?: Branch;
  to_branch_details?: Branch;
  // Invoice details
  has_invoice?: boolean;
  invoice_number?: string;
  invoice_amount?: number;
  invoice_date?: string;
  eway_bill_number?: string;
  // Additional fields
  delivery_type?: 'Standard' | 'Express' | 'Same Day';
  insurance_required?: boolean;
  insurance_value?: number;
  insurance_charge?: number;
  fragile?: boolean;
  priority?: 'Normal' | 'High' | 'Urgent';
  expected_delivery_date?: string;
  packaging_type?: string;
  packaging_charge?: number;
  special_instructions?: string;
  reference_number?: string;
  sender_id?: string;
  receiver_id?: string;
  // Logistics tracking fields
  loading_status?: 'pending' | 'loaded';
  unloading_status?: 'pending' | 'unloaded' | 'missing';
  pod_status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
  loading_session_id?: string;
  unloading_session_id?: string;
  pod_record_id?: string;
  delivery_date?: string;
  pod_data?: any;
  cancellation_reason?: string;
  pod_required?: boolean;
  delivery_attempts?: number;
  delivery_attempted_at?: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  client_code?: string;
  settings: Record<string, any>;
  usage_data: {
    bookings_count: number;
    storage_used: number;
    api_calls: number;
    users_count: number;
  };
  created_at: string;
  updated_at: string;
  branches?: number;
  members?: number;
}

// OGPL types
export interface OGPL {
  id: string;
  organization_id: string;
  ogpl_number: string;
  name: string;
  vehicle_id: string;
  transit_mode: 'direct' | 'hub' | 'local';
  route_id: string;
  transit_date: string;
  from_station: string;
  to_station: string;
  departure_time: string;
  arrival_time: string;
  supervisor_name: string;
  supervisor_mobile: string;
  primary_driver_name: string;
  primary_driver_mobile: string;
  secondary_driver_name?: string;
  secondary_driver_mobile?: string;
  via_stations?: string[];
  hub_load_stations?: string[];
  local_transit_station?: string;
  remarks?: string;
  status: 'created' | 'in_transit' | 'unloaded' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  vehicle?: any;
  route?: any;
  from_station_details?: Branch;
  to_station_details?: Branch;
  loading_records?: any[];
}

// Branch User types
export interface BranchUser {
  id: string;
  branch_id: string;
  user_id: string;
  role: 'admin' | 'operator';
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// Audit Log types
export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  details: Record<string, any>;
  status: 'success' | 'failure';
  error_message?: string;
  created_at: string;
  user?: {
    email: string;
  };
}

export const STATUS_UNLOADED = 'unloaded';

// Filter and Sort types
export interface Filters {
  search: string;
  status: string;
  dateRange: string;
  paymentType: string;
  branch: string;
  customer?: string;
}

export type SortField = 'lr_number' | 'consignor' | 'consignee' | 'from_city' | 'to_city' | 'created_at' | 'total_amount';
export type SortDirection = 'asc' | 'desc';

// POD (Proof of Delivery) types
export interface PODRecord {
  id: string;
  booking_id: string;
  branch_id: string;
  delivered_at: string;
  delivered_by: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_designation?: string;
  receiver_company?: string;
  receiver_id_type?: 'Aadhaar' | 'PAN' | 'Driving License' | 'Voter ID' | 'Other';
  receiver_id_number?: string;
  signature_image_url?: string;
  photo_evidence_url?: string;
  receiver_photo_url?: string;
  delivery_condition: 'good' | 'damaged' | 'partial';
  damage_description?: string;
  shortage_description?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  booking?: Booking;
}

export interface PODAttempt {
  id: string;
  booking_id: string;
  attempt_number: number;
  attempted_at: string;
  attempted_by: string;
  reason_for_failure?: string;
  next_attempt_date?: string;
  notes?: string;
  created_at: string;
}

export interface PODTemplate {
  id: string;
  branch_id?: string;
  template_name: string;
  delivery_instructions?: string;
  required_documents?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PODFormData {
  receiverName: string;
  receiverPhone: string;
  receiverDesignation?: string;
  receiverCompany?: string;
  receiverIdType?: 'Aadhaar' | 'PAN' | 'Driving License' | 'Voter ID' | 'Other';
  receiverIdNumber?: string;
  receivedDate: string;
  receivedTime: string;
  deliveryCondition: 'good' | 'damaged' | 'partial';
  damageDescription?: string;
  shortageDescription?: string;
  remarks?: string;
  signatureImage: string | null;
  photoEvidence: string | null;
  receiverPhoto?: string | null;
}
