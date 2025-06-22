/*
  # Create OGPL table and add vehicle relationship

  1. New Tables
    - `ogpl` table if it doesn't exist
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `ogpl_number` (text)
      - `name` (text)
      - `vehicle_id` (uuid, foreign key to vehicles)
      - Other fields for OGPL management
  2. Relationships
    - Add foreign key from `ogpl.vehicle_id` to `vehicles.id`
  3. Indexes
    - Create index on `vehicle_id` for better query performance
*/

-- First check if the ogpl table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ogpl' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.ogpl (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      ogpl_number TEXT NOT NULL,
      name TEXT,
      vehicle_id UUID,
      transit_mode TEXT,
      transit_date DATE,
      from_station UUID,
      to_station UUID,
      departure_time TEXT,
      arrival_time TEXT,
      supervisor_name TEXT,
      supervisor_mobile TEXT,
      primary_driver_name TEXT,
      primary_driver_mobile TEXT,
      secondary_driver_name TEXT,
      secondary_driver_mobile TEXT,
      remarks TEXT,
      status TEXT DEFAULT 'created',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'ogpl' 
    AND ccu.table_name = 'vehicles'
    AND ccu.column_name = 'id'
  ) THEN
    ALTER TABLE public.ogpl 
    ADD CONSTRAINT ogpl_vehicle_id_fkey 
    FOREIGN KEY (vehicle_id) 
    REFERENCES public.vehicles(id);
  END IF;
END $$;

-- Create index on vehicle_id for better query performance
CREATE INDEX IF NOT EXISTS idx_ogpl_vehicle_id ON public.ogpl(vehicle_id);

-- Add foreign keys for from_station and to_station
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'ogpl' 
    AND ccu.table_name = 'branches'
    AND tc.constraint_name = 'ogpl_from_station_fkey'
  ) THEN
    ALTER TABLE public.ogpl 
    ADD CONSTRAINT ogpl_from_station_fkey 
    FOREIGN KEY (from_station) 
    REFERENCES public.branches(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'ogpl' 
    AND ccu.table_name = 'branches'
    AND tc.constraint_name = 'ogpl_to_station_fkey'
  ) THEN
    ALTER TABLE public.ogpl 
    ADD CONSTRAINT ogpl_to_station_fkey 
    FOREIGN KEY (to_station) 
    REFERENCES public.branches(id);
  END IF;
END $$;

-- Create indexes for from_station and to_station
CREATE INDEX IF NOT EXISTS idx_ogpl_from_station ON public.ogpl(from_station);
CREATE INDEX IF NOT EXISTS idx_ogpl_to_station ON public.ogpl(to_station);

-- Add comment on the relationship
COMMENT ON CONSTRAINT ogpl_vehicle_id_fkey ON public.ogpl IS 'Relationship between OGPL and vehicles';