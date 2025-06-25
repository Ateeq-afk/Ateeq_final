/*
  # Create Vendors Table

  1. Table
    - vendors stores suppliers and service providers
  2. Security
    - Enable RLS and allow all operations (development)
*/

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  gst_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on vendors" ON public.vendors;
CREATE POLICY "Allow all operations on vendors" ON public.vendors
  FOR ALL TO public USING (true) WITH CHECK (true);
