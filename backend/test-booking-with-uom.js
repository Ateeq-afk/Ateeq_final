import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBookingSystemComplete() {

  try {
    // First, check the booking table structure
    const { data: bookingSample } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bookingSample && bookingSample.length > 0) {
    }

    // Get test data
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
      return;
    }

    // Create booking with all required fields from existing booking structure
    
    const bookingData = {
      branch_id: branches[0].id,
      lr_number: `TEST-MA-${Date.now()}`,
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
      remarks: 'Multi-article booking test',
      // Add fields that might be required based on error
      uom: 'Nos',
      actual_weight: 40.5, // Sum of article weights
      quantity: 15, // Sum of quantities
      freight_per_qty: 0,
      loading_charges: 0,
      unloading_charges: 0,
      description: 'Multiple articles shipment'
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      
      // Try with minimal fields
      const minimalBooking = {
        ...bookingData,
        article_id: articles[0].id // Add article_id if required
      };
      
      const { data: retryBooking, error: retryError } = await supabase
        .from('bookings')
        .insert(minimalBooking)
        .select()
        .single();
      
      if (retryError) {
        return;
      } else {
        return; // Old schema, can't test multi-article
      }
    }


    // Add articles to booking_articles table
    
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
        unloading_charge_per_unit: 5,
        description: `${articles[0].name} - Per KG rate example`
      },
      {
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
        description: `${articles[1].name} - Per quantity rate example`
      }
    ];

    const { data: insertedArticles, error: articlesError } = await supabase
      .from('booking_articles')
      .insert(bookingArticles)
      .select();

    if (articlesError) {
      await supabase.from('bookings').delete().eq('id', booking.id);
      return;
    }


    // Verify the complete booking
    
    const { data: finalBooking } = await supabase
      .from('bookings')
      .select('*, booking_articles(*)')
      .eq('id', booking.id)
      .single();

    if (finalBooking && finalBooking.booking_articles) {
      
      let calculatedTotal = 0;
      
      
      finalBooking.booking_articles.forEach((ba, index) => {
        const article = articles.find(a => a.id === ba.article_id);
        
        if (ba.rate_type === 'per_kg') {
        } else {
        }
        
        const loading = ba.total_loading_charges || (ba.loading_charge_per_unit * ba.quantity);
        const unloading = ba.total_unloading_charges || (ba.unloading_charge_per_unit * ba.quantity);
        
        
        calculatedTotal += ba.total_amount;
      });

      
      if (Math.abs(finalBooking.total_amount - calculatedTotal) < 0.01) {
      } else {
        
        // Try to manually update
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ total_amount: calculatedTotal })
          .eq('id', booking.id);
        
        if (!updateError) {
        }
      }
    }

    
    

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testBookingSystemComplete();