-- Migration: LR Number Uniqueness Validation and Atomic Reservation
-- Created: 2025-07-06
-- Purpose: Implement robust LR number generation with atomic reservation

-- 1. Add unique constraint on LR numbers (if not already exists)
DO $$ 
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_lr_number_unique'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_lr_number_unique UNIQUE (lr_number);
    END IF;
END $$;

-- 2. Create LR number reservation table for atomic operations
CREATE TABLE IF NOT EXISTS lr_number_reservations (
    id SERIAL PRIMARY KEY,
    lr_number TEXT UNIQUE NOT NULL,
    branch_id UUID NOT NULL,
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    booking_id UUID NULL -- Will be filled when booking is created
);

-- Add RLS policy for lr_number_reservations
ALTER TABLE lr_number_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see reservations for their branch
CREATE POLICY lr_reservations_branch_access ON lr_number_reservations
    FOR ALL USING (
        branch_id IN (
            SELECT b.id FROM branches b
            WHERE b.organization_id = (
                SELECT organization_id FROM user_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- 3. Atomic LR number reservation function
CREATE OR REPLACE FUNCTION reserve_lr_number(
    lr_number TEXT,
    branch_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_booking BOOLEAN;
    existing_reservation BOOLEAN;
BEGIN
    -- Check if LR number already exists in bookings
    SELECT EXISTS(
        SELECT 1 FROM bookings 
        WHERE bookings.lr_number = reserve_lr_number.lr_number
    ) INTO existing_booking;
    
    IF existing_booking THEN
        RETURN FALSE;
    END IF;
    
    -- Check if LR number is already reserved and not expired
    SELECT EXISTS(
        SELECT 1 FROM lr_number_reservations 
        WHERE lr_number_reservations.lr_number = reserve_lr_number.lr_number
        AND expires_at > NOW()
    ) INTO existing_reservation;
    
    IF existing_reservation THEN
        RETURN FALSE;
    END IF;
    
    -- Clean up expired reservations
    DELETE FROM lr_number_reservations 
    WHERE expires_at <= NOW();
    
    -- Try to insert reservation
    BEGIN
        INSERT INTO lr_number_reservations (lr_number, branch_id)
        VALUES (reserve_lr_number.lr_number, reserve_lr_number.branch_id);
        
        RETURN TRUE;
    EXCEPTION WHEN unique_violation THEN
        RETURN FALSE;
    END;
END;
$$;

-- 4. Function to validate manual LR numbers
CREATE OR REPLACE FUNCTION validate_manual_lr_number(
    lr_number TEXT,
    branch_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    existing_count INTEGER;
    branch_has_access BOOLEAN;
BEGIN
    -- Check if user has access to this branch
    SELECT EXISTS(
        SELECT 1 FROM branches b
        WHERE b.id = validate_manual_lr_number.branch_id
        AND b.organization_id = (
            SELECT organization_id FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    ) INTO branch_has_access;
    
    IF NOT branch_has_access THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'ACCESS_DENIED',
            'message', 'No access to specified branch'
        );
    END IF;
    
    -- Check format (basic validation)
    IF lr_number !~ '^[A-Z0-9\-]+$' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'INVALID_FORMAT',
            'message', 'LR number must contain only letters, numbers, and hyphens'
        );
    END IF;
    
    -- Check length
    IF LENGTH(lr_number) < 5 OR LENGTH(lr_number) > 50 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'INVALID_LENGTH',
            'message', 'LR number must be between 5 and 50 characters'
        );
    END IF;
    
    -- Check uniqueness across all organizations
    SELECT COUNT(*) FROM bookings 
    WHERE bookings.lr_number = validate_manual_lr_number.lr_number
    INTO existing_count;
    
    IF existing_count > 0 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'ALREADY_EXISTS',
            'message', 'This LR number is already in use'
        );
    END IF;
    
    -- Check against reserved numbers
    SELECT COUNT(*) FROM lr_number_reservations 
    WHERE lr_number_reservations.lr_number = validate_manual_lr_number.lr_number
    AND expires_at > NOW()
    INTO existing_count;
    
    IF existing_count > 0 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'RESERVED',
            'message', 'This LR number is currently reserved'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'valid', true,
        'message', 'LR number is available'
    );
END;
$$;

-- 5. Function to clean up expired reservations (for scheduled cleanup)
CREATE OR REPLACE FUNCTION cleanup_expired_lr_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM lr_number_reservations 
    WHERE expires_at <= NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lr_reservations_lr_number ON lr_number_reservations(lr_number);
CREATE INDEX IF NOT EXISTS idx_lr_reservations_expires_at ON lr_number_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_lr_reservations_branch_id ON lr_number_reservations(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lr_number ON bookings(lr_number) WHERE lr_number IS NOT NULL;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_lr_number(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_manual_lr_number(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_lr_reservations() TO authenticated;

-- Note: In production, you might want to run cleanup_expired_lr_reservations() 
-- periodically using a cron job or scheduled function