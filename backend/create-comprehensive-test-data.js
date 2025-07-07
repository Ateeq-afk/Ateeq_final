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

async function createComprehensiveTestData() {
  console.log('🚀 Creating comprehensive test data...');
  console.log('==================================================');
  
  try {
    // 1. Get organization and branches
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'K2K Logistics')
      .single();
    
    if (!orgs) {
      console.error('❌ K2K Logistics organization not found');
      return;
    }
    
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('organization_id', orgs.id);
    
    const mumbai_branch = branches.find(b => b.city === 'Mumbai');
    const delhi_branch = branches.find(b => b.city === 'Delhi');
    
    console.log(`✅ Using organization: ${orgs.name}`);
    console.log(`✅ Found ${branches.length} branches`);
    
    // 2. Create customers
    console.log('\n📝 Creating customers...');
    const customers = [
      {
        name: 'Rajesh Textiles Ltd',
        email: 'orders@rateshtextiles.com',
        phone: '+91-98765-43210',
        address: 'Shop 15, Textile Market, Grant Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400007',
        gstin: '27AABCR1234M1Z5',
        organization_id: orgs.id,
        branch_id: mumbai_branch.id,
        customer_type: 'shipper',
        business_type: 'textile_manufacturer'
      },
      {
        name: 'Delhi Electronics Hub',
        email: 'purchase@delhielectronics.in',
        phone: '+91-98123-45678',
        address: 'A-25, Lajpat Nagar Market',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110024',
        gstin: '07DEFGH5678L1Z9',
        organization_id: orgs.id,
        branch_id: delhi_branch.id,
        customer_type: 'consignee',
        business_type: 'electronics_retail'
      },
      {
        name: 'Mumbai Fashion House',
        email: 'logistics@mumbaifashion.com',
        phone: '+91-98567-12345',
        address: 'Unit 12, Andheri Industrial Estate',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        gstin: '27MNPQR9876S1Z3',
        organization_id: orgs.id,
        branch_id: mumbai_branch.id,
        customer_type: 'both',
        business_type: 'fashion_retail'
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
    
    // 3. Create articles
    console.log('\n📦 Creating articles...');
    const articles = [
      {
        name: 'Cotton Fabric Rolls',
        description: 'Premium cotton fabric rolls for garment manufacturing',
        hsn_code: '52081000',
        unit_of_measurement: 'meters',
        organization_id: orgs.id,
        branch_id: mumbai_branch.id,
        category: 'textile',
        weight_per_unit: 0.5,
        fragile: false
      },
      {
        name: 'Smartphones (Bulk)',
        description: 'Latest model smartphones in bulk packaging',
        hsn_code: '85171100',
        unit_of_measurement: 'pieces',
        organization_id: orgs.id,
        branch_id: delhi_branch.id,
        category: 'electronics',
        weight_per_unit: 0.2,
        fragile: true
      },
      {
        name: 'Fashion Garments',
        description: 'Ready-made garments for retail distribution',
        hsn_code: '61099000',
        unit_of_measurement: 'pieces',
        organization_id: orgs.id,
        branch_id: mumbai_branch.id,
        category: 'fashion',
        weight_per_unit: 0.3,
        fragile: false
      },
      {
        name: 'Electronic Components',
        description: 'Various electronic components and accessories',
        hsn_code: '85299000',
        unit_of_measurement: 'kg',
        organization_id: orgs.id,
        branch_id: delhi_branch.id,
        category: 'electronics',
        weight_per_unit: 1.0,
        fragile: true
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
    
    // 4. Create vehicles
    console.log('\n🚛 Creating vehicles...');
    const vehicles = [
      {
        registration_number: 'MH-01-AB-1234',
        vehicle_type: 'truck',
        capacity: 10000,
        organization_id: orgs.id,
        branch_id: mumbai_branch.id,
        status: 'available',
        fuel_type: 'diesel',
        make: 'Tata',
        model: 'LPT 1613'
      },
      {
        registration_number: 'DL-02-CD-5678',
        vehicle_type: 'truck',
        capacity: 15000,
        organization_id: orgs.id,
        branch_id: delhi_branch.id,
        status: 'available',
        fuel_type: 'diesel',
        make: 'Ashok Leyland',
        model: 'Dost+'
      },
      {
        registration_number: 'MH-05-EF-9012',
        vehicle_type: 'tempo',
        capacity: 5000,
        organization_id: orgs.id,
        branch_id: mumbai_branch.id,
        status: 'available',
        fuel_type: 'diesel',
        make: 'Mahindra',
        model: 'Bolero Pickup'
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
    
    // 5. Create sample bookings
    console.log('\n📋 Creating sample bookings...');
    const { data: createdCustomers } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', orgs.id);
    
    const { data: createdArticles } = await supabase
      .from('articles')
      .select('*')
      .eq('organization_id', orgs.id);
    
    if (createdCustomers && createdCustomers.length > 0 && createdArticles && createdArticles.length > 0) {
      const bookings = [
        {
          lr_number: 'MUM-25-001',
          sender_id: createdCustomers[0].id,
          receiver_id: createdCustomers[1].id,
          from_branch_id: mumbai_branch.id,
          to_branch_id: delhi_branch.id,
          organization_id: orgs.id,
          branch_id: mumbai_branch.id,
          booking_date: new Date().toISOString(),
          delivery_type: 'door_to_door',
          payment_type: 'paid',
          freight_amount: 5000,
          total_amount: 5900,
          status: 'created',
          priority: 'normal',
          insurance_required: true,
          insurance_amount: 500,
          special_instructions: 'Handle with care - textile goods'
        },
        {
          lr_number: 'DEL-25-001',
          sender_id: createdCustomers[1].id,
          receiver_id: createdCustomers[2].id,
          from_branch_id: delhi_branch.id,
          to_branch_id: mumbai_branch.id,
          organization_id: orgs.id,
          branch_id: delhi_branch.id,
          booking_date: new Date().toISOString(),
          delivery_type: 'door_to_door',
          payment_type: 'topay',
          freight_amount: 3500,
          total_amount: 4130,
          status: 'loaded',
          priority: 'high',
          insurance_required: true,
          insurance_amount: 300,
          special_instructions: 'Fragile electronics - no rough handling'
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
    
    // 6. Create some warehouse records
    console.log('\n🏭 Creating warehouse data...');
    const warehouses = [
      {
        name: 'Mumbai Central Warehouse',
        address: 'Plot 45, MIDC Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400086',
        organization_id: orgs.id,
        branch_id: mumbai_branch.id,
        status: 'active',
        capacity: 50000
      },
      {
        name: 'Delhi Hub Warehouse',
        address: 'Sector 25, Gurgaon Industrial Area',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110037',
        organization_id: orgs.id,
        branch_id: delhi_branch.id,
        status: 'active',
        capacity: 75000
      }
    ];
    
    for (const warehouse of warehouses) {
      const { error } = await supabase
        .from('warehouses')
        .insert(warehouse);
      
      if (error) {
        console.log(`⚠️  Warehouse creation skipped: ${error.message}`);
      } else {
        console.log(`✅ Created warehouse: ${warehouse.name}`);
      }
    }
    
    console.log('\n🎉 Comprehensive test data creation completed!');
    console.log('==================================================');
    
    // Summary
    const { data: finalCustomers } = await supabase.from('customers').select('*', { count: 'exact' });
    const { data: finalArticles } = await supabase.from('articles').select('*', { count: 'exact' });
    const { data: finalVehicles } = await supabase.from('vehicles').select('*', { count: 'exact' });
    const { data: finalBookings } = await supabase.from('bookings').select('*', { count: 'exact' });
    const { data: finalWarehouses } = await supabase.from('warehouses').select('*', { count: 'exact' });
    
    console.log('📊 Final data summary:');
    console.log(`   Organizations: 1`);
    console.log(`   Branches: ${branches.length}`);
    console.log(`   Customers: ${finalCustomers?.length || 0}`);
    console.log(`   Articles: ${finalArticles?.length || 0}`);
    console.log(`   Vehicles: ${finalVehicles?.length || 0}`);
    console.log(`   Bookings: ${finalBookings?.length || 0}`);
    console.log(`   Warehouses: ${finalWarehouses?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

createComprehensiveTestData();