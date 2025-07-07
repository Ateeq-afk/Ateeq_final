-- Fix loading optimization logs table for multi-tenant support
-- This migration adds organization_id and branch_id to loading_optimization_logs table

-- 1. Add organization_id and branch_id to loading_optimization_logs if missing
ALTER TABLE public.loading_optimization_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;

-- 2. Update existing records to get org/branch from the user who created them
UPDATE public.loading_optimization_logs lol
SET 
  organization_id = u.organization_id,
  branch_id = u.branch_id
FROM public.users u
WHERE lol.created_by = u.id
AND lol.organization_id IS NULL;

-- 3. If OGPL ID is present, update org/branch from OGPL
UPDATE public.loading_optimization_logs lol
SET 
  organization_id = b.organization_id,
  branch_id = o.from_station
FROM public.ogpl o
JOIN public.branches b ON o.from_station = b.id
WHERE lol.ogpl_id = o.id
AND lol.organization_id IS NULL;

-- 4. Make columns NOT NULL (after ensuring all records have values)
ALTER TABLE public.loading_optimization_logs 
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN branch_id SET NOT NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loading_optimization_logs_org ON public.loading_optimization_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_loading_optimization_logs_branch ON public.loading_optimization_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_loading_optimization_logs_org_branch ON public.loading_optimization_logs(organization_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_loading_optimization_logs_created_at ON public.loading_optimization_logs(created_at DESC);

-- 6. Update RLS policies
ALTER TABLE public.loading_optimization_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view optimization logs from their organization" ON public.loading_optimization_logs;
DROP POLICY IF EXISTS "Users can create optimization logs for their branch" ON public.loading_optimization_logs;

-- Users can view optimization logs from their organization
CREATE POLICY "Users can view optimization logs from their organization" ON public.loading_optimization_logs
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      -- Admins can see all logs in org
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      -- Others can only see their branch logs
      branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Users can create optimization logs for their branch
CREATE POLICY "Users can create optimization logs for their branch" ON public.loading_optimization_logs
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
  );

-- 7. Add comments
COMMENT ON COLUMN public.loading_optimization_logs.organization_id IS 'Organization that owns this optimization log';
COMMENT ON COLUMN public.loading_optimization_logs.branch_id IS 'Branch where the optimization was performed';

-- 8. Create a view for optimization analytics by organization
CREATE OR REPLACE VIEW public.loading_optimization_analytics AS
SELECT 
  organization_id,
  branch_id,
  optimization_type,
  COUNT(*) as optimization_count,
  AVG(avg_efficiency) as avg_efficiency,
  AVG(avg_utilization) as avg_utilization,
  SUM(total_bookings) as total_bookings_optimized,
  SUM(total_weight) as total_weight_optimized,
  SUM(total_value) as total_value_optimized,
  AVG(execution_time_ms) as avg_execution_time_ms,
  DATE_TRUNC('day', created_at) as date
FROM public.loading_optimization_logs
GROUP BY organization_id, branch_id, optimization_type, DATE_TRUNC('day', created_at);

-- Grant permissions on the view
GRANT SELECT ON public.loading_optimization_analytics TO authenticated;

-- 9. Also ensure OGPL table has proper organization filtering
-- Add organization_id to OGPL if missing (derived from from_station branch)
ALTER TABLE public.ogpl 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update existing OGPL records
UPDATE public.ogpl o
SET organization_id = b.organization_id
FROM public.branches b
WHERE o.from_station = b.id
AND o.organization_id IS NULL;

-- Make organization_id NOT NULL
ALTER TABLE public.ogpl 
ALTER COLUMN organization_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_ogpl_organization ON public.ogpl(organization_id);

-- Update OGPL RLS policies
ALTER TABLE public.ogpl ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view OGPL from their organization" ON public.ogpl;
CREATE POLICY "Users can view OGPL from their organization" ON public.ogpl
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
      -- Admins can see all OGPLs in org
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
      )
      OR
      -- Others can only see OGPLs from their branch (as from_station or to_station)
      (
        from_station = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR
        to_station = (SELECT branch_id FROM public.users WHERE id = auth.uid())
      )
    )
  );

COMMENT ON COLUMN public.ogpl.organization_id IS 'Organization that owns this OGPL';