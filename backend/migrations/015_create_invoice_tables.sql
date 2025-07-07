-- Invoice Generation System Tables
-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cgst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sgst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    igst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'generated',
    pdf_path TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT invoices_status_check CHECK (status IN ('generated', 'sent', 'paid', 'cancelled')),
    CONSTRAINT invoices_amounts_check CHECK (
        subtotal >= 0 AND 
        cgst >= 0 AND 
        sgst >= 0 AND 
        igst >= 0 AND 
        total_tax >= 0 AND 
        grand_total >= 0
    )
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    lr_number VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    from_station VARCHAR(100) NOT NULL,
    to_station VARCHAR(100) NOT NULL,
    articles_count INTEGER NOT NULL DEFAULT 0,
    weight DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    freight_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    loading_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unloading_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    insurance_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    other_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT invoice_items_amounts_check CHECK (
        articles_count >= 0 AND
        weight >= 0 AND
        freight_amount >= 0 AND
        loading_charges >= 0 AND
        unloading_charges >= 0 AND
        insurance_amount >= 0 AND
        other_charges >= 0 AND
        total_amount >= 0
    )
);

-- Create invoice_payments table for payment tracking
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT invoice_payments_method_check CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other')),
    CONSTRAINT invoice_payments_amount_check CHECK (amount > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_branch ON invoices(organization_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date_range ON invoices(from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_lr_number ON invoice_items(lr_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_booking_date ON invoice_items(booking_date);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date ON invoice_payments(payment_date);

-- Create RLS policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "invoices_org_isolation" ON invoices
    FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id'::text);

CREATE POLICY "invoices_branch_access" ON invoices
    FOR ALL USING (
        CASE 
            WHEN auth.jwt() ->> 'role' IN ('admin', 'superadmin') THEN true
            ELSE branch_id = auth.jwt() ->> 'branch_id'::text
        END
    );

-- Invoice items policies
CREATE POLICY "invoice_items_via_invoice" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.organization_id = auth.jwt() ->> 'organization_id'::text
        )
    );

-- Invoice payments policies
CREATE POLICY "invoice_payments_via_invoice" ON invoice_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_payments.invoice_id 
            AND invoices.organization_id = auth.jwt() ->> 'organization_id'::text
        )
    );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add invoice statistics view
CREATE OR REPLACE VIEW invoice_statistics AS
SELECT 
    i.organization_id,
    i.branch_id,
    DATE_TRUNC('month', i.created_at) as month,
    COUNT(*) as total_invoices,
    SUM(i.grand_total) as total_amount,
    AVG(i.grand_total) as average_amount,
    COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_invoices,
    SUM(CASE WHEN i.status = 'paid' THEN i.grand_total ELSE 0 END) as paid_amount,
    COUNT(CASE WHEN i.status = 'generated' THEN 1 END) as pending_invoices,
    SUM(CASE WHEN i.status = 'generated' THEN i.grand_total ELSE 0 END) as pending_amount
FROM invoices i
GROUP BY i.organization_id, i.branch_id, DATE_TRUNC('month', i.created_at);

-- Add customer invoice summary view
CREATE OR REPLACE VIEW customer_invoice_summary AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.organization_id,
    COUNT(i.id) as total_invoices,
    SUM(i.grand_total) as total_amount,
    SUM(CASE WHEN i.status = 'paid' THEN i.grand_total ELSE 0 END) as paid_amount,
    SUM(CASE WHEN i.status != 'paid' THEN i.grand_total ELSE 0 END) as outstanding_amount,
    MAX(i.created_at) as last_invoice_date,
    AVG(i.grand_total) as average_invoice_amount
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
GROUP BY c.id, c.name, c.organization_id;

COMMENT ON TABLE invoices IS 'Generated invoices for customer bookings with GST calculations';
COMMENT ON TABLE invoice_items IS 'Individual booking items included in each invoice';
COMMENT ON TABLE invoice_payments IS 'Payment records against invoices';
COMMENT ON VIEW invoice_statistics IS 'Monthly statistics for invoice generation and payments';
COMMENT ON VIEW customer_invoice_summary IS 'Summary of invoices and payments by customer';