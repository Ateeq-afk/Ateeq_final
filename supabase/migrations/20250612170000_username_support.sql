/*
  # Add username column to users table
  - Adds username text field and unique index
*/

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username text;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx
  ON public.users (username);
