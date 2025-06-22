// Branch types
export interface Branch {
  id: string;
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
  quantity: number;
  freight_per_qty: number;
  loading_charges: number;
  unloading_charges: number;
  total_amount: number;
  private_mark_number?: string;
  remarks?: string;
  payment_type: 'Quotation' | 'To Pay' | 'Paid';
  status: 'booked' | 'in_transit' | 'delivered' | 'cancelled';
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
  status: 'created' | 'in_transit' | 'completed' | 'cancelled';
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