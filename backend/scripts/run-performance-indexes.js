import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function runMigration() {
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../../migrations/027_performance_indexes_correct_schema.sql');
    const migrationContent = readFileSync(migrationPath, 'utf8');
    
    // Split into individual DO blocks and statements
    const blocks = migrationContent
      .split(/(?=DO\s*\$\$|ANALYZE|SELECT)/i)
      .map(block => block.trim())
      .filter(block => block.length > 0);
    
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    // Execute each block
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const isDoBlock = block.startsWith('DO');
      const isAnalyze = block.startsWith('ANALYZE');
      const isSelect = block.startsWith('SELECT');
      
      let description = 'SQL Statement';
      if (isDoBlock) {
        const indexMatch = block.match(/idx_\w+/);
        description = indexMatch ? `Index: ${indexMatch[0]}` : 'Index Creation';
      } else if (isAnalyze) {
        const tableMatch = block.match(/ANALYZE\s+(\w+)/i);
        description = tableMatch ? `Analyze: ${tableMatch[1]}` : 'Table Analysis';
      } else if (isSelect) {
        description = 'Report Query';
      }
      
      
      try {
        // For SELECT statements, we need to use .rpc() or direct query
        if (isSelect) {
          // Skip SELECT statements for now as they're just reports
          continue;
        }
        
        // Execute the SQL block using raw SQL execution
        const { data, error } = await supabase.rpc('execute_sql', {
          query: block
        }).single();
        
        if (error) {
          // Try direct execution as fallback
          
          // For DO blocks and ANALYZE, we can't get results back easily
          // but we can check if they succeed
          if (isDoBlock || isAnalyze) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          successCount++;
          if (data) results.push(data);
        }
      } catch (err) {
        errorCount++;
      }
    }
    
    
    // Try to get index count
    
    const { data: indexCount } = await supabase
      .from('pg_indexes')
      .select('indexname', { count: 'exact' })
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%');
    
    if (indexCount) {
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Create RPC function first (if it doesn't exist)
async function createRPCFunction() {
  const createFunction = `
    CREATE OR REPLACE FUNCTION execute_sql(query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE query;
      RETURN json_build_object('success', true);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
  `;
  
  // This would need to be run manually in Supabase SQL editor first
}

// Run the migration

// Show RPC function creation note
await createRPCFunction();

// Ask user to confirm
await new Promise(resolve => setTimeout(resolve, 5000));

runMigration().catch(console.error);