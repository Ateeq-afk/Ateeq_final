-- Payment Gateway System Migration
-- Creates tables for online payment processing

-- Create payment_orders table
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    gateway_order_id VARCHAR(255) NOT NULL,
    gateway_payment_id VARCHAR(255),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('razorpay', 'stripe', 'payu')),
    status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created', 'pending', 'success', 'failed', 'cancelled')),
    customer_info JSONB NOT NULL,
    gateway_response JSONB,
    verification_result JSONB,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Create payment_refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    refund_id VARCHAR(255) NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'cancelled')),
    gateway_provider VARCHAR(50) NOT NULL,
    gateway_response JSONB,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_booking_id ON payment_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_organization ON payment_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider ON payment_orders(provider);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_orders_expires_at ON payment_orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_orders_gateway_order_id ON payment_orders(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_gateway_payment_id ON payment_orders(gateway_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_organization ON payment_refunds(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_created_at ON payment_refunds(created_at);

-- Add RLS policies
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- Payment orders policies
DROP POLICY IF EXISTS "payment_orders_organization_isolation" ON payment_orders;
CREATE POLICY "payment_orders_organization_isolation" ON payment_orders
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

DROP POLICY IF EXISTS "payment_orders_branch_access" ON payment_orders;
CREATE POLICY "payment_orders_branch_access" ON payment_orders
    FOR ALL USING (
        CASE 
            WHEN current_setting('app.current_user_role', true) = 'admin' THEN true
            ELSE branch_id = current_setting('app.current_branch_id')::UUID
        END
    );

-- Payment refunds policies
DROP POLICY IF EXISTS "payment_refunds_organization_isolation" ON payment_refunds;
CREATE POLICY "payment_refunds_organization_isolation" ON payment_refunds
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Add columns to payments table for gateway integration
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS gateway_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS gateway_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gateway_tax DECIMAL(10,2) DEFAULT 0;

-- Create indexes for new payment columns
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_provider ON payments(gateway_provider);

-- Add payment_mode options for online payments
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_payment_mode_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_payment_mode_check 
CHECK (payment_mode IN ('prepaid', 'to_pay', 'online', 'credit'));

-- Create view for payment gateway statistics
CREATE OR REPLACE VIEW payment_gateway_stats AS
SELECT 
    o.organization_id,
    o.provider,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN o.status = 'success' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN o.status = 'failed' THEN 1 END) as failed_payments,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_payments,
    SUM(CASE WHEN o.status = 'success' THEN o.amount ELSE 0 END) as total_amount,
    SUM(CASE WHEN o.status = 'success' THEN COALESCE(p.gateway_fee, 0) ELSE 0 END) as total_fees,
    COUNT(r.id) as total_refunds,
    SUM(CASE WHEN r.status = 'processed' THEN r.amount ELSE 0 END) as refunded_amount
FROM payment_orders o
LEFT JOIN payments p ON p.gateway_payment_id = o.gateway_payment_id
LEFT JOIN payment_refunds r ON r.payment_id = p.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY o.organization_id, o.provider;

-- Create function to get payment gateway statistics
CREATE OR REPLACE FUNCTION get_payment_gateway_stats(org_id UUID)
RETURNS TABLE (
    provider VARCHAR(50),
    total_orders BIGINT,
    successful_payments BIGINT,
    failed_payments BIGINT,
    pending_payments BIGINT,
    total_amount DECIMAL(15,2),
    total_fees DECIMAL(15,2),
    total_refunds BIGINT,
    refunded_amount DECIMAL(15,2),
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.provider,
        s.total_orders,
        s.successful_payments,
        s.failed_payments,
        s.pending_payments,
        s.total_amount,
        s.total_fees,
        s.total_refunds,
        s.refunded_amount,
        CASE 
            WHEN s.total_orders > 0 THEN 
                ROUND((s.successful_payments::DECIMAL / s.total_orders::DECIMAL) * 100, 2)
            ELSE 0 
        END as success_rate
    FROM payment_gateway_stats s
    WHERE s.organization_id = org_id
    ORDER BY s.total_orders DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup expired payment orders
CREATE OR REPLACE FUNCTION cleanup_expired_payment_orders()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE payment_orders 
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE status IN ('created', 'pending')
      AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_payment_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_orders_updated_at_trigger ON payment_orders;
CREATE TRIGGER payment_orders_updated_at_trigger
    BEFORE UPDATE ON payment_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_orders_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_refunds TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_gateway_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_payment_orders() TO authenticated;

-- Insert sample payment gateway configuration
INSERT INTO system_config (key, value, description, created_at) VALUES
('payment_gateway_enabled', 'true', 'Enable online payment gateway integration', CURRENT_TIMESTAMP),
('payment_gateway_default_provider', 'razorpay', 'Default payment gateway provider', CURRENT_TIMESTAMP),
('payment_gateway_test_mode', 'true', 'Enable test mode for payment gateway', CURRENT_TIMESTAMP),
('payment_gateway_auto_capture', 'true', 'Automatically capture payments after authorization', CURRENT_TIMESTAMP),
('payment_gateway_webhook_validation', 'true', 'Validate webhook signatures', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;