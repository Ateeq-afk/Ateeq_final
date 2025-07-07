-- Migration: Create expense management system (safe version - checks for existing tables)
-- Description: Adds expense tracking, categories, and cost allocation for P&L reporting

-- Only create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Basic information
  expense_number VARCHAR(50) NOT NULL,
  expense_date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  subcategory_id UUID REFERENCES expense_categories(id),
  
  -- Amount details
  base_amount DECIMAL(12,2) NOT NULL CHECK (base_amount > 0),
  tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= base_amount),
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Payment information
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'cheque', 'upi', 'pending')),
  payment_reference VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date DATE,
  
  -- Vendor/payee information
  vendor_name VARCHAR(255) NOT NULL,
  vendor_id UUID REFERENCES customers(id),
  vendor_gstin VARCHAR(15),
  vendor_pan VARCHAR(10),
  
  -- Bill/invoice details
  bill_number VARCHAR(100),
  bill_date DATE,
  has_supporting_document BOOLEAN DEFAULT false,
  document_url TEXT,
  
  -- Allocation details
  allocation_type VARCHAR(50) CHECK (allocation_type IN ('general', 'vehicle', 'route', 'booking', 'driver', 'branch')),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  booking_id UUID REFERENCES bookings(id),
  route_from VARCHAR(255),
  route_to VARCHAR(255),
  
  -- Approval workflow
  approval_status VARCHAR(50) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected', 'cancelled')),
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Additional details
  description TEXT,
  notes TEXT,
  tags TEXT[],
  
  -- Recurring expense info
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_end_date DATE,
  parent_expense_id UUID REFERENCES expenses(id),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(organization_id, expense_number)
);

-- Create indexes only if table was just created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_expenses_org_branch') THEN
    CREATE INDEX idx_expenses_org_branch ON expenses(organization_id, branch_id);
    CREATE INDEX idx_expenses_date ON expenses(expense_date);
    CREATE INDEX idx_expenses_category ON expenses(category_id);
    CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
    CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
    CREATE INDEX idx_expenses_driver ON expenses(driver_id);
    CREATE INDEX idx_expenses_approval ON expenses(approval_status);
    CREATE INDEX idx_expenses_payment ON expenses(payment_status);
  END IF;
END $$;

-- Expense line items table
CREATE TABLE IF NOT EXISTS expense_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  
  item_description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,3) DEFAULT 1,
  unit_price DECIMAL(12,4) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  hsn_code VARCHAR(20),
  sac_code VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_expense_line_items_expense ON expense_line_items(expense_id);

-- Budget allocations table
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  branch_id UUID REFERENCES branches(id),
  
  budget_year INTEGER NOT NULL,
  budget_month INTEGER CHECK (budget_month BETWEEN 1 AND 12),
  budget_quarter INTEGER CHECK (budget_quarter BETWEEN 1 AND 4),
  
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  
  budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('monthly', 'quarterly', 'yearly')),
  allocated_amount DECIMAL(12,2) NOT NULL CHECK (allocated_amount >= 0),
  
  -- Tracking
  utilized_amount DECIMAL(12,2) DEFAULT 0,
  committed_amount DECIMAL(12,2) DEFAULT 0,
  available_amount DECIMAL(12,2) GENERATED ALWAYS AS (allocated_amount - utilized_amount - committed_amount) STORED,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(organization_id, branch_id, budget_year, budget_month, category_id)
);

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_budget_allocations_org ON budget_allocations(organization_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_period ON budget_allocations(budget_year, budget_month);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_category ON budget_allocations(category_id);

-- Cost centers table
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  center_type VARCHAR(50) NOT NULL CHECK (center_type IN ('branch', 'department', 'vehicle', 'route', 'project')),
  
  parent_center_id UUID REFERENCES cost_centers(id),
  branch_id UUID REFERENCES branches(id),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_org ON cost_centers(organization_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_type ON cost_centers(center_type);

-- Expense allocations table
CREATE TABLE IF NOT EXISTS expense_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  cost_center_id UUID NOT NULL REFERENCES cost_centers(id),
  
  allocation_percentage DECIMAL(5,2) CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  allocated_amount DECIMAL(12,2) NOT NULL,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_allocations_expense ON expense_allocations(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_allocations_center ON expense_allocations(cost_center_id);

-- P&L configurations table
CREATE TABLE IF NOT EXISTS pnl_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Revenue categories mapping
  revenue_categories JSONB DEFAULT '[]',
  
  -- Expense categories mapping
  direct_expense_categories UUID[] DEFAULT '{}',
  indirect_expense_categories UUID[] DEFAULT '{}',
  administrative_expense_categories UUID[] DEFAULT '{}',
  
  -- Other income/expense categories
  other_income_categories UUID[] DEFAULT '{}',
  other_expense_categories UUID[] DEFAULT '{}',
  
  -- Depreciation settings
  include_depreciation BOOLEAN DEFAULT true,
  depreciation_method VARCHAR(50) DEFAULT 'straight_line',
  
  -- Tax settings
  tax_rate DECIMAL(5,2) DEFAULT 30,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pnl_configurations_org ON pnl_configurations(organization_id);

-- Financial periods table
CREATE TABLE IF NOT EXISTS financial_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_year INTEGER NOT NULL,
  period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
  period_quarter INTEGER CHECK (period_quarter BETWEEN 1 AND 4),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Closing status
  is_closed BOOLEAN DEFAULT false,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  
  -- Period metrics (computed)
  total_revenue DECIMAL(15,2),
  total_expenses DECIMAL(15,2),
  net_profit DECIMAL(15,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, period_type, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_financial_periods_org ON financial_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_periods_dates ON financial_periods(start_date, end_date);

-- Enable RLS only if not already enabled
DO $$
BEGIN
  -- Check and enable RLS for each table
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'expenses' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'expense_line_items' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE expense_line_items ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'budget_allocations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'cost_centers' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'expense_allocations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'pnl_configurations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE pnl_configurations ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'financial_periods' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS Policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expenses' 
    AND policyname = 'expenses_org_policy'
  ) THEN
    CREATE POLICY "expenses_org_policy" ON expenses
      USING (organization_id = current_setting('app.current_org_id')::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_line_items' 
    AND policyname = 'expense_line_items_org_policy'
  ) THEN
    CREATE POLICY "expense_line_items_org_policy" ON expense_line_items
      USING (expense_id IN (SELECT id FROM expenses WHERE organization_id = current_setting('app.current_org_id')::uuid));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'budget_allocations' 
    AND policyname = 'budget_allocations_org_policy'
  ) THEN
    CREATE POLICY "budget_allocations_org_policy" ON budget_allocations
      USING (organization_id = current_setting('app.current_org_id')::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cost_centers' 
    AND policyname = 'cost_centers_org_policy'
  ) THEN
    CREATE POLICY "cost_centers_org_policy" ON cost_centers
      USING (organization_id = current_setting('app.current_org_id')::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_allocations' 
    AND policyname = 'expense_allocations_org_policy'
  ) THEN
    CREATE POLICY "expense_allocations_org_policy" ON expense_allocations
      USING (expense_id IN (SELECT id FROM expenses WHERE organization_id = current_setting('app.current_org_id')::uuid));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pnl_configurations' 
    AND policyname = 'pnl_configurations_org_policy'
  ) THEN
    CREATE POLICY "pnl_configurations_org_policy" ON pnl_configurations
      USING (organization_id = current_setting('app.current_org_id')::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_periods' 
    AND policyname = 'financial_periods_org_policy'
  ) THEN
    CREATE POLICY "financial_periods_org_policy" ON financial_periods
      USING (organization_id = current_setting('app.current_org_id')::uuid);
  END IF;
END $$;

-- Function to generate expense number
CREATE OR REPLACE FUNCTION generate_expense_number(org_id UUID, branch_id UUID)
RETURNS TEXT AS $$
DECLARE
  expense_count INTEGER;
  expense_number TEXT;
  branch_code TEXT;
BEGIN
  -- Get branch code
  SELECT COALESCE(code, SUBSTRING(name, 1, 3)) INTO branch_code
  FROM branches WHERE id = branch_id;
  
  -- Count existing expenses for this branch
  SELECT COUNT(*) + 1 INTO expense_count
  FROM expenses 
  WHERE organization_id = org_id AND branch_id = branch_id;
  
  -- Generate expense number: EXP-BRANCH-YYYYMM-XXXXX
  expense_number := 'EXP-' || UPPER(branch_code) || '-' || 
                   TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || 
                   LPAD(expense_count::TEXT, 5, '0');
  
  RETURN expense_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate expense number
CREATE OR REPLACE FUNCTION set_expense_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
    NEW.expense_number := generate_expense_number(NEW.organization_id, NEW.branch_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_expense_number ON expenses;
CREATE TRIGGER trigger_set_expense_number
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_expense_number();

-- Function to update budget utilization
CREATE OR REPLACE FUNCTION update_budget_utilization()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.approval_status != 'approved' AND NEW.approval_status = 'approved') THEN
    -- Update budget utilization when expense is approved
    UPDATE budget_allocations
    SET utilized_amount = utilized_amount + NEW.total_amount,
        updated_at = NOW()
    WHERE organization_id = NEW.organization_id
      AND branch_id = NEW.branch_id
      AND category_id = NEW.category_id
      AND budget_year = EXTRACT(YEAR FROM NEW.expense_date)
      AND (
        (budget_type = 'monthly' AND budget_month = EXTRACT(MONTH FROM NEW.expense_date)) OR
        (budget_type = 'quarterly' AND budget_quarter = EXTRACT(QUARTER FROM NEW.expense_date)) OR
        (budget_type = 'yearly')
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_budget_utilization ON expenses;
CREATE TRIGGER trigger_update_budget_utilization
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  WHEN (NEW.approval_status = 'approved')
  EXECUTE FUNCTION update_budget_utilization();

-- Add missing columns to expense_categories if they don't exist
DO $$
BEGIN
  -- Add parent_category_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_categories' 
    AND column_name = 'parent_category_id'
  ) THEN
    ALTER TABLE expense_categories 
    ADD COLUMN parent_category_id UUID REFERENCES expense_categories(id);
  END IF;

  -- Add category_type if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_categories' 
    AND column_name = 'category_type'
  ) THEN
    ALTER TABLE expense_categories 
    ADD COLUMN category_type VARCHAR(50) DEFAULT 'direct' 
    CHECK (category_type IN ('direct', 'indirect', 'capital', 'administrative'));
  END IF;

  -- Add other columns that might be missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_categories' 
    AND column_name = 'code'
  ) THEN
    ALTER TABLE expense_categories 
    ADD COLUMN code VARCHAR(50);
    
    -- Generate codes for existing categories
    UPDATE expense_categories 
    SET code = UPPER(REPLACE(name, ' ', '_'))
    WHERE code IS NULL;
    
    -- Make code NOT NULL after populating
    ALTER TABLE expense_categories 
    ALTER COLUMN code SET NOT NULL;
  END IF;

  -- Add unique constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'expense_categories' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%organization_id%code%'
  ) THEN
    ALTER TABLE expense_categories 
    ADD CONSTRAINT expense_categories_org_code_unique 
    UNIQUE(organization_id, code);
  END IF;
END $$;

-- Insert default expense categories only if they don't exist
INSERT INTO expense_categories (organization_id, name, code, category_type, created_by) 
SELECT 
  o.id,
  cat.name,
  cat.code,
  cat.category_type,
  o.created_by
FROM organizations o
CROSS JOIN (VALUES
  -- Direct expenses
  ('Fuel Expenses', 'FUEL', 'direct'),
  ('Driver Salaries', 'DRIVER_SAL', 'direct'),
  ('Vehicle Maintenance', 'VEH_MAINT', 'direct'),
  ('Toll & Parking', 'TOLL_PARK', 'direct'),
  ('Loading/Unloading Charges', 'LOAD_UNLOAD', 'direct'),
  ('Route Permits', 'ROUTE_PERMIT', 'direct'),
  
  -- Indirect expenses
  ('Office Rent', 'OFFICE_RENT', 'indirect'),
  ('Utilities', 'UTILITIES', 'indirect'),
  ('Insurance Premiums', 'INSURANCE', 'indirect'),
  ('Professional Fees', 'PROF_FEES', 'indirect'),
  ('Marketing & Advertising', 'MARKETING', 'indirect'),
  
  -- Administrative expenses
  ('Admin Salaries', 'ADMIN_SAL', 'administrative'),
  ('Office Supplies', 'OFFICE_SUP', 'administrative'),
  ('Communication', 'COMMUNICATION', 'administrative'),
  ('Bank Charges', 'BANK_CHARGES', 'administrative'),
  ('Legal & Compliance', 'LEGAL_COMP', 'administrative'),
  
  -- Capital expenses
  ('Vehicle Purchase', 'VEH_PURCHASE', 'capital'),
  ('Equipment Purchase', 'EQUIP_PURCHASE', 'capital'),
  ('Software & Technology', 'SOFTWARE', 'capital')
) AS cat(name, code, category_type)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories 
  WHERE organization_id = o.id 
  AND code = cat.code
);

-- Add comments
COMMENT ON TABLE expenses IS 'Comprehensive expense tracking for P&L calculation';
COMMENT ON TABLE budget_allocations IS 'Budget planning and tracking by category and period';
COMMENT ON TABLE cost_centers IS 'Cost allocation centers for detailed profitability analysis';
COMMENT ON TABLE pnl_configurations IS 'Configurable P&L statement templates';
COMMENT ON TABLE financial_periods IS 'Financial reporting periods with closing status';