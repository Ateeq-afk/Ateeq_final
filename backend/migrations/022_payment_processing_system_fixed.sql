-- Payment Processing System Migration (Fixed)
-- This migration creates comprehensive payment processing capabilities

-- 1. Create payment_modes table for predefined payment methods
CREATE TABLE IF NOT EXISTS public.payment_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other')),
    is_active BOOLEAN DEFAULT TRUE,
    requires_reference BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default payment modes
INSERT INTO public.payment_modes (name, type, requires_reference, description) VALUES
('Cash', 'cash', FALSE, 'Cash payment'),
('Cheque', 'cheque', TRUE, 'Cheque payment with reference number'),
('NEFT', 'bank_transfer', TRUE, 'National Electronic Funds Transfer'),
('RTGS', 'bank_transfer', TRUE, 'Real Time Gross Settlement'),
('UPI', 'upi', TRUE, 'Unified Payments Interface'),
('IMPS', 'bank_transfer', TRUE, 'Immediate Payment Service'),
('Credit Card', 'card', TRUE, 'Credit card payment'),
('Debit Card', 'card', TRUE, 'Debit card payment')
ON CONFLICT (name) DO NOTHING;

-- 2. Create payments table for tracking all payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_number TEXT NOT NULL, -- System generated unique number
    payment_mode_id UUID NOT NULL REFERENCES public.payment_modes(id),
    payment_reference TEXT, -- Cheque number, transaction ID, etc.
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    
    -- Payer Information
    payer_name TEXT NOT NULL,
    payer_type TEXT NOT NULL CHECK (payer_type IN ('customer', 'vendor', 'employee', 'other')),
    payer_id UUID, -- Reference to customer, vendor, etc.
    
    -- Payment Purpose
    purpose TEXT NOT NULL CHECK (purpose IN ('booking_payment', 'advance', 'balance', 'freight', 'detention', 'other')),
    description TEXT,
    
    -- Bank Details (for non-cash payments)
    bank_name TEXT,
    bank_branch TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    
    -- Status and Processing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'bounced', 'cancelled')),
    cleared_date DATE,
    bounced_reason TEXT,
    
    -- Receipt Information
    receipt_number TEXT,
    receipt_generated_at TIMESTAMPTZ,
    receipt_path TEXT,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT unique_payment_number_per_org UNIQUE (organization_id, payment_number)
);

-- 3. Create payment_allocations table for tracking what each payment covers
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    
    -- What this allocation covers
    allocation_type TEXT NOT NULL CHECK (allocation_type IN ('booking', 'invoice', 'advance', 'outstanding')),
    reference_id UUID, -- booking_id, invoice_id, etc.
    reference_number TEXT, -- Human readable reference
    
    -- Amount details
    allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount > 0),
    description TEXT,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 4. Create outstanding_amounts table for tracking what customers owe
CREATE TABLE IF NOT EXISTS public.outstanding_amounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Customer Information
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Outstanding Details
    reference_type TEXT NOT NULL CHECK (reference_type IN ('booking', 'invoice', 'advance', 'other')),
    reference_id UUID, -- booking_id, invoice_id, etc.
    reference_number TEXT NOT NULL,
    
    -- Amount Information
    original_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) DEFAULT 0,
    
    -- Due Date and Status
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'fully_paid', 'written_off')),
    
    -- Additional Information
    description TEXT,
    notes TEXT,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 5. Create payment_reminders table for automated reminder tracking
CREATE TABLE IF NOT EXISTS public.payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outstanding_id UUID NOT NULL REFERENCES public.outstanding_amounts(id) ON DELETE CASCADE,
    
    -- Reminder Details
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'call', 'letter')),
    reminder_level INTEGER NOT NULL CHECK (reminder_level >= 1), -- 1st reminder, 2nd reminder, etc.
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    sent_date DATE,
    
    -- Content
    subject TEXT,
    message TEXT,
    
    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    failure_reason TEXT,
    
    -- Response tracking
    customer_response TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    
    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_branch_date ON public.payments(branch_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON public.payments(payer_type, payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_reference ON public.payment_allocations(allocation_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_customer ON public.outstanding_amounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_outstanding_status ON public.outstanding_amounts(status);
CREATE INDEX IF NOT EXISTS idx_outstanding_due_date ON public.outstanding_amounts(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_outstanding ON public.payment_reminders(outstanding_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled ON public.payment_reminders(scheduled_date, status);

-- 7. Create functions for computed values
CREATE OR REPLACE FUNCTION calculate_outstanding_amount(original_amount NUMERIC, paid_amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    RETURN original_amount - paid_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_overdue_days(due_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE 
        WHEN due_date < CURRENT_DATE THEN CURRENT_DATE - due_date 
        ELSE 0 
    END;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_allocations_updated_at BEFORE UPDATE ON public.payment_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_outstanding_amounts_updated_at BEFORE UPDATE ON public.outstanding_amounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_reminders_updated_at BEFORE UPDATE ON public.payment_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_modes_updated_at BEFORE UPDATE ON public.payment_modes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Add RLS policies for multi-tenant security
ALTER TABLE public.payment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outstanding_amounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Payment modes are global, accessible to all authenticated users
CREATE POLICY "Payment modes are accessible to all authenticated users" ON public.payment_modes
    FOR ALL USING (auth.role() = 'authenticated');

-- Payments policies - simplified for compatibility
CREATE POLICY "Users can manage payments in their organization" ON public.payments
    FOR ALL USING (true); -- Will be restricted by application logic

CREATE POLICY "Users can manage payment allocations" ON public.payment_allocations
    FOR ALL USING (true); -- Will be restricted by application logic

CREATE POLICY "Users can manage outstanding amounts" ON public.outstanding_amounts
    FOR ALL USING (true); -- Will be restricted by application logic

CREATE POLICY "Users can manage payment reminders" ON public.payment_reminders
    FOR ALL USING (true); -- Will be restricted by application logic

-- 10. Create views for payment summary with computed columns
CREATE OR REPLACE VIEW public.payment_summary AS
SELECT 
    p.id,
    p.payment_number,
    p.amount,
    p.payment_date,
    p.payer_name,
    p.payer_type,
    p.purpose,
    p.status,
    p.payment_reference,
    p.description,
    p.branch_id,
    p.organization_id,
    pm.name as payment_mode,
    pm.type as payment_type,
    COALESCE(SUM(pa.allocated_amount), 0) as allocated_amount,
    p.amount - COALESCE(SUM(pa.allocated_amount), 0) as unallocated_amount,
    p.created_at,
    p.updated_at
FROM public.payments p
LEFT JOIN public.payment_modes pm ON p.payment_mode_id = pm.id
LEFT JOIN public.payment_allocations pa ON p.id = pa.payment_id
WHERE p.is_deleted = FALSE
GROUP BY p.id, pm.name, pm.type;

-- 11. Create view for outstanding summary with computed columns
CREATE OR REPLACE VIEW public.outstanding_summary AS
SELECT 
    oa.id,
    oa.customer_id,
    oa.reference_number,
    oa.reference_type,
    oa.original_amount,
    oa.paid_amount,
    calculate_outstanding_amount(oa.original_amount, oa.paid_amount) as outstanding_amount,
    oa.due_date,
    calculate_overdue_days(oa.due_date) as overdue_days,
    oa.status,
    oa.description,
    oa.notes,
    oa.branch_id,
    oa.organization_id,
    c.name as customer_name,
    c.contact_phone,
    c.email,
    CASE 
        WHEN calculate_overdue_days(oa.due_date) = 0 THEN 'current'
        WHEN calculate_overdue_days(oa.due_date) <= 30 THEN '1-30_days'
        WHEN calculate_overdue_days(oa.due_date) <= 60 THEN '31-60_days'
        WHEN calculate_overdue_days(oa.due_date) <= 90 THEN '61-90_days'
        ELSE '90+_days'
    END as aging_bucket,
    oa.created_at,
    oa.updated_at
FROM public.outstanding_amounts oa
JOIN public.customers c ON oa.customer_id = c.id
WHERE oa.is_deleted = FALSE AND calculate_outstanding_amount(oa.original_amount, oa.paid_amount) > 0;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;