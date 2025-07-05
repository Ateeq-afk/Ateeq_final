-- Enhanced Revenue Model Migration (Fixed)
-- This migration adds tables and enhancements to support the advanced revenue features

-- 1. Add missing columns to existing tables for enhanced revenue features
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 25.0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fuel_surcharge DECIMAL(8,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seasonal_adjustment DECIMAL(5,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bulk_discount DECIMAL(8,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS loyalty_discount DECIMAL(8,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pricing_factors JSONB DEFAULT '{}';

-- 2. Add revenue tracking fields to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 18.0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50) DEFAULT 'Fixed';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_fragile BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS requires_special_handling BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Add enhanced customer fields for revenue analysis
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'Net 30';

-- 4. Create pricing templates table
CREATE TABLE IF NOT EXISTS pricing_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    factors JSONB NOT NULL DEFAULT '{}',
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_pricing_templates_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_pricing_templates_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 5. Create customer article rates table (enhanced)
CREATE TABLE IF NOT EXISTS customer_article_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    article_id UUID NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_customer_article_rates_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_article_rates_article 
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    
    -- Ensure unique active rate per customer-article combination
    UNIQUE(customer_id, article_id, effective_from)
);

-- 6. Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    valid_until DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    total_discount DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    rounding_adjustment DECIMAL(5,2) DEFAULT 0,
    payment_mode VARCHAR(50),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    terms TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_invoices_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Ensure unique invoice number per organization
    UNIQUE(organization_id, invoice_number)
);

-- 7. Create invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    article_id UUID,
    description TEXT NOT NULL,
    hsn_code VARCHAR(20),
    quantity DECIMAL(10,3) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_invoice_items_invoice 
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_article 
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
);

-- 8. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    invoice_id UUID,
    booking_id UUID,
    customer_id UUID NOT NULL,
    payment_number VARCHAR(100),
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    transaction_id VARCHAR(255),
    bank_details JSONB,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_payments_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_invoice 
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_booking 
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 9. Create revenue analytics table for caching computed metrics
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    avg_booking_value DECIMAL(10,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    growth_rate DECIMAL(8,4) DEFAULT 0,
    overdue_amount DECIMAL(12,2) DEFAULT 0,
    top_customers JSONB DEFAULT '[]',
    top_routes JSONB DEFAULT '[]',
    payment_distribution JSONB DEFAULT '{}',
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_revenue_analytics_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_revenue_analytics_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 10. Create forecasts table
CREATE TABLE IF NOT EXISTS revenue_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    forecast_type VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    forecast_date DATE NOT NULL,
    forecasted_revenue DECIMAL(15,2) NOT NULL,
    confidence_level DECIMAL(5,2) NOT NULL,
    factors_used JSONB DEFAULT '{}',
    model_version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_revenue_forecasts_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_revenue_forecasts_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_total_amount ON bookings(total_amount);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at_org ON bookings(created_at, organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_type ON bookings(payment_type);
CREATE INDEX IF NOT EXISTS idx_customer_article_rates_active ON customer_article_rates(customer_id, article_id, is_active);
CREATE INDEX IF NOT EXISTS idx_invoices_status_org ON invoices(status, organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date_range ON invoices(invoice_date, organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_date_org ON payments(payment_date, organization_id);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_lookup ON revenue_analytics(organization_id, metric_date, metric_type);

-- 12. Create unique constraints using separate statements (FIXED)
-- For revenue_analytics - create unique index instead of inline constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_analytics_unique 
ON revenue_analytics(organization_id, metric_date, metric_type, COALESCE(branch_id::text, 'null'));

-- 13. Create RLS policies for new tables
ALTER TABLE pricing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_article_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_templates
CREATE POLICY "pricing_templates_select_policy" ON pricing_templates FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "pricing_templates_insert_policy" ON pricing_templates FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "pricing_templates_update_policy" ON pricing_templates FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- RLS Policies for customer_article_rates
CREATE POLICY "customer_article_rates_select_policy" ON customer_article_rates FOR SELECT
    USING (customer_id IN (
        SELECT c.id FROM customers c
        JOIN user_organizations uo ON c.organization_id = uo.organization_id
        WHERE uo.user_id = auth.uid()
    ));

CREATE POLICY "customer_article_rates_insert_policy" ON customer_article_rates FOR INSERT
    WITH CHECK (customer_id IN (
        SELECT c.id FROM customers c
        JOIN user_organizations uo ON c.organization_id = uo.organization_id
        WHERE uo.user_id = auth.uid()
    ));

-- RLS Policies for invoices
CREATE POLICY "invoices_select_policy" ON invoices FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "invoices_insert_policy" ON invoices FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "invoices_update_policy" ON invoices FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- RLS Policies for invoice_items
CREATE POLICY "invoice_items_select_policy" ON invoice_items FOR SELECT
    USING (invoice_id IN (
        SELECT i.id FROM invoices i
        JOIN user_organizations uo ON i.organization_id = uo.organization_id
        WHERE uo.user_id = auth.uid()
    ));

CREATE POLICY "invoice_items_insert_policy" ON invoice_items FOR INSERT
    WITH CHECK (invoice_id IN (
        SELECT i.id FROM invoices i
        JOIN user_organizations uo ON i.organization_id = uo.organization_id
        WHERE uo.user_id = auth.uid()
    ));

-- RLS Policies for payments
CREATE POLICY "payments_select_policy" ON payments FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "payments_insert_policy" ON payments FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- RLS Policies for revenue_analytics
CREATE POLICY "revenue_analytics_select_policy" ON revenue_analytics FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- RLS Policies for revenue_forecasts
CREATE POLICY "revenue_forecasts_select_policy" ON revenue_forecasts FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- 14. Create functions for revenue calculations
CREATE OR REPLACE FUNCTION calculate_booking_total(
    freight_per_qty DECIMAL,
    quantity INTEGER,
    loading_charges DECIMAL DEFAULT 0,
    unloading_charges DECIMAL DEFAULT 0,
    insurance_charge DECIMAL DEFAULT 0,
    packaging_charge DECIMAL DEFAULT 0,
    fuel_surcharge DECIMAL DEFAULT 0,
    seasonal_adjustment DECIMAL DEFAULT 0,
    bulk_discount DECIMAL DEFAULT 0,
    loyalty_discount DECIMAL DEFAULT 0
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        (freight_per_qty * quantity) + 
        loading_charges + 
        unloading_charges + 
        insurance_charge + 
        packaging_charge + 
        fuel_surcharge + 
        seasonal_adjustment - 
        bulk_discount - 
        loyalty_discount
    );
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger to auto-calculate booking total_amount
CREATE OR REPLACE FUNCTION update_booking_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = calculate_booking_total(
        NEW.freight_per_qty,
        NEW.quantity,
        COALESCE(NEW.loading_charges, 0),
        COALESCE(NEW.unloading_charges, 0),
        COALESCE(NEW.insurance_charge, 0),
        COALESCE(NEW.packaging_charge, 0),
        COALESCE(NEW.fuel_surcharge, 0),
        COALESCE(NEW.seasonal_adjustment, 0),
        COALESCE(NEW.bulk_discount, 0),
        COALESCE(NEW.loyalty_discount, 0)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_booking_total ON bookings;
CREATE TRIGGER trigger_update_booking_total
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_total();

-- 16. Add sample data for testing
INSERT INTO pricing_templates (organization_id, name, description, factors, conditions) 
SELECT 
    o.id,
    'Standard Pricing',
    'Default pricing template with standard rates',
    '{"distanceMultiplier": 1.2, "urgencyMultiplier": 1.0, "seasonalAdjustment": 1.0, "fuelSurcharge": 1.04}',
    '{"minDistance": 0, "maxDistance": 1000, "urgency": "standard"}'
FROM organizations o
ON CONFLICT DO NOTHING;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_organization_payment_date ON bookings(organization_id, payment_type, created_at);
CREATE INDEX IF NOT EXISTS idx_customers_organization_type ON customers(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_articles_organization_active ON articles(organization_id, created_at);

-- Add table comments
COMMENT ON TABLE pricing_templates IS 'Stores configurable pricing templates for dynamic pricing';
COMMENT ON TABLE customer_article_rates IS 'Stores customer-specific rates for articles';
COMMENT ON TABLE invoices IS 'Enhanced invoicing system with detailed financial tracking';
COMMENT ON TABLE revenue_analytics IS 'Pre-computed revenue metrics for performance';
COMMENT ON TABLE revenue_forecasts IS 'AI-generated revenue forecasts and predictions';