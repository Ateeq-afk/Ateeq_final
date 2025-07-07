# Migration Instructions for Claude Instances

## Quick Migration Guide

When you need to make database changes, you can now create and execute migrations automatically. Here's how:

### 1. Direct SQL Migration

```javascript
import { MigrationRunner } from './migration-handler.js';
const runner = new MigrationRunner();

// Execute any SQL migration
const result = await runner.executeMigration(`
  CREATE TABLE example (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
  );
`, 'create_example_table');

console.log(result.success ? 'Migration successful' : `Failed: ${result.error}`);
```

### 2. Using Helper Functions

```javascript
import helpers from './migration-helpers.js';

// Create a new table with all standard fields
await helpers.createTable('new_feature', [
  { name: 'title', type: 'VARCHAR(255)', notNull: true },
  { name: 'status', type: 'VARCHAR(50)', default: "'active'" },
  { name: 'data', type: 'JSONB' }
], {
  includeTimestamps: true,
  includeBranchId: true,
  indexes: ['status', 'branch_id,created_at']
});

// Add a column to existing table
await helpers.addColumn('bookings', {
  name: 'new_field',
  type: 'VARCHAR(100)',
  default: "'pending'",
  index: true
});
```

### 3. Command Line Usage

```bash
# Run SQL directly
node auto-migrate.js sql "ALTER TABLE bookings ADD COLUMN priority INTEGER DEFAULT 0" add_priority_to_bookings

# Run from SQL file
node auto-migrate.js sql ./custom-migration.sql my_custom_migration

# Interactive mode
node auto-migrate.js
```

## Important Notes

1. **Environment Variables Required**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Migration files are automatically created** in `/backend/migrations/` with timestamps

3. **Safety checks prevent dangerous operations** like DROP DATABASE

4. **For complex migrations**, create the SQL first and review:
   ```javascript
   // Just create the file without executing
   const { filename } = await runner.createMigrationFile('complex_migration', complexSQL);
   // Review the file, then execute if correct
   const result = await runner.executeMigration(complexSQL, 'complex_migration');
   ```

## Common Migration Patterns

### Add Table with RLS
```javascript
await helpers.executeMigration('add_feature_with_rls', `
  -- Create table
  CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Enable RLS
  ALTER TABLE features ENABLE ROW LEVEL SECURITY;

  -- Add policy
  CREATE POLICY "features_branch_isolation" ON features
    FOR ALL USING (
      branch_id IN (
        SELECT branch_id FROM users WHERE id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
      )
    );

  -- Add index
  CREATE INDEX idx_features_branch_id ON features(branch_id);
`);
```

### Add Trigger
```javascript
await helpers.addUpdatedAtTrigger('table_name');
```

### Modify Column
```javascript
await helpers.executeMigration('modify_column_type', `
  ALTER TABLE bookings 
  ALTER COLUMN amount TYPE DECIMAL(12,2);
`);
```

## Troubleshooting

1. **If exec_sql is not set up**: The system will warn you. Run `node setup-exec-sql.js` to see the required SQL.

2. **If migration fails**: Check `/backend/migrations/` for the generated SQL file to debug.

3. **For rollbacks**: Create a reverse migration with the undo SQL.

## Best Practices

1. **Always test migrations locally first**
2. **Use descriptive migration names**
3. **Include comments in complex SQL**
4. **Keep migrations focused and atomic**
5. **Use the helper functions for consistency**

## Example: Adding a Complete Feature

```javascript
// When adding a new feature that needs database changes:
import helpers from './migration-helpers.js';

// 1. Create the main table
await helpers.createTable('notifications', [
  { name: 'user_id', type: 'UUID', notNull: true, references: 'users(id)' },
  { name: 'type', type: 'VARCHAR(50)', notNull: true },
  { name: 'title', type: 'VARCHAR(255)', notNull: true },
  { name: 'message', type: 'TEXT' },
  { name: 'read', type: 'BOOLEAN', default: 'false' },
  { name: 'data', type: 'JSONB' }
], {
  includeTimestamps: true,
  includeBranchId: true,
  indexes: ['user_id', 'type', 'read', 'created_at DESC']
});

// 2. Add any additional indexes
await helpers.createIndex('notifications', ['branch_id', 'created_at'], {
  where: 'read = false'
});

// 3. Add updated_at trigger
await helpers.addUpdatedAtTrigger('notifications');

// 4. Add any views or functions
await helpers.executeMigration('add_unread_notifications_view', `
  CREATE VIEW unread_notifications AS
  SELECT * FROM notifications 
  WHERE read = false 
  ORDER BY created_at DESC;
`);
```

Remember: All migrations are automatically saved with timestamps, so you have a complete audit trail of all database changes!