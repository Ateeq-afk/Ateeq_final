const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrganizations() {
  console.log('Checking existing organizations...\n');
  
  // Check organizations
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('*');
    
  if (orgError) {
    console.error('Error fetching organizations:', orgError);
    return;
  }
  
  console.log(`Found ${organizations?.length || 0} organizations:`);
  organizations?.forEach(org => {
    console.log(`- ${org.name} (ID: ${org.id})`);
  });
  
  // Check if organization_codes table exists
  const { data: orgCodes, error: codeError } = await supabase
    .from('organization_codes')
    .select('*');
    
  if (codeError) {
    console.log('\nOrganization codes table not found. You may need to run migrations.');
  } else {
    console.log(`\nFound ${orgCodes?.length || 0} organization codes:`);
    orgCodes?.forEach(code => {
      console.log(`- Code: ${code.code}, Org ID: ${code.organization_id}`);
    });
  }
  
  // Check branches
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('*');
    
  if (branchError) {
    console.error('Error fetching branches:', branchError);
    return;
  }
  
  console.log(`\nFound ${branches?.length || 0} branches:`);
  branches?.forEach(branch => {
    console.log(`- ${branch.name} (${branch.code})`);
  });
  
  // Check users
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*');
    
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }
  
  console.log(`\nFound ${users?.length || 0} users:`);
  users?.forEach(user => {
    console.log(`- ${user.email} (Role: ${user.role})`);
  });
}

checkOrganizations().catch(console.error);