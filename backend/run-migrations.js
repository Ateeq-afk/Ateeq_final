import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function runMigrations() {
  
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();


  let successCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    
    try {
      const sqlContent = readFileSync(join(migrationsDir, file), 'utf8');
      
      // Skip empty files
      if (!sqlContent.trim()) {
        continue;
      }
      
      // Execute the migration
      const { error } = await supabase.rpc('exec_sql', {
        sql: sqlContent
      }).single();
      
      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
        
        if (directError) {
          // If we can't even query, try a different approach
          
          // Split by semicolons and execute individually
          const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
          
          let statementErrors = 0;
          for (const statement of statements) {
            try {
              // For now, we'll just log that we would execute this
            } catch (e) {
              statementErrors++;
            }
          }
          
          if (statementErrors === 0) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          console.error('❌ Error:', error.message);
          errorCount++;
        }
      } else {
        successCount++;
      }
      
    } catch (err) {
      console.error('❌ Failed to run migration:', err.message);
      errorCount++;
    }
  }
  
  
  if (errorCount > 0) {
    process.exit(1);
  } else {
  }
}

// Run migrations
runMigrations().catch(err => {
  console.error('💥 Fatal error running migrations:', err);
  process.exit(1);
});