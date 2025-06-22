/*
  # Add Missing Columns and Create Tables for Logistics System

  1. New Tables
    - `loading_sessions` - Records of loading operations
    - `unloading_sessions` - Records of unloading operations
    - `pod_records` - Proof of Delivery records
    - `logistics_events` - Event log for all logistics operations

  2. New Columns
    - Add status tracking columns to bookings table
    - Add relationship columns to connect bookings with sessions
    - Add POD data storage to bookings

  3. Indexes
    - Create appropriate indexes for performance
    - Add foreign key constraints

  4. Security
    - Enable RLS with permissive policies for development
*/

-- =============================================
-- LOADING SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.loading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ogpl_id UUID REFERENCES public.ogpl(id),
  loaded_by TEXT NOT NULL,
  loaded_at TIMESTAMPTZ DEFAULT now(),
  vehicle_id UUID REFERENCES public.vehicles(id),
  from_branch_id UUID REFERENCES public.branches(id),
  to_branch_id UUID REFERENCES public.branches(id),
  status TEXT DEFAULT 'completed',
  notes TEXT,
  total_items INTEGER DEFAULT 0,
  total_weight NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loading_sessions_ogpl_id ON public.loading_sessions(ogpl_id);
CREATE INDEX IF NOT EXISTS idx_loading_sessions_vehicle_id ON public.loading_sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_loading_sessions_loaded_at ON public.loading_sessions(loaded_at);

-- =============================================
-- UNLOADING SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.unloading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ogpl_id UUID REFERENCES public.ogpl(id),
  unloaded_by TEXT NOT NULL,
  unloaded_at TIMESTAMPTZ DEFAULT now(),
  branch_id UUID REFERENCES public.branches(id),
  status TEXT DEFAULT 'completed',
  notes TEXT,
  total_items INTEGER DEFAULT 0,
  items_damaged INTEGER DEFAULT 0,
  items_missing INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unloading_sessions_ogpl_id ON public.unloading_sessions(ogpl_id);
CREATE INDEX IF NOT EXISTS idx_unloading_sessions_unloaded_at ON public.unloading_sessions(unloaded_at);

-- =============================================
-- POD (PROOF OF DELIVERY) RECORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.pod_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  delivered_by TEXT NOT NULL,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT,
  receiver_designation TEXT,
  signature_image_url TEXT,
  photo_evidence_url TEXT,
  remarks TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pod_records_booking_id ON public.pod_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_pod_records_delivered_at ON public.pod_records(delivered_at);

-- =============================================
-- LOGISTICS EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.logistics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID,
  branch_id UUID REFERENCES public.branches(id),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logistics_events_entity_id ON public.logistics_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_logistics_events_event_type ON public.logistics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_logistics_events_created_at ON public.logistics_events(created_at);

-- =============================================
-- ENHANCE EXISTING TABLES
-- =============================================

-- Add loading_status to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'loading_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN loading_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add unloading_status to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'unloading_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN unloading_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add pod_status to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pod_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pod_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add loading_session_id to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'loading_session_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN loading_session_id UUID;
  END IF;
END $$;

-- Add unloading_session_id to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'unloading_session_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN unloading_session_id UUID;
  END IF;
END $$;

-- Add pod_record_id to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pod_record_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pod_record_id UUID;
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
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_date ON bookings(delivery_date);
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_reason ON bookings(cancellation_reason);
CREATE INDEX IF NOT EXISTS idx_bookings_lr_number ON bookings(lr_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_loading_status ON bookings(loading_status);
CREATE INDEX IF NOT EXISTS idx_bookings_unloading_status ON bookings(unloading_status);
CREATE INDEX IF NOT EXISTS idx_bookings_pod_status ON bookings(pod_status);
CREATE INDEX IF NOT EXISTS idx_bookings_loading_session_id ON bookings(loading_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_unloading_session_id ON bookings(unloading_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pod_record_id ON bookings(pod_record_id);

-- =============================================
-- ENABLE RLS WITH PERMISSIVE POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.loading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unloading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_events ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development
CREATE POLICY "Allow all operations on loading_sessions" ON public.loading_sessions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on unloading_sessions" ON public.unloading_sessions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pod_records" ON public.pod_records FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on logistics_events" ON public.logistics_events FOR ALL TO public USING (true) WITH CHECK (true);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the new tables
CREATE TRIGGER update_loading_sessions_updated_at
BEFORE UPDATE ON public.loading_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unloading_sessions_updated_at
BEFORE UPDATE ON public.unloading_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pod_records_updated_at
BEFORE UPDATE ON public.pod_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();