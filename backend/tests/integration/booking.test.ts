import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { createClient } from '@supabase/supabase-js';
import app from '../../src/index';
import { v4 as uuidv4 } from 'uuid';

const request = supertest(app);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Booking Integration Tests', () => {
  let testOrgId: string;
  let testBranchId: string;
  let testUserId: string;
  let testCustomerId: string;
  let authToken: string;
  let firstBookingId: string;
  let firstLrNumber: string;

  beforeAll(async () => {
    // Create test organization
    testOrgId = uuidv4();
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        name: 'Test Booking Org',
        status: 'active'
      });
    
    if (orgError) throw new Error(`Failed to create organization: ${orgError.message}`);

    // Create test branch
    testBranchId = uuidv4();
    const { error: branchError } = await supabase
      .from('branches')
      .insert({
        id: testBranchId,
        organization_id: testOrgId,
        name: 'Test Booking Branch',
        code: 'TST',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        address: 'Test Address',
        is_active: true
      });
    
    if (branchError) throw new Error(`Failed to create branch: ${branchError.message}`);

    // Create test user with operator role
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `booking_test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Test Booking User'
        }
      }
    });

    if (authError || !authData.user) throw new Error(`Failed to create auth user: ${authError?.message}`);
    testUserId = authData.user.id;

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: authData.user.email,
        full_name: 'Test Booking User',
        role: 'operator',
        branch_id: testBranchId,
        organization_id: testOrgId,
        is_active: true
      });

    if (profileError) throw new Error(`Failed to create user profile: ${profileError.message}`);

    // Create test customer
    testCustomerId = uuidv4();
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        id: testCustomerId,
        name: 'Test Customer',
        code: 'TESTCUST001',
        email: 'customer@test.com',
        phone: '9876543210',
        address: 'Customer Test Address',
        city: 'Customer City',
        state: 'Customer State',
        pincode: '654321',
        gst_number: '29ABCDE1234F1Z5',
        organization_id: testOrgId,
        branch_id: testBranchId,
        credit_limit: 50000,
        current_outstanding: 0,
        is_active: true
      });

    if (customerError) throw new Error(`Failed to create customer: ${customerError.message}`);

    // Authenticate to get JWT token
    const loginResponse = await request
      .post('/api/auth/login')
      .send({
        email: authData.user.email,
        password: 'TestPassword123!'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.token).toBeDefined();
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up bookings
    await supabase
      .from('bookings')
      .delete()
      .or(`customer_id.eq.${testCustomerId},branch_id.eq.${testBranchId}`);

    // Clean up customer
    if (testCustomerId) {
      await supabase
        .from('customers')
        .delete()
        .eq('id', testCustomerId);
    }

    // Clean up user profile
    if (testUserId) {
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId);
    }

    // Clean up auth user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }

    // Clean up branch
    if (testBranchId) {
      await supabase
        .from('branches')
        .delete()
        .eq('id', testBranchId);
    }

    // Clean up organization
    if (testOrgId) {
      await supabase
        .from('organizations')
        .delete()
        .eq('id', testOrgId);
    }
  });

  describe('Successful Booking Creation (Happy Path)', () => {
    it('should create a new booking with valid data', async () => {
      const bookingPayload = {
        customer_id: testCustomerId,
        consignor_name: 'Test Consignor',
        consignor_phone: '9876543210',
        consignor_address: 'Consignor Address',
        consignor_city: 'Consignor City',
        consignor_pincode: '123456',
        consignee_name: 'Test Consignee',
        consignee_phone: '9876543211',
        consignee_address: 'Consignee Address',
        consignee_city: 'Consignee City',
        consignee_pincode: '654321',
        origin_branch_id: testBranchId,
        destination_branch_id: testBranchId,
        origin_address: 'Origin Test Address',
        destination_address: 'Destination Test Address',
        payment_mode: 'to_pay',
        billing_type: 'weight',
        is_priority: false,
        insurance_value: 0,
        total_packages: 1,
        total_weight: 10,
        freight_amount: 500,
        insurance_amount: 0,
        other_charges: 0,
        gst_amount: 90,
        total_amount: 590,
        booking_articles: [
          {
            article_type: 'Box',
            quantity: 1,
            weight: 10,
            unit_of_measurement: 'kg',
            length: 30,
            width: 20,
            height: 10,
            freight_amount: 500,
            description: 'Test Article'
          }
        ]
      };

      const response = await request
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.lr_number).toBeDefined();
      expect(response.body.data.lr_number).toMatch(/^[A-Z]{3}-[A-Z]{3}-\d{4}-\d{5}$/);
      
      firstBookingId = response.body.data.id;
      firstLrNumber = response.body.data.lr_number;

      // Verify in database
      const { data: dbBooking, error: dbError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', firstBookingId)
        .single();

      expect(dbError).toBeNull();
      expect(dbBooking).toBeDefined();
      expect(dbBooking.customer_id).toBe(testCustomerId);
      expect(dbBooking.consignor_name).toBe(bookingPayload.consignor_name);
      expect(dbBooking.destination_address).toBe(bookingPayload.destination_address);
      expect(dbBooking.total_amount).toBe(bookingPayload.total_amount);
      expect(dbBooking.lr_number).toBe(firstLrNumber);
    });
  });

  describe('Failed Booking Creation (Validation Tests)', () => {
    it('should fail when destination_address is missing', async () => {
      const invalidPayload = {
        customer_id: testCustomerId,
        consignor_name: 'Test Consignor',
        consignor_phone: '9876543210',
        consignor_address: 'Consignor Address',
        consignor_city: 'Consignor City',
        consignor_pincode: '123456',
        consignee_name: 'Test Consignee',
        consignee_phone: '9876543211',
        consignee_address: 'Consignee Address',
        consignee_city: 'Consignee City',
        consignee_pincode: '654321',
        origin_branch_id: testBranchId,
        destination_branch_id: testBranchId,
        origin_address: 'Origin Test Address',
        // destination_address missing
        payment_mode: 'to_pay',
        billing_type: 'weight',
        total_packages: 1,
        total_weight: 10,
        total_amount: 590,
        booking_articles: []
      };

      const response = await request
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('destination_address is required');
    });

    it('should fail when customer_id does not exist', async () => {
      const nonExistentCustomerId = uuidv4();
      const invalidPayload = {
        customer_id: nonExistentCustomerId,
        consignor_name: 'Test Consignor',
        consignor_phone: '9876543210',
        consignor_address: 'Consignor Address',
        consignor_city: 'Consignor City',
        consignor_pincode: '123456',
        consignee_name: 'Test Consignee',
        consignee_phone: '9876543211',
        consignee_address: 'Consignee Address',
        consignee_city: 'Consignee City',
        consignee_pincode: '654321',
        origin_branch_id: testBranchId,
        destination_branch_id: testBranchId,
        origin_address: 'Origin Test Address',
        destination_address: 'Destination Test Address',
        payment_mode: 'to_pay',
        billing_type: 'weight',
        total_packages: 1,
        total_weight: 10,
        total_amount: 590,
        booking_articles: []
      };

      const response = await request
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Customer not found');
    });
  });

  describe('LR Number Uniqueness Test', () => {
    it('should generate unique and sequential LR numbers', async () => {
      const secondBookingPayload = {
        customer_id: testCustomerId,
        consignor_name: 'Second Test Consignor',
        consignor_phone: '9876543212',
        consignor_address: 'Second Consignor Address',
        consignor_city: 'Consignor City',
        consignor_pincode: '123456',
        consignee_name: 'Second Test Consignee',
        consignee_phone: '9876543213',
        consignee_address: 'Second Consignee Address',
        consignee_city: 'Consignee City',
        consignee_pincode: '654321',
        origin_branch_id: testBranchId,
        destination_branch_id: testBranchId,
        origin_address: 'Second Origin Address',
        destination_address: 'Second Destination Address',
        payment_mode: 'to_pay',
        billing_type: 'weight',
        is_priority: false,
        insurance_value: 0,
        total_packages: 1,
        total_weight: 15,
        freight_amount: 750,
        insurance_amount: 0,
        other_charges: 0,
        gst_amount: 135,
        total_amount: 885,
        booking_articles: [
          {
            article_type: 'Box',
            quantity: 1,
            weight: 15,
            unit_of_measurement: 'kg',
            length: 40,
            width: 30,
            height: 20,
            freight_amount: 750,
            description: 'Second Test Article'
          }
        ]
      };

      const response = await request
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondBookingPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lr_number).toBeDefined();
      
      const secondLrNumber = response.body.data.lr_number;
      
      // Ensure LR numbers are different
      expect(secondLrNumber).not.toBe(firstLrNumber);
      
      // Extract sequence numbers from LR numbers (format: XXX-YYY-ZZZZ-NNNNN)
      const firstSequence = parseInt(firstLrNumber.split('-')[3]);
      const secondSequence = parseInt(secondLrNumber.split('-')[3]);
      
      // Ensure second LR number has a higher sequence
      expect(secondSequence).toBeGreaterThan(firstSequence);
    });
  });
});