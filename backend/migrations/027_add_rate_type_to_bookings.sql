-- Migration: Add rate_type column to bookings table
-- Description: Adds rate_type enum column to support per-kg vs per-quantity rate calculations

-- Add rate_type column to bookings table
ALTER TABLE bookings 
ADD COLUMN rate_type TEXT DEFAULT 'per_quantity' CHECK (rate_type IN ('per_kg', 'per_quantity'));

-- Add comment to explain the column
COMMENT ON COLUMN bookings.rate_type IS 'Determines how freight rates are calculated: per_kg (based on weight) or per_quantity (based on quantity)';

-- Update existing bookings to have the default rate_type
UPDATE bookings 
SET rate_type = 'per_quantity' 
WHERE rate_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE bookings 
ALTER COLUMN rate_type SET NOT NULL;