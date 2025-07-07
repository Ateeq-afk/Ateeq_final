-- Migration: Fix booking articles total calculation
-- Description: Updates the create_booking_with_articles function to properly calculate total_amount for each article

-- Drop and recreate the function with proper total_amount calculation
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
  loading_charges DECIMAL(10,2);
  unloading_charges DECIMAL(10,2);
  article_total DECIMAL(10,2);
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
  
  -- Insert article records with proper total calculation
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
      freight_amount := COALESCE((article_record->>'charged_weight')::DECIMAL(10,3), (article_record->>'actual_weight')::DECIMAL(10,3), 0) * 
                       COALESCE((article_record->>'rate_per_unit')::DECIMAL(10,2), 0);
    ELSE
      freight_amount := COALESCE((article_record->>'quantity')::INTEGER, 1) * 
                       COALESCE((article_record->>'rate_per_unit')::DECIMAL(10,2), 0);
    END IF;
    
    -- Calculate loading and unloading charges
    loading_charges := COALESCE((article_record->>'loading_charge_per_unit')::DECIMAL(10,2), 0) * 
                      COALESCE((article_record->>'quantity')::INTEGER, 1);
    unloading_charges := COALESCE((article_record->>'unloading_charge_per_unit')::DECIMAL(10,2), 0) * 
                        COALESCE((article_record->>'quantity')::INTEGER, 1);
    
    -- Calculate total amount for this article
    article_total := freight_amount + loading_charges + unloading_charges + 
                    COALESCE((article_record->>'insurance_charge')::DECIMAL(10,2), 0) + 
                    COALESCE((article_record->>'packaging_charge')::DECIMAL(10,2), 0);
    
    -- Insert booking article with calculated totals
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
      total_loading_charges,
      total_unloading_charges,
      insurance_required,
      insurance_value,
      insurance_charge,
      packaging_charge,
      total_amount,
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
      COALESCE((article_record->>'quantity')::INTEGER, 1),
      COALESCE(article_record->>'unit_of_measure', 'Nos'),
      COALESCE((article_record->>'actual_weight')::DECIMAL(10,3), 0),
      COALESCE((article_record->>'charged_weight')::DECIMAL(10,3), (article_record->>'actual_weight')::DECIMAL(10,3), 0),
      COALESCE((article_record->>'declared_value')::DECIMAL(10,2), 0),
      COALESCE((article_record->>'rate_per_unit')::DECIMAL(10,2), 0),
      COALESCE(article_record->>'rate_type', 'per_quantity'),
      freight_amount,
      COALESCE((article_record->>'loading_charge_per_unit')::DECIMAL(10,2), 0),
      COALESCE((article_record->>'unloading_charge_per_unit')::DECIMAL(10,2), 0),
      loading_charges,
      unloading_charges,
      COALESCE((article_record->>'insurance_required')::BOOLEAN, FALSE),
      COALESCE((article_record->>'insurance_value')::DECIMAL(10,2), 0),
      COALESCE((article_record->>'insurance_charge')::DECIMAL(10,2), 0),
      COALESCE((article_record->>'packaging_charge')::DECIMAL(10,2), 0),
      article_total,
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
    
    -- Add to booking total
    booking_total := booking_total + article_total;
  END LOOP;
  
  -- Update booking total
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
    'booking_articles', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ba.id,
          'article_id', ba.article_id,
          'quantity', ba.quantity,
          'total_amount', ba.total_amount,
          'freight_amount', ba.freight_amount,
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

-- Also create a function to fix existing booking articles that might have incorrect totals
CREATE OR REPLACE FUNCTION fix_booking_article_totals()
RETURNS void AS $$
BEGIN
  -- Update all booking articles to have correct total_amount
  UPDATE booking_articles
  SET 
    total_loading_charges = loading_charge_per_unit * quantity,
    total_unloading_charges = unloading_charge_per_unit * quantity,
    freight_amount = CASE 
      WHEN rate_type = 'per_kg' THEN COALESCE(charged_weight, actual_weight) * rate_per_unit
      ELSE quantity * rate_per_unit
    END,
    total_amount = 
      CASE 
        WHEN rate_type = 'per_kg' THEN COALESCE(charged_weight, actual_weight) * rate_per_unit
        ELSE quantity * rate_per_unit
      END +
      (loading_charge_per_unit * quantity) +
      (unloading_charge_per_unit * quantity) +
      COALESCE(insurance_charge, 0) +
      COALESCE(packaging_charge, 0),
    updated_at = NOW()
  WHERE total_amount IS NULL OR total_amount = 0;
  
  -- Update booking totals
  UPDATE bookings b
  SET 
    total_amount = (
      SELECT COALESCE(SUM(ba.total_amount), 0)
      FROM booking_articles ba
      WHERE ba.booking_id = b.id
    ),
    updated_at = NOW()
  WHERE EXISTS (
    SELECT 1 FROM booking_articles ba WHERE ba.booking_id = b.id
  );
END;
$$ LANGUAGE plpgsql;

-- Run the fix function
SELECT fix_booking_article_totals();