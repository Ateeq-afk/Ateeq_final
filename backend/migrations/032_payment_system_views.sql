-- Migration: Payment System Views
-- Create necessary views for payment routes

-- Create payment_summary view for payment listing with mode details
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.*,
    pm.name as payment_mode_name,
    pm.type as payment_mode_type,
    pm.requires_reference as mode_requires_reference
FROM payments p
JOIN payment_modes pm ON p.payment_mode_id = pm.id
WHERE p.is_deleted = false;

-- Create outstanding_summary view for outstanding amounts with customer details
CREATE OR REPLACE VIEW outstanding_summary AS
SELECT 
    oa.*,
    c.name as customer_name,
    c.phone as contact_phone,
    c.email as customer_email,
    c.address as customer_address,
    c.city as customer_city,
    c.gstin as customer_gstin,
    b.name as branch_name,
    o.name as organization_name
FROM outstanding_amounts oa
JOIN customers c ON oa.customer_id = c.id
JOIN branches b ON oa.branch_id = b.id
JOIN organizations o ON oa.organization_id = o.id
WHERE oa.is_deleted = false;

-- Add comments for documentation
COMMENT ON VIEW payment_summary IS 'Consolidated view of payments with payment mode details';
COMMENT ON VIEW outstanding_summary IS 'Consolidated view of outstanding amounts with customer and branch details';