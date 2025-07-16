import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPerformanceIndexes() {
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/027_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    
    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const indexMatch = statement.match(/CREATE INDEX.*?(\w+)\s+ON\s+(\w+)/i);
      const indexName = indexMatch ? indexMatch[1] : `Statement ${i + 1}`;
      const tableName = indexMatch ? indexMatch[2] : 'unknown';
      
      process.stdout.write(`⏳ [${i + 1}/${statements.length}] Creating ${indexName} on ${tableName}...`);
      
      const startStmt = Date.now();
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Check if it's just an "already exists" error
          if (error.message.includes('already exists')) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          const duration = Date.now() - startStmt;
          successCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    
    // Check index usage stats
    
    const { data: indexStats, error: statsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) AS size
          FROM pg_stat_user_indexes
          WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
          ORDER BY pg_relation_size(indexrelid) DESC
          LIMIT 20;
        `
      });
    
    if (!statsError && indexStats) {
      
      indexStats.forEach(idx => {
          idx.tablename.padEnd(25) + 
          idx.indexname.padEnd(40) + 
          idx.size
        );
      });
    }
    
    // Performance recommendations
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Helper function to execute raw SQL (if RPC doesn't exist)
async function executeSQL(sql) {
  // This is a fallback if the exec_sql RPC doesn't exist
  // You would need to create this function in Supabase:
  /*
  CREATE OR REPLACE FUNCTION exec_sql(sql text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    EXECUTE sql;
  END;
  $$;
  */
  
  // For now, we'll use the RPC approach
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}

// Run the migration

applyPerformanceIndexes().catch(console.error);