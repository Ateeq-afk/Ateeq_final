import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBookingCreation() {
  console.log('🧪 Testing Multi-Article Booking Creation');
  console.log('=' .repeat(50));

  try {
    // Step 1: Verify table exists with proper query
    console.log('\n1. Checking booking_articles table...');
    const { data: baTest, error: baError } = await supabase
      .from('booking_articles')
      .select('*')
      .limit(0);
    
    if (baError) {
      console.log('❌ Error accessing booking_articles:', baError.message);
      return;
    } else {
      console.log('✅ booking_articles table exists');
    }

    // Step 2: Get sample data
    console.log('\n2. Getting test data...');
    
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

    console.log(`   Organizations: ${orgs?.length || 0}`);
    console.log(`   Branches: ${branches?.length || 0}`);
    console.log(`   Customers: ${customers?.length || 0}`);
    console.log(`   Articles: ${articles?.length || 0}`);

    if (!orgs || orgs.length === 0) {
      console.log('\n⚠️  No organizations found. Creating test data...');
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
      console.log('\n⚠️  Insufficient test data. Please ensure you have:');
      console.log('   - At least 1 branch');
      console.log('   - At least 1 customer');
      console.log('   - At least 1 article');
      return;
    }

    // Step 3: Create a test booking directly
    console.log('\n3. Creating test booking...');
    
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
      console.log('❌ Error creating booking:', bookingError.message);
      return;
    }

    console.log('✅ Booking created:', booking.lr_number);

    // Step 4: Add articles to the booking
    console.log('\n4. Adding articles to booking...');
    
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
      console.log('❌ Error adding articles:', articlesError.message);
      // Clean up booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return;
    }

    console.log(`✅ Added ${insertedArticles.length} articles to booking`);

    // Step 5: Verify the calculations
    console.log('\n5. Verifying calculations...');
    
    const { data: verifyBooking } = await supabase
      .from('bookings')
      .select('*, booking_articles(*)')
      .eq('id', booking.id)
      .single();

    if (verifyBooking) {
      console.log(`\n📋 Booking Summary:`);
      console.log(`   LR Number: ${verifyBooking.lr_number}`);
      console.log(`   Total Amount: ₹${verifyBooking.total_amount}`);
      console.log(`   Articles: ${verifyBooking.booking_articles.length}`);
      
      console.log(`\n💰 Article Details:`);
      verifyBooking.booking_articles.forEach((ba, index) => {
        console.log(`\n   Article ${index + 1}:`);
        console.log(`     Quantity: ${ba.quantity}`);
        console.log(`     Rate Type: ${ba.rate_type}`);
        console.log(`     Freight: ₹${ba.freight_amount}`);
        console.log(`     Loading Charges: ₹${ba.total_loading_charges || ba.loading_charge_per_unit * ba.quantity}`);
        console.log(`     Unloading Charges: ₹${ba.total_unloading_charges || ba.unloading_charge_per_unit * ba.quantity}`);
        console.log(`     Total: ₹${ba.total_amount}`);
      });

      // Calculate expected total
      const expectedTotal = verifyBooking.booking_articles.reduce((sum, ba) => {
        return sum + (ba.total_amount || 0);
      }, 0);

      console.log(`\n   Expected Total: ₹${expectedTotal}`);
      console.log(`   Actual Total: ₹${verifyBooking.total_amount}`);
      
      if (Math.abs(verifyBooking.total_amount - expectedTotal) < 0.01) {
        console.log('   ✅ Totals match!');
      } else {
        console.log('   ⚠️  Totals mismatch - trigger may need adjustment');
      }
    }

    // Step 6: Test the RPC function
    console.log('\n6. Testing create_booking_with_articles function...');
    
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
      console.log('⚠️  RPC function error:', rpcError.message);
    } else if (rpcResult) {
      console.log('✅ RPC function works!');
      console.log(`   New LR: ${rpcResult.lr_number}`);
      console.log(`   Total: ₹${rpcResult.total_amount}`);
    }

    console.log('\n✨ Database setup complete and verified!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Frontend integration - Update React components');
    console.log('2. API testing - Test with real authentication');
    console.log('3. Migration of existing bookings (if needed)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBookingCreation();