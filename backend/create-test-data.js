import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {

  try {
    // Get organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (!orgs || orgs.length === 0) {
      return;
    }

    const orgId = orgs[0].id;

    // Get branches
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', orgId);
    
    if (!branches || branches.length === 0) {
      return;
    }

    const branchId = branches[0].id;

    // Check existing customers
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id')
      .eq('organization_id', orgId);
    

    // Create test customers if needed
    if (!existingCustomers || existingCustomers.length < 2) {
      
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
      } else {
      }
    }

    // Check articles
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('id, name')
      .eq('organization_id', orgId);
    

    // Create test articles if needed
    if (!existingArticles || existingArticles.length < 2) {
      
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
      } else {
      }
    }

    // Verify final state
    
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    
    const { count: articleCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    
    

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
createTestData();