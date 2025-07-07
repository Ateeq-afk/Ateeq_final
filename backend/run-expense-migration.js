const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runExpenseMigration() {
  console.log('🚀 Running expense management migration...\n');

  try {
    // Read the safe migration file
    const migrationPath = path.join(__dirname, 'migrations', '029_create_expense_management_system_safe.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements (basic split by semicolon)
    const statements = migrationSQL
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments-only statements
      if (statement.startsWith('--') && !statement.includes('\n')) {
        continue;
      }

      // Extract first line for logging
      const firstLine = statement.split('\n')[0].substring(0, 80);
      console.log(`Executing [${i + 1}/${statements.length}]: ${firstLine}...`);

      try {
        // Try to execute via RPC first
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // If RPC fails, log it but continue
          console.log('  ⚠️  RPC not available, statement may need manual execution');
          console.log(`  Error: ${error.message}`);
          errorCount++;
        } else {
          console.log('  ✅ Success');
          successCount++;
        }
      } catch (err) {
        console.log('  ❌ Error:', err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This is expected if:');
      console.log('   1. The exec_sql function is not available');
      console.log('   2. Tables/columns already exist');
      console.log('   3. You need to run the migration directly in Supabase SQL editor');
      console.log('\n📋 Migration file location:');
      console.log(`   ${migrationPath}`);
      console.log('\n💡 To run manually:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the migration file contents');
      console.log('   4. Click "Run"');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if we have the required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Please check your .env file in the backend directory');
  process.exit(1);
}

// Run the migration
runExpenseMigration();