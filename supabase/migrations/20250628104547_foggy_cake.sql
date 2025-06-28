-- ================================
-- BOOKINGS
-- ================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on bookings" ON public.bookings;
CREATE POLICY "Bookings branch access" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (
          u.branch_id = public.bookings.branch_id OR
          u.branch_id = public.bookings.from_branch OR
          u.branch_id = public.bookings.to_branch
        )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (
          u.branch_id = public.bookings.branch_id OR
          u.branch_id = public.bookings.from_branch OR
          u.branch_id = public.bookings.to_branch
        )
    )
  );

-- ================================
-- CUSTOMERS
-- ================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
CREATE POLICY "Customers branch access" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.customers.branch_id
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.customers.branch_id
    )
  );

-- ================================
-- ARTICLES
-- ================================
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on articles" ON public.articles;
CREATE POLICY "Articles branch access" ON public.articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.articles.branch_id
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.articles.branch_id
    )
  );

-- ================================
-- VEHICLES
-- ================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on vehicles" ON public.vehicles;
CREATE POLICY "Vehicles branch access" ON public.vehicles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.vehicles.branch_id
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.vehicles.branch_id
    )
  );

-- ================================
-- LOADING SESSIONS
-- ================================
ALTER TABLE public.loading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on loading_sessions" ON public.loading_sessions;
CREATE POLICY "Loading sessions branch access" ON public.loading_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND (
        u.branch_id = public.loading_sessions.from_branch_id OR
        u.branch_id = public.loading_sessions.to_branch_id
      )
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND (
        u.branch_id = public.loading_sessions.from_branch_id OR
        u.branch_id = public.loading_sessions.to_branch_id
      )
    )
  );

-- ================================
-- UNLOADING SESSIONS
-- ================================
ALTER TABLE public.unloading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on unloading_sessions" ON public.unloading_sessions;
CREATE POLICY "Unloading sessions branch access" ON public.unloading_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.unloading_sessions.branch_id
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.unloading_sessions.branch_id
    )
  );

-- ================================
-- POD RECORDS
-- ================================
ALTER TABLE public.pod_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on pod_records" ON public.pod_records;
CREATE POLICY "POD records branch access" ON public.pod_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.bookings b ON b.id = public.pod_records.booking_id
      WHERE u.id = auth.uid() AND (
        u.branch_id = b.branch_id OR
        u.branch_id = b.from_branch OR
        u.branch_id = b.to_branch
      )
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.bookings b ON b.id = public.pod_records.booking_id
      WHERE u.id = auth.uid() AND (
        u.branch_id = b.branch_id OR
        u.branch_id = b.from_branch OR
        u.branch_id = b.to_branch
      )
    )
  );

-- ================================
-- EXPENSES
-- ================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;
CREATE POLICY "Expenses branch access" ON public.expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.expenses.branch_id
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.expenses.branch_id
    )
  );

-- ================================
-- VENDORS
-- ================================
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on vendors" ON public.vendors;
CREATE POLICY "Vendors branch access" ON public.vendors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.vendors.branch_id
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.branch_id = public.vendors.branch_id
    )
  );

-- ================================
-- USER PREFERENCES
-- ================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update preferences" ON public.user_preferences;
CREATE POLICY "User preferences access" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ================================
-- ORGANIZATIONS AND BRANCHES
-- ================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on organizations" ON public.organizations;
CREATE POLICY "Organization admin access" ON public.organizations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on branches" ON public.branches;
CREATE POLICY "Branch admin access" ON public.branches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on subscription_plans" ON public.subscription_plans;
CREATE POLICY "Subscription plan admin access" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on organization_subscriptions" ON public.organization_subscriptions;
CREATE POLICY "Organization subscription admin access" ON public.organization_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );