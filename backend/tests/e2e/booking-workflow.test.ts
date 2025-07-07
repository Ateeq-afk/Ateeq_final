import {
  TestDatabase,
  ApiTestClient,
  validateSuccessResponse,
  validateErrorResponse,
  generateTestBookingData,
  generateTestCustomerData
} from '../helpers/testHelpers';
import { testUsers, testOrganizations, testBranches } from '../fixtures/testData';

describe('Complete Booking Workflow E2E', () => {
  let testDb: TestDatabase;
  let apiClient: ApiTestClient;
  let testOrg: any;
  let mumbaiBranch: any;
  let delhiBranch: any;
  let mumbaiUser: any;
  let delhiUser: any;
  let adminUser: any;

  beforeAll(async () => {
    testDb = new TestDatabase();
    apiClient = new ApiTestClient();

    // Create test organization
    testOrg = await testDb.createTestOrganization();

    // Create branches for Mumbai and Delhi
    mumbaieBranch = await testDb.createTestBranch(testOrg.id);
    delhiBranch = await testDb.createTestBranch(testOrg.id);

    // Create users for each branch
    mumbaiUser = await testDb.createTestUser(testOrg.id, mumbaieBranch.id, 'operator');
    delhiUser = await testDb.createTestUser(testOrg.id, delhiBranch.id, 'operator');
    adminUser = await testDb.createTestUser(testOrg.id, mumbaieBranch.id, 'admin');
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  describe('Complete Booking Lifecycle', () => {
    it('should handle complete booking workflow from creation to delivery', async () => {
      // Step 1: Create sender and receiver customers
      const senderData = {
        ...generateTestCustomerData(),
        name: 'Mumbai Sender Company'
      };

      const senderResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/customers')
        .send(senderData)
        .expect(201);

      const sender = validateSuccessResponse(senderResponse);

      const receiverData = {
        ...generateTestCustomerData(),
        name: 'Delhi Receiver Company'
      };

      const receiverResponse = await apiClient
        .withBranchContext(delhiUser.token, delhiBranch.id, testOrg.id)
        .post('/api/customers')
        .send(receiverData)
        .expect(201);

      const receiver = validateSuccessResponse(receiverResponse);

      // Step 2: Create booking in Mumbai branch
      const bookingData = {
        sender_id: sender.id,
        receiver_id: receiver.id,
        from_location: 'Mumbai',
        to_location: 'Delhi',
        pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        delivery_type: 'standard',
        payment_mode: 'cash',
        booking_notes: 'E2E test booking - handle with care',
        articles: [
          {
            name: 'Electronic Equipment',
            quantity: 2,
            weight_kg: 15,
            dimensions: { length: 50, width: 30, height: 20 },
            freight_amount: 2250,
            rate_type: 'per_kg',
            rate_value: 150
          },
          {
            name: 'Documentation Package',
            quantity: 1,
            weight_kg: 2,
            dimensions: { length: 30, width: 20, height: 5 },
            freight_amount: 500,
            rate_type: 'fixed',
            rate_value: 500
          }
        ]
      };

      const bookingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const booking = validateSuccessResponse(bookingResponse);

      // Verify booking creation
      expect(booking).toHaveProperty('id');
      expect(booking).toHaveProperty('lr_number');
      expect(booking.status).toBe('booked');
      expect(booking.total_amount).toBe(2750); // Sum of article amounts
      expect(booking.booking_articles).toHaveLength(2);

      // Step 3: Mumbai user updates booking status to in_transit (simulate loading)
      const loadingUpdate = {
        status: 'in_transit',
        workflow_context: 'loading'
      };

      const loadingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(loadingUpdate)
        .expect(200);

      const loadedBooking = validateSuccessResponse(loadingResponse);
      expect(loadedBooking.status).toBe('in_transit');

      // Step 4: Delhi user updates booking status to unloaded
      const unloadingUpdate = {
        status: 'unloaded',
        workflow_context: 'unloading'
      };

      const unloadingResponse = await apiClient
        .withBranchContext(delhiUser.token, delhiBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(unloadingUpdate)
        .expect(200);

      const unloadedBooking = validateSuccessResponse(unloadingResponse);
      expect(unloadedBooking.status).toBe('unloaded');

      // Step 5: Delhi user marks as out for delivery
      const deliveryUpdate = {
        status: 'out_for_delivery',
        workflow_context: 'delivery'
      };

      const deliveryResponse = await apiClient
        .withBranchContext(delhiUser.token, delhiBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(deliveryUpdate)
        .expect(200);

      const outForDeliveryBooking = validateSuccessResponse(deliveryResponse);
      expect(outForDeliveryBooking.status).toBe('out_for_delivery');

      // Step 6: Delhi user marks as delivered
      const deliveredUpdate = {
        status: 'delivered',
        workflow_context: 'delivery'
      };

      const deliveredResponse = await apiClient
        .withBranchContext(delhiUser.token, delhiBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(deliveredUpdate)
        .expect(200);

      const deliveredBooking = validateSuccessResponse(deliveredResponse);
      expect(deliveredBooking.status).toBe('delivered');

      // Step 7: Verify final booking state
      const finalBookingResponse = await apiClient
        .withBranchContext(adminUser.token, mumbaieBranch.id, testOrg.id)
        .get(`/api/bookings/${booking.id}`)
        .expect(200);

      const finalBooking = validateSuccessResponse(finalBookingResponse);
      expect(finalBooking.status).toBe('delivered');
      expect(finalBooking.lr_number).toBe(booking.lr_number);
      expect(finalBooking.booking_articles).toHaveLength(2);

      // Verify sender and receiver information is preserved
      expect(finalBooking.sender.id).toBe(sender.id);
      expect(finalBooking.receiver.id).toBe(receiver.id);
    });

    it('should prevent invalid status transitions', async () => {
      // Create a new booking
      const sender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const receiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      const bookingData = generateTestBookingData(sender.id, receiver.id);

      const bookingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const booking = validateSuccessResponse(bookingResponse);

      // Try to jump from 'booked' to 'delivered' (invalid transition)
      const invalidUpdate = {
        status: 'delivered',
        workflow_context: 'delivery'
      };

      const response = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(invalidUpdate)
        .expect(400);

      validateErrorResponse(response, 400, 'Invalid status transition');
    });

    it('should enforce workflow context restrictions', async () => {
      // Create a new booking
      const sender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const receiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      const bookingData = generateTestBookingData(sender.id, receiver.id);

      const bookingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const booking = validateSuccessResponse(bookingResponse);

      // Try to update to 'in_transit' without proper workflow context
      const invalidUpdate = {
        status: 'in_transit',
        workflow_context: 'general' // Should require 'loading'
      };

      const response = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(invalidUpdate)
        .expect(403);

      validateErrorResponse(response, 403, 'proper loading/unloading workflows');
    });
  });

  describe('Multi-Branch Operations', () => {
    it('should allow admin to view bookings across all branches', async () => {
      // Create bookings in both branches
      const mumbaiSender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const mumbaiReceiver = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const delhiSender = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      const delhiReceiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);

      // Create booking in Mumbai
      const mumbaiBookingData = generateTestBookingData(mumbaiSender.id, mumbaiReceiver.id);
      const mumbaiBookingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(mumbaiBookingData)
        .expect(201);

      const mumbaiBooking = validateSuccessResponse(mumbaiBookingResponse);

      // Create booking in Delhi
      const delhiBookingData = generateTestBookingData(delhiSender.id, delhiReceiver.id);
      const delhiBookingResponse = await apiClient
        .withBranchContext(delhiUser.token, delhiBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(delhiBookingData)
        .expect(201);

      const delhiBooking = validateSuccessResponse(delhiBookingResponse);

      // Admin should see bookings from all branches
      const adminBookingsResponse = await apiClient
        .withBranchContext(adminUser.token, mumbaieBranch.id, testOrg.id)
        .get('/api/bookings')
        .expect(200);

      const adminBookings = validateSuccessResponse(adminBookingsResponse);
      
      // Should include bookings from both branches
      const mumbaiBookingFound = adminBookings.find((b: any) => b.id === mumbaiBooking.id);
      const delhiBookingFound = adminBookings.find((b: any) => b.id === delhiBooking.id);
      
      expect(mumbaiBookingFound).toBeDefined();
      expect(delhiBookingFound).toBeDefined();
    });

    it('should restrict operator access to their branch only', async () => {
      // Create booking in Delhi branch
      const delhiSender = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      const delhiReceiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      const delhiBookingData = generateTestBookingData(delhiSender.id, delhiReceiver.id);

      const delhiBookingResponse = await apiClient
        .withBranchContext(delhiUser.token, delhiBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(delhiBookingData)
        .expect(201);

      const delhiBooking = validateSuccessResponse(delhiBookingResponse);

      // Mumbai user should not be able to access Delhi booking
      const response = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .get(`/api/bookings/${delhiBooking.id}`)
        .expect(404);

      validateErrorResponse(response, 404, 'not found');

      // Mumbai user should not see Delhi booking in list
      const mumbaiBookingsResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .get('/api/bookings')
        .expect(200);

      const mumbaiBookings = validateSuccessResponse(mumbaiBookingsResponse);
      const delhiBookingFound = mumbaiBookings.find((b: any) => b.id === delhiBooking.id);
      expect(delhiBookingFound).toBeUndefined();
    });
  });

  describe('Cross-Branch Customer Access', () => {
    it('should allow creating bookings with customers from different branches', async () => {
      // Sender in Mumbai, Receiver in Delhi
      const mumbaiSender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const delhiReceiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);

      const crossBranchBookingData = generateTestBookingData(mumbaiSender.id, delhiReceiver.id);

      // Mumbai user creates booking with Delhi receiver
      const response = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(crossBranchBookingData)
        .expect(201);

      const booking = validateSuccessResponse(response);
      expect(booking.sender_id).toBe(mumbaiSender.id);
      expect(booking.receiver_id).toBe(delhiReceiver.id);
      expect(booking.branch_id).toBe(mumbaieBranch.id); // Booking belongs to creating branch
    });

    it('should validate that customers belong to the same organization', async () => {
      // Create customer in different organization
      const otherOrg = await testDb.createTestOrganization();
      const otherBranch = await testDb.createTestBranch(otherOrg.id);
      const otherCustomer = await testDb.createTestCustomer(otherOrg.id, otherBranch.id);

      const mumbaiSender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);

      const invalidBookingData = generateTestBookingData(mumbaiSender.id, otherCustomer.id);

      // Should fail because receiver is from different organization
      const response = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(invalidBookingData)
        .expect(400);

      validateErrorResponse(response, 400);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle booking cancellation workflow', async () => {
      // Create booking
      const sender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const receiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      const bookingData = generateTestBookingData(sender.id, receiver.id);

      const bookingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const booking = validateSuccessResponse(bookingResponse);

      // Cancel booking from booked status
      const cancelUpdate = {
        status: 'cancelled',
        workflow_context: 'cancellation'
      };

      const cancelResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(cancelUpdate)
        .expect(200);

      const cancelledBooking = validateSuccessResponse(cancelResponse);
      expect(cancelledBooking.status).toBe('cancelled');

      // Should not allow further status updates after cancellation
      const invalidUpdate = {
        status: 'in_transit',
        workflow_context: 'loading'
      };

      const response = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send(invalidUpdate)
        .expect(400);

      validateErrorResponse(response, 400, 'Invalid status transition');
    });

    it('should handle network interruption scenarios gracefully', async () => {
      // Simulate concurrent booking creation attempts
      const sender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const receiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);

      const bookingData1 = generateTestBookingData(sender.id, receiver.id);
      const bookingData2 = generateTestBookingData(sender.id, receiver.id);

      // Create bookings concurrently
      const [response1, response2] = await Promise.all([
        apiClient
          .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
          .post('/api/bookings')
          .send(bookingData1),
        apiClient
          .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
          .post('/api/bookings')
          .send(bookingData2)
      ]);

      // Both should succeed with unique LR numbers
      const booking1 = validateSuccessResponse(response1);
      const booking2 = validateSuccessResponse(response2);

      expect(booking1.lr_number).not.toBe(booking2.lr_number);
      expect(booking1.id).not.toBe(booking2.id);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across status updates', async () => {
      const sender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const receiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      const bookingData = generateTestBookingData(sender.id, receiver.id);

      const bookingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const booking = validateSuccessResponse(bookingResponse);
      const originalLrNumber = booking.lr_number;
      const originalTotalAmount = booking.total_amount;

      // Update status multiple times
      const statusUpdates = [
        { status: 'in_transit', workflow_context: 'loading' },
        { status: 'unloaded', workflow_context: 'unloading' },
        { status: 'out_for_delivery', workflow_context: 'delivery' },
        { status: 'delivered', workflow_context: 'delivery' }
      ];

      for (const update of statusUpdates) {
        await apiClient
          .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
          .patch(`/api/bookings/${booking.id}/status`)
          .send(update)
          .expect(200);
      }

      // Verify data integrity after all updates
      const finalBookingResponse = await apiClient
        .withBranchContext(adminUser.token, mumbaieBranch.id, testOrg.id)
        .get(`/api/bookings/${booking.id}`)
        .expect(200);

      const finalBooking = validateSuccessResponse(finalBookingResponse);
      
      // Core data should remain unchanged
      expect(finalBooking.lr_number).toBe(originalLrNumber);
      expect(finalBooking.total_amount).toBe(originalTotalAmount);
      expect(finalBooking.sender_id).toBe(sender.id);
      expect(finalBooking.receiver_id).toBe(receiver.id);
      expect(finalBooking.status).toBe('delivered');
      expect(finalBooking.booking_articles).toHaveLength(bookingData.articles.length);
    });

    it('should preserve article details throughout workflow', async () => {
      const sender = await testDb.createTestCustomer(testOrg.id, mumbaieBranch.id);
      const receiver = await testDb.createTestCustomer(testOrg.id, delhiBranch.id);
      
      const detailedBookingData = {
        sender_id: sender.id,
        receiver_id: receiver.id,
        from_location: 'Mumbai',
        to_location: 'Delhi',
        pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        delivery_type: 'express',
        payment_mode: 'credit',
        booking_notes: 'Fragile items - handle with extreme care',
        articles: [
          {
            name: 'Precision Instruments',
            quantity: 3,
            weight_kg: 25.5,
            dimensions: { length: 45, width: 35, height: 25 },
            freight_amount: 3825,
            rate_type: 'per_kg',
            rate_value: 150,
            description: 'High-value precision instruments for laboratory use'
          }
        ]
      };

      const bookingResponse = await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .post('/api/bookings')
        .send(detailedBookingData)
        .expect(201);

      const booking = validateSuccessResponse(bookingResponse);
      const originalArticle = booking.booking_articles[0];

      // Go through complete workflow
      await apiClient
        .withBranchContext(mumbaiUser.token, mumbaieBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send({ status: 'in_transit', workflow_context: 'loading' })
        .expect(200);

      await apiClient
        .withBranchContext(delhiUser.token, delhiBranch.id, testOrg.id)
        .patch(`/api/bookings/${booking.id}/status`)
        .send({ status: 'delivered', workflow_context: 'delivery' })
        .expect(200);

      // Verify article details are preserved
      const finalBookingResponse = await apiClient
        .withBranchContext(adminUser.token, mumbaieBranch.id, testOrg.id)
        .get(`/api/bookings/${booking.id}`)
        .expect(200);

      const finalBooking = validateSuccessResponse(finalBookingResponse);
      const finalArticle = finalBooking.booking_articles[0];

      expect(finalArticle.name).toBe(originalArticle.name);
      expect(finalArticle.quantity).toBe(originalArticle.quantity);
      expect(finalArticle.weight_kg).toBe(originalArticle.weight_kg);
      expect(finalArticle.freight_amount).toBe(originalArticle.freight_amount);
      expect(finalArticle.rate_type).toBe(originalArticle.rate_type);
      expect(finalArticle.rate_value).toBe(originalArticle.rate_value);
    });
  });
});