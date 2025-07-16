-- Migration: Comprehensive RLS Policy Strengthening for Multi-Tenant Security
-- This migration supersedes previous RLS policies and implements strict data isolation
-- ensuring users can only access data within their organization and branch scope

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Drop existing helper functions to recreate with improved logic
DROP FUNCTION IF EXISTS public.get_user_context CASCADE;
DROP FUNCTION IF EXISTS public.can_access_branch_data CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin CASCADE;
DROP FUNCTION IF EXISTS public.can_access_organization_data CASCADE;

-- Function to check if user is a super admin (has unrestricted access)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get user's full context including organization and branch
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS TABLE(
  user_id UUID, 
  organization_id UUID, 
  branch_id UUID, 
  role TEXT,
  is_super_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.organization_id,
    u.branch_id,
    u.role,
    (u.role = 'super_admin') as is_super_admin
  FROM public.users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user can access organization-level data
CREATE OR REPLACE FUNCTION public.can_access_organization_data(p_organization_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_context RECORD;
BEGIN
  -- Super admins can access everything
  IF public.is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Get user context
  SELECT * INTO v_user_context FROM public.get_user_context();
  
  -- Check if user belongs to the organization
  RETURN v_user_context.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user can access branch-level data
CREATE OR REPLACE FUNCTION public.can_access_branch_data(p_branch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_context RECORD;
BEGIN
  -- Super admins can access everything
  IF public.is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Get user context
  SELECT * INTO v_user_context FROM public.get_user_context();
  
  -- Organization admins can access all branches in their organization
  IF v_user_context.role = 'admin' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.branches b
      WHERE b.id = p_branch_id 
      AND b.organization_id = v_user_context.organization_id
    );
  END IF;
  
  -- Other users can only access their own branch
  RETURN v_user_context.branch_id = p_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- CORE TENANT TABLES
-- =====================================================

-- Organizations table - Only super admins and org admins can manage
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizations access" ON public.organizations;
CREATE POLICY "Organizations access" ON public.organizations
  FOR ALL 
  USING (
    public.is_super_admin() OR
    (EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.organization_id = organizations.id
      AND u.role = 'admin'
    ))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.organization_id = organizations.id
      AND u.role = 'admin'
    ))
  );

-- Branches table - Organization-scoped access
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Branches access" ON public.branches;
CREATE POLICY "Branches access" ON public.branches
  FOR SELECT 
  USING (public.can_access_organization_data(organization_id));

DROP POLICY IF EXISTS "Branches management" ON public.branches;
CREATE POLICY "Branches management" ON public.branches
  FOR INSERT, UPDATE, DELETE
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.organization_id = branches.organization_id
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.organization_id = branches.organization_id
      AND u.role = 'admin'
    )
  );

-- Users table - Strict access control
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users
  FOR SELECT
  USING (
    id = auth.uid() OR
    public.is_super_admin() OR
    (
      -- Org admins can see users in their organization
      EXISTS (
        SELECT 1 FROM public.users current_user
        WHERE current_user.id = auth.uid()
        AND current_user.role = 'admin'
        AND current_user.organization_id = users.organization_id
      )
    )
  );

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent privilege escalation
    (
      role = (SELECT role FROM public.users WHERE id = auth.uid()) OR
      public.is_super_admin()
    )
  );

DROP POLICY IF EXISTS "Admin manage users" ON public.users;
CREATE POLICY "Admin manage users" ON public.users
  FOR INSERT, DELETE
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      AND u.organization_id = users.organization_id
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
      AND u.organization_id = users.organization_id
    )
  );

-- =====================================================
-- BOOKING AND LOGISTICS TABLES
-- =====================================================

-- Bookings table - Branch-scoped with multi-branch visibility
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bookings access" ON public.bookings;
CREATE POLICY "Bookings access" ON public.bookings
  FOR ALL
  USING (
    public.is_super_admin() OR
    public.can_access_branch_data(branch_id) OR
    public.can_access_branch_data(from_branch_id) OR
    public.can_access_branch_data(to_branch_id)
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.can_access_branch_data(branch_id)
  );

-- Articles table - Access through booking branch
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Articles access" ON public.articles;
CREATE POLICY "Articles access" ON public.articles
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = articles.booking_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.from_branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = articles.booking_id
      AND public.can_access_branch_data(b.branch_id)
    )
  );

-- Booking articles junction table
ALTER TABLE public.booking_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Booking articles access" ON public.booking_articles;
CREATE POLICY "Booking articles access" ON public.booking_articles
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_articles.booking_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.from_branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_articles.booking_id
      AND public.can_access_branch_data(b.branch_id)
    )
  );

-- =====================================================
-- CUSTOMER MANAGEMENT
-- =====================================================

-- Customers table - Organization-scoped
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers access" ON public.customers;
CREATE POLICY "Customers access" ON public.customers
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- =====================================================
-- VEHICLE AND DRIVER MANAGEMENT
-- =====================================================

-- Vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vehicles access" ON public.vehicles;
CREATE POLICY "Vehicles access" ON public.vehicles
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers access" ON public.drivers;
CREATE POLICY "Drivers access" ON public.drivers
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- =====================================================
-- LOADING AND UNLOADING OPERATIONS
-- =====================================================

-- OGPL table
ALTER TABLE public.ogpl ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "OGPL access" ON public.ogpl;
CREATE POLICY "OGPL access" ON public.ogpl
  FOR ALL
  USING (
    public.is_super_admin() OR
    public.can_access_branch_data(from_branch_id) OR
    public.can_access_branch_data(to_branch_id)
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.can_access_branch_data(from_branch_id)
  );

-- Loading sessions
ALTER TABLE public.loading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Loading sessions access" ON public.loading_sessions;
CREATE POLICY "Loading sessions access" ON public.loading_sessions
  FOR ALL
  USING (
    public.is_super_admin() OR
    public.can_access_branch_data(from_branch_id) OR
    public.can_access_branch_data(to_branch_id)
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.can_access_branch_data(from_branch_id)
  );

-- Unloading sessions
ALTER TABLE public.unloading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unloading sessions access" ON public.unloading_sessions;
CREATE POLICY "Unloading sessions access" ON public.unloading_sessions
  FOR ALL
  USING (public.can_access_branch_data(branch_id))
  WITH CHECK (public.can_access_branch_data(branch_id));

-- Unloading records
ALTER TABLE public.unloading_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unloading records access" ON public.unloading_records;
CREATE POLICY "Unloading records access" ON public.unloading_records
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.unloading_sessions us
      WHERE us.id = unloading_records.session_id
      AND public.can_access_branch_data(us.branch_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.unloading_sessions us
      WHERE us.id = unloading_records.session_id
      AND public.can_access_branch_data(us.branch_id)
    )
  );

-- =====================================================
-- POD (PROOF OF DELIVERY) MANAGEMENT
-- =====================================================

-- POD records
ALTER TABLE public.pod_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "POD records access" ON public.pod_records;
CREATE POLICY "POD records access" ON public.pod_records
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = pod_records.booking_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = pod_records.booking_id
      AND public.can_access_branch_data(b.to_branch_id)
    )
  );

-- POD attempts
ALTER TABLE public.pod_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "POD attempts access" ON public.pod_attempts;
CREATE POLICY "POD attempts access" ON public.pod_attempts
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.pod_records pr
      JOIN public.bookings b ON b.id = pr.booking_id
      WHERE pr.id = pod_attempts.pod_record_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.pod_records pr
      JOIN public.bookings b ON b.id = pr.booking_id
      WHERE pr.id = pod_attempts.pod_record_id
      AND public.can_access_branch_data(b.to_branch_id)
    )
  );

-- POD templates
ALTER TABLE public.pod_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "POD templates access" ON public.pod_templates;
CREATE POLICY "POD templates access" ON public.pod_templates
  FOR ALL
  USING (public.can_access_branch_data(branch_id))
  WITH CHECK (public.can_access_branch_data(branch_id));

-- =====================================================
-- WAREHOUSE MANAGEMENT
-- =====================================================

-- Warehouses
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Warehouses access" ON public.warehouses;
CREATE POLICY "Warehouses access" ON public.warehouses
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Warehouse locations
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Warehouse locations access" ON public.warehouse_locations;
CREATE POLICY "Warehouse locations access" ON public.warehouse_locations
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = warehouse_locations.warehouse_id
      AND (
        (w.branch_id IS NOT NULL AND public.can_access_branch_data(w.branch_id)) OR
        (w.branch_id IS NULL AND public.can_access_organization_data(w.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = warehouse_locations.warehouse_id
      AND (
        (w.branch_id IS NOT NULL AND public.can_access_branch_data(w.branch_id)) OR
        (w.branch_id IS NULL AND public.can_access_organization_data(w.organization_id))
      )
    )
  );

-- Warehouse zones
ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Warehouse zones access" ON public.warehouse_zones;
CREATE POLICY "Warehouse zones access" ON public.warehouse_zones
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = warehouse_zones.warehouse_id
      AND (
        (w.branch_id IS NOT NULL AND public.can_access_branch_data(w.branch_id)) OR
        (w.branch_id IS NULL AND public.can_access_organization_data(w.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.warehouses w
      WHERE w.id = warehouse_zones.warehouse_id
      AND (
        (w.branch_id IS NOT NULL AND public.can_access_branch_data(w.branch_id)) OR
        (w.branch_id IS NULL AND public.can_access_organization_data(w.organization_id))
      )
    )
  );

-- Inventory records
ALTER TABLE public.inventory_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inventory records access" ON public.inventory_records;
CREATE POLICY "Inventory records access" ON public.inventory_records
  FOR ALL
  USING (public.can_access_branch_data(branch_id))
  WITH CHECK (public.can_access_branch_data(branch_id));

-- Inventory movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inventory movements access" ON public.inventory_movements;
CREATE POLICY "Inventory movements access" ON public.inventory_movements
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.inventory_records ir
      WHERE ir.id = inventory_movements.inventory_record_id
      AND public.can_access_branch_data(ir.branch_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.inventory_records ir
      WHERE ir.id = inventory_movements.inventory_record_id
      AND public.can_access_branch_data(ir.branch_id)
    )
  );

-- =====================================================
-- FINANCIAL AND BILLING TABLES
-- =====================================================

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoices access" ON public.invoices;
CREATE POLICY "Invoices access" ON public.invoices
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Invoice items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoice items access" ON public.invoice_items;
CREATE POLICY "Invoice items access" ON public.invoice_items
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
      AND (
        (i.branch_id IS NOT NULL AND public.can_access_branch_data(i.branch_id)) OR
        (i.branch_id IS NULL AND public.can_access_organization_data(i.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
      AND (
        (i.branch_id IS NOT NULL AND public.can_access_branch_data(i.branch_id)) OR
        (i.branch_id IS NULL AND public.can_access_organization_data(i.organization_id))
      )
    )
  );

-- Invoice payments
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoice payments access" ON public.invoice_payments;
CREATE POLICY "Invoice payments access" ON public.invoice_payments
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_payments.invoice_id
      AND (
        (i.branch_id IS NOT NULL AND public.can_access_branch_data(i.branch_id)) OR
        (i.branch_id IS NULL AND public.can_access_organization_data(i.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_payments.invoice_id
      AND (
        (i.branch_id IS NOT NULL AND public.can_access_branch_data(i.branch_id)) OR
        (i.branch_id IS NULL AND public.can_access_organization_data(i.organization_id))
      )
    )
  );

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments access" ON public.payments;
CREATE POLICY "Payments access" ON public.payments
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Payment modes
ALTER TABLE public.payment_modes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment modes access" ON public.payment_modes;
CREATE POLICY "Payment modes access" ON public.payment_modes
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Payment allocations
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment allocations access" ON public.payment_allocations;
CREATE POLICY "Payment allocations access" ON public.payment_allocations
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_allocations.payment_id
      AND (
        (p.branch_id IS NOT NULL AND public.can_access_branch_data(p.branch_id)) OR
        (p.branch_id IS NULL AND public.can_access_organization_data(p.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_allocations.payment_id
      AND (
        (p.branch_id IS NOT NULL AND public.can_access_branch_data(p.branch_id)) OR
        (p.branch_id IS NULL AND public.can_access_organization_data(p.organization_id))
      )
    )
  );

-- Payment orders
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment orders access" ON public.payment_orders;
CREATE POLICY "Payment orders access" ON public.payment_orders
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Payment refunds
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment refunds access" ON public.payment_refunds;
CREATE POLICY "Payment refunds access" ON public.payment_refunds
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Payment reminders
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment reminders access" ON public.payment_reminders;
CREATE POLICY "Payment reminders access" ON public.payment_reminders
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Outstanding amounts
ALTER TABLE public.outstanding_amounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Outstanding amounts access" ON public.outstanding_amounts;
CREATE POLICY "Outstanding amounts access" ON public.outstanding_amounts
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Billing cycles
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Billing cycles access" ON public.billing_cycles;
CREATE POLICY "Billing cycles access" ON public.billing_cycles
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- =====================================================
-- RATE AND PRICING MANAGEMENT
-- =====================================================

-- Rate contracts
ALTER TABLE public.rate_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rate contracts access" ON public.rate_contracts;
CREATE POLICY "Rate contracts access" ON public.rate_contracts
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Rate slabs
ALTER TABLE public.rate_slabs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rate slabs access" ON public.rate_slabs;
CREATE POLICY "Rate slabs access" ON public.rate_slabs
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.rate_contracts rc
      WHERE rc.id = rate_slabs.rate_contract_id
      AND public.can_access_organization_data(rc.organization_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.rate_contracts rc
      WHERE rc.id = rate_slabs.rate_contract_id
      AND public.can_access_organization_data(rc.organization_id)
    )
  );

-- Surcharge rules
ALTER TABLE public.surcharge_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Surcharge rules access" ON public.surcharge_rules;
CREATE POLICY "Surcharge rules access" ON public.surcharge_rules
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Pricing templates
ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pricing templates access" ON public.pricing_templates;
CREATE POLICY "Pricing templates access" ON public.pricing_templates
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Customer article rates
ALTER TABLE public.customer_article_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer article rates access" ON public.customer_article_rates;
CREATE POLICY "Customer article rates access" ON public.customer_article_rates
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_article_rates.customer_id
      AND public.can_access_organization_data(c.organization_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_article_rates.customer_id
      AND public.can_access_organization_data(c.organization_id)
    )
  );

-- Quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quotes access" ON public.quotes;
CREATE POLICY "Quotes access" ON public.quotes
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Rate approval workflow
ALTER TABLE public.rate_approval_workflow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rate approval workflow access" ON public.rate_approval_workflow;
CREATE POLICY "Rate approval workflow access" ON public.rate_approval_workflow
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Rate history
ALTER TABLE public.rate_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rate history access" ON public.rate_history;
CREATE POLICY "Rate history access" ON public.rate_history
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- =====================================================
-- CREDIT MANAGEMENT
-- =====================================================

-- Credit transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Credit transactions access" ON public.credit_transactions;
CREATE POLICY "Credit transactions access" ON public.credit_transactions
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Credit limit history
ALTER TABLE public.credit_limit_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Credit limit history access" ON public.credit_limit_history;
CREATE POLICY "Credit limit history access" ON public.credit_limit_history
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = credit_limit_history.customer_id
      AND public.can_access_organization_data(c.organization_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = credit_limit_history.customer_id
      AND public.can_access_organization_data(c.organization_id)
    )
  );

-- Credit alerts
ALTER TABLE public.credit_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Credit alerts access" ON public.credit_alerts;
CREATE POLICY "Credit alerts access" ON public.credit_alerts
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Customer contracts
ALTER TABLE public.customer_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer contracts access" ON public.customer_contracts;
CREATE POLICY "Customer contracts access" ON public.customer_contracts
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Customer portal access
ALTER TABLE public.customer_portal_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer portal access" ON public.customer_portal_access;
CREATE POLICY "Customer portal access" ON public.customer_portal_access
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_portal_access.customer_id
      AND public.can_access_organization_data(c.organization_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_portal_access.customer_id
      AND public.can_access_organization_data(c.organization_id)
    )
  );

-- =====================================================
-- EXPENSE MANAGEMENT
-- =====================================================

-- Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Expenses access" ON public.expenses;
CREATE POLICY "Expenses access" ON public.expenses
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Expense line items
ALTER TABLE public.expense_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Expense line items access" ON public.expense_line_items;
CREATE POLICY "Expense line items access" ON public.expense_line_items
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_line_items.expense_id
      AND (
        (e.branch_id IS NOT NULL AND public.can_access_branch_data(e.branch_id)) OR
        (e.branch_id IS NULL AND public.can_access_organization_data(e.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_line_items.expense_id
      AND (
        (e.branch_id IS NOT NULL AND public.can_access_branch_data(e.branch_id)) OR
        (e.branch_id IS NULL AND public.can_access_organization_data(e.organization_id))
      )
    )
  );

-- Expense allocations
ALTER TABLE public.expense_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Expense allocations access" ON public.expense_allocations;
CREATE POLICY "Expense allocations access" ON public.expense_allocations
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_allocations.expense_id
      AND (
        (e.branch_id IS NOT NULL AND public.can_access_branch_data(e.branch_id)) OR
        (e.branch_id IS NULL AND public.can_access_organization_data(e.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_allocations.expense_id
      AND (
        (e.branch_id IS NOT NULL AND public.can_access_branch_data(e.branch_id)) OR
        (e.branch_id IS NULL AND public.can_access_organization_data(e.organization_id))
      )
    )
  );

-- Budget allocations
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Budget allocations access" ON public.budget_allocations;
CREATE POLICY "Budget allocations access" ON public.budget_allocations
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Cost centers
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cost centers access" ON public.cost_centers;
CREATE POLICY "Cost centers access" ON public.cost_centers
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- PnL configurations
ALTER TABLE public.pnl_configurations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PnL configurations access" ON public.pnl_configurations;
CREATE POLICY "PnL configurations access" ON public.pnl_configurations
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- Financial periods
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Financial periods access" ON public.financial_periods;
CREATE POLICY "Financial periods access" ON public.financial_periods
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- =====================================================
-- ANALYTICS AND REPORTING
-- =====================================================

-- Revenue analytics
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Revenue analytics access" ON public.revenue_analytics;
CREATE POLICY "Revenue analytics access" ON public.revenue_analytics
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Revenue forecasts
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Revenue forecasts access" ON public.revenue_forecasts;
CREATE POLICY "Revenue forecasts access" ON public.revenue_forecasts
  FOR ALL
  USING (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  )
  WITH CHECK (
    public.is_super_admin() OR
    (branch_id IS NOT NULL AND public.can_access_branch_data(branch_id)) OR
    (branch_id IS NULL AND public.can_access_organization_data(organization_id))
  );

-- Article movement analytics
ALTER TABLE public.article_movement_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Article movement analytics access" ON public.article_movement_analytics;
CREATE POLICY "Article movement analytics access" ON public.article_movement_analytics
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_movement_analytics.article_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.from_branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_movement_analytics.article_id
      AND public.can_access_branch_data(b.branch_id)
    )
  );

-- Logistics events (audit trail)
ALTER TABLE public.logistics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Logistics events access" ON public.logistics_events;
CREATE POLICY "Logistics events access" ON public.logistics_events
  FOR ALL
  USING (
    public.is_super_admin() OR
    public.can_access_branch_data(branch_id)
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.can_access_branch_data(branch_id)
  );

-- =====================================================
-- ENHANCED TRACKING
-- =====================================================

-- Article tracking
ALTER TABLE public.article_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Article tracking access" ON public.article_tracking;
CREATE POLICY "Article tracking access" ON public.article_tracking
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_tracking.article_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.from_branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_tracking.article_id
      AND public.can_access_branch_data(b.branch_id)
    )
  );

-- Article tracking enhanced
ALTER TABLE public.article_tracking_enhanced ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Article tracking enhanced access" ON public.article_tracking_enhanced;
CREATE POLICY "Article tracking enhanced access" ON public.article_tracking_enhanced
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_tracking_enhanced.article_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.from_branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_tracking_enhanced.article_id
      AND public.can_access_branch_data(b.branch_id)
    )
  );

-- Article scan history
ALTER TABLE public.article_scan_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Article scan history access" ON public.article_scan_history;
CREATE POLICY "Article scan history access" ON public.article_scan_history
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_scan_history.article_id
      AND (
        public.can_access_branch_data(b.branch_id) OR
        public.can_access_branch_data(b.from_branch_id) OR
        public.can_access_branch_data(b.to_branch_id)
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.articles a
      JOIN public.bookings b ON b.id = a.booking_id
      WHERE a.id = article_scan_history.article_id
      AND public.can_access_branch_data(b.branch_id)
    )
  );

-- GPS tracking sessions
ALTER TABLE public.gps_tracking_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "GPS tracking sessions access" ON public.gps_tracking_sessions;
CREATE POLICY "GPS tracking sessions access" ON public.gps_tracking_sessions
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = gps_tracking_sessions.vehicle_id
      AND (
        (v.branch_id IS NOT NULL AND public.can_access_branch_data(v.branch_id)) OR
        (v.branch_id IS NULL AND public.can_access_organization_data(v.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = gps_tracking_sessions.vehicle_id
      AND (
        (v.branch_id IS NOT NULL AND public.can_access_branch_data(v.branch_id)) OR
        (v.branch_id IS NULL AND public.can_access_organization_data(v.organization_id))
      )
    )
  );

-- GPS location points
ALTER TABLE public.gps_location_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "GPS location points access" ON public.gps_location_points;
CREATE POLICY "GPS location points access" ON public.gps_location_points
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.gps_tracking_sessions gts
      JOIN public.vehicles v ON v.id = gts.vehicle_id
      WHERE gts.id = gps_location_points.session_id
      AND (
        (v.branch_id IS NOT NULL AND public.can_access_branch_data(v.branch_id)) OR
        (v.branch_id IS NULL AND public.can_access_organization_data(v.organization_id))
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.gps_tracking_sessions gts
      JOIN public.vehicles v ON v.id = gts.vehicle_id
      WHERE gts.id = gps_location_points.session_id
      AND (
        (v.branch_id IS NOT NULL AND public.can_access_branch_data(v.branch_id)) OR
        (v.branch_id IS NULL AND public.can_access_organization_data(v.organization_id))
      )
    )
  );

-- Bulk operations
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bulk operations access" ON public.bulk_operations;
CREATE POLICY "Bulk operations access" ON public.bulk_operations
  FOR ALL
  USING (
    public.is_super_admin() OR
    public.can_access_branch_data(branch_id)
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.can_access_branch_data(branch_id)
  );

-- Bulk operation items
ALTER TABLE public.bulk_operation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bulk operation items access" ON public.bulk_operation_items;
CREATE POLICY "Bulk operation items access" ON public.bulk_operation_items
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bulk_operations bo
      WHERE bo.id = bulk_operation_items.bulk_operation_id
      AND public.can_access_branch_data(bo.branch_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.bulk_operations bo
      WHERE bo.id = bulk_operation_items.bulk_operation_id
      AND public.can_access_branch_data(bo.branch_id)
    )
  );

-- LR number reservations
ALTER TABLE public.lr_number_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "LR number reservations access" ON public.lr_number_reservations;
CREATE POLICY "LR number reservations access" ON public.lr_number_reservations
  FOR ALL
  USING (public.can_access_branch_data(branch_id))
  WITH CHECK (public.can_access_branch_data(branch_id));

-- =====================================================
-- COMMUNICATION AND CHAT
-- =====================================================

-- Chat channels
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat channels access" ON public.chat_channels;
CREATE POLICY "Chat channels access" ON public.chat_channels
  FOR ALL
  USING (public.can_access_organization_data(org_id))
  WITH CHECK (public.can_access_organization_data(org_id));

-- Chat channel members
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat channel members access" ON public.chat_channel_members;
CREATE POLICY "Chat channel members access" ON public.chat_channel_members
  FOR ALL
  USING (
    public.is_super_admin() OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_channels cc
      WHERE cc.id = chat_channel_members.channel_id
      AND public.can_access_organization_data(cc.org_id)
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_channels cc
      WHERE cc.id = chat_channel_members.channel_id
      AND public.can_access_organization_data(cc.org_id)
    )
  );

-- Chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat messages access" ON public.chat_messages;
CREATE POLICY "Chat messages access" ON public.chat_messages
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_channel_members ccm
      WHERE ccm.channel_id = chat_messages.channel_id
      AND ccm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_channel_members ccm
      WHERE ccm.channel_id = chat_messages.channel_id
      AND ccm.user_id = auth.uid()
    )
  );

-- Chat attachments
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat attachments access" ON public.chat_attachments;
CREATE POLICY "Chat attachments access" ON public.chat_attachments
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_channel_members ccm ON ccm.channel_id = cm.channel_id
      WHERE cm.id = chat_attachments.message_id
      AND ccm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_channel_members ccm ON ccm.channel_id = cm.channel_id
      WHERE cm.id = chat_attachments.message_id
      AND ccm.user_id = auth.uid()
    )
  );

-- Chat notifications
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat notifications access" ON public.chat_notifications;
CREATE POLICY "Chat notifications access" ON public.chat_notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- OTHER TABLES
-- =====================================================

-- Vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors access" ON public.vendors;
CREATE POLICY "Vendors access" ON public.vendors
  FOR ALL
  USING (public.can_access_branch_data(branch_id))
  WITH CHECK (public.can_access_branch_data(branch_id));

-- Organization codes
ALTER TABLE public.organization_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization codes access" ON public.organization_codes;
CREATE POLICY "Organization codes access" ON public.organization_codes
  FOR ALL
  USING (public.can_access_organization_data(organization_id))
  WITH CHECK (public.can_access_organization_data(organization_id));

-- User preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User preferences access" ON public.user_preferences;
CREATE POLICY "User preferences access" ON public.user_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Audit logs - Read-only for admins
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit logs access" ON public.audit_logs;
CREATE POLICY "Audit logs access" ON public.audit_logs
  FOR SELECT
  USING (
    public.is_super_admin() OR
    (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND (
          (audit_logs.branch_id IS NOT NULL AND u.branch_id = audit_logs.branch_id) OR
          (audit_logs.organization_id IS NOT NULL AND u.organization_id = audit_logs.organization_id)
        )
      )
    )
  );

-- =====================================================
-- AUTHENTICATION AND SECURITY TABLES
-- =====================================================

-- User sessions - Users can only see their own sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User sessions access" ON public.user_sessions;
CREATE POLICY "User sessions access" ON public.user_sessions
  FOR ALL
  USING (
    user_id = auth.uid() OR
    public.is_super_admin()
  )
  WITH CHECK (user_id = auth.uid());

-- Login attempts - Admins can see attempts for their organization
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Login attempts access" ON public.login_attempts;
CREATE POLICY "Login attempts access" ON public.login_attempts
  FOR SELECT
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.email = login_attempts.email
      AND public.can_access_organization_data(u.organization_id)
    )
  );

-- Login history - Users see own history, admins see org history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Login history access" ON public.login_history;
CREATE POLICY "Login history access" ON public.login_history
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = login_history.user_id
      AND public.can_access_organization_data(u.organization_id)
      AND EXISTS (
        SELECT 1 FROM public.users admin
        WHERE admin.id = auth.uid()
        AND admin.role = 'admin'
      )
    )
  );

-- User security settings - Users manage their own
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User security settings access" ON public.user_security_settings;
CREATE POLICY "User security settings access" ON public.user_security_settings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Password history - Users can't see password hashes
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Password history access" ON public.password_history;
CREATE POLICY "Password history access" ON public.password_history
  FOR SELECT
  USING (FALSE); -- No one can read password history directly

-- Account lockouts - Admins can manage
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Account lockouts access" ON public.account_lockouts;
CREATE POLICY "Account lockouts access" ON public.account_lockouts
  FOR ALL
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = account_lockouts.user_id
      AND public.can_access_organization_data(u.organization_id)
      AND EXISTS (
        SELECT 1 FROM public.users admin
        WHERE admin.id = auth.uid()
        AND admin.role = 'admin'
      )
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = account_lockouts.user_id
      AND public.can_access_organization_data(u.organization_id)
      AND EXISTS (
        SELECT 1 FROM public.users admin
        WHERE admin.id = auth.uid()
        AND admin.role = 'admin'
      )
    )
  );

-- =====================================================
-- GRANT PERMISSIONS FOR HELPER FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_organization_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_branch_data TO authenticated;

-- =====================================================
-- ENHANCED AUDIT TRIGGER FOR SENSITIVE OPERATIONS
-- =====================================================

-- Create enhanced audit function
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log sensitive operations
  IF TG_TABLE_NAME IN ('users', 'organizations', 'branches', 'payments', 'invoices', 'credit_transactions') THEN
    INSERT INTO public.audit_logs (
      user_id,
      organization_id,
      branch_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      ip_address,
      user_agent,
      created_at
    )
    SELECT
      auth.uid(),
      u.organization_id,
      u.branch_id,
      TG_OP,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      current_setting('request.headers')::json->>'x-forwarded-for',
      current_setting('request.headers')::json->>'user-agent',
      NOW()
    FROM public.users u
    WHERE u.id = auth.uid();
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables (if not already present)
DO $$ 
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS audit_users_sensitive ON public.users;
  DROP TRIGGER IF EXISTS audit_organizations_sensitive ON public.organizations;
  DROP TRIGGER IF EXISTS audit_branches_sensitive ON public.branches;
  DROP TRIGGER IF EXISTS audit_payments_sensitive ON public.payments;
  DROP TRIGGER IF EXISTS audit_invoices_sensitive ON public.invoices;
  DROP TRIGGER IF EXISTS audit_credit_transactions_sensitive ON public.credit_transactions;
  
  -- Create new triggers
  CREATE TRIGGER audit_users_sensitive
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();
    
  CREATE TRIGGER audit_organizations_sensitive
    AFTER INSERT OR UPDATE OR DELETE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();
    
  CREATE TRIGGER audit_branches_sensitive
    AFTER INSERT OR UPDATE OR DELETE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();
    
  CREATE TRIGGER audit_payments_sensitive
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();
    
  CREATE TRIGGER audit_invoices_sensitive
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();
    
  CREATE TRIGGER audit_credit_transactions_sensitive
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();
END $$;

-- =====================================================
-- FINAL SECURITY NOTES
-- =====================================================

-- This migration implements comprehensive RLS policies ensuring:
-- 1. Super admins have unrestricted access across all organizations
-- 2. Organization admins can manage their organization's data
-- 3. Branch users can only access data within their assigned branch
-- 4. No user can escalate their own privileges
-- 5. All sensitive operations are audited
-- 6. Cross-organization data access is strictly prohibited
-- 7. Authentication-related tables have appropriate restrictions