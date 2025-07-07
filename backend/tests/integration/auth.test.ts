import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../../src/index';
import { TestDatabase, ApiTestClient, validateSuccessResponse, validateErrorResponse } from '../helpers/testHelpers';
import { testUsers, testOrganizations, testBranches } from '../fixtures/testData';

describe('Authentication Endpoints', () => {
  let testDb: TestDatabase;
  let apiClient: ApiTestClient;
  let testOrg: any;
  let testBranch: any;

  beforeAll(async () => {
    testDb = new TestDatabase();
    apiClient = new ApiTestClient();
    
    // Create test organization and branch
    testOrg = await testDb.createTestOrganization();
    testBranch = await testDb.createTestBranch(testOrg.id);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        ...testUsers.operator,
        organization_id: testOrg.id,
        branch_id: testBranch.id
      };

      const response = await apiClient.request
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const data = validateSuccessResponse(response);
      
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.email).toBe(userData.email);
      expect(data.user.role).toBe(userData.role);
      expect(data.user.organization_id).toBe(testOrg.id);
      expect(data.user.branch_id).toBe(testBranch.id);
      
      // Should not return password
      expect(data.user).not.toHaveProperty('password');
      expect(data.user).not.toHaveProperty('password_hash');
      
      // Token should be valid JWT
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'test-secret') as any;
      expect(decoded.user_id).toBe(data.user.id);
      expect(decoded.email).toBe(userData.email);
    });

    it('should validate required fields', async () => {
      const response = await apiClient.request
        .post('/api/auth/register')
        .send({})
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate email format', async () => {
      const userData = {
        ...testUsers.operator,
        email: 'invalid-email',
        organization_id: testOrg.id,
        branch_id: testBranch.id
      };

      const response = await apiClient.request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate password strength', async () => {
      const userData = {
        ...testUsers.operator,
        password: '123',
        organization_id: testOrg.id,
        branch_id: testBranch.id
      };

      const response = await apiClient.request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        ...testUsers.admin,
        organization_id: testOrg.id,
        branch_id: testBranch.id
      };

      // Register first user
      await apiClient.request
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await apiClient.request
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      validateErrorResponse(response, 409, 'already exists');
    });

    it('should validate organization and branch existence', async () => {
      const userData = {
        ...testUsers.operator,
        organization_id: '00000000-0000-0000-0000-000000000000',
        branch_id: '00000000-0000-0000-0000-000000000000'
      };

      const response = await apiClient.request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      validateErrorResponse(response, 400);
    });
  });

  describe('POST /api/auth/login', () => {
    let registeredUser: any;

    beforeAll(async () => {
      // Register a user for login tests
      const userData = {
        ...testUsers.operator,
        email: 'login.test@example.com',
        organization_id: testOrg.id,
        branch_id: testBranch.id
      };

      const response = await apiClient.request
        .post('/api/auth/register')
        .send(userData);

      registeredUser = response.body.data;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: testUsers.operator.password
      };

      const response = await apiClient.request
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const data = validateSuccessResponse(response);
      
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.email).toBe(loginData.email);
      expect(data.user.id).toBe(registeredUser.user.id);
      
      // Should not return password
      expect(data.user).not.toHaveProperty('password');
      expect(data.user).not.toHaveProperty('password_hash');
    });

    it('should reject invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUsers.operator.password
      };

      const response = await apiClient.request
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      validateErrorResponse(response, 401, 'Invalid');
    });

    it('should reject invalid password', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: 'wrongpassword'
      };

      const response = await apiClient.request
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      validateErrorResponse(response, 401, 'Invalid');
    });

    it('should validate required fields', async () => {
      const response = await apiClient.request
        .post('/api/auth/login')
        .send({})
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should reject login for inactive user', async () => {
      // Create an inactive user
      const inactiveUserData = {
        ...testUsers.operator,
        email: 'inactive.user@example.com',
        is_active: false,
        organization_id: testOrg.id,
        branch_id: testBranch.id
      };

      await testDb.supabase
        .from('users')
        .insert({
          ...inactiveUserData,
          password_hash: await bcrypt.hash(inactiveUserData.password, 10)
        });

      const loginData = {
        email: 'inactive.user@example.com',
        password: inactiveUserData.password
      };

      const response = await apiClient.request
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      validateErrorResponse(response, 401, 'Account is inactive');
    });

    it('should include user context in token', async () => {
      const loginData = {
        email: 'login.test@example.com',
        password: testUsers.operator.password
      };

      const response = await apiClient.request
        .post('/api/auth/login')
        .send(loginData);

      const data = validateSuccessResponse(response);
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'test-secret') as any;
      
      expect(decoded.user_id).toBe(data.user.id);
      expect(decoded.email).toBe(data.user.email);
      expect(decoded.role).toBe(data.user.role);
      expect(decoded.organization_id).toBe(data.user.organization_id);
      expect(decoded.branch_id).toBe(data.user.branch_id);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'operator');
    });

    it('should return current user info with valid token', async () => {
      const response = await apiClient
        .authenticatedRequest(testUser.token)
        .get('/api/auth/me')
        .expect(200);

      const data = validateSuccessResponse(response);
      
      expect(data.id).toBe(testUser.id);
      expect(data.email).toBe(testUser.email);
      expect(data.role).toBe(testUser.role);
      expect(data.organization_id).toBe(testUser.organization_id);
      expect(data.branch_id).toBe(testUser.branch_id);
      
      // Should not return password
      expect(data).not.toHaveProperty('password');
      expect(data).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      const response = await apiClient.request
        .get('/api/auth/me')
        .expect(401);

      validateErrorResponse(response, 401, 'No token');
    });

    it('should reject request with invalid token', async () => {
      const response = await apiClient.request
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      validateErrorResponse(response, 401, 'Invalid token');
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { user_id: testUser.id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await apiClient.request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      validateErrorResponse(response, 401, 'Token expired');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'operator');
    });

    it('should refresh token with valid token', async () => {
      const response = await apiClient
        .authenticatedRequest(testUser.token)
        .post('/api/auth/refresh')
        .expect(200);

      const data = validateSuccessResponse(response);
      
      expect(data).toHaveProperty('token');
      expect(data.token).not.toBe(testUser.token);
      
      // New token should be valid
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'test-secret') as any;
      expect(decoded.user_id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
    });

    it('should reject refresh without token', async () => {
      const response = await apiClient.request
        .post('/api/auth/refresh')
        .expect(401);

      validateErrorResponse(response, 401, 'No token');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await apiClient.request
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      validateErrorResponse(response, 401, 'Invalid token');
    });
  });

  describe('Role-based access control', () => {
    let superadminUser: any;
    let adminUser: any;
    let operatorUser: any;

    beforeAll(async () => {
      superadminUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'superadmin');
      adminUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'admin');
      operatorUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'operator');
    });

    it('should allow superadmin access to admin endpoints', async () => {
      const response = await apiClient
        .authenticatedRequest(superadminUser.token)
        .get('/api/auth/me')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(data.role).toBe('superadmin');
    });

    it('should allow admin access to admin endpoints', async () => {
      const response = await apiClient
        .authenticatedRequest(adminUser.token)
        .get('/api/auth/me')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(data.role).toBe('admin');
    });

    it('should allow operator access to operator endpoints', async () => {
      const response = await apiClient
        .authenticatedRequest(operatorUser.token)
        .get('/api/auth/me')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(data.role).toBe('operator');
    });

    it('should include role in JWT token', async () => {
      [superadminUser, adminUser, operatorUser].forEach(user => {
        const decoded = jwt.verify(user.token, process.env.JWT_SECRET || 'test-secret') as any;
        expect(decoded.role).toBe(user.role);
      });
    });
  });

  describe('Organization and branch context', () => {
    let otherOrg: any;
    let otherBranch: any;
    let userFromOtherOrg: any;

    beforeAll(async () => {
      otherOrg = await testDb.createTestOrganization();
      otherBranch = await testDb.createTestBranch(otherOrg.id);
      userFromOtherOrg = await testDb.createTestUser(otherOrg.id, otherBranch.id, 'operator');
    });

    it('should include organization and branch in token', async () => {
      const decoded = jwt.verify(userFromOtherOrg.token, process.env.JWT_SECRET || 'test-secret') as any;
      
      expect(decoded.organization_id).toBe(otherOrg.id);
      expect(decoded.branch_id).toBe(otherBranch.id);
    });

    it('should return user with correct organization and branch', async () => {
      const response = await apiClient
        .authenticatedRequest(userFromOtherOrg.token)
        .get('/api/auth/me')
        .expect(200);

      const data = validateSuccessResponse(response);
      
      expect(data.organization_id).toBe(otherOrg.id);
      expect(data.branch_id).toBe(otherBranch.id);
    });
  });

  describe('Token security', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'operator');
    });

    it('should use secure JWT algorithm', async () => {
      const decoded = jwt.decode(testUser.token, { complete: true }) as any;
      expect(decoded.header.alg).toBe('HS256');
    });

    it('should have reasonable token expiration', async () => {
      const decoded = jwt.verify(testUser.token, process.env.JWT_SECRET || 'test-secret') as any;
      
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - decoded.iat;
      
      // Should expire between 1 hour and 24 hours
      expect(expiresIn).toBeGreaterThanOrEqual(3600); // 1 hour
      expect(expiresIn).toBeLessThanOrEqual(86400); // 24 hours
    });

    it('should include issued at timestamp', async () => {
      const decoded = jwt.verify(testUser.token, process.env.JWT_SECRET || 'test-secret') as any;
      
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should reject tokens with wrong secret', async () => {
      const fakeToken = jwt.sign(
        { user_id: testUser.id, email: testUser.email },
        'wrong-secret'
      );

      const response = await apiClient.request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      validateErrorResponse(response, 401, 'Invalid token');
    });
  });
});