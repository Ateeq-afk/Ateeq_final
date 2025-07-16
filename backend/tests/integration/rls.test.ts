import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TestDatabase } from '../helpers/testHelpers';
import jwt from 'jsonwebtoken';

describe('Row Level Security (RLS) Policy Tests', () => {
  let testDb: TestDatabase;
  let serviceRoleClient: SupabaseClient;
  
  // Test data structure
  let orgA: any;
  let orgB: any;
  let branchA1: any;
  let branchA2: any;
  let branchB1: any;
  
  // Test users
  let normalUserA1: any; // Normal user in Org A, Branch 1
  let normalUserA2: any; // Normal user in Org A, Branch 2
  let normalUserB1: any; // Normal user in Org B, Branch 1
  let orgAdminA: any;    // Organization admin for Org A
  let superAdmin: any;   // Super admin with global access
  
  // Test bookings
  let bookingA1: any;    // Booking for Org A, Branch 1
  let bookingA2: any;    // Booking for Org A, Branch 2
  let bookingB1: any;    // Booking for Org B, Branch 1
  
  // Supabase configuration
  const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAnonKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  beforeAll(async () => {
    testDb = new TestDatabase();
    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create organizations
    const { data: orgAData, error: orgAError } = await serviceRoleClient
      .from('organizations')
      .insert({
        name: 'Organization A',
        code: 'ORGA',
        address: '123 Main St',
        contact_email: 'orga@example.com',
        contact_phone: '1234567890',
        is_active: true
      })
      .select()
      .single();
    
    if (orgAError) throw new Error(`Failed to create Org A: ${orgAError.message}`);
    orgA = orgAData;
    
    const { data: orgBData, error: orgBError } = await serviceRoleClient
      .from('organizations')
      .insert({
        name: 'Organization B',
        code: 'ORGB',
        address: '456 Other St',
        contact_email: 'orgb@example.com',
        contact_phone: '0987654321',
        is_active: true
      })
      .select()
      .single();
    
    if (orgBError) throw new Error(`Failed to create Org B: ${orgBError.message}`);
    orgB = orgBData;
    
    // Create branches
    const { data: branchA1Data, error: branchA1Error } = await serviceRoleClient
      .from('branches')
      .insert({
        name: 'Branch A1',
        code: 'BRA1',
        organization_id: orgA.id,
        address: '123 Branch A1 St',
        contact_email: 'brancha1@example.com',
        contact_phone: '1111111111',
        is_active: true
      })
      .select()
      .single();
    
    if (branchA1Error) throw new Error(`Failed to create Branch A1: ${branchA1Error.message}`);
    branchA1 = branchA1Data;
    
    const { data: branchA2Data, error: branchA2Error } = await serviceRoleClient
      .from('branches')
      .insert({
        name: 'Branch A2',
        code: 'BRA2',
        organization_id: orgA.id,
        address: '123 Branch A2 St',
        contact_email: 'brancha2@example.com',
        contact_phone: '2222222222',
        is_active: true
      })
      .select()
      .single();
    
    if (branchA2Error) throw new Error(`Failed to create Branch A2: ${branchA2Error.message}`);
    branchA2 = branchA2Data;
    
    const { data: branchB1Data, error: branchB1Error } = await serviceRoleClient
      .from('branches')
      .insert({
        name: 'Branch B1',
        code: 'BRB1',
        organization_id: orgB.id,
        address: '456 Branch B1 St',
        contact_email: 'branchb1@example.com',
        contact_phone: '3333333333',
        is_active: true
      })
      .select()
      .single();
    
    if (branchB1Error) throw new Error(`Failed to create Branch B1: ${branchB1Error.message}`);
    branchB1 = branchB1Data;
    
    // Create users using Supabase Auth
    // Normal user in Org A, Branch 1
    const { data: authUserA1, error: authErrorA1 } = await serviceRoleClient.auth.admin.createUser({
      email: 'user.a1@example.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (authErrorA1) throw new Error(`Failed to create auth user A1: ${authErrorA1.message}`);
    
    const { data: normalUserA1Data, error: userA1Error } = await serviceRoleClient
      .from('users')
      .insert({
        id: authUserA1.user.id,
        email: 'user.a1@example.com',
        role: 'operator',
        organization_id: orgA.id,
        branch_id: branchA1.id,
        first_name: 'User',
        last_name: 'A1',
        phone: '1234567890',
        is_active: true
      })
      .select()
      .single();
    
    if (userA1Error) throw new Error(`Failed to create user A1: ${userA1Error.message}`);
    normalUserA1 = normalUserA1Data;
    
    // Normal user in Org A, Branch 2
    const { data: authUserA2, error: authErrorA2 } = await serviceRoleClient.auth.admin.createUser({
      email: 'user.a2@example.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (authErrorA2) throw new Error(`Failed to create auth user A2: ${authErrorA2.message}`);
    
    const { data: normalUserA2Data, error: userA2Error } = await serviceRoleClient
      .from('users')
      .insert({
        id: authUserA2.user.id,
        email: 'user.a2@example.com',
        role: 'operator',
        organization_id: orgA.id,
        branch_id: branchA2.id,
        first_name: 'User',
        last_name: 'A2',
        phone: '2345678901',
        is_active: true
      })
      .select()
      .single();
    
    if (userA2Error) throw new Error(`Failed to create user A2: ${userA2Error.message}`);
    normalUserA2 = normalUserA2Data;
    
    // Normal user in Org B, Branch 1
    const { data: authUserB1, error: authErrorB1 } = await serviceRoleClient.auth.admin.createUser({
      email: 'user.b1@example.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (authErrorB1) throw new Error(`Failed to create auth user B1: ${authErrorB1.message}`);
    
    const { data: normalUserB1Data, error: userB1Error } = await serviceRoleClient
      .from('users')
      .insert({
        id: authUserB1.user.id,
        email: 'user.b1@example.com',
        role: 'operator',
        organization_id: orgB.id,
        branch_id: branchB1.id,
        first_name: 'User',
        last_name: 'B1',
        phone: '3456789012',
        is_active: true
      })
      .select()
      .single();
    
    if (userB1Error) throw new Error(`Failed to create user B1: ${userB1Error.message}`);
    normalUserB1 = normalUserB1Data;
    
    // Organization admin for Org A
    const { data: authOrgAdminA, error: authErrorAdminA } = await serviceRoleClient.auth.admin.createUser({
      email: 'admin.a@example.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (authErrorAdminA) throw new Error(`Failed to create auth admin A: ${authErrorAdminA.message}`);
    
    const { data: orgAdminAData, error: adminAError } = await serviceRoleClient
      .from('users')
      .insert({
        id: authOrgAdminA.user.id,
        email: 'admin.a@example.com',
        role: 'admin',
        organization_id: orgA.id,
        branch_id: branchA1.id,
        first_name: 'Admin',
        last_name: 'A',
        phone: '4567890123',
        is_active: true
      })
      .select()
      .single();
    
    if (adminAError) throw new Error(`Failed to create admin A: ${adminAError.message}`);
    orgAdminA = orgAdminAData;
    
    // Super admin
    const { data: authSuperAdmin, error: authErrorSuper } = await serviceRoleClient.auth.admin.createUser({
      email: 'super.admin@example.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (authErrorSuper) throw new Error(`Failed to create auth super admin: ${authErrorSuper.message}`);
    
    const { data: superAdminData, error: superError } = await serviceRoleClient
      .from('users')
      .insert({
        id: authSuperAdmin.user.id,
        email: 'super.admin@example.com',
        role: 'super_admin',
        organization_id: orgA.id, // Super admin needs to belong to some org
        branch_id: branchA1.id,
        first_name: 'Super',
        last_name: 'Admin',
        phone: '5678901234',
        is_active: true
      })
      .select()
      .single();
    
    if (superError) throw new Error(`Failed to create super admin: ${superError.message}`);
    superAdmin = superAdminData;
    
    // Create test customers
    const { data: customerA1, error: customerA1Error } = await serviceRoleClient
      .from('customers')
      .insert({
        name: 'Customer A1',
        code: 'CUSTA1',
        organization_id: orgA.id,
        branch_id: branchA1.id,
        email: 'customer.a1@example.com',
        phone: '1234567890',
        address: 'Customer A1 Address',
        is_active: true
      })
      .select()
      .single();
    
    if (customerA1Error) throw new Error(`Failed to create customer A1: ${customerA1Error.message}`);
    
    const { data: customerA2, error: customerA2Error } = await serviceRoleClient
      .from('customers')
      .insert({
        name: 'Customer A2',
        code: 'CUSTA2',
        organization_id: orgA.id,
        branch_id: branchA2.id,
        email: 'customer.a2@example.com',
        phone: '2345678901',
        address: 'Customer A2 Address',
        is_active: true
      })
      .select()
      .single();
    
    if (customerA2Error) throw new Error(`Failed to create customer A2: ${customerA2Error.message}`);
    
    const { data: customerB1, error: customerB1Error } = await serviceRoleClient
      .from('customers')
      .insert({
        name: 'Customer B1',
        code: 'CUSTB1',
        organization_id: orgB.id,
        branch_id: branchB1.id,
        email: 'customer.b1@example.com',
        phone: '3456789012',
        address: 'Customer B1 Address',
        is_active: true
      })
      .select()
      .single();
    
    if (customerB1Error) throw new Error(`Failed to create customer B1: ${customerB1Error.message}`);
    
    // Create test bookings
    const { data: bookingA1Data, error: bookingA1Error } = await serviceRoleClient
      .from('bookings')
      .insert({
        lr_number: 'LR-A1-001',
        booking_date: new Date().toISOString(),
        organization_id: orgA.id,
        branch_id: branchA1.id,
        from_branch_id: branchA1.id,
        to_branch_id: branchA2.id,
        customer_id: customerA1.id,
        consignor_name: 'Consignor A1',
        consignor_phone: '1111111111',
        consignee_name: 'Consignee A1',
        consignee_phone: '2222222222',
        from_location: 'Location A1',
        to_location: 'Location A2',
        rate_type: 'fixed',
        vehicle_type: 'small',
        payment_mode: 'cash',
        status: 'created',
        total_weight: 100,
        total_amount: 1000,
        created_by: normalUserA1.id
      })
      .select()
      .single();
    
    if (bookingA1Error) throw new Error(`Failed to create booking A1: ${bookingA1Error.message}`);
    bookingA1 = bookingA1Data;
    
    const { data: bookingA2Data, error: bookingA2Error } = await serviceRoleClient
      .from('bookings')
      .insert({
        lr_number: 'LR-A2-001',
        booking_date: new Date().toISOString(),
        organization_id: orgA.id,
        branch_id: branchA2.id,
        from_branch_id: branchA2.id,
        to_branch_id: branchA1.id,
        customer_id: customerA2.id,
        consignor_name: 'Consignor A2',
        consignor_phone: '3333333333',
        consignee_name: 'Consignee A2',
        consignee_phone: '4444444444',
        from_location: 'Location A2',
        to_location: 'Location A1',
        rate_type: 'fixed',
        vehicle_type: 'medium',
        payment_mode: 'credit',
        status: 'created',
        total_weight: 200,
        total_amount: 2000,
        created_by: normalUserA2.id
      })
      .select()
      .single();
    
    if (bookingA2Error) throw new Error(`Failed to create booking A2: ${bookingA2Error.message}`);
    bookingA2 = bookingA2Data;
    
    const { data: bookingB1Data, error: bookingB1Error } = await serviceRoleClient
      .from('bookings')
      .insert({
        lr_number: 'LR-B1-001',
        booking_date: new Date().toISOString(),
        organization_id: orgB.id,
        branch_id: branchB1.id,
        from_branch_id: branchB1.id,
        to_branch_id: branchB1.id,
        customer_id: customerB1.id,
        consignor_name: 'Consignor B1',
        consignor_phone: '5555555555',
        consignee_name: 'Consignee B1',
        consignee_phone: '6666666666',
        from_location: 'Location B1',
        to_location: 'Location B1',
        rate_type: 'fixed',
        vehicle_type: 'large',
        payment_mode: 'online',
        status: 'created',
        total_weight: 300,
        total_amount: 3000,
        created_by: normalUserB1.id
      })
      .select()
      .single();
    
    if (bookingB1Error) throw new Error(`Failed to create booking B1: ${bookingB1Error.message}`);
    bookingB1 = bookingB1Data;
  });

  afterAll(async () => {
    // Clean up test data in reverse order of creation
    await serviceRoleClient.from('bookings').delete().in('id', [bookingA1?.id, bookingA2?.id, bookingB1?.id].filter(Boolean));
    await serviceRoleClient.from('customers').delete().in('organization_id', [orgA?.id, orgB?.id].filter(Boolean));
    await serviceRoleClient.from('users').delete().in('id', [normalUserA1?.id, normalUserA2?.id, normalUserB1?.id, orgAdminA?.id, superAdmin?.id].filter(Boolean));
    await serviceRoleClient.from('branches').delete().in('id', [branchA1?.id, branchA2?.id, branchB1?.id].filter(Boolean));
    await serviceRoleClient.from('organizations').delete().in('id', [orgA?.id, orgB?.id].filter(Boolean));
    
    // Clean up auth users
    const authUsers = ['user.a1@example.com', 'user.a2@example.com', 'user.b1@example.com', 'admin.a@example.com', 'super.admin@example.com'];
    for (const email of authUsers) {
      const { data: users } = await serviceRoleClient.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === email);
      if (user) {
        await serviceRoleClient.auth.admin.deleteUser(user.id);
      }
    }
  });

  // Helper function to create authenticated Supabase client
  function createAuthenticatedClient(user: any): SupabaseClient {
    // Create a mock JWT token for the user
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: 'authenticated',
        aud: 'authenticated'
      },
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn: '1h' }
    );

    // Create a new Supabase client with the user's token
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false
      }
    });
  }

  describe('Data Isolation Test (Should Fail Access)', () => {
    it('should prevent normal user from Org A accessing bookings from Org B', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { data, error } = await userClient
        .from('bookings')
        .select('*')
        .eq('organization_id', orgB.id);
      
      expect(error).toBeNull();
      expect(data).toHaveLength(0); // Should return empty array due to RLS
    });
    
    it('should prevent normal user from accessing customers from different organization', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { data, error } = await userClient
        .from('customers')
        .select('*')
        .eq('organization_id', orgB.id);
      
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe('Cross-Branch Access Test (Should Fail Access)', () => {
    it('should prevent normal user from Branch A1 accessing bookings from Branch A2', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { data, error } = await userClient
        .from('bookings')
        .select('*')
        .eq('branch_id', branchA2.id);
      
      expect(error).toBeNull();
      expect(data).toHaveLength(0); // Should not see bookings from other branches
    });
    
    it('should prevent normal user from accessing vehicles from different branch', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      // First create a vehicle in branch A2
      await serviceRoleClient
        .from('vehicles')
        .insert({
          registration_number: 'TEST-A2-001',
          vehicle_type: 'truck',
          organization_id: orgA.id,
          branch_id: branchA2.id,
          is_active: true
        });
      
      const { data, error } = await userClient
        .from('vehicles')
        .select('*')
        .eq('branch_id', branchA2.id);
      
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
      
      // Cleanup
      await serviceRoleClient
        .from('vehicles')
        .delete()
        .eq('registration_number', 'TEST-A2-001');
    });
  });

  describe('Correct Access Test (Should Succeed)', () => {
    it('should allow normal user to access bookings from their own branch', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { data, error } = await userClient
        .from('bookings')
        .select('*')
        .eq('branch_id', branchA1.id);
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThan(0);
      expect(data![0].lr_number).toBe('LR-A1-001');
    });
    
    it('should allow normal user to access customers from their organization', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { data, error } = await userClient
        .from('customers')
        .select('*')
        .eq('organization_id', orgA.id);
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThan(0); // Should see customers from their org
    });
    
    it('should allow user to see bookings where they are involved (from/to branch)', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      // User A1 should see booking A2 because to_branch_id is A1
      const { data, error } = await userClient
        .from('bookings')
        .select('*')
        .eq('to_branch_id', branchA1.id);
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.some(b => b.lr_number === 'LR-A2-001')).toBe(true);
    });
  });

  describe('Organization Admin Access Test (Should Succeed)', () => {
    it('should allow org admin to access bookings from all branches in their organization', async () => {
      const adminClient = createAuthenticatedClient(orgAdminA);
      
      const { data, error } = await adminClient
        .from('bookings')
        .select('*')
        .eq('organization_id', orgA.id);
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(2); // Should see both A1 and A2 bookings
      expect(data!.some(b => b.lr_number === 'LR-A1-001')).toBe(true);
      expect(data!.some(b => b.lr_number === 'LR-A2-001')).toBe(true);
    });
    
    it('should prevent org admin from accessing data from other organizations', async () => {
      const adminClient = createAuthenticatedClient(orgAdminA);
      
      const { data, error } = await adminClient
        .from('bookings')
        .select('*')
        .eq('organization_id', orgB.id);
      
      expect(error).toBeNull();
      expect(data).toHaveLength(0); // Should not see Org B data
    });
    
    it('should allow org admin to manage branches in their organization', async () => {
      const adminClient = createAuthenticatedClient(orgAdminA);
      
      // Test creating a new branch
      const { data: newBranch, error: createError } = await adminClient
        .from('branches')
        .insert({
          name: 'Test Branch Admin',
          code: 'TBADM',
          organization_id: orgA.id,
          address: 'Test Address',
          contact_email: 'test@example.com',
          contact_phone: '9999999999',
          is_active: true
        })
        .select()
        .single();
      
      expect(createError).toBeNull();
      expect(newBranch).not.toBeNull();
      expect(newBranch!.organization_id).toBe(orgA.id);
      
      // Cleanup
      if (newBranch) {
        await serviceRoleClient
          .from('branches')
          .delete()
          .eq('id', newBranch.id);
      }
    });
  });

  describe('Super Admin Access Test (Should Succeed)', () => {
    it('should allow super admin to access all bookings across all organizations', async () => {
      const superClient = createAuthenticatedClient(superAdmin);
      
      const { data, error } = await superClient
        .from('bookings')
        .select('*')
        .order('lr_number');
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(3); // Should see all bookings (A1, A2, B1)
      expect(data!.some(b => b.organization_id === orgA.id)).toBe(true);
      expect(data!.some(b => b.organization_id === orgB.id)).toBe(true);
    });
    
    it('should allow super admin to access all organizations', async () => {
      const superClient = createAuthenticatedClient(superAdmin);
      
      const { data, error } = await superClient
        .from('organizations')
        .select('*')
        .in('id', [orgA.id, orgB.id]);
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(2);
    });
    
    it('should allow super admin to access all users', async () => {
      const superClient = createAuthenticatedClient(superAdmin);
      
      const { data, error } = await superClient
        .from('users')
        .select('*')
        .in('id', [normalUserA1.id, normalUserB1.id]);
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(2);
      expect(data!.some(u => u.organization_id === orgA.id)).toBe(true);
      expect(data!.some(u => u.organization_id === orgB.id)).toBe(true);
    });
  });

  describe('Update Prevention Test (Should Fail)', () => {
    it('should prevent normal user from updating bookings in different organization', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { data, error, count } = await userClient
        .from('bookings')
        .update({ consignee_name: 'Hacked Name' })
        .eq('id', bookingB1.id)
        .select();
      
      expect(error).toBeNull();
      expect(data).toHaveLength(0); // RLS should prevent the update
      expect(count).toBe(0);
    });
    
    it('should prevent normal user from deleting bookings in different branch', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { error, count } = await userClient
        .from('bookings')
        .delete()
        .eq('id', bookingA2.id)
        .select();
      
      expect(error).toBeNull();
      expect(count).toBe(0); // RLS should prevent the delete
      
      // Verify the booking still exists
      const { data: checkData } = await serviceRoleClient
        .from('bookings')
        .select('*')
        .eq('id', bookingA2.id)
        .single();
      
      expect(checkData).not.toBeNull();
    });
    
    it('should prevent users from escalating their own privileges', async () => {
      const userClient = createAuthenticatedClient(normalUserA1);
      
      const { data, error } = await userClient
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', normalUserA1.id)
        .select();
      
      // The update should either fail or not change the role
      if (!error) {
        expect(data).toHaveLength(1);
        expect(data![0].role).toBe('operator'); // Role should remain unchanged
      }
    });
    
    it('should prevent org admin from creating users in different organization', async () => {
      const adminClient = createAuthenticatedClient(orgAdminA);
      
      // First create auth user
      const { data: authUser, error: authError } = await serviceRoleClient.auth.admin.createUser({
        email: 'test.crossorg@example.com',
        password: 'password123',
        email_confirm: true
      });
      
      if (authError) throw new Error(`Failed to create test auth user: ${authError.message}`);
      
      const { data, error } = await adminClient
        .from('users')
        .insert({
          id: authUser.user.id,
          email: 'test.crossorg@example.com',
          role: 'operator',
          organization_id: orgB.id, // Different org
          branch_id: branchB1.id,
          first_name: 'Test',
          last_name: 'CrossOrg',
          phone: '9999999999',
          is_active: true
        })
        .select();
      
      expect(error).not.toBeNull(); // Should fail due to RLS
      
      // Cleanup auth user
      await serviceRoleClient.auth.admin.deleteUser(authUser.user.id);
    });
  });

  describe('Advanced RLS Tests', () => {
    it('should properly handle null branch_id for organization-level resources', async () => {
      // Create an org-level vehicle (no branch_id)
      const { data: vehicle } = await serviceRoleClient
        .from('vehicles')
        .insert({
          registration_number: 'ORG-VEHICLE-001',
          vehicle_type: 'truck',
          organization_id: orgA.id,
          branch_id: null, // Organization-level resource
          is_active: true
        })
        .select()
        .single();
      
      // Normal user from the org should see it
      const userClient = createAuthenticatedClient(normalUserA1);
      const { data: userVehicles } = await userClient
        .from('vehicles')
        .select('*')
        .eq('registration_number', 'ORG-VEHICLE-001');
      
      expect(userVehicles).toHaveLength(1);
      
      // User from different org should not see it
      const userBClient = createAuthenticatedClient(normalUserB1);
      const { data: userBVehicles } = await userBClient
        .from('vehicles')
        .select('*')
        .eq('registration_number', 'ORG-VEHICLE-001');
      
      expect(userBVehicles).toHaveLength(0);
      
      // Cleanup
      if (vehicle) {
        await serviceRoleClient
          .from('vehicles')
          .delete()
          .eq('id', vehicle.id);
      }
    });
    
    it('should handle complex booking visibility (from/to branch logic)', async () => {
      // Create a cross-branch booking
      const { data: crossBranchBooking } = await serviceRoleClient
        .from('bookings')
        .insert({
          lr_number: 'LR-CROSS-001',
          booking_date: new Date().toISOString(),
          organization_id: orgA.id,
          branch_id: branchA1.id,
          from_branch_id: branchA1.id,
          to_branch_id: branchA2.id,
          customer_id: (await serviceRoleClient.from('customers').select('id').eq('organization_id', orgA.id).limit(1).single()).data.id,
          consignor_name: 'Cross Consignor',
          consignor_phone: '7777777777',
          consignee_name: 'Cross Consignee', 
          consignee_phone: '8888888888',
          from_location: 'Cross From',
          to_location: 'Cross To',
          rate_type: 'fixed',
          vehicle_type: 'small',
          payment_mode: 'cash',
          status: 'created',
          total_weight: 50,
          total_amount: 500,
          created_by: normalUserA1.id
        })
        .select()
        .single();
      
      // User from branch A1 should see it (from_branch)
      const userA1Client = createAuthenticatedClient(normalUserA1);
      const { data: dataA1 } = await userA1Client
        .from('bookings')
        .select('*')
        .eq('lr_number', 'LR-CROSS-001');
      
      expect(dataA1).toHaveLength(1);
      
      // User from branch A2 should also see it (to_branch)
      const userA2Client = createAuthenticatedClient(normalUserA2);
      const { data: dataA2 } = await userA2Client
        .from('bookings')
        .select('*')
        .eq('lr_number', 'LR-CROSS-001');
      
      expect(dataA2).toHaveLength(1);
      
      // User from org B should not see it
      const userB1Client = createAuthenticatedClient(normalUserB1);
      const { data: dataB1 } = await userB1Client
        .from('bookings')
        .select('*')
        .eq('lr_number', 'LR-CROSS-001');
      
      expect(dataB1).toHaveLength(0);
      
      // Cleanup
      if (crossBranchBooking) {
        await serviceRoleClient
          .from('bookings')
          .delete()
          .eq('id', crossBranchBooking.id);
      }
    });
    
    it('should enforce RLS on related tables (articles)', async () => {
      // Create an article for booking B1
      const { data: article } = await serviceRoleClient
        .from('articles')
        .insert({
          booking_id: bookingB1.id,
          article_number: 'ART-B1-001',
          description: 'Test Article B1',
          quantity: 10,
          weight: 100,
          unit: 'kg',
          rate: 10,
          amount: 1000
        })
        .select()
        .single();
      
      // User from org A should not see articles from org B bookings
      const userA1Client = createAuthenticatedClient(normalUserA1);
      const { data: articlesA } = await userA1Client
        .from('articles')
        .select('*')
        .eq('booking_id', bookingB1.id);
      
      expect(articlesA).toHaveLength(0);
      
      // User from org B should see their articles
      const userB1Client = createAuthenticatedClient(normalUserB1);
      const { data: articlesB } = await userB1Client
        .from('articles')
        .select('*')
        .eq('booking_id', bookingB1.id);
      
      expect(articlesB).toHaveLength(1);
      
      // Cleanup
      if (article) {
        await serviceRoleClient
          .from('articles')
          .delete()
          .eq('id', article.id);
      }
    });
  });
});