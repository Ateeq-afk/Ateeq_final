import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createK2KUsers() {
  console.log('\n🚀 Creating K2K Logistics Demo Users\n');
  
  // First, check if organizations exist
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', ['d0d0d0d0-0000-0000-0000-000000000001', 'd0d0d0d0-0000-0000-0000-000000000002']);
  
  if (orgError) {
    console.error('❌ Error checking organizations:', orgError.message);
    console.log('\n⚠️  Make sure you have run the migrations first!');
    console.log('Go to your Supabase SQL Editor and run the COMBINED_MIGRATIONS.sql file.');
    return;
  }
  
  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found!');
    console.log('\n⚠️  You need to run the migrations first.');
    console.log('1. Go to: https://app.supabase.com/project/pgdssjfgfbvkgbzumtzm/editor');
    console.log('2. Copy the contents of COMBINED_MIGRATIONS.sql');
    console.log('3. Paste and run in the SQL Editor');
    return;
  }
  
  console.log('✅ Found organizations:');
  orgs.forEach(org => console.log(`   - ${org.name} (${org.id})`));
  
  // Check if organization codes exist
  const { data: codes, error: codeError } = await supabase
    .from('organization_codes')
    .select('code, organization_id');
  
  if (codeError) {
    console.error('\n❌ Error checking organization codes:', codeError.message);
    console.log('The organization_codes table might not exist yet.');
    console.log('Please run the migrations first.');
    return;
  }
  
  console.log('\n✅ Organization codes found:');
  codes?.forEach(code => console.log(`   - ${code.code}`));
  
  console.log('\n📝 Demo User Credentials:');
  console.log('\nFor K2K Logistics:');
  console.log('- Organization Code: k2k');
  console.log('- Admin Username: admin');
  console.log('- Admin Password: Admin@123');
  console.log('- Operator Username: operator');
  console.log('- Operator Password: Operator@123');
  
  console.log('\nFor Acme Logistics:');
  console.log('- Organization Code: acme');
  console.log('- Admin Username: admin');
  console.log('- Admin Password: Admin@123');
  
  console.log('\n⚠️  Note: To create these users, you need to:');
  console.log('1. Start the backend server: cd backend && npm run dev');
  console.log('2. Use the /auth/org/create-user API endpoint');
  console.log('3. Or create them manually in Supabase Auth with emails like admin@k2k.internal');
  
  console.log('\n💡 For quick testing with existing users:');
  console.log('Use the legacy login at http://localhost:5173/signin-legacy');
  console.log('Email: tabateeq@gmail.com');
  console.log('Password: superadmin');
}

createK2KUsers().catch(console.error);