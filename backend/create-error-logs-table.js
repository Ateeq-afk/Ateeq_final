import { MigrationRunner } from './migration-handler.js';

const sql = `
-- Create error_logs table for centralized error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  method TEXT,
  url TEXT,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  branch_id UUID REFERENCES branches(id),
  error_message TEXT NOT NULL,
  error_code TEXT,
  status_code INTEGER,
  error_details JSONB,
  request_body JSONB,
  request_query JSONB,
  request_params JSONB,
  ip_address TEXT,
  user_agent TEXT
);

-- Add indexes for faster queries
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_organization_id ON error_logs(organization_id);
CREATE INDEX idx_error_logs_branch_id ON error_logs(branch_id);
CREATE INDEX idx_error_logs_status_code ON error_logs(status_code);
CREATE INDEX idx_error_logs_error_code ON error_logs(error_code);

-- Add RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow superadmins to view all error logs
CREATE POLICY "Superadmins can view all error logs" ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Allow admins to view error logs from their organization
CREATE POLICY "Admins can view organization error logs" ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow service role full access
CREATE POLICY "Service role has full access" ON error_logs
  FOR ALL
  TO service_role
  USING (true);
`;

const runner = new MigrationRunner();
await runner.executeMigration(sql, 'create_error_logs_table');
console.log('Error logs table created successfully!');