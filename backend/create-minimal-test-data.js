import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMinimalTestData() {

  try {
    // Get organization and branch
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name, organization_id')
      .limit(1);
    
    if (!branches || branches.length === 0) {
      return;
    }

    const branch = branches[0];

    // Check what columns customers table has
    const { data: customersSample } = await supabase
      .from('customers')
      .select('*')
      .limit(0);
    

    // Create minimal customers with only required fields
    const testCustomers = [
      {
        branch_id: branch.id,
        name: 'Test Sender',
        mobile: '9876543210'
      },
      {
        branch_id: branch.id,
        name: 'Test Receiver',
        mobile: '9876543211'
      }
    ];

    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .insert(testCustomers)
      .select();
    
    if (customerError) {
    } else {
    }

    // Check what columns articles table has
    const { data: articlesSample } = await supabase
      .from('articles')
      .select('*')
      .limit(0);
    

    // Create minimal articles
    const testArticles = [
      {
        branch_id: branch.id,
        name: 'Test Article 1',
        base_rate: 50
      },
      {
        branch_id: branch.id,
        name: 'Test Article 2',
        base_rate: 100
      }
    ];

    const { data: articles, error: articleError } = await supabase
      .from('articles')
      .insert(testArticles)
      .select();
    
    if (articleError) {
      // Try with just name if branch_id fails
      if (articleError.message.includes('branch_id')) {
        const simpleArticles = testArticles.map(a => ({ name: a.name, base_rate: a.base_rate }));
        const { data: retryArticles, error: retryError } = await supabase
          .from('articles')
          .insert(simpleArticles)
          .select();
        
        if (retryError) {
        } else {
        }
      }
    } else {
    }

    // Final verification
    
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const { count: articleCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
createMinimalTestData();