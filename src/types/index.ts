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
  // Credit management fields
  category?: 'Regular' | 'Premium' | 'Corporate';
  current_balance?: number;
  credit_utilized?: number;
  credit_status?: 'Active' | 'On Hold' | 'Blocked' | 'Suspended';
  billing_cycle?: 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly';
  next_billing_date?: string;
  auto_invoice?: boolean;
  portal_access?: boolean;
  portal_pin?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  sla_delivery_hours?: number;
  sla_complaint_hours?: number;
  discount_percentage?: number;
  notes?: string;
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
  customer_name?: string;
  customer_type?: 'individual' | 'corporate';
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

// Booking Article types (NEW - replaces single article fields)
export interface BookingArticle {
  id: string;
  booking_id: string;
  article_id: string;
  
  // Quantity and measurements
  quantity: number;
  unit_of_measure: 'Nos' | 'Kg' | 'Tons' | 'Boxes' | 'Bags' | 'Bundles' | 'Meters' | 'Liters';
  actual_weight: number;
  charged_weight?: number;
  declared_value?: number;
  
  // Pricing
  rate_per_unit: number;
  rate_type: 'per_kg' | 'per_quantity';
  freight_amount: number;
  
  // Per-unit charges (multiplied by quantity)
  loading_charge_per_unit: number;
  unloading_charge_per_unit: number;
  total_loading_charges: number;
  total_unloading_charges: number;
  
  // Insurance and packaging
  insurance_required: boolean;
  insurance_value?: number;
  insurance_charge: number;
  packaging_charge: number;
  
  // Total amount for this article
  total_amount: number;
  
  // Article attributes
  description?: string;
  private_mark_number?: string;
  is_fragile: boolean;
  special_instructions?: string;
  
  // Status tracking
  status: 'booked' | 'loaded' | 'in_transit' | 'unloaded' | 'out_for_delivery' | 'delivered' | 'damaged' | 'missing' | 'cancelled';
  
  // Logistics tracking
  loaded_at?: string;
  loaded_by?: string;
  unloaded_at?: string;
  unloaded_by?: string;
  delivered_at?: string;
  delivered_by?: string;
  
  // Warehouse and OGPL
  warehouse_location?: string;
  ogpl_id?: string;
  
  // Relations
  article?: Article;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Updated Booking type (simplified - articles are separate)
export interface Booking {
  id: string;
  branch_id: string;
  organization_id: string;
  lr_number: string;
  lr_type: 'system' | 'manual';
  manual_lr_number?: string;
  
  // Route information
  from_branch: string;
  to_branch: string;
  
  // Customer information
  sender_id: string;
  receiver_id: string;
  
  // Payment and delivery
  payment_type: 'Quotation' | 'To Pay' | 'Paid';
  delivery_type: 'Standard' | 'Express' | 'Same Day';
  priority: 'Normal' | 'High' | 'Urgent';
  expected_delivery_date?: string;
  
  // Booking-level information
  reference_number?: string;
  remarks?: string;
  total_amount: number;
  
  // Status
  status: 'booked' | 'in_transit' | 'unloaded' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'pod_received';
  
  // Loading and unloading status tracking
  loading_status?: 'pending' | 'loaded' | 'in_transit' | 'completed';
  unloading_status?: 'pending' | 'in_progress' | 'completed';
  loading_session_id?: string;
  loaded_at?: string;
  loaded_by?: string;
  unloaded_at?: string;
  unloaded_by?: string;
  
  // Invoice information (booking-level)
  has_invoice: boolean;
  invoice_number?: string;
  invoice_date?: string;
  invoice_amount?: number;
  eway_bill_number?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations (loaded via joins)
  booking_articles?: BookingArticle[];
  sender?: Customer;
  receiver?: Customer;
  from_branch_details?: Branch;
  to_branch_details?: Branch;
  
  // POD and logistics tracking
  pod_status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
  pod_required?: boolean;
  pod_record_id?: string;
  pod_data?: any;
  delivery_attempts?: number;
  delivery_attempted_at?: string;
  cancellation_reason?: string;
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

// ===================== BILLING TYPES =====================

export interface BillingCycle {
  id: string;
  branch_id: string;
  organization_id: string;
  name: string;
  type: 'monthly' | 'weekly' | 'fortnightly' | 'quarterly' | 'custom';
  start_date: string;
  end_date: string;
  due_days: number;
  auto_generate: boolean;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
}

export interface Invoice {
  id: string;
  branch_id: string;
  organization_id: string;
  customer_id: string;
  billing_cycle_id?: string;
  invoice_number: string;
  invoice_type: 'regular' | 'supplementary' | 'credit_note' | 'debit_note';
  reference_invoice_id?: string;
  invoice_date: string;
  due_date: string;
  service_period_start?: string;
  service_period_end?: string;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  total_tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
  gstin?: string;
  place_of_supply?: string;
  reverse_charge: boolean;
  notes?: string;
  terms_and_conditions?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  customers?: Customer;
  billing_cycles?: BillingCycle;
  invoice_line_items?: InvoiceLineItem[];
  payment_records?: PaymentRecord[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  booking_id?: string;
  description: string;
  hsn_sac_code?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
}

export interface SupplementaryBilling {
  id: string;
  branch_id: string;
  organization_id: string;
  customer_id: string;
  original_invoice_id?: string;
  reference_number: string;
  billing_date: string;
  reason: string;
  description?: string;
  charge_type: 'additional_service' | 'penalty' | 'adjustment' | 'extra_charge';
  amount: number;
  is_taxable: boolean;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'invoiced' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  customers?: Customer;
}

export interface CreditDebitNote {
  id: string;
  branch_id: string;
  organization_id: string;
  customer_id: string;
  original_invoice_id: string;
  note_number: string;
  note_type: 'credit' | 'debit';
  note_date: string;
  reason: string;
  description?: string;
  adjustment_type: 'discount' | 'return' | 'damage' | 'shortage' | 'rate_correction' | 'other';
  original_amount: number;
  adjustment_amount: number;
  tax_adjustment: number;
  total_adjustment: number;
  status: 'draft' | 'approved' | 'applied' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  customers?: Customer;
  original_invoice?: Invoice;
}

export interface BulkBillingRun {
  id: string;
  branch_id: string;
  organization_id: string;
  billing_cycle_id?: string;
  run_name: string;
  run_date: string;
  billing_period_start: string;
  billing_period_end: string;
  customer_filter?: any;
  include_supplementary: boolean;
  auto_send_invoices: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_customers: number;
  processed_customers: number;
  successful_invoices: number;
  failed_invoices: number;
  total_invoice_amount: number;
  error_log?: string;
  processing_log?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  created_by: string;
  billing_cycles?: BillingCycle;
}

export interface PaymentRecord {
  id: string;
  branch_id: string;
  organization_id: string;
  invoice_id: string;
  customer_id: string;
  payment_reference: string;
  payment_date: string;
  payment_method: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'dd' | 'other';
  amount: number;
  bank_name?: string;
  cheque_number?: string;
  transaction_id?: string;
  utr_number?: string;
  status: 'pending' | 'cleared' | 'bounced' | 'cancelled';
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  invoices?: Invoice;
  customers?: Customer;
}

export const STATUS_UNLOADED = 'unloaded';

// Credit Management Types
export interface CreditTransaction {
  id: string;
  organization_id: string;
  branch_id: string;
  customer_id: string;
  transaction_type: 'Booking' | 'Payment' | 'Adjustment' | 'Refund' | 'Credit Note' | 'Debit Note';
  transaction_date: string;
  reference_type?: string;
  reference_id?: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface CreditLimitHistory {
  id: string;
  customer_id: string;
  old_limit?: number;
  new_limit: number;
  changed_by?: string;
  change_reason?: string;
  changed_at: string;
}

export interface CustomerContract {
  id: string;
  organization_id: string;
  customer_id: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  auto_renew: boolean;
  terms: Record<string, any>;
  sla_terms: Record<string, any>;
  special_rates: Record<string, any>;
  document_url?: string;
  status: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerBillingCycle {
  id: string;
  organization_id: string;
  customer_id: string;
  cycle_start_date: string;
  cycle_end_date: string;
  total_bookings: number;
  total_amount: number;
  invoice_id?: string;
  status: 'Open' | 'Invoiced' | 'Paid' | 'Overdue';
  created_at: string;
}

export interface CustomerPortalAccess {
  id: string;
  customer_id: string;
  access_email: string;
  access_phone?: string;
  is_primary: boolean;
  permissions: {
    view_bookings: boolean;
    view_invoices: boolean;
    make_payments: boolean;
  };
  last_login?: string;
  login_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditAlert {
  id: string;
  organization_id: string;
  customer_id: string;
  alert_type: 'Limit Exceeded' | 'Near Limit' | 'Overdue' | 'Large Transaction';
  alert_level: 'Info' | 'Warning' | 'Critical';
  message: string;
  threshold_value?: number;
  current_value?: number;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  read_by?: string;
}

export interface CustomerCreditSummary {
  id: string;
  branch_id: string;
  organization_id: string;
  name: string;
  mobile: string;
  category: 'Regular' | 'Premium' | 'Corporate';
  credit_limit: number;
  current_balance: number;
  credit_utilized: number;
  utilization_percentage: number;
  credit_status: 'Active' | 'On Hold' | 'Blocked' | 'Suspended';
  billing_cycle: 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly';
  next_billing_date?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  pending_bookings: number;
  pending_amount: number;
  days_overdue: number;
}

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
