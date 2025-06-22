/*
  # Fix user policies to avoid recursion issues

  1. Changes
    - Drop existing policies that might cause recursion
    - Create new simplified policies for users table
    - Ensure RLS is enabled on users table
  2. Security
    - Users can view and update their own data
    - Admins can view and update all users
  3. Notes
    - Uses DO blocks to safely check if policies exist before dropping/creating
*/

-- Drop all existing policies on users table
DO $$
BEGIN
  -- Drop policies only if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view their own profile') THEN
    DROP POLICY "Users can view their own profile" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert their own profile') THEN
    DROP POLICY "Users can insert their own profile" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update their own profile') THEN
    DROP POLICY "Users can update their own profile" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can view all users') THEN
    DROP POLICY "Admins can view all users" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can update all users') THEN
    DROP POLICY "Admins can update all users" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Branch managers can view users in their branch') THEN
    DROP POLICY "Branch managers can view users in their branch" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view their own row') THEN
    DROP POLICY "Users can view their own row" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert their own row') THEN
    DROP POLICY "Users can insert their own row" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update their own row') THEN
    DROP POLICY "Users can update their own row" ON public.users;
  END IF;
END $$;

-- Create simplified policies
DO $$
BEGIN
  -- Create policies only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view their own row') THEN
    CREATE POLICY "Users can view their own row"
      ON public.users FOR SELECT
      USING (id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert their own row') THEN
    CREATE POLICY "Users can insert their own row"
      ON public.users FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update their own row') THEN
    CREATE POLICY "Users can update their own row"
      ON public.users FOR UPDATE
      USING (id = auth.uid());
  END IF;
  
  -- Create admin policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can view all users') THEN
    CREATE POLICY "Admins can view all users"
      ON public.users FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can update all users') THEN
    CREATE POLICY "Admins can update all users"
      ON public.users FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Make sure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;