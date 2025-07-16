# Observability Setup

This document explains how to set up Sentry for error tracking and performance monitoring in the DesiCargo application.

## Overview

Sentry is integrated into both the frontend and backend of the application to provide:
- Error tracking and reporting
- Performance monitoring
- Session replay (frontend only)
- User context tracking
- Release tracking

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [Sentry.io](https://sentry.io/) and create an account
2. Create two projects:
   - One for the backend (Node.js)
   - One for the frontend (React)

### 2. Get Your DSNs

For each project, find the DSN (Data Source Name):
1. Navigate to Settings → Projects → [Your Project]
2. Click on "Client Keys (DSN)"
3. Copy the DSN value

### 3. Configure Environment Variables

#### Backend Configuration

Create or update the `.env` file in the `backend/` directory:

```bash
# backend/.env
SENTRY_DSN=your-backend-dsn-here
NODE_ENV=development  # or production
```

#### Frontend Configuration

Create or update the `.env` file in the root directory:

```bash
# .env (root directory)
VITE_SENTRY_DSN=your-frontend-dsn-here
VITE_APP_VERSION=1.0.0  # Optional: for release tracking
```

### 4. Environment-Specific Configuration

The Sentry integration is configured to behave differently based on the environment:

#### Development
- **Traces Sample Rate**: 100% (all transactions are captured)
- **Profiles Sample Rate**: 100% (all profiles are captured)
- **Session Replay**: 100% sampling
- **Errors**: Only sent if DSN is configured

#### Production
- **Traces Sample Rate**: 10% (to reduce overhead)
- **Profiles Sample Rate**: 10% (to reduce overhead)
- **Session Replay**: 10% for regular sessions, 100% for error sessions
- **Errors**: All errors are captured

## Features Configured

### Backend (Node.js)

- **Error Tracking**: All unhandled exceptions and rejections
- **Performance Monitoring**: HTTP requests, database queries
- **Profiling**: CPU and memory profiling for sampled transactions
- **User Context**: Automatically captures authenticated user information
- **Request Data**: Sanitized to remove sensitive headers and cookies

### Frontend (React)

- **Error Tracking**: All JavaScript errors and React errors
- **Performance Monitoring**: Page loads, API calls, route changes
- **Session Replay**: Records user sessions for debugging
- **Browser Tracing**: Tracks performance of browser operations
- **User Context**: Can be enhanced with authenticated user data

## Local Development

For local development without Sentry:
1. Simply don't set the DSN environment variables
2. The application will run normally without sending data to Sentry
3. Errors will still be logged to the console

## Verifying the Sentry Integration

To verify that Sentry is properly integrated and capturing errors, follow these steps:

### Prerequisites

1. **Replace the placeholder DSNs** in your `.env` files with your actual Sentry project DSNs:
   - Backend: Update `SENTRY_DSN` in `backend/.env`
   - Frontend: Update `VITE_SENTRY_DSN` in `.env`

2. **Run the frontend and backend servers**:
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   cd backend && npm run dev
   ```

### Testing Frontend Error Capture

1. **Navigate to the main dashboard** by logging into the application
2. **Go to the Operations Command Center** (Operational Dashboard)
3. **Look for the Financial Health card** (green card with financial metrics)
4. **Click the "Test Frontend Error" button** at the bottom of the card
5. This will throw a test error: `Sentry Frontend Test - DesiCargo [timestamp]`

### Testing Backend Error Capture

1. **Open your browser or API testing tool** (like Postman)
2. **Visit the test endpoint**: `http://localhost:4000/health/sentry-test`
3. This will throw a test error: `Sentry Backend Test - DesiCargo [timestamp]`

### Verifying in Sentry Dashboard

1. **Check your Sentry project dashboards**:
   - Frontend errors: `https://[your-org].sentry.io/projects/[frontend-project]/`
   - Backend errors: `https://[your-org].sentry.io/projects/[backend-project]/`

2. **You should see two new error events**:
   - One from the frontend with the test message and timestamp
   - One from the backend with the test message and timestamp

3. **Each error should include**:
   - Full stack trace
   - User context (if logged in)
   - Browser/environment information
   - Performance data

### Troubleshooting

If errors are not appearing in Sentry:

1. **Check environment variables**: Ensure DSNs are correctly set
2. **Check console logs**: Look for Sentry initialization messages
3. **Verify network**: Ensure your application can reach sentry.io
4. **Check Sentry filters**: Make sure your project isn't filtering out test errors

### Removing Test Components

Once verification is complete, you should remove the test components:

1. **Frontend**: Remove the test button from `src/components/OperationalDashboard.tsx`
2. **Backend**: Remove the `/sentry-test` endpoint from `backend/src/routes/health.ts`

These test components are for initial verification only and should not be deployed to production.

## Security Considerations

1. **Sensitive Data**: The integration is configured to remove:
   - Authorization headers
   - Cookies
   - Any other sensitive request data

2. **Source Maps**: In production, upload source maps to Sentry for better error tracking:
   ```bash
   npx @sentry/wizard -i sourcemaps
   ```

3. **Rate Limiting**: Sentry has built-in rate limiting, but our configuration also samples transactions to reduce overhead

## Monitoring Dashboard

Once configured, you can monitor your application at:
- Backend: `https://[your-org].sentry.io/projects/[backend-project]/`
- Frontend: `https://[your-org].sentry.io/projects/[frontend-project]/`

## Additional Resources

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring Best Practices](https://docs.sentry.io/product/performance/performance-best-practices/)