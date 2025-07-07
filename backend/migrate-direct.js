import { readFileSync } from 'fs';
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

// Test a simple query to verify our migrations worked
async function testDatabase() {
  console.log('🧪 Testing database after migrations...');
  
  try {
    // Test 1: Check if booking_articles table exists
    console.log('\n1. Testing booking_articles table...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'booking_articles');
    
    if (tableError) {
      console.error('Error checking tables:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✓ booking_articles table exists');
    } else {
      console.log('⚠ booking_articles table not found');
    }

    // Test 2: Check if the function exists
    console.log('\n2. Testing create_booking_with_articles function...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'create_booking_with_articles');
    
    if (funcError) {
      console.error('Error checking functions:', funcError);
    } else if (functions && functions.length > 0) {
      console.log('✓ create_booking_with_articles function exists');
    } else {
      console.log('⚠ create_booking_with_articles function not found');
    }

    // Test 3: Check columns in booking_articles
    console.log('\n3. Testing booking_articles columns...');
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'booking_articles')
      .order('ordinal_position');
    
    if (colError) {
      console.error('Error checking columns:', colError);
    } else if (columns && columns.length > 0) {
      console.log('✓ booking_articles columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('⚠ No columns found for booking_articles');
    }

    // Test 4: Check if we can query existing bookings
    console.log('\n4. Testing existing bookings query...');
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, lr_number, status')
      .limit(3);
    
    if (bookingError) {
      console.error('Error querying bookings:', bookingError);
    } else {
      console.log(`✓ Found ${bookings?.length || 0} existing bookings`);
      if (bookings && bookings.length > 0) {
        bookings.forEach(booking => {
          console.log(`   - ${booking.lr_number}: ${booking.status}`);
        });
      }
    }

    console.log('\n✅ Database test completed!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Run the test
testDatabase();