
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
