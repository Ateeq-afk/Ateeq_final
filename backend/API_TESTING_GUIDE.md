# API Testing Guide

This guide explains how to run and maintain the comprehensive test suite for the DesiCargo backend API.

## Overview

The test suite provides complete coverage of the DesiCargo backend APIs with three layers of testing:

- **Unit Tests**: Test individual functions and utilities
- **Integration Tests**: Test API endpoints with real database interactions
- **End-to-End Tests**: Test complete business workflows across multiple endpoints

## Test Structure

```
tests/
├── unit/                    # Unit tests for utilities and functions
│   └── utils/
│       ├── apiResponse.test.ts    # API response utilities
│       └── lrGenerator.test.ts    # LR number generation
├── integration/             # API endpoint tests
│   ├── auth.test.ts        # Authentication endpoints
│   ├── bookings.test.ts    # Booking API tests
│   └── customers.test.ts   # Customer API tests
├── e2e/                    # End-to-end workflow tests
│   └── booking-workflow.test.ts  # Complete booking lifecycle
├── helpers/                # Test utilities and helpers
│   └── testHelpers.ts      # Database setup, API client, validation
└── fixtures/               # Test data and fixtures
    └── testData.ts         # Sample data for tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode (no watch, with coverage)
npm run test:ci
```

### Specific Test Files
```bash
# Run specific test file
npm test -- tests/integration/auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="booking"

# Run tests with verbose output
npm test -- --verbose
```

## Test Environment Setup

### Prerequisites

1. **Supabase Project**: Tests require a Supabase project with the DesiCargo schema
2. **Environment Variables**: Set in `/backend/.env.test`
   ```
   SUPABASE_URL=your_test_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=test-secret-key
   NODE_ENV=test
   ```

3. **Database Migrations**: Ensure all migrations are applied to test database

### Test Database Management

The test suite automatically:
- Creates test organizations, branches, and users
- Isolates tests with unique data
- Cleans up after each test suite
- Uses Row Level Security (RLS) for multi-tenant isolation

## Test Coverage

### Authentication Tests (`auth.test.ts`)
- User registration with validation
- Login with email/password
- JWT token generation and validation
- Token refresh and expiration
- Role-based access control (superadmin, admin, operator)
- Organization and branch context
- Security validations

### Customer API Tests (`customers.test.ts`)
- CRUD operations (Create, Read, Update, Delete)
- Pagination and search functionality
- Data validation (email, mobile, GST)
- Multi-tenant isolation
- Branch-level access control
- Duplicate prevention
- Soft delete implementation

### Booking API Tests (`bookings.test.ts`)
- Booking creation with articles
- LR number generation and uniqueness
- Status workflow transitions
- Rate calculations and validations
- Multi-branch operations
- Business logic enforcement
- Data integrity validation

### End-to-End Workflow Tests (`booking-workflow.test.ts`)
- Complete booking lifecycle: creation → loading → transit → delivery
- Multi-branch coordination (Mumbai → Delhi)
- Cross-branch customer access
- Status transition validation
- Workflow context enforcement
- Error handling and recovery scenarios
- Data consistency throughout lifecycle

### Unit Tests
- **LR Generator**: Format validation, uniqueness, performance, edge cases
- **API Response**: Success/error response formatting, validation helpers

## Key Features Tested

### Multi-Tenant Security
- Organization-level data isolation
- Branch-scoped operations for operators
- Admin access across branches
- Cross-organization access prevention

### Business Logic Validation
- Booking status workflow enforcement
- Rate calculation accuracy
- Pickup date validation
- Article data integrity
- Payment mode and delivery type handling

### Data Integrity
- Unique LR number generation
- Foreign key relationships
- Concurrent operation handling
- Database transaction consistency

### API Security
- JWT authentication and authorization
- Input sanitization and validation
- Role-based endpoint access
- Token expiration and refresh

## Writing New Tests

### Test Patterns

1. **Setup and Teardown**
   ```typescript
   beforeAll(async () => {
     testDb = new TestDatabase();
     apiClient = new ApiTestClient();
     testOrg = await testDb.createTestOrganization();
   });

   afterAll(async () => {
     await testDb.cleanup();
   });
   ```

2. **API Testing**
   ```typescript
   const response = await apiClient
     .withBranchContext(user.token, branch.id, org.id)
     .post('/api/endpoint')
     .send(data)
     .expect(201);

   const result = validateSuccessResponse(response);
   ```

3. **Error Validation**
   ```typescript
   const response = await apiClient
     .withBranchContext(user.token, branch.id, org.id)
     .post('/api/endpoint')
     .send(invalidData)
     .expect(400);

   validateErrorResponse(response, 400, 'expected error message');
   ```

### Helper Functions

- `TestDatabase`: Manages test data creation and cleanup
- `ApiTestClient`: Provides authenticated API requests with branch context
- `validateSuccessResponse()`: Validates successful API responses
- `validateErrorResponse()`: Validates error responses with status and message
- `generateTestBookingData()`: Creates realistic booking test data
- `generateTestCustomerData()`: Creates realistic customer test data

## Performance Testing

The test suite includes performance validations:
- LR number generation speed (1000 generations < 1 second)
- Concurrent booking creation
- Database query performance
- API response times

## Continuous Integration

Tests are configured for CI environments:
- GitHub Actions integration
- Coverage reporting
- Parallel test execution
- Database seeding and migration
- Environment variable management

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase credentials in `.env.test`
   - Check network connectivity to Supabase
   - Ensure service role key has proper permissions

2. **Test Timeout Errors**
   - Increase Jest timeout in `jest.config.js`
   - Check for hanging database connections
   - Verify cleanup in `afterAll` hooks

3. **Migration Errors**
   - Run migrations manually: `supabase db push`
   - Check migration files for syntax errors
   - Verify RLS policies are correctly configured

4. **Test Data Conflicts**
   - Each test suite creates isolated data
   - Use unique identifiers (timestamps, UUIDs)
   - Verify cleanup functions are running

### Debug Mode

```bash
# Run with debug output
DEBUG=* npm test

# Run single test with verbose logging
npm test -- --testNamePattern="specific test" --verbose
```

## Maintenance

### Regular Tasks
1. Update test data fixtures when schema changes
2. Add tests for new API endpoints
3. Review and update test coverage metrics
4. Validate test performance periodically

### Schema Changes
When database schema changes:
1. Update test fixtures in `testData.ts`
2. Update helper functions in `testHelpers.ts`
3. Add/modify tests for new functionality
4. Run full test suite to ensure compatibility

This comprehensive test suite ensures the DesiCargo backend maintains high quality, reliability, and security standards throughout development and deployment.