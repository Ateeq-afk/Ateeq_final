import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMinimalTestData() {
  console.log('🔨 Creating minimal test data...');
  console.log('=' .repeat(50));

  try {
    // Get organization and branch
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name, organization_id')
      .limit(1);
    
    if (!branches || branches.length === 0) {
      console.log('❌ No branches found');
      return;
    }

    const branch = branches[0];
    console.log(`✅ Using branch: ${branch.name}`);

    // Check what columns customers table has
    const { data: customersSample } = await supabase
      .from('customers')
      .select('*')
      .limit(0);
    
    console.log('\nCustomers table structure:', Object.keys(customersSample || {}));

    // Create minimal customers with only required fields
    console.log('\n📝 Creating test customers...');
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
      console.log('❌ Customer error:', customerError.message);
    } else {
      console.log(`✅ Created ${customers.length} customers`);
    }

    // Check what columns articles table has
    const { data: articlesSample } = await supabase
      .from('articles')
      .select('*')
      .limit(0);
    
    console.log('\nArticles table structure:', Object.keys(articlesSample || {}));

    // Create minimal articles
    console.log('\n📦 Creating test articles...');
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
      console.log('❌ Article error:', articleError.message);
      // Try with just name if branch_id fails
      if (articleError.message.includes('branch_id')) {
        console.log('🔄 Retrying without branch_id...');
        const simpleArticles = testArticles.map(a => ({ name: a.name, base_rate: a.base_rate }));
        const { data: retryArticles, error: retryError } = await supabase
          .from('articles')
          .insert(simpleArticles)
          .select();
        
        if (retryError) {
          console.log('❌ Retry error:', retryError.message);
        } else {
          console.log(`✅ Created ${retryArticles?.length || 0} articles`);
        }
      }
    } else {
      console.log(`✅ Created ${articles.length} articles`);
    }

    // Final verification
    console.log('\n📊 Verifying data...');
    
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const { count: articleCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Total customers: ${customerCount}`);
    console.log(`   Total articles: ${articleCount}`);
    
    console.log('\n✅ Test data creation complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
createMinimalTestData();