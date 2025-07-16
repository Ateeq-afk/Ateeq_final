import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyBookingArticlesSetup() {

  try {
    // Test 1: Check if table exists
    const { data: tableTest, error: tableError } = await supabase
      .from('booking_articles')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      return;
    } else if (tableError) {
      return;
    } else {
    }

    // Test 2: Check table structure
    const { data: sampleInsert, error: insertError } = await supabase
      .from('booking_articles')
      .select('*')
      .limit(0);
    
    if (!insertError) {
      const columns = Object.keys(sampleInsert || {});
      const requiredColumns = [
        'id', 'booking_id', 'article_id', 'quantity', 'rate_type',
        'freight_amount', 'total_loading_charges', 'total_unloading_charges',
        'total_amount', 'status'
      ];
      
      requiredColumns.forEach(col => {
        if (columns.includes(col)) {
        } else {
        }
      });
    }

    // Test 3: Test RLS policies

    // Test 4: Test helper functions
    
    // Test calculate_booking_total function
    const { data: funcTest, error: funcError } = await supabase
      .rpc('calculate_booking_total', { booking_uuid: '00000000-0000-0000-0000-000000000000' });
    
    if (funcError && funcError.code === 'PGRST202') {
    } else if (!funcError) {
    }

    // Test 5: Create a test scenario
    
    // Get first available article and customer
    const { data: articles } = await supabase
      .from('articles')
      .select('id, name, base_rate')
      .limit(2);
    
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, organization_id')
      .limit(2);
    
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name, organization_id')
      .limit(2);

    if (articles && articles.length > 0 && customers && customers.length > 0 && branches && branches.length >= 2) {

      // Prepare test booking data
      const testBookingData = {
        organization_id: customers[0].organization_id,
        branch_id: branches[0].id,
        lr_type: 'system',
        from_branch: branches[0].id,
        to_branch: branches[1].id || branches[0].id,
        sender_id: customers[0].id,
        receiver_id: customers[1]?.id || customers[0].id,
        payment_type: 'Paid',
        delivery_type: 'Standard',
        priority: 'Normal',
        remarks: 'Test booking with multiple articles'
      };

      const testArticlesData = [
        {
          article_id: articles[0].id,
          quantity: 10,
          actual_weight: 25.5,
          charged_weight: 26.0,
          declared_value: 1000,
          rate_per_unit: 50,
          rate_type: 'per_kg',
          loading_charge_per_unit: 5,
          unloading_charge_per_unit: 5,
          description: 'Test item 1 - per kg rate'
        }
      ];

      if (articles.length > 1) {
        testArticlesData.push({
          article_id: articles[1].id,
          quantity: 5,
          actual_weight: 15.0,
          charged_weight: 15.0,
          declared_value: 500,
          rate_per_unit: 100,
          rate_type: 'per_quantity',
          loading_charge_per_unit: 10,
          unloading_charge_per_unit: 10,
          description: 'Test item 2 - per quantity rate'
        });
      }

      
      // Calculate expected totals
      const expectedTotals = testArticlesData.map(article => {
        const freight = article.rate_type === 'per_kg' 
          ? article.charged_weight * article.rate_per_unit
          : article.quantity * article.rate_per_unit;
        const loading = article.quantity * article.loading_charge_per_unit;
        const unloading = article.quantity * article.unloading_charge_per_unit;
        return {
          article: article.description,
          freight,
          loading,
          unloading,
          total: freight + loading + unloading
        };
      });

      expectedTotals.forEach(calc => {
      });
      
      const grandTotal = expectedTotals.reduce((sum, calc) => sum + calc.total, 0);

      // Try to call the create_booking_with_articles function
      const { data: bookingResult, error: bookingError } = await supabase
        .rpc('create_booking_with_articles', {
          booking_data: testBookingData,
          articles_data: testArticlesData,
          user_id: null
        });

      if (bookingError) {
      } else if (bookingResult) {
        
        // Verify the booking_articles records
        const { data: verifyArticles } = await supabase
          .from('booking_articles')
          .select('*')
          .eq('booking_id', bookingResult.id);
        
        if (verifyArticles && verifyArticles.length > 0) {
          verifyArticles.forEach(ba => {
          });
        }
      }
    } else {
    }


  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run verification
verifyBookingArticlesSetup();