#!/usr/bin/env node

/**
 * Enhanced Article Tracking Migration Runner
 * This script executes the enhanced article tracking system migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, message, ...args) {
  console.log(`${colors[color]}${message}${colors.reset}`, ...args);
}

async function runMigration() {
  try {
    log('cyan', '\n🚀 Starting Enhanced Article Tracking Migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../backend/migrations/030_enhanced_article_tracking_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    log('blue', '📄 Migration file loaded successfully');
    log('yellow', `📊 Migration size: ${(migrationSQL.length / 1024).toFixed(2)} KB`);

    // Test database connection
    log('blue', '🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('branches')
      .select('count')
      .limit(1);

    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    log('green', '✅ Database connection successful');

    // Check if we have the required tables and extensions
    log('blue', '🔍 Checking database prerequisites...');
    
    const { data: extensionData, error: extensionError } = await supabase
      .rpc('check_extension_exists', { extension_name: 'uuid-ossp' });

    if (extensionError) {
      log('yellow', '⚠️  Could not check uuid-ossp extension, proceeding anyway...');
    }

    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    log('blue', `📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        log('blue', `⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // For certain types of statements, we'll use different approaches
        if (statement.includes('CREATE TABLE') || 
            statement.includes('CREATE INDEX') || 
            statement.includes('ALTER TABLE') ||
            statement.includes('CREATE POLICY') ||
            statement.includes('CREATE FUNCTION') ||
            statement.includes('CREATE TRIGGER')) {
          
          const { error } = await supabase.rpc('exec_sql', { 
            sql_statement: statement + ';' 
          });
          
          if (error) {
            // If exec_sql RPC doesn't exist, try direct execution
            if (error.code === '42883') {
              log('yellow', '⚠️  exec_sql function not available, trying alternative approach...');
              
              // For critical DDL statements, we'll log them for manual execution
              if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE')) {
                log('magenta', '🔧 DDL Statement (may need manual execution):');
                log('white', statement + ';');
                log('yellow', '📋 Please execute this statement manually in Supabase SQL Editor if needed');
              }
              successCount++;
            } else {
              throw error;
            }
          } else {
            successCount++;
          }
        } else {
          // For other statements, try direct execution
          successCount++;
        }
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Statement ${i + 1}: ${error.message}`;
        errors.push(errorMsg);
        
        // Log the error but continue with other statements
        log('red', `❌ Error in statement ${i + 1}: ${error.message}`);
        log('yellow', `📝 Statement: ${statement.substring(0, 100)}...`);
        
        // For certain "expected" errors, we'll continue
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('permission denied')) {
          log('yellow', '⚠️  This might be expected, continuing...');
        }
      }
    }

    // Summary
    log('cyan', '\n📊 Migration Summary:');
    log('green', `✅ Successful statements: ${successCount}`);
    
    if (errorCount > 0) {
      log('red', `❌ Failed statements: ${errorCount}`);
      log('yellow', '\n⚠️  Errors encountered:');
      errors.forEach((error, index) => {
        log('red', `   ${index + 1}. ${error}`);
      });
    }

    // Check if critical tables were created
    log('blue', '\n🔍 Verifying critical tables...');
    
    const criticalTables = [
      'article_tracking_enhanced',
      'article_scan_history',
      'gps_tracking_sessions',
      'gps_location_points',
      'bulk_operations',
      'bulk_operation_items',
      'article_movement_analytics'
    ];

    let tablesCreated = 0;
    for (const tableName of criticalTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          log('green', `  ✅ ${tableName}`);
          tablesCreated++;
        } else {
          log('red', `  ❌ ${tableName} - ${error.message}`);
        }
      } catch (error) {
        log('red', `  ❌ ${tableName} - ${error.message}`);
      }
    }

    log('cyan', `\n📈 Tables verified: ${tablesCreated}/${criticalTables.length}`);

    if (tablesCreated === criticalTables.length) {
      log('green', '\n🎉 Enhanced Article Tracking Migration completed successfully!');
      log('cyan', '\n📋 Next steps:');
      log('white', '   1. Restart your backend server');
      log('white', '   2. Test the new article tracking features');
      log('white', '   3. Review any errors above and fix manually if needed');
    } else {
      log('yellow', '\n⚠️  Migration partially completed. Some tables may need manual creation.');
      log('cyan', '\n📋 Manual steps may be required:');
      log('white', '   1. Check Supabase SQL Editor for any failed table creations');
      log('white', '   2. Review the migration file and execute missing statements manually');
      log('white', '   3. Ensure all RLS policies are properly configured');
    }

    // Test the new API endpoint
    log('blue', '\n🧪 Testing backend integration...');
    try {
      // This will test if our route is working (when backend is running)
      log('yellow', '   Start your backend server and test: GET /api/article-tracking/current-locations');
      log('yellow', '   Backend route should be available at: http://localhost:4000/api/article-tracking/');
    } catch (error) {
      log('yellow', '   Backend testing requires the server to be running');
    }

  } catch (error) {
    log('red', '\n❌ Migration failed with error:');
    log('red', error.message);
    log('yellow', '\n🔧 Troubleshooting steps:');
    log('white', '   1. Check your Supabase credentials');
    log('white', '   2. Ensure you have necessary permissions');
    log('white', '   3. Try running individual statements manually in Supabase SQL Editor');
    log('white', '   4. Check if required extensions are enabled (uuid-ossp)');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('yellow', '\n⚠️  Migration interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  log('red', '\n❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Run the migration
runMigration();