import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { responseMiddleware, sendServerError, sendNotFound } from './utils/apiResponse';
import { sanitizeInput, validateRateLimit, securityHeaders } from './middleware/validation';

// Import route handlers
import authRoutes from './routes/auth';
import authOrgRoutes from './routes/auth-org';
import organizationRoutes from './routes/organizations';
import branchRoutes from './routes/branches';
import customerRoutes from './routes/customers';
import vehicleRoutes from './routes/vehicles';
import articleRoutes from './routes/articles';
import bookingRoutes from './routes/bookings';
import podRoutes from './routes/pod';
import warehouseRoutes from './routes/warehouses';
import articleTrackingRoutes from './routes/article-tracking';
// import chatRoutes from './routes/chat';

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(validateRateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(sanitizeInput);
app.use(responseMiddleware);

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'DesiCargo API Server', status: 'running', version: '1.0.0' });
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/auth/org', authOrgRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pod', podRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/article-tracking', articleTrackingRoutes);
// app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  sendServerError(res, err);
});

// 404 handler
app.use('*', (req, res) => {
  sendNotFound(res, 'Route');
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 DesiCargo Backend API listening on http://localhost:${port}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
});
