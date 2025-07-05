-- Migration: Fix warehouse_inventory_summary view
-- This migration adds organization_id and branch_id to the warehouse_inventory_summary view

DROP VIEW IF EXISTS warehouse_inventory_summary CASCADE;

CREATE OR REPLACE VIEW warehouse_inventory_summary AS
SELECT 
    w.id as warehouse_id,
    w.name as warehouse_name,
    w.organization_id,
    w.branch_id,
    w.city,
    w.status as warehouse_status,
    COUNT(DISTINCT wl.id) as total_locations,
    COUNT(DISTINCT ir.id) as total_inventory_records,
    COALESCE(SUM(ir.quantity), 0) as total_quantity,
    COALESCE(SUM(ir.available_quantity), 0) as total_available_quantity,
    COALESCE(SUM(ir.reserved_quantity), 0) as total_reserved_quantity,
    COUNT(DISTINCT ir.article_id) as unique_articles
FROM warehouses w
LEFT JOIN warehouse_locations wl ON w.id = wl.warehouse_id
LEFT JOIN inventory_records ir ON wl.id = ir.warehouse_location_id AND ir.status = 'available'
GROUP BY w.id, w.name, w.organization_id, w.branch_id, w.city, w.status;