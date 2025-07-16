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
    
    
    // 2. Create customers
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
      } else {
      }
    }
    
    // 3. Create articles
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
      } else {
      }
    }
    
    // 4. Create vehicles
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
      } else {
      }
    }
    
    // 5. Create sample bookings
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
        } else {
        }
      }
    }
    
    // 6. Create some warehouse records
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
      } else {
      }
    }
    
    
    // Summary
    const { data: finalCustomers } = await supabase.from('customers').select('*', { count: 'exact' });
    const { data: finalArticles } = await supabase.from('articles').select('*', { count: 'exact' });
    const { data: finalVehicles } = await supabase.from('vehicles').select('*', { count: 'exact' });
    const { data: finalBookings } = await supabase.from('bookings').select('*', { count: 'exact' });
    const { data: finalWarehouses } = await supabase.from('warehouses').select('*', { count: 'exact' });
    
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

createComprehensiveTestData();