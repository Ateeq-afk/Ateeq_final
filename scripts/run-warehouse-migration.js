import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Running warehouse migration...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'backend', 'migrations', '011_create_default_warehouses.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration script...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      // If exec_sql doesn't exist, try raw query
      console.log('⚠️  exec_sql not available, trying alternative method...');
      
      // Split the migration into individual statements
      const statements = migrationSql
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');
      
      console.log(`📊 Found ${statements.length} SQL statements to execute`);
      
      // For now, we'll log the migration for manual execution
      console.log('\n📋 Please run the following migration manually in your Supabase SQL editor:\n');
      console.log('-- Copy everything below this line --\n');
      console.log(migrationSql);
      console.log('\n-- Copy everything above this line --\n');
      
      console.log('ℹ️  After running the migration manually:');
      console.log('1. All existing branches will have default warehouses');
      console.log('2. New branches will automatically get warehouses');
      console.log('3. Each warehouse will have 4 default locations: RECEIVING, STORAGE-A, STORAGE-B, DISPATCH');
      
      return;
    }
    
    console.log('✅ Migration executed successfully!');
    
    // Verify the results
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, city');
    
    if (!branchError && branches) {
      console.log(`\n📊 Found ${branches.length} branches`);
      
      // Check warehouses for each branch
      for (const branch of branches) {
        const { data: warehouses, error: warehouseError } = await supabase
          .from('warehouses')
          .select('id, name')
          .eq('branch_id', branch.id);
        
        if (!warehouseError && warehouses) {
          console.log(`✅ ${branch.name}: ${warehouses.length} warehouse(s)`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('\n🎉 Migration process completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});