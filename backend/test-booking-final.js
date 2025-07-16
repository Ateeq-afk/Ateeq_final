import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBookingSystem() {

  try {
    // Step 1: Get all necessary data without filtering
    
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .limit(2);
    
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .limit(2);
    
    const { data: articles } = await supabase
      .from('articles')
      .select('*')
      .limit(2);


    if (!branches || branches.length < 2 || !customers || customers.length < 2 || !articles || articles.length === 0) {
      
      // Show what we have
      if (branches && branches.length > 0) {
      }
      
      if (customers && customers.length > 0) {
      }
      
      if (articles && articles.length > 0) {
      }
      
      return;
    }

    // Step 2: Create a test booking
    
    const bookingData = {
      branch_id: branches[0].id,
      lr_number: `TEST-${Date.now()}`,
      lr_type: 'system',
      from_branch: branches[0].id,
      to_branch: branches[1].id,
      sender_id: customers[0].id,
      receiver_id: customers[1].id,
      payment_type: 'Paid',
      delivery_type: 'Standard',
      priority: 'Normal',
      status: 'booked',
      total_amount: 0,
      remarks: 'Multi-article booking test'
    };


    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      return;
    }


    // Step 3: Add articles to booking
    
    const bookingArticles = [];
    
    // Article 1 - Per KG rate
    bookingArticles.push({
      booking_id: booking.id,
      article_id: articles[0].id,
      quantity: 10,
      actual_weight: 25.5,
      charged_weight: 26.0,
      declared_value: 1000,
      rate_per_unit: 50,
      rate_type: 'per_kg',
      freight_amount: 26.0 * 50, // 1300
      loading_charge_per_unit: 5,
      unloading_charge_per_unit: 5,
      description: `${articles[0].name} - per kg rate`
    });

    // Article 2 - Per quantity rate (if available)
    if (articles.length > 1) {
      bookingArticles.push({
        booking_id: booking.id,
        article_id: articles[1].id,
        quantity: 5,
        actual_weight: 15.0,
        charged_weight: 15.0,
        declared_value: 500,
        rate_per_unit: 100,
        rate_type: 'per_quantity',
        freight_amount: 5 * 100, // 500
        loading_charge_per_unit: 10,
        unloading_charge_per_unit: 10,
        description: `${articles[1].name} - per quantity rate`
      });
    }

    const { data: insertedArticles, error: articlesError } = await supabase
      .from('booking_articles')
      .insert(bookingArticles)
      .select();

    if (articlesError) {
      await supabase.from('bookings').delete().eq('id', booking.id);
      return;
    }


    // Step 4: Verify calculations
    
    const { data: finalBooking } = await supabase
      .from('bookings')
      .select('*, booking_articles(*)')
      .eq('id', booking.id)
      .single();

    if (finalBooking) {
      
      let grandTotal = 0;
      
      finalBooking.booking_articles.forEach((ba, index) => {
        const article = articles.find(a => a.id === ba.article_id);
        
        if (ba.rate_type === 'per_kg') {
        } else {
        }
        
        const loadingCharges = ba.total_loading_charges || (ba.loading_charge_per_unit * ba.quantity);
        const unloadingCharges = ba.total_unloading_charges || (ba.unloading_charge_per_unit * ba.quantity);
        
        
        grandTotal += ba.total_amount;
      });

      
      if (Math.abs(finalBooking.total_amount - grandTotal) < 0.01) {
      } else {
      }
    }

    // Step 5: Test the RPC function
    
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('create_booking_with_articles', {
          booking_data: {
            ...bookingData,
            lr_number: null, // Let system generate
            organization_id: branches[0].organization_id
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
        });

      if (rpcError) {
      } else if (rpcResult) {
      }
    } catch (e) {
    }

    

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testBookingSystem();