import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalBookingTest() {

  try {
    // Get all necessary data with organization info
    const { data: branches } = await supabase
      .from('branches')
      .select('*, organization_id')
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
      return;
    }

    const orgId = branches[0].organization_id;

    // Create booking with organization_id
    
    const bookingData = {
      organization_id: orgId,
      branch_id: branches[0].id,
      lr_number: `MA-${Date.now()}`, // MA = Multi Article
      lr_type: 'system',
      from_branch: branches[0].id,
      to_branch: branches[1].id,
      sender_id: customers[0].id,
      receiver_id: customers[1].id,
      article_id: articles[0].id, // Required by old schema
      payment_type: 'Paid',
      delivery_type: 'Standard',
      priority: 'Normal',
      status: 'booked',
      total_amount: 0,
      remarks: 'Multi-article test booking',
      // Fields that might be required
      uom: 'Nos',
      actual_weight: 40.5,
      quantity: 15,
      freight_per_qty: 0,
      loading_charges: 0,
      unloading_charges: 0,
      description: 'Multi-article shipment'
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      return;
    }


    // Test if booking_articles table works
    
    const bookingArticles = [
      {
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
        unloading_charge_per_unit: 5
      }
    ];

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
        unloading_charge_per_unit: 10
      });
    }

    const { data: insertedArticles, error: articlesError } = await supabase
      .from('booking_articles')
      .insert(bookingArticles)
      .select('*, total_amount, total_loading_charges, total_unloading_charges');

    if (articlesError) {
      await supabase.from('bookings').delete().eq('id', booking.id);
      return;
    }


    // Display results
    
    let grandTotal = 0;
    insertedArticles.forEach((article, index) => {
      const art = articles.find(a => a.id === article.article_id);
      
      if (article.rate_type === 'per_kg') {
      } else {
      }
      
      
      grandTotal += article.total_amount;
    });


    // Check if booking total was updated
    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('id', booking.id)
      .single();

    
    if (updatedBooking && Math.abs(updatedBooking.total_amount - grandTotal) < 0.01) {
    } else {
    }


    // Cleanup test data
    await supabase.from('booking_articles').delete().eq('booking_id', booking.id);
    await supabase.from('bookings').delete().eq('id', booking.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
finalBookingTest();