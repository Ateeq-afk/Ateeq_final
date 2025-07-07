-- Diagnostic queries to check why data isn't showing
-- Run these in Supabase SQL Editor

-- 1. Check if RLS is enabled on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('payments', 'bookings', 'customers', 'vehicles', 'ogpl', 'invoices')
ORDER BY tablename;

-- 2. Count records in key tables
SELECT 'payments' as table_name, COUNT(*) as record_count FROM public.payments
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'vehicles', COUNT(*) FROM public.vehicles
UNION ALL
SELECT 'payment_modes', COUNT(*) FROM public.payment_modes
UNION ALL
SELECT 'branches', COUNT(*) FROM public.branches
UNION ALL
SELECT 'organizations', COUNT(*) FROM public.organizations
ORDER BY table_name;

-- 3. Check if there are any users
SELECT id, email, raw_user_meta_data->>'role' as role 
FROM auth.users 
LIMIT 10;

-- 4. Check payment modes (should be visible to all)
SELECT * FROM public.payment_modes;

-- 5. Check if branches exist
SELECT id, name, organization_id 
FROM public.branches 
LIMIT 10;

-- 6. Check a sample of payments (without RLS)
SELECT 
    p.id,
    p.payment_number,
    p.amount,
    p.payment_date,
    p.branch_id,
    p.organization_id,
    p.created_at
FROM public.payments p
LIMIT 10;

-- 7. Test RLS by checking what current user can see
-- First, show current user
SELECT auth.uid(), auth.role();

-- 8. Check user_branches association
SELECT 
    ub.user_id,
    ub.branch_id,
    u.email,
    b.name as branch_name
FROM public.user_branches ub
JOIN auth.users u ON u.id = ub.user_id
JOIN public.branches b ON b.id = ub.branch_id
LIMIT 10;