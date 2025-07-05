import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// You need to provide the service role key to run migrations  
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL in environment variables');
  process.exit(1);
}

if (!serviceRoleKey || serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('\n❌ Service Role Key not configured!\n');
  console.log('To run migrations, you need to:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings > API');
  console.log('3. Copy the "service_role" key (keep it secret!)');
  console.log('4. Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('\nAlternatively, run the SQL migrations manually in the Supabase SQL editor.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filename, description) {
  try {
    console.log(`\n📄 Running migration: ${description}`);
    const sqlPath = join(__dirname, '..', 'backend', 'migrations', filename);
    const sql = readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons but be careful with functions/procedures
    const statements = sql
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error in statement: ${statement.substring(0, 50)}...`);
          throw error;
        }
      }
    }
    
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    throw error;
  }
}

// Alternative: Direct SQL execution (if exec_sql is not available)
async function runMigrationDirect(filename, description) {
  console.log(`\n📄 Preparing migration: ${description}`);
  const sqlPath = join(__dirname, '..', 'backend', 'migrations', filename);
  const sql = readFileSync(sqlPath, 'utf8');
  
  console.log('\n⚠️  Direct migration execution not available via client library.');
  console.log('Please run the following SQL in your Supabase SQL editor:\n');
  console.log(`-- ${description}`);
  console.log(`-- File: ${filename}`);
  console.log('----------------------------------------');
  console.log(sql.substring(0, 500) + '...\n');
  console.log('(Full SQL saved to migration_to_run.sql)');
  
  // Save to file for easy copying
  const outputPath = join(process.cwd(), 'migration_to_run.sql');
  require('fs').writeFileSync(outputPath, `-- ${description}\n-- File: ${filename}\n\n${sql}`);
}

async function main() {
  console.log('🚀 DesiCargo Database Migration Tool\n');
  
  const migrations = [
    { file: '002_organization_auth.sql', desc: 'Organization Authentication Schema' },
    { file: '003_enhanced_rls_policies.sql', desc: 'Enhanced RLS Policies' },
    { file: '004_seed_k2k_organization.sql', desc: 'Seed K2K Logistics Data' },
    { file: '005_proof_of_delivery.sql', desc: 'Proof of Delivery System' },
    { file: '006_warehouse_management.sql', desc: 'Warehouse Management System' },
    { file: '007_booking_form_enhancements.sql', desc: 'Enhanced Booking Form Support' }
  ];
  
  console.log('Migrations to run:');
  migrations.forEach((m, i) => console.log(`${i + 1}. ${m.desc}`));
  
  // Try to check if we can connect
  const { data, error } = await supabase.from('organizations').select('count');
  
  if (error) {
    console.log('\n⚠️  Cannot execute migrations directly via Supabase client.');
    console.log('This is normal - Supabase client library doesn\'t support DDL operations.\n');
    
    for (const migration of migrations) {
      await runMigrationDirect(migration.file, migration.desc);
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of migration_to_run.sql');
    console.log('4. Run each migration in order');
    console.log('\nAfter running migrations, you can test with:');
    console.log('- Organization Code: k2k');
    console.log('- Username: admin');
    console.log('- Password: Admin@123');
  } else {
    console.log('\n✅ Connected to Supabase successfully');
    console.log('Attempting to run migrations...');
    
    for (const migration of migrations) {
      try {
        await runMigration(migration.file, migration.desc);
      } catch (error) {
        console.error(`\nMigration failed. You may need to run it manually in Supabase SQL editor.`);
        await runMigrationDirect(migration.file, migration.desc);
      }
    }
  }
}

main().catch(console.error);