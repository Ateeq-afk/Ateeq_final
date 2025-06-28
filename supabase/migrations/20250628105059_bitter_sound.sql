/*
  # Audit Logs RLS Policies

  1. Security
    - Enable RLS on audit_logs table
    - Create policy to allow only admin users to view audit logs
    - Ensure proper access control for sensitive audit information
*/

-- ================================
-- AUDIT LOGS
-- ================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop the existing broad policy
DROP POLICY IF EXISTS "Allow all operations on audit_logs" ON public.audit_logs;

-- Create a new policy for SELECT access only for admins
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Create a policy for INSERT operations - all authenticated users can create audit logs
CREATE POLICY "Allow authenticated users to create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No UPDATE or DELETE policies - audit logs should be immutable