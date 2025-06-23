/*
  # Add client_name to users

  1. Schema Change
    - Add client_name column to public.users table if not exists
*/

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS client_name text;
