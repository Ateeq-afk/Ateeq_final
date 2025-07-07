-- Fix fleet management tables for multi-tenant support
-- This migration adds organization_id and branch_id to fleet-related tables

-- 1. Add organization_id and branch_id to vehicle_assignments if missing
ALTER TABLE public.vehicle_assignments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;

-- Update existing records to get org/branch from vehicle
UPDATE public.vehicle_assignments va
SET 
  organization_id = v.organization_id,
  branch_id = v.branch_id
FROM public.vehicles v
WHERE va.vehicle_id = v.id
AND va.organization_id IS NULL;

-- Make columns NOT NULL
ALTER TABLE public.vehicle_assignments 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN branch_id SET NOT NULL;

-- 2. Add organization_id and branch_id to vehicle_maintenance if missing
ALTER TABLE public.vehicle_maintenance 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;

-- Update existing records
UPDATE public.vehicle_maintenance vm
SET 
  organization_id = v.organization_id,
  branch_id = v.branch_id
FROM public.vehicles v
WHERE vm.vehicle_id = v.id
AND vm.organization_id IS NULL;

-- Make columns NOT NULL
ALTER TABLE public.vehicle_maintenance 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN branch_id SET NOT NULL;

-- 3. Add organization_id and branch_id to fuel_records if missing
ALTER TABLE public.fuel_records 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;

-- Update existing records
UPDATE public.fuel_records fr
SET 
  organization_id = v.organization_id,
  branch_id = v.branch_id
FROM public.vehicles v
WHERE fr.vehicle_id = v.id
AND fr.organization_id IS NULL;

-- Make columns NOT NULL
ALTER TABLE public.fuel_records 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN branch_id SET NOT NULL;

-- 4. Add organization_id and branch_id to vehicle_documents if missing
ALTER TABLE public.vehicle_documents 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;

-- Update existing records
UPDATE public.vehicle_documents vd
SET 
  organization_id = v.organization_id,
  branch_id = v.branch_id
FROM public.vehicles v
WHERE vd.vehicle_id = v.id
AND vd.organization_id IS NULL;

-- Make columns NOT NULL
ALTER TABLE public.vehicle_documents 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN branch_id SET NOT NULL;

-- 5. Add organization_id and branch_id to vehicle_gps_tracking if missing
ALTER TABLE public.vehicle_gps_tracking 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;

-- Update existing records
UPDATE public.vehicle_gps_tracking vgt
SET 
  organization_id = v.organization_id,
  branch_id = v.branch_id
FROM public.vehicles v
WHERE vgt.vehicle_id = v.id
AND vgt.organization_id IS NULL;

-- Make columns NOT NULL
ALTER TABLE public.vehicle_gps_tracking 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN branch_id SET NOT NULL;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_org ON public.vehicle_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_branch ON public.vehicle_assignments(branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_org_branch ON public.vehicle_assignments(organization_id, branch_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_org ON public.vehicle_maintenance(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_branch ON public.vehicle_maintenance(branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_org_branch ON public.vehicle_maintenance(organization_id, branch_id);

CREATE INDEX IF NOT EXISTS idx_fuel_records_org ON public.fuel_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_branch ON public.fuel_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_org_branch ON public.fuel_records(organization_id, branch_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_org ON public.vehicle_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_branch ON public.vehicle_documents(branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_org_branch ON public.vehicle_documents(organization_id, branch_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_gps_tracking_org ON public.vehicle_gps_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_gps_tracking_branch ON public.vehicle_gps_tracking(branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_gps_tracking_org_branch ON public.vehicle_gps_tracking(organization_id, branch_id);

-- 7. Update RLS policies for all fleet tables

-- Vehicle Assignments RLS
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view vehicle assignments from their organization" ON public.vehicle_assignments;
CREATE POLICY "Users can view vehicle assignments from their organization" ON public.vehicle_assignments
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      -- Admins can see all assignments in org
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      -- Others can only see their branch assignments
      branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage vehicle assignments for their branch" ON public.vehicle_assignments;
CREATE POLICY "Users can manage vehicle assignments for their branch" ON public.vehicle_assignments
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Vehicle Maintenance RLS
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view maintenance records from their organization" ON public.vehicle_maintenance;
CREATE POLICY "Users can view maintenance records from their organization" ON public.vehicle_maintenance
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Fuel Records RLS
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view fuel records from their organization" ON public.fuel_records;
CREATE POLICY "Users can view fuel records from their organization" ON public.fuel_records
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Vehicle Documents RLS
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view vehicle documents from their organization" ON public.vehicle_documents;
CREATE POLICY "Users can view vehicle documents from their organization" ON public.vehicle_documents
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

-- GPS Tracking RLS
ALTER TABLE public.vehicle_gps_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view GPS tracking from their organization" ON public.vehicle_gps_tracking;
CREATE POLICY "Users can view GPS tracking from their organization" ON public.vehicle_gps_tracking
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

-- 8. Update any RPC functions to include organization filtering
-- This would need to be done for functions like calculate_vehicle_mileage

-- Add comments
COMMENT ON COLUMN public.vehicle_assignments.organization_id IS 'Organization that owns this vehicle assignment';
COMMENT ON COLUMN public.vehicle_assignments.branch_id IS 'Branch where this assignment is made';

COMMENT ON COLUMN public.vehicle_maintenance.organization_id IS 'Organization that owns this maintenance record';
COMMENT ON COLUMN public.vehicle_maintenance.branch_id IS 'Branch where maintenance was performed';

COMMENT ON COLUMN public.fuel_records.organization_id IS 'Organization that owns this fuel record';
COMMENT ON COLUMN public.fuel_records.branch_id IS 'Branch where fuel was filled';

COMMENT ON COLUMN public.vehicle_documents.organization_id IS 'Organization that owns this document';
COMMENT ON COLUMN public.vehicle_documents.branch_id IS 'Branch that uploaded this document';

COMMENT ON COLUMN public.vehicle_gps_tracking.organization_id IS 'Organization that owns this GPS data';
COMMENT ON COLUMN public.vehicle_gps_tracking.branch_id IS 'Branch of the tracked vehicle';