-- Add additional vehicle columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'capacity'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN capacity TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'color'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN color TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fuel_type'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN fuel_type TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'registration_date'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN registration_date DATE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'insurance_expiry'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN insurance_expiry DATE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fitness_expiry'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN fitness_expiry DATE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'permit_expiry'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN permit_expiry DATE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN notes TEXT;
  END IF;
END $$;
