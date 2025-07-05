-- ============================================
-- Migration 007: Booking Form Enhancements
-- ============================================
-- Adds missing fields for enhanced booking form functionality
-- Includes auto-calculation and validation features
-- ============================================

-- Add organization_id to bookings table if it doesn't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add enhanced booking form fields
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS lr_type TEXT DEFAULT 'system' CHECK (lr_type IN ('system', 'manual')),
ADD COLUMN IF NOT EXISTS manual_lr_number TEXT,
ADD COLUMN IF NOT EXISTS from_branch UUID REFERENCES public.branches(id),
ADD COLUMN IF NOT EXISTS to_branch UUID REFERENCES public.branches(id),
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS has_invoice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS invoice_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS eway_bill_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'Standard' CHECK (delivery_type IN ('Standard', 'Express', 'Same Day')),
ADD COLUMN IF NOT EXISTS insurance_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_value NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS insurance_charge NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fragile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'Urgent')),
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS packaging_type TEXT,
ADD COLUMN IF NOT EXISTS packaging_charge NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Update organization_id for existing bookings based on branch
UPDATE public.bookings 
SET organization_id = branches.organization_id
FROM public.branches
WHERE bookings.branch_id = branches.id
AND bookings.organization_id IS NULL;

-- Make organization_id NOT NULL after populating
ALTER TABLE public.bookings 
ALTER COLUMN organization_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON public.bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_from_branch ON public.bookings(from_branch);
CREATE INDEX IF NOT EXISTS idx_bookings_to_branch ON public.bookings(to_branch);
CREATE INDEX IF NOT EXISTS idx_bookings_sender_id ON public.bookings(sender_id);
CREATE INDEX IF NOT EXISTS idx_bookings_receiver_id ON public.bookings(receiver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lr_type ON public.bookings(lr_type);
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_type ON public.bookings(delivery_type);
CREATE INDEX IF NOT EXISTS idx_bookings_priority ON public.bookings(priority);
CREATE INDEX IF NOT EXISTS idx_bookings_insurance_required ON public.bookings(insurance_required) WHERE insurance_required = true;

-- Create function to auto-calculate insurance charge
CREATE OR REPLACE FUNCTION calculate_insurance_charge(insurance_value NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  -- Standard insurance charge is 0.5% of declared value with minimum ₹50
  RETURN GREATEST(insurance_value * 0.005, 50);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate total amount
CREATE OR REPLACE FUNCTION calculate_booking_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total amount
  NEW.total_amount := COALESCE(
    (NEW.quantity * NEW.freight_per_qty) +
    COALESCE(NEW.loading_charges, 0) +
    COALESCE(NEW.unloading_charges, 0) +
    COALESCE(NEW.insurance_charge, 0) +
    COALESCE(NEW.packaging_charge, 0),
    0
  );
  
  -- Auto-calculate insurance charge if insurance is required but charge is 0
  IF NEW.insurance_required = true AND NEW.insurance_value > 0 AND COALESCE(NEW.insurance_charge, 0) = 0 THEN
    NEW.insurance_charge := calculate_insurance_charge(NEW.insurance_value);
    -- Recalculate total with insurance charge
    NEW.total_amount := COALESCE(
      (NEW.quantity * NEW.freight_per_qty) +
      COALESCE(NEW.loading_charges, 0) +
      COALESCE(NEW.unloading_charges, 0) +
      COALESCE(NEW.insurance_charge, 0) +
      COALESCE(NEW.packaging_charge, 0),
      0
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-calculation
DROP TRIGGER IF EXISTS trigger_calculate_booking_totals ON public.bookings;
CREATE TRIGGER trigger_calculate_booking_totals
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_booking_totals();

-- Update RLS policies to include organization-level access
DROP POLICY IF EXISTS "Users can view bookings in their organization" ON public.bookings;
CREATE POLICY "Users can view bookings in their organization" ON public.bookings
  FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create bookings in their organization" ON public.bookings;
CREATE POLICY "Users can create bookings in their organization" ON public.bookings
  FOR INSERT
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update bookings in their organization" ON public.bookings;
CREATE POLICY "Users can update bookings in their organization" ON public.bookings
  FOR UPDATE
  USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete bookings in their organization" ON public.bookings;
CREATE POLICY "Users can delete bookings in their organization" ON public.bookings
  FOR DELETE
  USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

-- Add validation constraints
ALTER TABLE public.bookings
ADD CONSTRAINT booking_insurance_validation 
CHECK (
  (insurance_required = false) OR 
  (insurance_required = true AND insurance_value > 0)
);

ALTER TABLE public.bookings
ADD CONSTRAINT booking_invoice_validation 
CHECK (
  (has_invoice = false) OR 
  (has_invoice = true AND invoice_number IS NOT NULL AND invoice_date IS NOT NULL AND invoice_amount IS NOT NULL)
);

ALTER TABLE public.bookings
ADD CONSTRAINT booking_manual_lr_validation 
CHECK (
  (lr_type = 'system') OR 
  (lr_type = 'manual' AND manual_lr_number IS NOT NULL)
);

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.lr_type IS 'Type of LR number generation: system or manual';
COMMENT ON COLUMN public.bookings.insurance_required IS 'Whether insurance is required for this booking';
COMMENT ON COLUMN public.bookings.fragile IS 'Whether the shipment contains fragile items';
COMMENT ON COLUMN public.bookings.priority IS 'Priority level of the booking';
COMMENT ON COLUMN public.bookings.delivery_type IS 'Type of delivery service';
COMMENT ON COLUMN public.bookings.special_instructions IS 'Special handling instructions for drivers';

-- Update the sequence for better LR number generation if needed
-- This ensures LR numbers are unique across the organization
CREATE SEQUENCE IF NOT EXISTS lr_number_seq START 1000;

-- Create function for generating LR numbers
CREATE OR REPLACE FUNCTION generate_lr_number(org_id UUID, branch_id UUID)
RETURNS TEXT AS $$
DECLARE
  branch_code TEXT;
  year_suffix TEXT;
  sequence_num INTEGER;
  lr_number TEXT;
BEGIN
  -- Get branch code
  SELECT code INTO branch_code FROM public.branches WHERE id = branch_id;
  
  -- Get year suffix (last 2 digits)
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  year_suffix := RIGHT(year_suffix, 2);
  
  -- Get next sequence number
  sequence_num := nextval('lr_number_seq');
  
  -- Format: BRANCHCODE-YY-SEQNUM (e.g., MUM-24-1001)
  lr_number := CONCAT(COALESCE(branch_code, 'BR'), '-', year_suffix, '-', sequence_num);
  
  RETURN lr_number;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SEQUENCE lr_number_seq TO authenticated;
GRANT EXECUTE ON FUNCTION generate_lr_number(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_insurance_charge(NUMERIC) TO authenticated;