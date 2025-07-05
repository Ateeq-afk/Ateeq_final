-- Complete Article Tracking Migration
-- Run this entire script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add tracking fields to inventory_records table to link with bookings
ALTER TABLE inventory_records 
ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'in_warehouse' 
    CHECK (tracking_status IN ('in_warehouse', 'out_for_delivery', 'delivered', 'returned', 'lost', 'damaged'));

-- Create article_tracking table for real-time location tracking
CREATE TABLE IF NOT EXISTS article_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    article_id UUID REFERENCES articles(id),
    
    -- Current location
    current_location_type TEXT NOT NULL CHECK (current_location_type IN ('warehouse', 'vehicle', 'delivered', 'customer')),
    warehouse_id UUID REFERENCES warehouses(id),
    warehouse_location_id UUID REFERENCES warehouse_locations(id),
    vehicle_id UUID REFERENCES vehicles(id),
    
    -- Status and timestamps
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    last_scan_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    
    -- Additional tracking info
    barcode TEXT,
    qr_code TEXT,
    temperature_reading DECIMAL(5, 2),
    humidity_reading DECIMAL(5, 2),
    special_handling_notes TEXT,
    
    -- Chain of custody
    received_by UUID REFERENCES users(id),
    delivered_by UUID REFERENCES users(id),
    signature_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create article_scan_history for maintaining scan history
CREATE TABLE IF NOT EXISTS article_scan_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    article_tracking_id UUID NOT NULL REFERENCES article_tracking(id),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    
    -- Scan details
    scan_type TEXT NOT NULL CHECK (scan_type IN ('check_in', 'check_out', 'transfer', 'delivery', 'return', 'inventory')),
    scan_location_type TEXT NOT NULL CHECK (scan_location_type IN ('warehouse', 'vehicle', 'customer', 'checkpoint')),
    
    -- Location at scan time
    warehouse_id UUID REFERENCES warehouses(id),
    warehouse_location_id UUID REFERENCES warehouse_locations(id),
    vehicle_id UUID REFERENCES vehicles(id),
    
    -- Scan metadata
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scanned_by UUID NOT NULL REFERENCES users(id),
    device_id TEXT,
    gps_coordinates JSONB, -- {"lat": 0.0, "lng": 0.0}
    
    -- Additional info
    notes TEXT,
    photo_url TEXT,
    condition_at_scan TEXT CHECK (condition_at_scan IN ('good', 'damaged', 'wet', 'torn', 'missing_parts')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to automatically create inventory records when articles are unloaded
CREATE OR REPLACE FUNCTION create_inventory_for_unloaded_bookings()
RETURNS TRIGGER AS $$
DECLARE
    v_warehouse_id UUID;
    v_location_id UUID;
BEGIN
    -- Only process when status changes to 'unloaded'
    IF NEW.status = 'unloaded' AND OLD.status != 'unloaded' THEN
        -- Get the destination branch's main warehouse
        SELECT w.id INTO v_warehouse_id
        FROM warehouses w
        WHERE w.branch_id = NEW.to_branch
        AND w.warehouse_type = 'main'
        AND w.status = 'active'
        LIMIT 1;
        
        IF v_warehouse_id IS NOT NULL THEN
            -- Get the receiving location in the warehouse
            SELECT wl.id INTO v_location_id
            FROM warehouse_locations wl
            WHERE wl.warehouse_id = v_warehouse_id
            AND wl.location_code = 'RECEIVING'
            LIMIT 1;
            
            -- Create inventory record for the booking
            INSERT INTO inventory_records (
                warehouse_location_id,
                article_id,
                booking_id,
                item_code,
                quantity,
                status,
                received_date,
                created_by,
                updated_by
            ) VALUES (
                v_location_id,
                NEW.article_id,
                NEW.id,
                NEW.lr_number,
                NEW.quantity,
                'available',
                NOW(),
                NEW.updated_by,
                NEW.updated_by
            ) ON CONFLICT DO NOTHING;
            
            -- Create article tracking record
            INSERT INTO article_tracking (
                booking_id,
                article_id,
                current_location_type,
                warehouse_id,
                warehouse_location_id,
                status,
                barcode,
                created_by,
                updated_by
            ) VALUES (
                NEW.id,
                NEW.article_id,
                'warehouse',
                v_warehouse_id,
                v_location_id,
                'active',
                NEW.lr_number,
                NEW.updated_by,
                NEW.updated_by
            );
            
            -- Log the initial scan
            INSERT INTO article_scan_history (
                article_tracking_id,
                booking_id,
                scan_type,
                scan_location_type,
                warehouse_id,
                warehouse_location_id,
                scanned_by,
                notes
            ) VALUES (
                (SELECT id FROM article_tracking WHERE booking_id = NEW.id LIMIT 1),
                NEW.id,
                'check_in',
                'warehouse',
                v_warehouse_id,
                v_location_id,
                NEW.updated_by,
                'Article unloaded from vehicle and checked into warehouse'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic inventory creation
DROP TRIGGER IF EXISTS create_inventory_on_unload ON bookings;
CREATE TRIGGER create_inventory_on_unload
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_inventory_for_unloaded_bookings();

-- Create a function to update article location when moved within warehouse
CREATE OR REPLACE FUNCTION update_article_tracking_on_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update article tracking when inventory is moved
    IF NEW.booking_id IS NOT NULL THEN
        UPDATE article_tracking
        SET 
            warehouse_location_id = NEW.to_location_id,
            last_scan_time = NOW(),
            updated_at = NOW(),
            updated_by = NEW.created_by
        WHERE booking_id = NEW.booking_id
        AND current_location_type = 'warehouse';
        
        -- Log the movement in scan history
        INSERT INTO article_scan_history (
            article_tracking_id,
            booking_id,
            scan_type,
            scan_location_type,
            warehouse_id,
            warehouse_location_id,
            scanned_by,
            notes
        ) VALUES (
            (SELECT id FROM article_tracking WHERE booking_id = NEW.booking_id LIMIT 1),
            NEW.booking_id,
            'transfer',
            'warehouse',
            (SELECT warehouse_id FROM warehouse_locations WHERE id = NEW.to_location_id),
            NEW.to_location_id,
            NEW.created_by,
            'Article moved within warehouse'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tracking movements
DROP TRIGGER IF EXISTS track_article_movements ON inventory_movements;
CREATE TRIGGER track_article_movements
    AFTER INSERT ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_article_tracking_on_movement();

-- Create view for easy article location lookup
CREATE OR REPLACE VIEW article_current_locations AS
SELECT 
    b.id as booking_id,
    b.lr_number,
    b.article_id,
    a.name as article_name,
    a.description as article_description,
    b.quantity,
    at.current_location_type,
    w.name as warehouse_name,
    wl.name as location_name,
    wl.location_code,
    at.last_scan_time,
    at.status as tracking_status,
    at.barcode,
    b.from_branch,
    b.to_branch,
    b.status as booking_status,
    c.name as customer_name,
    c.mobile as customer_mobile,
    c.email as customer_email
FROM bookings b
LEFT JOIN articles a ON b.article_id = a.id
LEFT JOIN customers c ON b.receiver_id = c.id
LEFT JOIN article_tracking at ON b.id = at.booking_id
LEFT JOIN warehouses w ON at.warehouse_id = w.id
LEFT JOIN warehouse_locations wl ON at.warehouse_location_id = wl.id
WHERE at.status = 'active';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_records_booking ON inventory_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_article_tracking_booking ON article_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_article_tracking_location ON article_tracking(warehouse_id, warehouse_location_id);
CREATE INDEX IF NOT EXISTS idx_article_scan_history_booking ON article_scan_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_article_scan_history_time ON article_scan_history(scan_time);

-- Add RLS policies
ALTER TABLE article_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_scan_history ENABLE ROW LEVEL SECURITY;

-- Policy for viewing article tracking (users can see articles in their organization)
CREATE POLICY "Users can view article tracking in their organization"
    ON article_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN branches br ON b.to_branch = br.id
            WHERE b.id = article_tracking.booking_id
            AND br.organization_id IN (
                SELECT organization_id FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Policy for updating article tracking (only authorized users)
CREATE POLICY "Authorized users can update article tracking"
    ON article_tracking FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN branches br ON b.to_branch = br.id
            WHERE b.id = article_tracking.booking_id
            AND br.organization_id IN (
                SELECT organization_id FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Similar policies for article_scan_history
CREATE POLICY "Users can view scan history in their organization"
    ON article_scan_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM article_tracking at
            JOIN bookings b ON at.booking_id = b.id
            JOIN branches br ON b.to_branch = br.id
            WHERE at.id = article_scan_history.article_tracking_id
            AND br.organization_id IN (
                SELECT organization_id FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON article_tracking TO authenticated;
GRANT SELECT, INSERT ON article_scan_history TO authenticated;
GRANT SELECT ON article_current_locations TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Article tracking migration completed successfully!';
END $$;