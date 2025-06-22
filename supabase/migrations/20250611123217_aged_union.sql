/*
  # Fix Customer RLS Policies

  1. Security Updates
    - Update INSERT policy for customers table to properly handle branch validation
    - Ensure authenticated users can create customers in their assigned branch
    - Admin users can create customers in any branch
    - Fix policy logic to use proper user authentication checks

  2. Policy Changes
    - Replace existing INSERT policy with corrected logic
    - Ensure UPDATE policy works correctly
    - Maintain SELECT policy for reading customers
*/

-- Drop existing policies to recreate them with correct logic
DROP POLICY IF EXISTS "Allow users to insert customers in their branch" ON customers;
DROP POLICY IF EXISTS "Allow users to update customers in their branch" ON customers;

-- Create corrected INSERT policy for customers
CREATE POLICY "Allow authenticated users to insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is admin
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.role = 'admin' 
        AND custom_users.is_active = true
    ))
    OR
    -- Allow if user belongs to the same branch as the customer being created
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.branch_id = customers.branch_id 
        AND custom_users.is_active = true
    ))
  );

-- Create corrected UPDATE policy for customers
CREATE POLICY "Allow authenticated users to update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user is admin
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.role = 'admin' 
        AND custom_users.is_active = true
    ))
    OR
    -- Allow if user belongs to the same branch as the customer
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.branch_id = customers.branch_id 
        AND custom_users.is_active = true
    ))
  )
  WITH CHECK (
    -- Same conditions for the updated data
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.role = 'admin' 
        AND custom_users.is_active = true
    ))
    OR
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.branch_id = customers.branch_id 
        AND custom_users.is_active = true
    ))
  );

-- Ensure the SELECT policy is correct
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;

CREATE POLICY "Allow authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is admin
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.role = 'admin' 
        AND custom_users.is_active = true
    ))
    OR
    -- Allow if user belongs to the same branch as the customer
    (EXISTS (
      SELECT 1 FROM custom_users 
      WHERE custom_users.id = auth.uid() 
        AND custom_users.branch_id = customers.branch_id 
        AND custom_users.is_active = true
    ))
  );