-- Enhanced Article Tracking System Migration - Manual Execution
-- Execute this script in Supabase SQL Editor

-- =============================================
-- 1. Enhanced Article Tracking Tables
-- =============================================

-- Enhanced article tracking with GPS and scanning support
CREATE TABLE IF NOT EXISTS article_tracking_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    article_id UUID REFERENCES booking_articles(id) ON DELETE SET NULL,
    barcode VARCHAR(255),
    qr_code VARCHAR(255),
    
    -- Location tracking
    current_location_type VARCHAR(50) NOT NULL DEFAULT 'warehouse',
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    warehouse_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- GPS coordinates
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    gps_accuracy DECIMAL(8, 2), -- in meters
    last_gps_update TIMESTAMPTZ,
    
    -- Status and tracking
    status VARCHAR(50) NOT NULL DEFAULT 'in_warehouse',
    last_scan_time TIMESTAMPTZ DEFAULT NOW(),
    last_scan_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Branch scoping for multi-tenancy
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- =============================================
-- 2. Article Scan History
-- =============================================

CREATE TABLE IF NOT EXISTS article_scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    article_tracking_id UUID REFERENCES article_tracking_enhanced(id) ON DELETE CASCADE,
    
    -- Scan details
    scan_type VARCHAR(50) NOT NULL, -- check_in, check_out, transfer, delivery, return, inventory
    scan_location_type VARCHAR(50) NOT NULL DEFAULT 'warehouse',
    barcode_scanned VARCHAR(255),
    
    -- Location at scan time
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    warehouse_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- GPS data at scan time
    scan_latitude DECIMAL(10, 8),
    scan_longitude DECIMAL(11, 8),
    gps_accuracy DECIMAL(8, 2),
    
    -- Scan metadata
    scan_time TIMESTAMPTZ DEFAULT NOW(),
    scanned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    condition_at_scan VARCHAR(50) DEFAULT 'good', -- good, damaged, wet, torn, missing_parts
    
    -- Images/attachments
    scan_images JSONB DEFAULT '[]'::jsonb,
    
    -- Device/session info
    device_info JSONB DEFAULT '{}'::jsonb,
    scan_session_id VARCHAR(255),
    
    -- Branch scoping
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- =============================================
-- 3. GPS Tracking Sessions
-- =============================================

CREATE TABLE IF NOT EXISTS gps_tracking_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Tracking entity
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Route summary
    total_distance_km DECIMAL(10, 3) DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    waypoints_count INTEGER DEFAULT 0,
    
    -- Session metadata
    session_type VARCHAR(50) DEFAULT 'delivery', -- delivery, pickup, transfer, patrol
    purpose TEXT,
    notes TEXT,
    
    -- Branch scoping
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. GPS Location Points
-- =============================================

CREATE TABLE IF NOT EXISTS gps_location_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_session_id UUID NOT NULL REFERENCES gps_tracking_sessions(id) ON DELETE CASCADE,
    
    -- GPS coordinates
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2), -- in meters
    altitude DECIMAL(10, 3), -- in meters
    speed_kmh DECIMAL(8, 3), -- speed in km/h
    heading DECIMAL(6, 2), -- compass direction in degrees
    
    -- Timestamp
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    device_timestamp TIMESTAMPTZ,
    
    -- Location context
    address TEXT,
    landmark TEXT,
    location_type VARCHAR(50), -- warehouse, customer, route, fuel_station, etc.
    
    -- Device info
    device_info JSONB DEFAULT '{}'::jsonb,
    battery_level INTEGER, -- percentage
    signal_strength INTEGER, -- percentage
    
    -- Branch scoping
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- =============================================
-- 5. Bulk Operations
-- =============================================

CREATE TABLE IF NOT EXISTS bulk_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Operation details
    operation_type VARCHAR(50) NOT NULL, -- bulk_scan, bulk_transfer, bulk_status_update, bulk_export
    operation_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Execution details
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, cancelled
    progress_percentage INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    successful_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    
    -- Operation data
    operation_data JSONB DEFAULT '{}'::jsonb, -- scan type, location, conditions, etc.
    input_data JSONB DEFAULT '{}'::jsonb, -- barcodes, filters, etc.
    result_data JSONB DEFAULT '{}'::jsonb, -- results, errors, etc.
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- User and context
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Branch scoping
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- =============================================
-- 6. Bulk Operation Items
-- =============================================

CREATE TABLE IF NOT EXISTS bulk_operation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_operation_id UUID NOT NULL REFERENCES bulk_operations(id) ON DELETE CASCADE,
    
    -- Item identification
    item_sequence INTEGER NOT NULL,
    barcode VARCHAR(255),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    article_id UUID REFERENCES booking_articles(id) ON DELETE SET NULL,
    
    -- Processing details
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, skipped
    error_message TEXT,
    processing_start TIMESTAMPTZ,
    processing_end TIMESTAMPTZ,
    
    -- Operation specific data
    item_data JSONB DEFAULT '{}'::jsonb,
    result_data JSONB DEFAULT '{}'::jsonb,
    
    -- Branch scoping
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- =============================================
-- 7. Article Movement Analytics
-- =============================================

CREATE TABLE IF NOT EXISTS article_movement_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time period
    analysis_date DATE NOT NULL,
    analysis_period VARCHAR(20) NOT NULL DEFAULT 'daily', -- hourly, daily, weekly, monthly
    
    -- Location analysis
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    warehouse_location_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    location_code VARCHAR(50),
    
    -- Movement metrics
    total_articles INTEGER DEFAULT 0,
    articles_received INTEGER DEFAULT 0,
    articles_dispatched INTEGER DEFAULT 0,
    articles_transferred INTEGER DEFAULT 0,
    articles_returned INTEGER DEFAULT 0,
    
    -- Time metrics (in minutes)
    avg_dwell_time INTEGER DEFAULT 0,
    min_dwell_time INTEGER DEFAULT 0,
    max_dwell_time INTEGER DEFAULT 0,
    avg_processing_time INTEGER DEFAULT 0,
    
    -- Efficiency metrics
    throughput_per_hour DECIMAL(8, 2) DEFAULT 0,
    utilization_percentage DECIMAL(5, 2) DEFAULT 0,
    efficiency_score DECIMAL(5, 2) DEFAULT 0,
    
    -- Quality metrics
    damage_incidents INTEGER DEFAULT 0,
    missing_incidents INTEGER DEFAULT 0,
    delay_incidents INTEGER DEFAULT 0,
    
    -- Peak hours analysis
    peak_hour INTEGER, -- hour of day (0-23)
    peak_hour_volume INTEGER DEFAULT 0,
    
    -- Movement patterns (JSON)
    inbound_patterns JSONB DEFAULT '[]'::jsonb,
    outbound_patterns JSONB DEFAULT '[]'::jsonb,
    bottlenecks JSONB DEFAULT '[]'::jsonb,
    anomalies JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_version VARCHAR(10) DEFAULT '1.0',
    
    -- Branch scoping
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE(analysis_date, analysis_period, warehouse_id, warehouse_location_id, branch_id)
);

-- =============================================
-- 8. Indexes for Performance
-- =============================================

-- Article tracking indexes
CREATE INDEX IF NOT EXISTS idx_article_tracking_enhanced_booking_id ON article_tracking_enhanced(booking_id);
CREATE INDEX IF NOT EXISTS idx_article_tracking_enhanced_barcode ON article_tracking_enhanced(barcode);
CREATE INDEX IF NOT EXISTS idx_article_tracking_enhanced_status ON article_tracking_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_article_tracking_enhanced_branch_id ON article_tracking_enhanced(branch_id);
CREATE INDEX IF NOT EXISTS idx_article_tracking_enhanced_warehouse_id ON article_tracking_enhanced(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_article_tracking_enhanced_gps ON article_tracking_enhanced(current_latitude, current_longitude);

-- Scan history indexes
CREATE INDEX IF NOT EXISTS idx_article_scan_history_booking_id ON article_scan_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_article_scan_history_scan_time ON article_scan_history(scan_time);
CREATE INDEX IF NOT EXISTS idx_article_scan_history_scan_type ON article_scan_history(scan_type);
CREATE INDEX IF NOT EXISTS idx_article_scan_history_branch_id ON article_scan_history(branch_id);
CREATE INDEX IF NOT EXISTS idx_article_scan_history_barcode ON article_scan_history(barcode_scanned);

-- GPS tracking indexes
CREATE INDEX IF NOT EXISTS idx_gps_tracking_sessions_vehicle_id ON gps_tracking_sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_sessions_user_id ON gps_tracking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_sessions_active ON gps_tracking_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_sessions_branch_id ON gps_tracking_sessions(branch_id);

CREATE INDEX IF NOT EXISTS idx_gps_location_points_session_id ON gps_location_points(tracking_session_id);
CREATE INDEX IF NOT EXISTS idx_gps_location_points_recorded_at ON gps_location_points(recorded_at);
CREATE INDEX IF NOT EXISTS idx_gps_location_points_coordinates ON gps_location_points(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_gps_location_points_branch_id ON gps_location_points(branch_id);

-- Bulk operations indexes
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_by ON bulk_operations(created_by);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_branch_id ON bulk_operations(branch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at ON bulk_operations(created_at);

CREATE INDEX IF NOT EXISTS idx_bulk_operation_items_operation_id ON bulk_operation_items(bulk_operation_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_items_barcode ON bulk_operation_items(barcode);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_items_status ON bulk_operation_items(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_article_movement_analytics_date ON article_movement_analytics(analysis_date);
CREATE INDEX IF NOT EXISTS idx_article_movement_analytics_warehouse ON article_movement_analytics(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_article_movement_analytics_branch_id ON article_movement_analytics(branch_id);

-- =============================================
-- 9. Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE article_tracking_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_location_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_movement_analytics ENABLE ROW LEVEL SECURITY;

-- Article tracking enhanced policies
DROP POLICY IF EXISTS "article_tracking_enhanced_select_policy" ON article_tracking_enhanced;
CREATE POLICY "article_tracking_enhanced_select_policy" ON article_tracking_enhanced
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "article_tracking_enhanced_insert_policy" ON article_tracking_enhanced;
CREATE POLICY "article_tracking_enhanced_insert_policy" ON article_tracking_enhanced
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "article_tracking_enhanced_update_policy" ON article_tracking_enhanced;
CREATE POLICY "article_tracking_enhanced_update_policy" ON article_tracking_enhanced
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

-- Scan history policies
DROP POLICY IF EXISTS "article_scan_history_select_policy" ON article_scan_history;
CREATE POLICY "article_scan_history_select_policy" ON article_scan_history
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "article_scan_history_insert_policy" ON article_scan_history;
CREATE POLICY "article_scan_history_insert_policy" ON article_scan_history
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

-- GPS tracking policies
DROP POLICY IF EXISTS "gps_tracking_sessions_policy" ON gps_tracking_sessions;
CREATE POLICY "gps_tracking_sessions_policy" ON gps_tracking_sessions
    FOR ALL USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "gps_location_points_policy" ON gps_location_points;
CREATE POLICY "gps_location_points_policy" ON gps_location_points
    FOR ALL USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

-- Bulk operations policies
DROP POLICY IF EXISTS "bulk_operations_policy" ON bulk_operations;
CREATE POLICY "bulk_operations_policy" ON bulk_operations
    FOR ALL USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "bulk_operation_items_policy" ON bulk_operation_items;
CREATE POLICY "bulk_operation_items_policy" ON bulk_operation_items
    FOR ALL USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

-- Analytics policies
DROP POLICY IF EXISTS "article_movement_analytics_policy" ON article_movement_analytics;
CREATE POLICY "article_movement_analytics_policy" ON article_movement_analytics
    FOR ALL USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access 
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 10. Triggers for Updated At
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_article_tracking_enhanced_updated_at ON article_tracking_enhanced;
CREATE TRIGGER update_article_tracking_enhanced_updated_at 
    BEFORE UPDATE ON article_tracking_enhanced 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gps_tracking_sessions_updated_at ON gps_tracking_sessions;
CREATE TRIGGER update_gps_tracking_sessions_updated_at 
    BEFORE UPDATE ON gps_tracking_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. Functions for Analytics
-- =============================================

-- Function to calculate movement analytics
CREATE OR REPLACE FUNCTION calculate_daily_movement_analytics(
    p_analysis_date DATE DEFAULT CURRENT_DATE,
    p_branch_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    warehouse_rec RECORD;
    location_rec RECORD;
BEGIN
    -- Loop through warehouses
    FOR warehouse_rec IN 
        SELECT w.id as warehouse_id, w.branch_id
        FROM warehouses w
        WHERE (p_branch_id IS NULL OR w.branch_id = p_branch_id)
    LOOP
        -- Loop through warehouse locations
        FOR location_rec IN
            SELECT wl.id as location_id, wl.location_code
            FROM warehouse_locations wl
            WHERE wl.warehouse_id = warehouse_rec.warehouse_id
        LOOP
            -- Insert or update analytics
            INSERT INTO article_movement_analytics (
                analysis_date,
                analysis_period,
                warehouse_id,
                warehouse_location_id,
                location_code,
                branch_id,
                organization_id,
                
                total_articles,
                articles_received,
                articles_dispatched,
                articles_transferred,
                articles_returned,
                
                avg_dwell_time,
                avg_processing_time,
                throughput_per_hour,
                utilization_percentage,
                efficiency_score
            )
            SELECT 
                p_analysis_date,
                'daily',
                warehouse_rec.warehouse_id,
                location_rec.location_id,
                location_rec.location_code,
                warehouse_rec.branch_id,
                b.organization_id,
                
                -- Calculate metrics from scan history
                COUNT(DISTINCT ash.booking_id) as total_articles,
                COUNT(CASE WHEN ash.scan_type = 'check_in' THEN 1 END) as articles_received,
                COUNT(CASE WHEN ash.scan_type = 'check_out' THEN 1 END) as articles_dispatched,
                COUNT(CASE WHEN ash.scan_type = 'transfer' THEN 1 END) as articles_transferred,
                COUNT(CASE WHEN ash.scan_type = 'return' THEN 1 END) as articles_returned,
                
                -- Time calculations (simplified)
                60 as avg_dwell_time,
                60 as avg_processing_time,
                CASE WHEN COUNT(*) > 0 THEN COUNT(*)::DECIMAL / 24 ELSE 0 END as throughput_per_hour,
                LEAST(100, (COUNT(*)::DECIMAL / 100) * 100) as utilization_percentage,
                LEAST(100, GREATEST(0, 100 - (COUNT(CASE WHEN ash.condition_at_scan != 'good' THEN 1 END)::DECIMAL / GREATEST(COUNT(*), 1)) * 100)) as efficiency_score
            
            FROM article_scan_history ash
            JOIN branches b ON ash.branch_id = b.id
            WHERE ash.warehouse_location_id = location_rec.location_id
            AND DATE(ash.scan_time) = p_analysis_date
            AND ash.branch_id = warehouse_rec.branch_id
            GROUP BY warehouse_rec.warehouse_id, location_rec.location_id, location_rec.location_code, 
                     warehouse_rec.branch_id, b.organization_id
            
            ON CONFLICT (analysis_date, analysis_period, warehouse_id, warehouse_location_id, branch_id)
            DO UPDATE SET
                total_articles = EXCLUDED.total_articles,
                articles_received = EXCLUDED.articles_received,
                articles_dispatched = EXCLUDED.articles_dispatched,
                articles_transferred = EXCLUDED.articles_transferred,
                articles_returned = EXCLUDED.articles_returned,
                avg_dwell_time = EXCLUDED.avg_dwell_time,
                avg_processing_time = EXCLUDED.avg_processing_time,
                throughput_per_hour = EXCLUDED.throughput_per_hour,
                utilization_percentage = EXCLUDED.utilization_percentage,
                efficiency_score = EXCLUDED.efficiency_score,
                calculated_at = NOW();
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Enhanced Article Tracking System migration completed successfully!' as message;