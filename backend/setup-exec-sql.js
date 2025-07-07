import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';

dotenv.config();

// Script to create the exec_sql function in Supabase
// This function is needed for direct SQL execution through the REST API

const setupScript = `
-- Create a function to execute arbitrary SQL (for migrations only)
-- This should be used with caution and proper authentication
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Only allow service role to execute this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can execute SQL';
  END IF;
  
  -- Execute the query
  EXECUTE sql_query;
  
  -- Return success
  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission only to service role
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Add comment
COMMENT ON FUNCTION exec_sql(text) IS 'Execute arbitrary SQL - for migration purposes only. Requires service role authentication.';
`;

async function setupExecSQL() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }
  
  console.log('Setting up exec_sql function in Supabase...');
  
  try {
    // For the initial setup, we'll need to use the Supabase dashboard SQL editor
    // or connect directly to the database
    console.log('\n⚠️  To enable automated migrations, please run the following SQL in your Supabase SQL editor:\n');
    console.log('----------------------------------------');
    console.log(setupScript);
    console.log('----------------------------------------\n');
    console.log('After running this SQL, your migration system will be fully functional.');
    console.log('\nAlternatively, you can save this to a file and run it through the Supabase CLI.');
    
    // Save to file for convenience
    await fs.writeFile('./migrations/000_setup_exec_sql.sql', setupScript);
    console.log('\n✓ SQL saved to: ./migrations/000_setup_exec_sql.sql');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupExecSQL();

export { setupScript };