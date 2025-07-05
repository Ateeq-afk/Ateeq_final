-- Fix POD Migration V3 - Fixed syntax errors

-- First, check what columns exist in pod_records if the table exists
DO $$
DECLARE
    table_exists boolean;
    has_branch_id boolean;
    has_organization_id boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pod_records'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check for branch_id column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'pod_records' AND column_name = 'branch_id'
        ) INTO has_branch_id;
        
        -- Check for organization_id column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'pod_records' AND column_name = 'organization_id'
        ) INTO has_organization_id;
        
        -- Add missing columns
        IF NOT has_branch_id THEN
            ALTER TABLE pod_records ADD COLUMN branch_id UUID REFERENCES branches(id);
            RAISE NOTICE 'Added branch_id column to pod_records';
            
            -- Try to populate branch_id from bookings
            UPDATE pod_records pr
            SET branch_id = b.to_branch
            FROM bookings b
            WHERE pr.booking_id = b.id
            AND pr.branch_id IS NULL;
            
            -- Make it NOT NULL if we have data
            IF NOT EXISTS (SELECT 1 FROM pod_records WHERE branch_id IS NULL) THEN
                ALTER TABLE pod_records ALTER COLUMN branch_id SET NOT NULL;
            END IF;
        END IF;
        
        IF NOT has_organization_id THEN
            ALTER TABLE pod_records ADD COLUMN organization_id UUID REFERENCES organizations(id);
            RAISE NOTICE 'Added organization_id column to pod_records';
            
            -- Try to populate organization_id from bookings
            UPDATE pod_records pr
            SET organization_id = b.organization_id
            FROM bookings b
            WHERE pr.booking_id = b.id
            AND pr.organization_id IS NULL;
            
            -- Make it NOT NULL if we have data
            IF NOT EXISTS (SELECT 1 FROM pod_records WHERE organization_id IS NULL) THEN
                ALTER TABLE pod_records ALTER COLUMN organization_id SET NOT NULL;
            END IF;
        END IF;
        
        RAISE NOTICE 'pod_records table already exists - checked and added missing columns';
    ELSE
        -- Create the table with all columns
        CREATE TABLE pod_records (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            branch_id UUID NOT NULL REFERENCES branches(id),
            organization_id UUID NOT NULL REFERENCES organizations(id),
            
            -- Delivery information
            delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            delivered_by TEXT NOT NULL,
            delivery_latitude DECIMAL(10, 8),
            delivery_longitude DECIMAL(11, 8),
            
            -- Receiver information
            receiver_name TEXT NOT NULL,
            receiver_phone TEXT NOT NULL,
            receiver_designation TEXT,
            receiver_company TEXT,
            receiver_id_type TEXT,
            receiver_id_number TEXT,
            
            -- Evidence
            signature_image_url TEXT,
            photo_evidence_url TEXT,
            receiver_photo_url TEXT,
            
            -- Additional information
            delivery_condition TEXT,
            damage_description TEXT,
            shortage_description TEXT,
            remarks TEXT,
            
            -- Metadata
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id),
            
            -- Constraints
            UNIQUE(booking_id)
        );
        RAISE NOTICE 'Created pod_records table';
    END IF;
END $$;

-- Add any other missing columns to pod_records
DO $$
BEGIN
    -- List of all expected columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'delivered_at') THEN
        ALTER TABLE pod_records ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'delivered_by') THEN
        ALTER TABLE pod_records ADD COLUMN delivered_by TEXT;
        UPDATE pod_records SET delivered_by = 'Unknown' WHERE delivered_by IS NULL;
        ALTER TABLE pod_records ALTER COLUMN delivered_by SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'delivery_latitude') THEN
        ALTER TABLE pod_records ADD COLUMN delivery_latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'delivery_longitude') THEN
        ALTER TABLE pod_records ADD COLUMN delivery_longitude DECIMAL(11, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'signature_image_url') THEN
        ALTER TABLE pod_records ADD COLUMN signature_image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'photo_evidence_url') THEN
        ALTER TABLE pod_records ADD COLUMN photo_evidence_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'receiver_photo_url') THEN
        ALTER TABLE pod_records ADD COLUMN receiver_photo_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'delivery_condition') THEN
        ALTER TABLE pod_records ADD COLUMN delivery_condition TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'damage_description') THEN
        ALTER TABLE pod_records ADD COLUMN damage_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'shortage_description') THEN
        ALTER TABLE pod_records ADD COLUMN shortage_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'remarks') THEN
        ALTER TABLE pod_records ADD COLUMN remarks TEXT;
    END IF;
END $$;

-- Create indexes only if they don't exist and if the columns exist
DO $$
BEGIN
    -- Only create index if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'booking_id') 
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pod_records_booking_id') THEN
        CREATE INDEX idx_pod_records_booking_id ON pod_records(booking_id);
        RAISE NOTICE 'Created idx_pod_records_booking_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'branch_id')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pod_records_branch_id') THEN
        CREATE INDEX idx_pod_records_branch_id ON pod_records(branch_id);
        RAISE NOTICE 'Created idx_pod_records_branch_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'delivered_at')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pod_records_delivered_at') THEN
        CREATE INDEX idx_pod_records_delivered_at ON pod_records(delivered_at);
        RAISE NOTICE 'Created idx_pod_records_delivered_at';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'receiver_phone')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pod_records_receiver_phone') THEN
        CREATE INDEX idx_pod_records_receiver_phone ON pod_records(receiver_phone);
        RAISE NOTICE 'Created idx_pod_records_receiver_phone';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'organization_id')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pod_records_organization_id') THEN
        CREATE INDEX idx_pod_records_organization_id ON pod_records(organization_id);
        RAISE NOTICE 'Created idx_pod_records_organization_id';
    END IF;
END $$;

-- Add POD-related columns to bookings table if not exists
DO $$
BEGIN
    -- pod_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'pod_status') THEN
        ALTER TABLE bookings ADD COLUMN pod_status TEXT DEFAULT 'pending' 
        CHECK (pod_status IN ('pending', 'in_progress', 'completed', 'rejected'));
        RAISE NOTICE 'Added pod_status to bookings';
    END IF;
    
    -- pod_record_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'pod_record_id') THEN
        ALTER TABLE bookings ADD COLUMN pod_record_id UUID REFERENCES pod_records(id);
        RAISE NOTICE 'Added pod_record_id to bookings';
    END IF;
    
    -- delivery_attempted_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'delivery_attempted_at') THEN
        ALTER TABLE bookings ADD COLUMN delivery_attempted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added delivery_attempted_at to bookings';
    END IF;
    
    -- pod_required column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'pod_required') THEN
        ALTER TABLE bookings ADD COLUMN pod_required BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added pod_required to bookings';
    END IF;
END $$;

-- Create POD attempts table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pod_attempts') THEN
        CREATE TABLE pod_attempts (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            branch_id UUID REFERENCES branches(id),
            organization_id UUID REFERENCES organizations(id),
            
            -- Attempt information
            attempt_number INTEGER NOT NULL DEFAULT 1,
            attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            attempted_by TEXT NOT NULL,
            
            -- Result
            status TEXT NOT NULL CHECK (status IN ('failed', 'rescheduled', 'customer_refused', 'address_not_found', 'customer_not_available')),
            reason TEXT NOT NULL,
            
            -- Next attempt
            next_attempt_date DATE,
            
            -- Evidence
            photo_url TEXT,
            
            -- Metadata
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id)
        );
        
        CREATE INDEX idx_pod_attempts_booking_id ON pod_attempts(booking_id);
        CREATE INDEX idx_pod_attempts_attempted_at ON pod_attempts(attempted_at);
        RAISE NOTICE 'Created pod_attempts table';
    END IF;
END $$;

-- Create POD templates table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pod_templates') THEN
        CREATE TABLE pod_templates (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            branch_id UUID REFERENCES branches(id),
            organization_id UUID REFERENCES organizations(id),
            
            -- Template information
            name TEXT NOT NULL,
            description TEXT,
            
            -- Requirements
            require_signature BOOLEAN DEFAULT true,
            require_photo BOOLEAN DEFAULT true,
            require_receiver_photo BOOLEAN DEFAULT false,
            require_id_proof BOOLEAN DEFAULT false,
            allowed_id_types TEXT[],
            
            -- Custom fields
            custom_fields JSONB DEFAULT '[]',
            
            -- Status
            is_active BOOLEAN DEFAULT true,
            is_default BOOLEAN DEFAULT false,
            
            -- Metadata
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id)
        );
        
        CREATE INDEX idx_pod_templates_branch_id ON pod_templates(branch_id);
        RAISE NOTICE 'Created pod_templates table';
    END IF;
END $$;

-- Create a partial unique index for default templates per branch
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pod_templates')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_templates' AND column_name = 'branch_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_templates' AND column_name = 'is_default')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pod_templates_unique_default_per_branch') THEN
        CREATE UNIQUE INDEX idx_pod_templates_unique_default_per_branch 
        ON pod_templates(branch_id) 
        WHERE is_default = true;
        RAISE NOTICE 'Created unique index for default templates per branch';
    END IF;
END $$;

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to pod_records if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pod_records_updated_at') THEN
        CREATE TRIGGER update_pod_records_updated_at 
        BEFORE UPDATE ON pod_records 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for pod_records';
    END IF;
END $$;

-- Apply trigger to pod_templates if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pod_templates_updated_at') THEN
        CREATE TRIGGER update_pod_templates_updated_at 
        BEFORE UPDATE ON pod_templates 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for pod_templates';
    END IF;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE pod_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with checks)
DO $$
BEGIN
    -- Check if organization_id column exists before creating policy
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_records' AND column_name = 'organization_id')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pod_records_org_isolation' AND tablename = 'pod_records') THEN
        CREATE POLICY pod_records_org_isolation ON pod_records
        FOR ALL
        USING (
            organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
            OR 
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
        );
        RAISE NOTICE 'Created pod_records_org_isolation policy';
    END IF;
    
    -- POD Attempts policy
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_attempts' AND column_name = 'organization_id')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pod_attempts_org_isolation' AND tablename = 'pod_attempts') THEN
        CREATE POLICY pod_attempts_org_isolation ON pod_attempts
        FOR ALL
        USING (
            organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
            OR 
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
        );
        RAISE NOTICE 'Created pod_attempts_org_isolation policy';
    END IF;
    
    -- POD Templates policy
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pod_templates' AND column_name = 'organization_id')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pod_templates_org_isolation' AND tablename = 'pod_templates') THEN
        CREATE POLICY pod_templates_org_isolation ON pod_templates
        FOR ALL
        USING (
            organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
            OR 
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
        );
        RAISE NOTICE 'Created pod_templates_org_isolation policy';
    END IF;
END $$;

-- Update booking status when POD is completed
CREATE OR REPLACE FUNCTION update_booking_on_pod_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_condition IS NOT NULL THEN
        UPDATE bookings 
        SET 
            status = 'delivered',
            pod_status = 'completed',
            pod_record_id = NEW.id,
            delivered_at = NEW.delivered_at
        WHERE id = NEW.booking_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_booking_on_pod') THEN
        CREATE TRIGGER trigger_update_booking_on_pod
        AFTER INSERT ON pod_records
        FOR EACH ROW
        EXECUTE FUNCTION update_booking_on_pod_completion();
        RAISE NOTICE 'Created trigger_update_booking_on_pod';
    END IF;
END $$;

-- Grant permissions (safe to run multiple times)
GRANT ALL ON pod_records TO authenticated;
GRANT ALL ON pod_attempts TO authenticated;
GRANT ALL ON pod_templates TO authenticated;

-- Summary
DO $$
DECLARE
    missing_count integer := 0;
    msg text := '';
BEGIN
    -- Check critical components
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pod_records') THEN
        missing_count := missing_count + 1;
        msg := msg || 'pod_records table, ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'pod_status') THEN
        missing_count := missing_count + 1;
        msg := msg || 'bookings.pod_status column, ';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== POD Migration Fix V3 Completed ===';
    
    IF missing_count = 0 THEN
        RAISE NOTICE 'All POD components are now in place!';
    ELSE
        RAISE NOTICE 'Some components could not be created: %', rtrim(msg, ', ');
        RAISE NOTICE 'Please check error messages above.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run check-pod-migration-status.sql to verify';
    RAISE NOTICE '2. Test POD functionality with test-booking-lifecycle-complete.cjs';
END $$;