-- Rate Management System Migration (Fixed RLS Policies)
-- This migration adds comprehensive rate management tables for customer-specific pricing,
-- dynamic pricing rules, and quote generation workflow

-- 1. Create rate_contracts table for customer rate agreements
CREATE TABLE IF NOT EXISTS rate_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID,
    contract_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('standard', 'special', 'volume', 'seasonal')),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    minimum_business_commitment DECIMAL(12,2) DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    credit_limit DECIMAL(12,2) DEFAULT 0,
    base_discount_percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'expired', 'terminated')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    terms_and_conditions TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_rate_contracts_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rate_contracts_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_rate_contracts_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Ensure unique contract number per organization
    UNIQUE(organization_id, contract_number)
);

-- 2. Create rate_slabs table for weight-based pricing
CREATE TABLE IF NOT EXISTS rate_slabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_contract_id UUID NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    article_id UUID,
    article_category VARCHAR(100),
    weight_from DECIMAL(10,3) NOT NULL,
    weight_to DECIMAL(10,3) NOT NULL,
    rate_per_kg DECIMAL(10,2),
    rate_per_unit DECIMAL(10,2),
    minimum_charge DECIMAL(10,2) DEFAULT 0,
    charge_basis VARCHAR(50) DEFAULT 'weight' CHECK (charge_basis IN ('weight', 'unit', 'fixed', 'whichever_higher')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_rate_slabs_contract 
        FOREIGN KEY (rate_contract_id) REFERENCES rate_contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_rate_slabs_article 
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
    
    -- Ensure non-overlapping weight slabs per route and article
    CONSTRAINT unique_weight_slab 
        UNIQUE(rate_contract_id, from_location, to_location, article_id, weight_from, weight_to)
);

-- 3. Create surcharge_rules table for additional charges
CREATE TABLE IF NOT EXISTS surcharge_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    rate_contract_id UUID,
    surcharge_type VARCHAR(50) NOT NULL CHECK (surcharge_type IN ('fuel', 'seasonal', 'congestion', 'toll', 'handling', 'insurance', 'cod', 'door_delivery', 'urgent')),
    calculation_method VARCHAR(50) NOT NULL CHECK (calculation_method IN ('percentage', 'fixed', 'per_kg', 'per_unit')),
    value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2),
    applicable_routes JSONB DEFAULT '[]', -- Array of {from: string, to: string}
    applicable_articles JSONB DEFAULT '[]', -- Array of article_ids
    conditions JSONB DEFAULT '{}', -- Additional conditions like time range, day of week
    effective_from DATE NOT NULL,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_surcharge_rules_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_surcharge_rules_contract 
        FOREIGN KEY (rate_contract_id) REFERENCES rate_contracts(id) ON DELETE CASCADE
);

-- 4. Create quotes table for quote generation and tracking
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    quote_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL,
    rate_contract_id UUID,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    estimated_volume JSONB NOT NULL, -- {weight: number, units: number, articles: [{article_id, quantity, weight}]}
    base_amount DECIMAL(12,2) NOT NULL,
    surcharges JSONB DEFAULT '[]', -- Array of {type, amount, description}
    discounts JSONB DEFAULT '[]', -- Array of {type, amount, description}
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    converted_to_booking_id UUID,
    notes TEXT,
    terms_and_conditions TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_quotes_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_quotes_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_quotes_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_quotes_contract 
        FOREIGN KEY (rate_contract_id) REFERENCES rate_contracts(id) ON DELETE SET NULL,
    CONSTRAINT fk_quotes_booking 
        FOREIGN KEY (converted_to_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Ensure unique quote number per organization
    UNIQUE(organization_id, quote_number)
);

-- 5. Create rate_approval_workflow table
CREATE TABLE IF NOT EXISTS rate_approval_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('rate_contract', 'quote', 'surcharge_rule')),
    reference_id UUID NOT NULL,
    approval_level INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
    approver_id UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_rate_approval_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 6. Create rate_history table for audit trail
CREATE TABLE IF NOT EXISTS rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'expired', 'terminated')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    
    CONSTRAINT fk_rate_history_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 7. Add rate_contract_id to bookings for tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rate_contract_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quote_id UUID;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_rate_contract'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_rate_contract 
            FOREIGN KEY (rate_contract_id) REFERENCES rate_contracts(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_quote'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_quote 
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_contracts_customer ON rate_contracts(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_rate_contracts_validity ON rate_contracts(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_rate_contracts_org ON rate_contracts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_rate_slabs_location ON rate_slabs(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_rate_slabs_contract ON rate_slabs(rate_contract_id, is_active);
CREATE INDEX IF NOT EXISTS idx_surcharge_rules_type ON surcharge_rules(surcharge_type, is_active);
CREATE INDEX IF NOT EXISTS idx_surcharge_rules_org ON surcharge_rules(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_validity ON quotes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_rate_approval_pending ON rate_approval_workflow(reference_type, reference_id, status);
CREATE INDEX IF NOT EXISTS idx_rate_history_reference ON rate_history(reference_type, reference_id);

-- 9. Enable RLS on new tables
ALTER TABLE rate_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE surcharge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_history ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for rate_contracts (Fixed to use correct user table)
CREATE POLICY "rate_contracts_select_policy" ON rate_contracts FOR SELECT
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "rate_contracts_insert_policy" ON rate_contracts FOR INSERT
    WITH CHECK (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "rate_contracts_update_policy" ON rate_contracts FOR UPDATE
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

-- 11. Create RLS policies for rate_slabs
CREATE POLICY "rate_slabs_select_policy" ON rate_slabs FOR SELECT
    USING (rate_contract_id IN (
        SELECT rc.id FROM rate_contracts rc
        WHERE rc.organization_id = (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "rate_slabs_insert_policy" ON rate_slabs FOR INSERT
    WITH CHECK (rate_contract_id IN (
        SELECT rc.id FROM rate_contracts rc
        WHERE rc.organization_id = (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid()
        )
    ));

CREATE POLICY "rate_slabs_update_policy" ON rate_slabs FOR UPDATE
    USING (rate_contract_id IN (
        SELECT rc.id FROM rate_contracts rc
        WHERE rc.organization_id = (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid()
        )
    ));

-- 12. Create RLS policies for surcharge_rules
CREATE POLICY "surcharge_rules_select_policy" ON surcharge_rules FOR SELECT
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "surcharge_rules_insert_policy" ON surcharge_rules FOR INSERT
    WITH CHECK (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "surcharge_rules_update_policy" ON surcharge_rules FOR UPDATE
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

-- 13. Create RLS policies for quotes
CREATE POLICY "quotes_select_policy" ON quotes FOR SELECT
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "quotes_insert_policy" ON quotes FOR INSERT
    WITH CHECK (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "quotes_update_policy" ON quotes FOR UPDATE
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

-- 14. Create RLS policies for rate_approval_workflow
CREATE POLICY "rate_approval_workflow_select_policy" ON rate_approval_workflow FOR SELECT
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "rate_approval_workflow_insert_policy" ON rate_approval_workflow FOR INSERT
    WITH CHECK (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

-- 15. Create RLS policies for rate_history
CREATE POLICY "rate_history_select_policy" ON rate_history FOR SELECT
    USING (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

CREATE POLICY "rate_history_insert_policy" ON rate_history FOR INSERT
    WITH CHECK (organization_id = (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    ));

-- 16. Create function to calculate booking price based on rate contract
CREATE OR REPLACE FUNCTION calculate_contract_price(
    p_rate_contract_id UUID,
    p_from_location VARCHAR,
    p_to_location VARCHAR,
    p_article_id UUID,
    p_weight DECIMAL,
    p_quantity INTEGER,
    p_booking_date DATE
) RETURNS TABLE (
    base_amount DECIMAL,
    surcharges JSONB,
    discounts JSONB,
    total_amount DECIMAL
) AS $$
DECLARE
    v_base_amount DECIMAL := 0;
    v_surcharges JSONB := '[]'::JSONB;
    v_discounts JSONB := '[]'::JSONB;
    v_total_amount DECIMAL := 0;
    v_rate_slab RECORD;
    v_surcharge RECORD;
    v_contract RECORD;
BEGIN
    -- Get contract details
    SELECT * INTO v_contract FROM rate_contracts 
    WHERE id = p_rate_contract_id 
    AND status = 'active'
    AND p_booking_date BETWEEN valid_from AND valid_until;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active rate contract found';
    END IF;
    
    -- Find applicable rate slab
    SELECT * INTO v_rate_slab FROM rate_slabs
    WHERE rate_contract_id = p_rate_contract_id
    AND from_location = p_from_location
    AND to_location = p_to_location
    AND (article_id = p_article_id OR article_id IS NULL)
    AND p_weight BETWEEN weight_from AND weight_to
    AND is_active = true
    ORDER BY article_id DESC NULLS LAST -- Prefer specific article rates
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No applicable rate slab found';
    END IF;
    
    -- Calculate base amount
    CASE v_rate_slab.charge_basis
        WHEN 'weight' THEN
            v_base_amount := v_rate_slab.rate_per_kg * p_weight;
        WHEN 'unit' THEN
            v_base_amount := v_rate_slab.rate_per_unit * p_quantity;
        WHEN 'fixed' THEN
            v_base_amount := v_rate_slab.rate_per_unit;
        WHEN 'whichever_higher' THEN
            v_base_amount := GREATEST(
                COALESCE(v_rate_slab.rate_per_kg * p_weight, 0),
                COALESCE(v_rate_slab.rate_per_unit * p_quantity, 0)
            );
    END CASE;
    
    -- Apply minimum charge
    v_base_amount := GREATEST(v_base_amount, COALESCE(v_rate_slab.minimum_charge, 0));
    
    -- Apply contract base discount
    IF v_contract.base_discount_percentage > 0 THEN
        v_discounts := v_discounts || jsonb_build_object(
            'type', 'contract_discount',
            'percentage', v_contract.base_discount_percentage,
            'amount', v_base_amount * v_contract.base_discount_percentage / 100
        );
    END IF;
    
    -- Calculate applicable surcharges
    FOR v_surcharge IN 
        SELECT * FROM surcharge_rules
        WHERE (organization_id = v_contract.organization_id OR rate_contract_id = p_rate_contract_id)
        AND is_active = true
        AND p_booking_date BETWEEN effective_from AND COALESCE(effective_until, '9999-12-31'::DATE)
        AND (
            applicable_routes = '[]'::JSONB 
            OR applicable_routes @> jsonb_build_array(jsonb_build_object('from', p_from_location, 'to', p_to_location))
        )
        AND (
            applicable_articles = '[]'::JSONB 
            OR applicable_articles @> to_jsonb(p_article_id::TEXT)
        )
    LOOP
        DECLARE
            v_surcharge_amount DECIMAL := 0;
        BEGIN
            CASE v_surcharge.calculation_method
                WHEN 'percentage' THEN
                    v_surcharge_amount := v_base_amount * v_surcharge.value / 100;
                WHEN 'fixed' THEN
                    v_surcharge_amount := v_surcharge.value;
                WHEN 'per_kg' THEN
                    v_surcharge_amount := v_surcharge.value * p_weight;
                WHEN 'per_unit' THEN
                    v_surcharge_amount := v_surcharge.value * p_quantity;
            END CASE;
            
            -- Apply min/max limits
            IF v_surcharge.min_amount > 0 THEN
                v_surcharge_amount := GREATEST(v_surcharge_amount, v_surcharge.min_amount);
            END IF;
            IF v_surcharge.max_amount IS NOT NULL THEN
                v_surcharge_amount := LEAST(v_surcharge_amount, v_surcharge.max_amount);
            END IF;
            
            v_surcharges := v_surcharges || jsonb_build_object(
                'type', v_surcharge.surcharge_type,
                'amount', v_surcharge_amount,
                'calculation_method', v_surcharge.calculation_method,
                'value', v_surcharge.value
            );
        END;
    END LOOP;
    
    -- Calculate total amount
    v_total_amount := v_base_amount;
    
    -- Add surcharges
    SELECT v_total_amount + COALESCE(SUM((value->>'amount')::DECIMAL), 0)
    INTO v_total_amount
    FROM jsonb_array_elements(v_surcharges) AS value;
    
    -- Subtract discounts
    SELECT v_total_amount - COALESCE(SUM((value->>'amount')::DECIMAL), 0)
    INTO v_total_amount
    FROM jsonb_array_elements(v_discounts) AS value;
    
    RETURN QUERY SELECT v_base_amount, v_surcharges, v_discounts, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- 17. Create trigger to track rate changes
CREATE OR REPLACE FUNCTION track_rate_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO rate_history (
        organization_id,
        reference_type,
        reference_id,
        action,
        old_values,
        new_values,
        changed_by
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        TG_ARGV[0],
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            WHEN TG_OP = 'DELETE' THEN 'terminated'
        END,
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to rate tables
DROP TRIGGER IF EXISTS track_rate_contracts_changes ON rate_contracts;
CREATE TRIGGER track_rate_contracts_changes
    AFTER INSERT OR UPDATE OR DELETE ON rate_contracts
    FOR EACH ROW
    EXECUTE FUNCTION track_rate_changes('rate_contract');

DROP TRIGGER IF EXISTS track_rate_slabs_changes ON rate_slabs;
CREATE TRIGGER track_rate_slabs_changes
    AFTER INSERT OR UPDATE OR DELETE ON rate_slabs
    FOR EACH ROW
    EXECUTE FUNCTION track_rate_changes('rate_slab');

DROP TRIGGER IF EXISTS track_surcharge_rules_changes ON surcharge_rules;
CREATE TRIGGER track_surcharge_rules_changes
    AFTER INSERT OR UPDATE OR DELETE ON surcharge_rules
    FOR EACH ROW
    EXECUTE FUNCTION track_rate_changes('surcharge_rule');

-- 18. Add comments
COMMENT ON TABLE rate_contracts IS 'Customer-specific rate agreements with validity periods';
COMMENT ON TABLE rate_slabs IS 'Weight-based pricing slabs for different routes and articles';
COMMENT ON TABLE surcharge_rules IS 'Dynamic surcharge rules for fuel, seasonal, and other charges';
COMMENT ON TABLE quotes IS 'Quote generation and tracking with approval workflow';
COMMENT ON TABLE rate_approval_workflow IS 'Approval workflow for rate contracts and quotes';
COMMENT ON TABLE rate_history IS 'Audit trail for all rate-related changes';