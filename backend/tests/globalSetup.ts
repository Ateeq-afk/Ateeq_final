import { createClient } from '@supabase/supabase-js';

export default async function globalSetup() {
  console.log('🧪 Setting up test environment...');
  
  // Initialize test database connection
  const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Warning: Test database credentials not configured. Some tests may fail.');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connectivity
    const { data, error } = await supabase.from('organizations').select('id').limit(1);
    
    if (error) {
      console.warn('⚠️ Warning: Could not connect to test database:', error.message);
    } else {
      console.log('✅ Test database connection successful');
    }
    
    // Set up test data cleanup function
    global.__CLEANUP_FUNCTIONS__ = [];
    
  } catch (error) {
    console.warn('⚠️ Warning: Test database setup failed:', error);
  }
  
  console.log('🧪 Test environment setup complete');
}