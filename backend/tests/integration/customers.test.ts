import {
  TestDatabase,
  ApiTestClient,
  validateSuccessResponse,
  validateErrorResponse,
  generateTestCustomerData
} from '../helpers/testHelpers';
import { testCustomers } from '../fixtures/testData';

describe('Customers API', () => {
  let testDb: TestDatabase;
  let apiClient: ApiTestClient;
  let testOrg: any;
  let testBranch: any;
  let testUser: any;
  let adminUser: any;

  beforeAll(async () => {
    testDb = new TestDatabase();
    apiClient = new ApiTestClient();

    // Create test organization and branch
    testOrg = await testDb.createTestOrganization();
    testBranch = await testDb.createTestBranch(testOrg.id);

    // Create test users
    testUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'operator');
    adminUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'admin');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  describe('GET /api/customers', () => {
    let testCustomer: any;

    beforeAll(async () => {
      // Create a test customer
      testCustomer = await testDb.createTestCustomer(testOrg.id, testBranch.id);
    });

    it('should fetch all customers with pagination', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/customers')
        .expect(200);

      const data = validateSuccessResponse(response);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Check customer structure
      const customer = data.find((c: any) => c.id === testCustomer.id);
      expect(customer).toBeDefined();
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('mobile');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('address');
      expect(customer).toHaveProperty('customer_type');
      expect(customer.organization_id).toBe(testOrg.id);
      expect(customer.branch_id).toBe(testBranch.id);
    });

    it('should support pagination parameters', async () => {
      // Create multiple customers
      for (let i = 0; i < 5; i++) {
        await testDb.createTestCustomer(testOrg.id, testBranch.id);
      }

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/customers?page=1&pageSize=3')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(3);
    });

    it('should support search functionality', async () => {
      // Create customer with specific name
      const searchableCustomer = await testDb.createTestCustomer(testOrg.id, testBranch.id);
      
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers?search=${encodeURIComponent(searchableCustomer.name)}`)
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // Should find the customer
      const foundCustomer = data.find((c: any) => c.id === searchableCustomer.id);
      expect(foundCustomer).toBeDefined();
    });

    it('should support customer type filtering', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/customers?type=individual')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // All returned customers should be individual type
      data.forEach((customer: any) => {
        expect(customer.customer_type).toBe('individual');
      });
    });

    it('should support sorting', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/customers?sortBy=name&sortDirection=asc')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // Should be sorted by name in ascending order
      if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          expect(data[i].name.localeCompare(data[i-1].name)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should include branch information', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/customers')
        .expect(200);

      const data = validateSuccessResponse(response);
      
      if (data.length > 0) {
        const customer = data[0];
        expect(customer).toHaveProperty('branch');
        expect(customer.branch).toHaveProperty('name');
        expect(customer.branch).toHaveProperty('code');
      }
    });

    it('should require authentication', async () => {
      const response = await apiClient.request
        .get('/api/customers')
        .expect(401);

      validateErrorResponse(response, 401, 'No token');
    });

    it('should require branch context', async () => {
      const response = await apiClient
        .authenticatedRequest(testUser.token)
        .get('/api/customers')
        .expect(400);

      validateErrorResponse(response, 400, 'Branch ID');
    });

    it('should filter customers by branch for operators', async () => {
      // Create another branch and customer
      const otherBranch = await testDb.createTestBranch(testOrg.id);
      const otherUser = await testDb.createTestUser(testOrg.id, otherBranch.id, 'operator');
      await testDb.createTestCustomer(testOrg.id, otherBranch.id);

      // Operator should only see their branch customers
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/customers')
        .expect(200);

      const data = validateSuccessResponse(response);
      data.forEach((customer: any) => {
        expect(customer.branch_id).toBe(testBranch.id);
      });
    });

    it('should allow admin to see customers from all branches', async () => {
      const response = await apiClient
        .withBranchContext(adminUser.token, testBranch.id, testOrg.id)
        .get('/api/customers')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      // Admin can see customers from multiple branches
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer successfully', async () => {
      const customerData = {
        ...testCustomers.individual,
        name: `Test Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        email: `customer.${Date.now()}@example.com`
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      const data = validateSuccessResponse(response);

      expect(data).toHaveProperty('id');
      expect(data.name).toBe(customerData.name);
      expect(data.mobile).toBe(customerData.mobile);
      expect(data.email).toBe(customerData.email);
      expect(data.address).toBe(customerData.address);
      expect(data.customer_type).toBe(customerData.customer_type);
      expect(data.organization_id).toBe(testOrg.id);
      expect(data.branch_id).toBe(testBranch.id);
      expect(data.is_active).toBe(true);
    });

    it('should create business customer with GST number', async () => {
      const customerData = {
        ...testCustomers.business,
        name: `Business Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        email: `business.${Date.now()}@example.com`
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      const data = validateSuccessResponse(response);

      expect(data.customer_type).toBe('business');
      expect(data.gst_number).toBe(customerData.gst_number);
      expect(data.credit_limit).toBe(customerData.credit_limit);
      expect(data.credit_days).toBe(customerData.credit_days);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        mobile: '9876543210'
        // Missing required name field
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(invalidData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate mobile number format', async () => {
      const customerData = {
        ...testCustomers.individual,
        name: `Test Customer ${Date.now()}`,
        mobile: 'invalid-mobile'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate email format', async () => {
      const customerData = {
        ...testCustomers.individual,
        name: `Test Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        email: 'invalid-email'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate customer type', async () => {
      const customerData = {
        ...testCustomers.individual,
        name: `Test Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        customer_type: 'invalid_type'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should prevent duplicate mobile numbers within organization', async () => {
      const customerData = {
        ...testCustomers.individual,
        name: `Test Customer ${Date.now()}`,
        mobile: '9876543999' // Use fixed mobile for duplicate test
      };

      // Create first customer
      await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      // Try to create duplicate
      const duplicateData = {
        ...customerData,
        name: 'Different Name',
        email: 'different@example.com'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(duplicateData)
        .expect(409);

      validateErrorResponse(response, 409, 'already exists');
    });

    it('should auto-assign organization and branch', async () => {
      const customerData = {
        ...testCustomers.individual,
        name: `Test Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      const data = validateSuccessResponse(response);
      expect(data.organization_id).toBe(testOrg.id);
      expect(data.branch_id).toBe(testBranch.id);
    });

    it('should set default values for optional fields', async () => {
      const customerData = {
        name: `Minimal Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        customer_type: 'individual'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      const data = validateSuccessResponse(response);
      expect(data.is_active).toBe(true);
      expect(data.credit_limit).toBe(0);
      expect(data.credit_days).toBe(0);
    });
  });

  describe('GET /api/customers/:id', () => {
    let testCustomer: any;

    beforeAll(async () => {
      testCustomer = await testDb.createTestCustomer(testOrg.id, testBranch.id);
    });

    it('should fetch single customer by ID', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers/${testCustomer.id}`)
        .expect(200);

      const data = validateSuccessResponse(response);

      expect(data.id).toBe(testCustomer.id);
      expect(data.name).toBe(testCustomer.name);
      expect(data.mobile).toBe(testCustomer.mobile);
      expect(data.email).toBe(testCustomer.email);
    });

    it('should return 404 for non-existent customer', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers/${nonExistentId}`)
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });

    it('should validate UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers/${invalidId}`)
        .expect(400);

      validateErrorResponse(response, 400, 'Invalid');
    });

    it('should enforce branch isolation for operators', async () => {
      // Create customer in another branch
      const otherBranch = await testDb.createTestBranch(testOrg.id);
      const otherUser = await testDb.createTestUser(testOrg.id, otherBranch.id, 'operator');
      const otherCustomer = await testDb.createTestCustomer(testOrg.id, otherBranch.id);

      // Original user should not be able to access customer from other branch
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers/${otherCustomer.id}`)
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });

    it('should allow admin to access customers from other branches', async () => {
      // Create customer in another branch
      const otherBranch = await testDb.createTestBranch(testOrg.id);
      const otherCustomer = await testDb.createTestCustomer(testOrg.id, otherBranch.id);

      // Admin should be able to access customer from any branch
      const response = await apiClient
        .withBranchContext(adminUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers/${otherCustomer.id}`)
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(data.id).toBe(otherCustomer.id);
      expect(data.branch_id).toBe(otherBranch.id);
    });
  });

  describe('PUT /api/customers/:id', () => {
    let testCustomer: any;

    beforeEach(async () => {
      testCustomer = await testDb.createTestCustomer(testOrg.id, testBranch.id);
    });

    it('should update customer successfully', async () => {
      const updateData = {
        name: 'Updated Customer Name',
        address: 'Updated Address',
        credit_limit: 100000
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .put(`/api/customers/${testCustomer.id}`)
        .send(updateData)
        .expect(200);

      const data = validateSuccessResponse(response);

      expect(data.id).toBe(testCustomer.id);
      expect(data.name).toBe(updateData.name);
      expect(data.address).toBe(updateData.address);
      expect(data.credit_limit).toBe(updateData.credit_limit);
    });

    it('should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email-format'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .put(`/api/customers/${testCustomer.id}`)
        .send(invalidData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should return 404 for non-existent customer', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        name: 'Updated Name'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .put(`/api/customers/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });

    it('should prevent updating mobile to duplicate value', async () => {
      const anotherCustomer = await testDb.createTestCustomer(testOrg.id, testBranch.id);

      const updateData = {
        mobile: anotherCustomer.mobile
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .put(`/api/customers/${testCustomer.id}`)
        .send(updateData)
        .expect(409);

      validateErrorResponse(response, 409, 'already exists');
    });

    it('should not allow updating organization or branch', async () => {
      const otherOrg = await testDb.createTestOrganization();
      const updateData = {
        organization_id: otherOrg.id,
        name: 'Updated Name'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .put(`/api/customers/${testCustomer.id}`)
        .send(updateData)
        .expect(200);

      const data = validateSuccessResponse(response);
      // Organization should remain unchanged
      expect(data.organization_id).toBe(testOrg.id);
      expect(data.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    let testCustomer: any;

    beforeEach(async () => {
      testCustomer = await testDb.createTestCustomer(testOrg.id, testBranch.id);
    });

    it('should soft delete customer', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .delete(`/api/customers/${testCustomer.id}`)
        .expect(200);

      validateSuccessResponse(response);

      // Customer should be marked as inactive, not deleted
      const checkResponse = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers/${testCustomer.id}`)
        .expect(200);

      const data = validateSuccessResponse(checkResponse);
      expect(data.is_active).toBe(false);
    });

    it('should return 404 for non-existent customer', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .delete(`/api/customers/${nonExistentId}`)
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });

    it('should prevent deletion if customer has active bookings', async () => {
      // Create a booking with this customer
      const receiver = await testDb.createTestCustomer(testOrg.id, testBranch.id);
      const bookingData = generateTestBookingData(testCustomer.id, receiver.id);

      await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      // Try to delete customer with active booking
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .delete(`/api/customers/${testCustomer.id}`)
        .expect(400);

      validateErrorResponse(response, 400, 'active bookings');
    });
  });

  describe('Customer search and filtering', () => {
    beforeAll(async () => {
      // Create customers with different attributes for search testing
      await testDb.createTestCustomer(testOrg.id, testBranch.id);
      await testDb.createTestCustomer(testOrg.id, testBranch.id);
      await testDb.createTestCustomer(testOrg.id, testBranch.id);
    });

    it('should search by customer name', async () => {
      const searchTerm = 'Test Customer';

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers?search=${encodeURIComponent(searchTerm)}`)
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // All results should contain the search term in name
      data.forEach((customer: any) => {
        expect(customer.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    });

    it('should search by mobile number', async () => {
      const customer = await testDb.createTestCustomer(testOrg.id, testBranch.id);
      const mobileSearch = customer.mobile.slice(-4); // Last 4 digits

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers?search=${mobileSearch}`)
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // Should find the customer
      const foundCustomer = data.find((c: any) => c.id === customer.id);
      expect(foundCustomer).toBeDefined();
    });

    it('should handle empty search results', async () => {
      const nonExistentSearch = 'NonExistentCustomerName123456';

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/customers?search=${encodeURIComponent(nonExistentSearch)}`)
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should filter by active status', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/customers?active=true')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
      
      // All customers should be active
      data.forEach((customer: any) => {
        expect(customer.is_active).toBe(true);
      });
    });
  });

  describe('Customer data validation', () => {
    it('should validate GST number format for business customers', async () => {
      const customerData = {
        ...testCustomers.business,
        name: `Business Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        gst_number: 'INVALID_GST'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate credit limit is non-negative', async () => {
      const customerData = {
        ...testCustomers.business,
        name: `Business Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        credit_limit: -1000
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate credit days is non-negative', async () => {
      const customerData = {
        ...testCustomers.business,
        name: `Business Customer ${Date.now()}`,
        mobile: `98765${Date.now().toString().slice(-5)}`,
        credit_days: -30
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/customers')
        .send(customerData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });
  });
});