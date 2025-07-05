-- Migration: Add warehouse management system
-- This migration creates tables for warehouses, storage locations, and inventory management

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Location details
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    
    -- Contact information
    phone TEXT,
    email TEXT,
    
    -- Warehouse metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    warehouse_type TEXT DEFAULT 'general' CHECK (warehouse_type IN ('general', 'cold_storage', 'hazmat', 'bonded')),
    
    -- Capacity information
    total_capacity_sqft DECIMAL(10, 2),
    available_capacity_sqft DECIMAL(10, 2),
    
    -- Manager information
    manager_name TEXT,
    manager_contact TEXT,
    
    -- Operating hours
    operating_hours JSONB, -- Store as JSON: {"monday": {"open": "09:00", "close": "18:00"}}
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create warehouse_locations table (storage locations within warehouses)
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    
    -- Location identification
    location_code TEXT NOT NULL, -- e.g., "A-1-001", "RACK-B-002"
    name TEXT NOT NULL,
    description TEXT,
    
    -- Location type and properties
    location_type TEXT DEFAULT 'bin' CHECK (location_type IN ('bin', 'rack', 'shelf', 'floor', 'dock', 'staging')),
    
    -- Physical properties
    dimensions JSONB, -- {"length": 10, "width": 5, "height": 3, "unit": "feet"}
    capacity_weight DECIMAL(10, 2), -- Maximum weight capacity in kg
    capacity_volume DECIMAL(10, 2), -- Maximum volume capacity in cubic units
    capacity_units INTEGER, -- Maximum number of units/packages
    
    -- Environmental controls
    temperature_controlled BOOLEAN DEFAULT false,
    humidity_controlled BOOLEAN DEFAULT false,
    min_temperature DECIMAL(5, 2),
    max_temperature DECIMAL(5, 2),
    min_humidity DECIMAL(5, 2),
    max_humidity DECIMAL(5, 2),
    
    -- Status and availability
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance', 'disabled')),
    is_hazmat_approved BOOLEAN DEFAULT false,
    
    -- Parent-child relationship for hierarchical locations
    parent_location_id UUID REFERENCES warehouse_locations(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Ensure unique location codes within warehouse
    UNIQUE(warehouse_id, location_code)
);

-- Create inventory_records table
CREATE TABLE IF NOT EXISTS inventory_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Location and item references
    warehouse_location_id UUID NOT NULL REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE, -- Reference to articles table
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- Optional booking reference
    
    -- Item identification
    item_code TEXT, -- Custom item code/barcode
    batch_number TEXT,
    serial_number TEXT,
    
    -- Quantity information
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0, -- Quantity reserved for orders
    available_quantity DECIMAL(10, 3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    
    -- Physical properties
    weight_per_unit DECIMAL(10, 3),
    total_weight DECIMAL(10, 3),
    dimensions_per_unit JSONB,
    
    -- Status and condition
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'damaged', 'expired', 'quarantine', 'in_transit')),
    condition_rating TEXT DEFAULT 'good' CHECK (condition_rating IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    
    -- Dates
    received_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    last_moved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Cost information
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    
    -- Supplier information
    supplier_name TEXT,
    supplier_batch_ref TEXT,
    
    -- Quality and compliance
    quality_check_status TEXT DEFAULT 'pending' CHECK (quality_check_status IN ('pending', 'passed', 'failed', 'not_required')),
    quality_check_date TIMESTAMP WITH TIME ZONE,
    quality_check_by UUID REFERENCES users(id),
    compliance_certifications JSONB, -- Store certification details as JSON
    
    -- Notes and remarks
    remarks TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create inventory_movements table for tracking all inventory movements
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Movement details
    movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'transfer', 'adjustment', 'return')),
    movement_reason TEXT CHECK (movement_reason IN ('receiving', 'shipping', 'transfer', 'damaged', 'expired', 'lost', 'found', 'correction')),
    
    -- Inventory references
    inventory_record_id UUID NOT NULL REFERENCES inventory_records(id) ON DELETE CASCADE,
    from_location_id UUID REFERENCES warehouse_locations(id),
    to_location_id UUID REFERENCES warehouse_locations(id),
    
    -- Booking and document references
    booking_id UUID REFERENCES bookings(id),
    reference_document TEXT, -- PO number, invoice number, etc.
    
    -- Quantity moved
    quantity_moved DECIMAL(10, 3) NOT NULL,
    quantity_before DECIMAL(10, 3) NOT NULL,
    quantity_after DECIMAL(10, 3) NOT NULL,
    
    -- Movement details
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    -- Approval workflow
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create warehouse_zones table for logical grouping of locations
CREATE TABLE IF NOT EXISTS warehouse_zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    
    -- Zone identification
    zone_code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Zone properties
    zone_type TEXT DEFAULT 'general' CHECK (zone_type IN ('general', 'receiving', 'shipping', 'picking', 'storage', 'quarantine', 'returns')),
    priority_level INTEGER DEFAULT 1, -- 1 = highest priority
    
    -- Environmental controls at zone level
    temperature_controlled BOOLEAN DEFAULT false,
    humidity_controlled BOOLEAN DEFAULT false,
    security_level TEXT DEFAULT 'standard' CHECK (security_level IN ('standard', 'restricted', 'high_security')),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    UNIQUE(warehouse_id, zone_code)
);

-- Add zone reference to warehouse_locations
ALTER TABLE warehouse_locations 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES warehouse_zones(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_branch_id ON warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_organization_id ON warehouses(organization_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);

CREATE INDEX IF NOT EXISTS idx_warehouse_locations_warehouse_id ON warehouse_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_location_code ON warehouse_locations(location_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_status ON warehouse_locations(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_type ON warehouse_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_zone_id ON warehouse_locations(zone_id);

CREATE INDEX IF NOT EXISTS idx_inventory_records_location_id ON inventory_records(warehouse_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_records_article_id ON inventory_records(article_id);
CREATE INDEX IF NOT EXISTS idx_inventory_records_booking_id ON inventory_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_inventory_records_status ON inventory_records(status);
CREATE INDEX IF NOT EXISTS idx_inventory_records_batch_number ON inventory_records(batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_records_expiry_date ON inventory_records(expiry_date) WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_record_id ON inventory_movements(inventory_record_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_booking_id ON inventory_movements(booking_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_zones_warehouse_id ON warehouse_zones(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_zones_zone_code ON warehouse_zones(zone_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_zones_type ON warehouse_zones(zone_type);

-- Add warehouse information to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS current_warehouse_id UUID REFERENCES warehouses(id),
ADD COLUMN IF NOT EXISTS current_location_id UUID REFERENCES warehouse_locations(id),
ADD COLUMN IF NOT EXISTS warehouse_status TEXT CHECK (warehouse_status IN ('not_received', 'in_warehouse', 'picked', 'staged', 'loaded', 'in_transit'));

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouse_locations_updated_at BEFORE UPDATE ON warehouse_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_records_updated_at BEFORE UPDATE ON inventory_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouse_zones_updated_at BEFORE UPDATE ON warehouse_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for warehouses
CREATE POLICY "Users can view warehouses in their organization" ON warehouses FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        organization_id = (auth.jwt() ->> 'organization_id')::UUID OR
        branch_id = (auth.jwt() ->> 'branch_id')::UUID
    );

CREATE POLICY "Users can insert warehouses in their organization" ON warehouses FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin') AND
        (auth.jwt() ->> 'role' = 'superadmin' OR organization_id = (auth.jwt() ->> 'organization_id')::UUID)
    );

CREATE POLICY "Users can update warehouses in their organization" ON warehouses FOR UPDATE
    USING (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin') AND
        (auth.jwt() ->> 'role' = 'superadmin' OR organization_id = (auth.jwt() ->> 'organization_id')::UUID)
    );

CREATE POLICY "Users can delete warehouses in their organization" ON warehouses FOR DELETE
    USING (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin') AND
        (auth.jwt() ->> 'role' = 'superadmin' OR organization_id = (auth.jwt() ->> 'organization_id')::UUID)
    );

-- Create RLS policies for warehouse_locations
CREATE POLICY "Users can view warehouse locations in their organization" ON warehouse_locations FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        warehouse_id IN (
            SELECT id FROM warehouses 
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR branch_id = (auth.jwt() ->> 'branch_id')::UUID
        )
    );

CREATE POLICY "Users can manage warehouse locations in their organization" ON warehouse_locations FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin', 'operator') AND
        (auth.jwt() ->> 'role' = 'superadmin' OR
         warehouse_id IN (
            SELECT id FROM warehouses 
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR branch_id = (auth.jwt() ->> 'branch_id')::UUID
         ))
    );

-- Create RLS policies for inventory_records
CREATE POLICY "Users can view inventory in their organization" ON inventory_records FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        warehouse_location_id IN (
            SELECT wl.id FROM warehouse_locations wl
            JOIN warehouses w ON w.id = wl.warehouse_id
            WHERE w.organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR w.branch_id = (auth.jwt() ->> 'branch_id')::UUID
        )
    );

CREATE POLICY "Users can manage inventory in their organization" ON inventory_records FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin', 'operator') AND
        (auth.jwt() ->> 'role' = 'superadmin' OR
         warehouse_location_id IN (
            SELECT wl.id FROM warehouse_locations wl
            JOIN warehouses w ON w.id = wl.warehouse_id
            WHERE w.organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR w.branch_id = (auth.jwt() ->> 'branch_id')::UUID
         ))
    );

-- Create RLS policies for inventory_movements
CREATE POLICY "Users can view inventory movements in their organization" ON inventory_movements FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        inventory_record_id IN (
            SELECT ir.id FROM inventory_records ir
            JOIN warehouse_locations wl ON wl.id = ir.warehouse_location_id
            JOIN warehouses w ON w.id = wl.warehouse_id
            WHERE w.organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR w.branch_id = (auth.jwt() ->> 'branch_id')::UUID
        )
    );

CREATE POLICY "Users can manage inventory movements in their organization" ON inventory_movements FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin', 'operator') AND
        (auth.jwt() ->> 'role' = 'superadmin' OR
         inventory_record_id IN (
            SELECT ir.id FROM inventory_records ir
            JOIN warehouse_locations wl ON wl.id = ir.warehouse_location_id
            JOIN warehouses w ON w.id = wl.warehouse_id
            WHERE w.organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR w.branch_id = (auth.jwt() ->> 'branch_id')::UUID
         ))
    );

-- Create RLS policies for warehouse_zones
CREATE POLICY "Users can view warehouse zones in their organization" ON warehouse_zones FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'superadmin' OR
        warehouse_id IN (
            SELECT id FROM warehouses 
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR branch_id = (auth.jwt() ->> 'branch_id')::UUID
        )
    );

CREATE POLICY "Users can manage warehouse zones in their organization" ON warehouse_zones FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('superadmin', 'admin') AND
        (auth.jwt() ->> 'role' = 'superadmin' OR
         warehouse_id IN (
            SELECT id FROM warehouses 
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::UUID 
               OR branch_id = (auth.jwt() ->> 'branch_id')::UUID
         ))
    );

-- Create useful views for common queries
CREATE OR REPLACE VIEW warehouse_inventory_summary AS
SELECT 
    w.id as warehouse_id,
    w.name as warehouse_name,
    w.city,
    w.status as warehouse_status,
    w.organization_id,
    w.branch_id,
    COUNT(DISTINCT wl.id) as total_locations,
    COUNT(DISTINCT ir.id) as total_inventory_records,
    SUM(ir.quantity) as total_quantity,
    SUM(ir.available_quantity) as total_available_quantity,
    SUM(ir.reserved_quantity) as total_reserved_quantity,
    COUNT(DISTINCT ir.article_id) as unique_articles
FROM warehouses w
LEFT JOIN warehouse_locations wl ON w.id = wl.warehouse_id AND wl.status = 'available'
LEFT JOIN inventory_records ir ON wl.id = ir.warehouse_location_id AND ir.status = 'available'
GROUP BY w.id, w.name, w.city, w.status, w.organization_id, w.branch_id;

CREATE OR REPLACE VIEW location_inventory_details AS
SELECT 
    wl.id as location_id,
    wl.location_code,
    wl.name as location_name,
    wl.location_type,
    wl.status as location_status,
    w.id as warehouse_id,
    w.name as warehouse_name,
    COUNT(ir.id) as inventory_records_count,
    SUM(ir.quantity) as total_quantity,
    SUM(ir.available_quantity) as available_quantity,
    SUM(ir.reserved_quantity) as reserved_quantity,
    wl.capacity_units,
    wl.capacity_weight,
    wl.capacity_volume
FROM warehouse_locations wl
JOIN warehouses w ON w.id = wl.warehouse_id
LEFT JOIN inventory_records ir ON wl.id = ir.warehouse_location_id AND ir.status = 'available'
GROUP BY wl.id, wl.location_code, wl.name, wl.location_type, wl.status, 
         w.id, w.name, wl.capacity_units, wl.capacity_weight, wl.capacity_volume;

-- Insert some sample data for testing (optional - can be removed for production)
-- This will only run if there are no existing warehouses
INSERT INTO warehouses (name, address, city, status, warehouse_type, manager_name)
SELECT 'Main Distribution Center', '123 Logistics Avenue', 'Mumbai', 'active', 'general', 'Rajesh Kumar'
WHERE NOT EXISTS (SELECT 1 FROM warehouses);

INSERT INTO warehouses (name, address, city, status, warehouse_type, manager_name)
SELECT 'Cold Storage Facility', '456 Refrigeration Road', 'Delhi', 'active', 'cold_storage', 'Priya Sharma'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'Cold Storage Facility');

-- Add some zones to the sample warehouses
INSERT INTO warehouse_zones (warehouse_id, zone_code, name, zone_type, description)
SELECT w.id, 'RCV', 'Receiving Zone', 'receiving', 'Area for receiving incoming shipments'
FROM warehouses w
WHERE w.name = 'Main Distribution Center'
AND NOT EXISTS (SELECT 1 FROM warehouse_zones WHERE warehouse_id = w.id AND zone_code = 'RCV');

INSERT INTO warehouse_zones (warehouse_id, zone_code, name, zone_type, description)
SELECT w.id, 'SHP', 'Shipping Zone', 'shipping', 'Area for outbound shipments'
FROM warehouses w
WHERE w.name = 'Main Distribution Center'
AND NOT EXISTS (SELECT 1 FROM warehouse_zones WHERE warehouse_id = w.id AND zone_code = 'SHP');

-- Add some sample locations
INSERT INTO warehouse_locations (warehouse_id, location_code, name, location_type, zone_id, capacity_units, capacity_weight)
SELECT w.id, 'A-01-001', 'Bin A-01-001', 'bin', wz.id, 100, 500.00
FROM warehouses w, warehouse_zones wz
WHERE w.name = 'Main Distribution Center' 
AND wz.warehouse_id = w.id 
AND wz.zone_code = 'RCV'
AND NOT EXISTS (SELECT 1 FROM warehouse_locations WHERE warehouse_id = w.id AND location_code = 'A-01-001');

INSERT INTO warehouse_locations (warehouse_id, location_code, name, location_type, zone_id, capacity_units, capacity_weight)
SELECT w.id, 'A-01-002', 'Bin A-01-002', 'bin', wz.id, 100, 500.00
FROM warehouses w, warehouse_zones wz
WHERE w.name = 'Main Distribution Center' 
AND wz.warehouse_id = w.id 
AND wz.zone_code = 'RCV'
AND NOT EXISTS (SELECT 1 FROM warehouse_locations WHERE warehouse_id = w.id AND location_code = 'A-01-002');