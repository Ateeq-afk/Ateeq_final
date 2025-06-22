/*
  # Add Missing Columns to Articles Table

  1. New Columns
    - Add `hsn_code` text column to the `articles` table
    - Add `tax_rate` numeric column to the `articles` table
    - Add `unit_of_measure` text column to the `articles` table
    - Add `min_quantity` integer column to the `articles` table
    - Add `is_fragile` boolean column to the `articles` table
    - Add `requires_special_handling` boolean column to the `articles` table
    - Add `notes` text column to the `articles` table
  2. Security
    - No changes to RLS
  3. Notes
    - All columns are added as nullable to maintain backward compatibility
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_hsn_code ON articles(hsn_code);
CREATE INDEX IF NOT EXISTS idx_articles_is_fragile ON articles(is_fragile);