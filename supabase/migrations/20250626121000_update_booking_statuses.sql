/*
  # Update Booking Status Constraint
  - Allow new statuses: 'unloaded', 'out_for_delivery', 'pod_received'
  - Remove old 'warehouse' status
*/

-- Drop existing status check constraint if present
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

-- Add new constraint with additional statuses
ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (
  status IN (
    'booked',
    'in_transit',
    'unloaded',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'pod_received'
  )
);
