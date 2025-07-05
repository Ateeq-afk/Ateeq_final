-- Migration: Add organization-based authentication support

-- Add organization_id and username to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create unique constraint for username within organization
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS unique_username_per_org;

ALTER TABLE public.users
ADD CONSTRAINT unique_username_per_org UNIQUE (organization_id, username);

-- Create organization lookup table for easy org code/subdomain mapping
CREATE TABLE IF NOT EXISTS public.organization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT organization_codes_code_check CHECK (code ~ '^[a-z0-9-]+$'),
  CONSTRAINT organization_codes_subdomain_check CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9-]+$')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_codes_code ON public.organization_codes(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organization_codes_subdomain ON public.organization_codes(subdomain) WHERE is_active = true AND subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_organization_username ON public.users(organization_id, username) WHERE is_active = true;

-- Update existing organizations to have codes
INSERT INTO public.organization_codes (organization_id, code)
SELECT id, LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'))
FROM public.organizations
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_codes 
  WHERE organization_codes.organization_id = organizations.id
);

-- Create function to generate synthetic email for Supabase Auth
CREATE OR REPLACE FUNCTION public.generate_auth_email(p_username TEXT, p_org_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(p_username || '@' || p_org_code || '.internal');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update RLS policies for organization_codes table
ALTER TABLE public.organization_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view organization codes
CREATE POLICY "Admins can view all organization codes" ON public.organization_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Public can check if an org code exists (for login)
CREATE POLICY "Public can check organization code existence" ON public.organization_codes
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage organization codes
CREATE POLICY "Admins can manage organization codes" ON public.organization_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Update users RLS to include organization context
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view same organization users" ON public.users;
CREATE POLICY "Users can view same organization users" ON public.users
  FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid()
    )
    AND (
      -- Admins can see all users in org
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role = 'admin'
      )
      OR
      -- Branch managers can see users in their branch
      (
        branch_id = (
          SELECT branch_id FROM public.users 
          WHERE id = auth.uid()
        )
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() 
          AND u.role = 'branch_manager'
        )
      )
      OR
      -- Regular users can only see themselves
      id = auth.uid()
    )
  );

-- Create stored procedure for organization-based user creation
CREATE OR REPLACE FUNCTION public.create_organization_user(
  p_org_code TEXT,
  p_username TEXT,
  p_password TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_branch_id UUID,
  p_role TEXT DEFAULT 'operator'
)
RETURNS JSONB AS $$
DECLARE
  v_organization_id UUID;
  v_auth_email TEXT;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get organization ID from code
  SELECT organization_id INTO v_organization_id
  FROM public.organization_codes
  WHERE code = p_org_code AND is_active = true;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Invalid organization code';
  END IF;

  -- Generate synthetic email if not provided
  IF p_email IS NULL OR p_email = '' THEN
    v_auth_email := public.generate_auth_email(p_username, p_org_code);
  ELSE
    v_auth_email := p_email;
  END IF;

  -- Note: Actual user creation would happen through Supabase Auth API
  -- This function returns the data structure needed for the backend

  v_result := jsonb_build_object(
    'organization_id', v_organization_id,
    'username', p_username,
    'email', v_auth_email,
    'full_name', p_full_name,
    'branch_id', p_branch_id,
    'role', p_role
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for organization users with username
CREATE OR REPLACE VIEW public.organization_users AS
SELECT 
  u.id,
  u.email,
  u.username,
  u.full_name,
  u.role,
  u.branch_id,
  b.name as branch_name,
  u.organization_id,
  o.name as organization_name,
  oc.code as organization_code,
  u.is_active,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.branches b ON u.branch_id = b.id
LEFT JOIN public.organizations o ON u.organization_id = o.id
LEFT JOIN public.organization_codes oc ON o.id = oc.organization_id;

-- Grant appropriate permissions
GRANT SELECT ON public.organization_users TO authenticated;
GRANT SELECT ON public.organization_codes TO anon; -- For login check
GRANT EXECUTE ON FUNCTION public.generate_auth_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_user TO authenticated;