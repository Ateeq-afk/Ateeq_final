-- Migration: Enhanced RLS policies for strict branch-level data isolation

-- Helper function to get user's organization and branch
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS TABLE(user_id UUID, organization_id UUID, branch_id UUID, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    u.organization_id,
    u.branch_id,
    u.role
  FROM public.users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can access data
CREATE OR REPLACE FUNCTION public.can_access_branch_data(p_branch_id UUID, p_organization_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_context RECORD;
BEGIN
  -- Get user context
  SELECT * INTO v_user_context FROM public.get_user_context();
  
  -- Admins can access everything
  IF v_user_context.role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Branch managers can access their branch data
  IF v_user_context.role = 'branch_manager' AND v_user_context.branch_id = p_branch_id THEN
    RETURN TRUE;
  END IF;
  
  -- Regular users can only access their branch data
  IF v_user_context.branch_id = p_branch_id THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view bookings from their branch" ON public.bookings;
CREATE POLICY "Users can view bookings from their branch" ON public.bookings
  FOR SELECT
  USING (public.can_access_branch_data(branch_id));

DROP POLICY IF EXISTS "Users can create bookings for their branch" ON public.bookings;
CREATE POLICY "Users can create bookings for their branch" ON public.bookings
  FOR INSERT
  WITH CHECK (
    branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update bookings from their branch" ON public.bookings;
CREATE POLICY "Users can update bookings from their branch" ON public.bookings
  FOR UPDATE
  USING (public.can_access_branch_data(branch_id))
  WITH CHECK (public.can_access_branch_data(branch_id));

-- Update RLS policies for customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view customers from their organization" ON public.customers;
CREATE POLICY "Users can view customers from their organization" ON public.customers
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Branch users can create customers" ON public.customers;
CREATE POLICY "Branch users can create customers" ON public.customers
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Branch users can update customers" ON public.customers;
CREATE POLICY "Branch users can update customers" ON public.customers
  FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Update RLS policies for articles table
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view articles from their branch bookings" ON public.articles;
CREATE POLICY "Users can view articles from their branch bookings" ON public.articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = articles.booking_id
      AND public.can_access_branch_data(b.branch_id)
    )
  );

DROP POLICY IF EXISTS "Users can create articles for their branch bookings" ON public.articles;
CREATE POLICY "Users can create articles for their branch bookings" ON public.articles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
      AND b.branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Update RLS policies for vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view vehicles from their organization" ON public.vehicles;
CREATE POLICY "Users can view vehicles from their organization" ON public.vehicles
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Update RLS policies for branches table
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view branches from their organization" ON public.branches;
CREATE POLICY "Users can view branches from their organization" ON public.branches
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Only admins can manage branches" ON public.branches;
CREATE POLICY "Only admins can manage branches" ON public.branches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Update RLS policies for warehouse operations
ALTER TABLE public.warehouse_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view warehouse articles from their branch" ON public.warehouse_articles;
CREATE POLICY "Users can view warehouse articles from their branch" ON public.warehouse_articles
  FOR SELECT
  USING (public.can_access_branch_data(branch_id));

DROP POLICY IF EXISTS "Users can manage warehouse articles for their branch" ON public.warehouse_articles;
CREATE POLICY "Users can manage warehouse articles for their branch" ON public.warehouse_articles
  FOR ALL
  USING (
    branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
  );

-- Update RLS policies for OGPL
ALTER TABLE public.ogpl ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view OGPL from their branch" ON public.ogpl;
CREATE POLICY "Users can view OGPL from their branch" ON public.ogpl
  FOR SELECT
  USING (public.can_access_branch_data(from_branch_id));

DROP POLICY IF EXISTS "Users can create OGPL for their branch" ON public.ogpl;
CREATE POLICY "Users can create OGPL for their branch" ON public.ogpl
  FOR INSERT
  WITH CHECK (
    from_branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update OGPL from their branch" ON public.ogpl;
CREATE POLICY "Users can update OGPL from their branch" ON public.ogpl
  FOR UPDATE
  USING (
    from_branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    from_branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
  );

-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  branch_id UUID REFERENCES public.branches(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND (
        users.organization_id = audit_logs.organization_id
        OR users.role = 'admin' -- Superadmins can see all
      )
    )
  );

-- Create function to log data access
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    INSERT INTO public.audit_logs (
      user_id,
      organization_id,
      branch_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
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
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
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

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_bookings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

CREATE TRIGGER audit_customers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.log_data_access();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_branch_data TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;