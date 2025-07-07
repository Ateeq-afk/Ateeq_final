-- Migration: Comprehensive Payment System
-- This migration creates a complete payment management system with outstanding amounts tracking

-- Create payment_modes table
CREATE TABLE IF NOT EXISTS payment_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other')),
    requires_reference BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(organization_id, name)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) NOT NULL,
    payment_mode_id UUID NOT NULL REFERENCES payment_modes(id),
    payment_reference VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payer_name VARCHAR(200) NOT NULL,
    payer_type VARCHAR(50) NOT NULL CHECK (payer_type IN ('customer', 'vendor', 'employee', 'other')),
    payer_id UUID, -- References customers, vendors, etc.
    purpose VARCHAR(100) NOT NULL CHECK (purpose IN ('booking_payment', 'advance', 'balance', 'freight', 'detention', 'other')),
    description TEXT,
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'bounced', 'cancelled')),
    cleared_date DATE,
    bounced_reason TEXT,
    receipt_number VARCHAR(50),
    receipt_generated_at TIMESTAMP WITH TIME ZONE,
    receipt_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    is_deleted BOOLEAN DEFAULT false,
    UNIQUE(organization_id, payment_number)
);

-- Create payment_allocations table
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    allocation_type VARCHAR(50) NOT NULL CHECK (allocation_type IN ('booking', 'invoice', 'advance', 'outstanding')),
    reference_id UUID, -- References bookings, invoices, etc.
    reference_number VARCHAR(100),
    allocated_amount DECIMAL(15,2) NOT NULL CHECK (allocated_amount > 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create outstanding_amounts table
CREATE TABLE IF NOT EXISTS outstanding_amounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('booking', 'invoice', 'advance', 'other')),
    reference_id UUID, -- References bookings, invoices, etc.
    reference_number VARCHAR(100) NOT NULL,
    original_amount DECIMAL(15,2) NOT NULL CHECK (original_amount > 0),
    paid_amount DECIMAL(15,2) DEFAULT 0 CHECK (paid_amount >= 0),
    outstanding_amount DECIMAL(15,2) GENERATED ALWAYS AS (original_amount - paid_amount) STORED,
    due_date DATE NOT NULL,
    overdue_days INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN due_date < CURRENT_DATE THEN CURRENT_DATE - due_date
            ELSE 0
        END
    ) STORED,
    aging_bucket VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN due_date >= CURRENT_DATE THEN 'current'
            WHEN CURRENT_DATE - due_date <= 30 THEN '1-30_days'
            WHEN CURRENT_DATE - due_date <= 60 THEN '31-60_days'
            WHEN CURRENT_DATE - due_date <= 90 THEN '61-90_days'
            ELSE '90+_days'
        END
    ) STORED,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'fully_paid', 'written_off')),
    oldest_outstanding_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    is_deleted BOOLEAN DEFAULT false,
    UNIQUE(organization_id, reference_number, reference_type)
);

-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    outstanding_amount_id UUID REFERENCES outstanding_amounts(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('sms', 'email', 'whatsapp', 'call')),
    reminder_date DATE NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    customer_response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_purpose ON payments(purpose);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_reference_id ON payment_allocations(reference_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_type ON payment_allocations(allocation_type);

CREATE INDEX IF NOT EXISTS idx_outstanding_amounts_organization_id ON outstanding_amounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_amounts_branch_id ON outstanding_amounts(branch_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_amounts_customer_id ON outstanding_amounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_amounts_status ON outstanding_amounts(status);
CREATE INDEX IF NOT EXISTS idx_outstanding_amounts_due_date ON outstanding_amounts(due_date);
CREATE INDEX IF NOT EXISTS idx_outstanding_amounts_aging_bucket ON outstanding_amounts(aging_bucket);
CREATE INDEX IF NOT EXISTS idx_outstanding_amounts_reference ON outstanding_amounts(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_customer_id ON payment_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_reminder_date ON payment_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_modes_updated_at BEFORE UPDATE ON payment_modes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_allocations_updated_at BEFORE UPDATE ON payment_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_outstanding_amounts_updated_at BEFORE UPDATE ON outstanding_amounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_reminders_updated_at BEFORE UPDATE ON payment_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-update outstanding amount status
CREATE OR REPLACE FUNCTION update_outstanding_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on paid amount
    IF NEW.paid_amount >= NEW.original_amount THEN
        NEW.status = 'fully_paid';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status = 'partially_paid';
    ELSE
        NEW.status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_outstanding_status 
    BEFORE INSERT OR UPDATE ON outstanding_amounts 
    FOR EACH ROW EXECUTE FUNCTION update_outstanding_status();

-- Enable RLS on all payment tables
ALTER TABLE payment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outstanding_amounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_modes
CREATE POLICY "Users can view payment modes in their organization" ON payment_modes
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM branches WHERE id = auth.jwt() ->> 'branch_id'
    ));

CREATE POLICY "Admins can manage payment modes" ON payment_modes
    FOR ALL USING (organization_id IN (
        SELECT organization_id FROM branches WHERE id = auth.jwt() ->> 'branch_id'
    ) AND auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Create RLS policies for payments
CREATE POLICY "Users can view payments in their branch" ON payments
    FOR SELECT USING (branch_id = (auth.jwt() ->> 'branch_id')::uuid);

CREATE POLICY "Users can create payments in their branch" ON payments
    FOR INSERT WITH CHECK (branch_id = (auth.jwt() ->> 'branch_id')::uuid);

CREATE POLICY "Users can update payments in their branch" ON payments
    FOR UPDATE USING (branch_id = (auth.jwt() ->> 'branch_id')::uuid);

-- Create RLS policies for payment_allocations
CREATE POLICY "Users can view payment allocations" ON payment_allocations
    FOR SELECT USING (payment_id IN (
        SELECT id FROM payments WHERE branch_id = (auth.jwt() ->> 'branch_id')::uuid
    ));

CREATE POLICY "Users can manage payment allocations" ON payment_allocations
    FOR ALL USING (payment_id IN (
        SELECT id FROM payments WHERE branch_id = (auth.jwt() ->> 'branch_id')::uuid
    ));

-- Create RLS policies for outstanding_amounts
CREATE POLICY "Users can view outstanding amounts in their branch" ON outstanding_amounts
    FOR SELECT USING (branch_id = (auth.jwt() ->> 'branch_id')::uuid);

CREATE POLICY "Users can create outstanding amounts in their branch" ON outstanding_amounts
    FOR INSERT WITH CHECK (branch_id = (auth.jwt() ->> 'branch_id')::uuid);

CREATE POLICY "Users can update outstanding amounts in their branch" ON outstanding_amounts
    FOR UPDATE USING (branch_id = (auth.jwt() ->> 'branch_id')::uuid);

-- Create RLS policies for payment_reminders
CREATE POLICY "Users can view payment reminders in their organization" ON payment_reminders
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM branches WHERE id = (auth.jwt() ->> 'branch_id')::uuid
    ));

CREATE POLICY "Users can manage payment reminders in their organization" ON payment_reminders
    FOR ALL USING (organization_id IN (
        SELECT organization_id FROM branches WHERE id = (auth.jwt() ->> 'branch_id')::uuid
    ));

-- Insert default payment modes for existing organizations
INSERT INTO payment_modes (organization_id, name, type, requires_reference, description, is_active) 
SELECT DISTINCT 
    o.id as organization_id,
    pm.name,
    pm.type,
    pm.requires_reference,
    pm.description,
    true as is_active
FROM organizations o
CROSS JOIN (
    VALUES 
        ('Cash', 'cash', false, 'Direct cash payment'),
        ('Cheque', 'cheque', true, 'Payment by cheque'),
        ('Bank Transfer (NEFT)', 'bank_transfer', true, 'NEFT bank transfer'),
        ('Bank Transfer (RTGS)', 'bank_transfer', true, 'RTGS bank transfer'),
        ('UPI', 'upi', true, 'UPI payment'),
        ('Credit Card', 'card', true, 'Credit card payment'),
        ('Debit Card', 'card', true, 'Debit card payment'),
        ('Demand Draft', 'other', true, 'Payment by demand draft')
) AS pm(name, type, requires_reference, description)
ON CONFLICT (organization_id, name) DO NOTHING;

-- Create view for outstanding amounts with customer details
CREATE OR REPLACE VIEW outstanding_amounts_detailed AS
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

-- Create view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    p.organization_id,
    p.branch_id,
    DATE_TRUNC('month', p.payment_date) as payment_month,
    COUNT(*) as total_payments,
    SUM(p.amount) as total_amount,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN p.status = 'cleared' THEN p.amount ELSE 0 END) as cleared_amount,
    SUM(CASE WHEN p.status = 'bounced' THEN p.amount ELSE 0 END) as bounced_amount,
    AVG(p.amount) as average_payment,
    pm.name as payment_mode,
    p.purpose,
    p.payer_type
FROM payments p
JOIN payment_modes pm ON p.payment_mode_id = pm.id
WHERE p.is_deleted = false
GROUP BY p.organization_id, p.branch_id, payment_month, pm.name, p.purpose, p.payer_type;

-- Create function to calculate aging bucket for a given date
CREATE OR REPLACE FUNCTION calculate_aging_bucket(due_date DATE)
RETURNS TEXT AS $$
BEGIN
    IF due_date >= CURRENT_DATE THEN
        RETURN 'current';
    ELSIF CURRENT_DATE - due_date <= 30 THEN
        RETURN '1-30_days';
    ELSIF CURRENT_DATE - due_date <= 60 THEN
        RETURN '31-60_days';
    ELSIF CURRENT_DATE - due_date <= 90 THEN
        RETURN '61-90_days';
    ELSE
        RETURN '90+_days';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE payment_modes IS 'Available payment methods for each organization';
COMMENT ON TABLE payments IS 'All payment transactions';
COMMENT ON TABLE payment_allocations IS 'How payments are allocated to bookings/invoices';
COMMENT ON TABLE outstanding_amounts IS 'Outstanding receivables from customers';
COMMENT ON TABLE payment_reminders IS 'Payment reminder communications';

COMMENT ON COLUMN outstanding_amounts.aging_bucket IS 'Automatically calculated aging category';
COMMENT ON COLUMN outstanding_amounts.overdue_days IS 'Automatically calculated overdue days';
COMMENT ON COLUMN outstanding_amounts.outstanding_amount IS 'Automatically calculated remaining amount';
COMMENT ON COLUMN payments.payment_number IS 'Unique payment reference number';
COMMENT ON COLUMN payment_allocations.allocation_type IS 'Type of record this payment is allocated to';