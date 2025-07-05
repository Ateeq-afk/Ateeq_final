-- Create POD (Proof of Delivery) records table
CREATE TABLE IF NOT EXISTS pod_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    
    -- Delivery information
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_by TEXT NOT NULL, -- Driver/delivery person name
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    
    -- Receiver information
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    receiver_designation TEXT,
    receiver_company TEXT,
    receiver_id_type TEXT, -- e.g., 'Aadhaar', 'PAN', 'Driving License'
    receiver_id_number TEXT,
    
    -- Evidence
    signature_image_url TEXT,
    photo_evidence_url TEXT,
    receiver_photo_url TEXT,
    
    -- Additional information
    delivery_condition TEXT, -- 'good', 'damaged', 'partial'
    damage_description TEXT,
    shortage_description TEXT,
    remarks TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(booking_id) -- One POD per booking
);

-- Create indexes for better performance
CREATE INDEX idx_pod_records_booking_id ON pod_records(booking_id);
CREATE INDEX idx_pod_records_branch_id ON pod_records(branch_id);
CREATE INDEX idx_pod_records_delivered_at ON pod_records(delivered_at);
CREATE INDEX idx_pod_records_receiver_phone ON pod_records(receiver_phone);

-- Add POD-related columns to bookings table if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS pod_status TEXT DEFAULT 'pending' CHECK (pod_status IN ('pending', 'in_progress', 'completed', 'rejected')),
ADD COLUMN IF NOT EXISTS pod_record_id UUID REFERENCES pod_records(id),
ADD COLUMN IF NOT EXISTS delivery_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pod_required BOOLEAN DEFAULT TRUE;

-- Create POD attempts table for tracking delivery attempts
CREATE TABLE IF NOT EXISTS pod_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attempted_by TEXT NOT NULL,
    reason_for_failure TEXT,
    next_attempt_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(booking_id, attempt_number)
);

-- Create POD templates for standardized delivery instructions
CREATE TABLE IF NOT EXISTS pod_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID REFERENCES branches(id),
    template_name TEXT NOT NULL,
    delivery_instructions TEXT,
    required_documents TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update booking status when POD is completed
CREATE OR REPLACE FUNCTION update_booking_on_pod_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- When a POD record is created, update the booking
    UPDATE bookings 
    SET 
        pod_status = 'completed',
        pod_record_id = NEW.id,
        status = 'delivered',
        delivery_date = DATE(NEW.delivered_at),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.booking_id;
    
    -- Create an event log entry
    INSERT INTO logistics_events (
        event_type,
        booking_id,
        branch_id,
        description,
        metadata
    ) VALUES (
        'pod_completed',
        NEW.booking_id,
        NEW.branch_id,
        'Proof of delivery captured',
        jsonb_build_object(
            'receiver_name', NEW.receiver_name,
            'receiver_phone', NEW.receiver_phone,
            'delivered_by', NEW.delivered_by,
            'has_signature', NEW.signature_image_url IS NOT NULL,
            'has_photo', NEW.photo_evidence_url IS NOT NULL
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update booking when POD is completed
CREATE TRIGGER trigger_update_booking_on_pod
AFTER INSERT ON pod_records
FOR EACH ROW
EXECUTE FUNCTION update_booking_on_pod_complete();

-- Create function to prevent marking as delivered without POD
CREATE OR REPLACE FUNCTION prevent_delivery_without_pod()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if status is being changed to 'delivered'
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Check if POD is required and not completed
        IF NEW.pod_required = TRUE AND (NEW.pod_status IS NULL OR NEW.pod_status != 'completed') THEN
            RAISE EXCEPTION 'Cannot mark booking as delivered without completing POD process';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce POD before delivery
CREATE TRIGGER trigger_enforce_pod_before_delivery
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION prevent_delivery_without_pod();

-- RLS Policies for POD tables
ALTER TABLE pod_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_templates ENABLE ROW LEVEL SECURITY;

-- POD Records policies
CREATE POLICY "Users can view POD records for their branch" ON pod_records
    FOR SELECT USING (branch_id IN (
        SELECT branch_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create POD records for their branch" ON pod_records
    FOR INSERT WITH CHECK (branch_id IN (
        SELECT branch_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update POD records for their branch" ON pod_records
    FOR UPDATE USING (branch_id IN (
        SELECT branch_id FROM users WHERE id = auth.uid()
    ));

-- POD Attempts policies
CREATE POLICY "Users can view POD attempts for their branch bookings" ON pod_attempts
    FOR SELECT USING (booking_id IN (
        SELECT id FROM bookings WHERE to_branch IN (
            SELECT branch_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can create POD attempts for their branch bookings" ON pod_attempts
    FOR INSERT WITH CHECK (booking_id IN (
        SELECT id FROM bookings WHERE to_branch IN (
            SELECT branch_id FROM users WHERE id = auth.uid()
        )
    ));

-- POD Templates policies
CREATE POLICY "Users can view POD templates for their branch" ON pod_templates
    FOR SELECT USING (
        branch_id IS NULL OR 
        branch_id IN (SELECT branch_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage POD templates" ON pod_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_pod_records_updated_at BEFORE UPDATE ON pod_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pod_templates_updated_at BEFORE UPDATE ON pod_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();