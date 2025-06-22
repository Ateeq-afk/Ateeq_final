/*
  # Add Missing Columns to Articles and Bookings Tables

  1. New Columns
    - Add missing columns to articles table:
      - hsn_code (text, nullable)
      - tax_rate (numeric, nullable)
      - unit_of_measure (text, nullable)
      - min_quantity (integer, default 1)
      - is_fragile (boolean, default false)
      - requires_special_handling (boolean, default false)
      - notes (text, nullable)
    - Add missing columns to bookings table:
      - delivery_date (date, nullable)
      - pod_data (jsonb, nullable)
      - cancellation_reason (text, nullable)
  
  2. Indexes
    - Create indexes for better query performance
  
  3. Notes
    - All columns are added as nullable to maintain backward compatibility
    - Uses DO blocks to safely check if columns exist before adding them
*/

-- Add hsn_code column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'hsn_code'
  ) THEN
    ALTER TABLE articles ADD COLUMN hsn_code text;
  END IF;
END $$;

-- Add tax_rate column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE articles ADD COLUMN tax_rate numeric;
  END IF;
END $$;

-- Add unit_of_measure column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'unit_of_measure'
  ) THEN
    ALTER TABLE articles ADD COLUMN unit_of_measure text;
  END IF;
END $$;

-- Add min_quantity column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'min_quantity'
  ) THEN
    ALTER TABLE articles ADD COLUMN min_quantity integer DEFAULT 1;
  END IF;
END $$;

-- Add is_fragile column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'is_fragile'
  ) THEN
    ALTER TABLE articles ADD COLUMN is_fragile boolean DEFAULT false;
  END IF;
END $$;

-- Add requires_special_handling column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'requires_special_handling'
  ) THEN
    ALTER TABLE articles ADD COLUMN requires_special_handling boolean DEFAULT false;
  END IF;
END $$;

-- Add notes column to articles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE articles ADD COLUMN notes text;
  END IF;
END $$;

-- Add delivery_date column to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'delivery_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN delivery_date date;
  END IF;
END $$;

-- Add pod_data column to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pod_data'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pod_data jsonb;
  END IF;
END $$;

-- Add cancellation_reason column to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancellation_reason text;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_hsn_code ON articles(hsn_code);
CREATE INDEX IF NOT EXISTS idx_articles_is_fragile ON articles(is_fragile);
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_date ON bookings(delivery_date);
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_reason ON bookings(cancellation_reason);