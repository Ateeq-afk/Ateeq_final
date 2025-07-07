import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  console.log('🔨 Creating test data for booking system...');
  console.log('=' .repeat(50));

  try {
    // Get organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (!orgs || orgs.length === 0) {
      console.log('❌ No organization found');
      return;
    }

    const orgId = orgs[0].id;
    console.log(`✅ Using organization: ${orgs[0].name}`);

    // Get branches
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', orgId);
    
    if (!branches || branches.length === 0) {
      console.log('❌ No branches found');
      return;
    }

    const branchId = branches[0].id;
    console.log(`✅ Found ${branches.length} branches`);

    // Check existing customers
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id')
      .eq('organization_id', orgId);
    
    console.log(`📊 Existing customers: ${existingCustomers?.length || 0}`);

    // Create test customers if needed
    if (!existingCustomers || existingCustomers.length < 2) {
      console.log('\n📝 Creating test customers...');
      
      const testCustomers = [
        {
          organization_id: orgId,
          branch_id: branchId,
          name: 'Test Sender Company',
          mobile: '9876543210',
          email: 'sender@test.com',
          address: '123 Test Street, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          gst_number: '27AAAAA0000A1Z5',
          customer_type: 'regular',
          credit_limit: 50000,
          credit_status: 'Active'
        },
        {
          organization_id: orgId,
          branch_id: branchId,
          name: 'Test Receiver Company',
          mobile: '9876543211',
          email: 'receiver@test.com',
          address: '456 Test Avenue, Delhi',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          gst_number: '07BBBBB0000B1Z5',
          customer_type: 'regular',
          credit_limit: 30000,
          credit_status: 'Active'
        }
      ];

      const { data: newCustomers, error: customerError } = await supabase
        .from('customers')
        .insert(testCustomers)
        .select();
      
      if (customerError) {
        console.log('❌ Error creating customers:', customerError.message);
      } else {
        console.log(`✅ Created ${newCustomers.length} test customers`);
      }
    }

    // Check articles
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('id, name')
      .eq('organization_id', orgId);
    
    console.log(`\n📦 Existing articles: ${existingArticles?.length || 0}`);

    // Create test articles if needed
    if (!existingArticles || existingArticles.length < 2) {
      console.log('📝 Creating test articles...');
      
      const testArticles = [
        {
          organization_id: orgId,
          branch_id: branchId,
          name: 'Electronics Box',
          description: 'Standard electronics packaging',
          base_rate: 50,
          hsn_code: '8471',
          tax_rate: 18,
          unit_of_measure: 'Box',
          min_quantity: 1,
          is_fragile: true,
          requires_special_handling: true
        },
        {
          organization_id: orgId,
          branch_id: branchId,
          name: 'Furniture Item',
          description: 'Standard furniture item',
          base_rate: 100,
          hsn_code: '9403',
          tax_rate: 12,
          unit_of_measure: 'Piece',
          min_quantity: 1,
          is_fragile: false,
          requires_special_handling: false
        }
      ];

      const { data: newArticles, error: articleError } = await supabase
        .from('articles')
        .insert(testArticles)
        .select();
      
      if (articleError) {
        console.log('❌ Error creating articles:', articleError.message);
      } else {
        console.log(`✅ Created ${newArticles.length} test articles`);
      }
    }

    // Verify final state
    console.log('\n📊 Final test data summary:');
    
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    
    const { count: articleCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Articles: ${articleCount}`);
    console.log(`   Branches: ${branches.length}`);
    
    console.log('\n✅ Test data setup complete!');
    console.log('You can now run the booking creation test.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
createTestData();