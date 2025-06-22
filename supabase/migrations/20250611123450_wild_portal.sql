/*
  # Remove Customer RLS Restrictions

  1. Security Changes
    - Disable Row Level Security on customers table
    - Drop existing restrictive policies
    - Add permissive policies for all operations

  This allows anyone to create, read, update, and delete customers without authentication restrictions.
*/

-- Disable Row Level Security on customers table
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;

-- Create permissive policies that allow all operations for everyone
CREATE POLICY "Allow all operations on customers"
  ON customers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS with the new permissive policy
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;