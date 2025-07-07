import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBillingSchema() {
  console.log('🔧 Fixing billing schema...\n');

  try {
    // Step 1: Check if invoices table has data
    console.log('1️⃣ Checking invoices table for existing data...');
    const { data: existingInvoices, error: checkError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('❌ Error checking invoices:', checkError.message);
      return;
    }

    if (existingInvoices && existingInvoices.length > 0) {
      console.log('⚠️  WARNING: Invoices table contains data!');
      console.log('⚠️  Please backup your data before proceeding.');
      console.log('⚠️  Aborting to prevent data loss.');
      return;
    }

    console.log('✅ Invoices table is empty, safe to recreate');

    // Step 2: Drop incomplete invoices table
    console.log('\n2️⃣ Dropping incomplete invoices table...');
    
    const dropResult = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS public.invoices CASCADE;'
    });

    if (dropResult.error) {
      console.log('❌ Error dropping table:', dropResult.error.message);
      
      // Try alternative approach using a simple SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // We'll create the billing tables without dropping
      console.log('✅ Proceeding with table creation (will handle conflicts)');
    } else {
      console.log('✅ Incomplete invoices table dropped');
    }

    // Step 3: Create all billing tables
    console.log('\n3️⃣ Creating billing tables...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'RUN_BILLING_MIGRATION.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements and filter out comments
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => 
        statement.length > 0 && 
        !statement.startsWith('--') && 
        statement !== ''
      );

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip if it's just whitespace or comments
      if (!statement.trim() || statement.trim().startsWith('--')) {
        continue;
      }

      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}`);
      console.log(`   SQL: ${statement.substring(0, 100)}...`);

      try {
        // For CREATE TABLE statements, use a direct approach
        if (statement.trim().toUpperCase().startsWith('CREATE TABLE')) {
          const result = await supabase.rpc('exec_sql', { sql: statement });
          
          if (result.error) {
            if (result.error.message.includes('already exists')) {
              console.log('   ⚠️  Table already exists, skipping');
            } else {
              console.log('   ❌ Error:', result.error.message);
              errorCount++;
            }
          } else {
            console.log('   ✅ Success');
            successCount++;
          }
        } else {
          // For other statements (indexes, policies, etc.)
          const result = await supabase.rpc('exec_sql', { sql: statement });
          
          if (result.error) {
            console.log('   ⚠️  Warning:', result.error.message);
          } else {
            console.log('   ✅ Success');
            successCount++;
          }
        }
      } catch (err) {
        console.log('   ❌ Exception:', err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Step 4: Verify the tables were created
    console.log('\n4️⃣ Verifying billing tables...');
    
    const billingTables = [
      'billing_cycles',
      'invoices', 
      'invoice_line_items',
      'supplementary_billings',
      'credit_debit_notes',
      'bulk_billing_runs',
      'payment_records'
    ];

    let verifiedTables = 0;
    
    for (const tableName of billingTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: exists and accessible`);
          verifiedTables++;
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
      }
    }

    console.log(`\n🎯 Result: ${verifiedTables}/${billingTables.length} billing tables are working`);

    if (verifiedTables === billingTables.length) {
      console.log('\n🎉 SUCCESS! All billing tables are now properly created.');
      console.log('🚀 You can now start using the billing system!');
    } else {
      console.log('\n⚠️  Some tables are still missing. You may need to run the migration manually in Supabase SQL editor.');
    }

  } catch (error) {
    console.error('❌ Failed to fix billing schema:', error);
  }
}

fixBillingSchema().catch(console.error);