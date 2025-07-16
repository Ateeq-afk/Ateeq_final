import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);


async function checkTables() {
  
  const tables = [
    // Core tables
    { name: 'bookings', type: 'Core' },
    { name: 'booking_articles', type: 'Core' },
    { name: 'articles', type: 'Core' },
    { name: 'customers', type: 'Core' },
    { name: 'branches', type: 'Core' },
    { name: 'organizations', type: 'Core' },
    
    // Financial tables
    { name: 'invoices', type: 'Financial' },
    { name: 'invoice_items', type: 'Financial' },
    { name: 'payments', type: 'Financial' },
    { name: 'payment_modes', type: 'Financial' },
    { name: 'payment_allocations', type: 'Financial' },
    { name: 'outstanding_amounts', type: 'Financial' },
    
    // Credit Management
    { name: 'credit_transactions', type: 'Credit' },
    { name: 'credit_limit_history', type: 'Credit' },
    { name: 'credit_alerts', type: 'Credit' },
    { name: 'customer_contracts', type: 'Credit' },
    
    // Rate Management
    { name: 'rate_contracts', type: 'Rates' },
    { name: 'rate_slabs', type: 'Rates' },
    { name: 'surcharge_rules', type: 'Rates' },
    { name: 'quotes', type: 'Rates' },
    
    // Billing
    { name: 'billing_cycles', type: 'Billing' },
    { name: 'bulk_billing_runs', type: 'Billing' },
    { name: 'supplementary_billing', type: 'Billing' },
    { name: 'credit_debit_notes', type: 'Billing' }
  ];
  
  const results = {
    Core: { exists: [], missing: [] },
    Financial: { exists: [], missing: [] },
    Credit: { exists: [], missing: [] },
    Rates: { exists: [], missing: [] },
    Billing: { exists: [], missing: [] }
  };
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        results[table.type].exists.push(table.name);
      } else {
        results[table.type].missing.push(table.name);
      }
    } catch (e) {
      results[table.type].missing.push(table.name);
    }
  }
  
  // Display results
  for (const [category, status] of Object.entries(results)) {
    
    if (status.exists.length > 0) {
    }
    
    if (status.missing.length > 0) {
    }
  }
  
  return results;
}

async function checkFunctions() {
  
  const functions = [
    'create_booking_with_articles',
    'calculate_booking_total',
    'update_booking_total_from_articles',
    'calculate_contract_price',
    'exec_sql'
  ];
  
  const existing = [];
  const missing = [];
  
  // Note: We can't directly query functions via Supabase client
  // So we'll test by trying to call them
  
  
  return { existing, missing: functions };
}

async function generateMigrationCommands() {
  
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  
  const importantMigrations = [
    '008_enhanced_revenue_model_fixed.sql',
    '020_credit_limit_management.sql',
    '021_rate_management_system_fixed.sql',
    '022_payment_processing_system_fixed.sql',
    '023_fix_payment_modes_multi_tenant.sql',
    '028_create_booking_articles_junction.sql',
    '029_create_booking_with_articles_function.sql'
  ];
  
  importantMigrations.forEach((file, index) => {
    if (files.includes(file)) {
    }
  });
  
  
  importantMigrations.forEach(file => {
  });
}

// Run all checks
async function main() {
  try {
    const tableResults = await checkTables();
    const functionResults = await checkFunctions();
    
    await generateMigrationCommands();
    
    
    const totalMissing = Object.values(tableResults)
      .reduce((sum, cat) => sum + cat.missing.length, 0);
    
    if (totalMissing === 0) {
    } else {
    }
    
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();