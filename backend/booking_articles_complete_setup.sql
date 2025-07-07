-- Complete setup for booking_articles junction table
-- Run this entire script in Supabase SQL Editor

-- Step 1: Create the booking_articles table
CREATE TABLE IF NOT EXISTS booking_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
    
    -- Quantity and weight
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_of_measure TEXT DEFAULT 'Nos',
    actual_weight DECIMAL(10,3) DEFAULT 0,
    charged_weight DECIMAL(10,3) DEFAULT 0 CHECK (charged_weight >= actual_weight),
    
    -- Financial details
    declared_value DECIMAL(10,2) DEFAULT 0,
    rate_per_unit DECIMAL(10,2) NOT NULL,
    rate_type TEXT NOT NULL DEFAULT 'per_quantity' CHECK (rate_type IN ('per_kg', 'per_quantity')),
    freight_amount DECIMAL(10,2) NOT NULL,
    
    -- Charges per unit
    loading_charge_per_unit DECIMAL(10,2) DEFAULT 0,
    unloading_charge_per_unit DECIMAL(10,2) DEFAULT 0,
    
    -- Calculated fields (stored for performance)
    total_loading_charges DECIMAL(10,2) GENERATED ALWAYS AS (loading_charge_per_unit * quantity) STORED,
    total_unloading_charges DECIMAL(10,2) GENERATED ALWAYS AS (unloading_charge_per_unit * quantity) STORED,
    
    -- Optional charges
    insurance_required BOOLEAN DEFAULT false,
    insurance_value DECIMAL(10,2) DEFAULT 0,
    insurance_charge DECIMAL(10,2) DEFAULT 0,
    packaging_charge DECIMAL(10,2) DEFAULT 0,
    
    -- Total for this article
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (
      freight_amount + 
      (loading_charge_per_unit * quantity) + 
      (unloading_charge_per_unit * quantity) + 
      COALESCE(insurance_charge, 0) + 
      COALESCE(packaging_charge, 0)
    ) STORED,
    
    -- Descriptions
    description TEXT,
    private_mark_number TEXT,
    is_fragile BOOLEAN DEFAULT false,
    special_instructions TEXT,
    
    -- Warehouse tracking
    warehouse_location TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'loaded', 'in_transit', 'unloaded', 'out_for_delivery', 'delivered', 'damaged', 'missing', 'cancelled')),
    ogpl_id UUID REFERENCES ogpl(id),
    loaded_at TIMESTAMP WITH TIME ZONE,
    loaded_by UUID REFERENCES auth.users(id),
    unloaded_at TIMESTAMP WITH TIME ZONE,
    unloaded_by UUID REFERENCES auth.users(id),
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivered_by UUID REFERENCES auth.users(id),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(booking_id, article_id),
    CHECK (insurance_required = false OR insurance_value > 0),
    CHECK (charged_weight > 0)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_articles_booking_id ON booking_articles(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_articles_article_id ON booking_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_booking_articles_status ON booking_articles(status);
CREATE INDEX IF NOT EXISTS idx_booking_articles_ogpl_id ON booking_articles(ogpl_id) WHERE ogpl_id IS NOT NULL;

-- Step 3: Create update trigger for updated_at
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

-- Step 4: Create helper functions

-- Function to calculate booking total
CREATE OR REPLACE FUNCTION calculate_booking_total(booking_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_amount DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(ba.total_amount), 0)
    INTO total_amount
    FROM booking_articles ba
    WHERE ba.booking_id = booking_uuid;
    
    RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update booking total when articles change
CREATE OR REPLACE FUNCTION update_booking_total_on_article_change()
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

-- Create trigger for automatic total updates
CREATE TRIGGER trigger_update_booking_total_on_article_change
    AFTER INSERT OR UPDATE OR DELETE ON booking_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_total_on_article_change();

-- Step 5: Enable Row Level Security
ALTER TABLE booking_articles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies

-- Policy for SELECT (view)
CREATE POLICY booking_articles_org_select ON booking_articles
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_articles.booking_id
        AND b.organization_id IN (
            SELECT organization_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- Policy for INSERT (create)
CREATE POLICY booking_articles_org_insert ON booking_articles
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_articles.booking_id
        AND b.organization_id IN (
            SELECT organization_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- Policy for UPDATE
CREATE POLICY booking_articles_org_update ON booking_articles
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_articles.booking_id
        AND b.organization_id IN (
            SELECT organization_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_articles.booking_id
        AND b.organization_id IN (
            SELECT organization_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- Policy for DELETE
CREATE POLICY booking_articles_org_delete ON booking_articles
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_articles.booking_id
        AND b.organization_id IN (
            SELECT organization_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- Step 7: Add comments for documentation
COMMENT ON TABLE booking_articles IS 'Junction table linking bookings to multiple articles with quantity and pricing details';
COMMENT ON COLUMN booking_articles.rate_type IS 'Determines freight calculation: per_kg (weight-based) or per_quantity (unit-based)';
COMMENT ON COLUMN booking_articles.charged_weight IS 'Volumetric weight for billing, must be >= actual_weight';
COMMENT ON COLUMN booking_articles.total_loading_charges IS 'Auto-calculated: loading_charge_per_unit * quantity';
COMMENT ON COLUMN booking_articles.total_unloading_charges IS 'Auto-calculated: unloading_charge_per_unit * quantity';
COMMENT ON COLUMN booking_articles.total_amount IS 'Auto-calculated total for this article including all charges';

-- Step 8: Grant permissions to authenticated users
GRANT ALL ON booking_articles TO authenticated;
GRANT ALL ON booking_articles TO service_role;

-- Step 9: Create the atomic booking creation function (from migration 029)
CREATE OR REPLACE FUNCTION create_booking_with_articles(
  booking_data JSONB,
  articles_data JSONB,
  user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_booking_id UUID;
  article_record JSONB;
  freight_amount DECIMAL(10,2);
  booking_total DECIMAL(10,2) := 0;
  lr_number TEXT;
  result JSONB;
BEGIN
  -- Validate input
  IF booking_data IS NULL OR articles_data IS NULL THEN
    RAISE EXCEPTION 'Booking data and articles data are required';
  END IF;
  
  IF jsonb_array_length(articles_data) = 0 THEN
    RAISE EXCEPTION 'At least one article is required';
  END IF;
  
  -- Generate LR number if not provided
  IF booking_data->>'lr_type' = 'manual' THEN
    lr_number := booking_data->>'manual_lr_number';
    IF lr_number IS NULL OR lr_number = '' THEN
      RAISE EXCEPTION 'Manual LR number is required for manual LR type';
    END IF;
    
    -- Check for duplicate LR number
    IF EXISTS (
      SELECT 1 FROM bookings 
      WHERE lr_number = lr_number 
      AND organization_id = (booking_data->>'organization_id')::UUID
    ) THEN
      RAISE EXCEPTION 'LR number % already exists', lr_number;
    END IF;
  ELSE
    -- Generate system LR number (simplified for now)
    lr_number := 'LR' || EXTRACT(EPOCH FROM NOW())::TEXT || 
                 SUBSTRING((booking_data->>'branch_id')::TEXT, 1, 4);
  END IF;
  
  -- Validate branches exist and are different
  IF booking_data->>'from_branch' = booking_data->>'to_branch' THEN
    RAISE EXCEPTION 'Origin and destination branches cannot be the same';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM branches 
    WHERE id = (booking_data->>'from_branch')::UUID 
    AND organization_id = (booking_data->>'organization_id')::UUID
  ) THEN
    RAISE EXCEPTION 'Origin branch not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM branches 
    WHERE id = (booking_data->>'to_branch')::UUID 
    AND organization_id = (booking_data->>'organization_id')::UUID
  ) THEN
    RAISE EXCEPTION 'Destination branch not found';
  END IF;
  
  -- Validate customers exist and are active
  IF NOT EXISTS (
    SELECT 1 FROM customers 
    WHERE id = (booking_data->>'sender_id')::UUID 
    AND organization_id = (booking_data->>'organization_id')::UUID
    AND COALESCE(credit_status, 'Active') NOT IN ('Blocked', 'Suspended')
  ) THEN
    RAISE EXCEPTION 'Sender not found or account is blocked/suspended';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM customers 
    WHERE id = (booking_data->>'receiver_id')::UUID 
    AND organization_id = (booking_data->>'organization_id')::UUID
  ) THEN
    RAISE EXCEPTION 'Receiver not found';
  END IF;
  
  -- Insert booking record (without total_amount initially)
  INSERT INTO bookings (
    organization_id,
    branch_id,
    lr_number,
    lr_type,
    from_branch,
    to_branch,
    sender_id,
    receiver_id,
    payment_type,
    delivery_type,
    priority,
    expected_delivery_date,
    reference_number,
    remarks,
    has_invoice,
    invoice_number,
    invoice_date,
    invoice_amount,
    eway_bill_number,
    status,
    total_amount,
    created_at,
    updated_at
  ) VALUES (
    (booking_data->>'organization_id')::UUID,
    (booking_data->>'branch_id')::UUID,
    lr_number,
    booking_data->>'lr_type',
    (booking_data->>'from_branch')::UUID,
    (booking_data->>'to_branch')::UUID,
    (booking_data->>'sender_id')::UUID,
    (booking_data->>'receiver_id')::UUID,
    booking_data->>'payment_type',
    COALESCE(booking_data->>'delivery_type', 'Standard'),
    COALESCE(booking_data->>'priority', 'Normal'),
    (booking_data->>'expected_delivery_date')::TIMESTAMP WITH TIME ZONE,
    booking_data->>'reference_number',
    booking_data->>'remarks',
    COALESCE((booking_data->>'has_invoice')::BOOLEAN, FALSE),
    booking_data->>'invoice_number',
    (booking_data->>'invoice_date')::TIMESTAMP WITH TIME ZONE,
    (booking_data->>'invoice_amount')::DECIMAL(10,2),
    booking_data->>'eway_bill_number',
    'booked',
    0, -- Will be updated after articles are inserted
    NOW(),
    NOW()
  ) RETURNING id INTO new_booking_id;
  
  -- Insert article records
  FOR article_record IN SELECT * FROM jsonb_array_elements(articles_data) LOOP
    -- Validate article exists
    IF NOT EXISTS (
      SELECT 1 FROM articles 
      WHERE id = (article_record->>'article_id')::UUID
    ) THEN
      RAISE EXCEPTION 'Article % not found', article_record->>'article_id';
    END IF;
    
    -- Calculate freight amount based on rate type
    IF article_record->>'rate_type' = 'per_kg' THEN
      freight_amount := (article_record->>'actual_weight')::DECIMAL(10,3) * 
                       (article_record->>'rate_per_unit')::DECIMAL(10,2);
    ELSE
      freight_amount := (article_record->>'quantity')::INTEGER * 
                       (article_record->>'rate_per_unit')::DECIMAL(10,2);
    END IF;
    
    -- Insert booking article
    INSERT INTO booking_articles (
      booking_id,
      article_id,
      quantity,
      unit_of_measure,
      actual_weight,
      charged_weight,
      declared_value,
      rate_per_unit,
      rate_type,
      freight_amount,
      loading_charge_per_unit,
      unloading_charge_per_unit,
      insurance_required,
      insurance_value,
      insurance_charge,
      packaging_charge,
      description,
      private_mark_number,
      is_fragile,
      special_instructions,
      warehouse_location,
      status,
      created_at,
      updated_at,
      created_by
    ) VALUES (
      new_booking_id,
      (article_record->>'article_id')::UUID,
      (article_record->>'quantity')::INTEGER,
      COALESCE(article_record->>'unit_of_measure', 'Nos'),
      (article_record->>'actual_weight')::DECIMAL(10,3),
      (article_record->>'charged_weight')::DECIMAL(10,3),
      (article_record->>'declared_value')::DECIMAL(10,2),
      (article_record->>'rate_per_unit')::DECIMAL(10,2),
      COALESCE(article_record->>'rate_type', 'per_quantity'),
      freight_amount,
      COALESCE((article_record->>'loading_charge_per_unit')::DECIMAL(10,2), 0),
      COALESCE((article_record->>'unloading_charge_per_unit')::DECIMAL(10,2), 0),
      COALESCE((article_record->>'insurance_required')::BOOLEAN, FALSE),
      (article_record->>'insurance_value')::DECIMAL(10,2),
      COALESCE((article_record->>'insurance_charge')::DECIMAL(10,2), 0),
      COALESCE((article_record->>'packaging_charge')::DECIMAL(10,2), 0),
      article_record->>'description',
      article_record->>'private_mark_number',
      COALESCE((article_record->>'is_fragile')::BOOLEAN, FALSE),
      article_record->>'special_instructions',
      article_record->>'warehouse_location',
      'booked',
      NOW(),
      NOW(),
      user_id
    );
  END LOOP;
  
  -- Calculate and update booking total
  SELECT calculate_booking_total(new_booking_id) INTO booking_total;
  
  UPDATE bookings 
  SET total_amount = booking_total,
      updated_at = NOW()
  WHERE id = new_booking_id;
  
  -- Create logistics event
  INSERT INTO logistics_events (
    event_type,
    booking_id,
    branch_id,
    description,
    metadata,
    created_at
  ) VALUES (
    'booking_created',
    new_booking_id,
    (booking_data->>'branch_id')::UUID,
    'Booking created with ' || jsonb_array_length(articles_data) || ' articles',
    jsonb_build_object(
      'lr_number', lr_number,
      'total_amount', booking_total,
      'articles_count', jsonb_array_length(articles_data),
      'created_by', user_id
    ),
    NOW()
  );
  
  -- Return the created booking with articles
  SELECT jsonb_build_object(
    'id', b.id,
    'lr_number', b.lr_number,
    'status', b.status,
    'total_amount', b.total_amount,
    'created_at', b.created_at,
    'articles', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ba.id,
          'article_id', ba.article_id,
          'quantity', ba.quantity,
          'total_amount', ba.total_amount,
          'status', ba.status
        )
      )
      FROM booking_articles ba
      WHERE ba.booking_id = b.id
    )
  ) INTO result
  FROM bookings b
  WHERE b.id = new_booking_id;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create booking: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION create_booking_with_articles FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_booking_with_articles TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_booking_with_articles IS 'Atomically creates a booking with multiple articles, ensuring data consistency';

-- Verification query - run this to confirm table was created
SELECT 
    'booking_articles table created successfully!' as message,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'booking_articles' 
AND table_schema = 'public';