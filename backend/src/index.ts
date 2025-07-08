// Initialize Sentry FIRST before any other imports
// Temporarily disabled for debugging
// import SentryManager from './config/sentry';
// SentryManager.initialize();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import { responseMiddleware, sendServerError, sendNotFound } from './utils/apiResponse';
import { sanitizeInput, validateRateLimit, securityHeaders } from './middleware/validation';
import { log, morganStream, timer } from './utils/logger';
import { errorHandler, notFoundHandler, asyncHandler, AppError } from './middleware/errorHandler';
import { initializeDatabase, databaseMiddleware, databaseErrorMiddleware, closeDatabaseConnections } from './middleware/database';
import { requestLoggingMiddleware, businessEventLogger } from './middleware/logging';
import { 
  performanceMonitoring, 
  compressionMiddleware, 
  smartRateLimit, 
  requestSizeLimit, 
  queryOptimization, 
  connectionHealth, 
  memoryMonitoring, 
  responseOptimization 
} from './middleware/performance';
import { databasePoolMiddleware, createHealthCheckEndpoint } from './config/database-pool';
import { cacheMiddleware, branchCache, dashboardCache, searchCache } from './middleware/cache';
// import { sentryRequestHandler, sentryTracingHandler, sentryErrorHandler, captureUserContext, performanceBreadcrumbs } from './middleware/sentry';
// import RedisConfig from './config/redis';

// Import route handlers
import healthRoutes from './routes/health';
import loadingRoutes from './routes/loading_improved';
import authRoutes from './routes/auth';
import authOrgRoutes from './routes/auth-org';
import bookingRoutes from './routes/bookings';
import dashboardRoutes from './routes/dashboard';
import articleTrackingEnhancedRoutes from './routes/article-tracking-enhanced';
import errorLogRoutes from './routes/error-logs';
// Temporarily commenting other routes to debug startup issues
// import organizationRoutes from './routes/organizations';
import branchRoutes from './routes/branches';
// import customerRoutes from './routes/customers';
// import vehicleRoutes from './routes/vehicles';
// import driverRoutes from './routes/drivers';
// import fleetRoutes from './routes/fleet';
// import articleRoutes from './routes/articles';
// import podRoutes from './routes/pod';
// import warehouseRoutes from './routes/warehouses';
// import articleTrackingRoutes from './routes/article-tracking';
// import rateRoutes from './routes/rates';
// import quoteRoutes from './routes/quotes';
// import creditManagementRoutes from './routes/creditManagement';
// import billingTestRoutes from './routes/billing-test';
import paymentRoutes from './routes/payments';
import smsMonitoringRoutes from './routes/sms-monitoring';
import paymentGatewayRoutes from './routes/payment-gateway';
import invoiceRoutes from './routes/invoices';
// import oauthAdminRoutes from './routes/oauth-admin';
// import monitoringRoutes from './routes/monitoring';
// import expenseRoutes from './routes/expenses';
// import financialReportsRoutes from './routes/financial-reports';
// import chatRoutes from './routes/chat';

const app = express();

// Sentry middleware (must be FIRST) - temporarily disabled
// app.use(sentryRequestHandler());
// app.use(sentryTracingHandler());

// Security middleware
app.use(securityHeaders);

// Performance middleware - must be early in the pipeline
app.use(performanceMonitoring());
app.use(compressionMiddleware());
app.use(connectionHealth());
app.use(memoryMonitoring());
app.use(requestSizeLimit());

// Smart rate limiting (replaces the simple rate limit)
app.use(smartRateLimit());

// CORS configuration based on environment
const getCorsOrigins = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    // Production domains - should be set via environment variables
    const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (productionOrigins.length === 0) {
      log.security('No ALLOWED_ORIGINS set for production environment', { 
        environment: nodeEnv 
      });
    }
    return productionOrigins;
  }
  
  if (nodeEnv === 'staging') {
    // Staging domains
    const stagingOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://staging.yourdomain.com'
    ];
    return stagingOrigins;
  }
  
  // Development origins
  return [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ];
};

// Configure CORS with environment-aware origins
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin || '')) {
      callback(null, true);
    } else {
      log.security(`CORS blocked origin: ${origin}`, { 
        blockedOrigin: origin,
        allowedOrigins: allowedOrigins 
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'X-CSRF-Token',
    'X-Selected-Branch',
    'x-selected-branch',
    'X-Organization-ID',
    'X-Branch-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // Cache preflight requests for 24 hours
  optionsSuccessStatus: 200
}));
// HTTP request logging
app.use(morgan(
  process.env.NODE_ENV === 'production' 
    ? 'combined'  // Standard Apache combined log format
    : 'dev',      // Colorized dev format
  { stream: morganStream }
));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(sanitizeInput);
app.use(queryOptimization());
app.use(responseOptimization());
app.use(requestLoggingMiddleware());
app.use(responseMiddleware);

// Database middleware
app.use(databaseMiddleware);
app.use(databasePoolMiddleware());

// Performance monitoring - temporarily disabled
// app.use(performanceBreadcrumbs);
// app.use(captureUserContext);

// Health checks (mounted early, before auth)
app.use('/health', healthRoutes);
app.get('/health/db', createHealthCheckEndpoint());

// Error logging routes (needs auth but should be early)
app.use('/api/error-logs', errorLogRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'DesiCargo API Server', 
    status: 'running', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test environment variables
app.get('/test', (req, res) => {
  res.json({ 
    supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    port: process.env.PORT || 'DEFAULT',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// API Routes - with caching middleware applied selectively
app.use('/api/auth', authRoutes);
app.use('/auth/org', authOrgRoutes);
app.use('/api/bookings', branchCache(300), bookingRoutes); // 5-minute cache for bookings
app.use('/api/dashboard', dashboardCache(300), dashboardRoutes); // 5-minute cache for dashboard
app.use('/api/loading', branchCache(600), loadingRoutes); // 10-minute cache for loading
app.use('/loading', branchCache(600), loadingRoutes); // Backwards compatibility
app.use('/api/article-tracking', searchCache(300), articleTrackingEnhancedRoutes); // 5-minute search cache
// Temporarily commenting other routes
// app.use('/api/organizations', organizationRoutes);
app.use('/api/branches', branchRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/drivers', driverRoutes);
// app.use('/api/fleet', fleetRoutes);
// app.use('/api/articles', articleRoutes);
// app.use('/api/pod', podRoutes);
import warehouseRoutes from './routes/warehouses';
app.use('/api/warehouses', branchCache(300), warehouseRoutes); // 5-minute cache for warehouses
// app.use('/api/article-tracking', articleTrackingRoutes);
// app.use('/api/rates', rateRoutes);
// app.use('/api/quotes', quoteRoutes);
// app.use('/api', creditManagementRoutes);
// app.use('/api/billing', billingTestRoutes);
app.use('/api/payments', branchCache(180), paymentRoutes); // 3-minute cache for payments
app.use('/api/sms', smsMonitoringRoutes); // SMS monitoring and testing
app.use('/api/payment-gateway', paymentGatewayRoutes); // Online payment gateway
app.use('/api/invoices', branchCache(180), invoiceRoutes); // Invoice generation and management
// app.use('/api/oauth-admin', oauthAdminRoutes);
// app.use('/api/monitoring', monitoringRoutes);
// app.use('/api/expenses', expenseRoutes);
// app.use('/api/financial-reports', financialReportsRoutes);
// app.use('/api/chat', chatRoutes);

// Sentry error handler (must be before other error handlers) - temporarily disabled
// app.use(sentryErrorHandler());

// Database error handling middleware
app.use(databaseErrorMiddleware);

// 404 handler - must be before the error handler
app.use(notFoundHandler);

// Comprehensive error handling middleware (must be last)
app.use(errorHandler);

const port = process.env.PORT || 4000;

// Initialize services
async function initializeServices() {
  try {
    // Initialize database connection pool
    await initializeDatabase();
    log.info('Database connection pool initialized successfully');
    
    // Initialize Redis connection (disabled for now)
    // RedisConfig.getInstance();
    
    return true;
  } catch (error) {
    log.error('Failed to initialize services', error);
    return false;
  }
}

// Graceful shutdown handler
function setupGracefulShutdown() {
  const gracefulShutdown = async (signal: string) => {
    log.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Close database connections
      await closeDatabaseConnections();
      log.info('Database connections closed');
      
      // Close Redis connections
      // await RedisConfig.getInstance()?.disconnect();
      
      log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      log.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
}

// Start server
async function startServer() {
  const servicesReady = await initializeServices();
  
  if (!servicesReady) {
    log.error('Failed to initialize required services. Exiting...');
    process.exit(1);
  }

  app.listen(port, () => {
    log.info('DesiCargo Backend API server started', {
      port: port,
      environment: process.env.NODE_ENV || 'development',
      supabase: process.env.SUPABASE_URL ? 'Connected' : 'Not configured',
      redis: process.env.REDIS_HOST ? 'Configured' : 'Not configured',
      sentry: 'Disabled (debug mode)',
      url: `http://localhost:${port}`,
      timestamp: new Date().toISOString()
    });
    
    // Log startup summary
    log.info('Server initialization complete', {
      cors: getCorsOrigins().length > 0 ? 'configured' : 'development-only',
      rateLimit: '100 requests per 15 minutes',
      sanitization: 'enabled',
      securityHeaders: 'enabled',
      caching: 'enabled',
      errorTracking: 'disabled (debug mode)',
      databasePool: 'enabled'
    });
    
    // Setup graceful shutdown
    setupGracefulShutdown();
  });
}

// Start the server
startServer().catch((error) => {
  log.error('Failed to start server', error);
  process.exit(1);
});
