-- ============================================
-- Migration 017: Add Charged Weight to Bookings
-- ============================================
-- Adds charged_weight field for billing purposes
-- Charged weight is calculated as the higher of actual weight or volumetric weight
-- ============================================

-- Add charged_weight column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS charged_weight NUMERIC(10,2);

-- Add index for charged_weight for reporting queries
CREATE INDEX IF NOT EXISTS idx_bookings_charged_weight ON public.bookings(charged_weight) WHERE charged_weight IS NOT NULL;

-- Update the booking totals calculation function to consider charged weight
CREATE OR REPLACE FUNCTION calculate_booking_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- If charged_weight is provided and differs from actual_weight, use it for freight calculation
  -- This allows for volumetric weight calculations
  DECLARE
    weight_for_calculation NUMERIC;
  BEGIN
    -- Use charged_weight if provided, otherwise use actual_weight
    weight_for_calculation := COALESCE(NEW.charged_weight, NEW.actual_weight, 0);
    
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
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.charged_weight IS 'Charged weight for billing purposes (typically the higher of actual weight or volumetric weight)';

-- Create a helper function to calculate volumetric weight
CREATE OR REPLACE FUNCTION calculate_volumetric_weight(
  length_cm NUMERIC,
  width_cm NUMERIC,
  height_cm NUMERIC,
  divisor NUMERIC DEFAULT 5000 -- Standard air freight divisor
)
RETURNS NUMERIC AS $$
BEGIN
  -- Volumetric weight = (Length x Width x Height) / Divisor
  -- Result is in kg
  RETURN ROUND((length_cm * width_cm * height_cm) / divisor, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_volumetric_weight(NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;