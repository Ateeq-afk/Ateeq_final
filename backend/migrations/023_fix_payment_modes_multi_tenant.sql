-- Fix payment_modes table for multi-tenant support
-- This migration adds organization_id to payment_modes table

-- 1. Add organization_id column to payment_modes
ALTER TABLE public.payment_modes 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. Update existing payment modes to belong to all organizations
-- First, create a temporary function to duplicate payment modes for each organization
CREATE OR REPLACE FUNCTION duplicate_payment_modes_for_orgs() RETURNS void AS $$
DECLARE
    org_record RECORD;
    mode_record RECORD;
BEGIN
    -- Get all organizations
    FOR org_record IN SELECT id FROM public.organizations LOOP
        -- Get all existing payment modes (which don't have org_id yet)
        FOR mode_record IN SELECT * FROM public.payment_modes WHERE organization_id IS NULL LOOP
            -- Insert a copy for this organization (if it doesn't exist)
            INSERT INTO public.payment_modes (
                name, type, is_active, requires_reference, description, organization_id
            ) VALUES (
                mode_record.name || ' - ' || org_record.id::text,
                mode_record.type,
                mode_record.is_active,
                mode_record.requires_reference,
                mode_record.description,
                org_record.id
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT duplicate_payment_modes_for_orgs();

-- Drop the temporary function
DROP FUNCTION duplicate_payment_modes_for_orgs();

-- 3. Remove the old payment modes without organization_id
DELETE FROM public.payment_modes WHERE organization_id IS NULL;

-- 4. Make organization_id NOT NULL
ALTER TABLE public.payment_modes 
ALTER COLUMN organization_id SET NOT NULL;

-- 5. Update the unique constraint to be per organization
ALTER TABLE public.payment_modes 
DROP CONSTRAINT IF EXISTS payment_modes_name_key;

ALTER TABLE public.payment_modes 
ADD CONSTRAINT unique_payment_mode_name_per_org UNIQUE (organization_id, name);

-- 6. Create RLS policies for payment_modes
ALTER TABLE public.payment_modes ENABLE ROW LEVEL SECURITY;

-- Users can only view payment modes from their organization
CREATE POLICY "Users can view payment modes from their organization" ON public.payment_modes
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Only admins can manage payment modes
CREATE POLICY "Admins can manage payment modes" ON public.payment_modes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.organization_id = payment_modes.organization_id
    )
  );

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_modes_organization ON public.payment_modes(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_modes_org_active ON public.payment_modes(organization_id, is_active);

-- 8. Create a migration to properly seed payment modes for each organization
CREATE OR REPLACE FUNCTION seed_payment_modes_for_organization(p_organization_id UUID) RETURNS void AS $$
BEGIN
    -- Insert default payment modes for the organization
    INSERT INTO public.payment_modes (name, type, requires_reference, description, organization_id) VALUES
    ('Cash', 'cash', FALSE, 'Cash payment', p_organization_id),
    ('Cheque', 'cheque', TRUE, 'Cheque payment with reference number', p_organization_id),
    ('NEFT', 'bank_transfer', TRUE, 'National Electronic Funds Transfer', p_organization_id),
    ('RTGS', 'bank_transfer', TRUE, 'Real Time Gross Settlement', p_organization_id),
    ('UPI', 'upi', TRUE, 'Unified Payments Interface', p_organization_id),
    ('IMPS', 'bank_transfer', TRUE, 'Immediate Payment Service', p_organization_id),
    ('Credit Card', 'card', TRUE, 'Credit card payment', p_organization_id),
    ('Debit Card', 'card', TRUE, 'Debit card payment', p_organization_id)
    ON CONFLICT (organization_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Seed payment modes for existing organizations
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations LOOP
        PERFORM seed_payment_modes_for_organization(org_record.id);
    END LOOP;
END $$;

-- 9. Create trigger to automatically seed payment modes for new organizations
CREATE OR REPLACE FUNCTION auto_seed_payment_modes() RETURNS TRIGGER AS $$
BEGIN
    PERFORM seed_payment_modes_for_organization(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seed_payment_modes_on_org_create
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_seed_payment_modes();

-- 10. Add comment explaining the multi-tenant structure
COMMENT ON TABLE public.payment_modes IS 'Payment modes available per organization. Each organization has its own set of payment modes.';
COMMENT ON COLUMN public.payment_modes.organization_id IS 'Organization that owns this payment mode. Each organization maintains its own payment modes.';