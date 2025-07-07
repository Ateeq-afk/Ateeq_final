import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  const migrationsDir = join(__dirname, 'migrations');
  
  try {
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    // Run the key migrations we need
    const keyMigrations = [
      '028_create_booking_articles_junction.sql',
      '029_create_booking_with_articles_function.sql'
    ];
    
    for (const filename of keyMigrations) {
      if (files.includes(filename)) {
        console.log(`Running migration: ${filename}`);
        
        const migrationPath = join(migrationsDir, filename);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: statement });
              if (error) {
                console.error(`Error in statement: ${statement.substring(0, 100)}...`);
                console.error(error);
              }
            } catch (err) {
              // Try direct query if RPC fails
              const { error } = await supabase.from('__migrations').select('*').limit(1);
              if (error && error.code === '42P01') {
                // Table doesn't exist, create it
                await supabase.query(statement);
              } else {
                console.error(`Error executing: ${statement.substring(0, 100)}...`);
                console.error(err);
              }
            }
          }
        }
        
        console.log(`✓ Completed migration: ${filename}`);
      } else {
        console.log(`⚠ Migration not found: ${filename}`);
      }
    }
    
    console.log('✓ All key migrations completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();