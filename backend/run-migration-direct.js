const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 Direct Migration Runner');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrationDirect() {
  console.log('\n🚀 Running expense management migration directly...\n');

  try {
    // First, let's check if we can connect
    const { data: connectionTest, error: connectionError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (connectionError) {
      console.log('Connection test result:', connectionError.message);
    } else {
      console.log('✅ Connected to Supabase successfully');
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '029_create_expense_management_system_safe.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('File size:', migrationSQL.length, 'characters');

    // Since exec_sql is not available, let's try to create the tables one by one using the REST API
    // First, let's execute the setup function
    console.log('\n🔧 Setting up exec_sql function...');
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

    console.log('Setup function response status:', setupResult.status);
    
    if (!setupResult.ok) {
      console.log('⚠️ Could not setup exec_sql function via REST API');
      console.log('This is expected - you may need to run the migration manually in Supabase');
    }

    // Now try with the exec_sql function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.log('⚠️ RPC exec_sql failed:', error.message);
      console.log('\n📋 Manual migration required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the following file contents:');
      console.log(`   ${migrationPath}`);
      console.log('4. Click "Run"');
      
      // Let's also try basic table creation to check if some tables exist
      console.log('\n🔍 Checking if expense tables already exist...');
      
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
            console.log(`  ✅ Table '${tableName}' exists and accessible`);
          } else {
            console.log(`  ❌ Table '${tableName}' not accessible:`, tableError.message);
          }
        } catch (err) {
          console.log(`  ❌ Table '${tableName}' check failed:`, err.message);
        }
      }
    } else {
      console.log('✅ Migration executed successfully via RPC!');
      console.log('Result:', data);
    }

  } catch (error) {
    console.error('\n❌ Migration execution failed:', error.message);
    console.log('\n📋 Manual steps required:');
    console.log('1. Copy migrations/000_setup_exec_sql.sql to Supabase SQL Editor and run it');
    console.log('2. Copy migrations/029_create_expense_management_system_safe.sql to Supabase SQL Editor and run it');
  }
}

runMigrationDirect();