import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function checkBillingTables() {
  console.log('🔍 Checking existing billing tables...\n');

  const billingTables = [
    'billing_cycles',
    'invoices', 
    'invoice_line_items',
    'supplementary_billings',
    'credit_debit_notes',
    'bulk_billing_runs',
    'payment_records'
  ];

  for (const tableName of billingTables) {
    console.log(`📋 Checking table: ${tableName}`);
    
    try {
      // Check if table exists by trying to query it
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   ❌ Table ${tableName} does not exist`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Table ${tableName} exists`);
        
        // Try to get table structure by checking with a simple query
        const { data: sampleData, error: structError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!structError && sampleData) {
          console.log(`   📋 Table is accessible`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error checking ${tableName}:`, err.message);
    }
    
    console.log(''); // Empty line for readability
  }

  // Check some known tables that should exist
  console.log('📊 Checking some known tables:');
  const knownTables = ['customers', 'bookings', 'branches', 'organizations'];
  
  for (const table of knownTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
        
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: exists`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }
}

checkBillingTables().catch(console.error);