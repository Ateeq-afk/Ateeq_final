import request from 'supertest';
import jwt from 'jsonwebtoken';
import { supabase } from '../../src/supabaseClient';
import app from '../../src/index';

describe('Authentication Integration Tests', () => {
  const testOrgCode = `test-org-${Date.now()}`;
  const testUsername = `testuser${Date.now()}`;
  const testPassword = 'Test@123456';
  const testEmail = `${testUsername}@${testOrgCode}.internal`;
  
  let organizationId: string;
  let branchId: string;
  let createdUserId: string;

  beforeAll(async () => {
    // Create test organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `Test Organization ${Date.now()}`,
        is_active: true
      })
      .select()
      .single();

    if (orgError || !org) {
      throw new Error('Failed to create test organization');
    }

    organizationId = org.id;

    // Create organization code
    const { error: codeError } = await supabase
      .from('organization_codes')
      .insert({
        organization_id: organizationId,
        code: testOrgCode,
        is_active: true
      });

    if (codeError) {
      throw new Error('Failed to create organization code');
    }

    // Create test branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        organization_id: organizationId,
        name: 'Test Branch',
        code: 'TB001',
        city: 'Test City',
        state: 'Test State',
        is_active: true
      })
      .select()
      .single();

    if (branchError || !branch) {
      throw new Error('Failed to create test branch');
    }

    branchId = branch.id;
  });

  afterAll(async () => {
    // Cleanup: Delete created users
    if (createdUserId) {
      try {
        // Delete from auth.users
        await supabase.auth.admin.deleteUser(createdUserId);
        
        // Delete from public.users
        await supabase
          .from('users')
          .delete()
          .eq('id', createdUserId);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }

    // Delete organization code
    await supabase
      .from('organization_codes')
      .delete()
      .eq('code', testOrgCode);

    // Delete branch
    if (branchId) {
      await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);
    }

    // Delete organization
    if (organizationId) {
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);
    }
  });

  describe('User Registration (/auth/org/create-user)', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        organizationCode: testOrgCode,
        username: testUsername,
        password: testPassword,
        email: null, // Will use synthetic email
        fullName: 'Test User',
        branchId: branchId,
        role: 'operator'
      };

      const response = await request(app)
        .post('/auth/org/create-user')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.username).toBe(testUsername);
      expect(response.body.data.full_name).toBe('Test User');
      expect(response.body.data.role).toBe('operator');
      expect(response.body.data.branch_id).toBe(branchId);
      expect(response.body.data.organization_id).toBe(organizationId);
      
      // Store user ID for cleanup
      createdUserId = response.body.data.id;
      
      // Should not return password
      expect(response.body.data.password).toBeUndefined();
    });

    it('should reject creation with invalid organization code', async () => {
      const userData = {
        organizationCode: 'invalid-org-code',
        username: 'anotheruser',
        password: testPassword,
        fullName: 'Another User',
        branchId: branchId,
        role: 'operator'
      };

      const response = await request(app)
        .post('/auth/org/create-user')
        .send(userData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid organization code');
    });

    it('should reject creation with duplicate username', async () => {
      const userData = {
        organizationCode: testOrgCode,
        username: testUsername, // Same username as created above
        password: testPassword,
        fullName: 'Duplicate User',
        branchId: branchId,
        role: 'operator'
      };

      const response = await request(app)
        .post('/auth/org/create-user')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Database Verification', () => {
    it('should verify user exists in database', async () => {
      // Query the users table directly
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', createdUserId)
        .single();

      expect(error).toBeNull();
      expect(user).toBeDefined();
      expect(user.username).toBe(testUsername);
      expect(user.organization_id).toBe(organizationId);
      expect(user.branch_id).toBe(branchId);
      expect(user.is_active).toBe(true);
      
      // Verify auth.users exists
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(createdUserId);
      
      expect(authError).toBeNull();
      expect(authUser.user).toBeDefined();
      expect(authUser.user.email).toBe(testEmail);
    });
  });

  describe('User Login (/auth/org/login)', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        organizationCode: testOrgCode,
        username: testUsername,
        password: testPassword
      };

      const response = await request(app)
        .post('/auth/org/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.session).toBeDefined();
      
      // Verify user data
      const user = response.body.data.user;
      expect(user.id).toBe(createdUserId);
      expect(user.username).toBe(testUsername);
      expect(user.organization_id).toBe(organizationId);
      expect(user.branch_id).toBe(branchId);
      
      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
      const decoded = jwt.verify(response.body.data.token, jwtSecret) as any;
      expect(decoded.userId).toBe(createdUserId);
      expect(decoded.username).toBe(testUsername);
      expect(decoded.organizationId).toBe(organizationId);
      expect(decoded.branchId).toBe(branchId);
      expect(decoded.role).toBe('operator');
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        organizationCode: testOrgCode,
        username: testUsername,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/org/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid username or password');
    });

    it('should reject login with wrong username', async () => {
      const loginData = {
        organizationCode: testOrgCode,
        username: 'nonexistentuser',
        password: testPassword
      };

      const response = await request(app)
        .post('/auth/org/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid username or password');
    });

    it('should reject login with wrong organization code', async () => {
      const loginData = {
        organizationCode: 'wrong-org-code',
        username: testUsername,
        password: testPassword
      };

      const response = await request(app)
        .post('/auth/org/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid organization code');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/auth/org/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Organization Check (/auth/org/check-organization)', () => {
    it('should verify valid organization code', async () => {
      const response = await request(app)
        .post('/auth/org/check-organization')
        .send({ code: testOrgCode })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.organization_id).toBe(organizationId);
      expect(response.body.data.organization_name).toBeDefined();
      expect(response.body.data.code).toBe(testOrgCode);
    });

    it('should reject invalid organization code', async () => {
      const response = await request(app)
        .post('/auth/org/check-organization')
        .send({ code: 'invalid-code' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid organization code');
    });

    it('should reject missing organization code', async () => {
      const response = await request(app)
        .post('/auth/org/check-organization')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Organization code is required');
    });
  });

  describe('Get Organization Branches (/auth/org/organizations/:code/branches)', () => {
    it('should return branches for valid organization', async () => {
      const response = await request(app)
        .get(`/auth/org/organizations/${testOrgCode}/branches`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const branch = response.body.data[0];
      expect(branch.id).toBe(branchId);
      expect(branch.name).toBe('Test Branch');
      expect(branch.code).toBe('TB001');
    });

    it('should return empty array for invalid organization', async () => {
      const response = await request(app)
        .get('/auth/org/organizations/invalid-code/branches')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid organization code');
    });
  });

  describe('Token Authentication (/api/auth/me)', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get a token
      const loginResponse = await request(app)
        .post('/auth/org/login')
        .send({
          organizationCode: testOrgCode,
          username: testUsername,
          password: testPassword
        });

      authToken = loginResponse.body.data.session.access_token;
    });

    it('should return user profile with valid Supabase token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(createdUserId);
      expect(response.body.data.email).toBe(testEmail);
      expect(response.body.data.userOrganizationId).toBe(organizationId);
      expect(response.body.data.userBranchId).toBe(branchId);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing or invalid authorization header');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });
});