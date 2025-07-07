import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import app from '../../src/index';

export interface TestUser {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'operator';
  organization_id: string;
  branch_id: string;
  token: string;
}

export interface TestOrganization {
  id: string;
  name: string;
  code: string;
}

export interface TestBranch {
  id: string;
  name: string;
  code: string;
  organization_id: string;
}

export class TestDatabase {
  private supabase;
  private createdRecords: Array<{ table: string; id: string }> = [];

  constructor() {
    const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async createTestOrganization(): Promise<TestOrganization> {
    const orgData = {
      name: `Test Org ${Date.now()}`,
      code: `TEST${Date.now()}`,
      address: 'Test Address',
      contact_email: 'test@example.com',
      contact_phone: '1234567890',
      is_active: true
    };

    const { data, error } = await this.supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test organization: ${error.message}`);
    
    this.createdRecords.push({ table: 'organizations', id: data.id });
    return data;
  }

  async createTestBranch(organizationId: string): Promise<TestBranch> {
    const branchData = {
      name: `Test Branch ${Date.now()}`,
      code: `TB${Date.now()}`,
      organization_id: organizationId,
      address: 'Test Branch Address',
      contact_email: 'branch@example.com',
      contact_phone: '0987654321',
      is_active: true
    };

    const { data, error } = await this.supabase
      .from('branches')
      .insert(branchData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test branch: ${error.message}`);
    
    this.createdRecords.push({ table: 'branches', id: data.id });
    return data;
  }

  async createTestUser(
    organizationId: string, 
    branchId: string, 
    role: TestUser['role'] = 'operator'
  ): Promise<TestUser> {
    const userData = {
      email: `test.user.${Date.now()}@example.com`,
      password_hash: '$2b$10$dummy.hash.for.testing.purposes',
      role,
      organization_id: organizationId,
      branch_id: branchId,
      first_name: 'Test',
      last_name: 'User',
      phone: '1234567890',
      is_active: true,
      email_verified: true
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    
    this.createdRecords.push({ table: 'users', id: data.id });

    // Generate JWT token for testing
    const token = jwt.sign(
      { 
        user_id: data.id, 
        email: data.email, 
        role: data.role,
        organization_id: organizationId,
        branch_id: branchId
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      organization_id: organizationId,
      branch_id: branchId,
      token
    };
  }

  async createTestCustomer(organizationId: string, branchId: string) {
    const customerData = {
      name: `Test Customer ${Date.now()}`,
      mobile: `98765${Date.now().toString().slice(-5)}`,
      email: `customer.${Date.now()}@example.com`,
      address: 'Test Customer Address',
      organization_id: organizationId,
      branch_id: branchId,
      customer_type: 'individual',
      is_active: true
    };

    const { data, error } = await this.supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test customer: ${error.message}`);
    
    this.createdRecords.push({ table: 'customers', id: data.id });
    return data;
  }

  async createTestVehicle(organizationId: string, branchId: string) {
    const vehicleData = {
      vehicle_number: `TEST${Date.now()}`,
      vehicle_type: 'truck',
      capacity_kg: 5000,
      organization_id: organizationId,
      branch_id: branchId,
      driver_name: 'Test Driver',
      driver_phone: '9876543210',
      is_active: true
    };

    const { data, error } = await this.supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test vehicle: ${error.message}`);
    
    this.createdRecords.push({ table: 'vehicles', id: data.id });
    return data;
  }

  async cleanup() {
    // Clean up in reverse order to handle foreign key constraints
    const reversedRecords = [...this.createdRecords].reverse();
    
    for (const record of reversedRecords) {
      try {
        await this.supabase
          .from(record.table)
          .delete()
          .eq('id', record.id);
      } catch (error) {
        console.warn(`Failed to cleanup ${record.table}:${record.id}:`, error);
      }
    }
    
    this.createdRecords = [];
  }
}

export class ApiTestClient {
  private request: request.SuperTest<request.Test>;

  constructor() {
    this.request = request(app);
  }

  // Authentication helpers
  authenticatedRequest(token: string) {
    return {
      get: (url: string) => this.request.get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string) => this.request.post(url).set('Authorization', `Bearer ${token}`),
      put: (url: string) => this.request.put(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) => this.request.patch(url).set('Authorization', `Bearer ${token}`),
      delete: (url: string) => this.request.delete(url).set('Authorization', `Bearer ${token}`)
    };
  }

  // Branch context helpers
  withBranchContext(token: string, branchId: string, organizationId: string) {
    return {
      get: (url: string) => this.request.get(url)
        .set('Authorization', `Bearer ${token}`)
        .set('x-branch-id', branchId)
        .set('x-organization-id', organizationId),
      post: (url: string) => this.request.post(url)
        .set('Authorization', `Bearer ${token}`)
        .set('x-branch-id', branchId)
        .set('x-organization-id', organizationId),
      put: (url: string) => this.request.put(url)
        .set('Authorization', `Bearer ${token}`)
        .set('x-branch-id', branchId)
        .set('x-organization-id', organizationId),
      patch: (url: string) => this.request.patch(url)
        .set('Authorization', `Bearer ${token}`)
        .set('x-branch-id', branchId)
        .set('x-organization-id', organizationId),
      delete: (url: string) => this.request.delete(url)
        .set('Authorization', `Bearer ${token}`)
        .set('x-branch-id', branchId)
        .set('x-organization-id', organizationId)
    };
  }

  // Unauthenticated requests
  get request() {
    return this.request;
  }
}

// Test data generators
export const generateTestBookingData = (senderId: string, receiverId: string) => ({
  sender_id: senderId,
  receiver_id: receiverId,
  from_location: 'Mumbai',
  to_location: 'Delhi',
  pickup_date: new Date().toISOString(),
  delivery_type: 'standard',
  payment_mode: 'cash',
  articles: [
    {
      name: 'Test Article',
      quantity: 2,
      weight_kg: 10,
      dimensions: { length: 30, width: 20, height: 15 },
      freight_amount: 500,
      rate_type: 'per_kg',
      rate_value: 50
    }
  ]
});

export const generateTestCustomerData = () => ({
  name: `Test Customer ${Date.now()}`,
  mobile: `98765${Date.now().toString().slice(-5)}`,
  email: `customer.${Date.now()}@example.com`,
  address: 'Test Customer Address',
  customer_type: 'individual'
});

export const generateTestArticleData = () => ({
  name: `Test Article ${Date.now()}`,
  description: 'Test article description',
  weight_kg: 5,
  dimensions: { length: 20, width: 15, height: 10 },
  value: 1000,
  category: 'electronics'
});

// Response validators
export const validateApiResponse = (response: any) => {
  expect(response.body).toMatchApiResponse();
  expect(response.body.timestamp).toBeDefined();
  return response.body;
};

export const validateSuccessResponse = (response: any, expectedData?: any) => {
  const body = validateApiResponse(response);
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  
  if (expectedData) {
    expect(body.data).toMatchObject(expectedData);
  }
  
  return body.data;
};

export const validateErrorResponse = (response: any, expectedStatus: number, expectedError?: string) => {
  const body = validateApiResponse(response);
  expect(response.status).toBe(expectedStatus);
  expect(body.success).toBe(false);
  expect(body.error).toBeDefined();
  
  if (expectedError) {
    expect(body.error).toContain(expectedError);
  }
  
  return body;
};

// Utility functions
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => Promise<T>, 
  maxAttempts: number = 3, 
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;
      await wait(delay * attempt);
    }
  }
  
  throw lastError!;
};

export default {
  TestDatabase,
  ApiTestClient,
  generateTestBookingData,
  generateTestCustomerData,
  generateTestArticleData,
  validateApiResponse,
  validateSuccessResponse,
  validateErrorResponse,
  wait,
  retry
};