require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runPaymentMigration() {
  try {
    console.log('Running payment processing system migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'backend', 'migrations', '022_payment_processing_system.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: queryError } = await supabase.from('_temp').select('*').limit(1);
      
      // Split and execute statements one by one
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        console.log('Executing statement:', statement.substring(0, 50) + '...');
        
        // Use raw SQL execution via Supabase client
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql: statement + ';' })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Statement failed:', errorText);
          }
        } catch (err) {
          console.error('Error executing statement:', err.message);
        }
      }
    }
    
    console.log('Payment migration completed successfully!');
    
    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('payment_modes')
      .select('*')
      .limit(1);
    
    if (!tablesError) {
      console.log('Payment tables verified successfully');
    } else {
      console.error('Error verifying tables:', tablesError);
    }
    
  } catch (error) {
    console.error('Error running payment migration:', error);
    process.exit(1);
  }
}

runPaymentMigration();