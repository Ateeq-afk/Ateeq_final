import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createMinimalData() {
  console.log('🚀 Creating minimal test data...');
  console.log('==================================================');
  
  try {
    // First, let's check what organizations exist
    console.log('🔍 Checking existing data...');
    const { data: existingOrgs } = await supabase
      .from('organizations')
      .select('*');
    
    console.log('Existing organizations:', existingOrgs);
    
    // Get the first organization (should be from the seed data)
    let org = existingOrgs?.[0];
    
    if (!org) {
      console.log('🏢 Creating organization...');
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: 'K2K Logistics'
        })
        .select()
        .single();
      
      if (orgError) {
        console.error('❌ Error creating organization:', orgError.message);
        return;
      }
      org = newOrg;
    }
    
    console.log('✅ Using organization:', org.name);
    
    // Check branches
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('organization_id', org.id);
    
    console.log(`✅ Found ${branches?.length || 0} branches`);
    
    // Create customers
    console.log('\n📝 Creating customers...');
    const customers = [
      {
        name: 'ABC Textiles Ltd',
        email: 'abc@textiles.com',
        phone: '+91-98765-43210',
        address: 'Mumbai Textile Market',
        organization_id: org.id,
        branch_id: branches?.[0]?.id
      },
      {
        name: 'XYZ Electronics',
        email: 'xyz@electronics.com', 
        phone: '+91-98123-45678',
        address: 'Delhi Electronics Hub',
        organization_id: org.id,
        branch_id: branches?.[1]?.id || branches?.[0]?.id
      }
    ];
    
    for (const customer of customers) {
      const { error } = await supabase
        .from('customers')
        .insert(customer);
      
      if (error) {
        console.log(`⚠️  Customer creation skipped: ${error.message}`);
      } else {
        console.log(`✅ Created customer: ${customer.name}`);
      }
    }
    
    // Create articles
    console.log('\n📦 Creating articles...');
    const articles = [
      {
        name: 'Cotton Fabric',
        hsn_code: '52081000',
        unit_of_measurement: 'meters',
        branch_id: branches?.[0]?.id
      },
      {
        name: 'Electronic Goods',
        hsn_code: '85171100', 
        unit_of_measurement: 'pieces',
        branch_id: branches?.[1]?.id || branches?.[0]?.id
      }
    ];
    
    for (const article of articles) {
      const { error } = await supabase
        .from('articles')
        .insert(article);
      
      if (error) {
        console.log(`⚠️  Article creation skipped: ${error.message}`);
      } else {
        console.log(`✅ Created article: ${article.name}`);
      }
    }
    
    // Create vehicles
    console.log('\n🚛 Creating vehicles...');
    const vehicles = [
      {
        registration_number: 'MH-01-AB-1234',
        vehicle_type: 'truck',
        capacity: 10000,
        organization_id: org.id,
        branch_id: branches?.[0]?.id,
        status: 'available'
      },
      {
        registration_number: 'DL-02-CD-5678',
        vehicle_type: 'truck', 
        capacity: 15000,
        organization_id: org.id,
        branch_id: branches?.[1]?.id || branches?.[0]?.id,
        status: 'available'
      }
    ];
    
    for (const vehicle of vehicles) {
      const { error } = await supabase
        .from('vehicles')
        .insert(vehicle);
      
      if (error) {
        console.log(`⚠️  Vehicle creation skipped: ${error.message}`);
      } else {
        console.log(`✅ Created vehicle: ${vehicle.registration_number}`);
      }
    }
    
    // Create sample bookings
    console.log('\n📋 Creating sample bookings...');
    const { data: createdCustomers } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', org.id)
      .limit(2);
    
    if (createdCustomers && createdCustomers.length >= 2) {
      const bookings = [
        {
          lr_number: 'MUM-25-001',
          sender_id: createdCustomers[0].id,
          receiver_id: createdCustomers[1].id,
          from_branch_id: branches?.[0]?.id,
          to_branch_id: branches?.[1]?.id || branches?.[0]?.id,
          organization_id: org.id,
          branch_id: branches?.[0]?.id,
          booking_date: new Date().toISOString(),
          freight_amount: 5000,
          total_amount: 5900,
          status: 'created'
        },
        {
          lr_number: 'DEL-25-002',
          sender_id: createdCustomers[1].id,
          receiver_id: createdCustomers[0].id,
          from_branch_id: branches?.[1]?.id || branches?.[0]?.id,
          to_branch_id: branches?.[0]?.id,
          organization_id: org.id,
          branch_id: branches?.[1]?.id || branches?.[0]?.id,
          booking_date: new Date().toISOString(),
          freight_amount: 3500,
          total_amount: 4130,
          status: 'loaded'
        }
      ];
      
      for (const booking of bookings) {
        const { error } = await supabase
          .from('bookings')
          .insert(booking);
        
        if (error) {
          console.log(`⚠️  Booking creation skipped: ${error.message}`);
        } else {
          console.log(`✅ Created booking: ${booking.lr_number}`);
        }
      }
    }
    
    console.log('\n🎉 Minimal test data creation completed!');
    console.log('==================================================');
    
    // Summary
    const { data: finalCustomers } = await supabase.from('customers').select('*', { count: 'exact' });
    const { data: finalArticles } = await supabase.from('articles').select('*', { count: 'exact' });
    const { data: finalVehicles } = await supabase.from('vehicles').select('*', { count: 'exact' });
    const { data: finalBookings } = await supabase.from('bookings').select('*', { count: 'exact' });
    
    console.log('📊 Final data summary:');
    console.log(`   Organizations: 1`);
    console.log(`   Branches: ${branches?.length || 0}`);
    console.log(`   Customers: ${finalCustomers?.length || 0}`);
    console.log(`   Articles: ${finalArticles?.length || 0}`);
    console.log(`   Vehicles: ${finalVehicles?.length || 0}`);
    console.log(`   Bookings: ${finalBookings?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

createMinimalData();