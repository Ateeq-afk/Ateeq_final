import {
  TestDatabase,
  ApiTestClient,
  validateSuccessResponse,
  validateErrorResponse,
  generateTestBookingData
} from '../helpers/testHelpers';
import { testBookings } from '../fixtures/testData';

describe('Bookings API', () => {
  let testDb: TestDatabase;
  let apiClient: ApiTestClient;
  let testOrg: any;
  let testBranch: any;
  let testUser: any;
  let adminUser: any;
  let testSender: any;
  let testReceiver: any;

  beforeAll(async () => {
    testDb = new TestDatabase();
    apiClient = new ApiTestClient();

    // Create test organization and branch
    testOrg = await testDb.createTestOrganization();
    testBranch = await testDb.createTestBranch(testOrg.id);

    // Create test users
    testUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'operator');
    adminUser = await testDb.createTestUser(testOrg.id, testBranch.id, 'admin');

    // Create test customers
    testSender = await testDb.createTestCustomer(testOrg.id, testBranch.id);
    testReceiver = await testDb.createTestCustomer(testOrg.id, testBranch.id);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  describe('GET /api/bookings', () => {
    let testBooking: any;

    beforeAll(async () => {
      // Create a test booking
      const bookingData = generateTestBookingData(testSender.id, testReceiver.id);
      
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData);

      testBooking = response.body.data;
    });

    it('should fetch all bookings for operator user', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/bookings')
        .expect(200);

      const data = validateSuccessResponse(response);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Check booking structure
      const booking = data.find((b: any) => b.id === testBooking.id);
      expect(booking).toBeDefined();
      expect(booking).toHaveProperty('id');
      expect(booking).toHaveProperty('lr_number');
      expect(booking).toHaveProperty('sender');
      expect(booking).toHaveProperty('receiver');
      expect(booking).toHaveProperty('booking_articles');
      expect(booking.organization_id).toBe(testOrg.id);
      expect(booking.branch_id).toBe(testBranch.id);
    });

    it('should fetch bookings with proper nested data', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/bookings')
        .expect(200);

      const data = validateSuccessResponse(response);
      const booking = data[0];

      // Check sender information
      expect(booking.sender).toHaveProperty('id');
      expect(booking.sender).toHaveProperty('name');
      expect(booking.sender).toHaveProperty('mobile');

      // Check receiver information
      expect(booking.receiver).toHaveProperty('id');
      expect(booking.receiver).toHaveProperty('name');
      expect(booking.receiver).toHaveProperty('mobile');

      // Check articles
      expect(Array.isArray(booking.booking_articles)).toBe(true);
      if (booking.booking_articles.length > 0) {
        const article = booking.booking_articles[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('name');
        expect(article).toHaveProperty('quantity');
        expect(article).toHaveProperty('weight_kg');
        expect(article).toHaveProperty('freight_amount');
      }
    });

    it('should allow admin to fetch bookings from all branches', async () => {
      const response = await apiClient
        .withBranchContext(adminUser.token, testBranch.id, testOrg.id)
        .get('/api/bookings')
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await apiClient.request
        .get('/api/bookings')
        .expect(401);

      validateErrorResponse(response, 401, 'No token');
    });

    it('should require branch context', async () => {
      const response = await apiClient
        .authenticatedRequest(testUser.token)
        .get('/api/bookings')
        .expect(400);

      validateErrorResponse(response, 400, 'Branch ID');
    });

    it('should filter bookings by branch for operator', async () => {
      // Create another branch and booking
      const otherBranch = await testDb.createTestBranch(testOrg.id);
      const otherUser = await testDb.createTestUser(testOrg.id, otherBranch.id, 'operator');
      const otherSender = await testDb.createTestCustomer(testOrg.id, otherBranch.id);
      const otherReceiver = await testDb.createTestCustomer(testOrg.id, otherBranch.id);

      // Create booking in other branch
      const bookingData = generateTestBookingData(otherSender.id, otherReceiver.id);
      await apiClient
        .withBranchContext(otherUser.token, otherBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData);

      // Operator should only see their branch bookings
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get('/api/bookings')
        .expect(200);

      const data = validateSuccessResponse(response);
      data.forEach((booking: any) => {
        expect(booking.branch_id).toBe(testBranch.id);
      });
    });
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking successfully', async () => {
      const bookingData = {
        ...testBookings.standard_booking,
        sender_id: testSender.id,
        receiver_id: testReceiver.id
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const data = validateSuccessResponse(response);

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('lr_number');
      expect(data.lr_number).toMatch(/^.*-.*-\d{8}-\d{6}-\d{3}$/);
      expect(data.sender_id).toBe(testSender.id);
      expect(data.receiver_id).toBe(testReceiver.id);
      expect(data.organization_id).toBe(testOrg.id);
      expect(data.branch_id).toBe(testBranch.id);
      expect(data.status).toBe('booked');
      expect(data.from_location).toBe(bookingData.from_location);
      expect(data.to_location).toBe(bookingData.to_location);
      expect(data.total_amount).toBe(bookingData.total_amount);
    });

    it('should create booking articles', async () => {
      const bookingData = {
        ...testBookings.bulk_booking,
        sender_id: testSender.id,
        receiver_id: testReceiver.id
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const data = validateSuccessResponse(response);

      expect(data).toHaveProperty('booking_articles');
      expect(Array.isArray(data.booking_articles)).toBe(true);
      expect(data.booking_articles).toHaveLength(bookingData.articles.length);

      // Check each article
      data.booking_articles.forEach((article: any, index: number) => {
        const expectedArticle = bookingData.articles[index];
        expect(article.name).toBe(expectedArticle.name);
        expect(article.quantity).toBe(expectedArticle.quantity);
        expect(article.weight_kg).toBe(expectedArticle.weight_kg);
        expect(article.freight_amount).toBe(expectedArticle.freight_amount);
        expect(article.rate_type).toBe(expectedArticle.rate_type);
        expect(article.rate_value).toBe(expectedArticle.rate_value);
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        from_location: 'Mumbai'
        // Missing required fields
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(invalidData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should validate sender and receiver exist', async () => {
      const bookingData = {
        ...testBookings.standard_booking,
        sender_id: '00000000-0000-0000-0000-000000000000',
        receiver_id: '00000000-0000-0000-0000-000000000000'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should validate articles array', async () => {
      const bookingData = {
        ...testBookings.standard_booking,
        sender_id: testSender.id,
        receiver_id: testReceiver.id,
        articles: [] // Empty articles array
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      validateErrorResponse(response, 400, 'articles');
    });

    it('should validate article data', async () => {
      const bookingData = {
        ...testBookings.standard_booking,
        sender_id: testSender.id,
        receiver_id: testReceiver.id,
        articles: [{
          name: '', // Invalid: empty name
          quantity: -1, // Invalid: negative quantity
          weight_kg: 0, // Invalid: zero weight
        }]
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should calculate total amount correctly', async () => {
      const articleAmount1 = 1000;
      const articleAmount2 = 500;
      const expectedTotal = articleAmount1 + articleAmount2;

      const bookingData = {
        from_location: 'Mumbai',
        to_location: 'Delhi',
        pickup_date: new Date().toISOString(),
        delivery_type: 'standard',
        payment_mode: 'cash',
        sender_id: testSender.id,
        receiver_id: testReceiver.id,
        articles: [
          {
            name: 'Article 1',
            quantity: 1,
            weight_kg: 10,
            dimensions: { length: 30, width: 20, height: 15 },
            freight_amount: articleAmount1,
            rate_type: 'fixed',
            rate_value: articleAmount1
          },
          {
            name: 'Article 2',
            quantity: 1,
            weight_kg: 5,
            dimensions: { length: 20, width: 15, height: 10 },
            freight_amount: articleAmount2,
            rate_type: 'fixed',
            rate_value: articleAmount2
          }
        ]
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const data = validateSuccessResponse(response);
      expect(data.total_amount).toBe(expectedTotal);
    });

    it('should auto-assign branch and organization', async () => {
      const bookingData = {
        ...testBookings.standard_booking,
        sender_id: testSender.id,
        receiver_id: testReceiver.id
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const data = validateSuccessResponse(response);
      expect(data.organization_id).toBe(testOrg.id);
      expect(data.branch_id).toBe(testBranch.id);
    });

    it('should generate unique LR numbers', async () => {
      const bookingData = {
        ...testBookings.standard_booking,
        sender_id: testSender.id,
        receiver_id: testReceiver.id
      };

      const lrNumbers = new Set();

      // Create multiple bookings
      for (let i = 0; i < 5; i++) {
        const response = await apiClient
          .withBranchContext(testUser.token, testBranch.id, testOrg.id)
          .post('/api/bookings')
          .send(bookingData)
          .expect(201);

        const data = validateSuccessResponse(response);
        lrNumbers.add(data.lr_number);
      }

      // All LR numbers should be unique
      expect(lrNumbers.size).toBe(5);
    });
  });

  describe('GET /api/bookings/:id', () => {
    let testBooking: any;

    beforeAll(async () => {
      const bookingData = generateTestBookingData(testSender.id, testReceiver.id);
      
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData);

      testBooking = response.body.data;
    });

    it('should fetch single booking by ID', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/bookings/${testBooking.id}`)
        .expect(200);

      const data = validateSuccessResponse(response);

      expect(data.id).toBe(testBooking.id);
      expect(data.lr_number).toBe(testBooking.lr_number);
      expect(data).toHaveProperty('sender');
      expect(data).toHaveProperty('receiver');
      expect(data).toHaveProperty('booking_articles');
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/bookings/${nonExistentId}`)
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });

    it('should validate UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/bookings/${invalidId}`)
        .expect(400);

      validateErrorResponse(response, 400, 'Invalid');
    });

    it('should enforce branch isolation for operators', async () => {
      // Create booking in another branch
      const otherBranch = await testDb.createTestBranch(testOrg.id);
      const otherUser = await testDb.createTestUser(testOrg.id, otherBranch.id, 'operator');
      const otherSender = await testDb.createTestCustomer(testOrg.id, otherBranch.id);
      const otherReceiver = await testDb.createTestCustomer(testOrg.id, otherBranch.id);

      const bookingData = generateTestBookingData(otherSender.id, otherReceiver.id);
      const otherBookingResponse = await apiClient
        .withBranchContext(otherUser.token, otherBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData);

      const otherBooking = otherBookingResponse.body.data;

      // Original user should not be able to access booking from other branch
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .get(`/api/bookings/${otherBooking.id}`)
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });

    it('should allow admin to access bookings from other branches', async () => {
      // Create booking in another branch
      const otherBranch = await testDb.createTestBranch(testOrg.id);
      const otherUser = await testDb.createTestUser(testOrg.id, otherBranch.id, 'operator');
      const otherSender = await testDb.createTestCustomer(testOrg.id, otherBranch.id);
      const otherReceiver = await testDb.createTestCustomer(testOrg.id, otherBranch.id);

      const bookingData = generateTestBookingData(otherSender.id, otherReceiver.id);
      const otherBookingResponse = await apiClient
        .withBranchContext(otherUser.token, otherBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData);

      const otherBooking = otherBookingResponse.body.data;

      // Admin should be able to access booking from any branch
      const response = await apiClient
        .withBranchContext(adminUser.token, testBranch.id, testOrg.id)
        .get(`/api/bookings/${otherBooking.id}`)
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(data.id).toBe(otherBooking.id);
      expect(data.branch_id).toBe(otherBranch.id);
    });
  });

  describe('PATCH /api/bookings/:id/status', () => {
    let testBooking: any;

    beforeEach(async () => {
      const bookingData = generateTestBookingData(testSender.id, testReceiver.id);
      
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData);

      testBooking = response.body.data;
    });

    it('should update booking status with valid transition', async () => {
      const statusUpdate = {
        status: 'in_transit',
        workflow_context: 'loading'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .patch(`/api/bookings/${testBooking.id}/status`)
        .send(statusUpdate)
        .expect(200);

      const data = validateSuccessResponse(response);
      expect(data.status).toBe('in_transit');
      expect(data.updated_at).toBeDefined();
    });

    it('should validate status transitions', async () => {
      // Try to transition from 'booked' to 'delivered' (invalid)
      const statusUpdate = {
        status: 'delivered',
        workflow_context: 'general'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .patch(`/api/bookings/${testBooking.id}/status`)
        .send(statusUpdate)
        .expect(400);

      validateErrorResponse(response, 400, 'Invalid status transition');
    });

    it('should enforce workflow context for restricted transitions', async () => {
      const statusUpdate = {
        status: 'in_transit',
        workflow_context: 'general' // Should require 'loading' context
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .patch(`/api/bookings/${testBooking.id}/status`)
        .send(statusUpdate)
        .expect(403);

      validateErrorResponse(response, 403, 'proper loading/unloading workflows');
    });

    it('should validate required fields', async () => {
      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .patch(`/api/bookings/${testBooking.id}/status`)
        .send({}) // Missing status
        .expect(400);

      validateErrorResponse(response, 400, 'Validation');
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const statusUpdate = {
        status: 'in_transit',
        workflow_context: 'loading'
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .patch(`/api/bookings/${nonExistentId}/status`)
        .send(statusUpdate)
        .expect(404);

      validateErrorResponse(response, 404, 'Booking not found');
    });
  });

  describe('Booking business logic', () => {
    it('should enforce rate calculation consistency', async () => {
      const bookingData = {
        from_location: 'Mumbai',
        to_location: 'Delhi',
        pickup_date: new Date().toISOString(),
        delivery_type: 'standard',
        payment_mode: 'cash',
        sender_id: testSender.id,
        receiver_id: testReceiver.id,
        articles: [{
          name: 'Test Article',
          quantity: 2,
          weight_kg: 10,
          dimensions: { length: 30, width: 20, height: 15 },
          freight_amount: 1000, // 100 per kg
          rate_type: 'per_kg',
          rate_value: 100
        }]
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const data = validateSuccessResponse(response);
      const article = data.booking_articles[0];
      
      // Freight amount should match rate calculation
      const expectedAmount = article.weight_kg * article.rate_value;
      expect(article.freight_amount).toBe(expectedAmount);
    });

    it('should validate pickup date is not in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const bookingData = {
        ...testBookings.standard_booking,
        pickup_date: pastDate.toISOString(),
        sender_id: testSender.id,
        receiver_id: testReceiver.id
      };

      const response = await apiClient
        .withBranchContext(testUser.token, testBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      validateErrorResponse(response, 400, 'Pickup date cannot be in the past');
    });

    it('should handle different delivery types', async () => {
      const deliveryTypes = ['standard', 'express', 'overnight'];

      for (const deliveryType of deliveryTypes) {
        const bookingData = {
          ...testBookings.standard_booking,
          delivery_type: deliveryType,
          sender_id: testSender.id,
          receiver_id: testReceiver.id
        };

        const response = await apiClient
          .withBranchContext(testUser.token, testBranch.id, testOrg.id)
          .post('/api/bookings')
          .send(bookingData)
          .expect(201);

        const data = validateSuccessResponse(response);
        expect(data.delivery_type).toBe(deliveryType);
      }
    });

    it('should handle different payment modes', async () => {
      const paymentModes = ['cash', 'credit', 'bank_transfer', 'online'];

      for (const paymentMode of paymentModes) {
        const bookingData = {
          ...testBookings.standard_booking,
          payment_mode: paymentMode,
          sender_id: testSender.id,
          receiver_id: testReceiver.id
        };

        const response = await apiClient
          .withBranchContext(testUser.token, testBranch.id, testOrg.id)
          .post('/api/bookings')
          .send(bookingData)
          .expect(201);

        const data = validateSuccessResponse(response);
        expect(data.payment_mode).toBe(paymentMode);
      }
    });
  });
});