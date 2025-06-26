import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seed() {
  try {
    // --- organizations ---
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: 'Acme Logistics',
        slug: 'acme-logistics',
        display_name: 'Acme Logistics',
        client_code: 'ACME',
        settings: {},
        usage_data: { bookings_count: 0, storage_used: 0, api_calls: 0, users_count: 0 }
      })
      .select()
      .single();
    if (orgErr) throw orgErr;

    // --- branches ---
    const { data: branches, error: branchErr } = await supabase
      .from('branches')
      .insert([
        { organization_id: org.id, name: 'Head Office', city: 'Mumbai', is_head_office: true, status: 'active' },
        { organization_id: org.id, name: 'Delhi Branch', city: 'Delhi', is_head_office: false, status: 'active' }
      ])
      .select();
    if (branchErr) throw branchErr;

    // --- users ---
    const { data: adminUser, error: adminAuthErr } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'password',
      email_confirm: true
    });
    if (adminAuthErr) throw adminAuthErr;

    const { error: adminInsertErr } = await supabase
      .from('users')
      .insert({
        id: adminUser.user.id,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        branch_id: branches[0].id
      });
    if (adminInsertErr) throw adminInsertErr;

    const { data: staffUser, error: staffAuthErr } = await supabase.auth.admin.createUser({
      email: 'staff@example.com',
      password: 'password',
      email_confirm: true
    });
    if (staffAuthErr) throw staffAuthErr;

    const { error: staffInsertErr } = await supabase
      .from('users')
      .insert({
        id: staffUser.user.id,
        name: 'Staff User',
        email: 'staff@example.com',
        role: 'staff',
        branch_id: branches[1].id
      });
    if (staffInsertErr) throw staffInsertErr;

    // --- customers ---
    const { error: custErr } = await supabase
      .from('customers')
      .insert([
        { branch_id: branches[0].id, name: 'Alice', mobile: '1111111111', type: 'individual' },
        { branch_id: branches[1].id, name: 'Bob Corp', mobile: '2222222222', type: 'company' }
      ]);
    if (custErr) throw custErr;

    // --- articles ---
    const { error: articleErr } = await supabase
      .from('articles')
      .insert([
        { branch_id: branches[0].id, name: 'General Goods', description: 'Standard freight', base_rate: 10 },
        { branch_id: branches[0].id, name: 'Fragile Goods', description: 'Handle with care', base_rate: 20 }
      ]);
    if (articleErr) throw articleErr;

    // --- vehicles ---
    const { error: vehicleErr } = await supabase
      .from('vehicles')
      .insert([
        { branch_id: branches[0].id, vehicle_number: 'MH01AA1234', type: 'own', make: 'Tata', model: '407', year: 2020, status: 'active', last_maintenance_date: null, next_maintenance_date: null },
        { branch_id: branches[1].id, vehicle_number: 'DL01BB5678', type: 'hired', make: 'Ashok Leyland', model: 'Ecomet', year: 2019, status: 'active', last_maintenance_date: null, next_maintenance_date: null }
      ]);
    if (vehicleErr) throw vehicleErr;

    console.log('Seed data inserted successfully');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

seed();
