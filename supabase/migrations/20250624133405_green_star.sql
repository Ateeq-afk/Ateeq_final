/*
  # Fix Logistics System Constraints and Tables

  1. Database Schema Fixes
    - Update bookings status constraint to include 'warehouse'
    - Ensure unloading_records table exists with proper structure
    - Add missing indexes and constraints

  2. Security
    - Ensure RLS policies are properly configured
*/

-- =============================================
-- FIX BOOKINGS STATUS CONSTRAINT
-- =============================================

-- Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_status_check' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

-- Add updated constraint with 'warehouse' status
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('booked', 'in_transit', 'warehouse', 'delivered', 'cancelled'));

-- =============================================
-- CREATE UNLOADING_RECORDS TABLE (LEGACY SUPPORT)
-- =============================================

CREATE TABLE IF NOT EXISTS public.unloading_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ogpl_id UUID REFERENCES public.ogpl(id),
  unloaded_at TIMESTAMPTZ DEFAULT now(),
  unloaded_by TEXT NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unloading_records_ogpl_id ON public.unloading_records(ogpl_id);
CREATE INDEX IF NOT EXISTS idx_unloading_records_unloaded_at ON public.unloading_records(unloaded_at);

-- =============================================
-- ENABLE RLS AND POLICIES
-- =============================================

-- Enable RLS on unloading_records
ALTER TABLE public.unloading_records ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for development
CREATE POLICY "Allow all operations on unloading_records" 
ON public.unloading_records 
FOR ALL TO public 
USING (true) 
WITH CHECK (true);

-- =============================================
-- ADD TRIGGER FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_unloading_records_updated_at
BEFORE UPDATE ON public.unloading_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();