/*
  # Remove RLS Restrictions for All Tables

  1. Changes
    - Disable Row Level Security (RLS) on all tables
    - Drop existing restrictive policies
    - Create permissive policies for all tables
    - Re-enable RLS with permissive policies
  2. Security
    - WARNING: This removes all security restrictions
    - Anyone can perform any operation on any table
    - No authentication or authorization checks are performed
  3. Notes
    - This is intended for development/testing purposes only
    - Not recommended for production environments
*/

-- Function to disable RLS and create permissive policies for all tables
CREATE OR REPLACE FUNCTION disable_rls_for_all_tables() RETURNS void AS $$
DECLARE
    table_record RECORD;
    policy_record RECORD;
BEGIN
    -- Loop through all tables in the public schema
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Drop all existing policies for the table
        FOR policy_record IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = table_record.tablename
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                          policy_record.policyname, 
                          table_record.tablename);
        END LOOP;

        -- Create a permissive policy for all operations
        EXECUTE format('CREATE POLICY "Allow all operations on %I" ON %I FOR ALL TO public USING (true) WITH CHECK (true)', 
                      table_record.tablename, 
                      table_record.tablename);
                      
        -- Disable and re-enable RLS to ensure the new policy takes effect
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to disable RLS for all tables
SELECT disable_rls_for_all_tables();

-- Drop the function after use
DROP FUNCTION disable_rls_for_all_tables();

-- Specific tables that need special handling
-- Customers table (already handled in previous migration, but included for completeness)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Articles table
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read articles" ON articles;
DROP POLICY IF EXISTS "Allow branch admins to manage articles" ON articles;
DROP POLICY IF EXISTS "Allow all operations on articles" ON articles;
CREATE POLICY "Allow all operations on articles" ON articles FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Bookings table
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to create bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated users to read bookings" ON bookings;
DROP POLICY IF EXISTS "Allow all operations on bookings" ON bookings;
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Loading records table
ALTER TABLE loading_records DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to insert loading records" ON loading_records;
DROP POLICY IF EXISTS "Allow authenticated users to read loading records" ON loading_records;
DROP POLICY IF EXISTS "Allow all operations on loading_records" ON loading_records;
CREATE POLICY "Allow all operations on loading_records" ON loading_records FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE loading_records ENABLE ROW LEVEL SECURITY;

-- Branches table
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all read access to branches" ON branches;
DROP POLICY IF EXISTS "Allow all operations on branches" ON branches;
CREATE POLICY "Allow all operations on branches" ON branches FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Subscription plans table
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_plans_manageable_by_super_admin" ON subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_viewable_by_authenticated_users" ON subscription_plans;
DROP POLICY IF EXISTS "Allow all operations on subscription_plans" ON subscription_plans;
CREATE POLICY "Allow all operations on subscription_plans" ON subscription_plans FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Organization subscriptions table
ALTER TABLE organization_subscriptions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on organization_subscriptions" ON organization_subscriptions;
CREATE POLICY "Allow all operations on organization_subscriptions" ON organization_subscriptions FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- Organizations table
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on organizations" ON organizations;
CREATE POLICY "Allow all operations on organizations" ON organizations FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Custom users table
ALTER TABLE custom_users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to update own profile" ON custom_users;
DROP POLICY IF EXISTS "Allow users to view own profile" ON custom_users;
DROP POLICY IF EXISTS "Allow all operations on custom_users" ON custom_users;
CREATE POLICY "Allow all operations on custom_users" ON custom_users FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;

-- Users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own row" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Branch users table
ALTER TABLE branch_users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branch_users_delete" ON branch_users;
DROP POLICY IF EXISTS "branch_users_insert" ON branch_users;
DROP POLICY IF EXISTS "branch_users_select" ON branch_users;
DROP POLICY IF EXISTS "branch_users_update" ON branch_users;
DROP POLICY IF EXISTS "Allow all operations on branch_users" ON branch_users;
CREATE POLICY "Allow all operations on branch_users" ON branch_users FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE branch_users ENABLE ROW LEVEL SECURITY;

-- Customer article rates table
ALTER TABLE customer_article_rates DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to manage customer article rates" ON customer_article_rates;
DROP POLICY IF EXISTS "Allow authenticated users to read customer article rates" ON customer_article_rates;
DROP POLICY IF EXISTS "Allow all operations on customer_article_rates" ON customer_article_rates;
CREATE POLICY "Allow all operations on customer_article_rates" ON customer_article_rates FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE customer_article_rates ENABLE ROW LEVEL SECURITY;

-- Vehicles table
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow branch users to manage vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow all operations on vehicles" ON vehicles;
CREATE POLICY "Allow all operations on vehicles" ON vehicles FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- OGPL table
ALTER TABLE ogpl DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on ogpl" ON ogpl;
CREATE POLICY "Allow all operations on ogpl" ON ogpl FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE ogpl ENABLE ROW LEVEL SECURITY;

-- Routes table
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on routes" ON routes;
CREATE POLICY "Allow all operations on routes" ON routes FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;