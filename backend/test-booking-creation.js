import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBookingCreation() {

  try {
    // Step 1: Verify table exists with proper query
    const { data: baTest, error: baError } = await supabase
      .from('booking_articles')
      .select('*')
      .limit(0);
    
    if (baError) {
      return;
    } else {
    }

    // Step 2: Get sample data
    
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name, organization_id')
      .limit(2);
    
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, organization_id')
      .limit(2);
    
    const { data: articles } = await supabase
      .from('articles')
      .select('id, name, base_rate')
      .limit(2);


    if (!orgs || orgs.length === 0) {
      // You could create test data here if needed
      return;
    }

    const orgId = orgs[0].id;
    const fromBranch = branches?.[0];
    const toBranch = branches?.[1] || branches?.[0];
    const sender = customers?.[0];
    const receiver = customers?.[1] || customers?.[0];
    const article1 = articles?.[0];
    const article2 = articles?.[1];

    if (!fromBranch || !sender || !article1) {
      return;
    }

    // Step 3: Create a test booking directly
    
    // First create the booking
    const bookingData = {
      organization_id: orgId,
      branch_id: fromBranch.id,
      lr_number: `TEST-${Date.now()}`,
      lr_type: 'system',
      from_branch: fromBranch.id,
      to_branch: toBranch?.id || fromBranch.id,
      sender_id: sender.id,
      receiver_id: receiver?.id || sender.id,
      payment_type: 'Paid',
      delivery_type: 'Standard',
      priority: 'Normal',
      status: 'booked',
      total_amount: 0, // Will be updated
      remarks: 'Test booking with multiple articles'
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      return;
    }


    // Step 4: Add articles to the booking
    
    const bookingArticles = [
      {
        booking_id: booking.id,
        article_id: article1.id,
        quantity: 10,
        actual_weight: 25.5,
        charged_weight: 26.0,
        declared_value: 1000,
        rate_per_unit: 50,
        rate_type: 'per_kg',
        freight_amount: 26.0 * 50, // 1300
        loading_charge_per_unit: 5,
        unloading_charge_per_unit: 5,
        description: 'Test article 1 - per kg rate'
      }
    ];

    if (article2) {
      bookingArticles.push({
        booking_id: booking.id,
        article_id: article2.id,
        quantity: 5,
        actual_weight: 15.0,
        charged_weight: 15.0,
        declared_value: 500,
        rate_per_unit: 100,
        rate_type: 'per_quantity',
        freight_amount: 5 * 100, // 500
        loading_charge_per_unit: 10,
        unloading_charge_per_unit: 10,
        description: 'Test article 2 - per quantity rate'
      });
    }

    const { data: insertedArticles, error: articlesError } = await supabase
      .from('booking_articles')
      .insert(bookingArticles)
      .select();

    if (articlesError) {
      // Clean up booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return;
    }


    // Step 5: Verify the calculations
    
    const { data: verifyBooking } = await supabase
      .from('bookings')
      .select('*, booking_articles(*)')
      .eq('id', booking.id)
      .single();

    if (verifyBooking) {
      
      verifyBooking.booking_articles.forEach((ba, index) => {
      });

      // Calculate expected total
      const expectedTotal = verifyBooking.booking_articles.reduce((sum, ba) => {
        return sum + (ba.total_amount || 0);
      }, 0);

      
      if (Math.abs(verifyBooking.total_amount - expectedTotal) < 0.01) {
      } else {
      }
    }

    // Step 6: Test the RPC function
    
    const rpcTestData = {
      booking_data: {
        ...bookingData,
        lr_number: undefined, // Let system generate
      },
      articles_data: bookingArticles.map(ba => ({
        article_id: ba.article_id,
        quantity: ba.quantity,
        actual_weight: ba.actual_weight,
        charged_weight: ba.charged_weight,
        declared_value: ba.declared_value,
        rate_per_unit: ba.rate_per_unit,
        rate_type: ba.rate_type,
        loading_charge_per_unit: ba.loading_charge_per_unit,
        unloading_charge_per_unit: ba.unloading_charge_per_unit,
        description: ba.description
      })),
      user_id: null
    };

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_booking_with_articles', rpcTestData);

    if (rpcError) {
    } else if (rpcResult) {
    }


  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBookingCreation();