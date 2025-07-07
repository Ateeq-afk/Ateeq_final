# Automated Migration System for Supabase

This migration system allows you to create and execute database migrations automatically while keeping an audit trail of all changes.

## Setup

1. **Environment Variables**
   Ensure these are set in your `.env` file:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Enable SQL Execution**
   Run the setup script to see the SQL needed for your Supabase instance:
   ```bash
   node setup-exec-sql.js
   ```
   
   Copy the SQL output and run it in your Supabase SQL editor to enable the `exec_sql` function.

## Usage

### Interactive Mode
```bash
node auto-migrate.js
```

### Command Line Mode
```bash
# Execute inline SQL
node auto-migrate.js sql "CREATE TABLE test (id UUID PRIMARY KEY)" create_test_table

# Execute SQL from file
node auto-migrate.js sql ./my-migration.sql descriptive_name

# List all migrations
node auto-migrate.js list
```

### Using Migration Helpers

```javascript
const helpers = require('./migration-helpers');

// Create a table
await helpers.createTable('products', [
  { name: 'name', type: 'VARCHAR(255)', notNull: true },
  { name: 'price', type: 'DECIMAL(10,2)', notNull: true },
  { name: 'category_id', type: 'UUID', references: 'categories(id)' }
], {
  includeTimestamps: true,
  includeBranchId: true,
  indexes: ['category_id', 'branch_id,created_at']
});

// Add a column
await helpers.addColumn('products', {
  name: 'sku',
  type: 'VARCHAR(50)',
  unique: true,
  index: true
});

// Create an index
await helpers.createIndex('products', ['name', 'category_id'], { unique: false });

// Execute custom SQL
await helpers.executeMigration('add_product_view', `
  CREATE VIEW active_products AS
  SELECT * FROM products WHERE deleted_at IS NULL;
`);
```

## Features

- **Automatic Timestamping**: Migration files are timestamped for proper ordering
- **Safety Checks**: Prevents dangerous operations like DROP DATABASE
- **Multi-tenant Support**: Automatically adds branch_id/org_id columns and RLS policies
- **Audit Trail**: All migrations are saved as .sql files in the migrations directory
- **Helper Functions**: Convenient methods for common operations
- **Error Handling**: Clear error messages and rollback information

## Migration File Format

Migration files are saved as:
```
YYYYMMDDHHMMSS_migration_name.sql
```

Example: `20240115143052_create_products_table.sql`

## Best Practices

1. Always test migrations in a development environment first
2. Use descriptive names for migrations
3. Keep migrations small and focused
4. Include both UP and DOWN migrations when possible
5. Use the helper functions for consistency
6. Review generated SQL before execution

## Troubleshooting

If migrations fail:
1. Check the error message in the console
2. Review the generated SQL file in the migrations directory
3. Ensure your database user has sufficient permissions
4. Verify RLS policies aren't blocking the operation

## Direct Database Access

If the `exec_sql` function isn't available, you can:
1. Copy the generated SQL from the migrations directory
2. Run it manually in the Supabase SQL editor
3. The system will still track the migration file for audit purposes