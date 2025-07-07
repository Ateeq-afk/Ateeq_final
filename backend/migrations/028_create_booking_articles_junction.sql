-- Migration: Create booking_articles junction table
-- Description: Fixes the fundamental data model issue by allowing multiple articles per booking
-- This replaces the broken single article_id approach

-- Create booking_articles junction table
CREATE TABLE booking_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
  
  -- Article-specific quantities and weights
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_of_measure TEXT NOT NULL DEFAULT 'Nos',
  actual_weight DECIMAL(10,3) NOT NULL CHECK (actual_weight > 0),
  charged_weight DECIMAL(10,3) CHECK (charged_weight >= actual_weight),
  declared_value DECIMAL(10,2) CHECK (declared_value >= 0),
  
  -- Article-specific pricing
  rate_per_unit DECIMAL(10,2) NOT NULL CHECK (rate_per_unit >= 0),
  rate_type TEXT NOT NULL DEFAULT 'per_quantity' CHECK (rate_type IN ('per_kg', 'per_quantity')),
  freight_amount DECIMAL(10,2) NOT NULL CHECK (freight_amount >= 0),
  
  -- Article-specific charges (per unit, will be multiplied by quantity)
  loading_charge_per_unit DECIMAL(10,2) DEFAULT 0 CHECK (loading_charge_per_unit >= 0),
  unloading_charge_per_unit DECIMAL(10,2) DEFAULT 0 CHECK (unloading_charge_per_unit >= 0),
  total_loading_charges DECIMAL(10,2) GENERATED ALWAYS AS (loading_charge_per_unit * quantity) STORED,
  total_unloading_charges DECIMAL(10,2) GENERATED ALWAYS AS (unloading_charge_per_unit * quantity) STORED,
  
  -- Insurance and packaging (per article)
  insurance_required BOOLEAN DEFAULT FALSE,
  insurance_value DECIMAL(10,2) CHECK (insurance_value >= 0),
  insurance_charge DECIMAL(10,2) DEFAULT 0 CHECK (insurance_charge >= 0),
  packaging_charge DECIMAL(10,2) DEFAULT 0 CHECK (packaging_charge >= 0),
  
  -- Article total amount (calculated)
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (
    freight_amount + 
    (loading_charge_per_unit * quantity) + 
    (unloading_charge_per_unit * quantity) + 
    COALESCE(insurance_charge, 0) + 
    COALESCE(packaging_charge, 0)
  ) STORED,
  
  -- Article-specific attributes
  description TEXT,
  private_mark_number TEXT,
  is_fragile BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  
  -- Status tracking for each article
  status TEXT DEFAULT 'booked' CHECK (status IN (
    'booked', 'loaded', 'in_transit', 'unloaded', 'out_for_delivery', 
    'delivered', 'damaged', 'missing', 'cancelled'
  )),
  
  -- Logistics tracking
  loaded_at TIMESTAMP WITH TIME ZONE,
  loaded_by TEXT,
  unloaded_at TIMESTAMP WITH TIME ZONE,
  unloaded_by TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by TEXT,
  
  -- Warehouse tracking
  warehouse_location TEXT,
  ogpl_id UUID REFERENCES ogpl(id),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Add RLS policy for multi-tenant security
ALTER TABLE booking_articles ENABLE ROW LEVEL SECURITY;

-- Create policy for organization-level access
CREATE POLICY "booking_articles_org_policy" ON booking_articles
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE organization_id = current_setting('app.current_org_id')::uuid
    )
  );

-- Create indexes for performance
CREATE INDEX idx_booking_articles_booking_id ON booking_articles(booking_id);
CREATE INDEX idx_booking_articles_article_id ON booking_articles(article_id);
CREATE INDEX idx_booking_articles_status ON booking_articles(status);
CREATE INDEX idx_booking_articles_ogpl_id ON booking_articles(ogpl_id) WHERE ogpl_id IS NOT NULL;

-- Unique constraint to prevent duplicate article entries in same booking
CREATE UNIQUE INDEX idx_booking_articles_unique_booking_article 
ON booking_articles(booking_id, article_id);

-- Add comments for documentation
COMMENT ON TABLE booking_articles IS 'Junction table storing individual articles within each booking, enabling multiple articles per booking with proper tracking';
COMMENT ON COLUMN booking_articles.rate_type IS 'Determines freight calculation: per_kg (weight-based) or per_quantity (unit-based)';
COMMENT ON COLUMN booking_articles.charged_weight IS 'Volumetric weight for billing, must be >= actual_weight';
COMMENT ON COLUMN booking_articles.total_loading_charges IS 'Auto-calculated: loading_charge_per_unit × quantity';
COMMENT ON COLUMN booking_articles.total_unloading_charges IS 'Auto-calculated: unloading_charge_per_unit × quantity';
COMMENT ON COLUMN booking_articles.total_amount IS 'Auto-calculated total for this article including all charges';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_booking_articles_updated_at
    BEFORE UPDATE ON booking_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_articles_updated_at();

-- Create function to calculate booking total from articles
CREATE OR REPLACE FUNCTION calculate_booking_total(booking_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_amount DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(ba.total_amount), 0)
    INTO total_amount
    FROM booking_articles ba
    WHERE ba.booking_id = booking_uuid;
    
    RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update booking total when articles change
CREATE OR REPLACE FUNCTION update_booking_total_from_articles()
RETURNS TRIGGER AS $$
DECLARE
    booking_uuid UUID;
    new_total DECIMAL(10,2);
BEGIN
    -- Get booking ID from either NEW or OLD record
    booking_uuid := COALESCE(NEW.booking_id, OLD.booking_id);
    
    -- Calculate new total
    new_total := calculate_booking_total(booking_uuid);
    
    -- Update booking total
    UPDATE bookings 
    SET total_amount = new_total,
        updated_at = NOW()
    WHERE id = booking_uuid;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_booking_total_on_article_change
    AFTER INSERT OR UPDATE OR DELETE ON booking_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_total_from_articles();