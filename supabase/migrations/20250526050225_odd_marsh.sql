/*
  # Add credit_limit column to customers table

  1. Changes
    - Adds a numeric column `credit_limit` with default value 0 to the customers table
*/

-- Add credit_limit column to customers table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE customers ADD COLUMN credit_limit numeric DEFAULT 0;
  END IF;
END $$;