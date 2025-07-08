import { MigrationRunner } from '../../migration-handler.js';

const sql = `
-- Add compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_error_logs_method_created ON error_logs(method, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_org_created ON error_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_created ON error_logs(user_id, created_at DESC);

-- Add index for frontend errors
CREATE INDEX IF NOT EXISTS idx_error_logs_frontend ON error_logs(method) WHERE method = 'FRONTEND';

-- Add GIN index for JSONB error_details searches
CREATE INDEX IF NOT EXISTS idx_error_logs_details ON error_logs USING GIN (error_details);

-- Add partial index for high-severity errors
CREATE INDEX IF NOT EXISTS idx_error_logs_severe ON error_logs(status_code, created_at DESC) 
WHERE status_code >= 500;

-- Add index for error code analysis
CREATE INDEX IF NOT EXISTS idx_error_logs_code_analysis ON error_logs(error_code, created_at DESC) 
WHERE error_code IS NOT NULL;
`;

const runner = new MigrationRunner();
await runner.executeMigration(sql, 'add_error_logs_performance_indexes');
console.log('Error logs indexes created successfully!');