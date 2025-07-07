import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeSystem() {
  console.log('🔍 Analyzing DesiCargo System Status');
  console.log('=' .repeat(50));

  try {
    // Check existing bookings and their structure
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bookingError) {
      console.log('❌ Bookings table error:', bookingError.message);
    } else if (bookings && bookings.length > 0) {
      console.log('✅ Bookings table accessible');
      console.log('📋 Booking structure sample:');
      console.log('   Fields:', Object.keys(bookings[0]).join(', '));
    }

    // Check if articles table exists
    const { data: articles, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .limit(1);
    
    if (articleError) {
      console.log('❌ Articles table error:', articleError.message);
    } else {
      console.log('✅ Articles table accessible');
      console.log('📦 Articles count:', articles?.length || 0);
    }

    // Check customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customerError) {
      console.log('❌ Customers table error:', customerError.message);
    } else {
      console.log('✅ Customers table accessible');
      console.log('👥 Customers sample:', customers?.length || 0);
    }

    // Check vehicles
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .limit(1);
    
    if (vehicleError) {
      console.log('❌ Vehicles table error:', vehicleError.message);
    } else {
      console.log('✅ Vehicles table accessible');
      console.log('🚛 Vehicles count:', vehicles?.length || 0);
    }

    // Check OGPL
    const { data: ogpls, error: ogplError } = await supabase
      .from('ogpl')
      .select('*')
      .limit(1);
    
    if (ogplError) {
      console.log('❌ OGPL table error:', ogplError.message);
    } else {
      console.log('✅ OGPL table accessible');
      console.log('📋 OGPL count:', ogpls?.length || 0);
    }

    // Try to check if booking_articles exists
    const { data: bookingArticles, error: baError } = await supabase
      .from('booking_articles')
      .select('*')
      .limit(1);
    
    if (baError) {
      console.log('⚠️  booking_articles table:', baError.message);
    } else {
      console.log('✅ booking_articles table accessible');
      console.log('🔗 Booking articles count:', bookingArticles?.length || 0);
    }

    console.log('\n🎯 NEXT STEPS ANALYSIS');
    console.log('=' .repeat(30));
    
    // Based on the current state, suggest what to work on next
    const suggestions = [];

    if (baError && baError.code === '42P01') {
      suggestions.push({
        priority: 'HIGH',
        task: 'Create booking_articles table manually',
        description: 'The junction table migration didn\'t apply. We need to create this table to support multi-article bookings.',
        impact: 'Core feature - enables multiple articles per booking'
      });
    }

    suggestions.push({
      priority: 'MEDIUM',
      task: 'Frontend integration with new booking system',
      description: 'Update React components to use the new multi-article booking API',
      impact: 'User experience - enables users to actually use the new system'
    });

    suggestions.push({
      priority: 'MEDIUM', 
      task: 'Dashboard and analytics improvements',
      description: 'Enhance dashboard with article-level analytics and loading optimization insights',
      impact: 'Business intelligence - better operational visibility'
    });

    suggestions.push({
      priority: 'LOW',
      task: 'Customer rate auto-population',
      description: 'Auto-fill article rates based on customer-specific rate contracts',
      impact: 'User experience - faster booking creation'
    });

    suggestions.push({
      priority: 'LOW',
      task: 'Real-time notifications',
      description: 'Add WebSocket support for real-time booking and loading status updates',
      impact: 'User experience - live updates'
    });

    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. [${suggestion.priority}] ${suggestion.task}`);
      console.log(`   📄 ${suggestion.description}`);
      console.log(`   🎯 Impact: ${suggestion.impact}`);
    });

    console.log('\n💡 RECOMMENDATION');
    console.log('Choose based on your priorities:');
    console.log('• For immediate database completion: Work on #1 (booking_articles table)');
    console.log('• For user-facing improvements: Work on #2 (frontend integration)');
    console.log('• For operational insights: Work on #3 (dashboard enhancements)');

  } catch (error) {
    console.error('❌ System analysis failed:', error.message);
  }
}

analyzeSystem();