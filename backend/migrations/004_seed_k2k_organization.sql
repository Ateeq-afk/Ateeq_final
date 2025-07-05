-- Migration: Seed K2K Logistics organization data
-- This script should be run by a database admin with appropriate permissions

-- Temporarily disable RLS for seeding
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create K2K Logistics organization
INSERT INTO public.organizations (id, name, is_active, created_at)
VALUES ('d0d0d0d0-0000-0000-0000-000000000001', 'K2K Logistics', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create organization code for K2K Logistics
INSERT INTO public.organization_codes (organization_id, code, subdomain, is_active)
VALUES ('d0d0d0d0-0000-0000-0000-000000000001', 'k2k', 'k2k-logistics', true)
ON CONFLICT (code) DO NOTHING;

-- Create branches for K2K Logistics
INSERT INTO public.branches (id, organization_id, name, code, city, state, is_active)
VALUES 
  ('b1b1b1b1-0000-0000-0000-000000000001', 'd0d0d0d0-0000-0000-0000-000000000001', 'Mumbai Head Office', 'MUM-HO', 'Mumbai', 'Maharashtra', true),
  ('b1b1b1b1-0000-0000-0000-000000000002', 'd0d0d0d0-0000-0000-0000-000000000001', 'Delhi Branch', 'DEL-BR', 'Delhi', 'Delhi', true),
  ('b1b1b1b1-0000-0000-0000-000000000003', 'd0d0d0d0-0000-0000-0000-000000000001', 'Surat Branch', 'SRT-BR', 'Surat', 'Gujarat', true)
ON CONFLICT (id) DO NOTHING;

-- Create demo organization (Acme Logistics) for testing
INSERT INTO public.organizations (id, name, is_active, created_at)
VALUES ('d0d0d0d0-0000-0000-0000-000000000002', 'Acme Logistics', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create organization code for Acme Logistics
INSERT INTO public.organization_codes (organization_id, code, subdomain, is_active)
VALUES ('d0d0d0d0-0000-0000-0000-000000000002', 'acme', 'acme-logistics', true)
ON CONFLICT (code) DO NOTHING;

-- Create branches for Acme Logistics
INSERT INTO public.branches (id, organization_id, name, code, city, state, is_active)
VALUES 
  ('b2b2b2b2-0000-0000-0000-000000000001', 'd0d0d0d0-0000-0000-0000-000000000002', 'Bangalore Office', 'BLR-HO', 'Bangalore', 'Karnataka', true),
  ('b2b2b2b2-0000-0000-0000-000000000002', 'd0d0d0d0-0000-0000-0000-000000000002', 'Chennai Branch', 'CHN-BR', 'Chennai', 'Tamil Nadu', true)
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create function to create demo users (to be called separately with proper auth)
CREATE OR REPLACE FUNCTION public.create_demo_users()
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
BEGIN
  -- This function should be called via the API to create demo users
  -- It returns instructions for creating users
  
  v_result := E'Demo organizations created successfully!\n\n';
  v_result := v_result || E'To create demo users, use the organization onboarding API:\n\n';
  v_result := v_result || E'For K2K Logistics:\n';
  v_result := v_result || E'- Organization Code: k2k\n';
  v_result := v_result || E'- Create admin user with username: admin\n';
  v_result := v_result || E'- Create operator user with username: operator\n\n';
  v_result := v_result || E'For Acme Logistics:\n';
  v_result := v_result || E'- Organization Code: acme\n';
  v_result := v_result || E'- Create admin user with username: admin\n';
  v_result := v_result || E'- Create operator user with username: operator\n';
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_demo_users TO authenticated;