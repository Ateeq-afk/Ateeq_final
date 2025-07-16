const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrationDirect() {

  try {
    // First, let's check if we can connect
    const { data: connectionTest, error: connectionError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (connectionError) {
    } else {
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '029_create_expense_management_system_safe.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');


    // Since exec_sql is not available, let's try to create the tables one by one using the REST API
    // First, let's execute the setup function
    const setupSQL = fs.readFileSync(path.join(__dirname, 'migrations', '000_setup_exec_sql.sql'), 'utf8');
    
    // Try to execute setup using REST API directly
    const setupResult = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: setupSQL })
    });

    
    if (!setupResult.ok) {
    }

    // Now try with the exec_sql function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      
      // Let's also try basic table creation to check if some tables exist
      
      const tableChecks = [
        'expense_categories',
        'expenses', 
        'expense_line_items',
        'budget_allocations',
        'cost_centers'
      ];

      for (const tableName of tableChecks) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!tableError) {
          } else {
          }
        } catch (err) {
        }
      }
    } else {
    }

  } catch (error) {
    console.error('\n❌ Migration execution failed:', error.message);
  }
}

runMigrationDirect();