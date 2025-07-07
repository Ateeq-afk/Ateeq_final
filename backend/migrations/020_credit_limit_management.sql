-- Credit Limit Management Migration
-- This migration adds comprehensive credit management features to the system

-- 1. Add customer category and additional credit fields
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'Regular' 
    CHECK (category IN ('Regular', 'Premium', 'Corporate')),
  ADD COLUMN IF NOT EXISTS current_balance DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_utilized DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_status VARCHAR(20) DEFAULT 'Active' 
    CHECK (credit_status IN ('Active', 'On Hold', 'Blocked', 'Suspended')),
  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'Monthly'
    CHECK (billing_cycle IN ('Weekly', 'Biweekly', 'Monthly', 'Quarterly')),
  ADD COLUMN IF NOT EXISTS next_billing_date DATE,
  ADD COLUMN IF NOT EXISTS auto_invoice BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_pin VARCHAR(6),
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS sla_delivery_hours INTEGER DEFAULT 48,
  ADD COLUMN IF NOT EXISTS sla_complaint_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create credit transactions table to track all credit movements
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    transaction_type VARCHAR(20) NOT NULL 
      CHECK (transaction_type IN ('Booking', 'Payment', 'Adjustment', 'Refund', 'Credit Note', 'Debit Note')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference_type VARCHAR(20), -- 'booking', 'invoice', 'payment', etc.
    reference_id UUID, -- ID of the related booking/invoice/payment
    amount DECIMAL(12,2) NOT NULL,
    balance_before DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_credit_transactions_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_credit_transactions_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_credit_transactions_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 3. Create credit limit history table
CREATE TABLE IF NOT EXISTS credit_limit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    old_limit DECIMAL(12,2),
    new_limit DECIMAL(12,2) NOT NULL,
    changed_by UUID,
    change_reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_credit_limit_history_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 4. Create customer contracts table
CREATE TABLE IF NOT EXISTS customer_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    contract_number VARCHAR(100) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    terms JSONB DEFAULT '{}',
    sla_terms JSONB DEFAULT '{}',
    special_rates JSONB DEFAULT '{}',
    document_url TEXT,
    status VARCHAR(20) DEFAULT 'Active' 
      CHECK (status IN ('Draft', 'Active', 'Expired', 'Terminated')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_customer_contracts_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_contracts_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    UNIQUE(organization_id, contract_number)
);

-- 5. Create billing cycles table
CREATE TABLE IF NOT EXISTS billing_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    invoice_id UUID,
    status VARCHAR(20) DEFAULT 'Open' 
      CHECK (status IN ('Open', 'Invoiced', 'Paid', 'Overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_billing_cycles_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_billing_cycles_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_billing_cycles_invoice 
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- 6. Create customer portal access table
CREATE TABLE IF NOT EXISTS customer_portal_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    access_email VARCHAR(255) NOT NULL,
    access_phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{"view_bookings": true, "view_invoices": true, "make_payments": false}',
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_customer_portal_access_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    UNIQUE(customer_id, access_email)
);

-- 7. Create credit alerts table
CREATE TABLE IF NOT EXISTS credit_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL 
      CHECK (alert_type IN ('Limit Exceeded', 'Near Limit', 'Overdue', 'Large Transaction')),
    alert_level VARCHAR(20) NOT NULL 
      CHECK (alert_level IN ('Info', 'Warning', 'Critical')),
    message TEXT NOT NULL,
    threshold_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    read_by UUID,
    
    CONSTRAINT fk_credit_alerts_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_credit_alerts_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer_date 
  ON credit_transactions(customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference 
  ON credit_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_customers_credit_status 
  ON customers(credit_status) WHERE credit_status != 'Active';
CREATE INDEX IF NOT EXISTS idx_customers_category 
  ON customers(category);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_customer_status 
  ON billing_cycles(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_credit_alerts_unread 
  ON credit_alerts(customer_id, is_read) WHERE is_read = false;

-- 9. Create functions for credit management

-- Function to update customer balance after transaction
CREATE OR REPLACE FUNCTION update_customer_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer's current balance and credit utilized
    UPDATE customers
    SET 
        current_balance = NEW.balance_after,
        credit_utilized = GREATEST(0, NEW.balance_after)
    WHERE id = NEW.customer_id;
    
    -- Check if credit limit is exceeded and create alert
    IF NEW.balance_after > 0 THEN
        DECLARE
            v_credit_limit DECIMAL(12,2);
            v_utilization_percentage DECIMAL(5,2);
        BEGIN
            SELECT credit_limit INTO v_credit_limit
            FROM customers
            WHERE id = NEW.customer_id;
            
            IF v_credit_limit > 0 THEN
                v_utilization_percentage := (NEW.balance_after / v_credit_limit) * 100;
                
                -- Create alert if limit exceeded
                IF NEW.balance_after > v_credit_limit THEN
                    INSERT INTO credit_alerts (
                        organization_id, customer_id, alert_type, alert_level,
                        message, threshold_value, current_value
                    )
                    SELECT 
                        NEW.organization_id, NEW.customer_id, 'Limit Exceeded', 'Critical',
                        'Credit limit exceeded. Current balance: ₹' || NEW.balance_after || ', Limit: ₹' || v_credit_limit,
                        v_credit_limit, NEW.balance_after;
                -- Create warning if near limit (80%)
                ELSIF v_utilization_percentage >= 80 THEN
                    INSERT INTO credit_alerts (
                        organization_id, customer_id, alert_type, alert_level,
                        message, threshold_value, current_value
                    )
                    SELECT 
                        NEW.organization_id, NEW.customer_id, 'Near Limit', 'Warning',
                        'Credit utilization at ' || ROUND(v_utilization_percentage) || '%. Current balance: ₹' || NEW.balance_after,
                        v_credit_limit, NEW.balance_after;
                END IF;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credit balance updates
CREATE TRIGGER update_customer_credit_balance_trigger
AFTER INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_customer_credit_balance();

-- Function to check credit limit before booking
CREATE OR REPLACE FUNCTION check_credit_limit_before_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_balance DECIMAL(12,2);
    v_credit_limit DECIMAL(12,2);
    v_credit_status VARCHAR(20);
BEGIN
    -- Only check for 'To Pay' bookings
    IF NEW.payment_type = 'To Pay' THEN
        SELECT current_balance, credit_limit, credit_status
        INTO v_customer_balance, v_credit_limit, v_credit_status
        FROM customers
        WHERE id = NEW.sender_id;
        
        -- Check if customer credit is blocked
        IF v_credit_status IN ('Blocked', 'Suspended') THEN
            RAISE EXCEPTION 'Customer credit is %. Cannot create booking.', v_credit_status;
        END IF;
        
        -- Check if adding this booking would exceed credit limit
        IF v_credit_limit > 0 AND (v_customer_balance + NEW.total_amount) > v_credit_limit THEN
            -- Allow but put credit on hold
            UPDATE customers
            SET credit_status = 'On Hold'
            WHERE id = NEW.sender_id;
            
            -- Create alert
            INSERT INTO credit_alerts (
                organization_id, customer_id, alert_type, alert_level,
                message, threshold_value, current_value
            )
            VALUES (
                NEW.organization_id, NEW.sender_id, 'Limit Exceeded', 'Critical',
                'Booking would exceed credit limit. Credit status set to On Hold.',
                v_credit_limit, v_customer_balance + NEW.total_amount
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credit limit check
CREATE TRIGGER check_credit_limit_before_booking_trigger
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_credit_limit_before_booking();

-- Function to record credit transaction for booking
CREATE OR REPLACE FUNCTION record_booking_credit_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_balance_before DECIMAL(12,2);
BEGIN
    -- Only record for 'To Pay' bookings
    IF NEW.payment_type = 'To Pay' AND NEW.status = 'confirmed' THEN
        -- Get current balance
        SELECT COALESCE(current_balance, 0) INTO v_balance_before
        FROM customers
        WHERE id = NEW.sender_id;
        
        -- Insert credit transaction
        INSERT INTO credit_transactions (
            organization_id, branch_id, customer_id,
            transaction_type, reference_type, reference_id,
            amount, balance_before, balance_after,
            description, created_by
        )
        VALUES (
            NEW.organization_id, NEW.branch_id, NEW.sender_id,
            'Booking', 'booking', NEW.id,
            NEW.total_amount, v_balance_before, v_balance_before + NEW.total_amount,
            'Booking #' || NEW.cn_no, NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking credit transaction
CREATE TRIGGER record_booking_credit_transaction_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION record_booking_credit_transaction();

-- 10. Create views for credit management

-- Customer credit summary view
CREATE OR REPLACE VIEW customer_credit_summary AS
SELECT 
    c.id,
    c.branch_id,
    c.organization_id,
    c.name,
    c.mobile,
    c.category,
    c.credit_limit,
    c.current_balance,
    c.credit_utilized,
    CASE 
        WHEN c.credit_limit > 0 THEN ROUND((c.credit_utilized / c.credit_limit) * 100, 2)
        ELSE 0
    END as utilization_percentage,
    c.credit_status,
    c.billing_cycle,
    c.next_billing_date,
    c.last_payment_date,
    c.last_payment_amount,
    COUNT(DISTINCT b.id) FILTER (WHERE b.payment_type = 'To Pay' AND b.status = 'delivered' AND b.is_paid = false) as pending_bookings,
    COALESCE(SUM(b.total_amount) FILTER (WHERE b.payment_type = 'To Pay' AND b.status = 'delivered' AND b.is_paid = false), 0) as pending_amount
FROM customers c
LEFT JOIN bookings b ON c.id = b.sender_id
GROUP BY c.id;

-- Overdue customers view
CREATE OR REPLACE VIEW overdue_customers AS
SELECT 
    c.*,
    COUNT(DISTINCT i.id) as overdue_invoices,
    COALESCE(SUM(i.total_amount), 0) as total_overdue_amount,
    MIN(i.due_date) as oldest_due_date,
    CURRENT_DATE - MIN(i.due_date) as max_days_overdue
FROM customers c
INNER JOIN invoices i ON c.id = i.customer_id
WHERE i.status = 'overdue' OR (i.status = 'sent' AND i.due_date < CURRENT_DATE)
GROUP BY c.id;

-- 11. Add RLS policies for new tables
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_limit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (similar to existing patterns)
CREATE POLICY "credit_transactions_branch_isolation" ON credit_transactions
    FOR ALL
    TO authenticated
    USING (
        branch_id IN (
            SELECT branch_id FROM users WHERE id = auth.uid()
            UNION
            SELECT id FROM branches WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'superadmin'
            )
        )
    );

CREATE POLICY "credit_limit_history_customer_access" ON credit_limit_history
    FOR ALL
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE branch_id IN (
                SELECT branch_id FROM users WHERE id = auth.uid()
                UNION
                SELECT id FROM branches WHERE organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'superadmin'
                )
            )
        )
    );

-- Similar policies for other tables...

-- 12. Insert default data for testing
INSERT INTO credit_alerts (organization_id, customer_id, alert_type, alert_level, message, threshold_value, current_value)
SELECT 
    c.organization_id,
    c.id,
    'Near Limit',
    'Warning',
    'Sample alert for testing',
    c.credit_limit,
    c.credit_utilized
FROM customers c
WHERE c.credit_limit > 0 AND c.credit_utilized > c.credit_limit * 0.8
LIMIT 0; -- Don't actually insert, just validate the query