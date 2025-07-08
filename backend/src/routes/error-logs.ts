import express from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Error log schema
const errorLogSchema = z.object({
  errors: z.array(z.object({
    timestamp: z.string(),
    error: z.string(),
    stack: z.string().optional(),
    componentStack: z.string().optional(),
    url: z.string(),
    userAgent: z.string(),
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    branchId: z.string().optional(),
    additionalInfo: z.any().optional()
  }))
});

// POST /api/error-logs - Log frontend errors
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const validation = errorLogSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new AppError('Invalid error log data', 400, 'VALIDATION_ERROR', validation.error);
  }

  const { errors } = validation.data;
  const user = (req as any).user;

  // Transform and enrich error logs with user context
  const errorLogs = errors.map(error => ({
    method: 'FRONTEND',
    url: error.url,
    user_id: error.userId || user?.id,
    organization_id: error.organizationId || user?.organization_id,
    branch_id: error.branchId || user?.branch_id,
    error_message: error.error,
    error_code: 'FRONTEND_ERROR',
    status_code: 0, // Frontend errors don't have HTTP status codes
    error_details: {
      stack: error.stack,
      componentStack: error.componentStack,
      additionalInfo: error.additionalInfo,
      timestamp: error.timestamp
    },
    request_body: null,
    request_query: null,
    request_params: null,
    ip_address: req.ip,
    user_agent: error.userAgent
  }));

  // Insert error logs into database
  const { error: insertError } = await supabase
    .from('error_logs')
    .insert(errorLogs);

  if (insertError) {
    log.error('Failed to insert frontend error logs', { error: insertError, errorCount: errorLogs.length });
    throw new AppError('Failed to log errors', 500, 'DATABASE_ERROR');
  }

  log.info('Frontend errors logged successfully', { 
    count: errorLogs.length,
    userId: user?.id 
  });

  res.json({ 
    success: true, 
    message: `${errorLogs.length} error(s) logged successfully` 
  });
}));

// GET /api/error-logs - Get error logs (for admins)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  
  // Check if user is admin or superadmin
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw new AppError('Unauthorized to view error logs', 403, 'PERMISSION_ERROR');
  }

  const { 
    limit = 50, 
    offset = 0,
    method,
    status_code,
    user_id,
    start_date,
    end_date
  } = req.query;

  let query = supabase
    .from('error_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  // Apply filters
  if (method) {
    query = query.eq('method', method);
  }
  
  if (status_code) {
    query = query.eq('status_code', Number(status_code));
  }
  
  if (user_id) {
    query = query.eq('user_id', user_id);
  }
  
  if (start_date) {
    query = query.gte('created_at', start_date);
  }
  
  if (end_date) {
    query = query.lte('created_at', end_date);
  }

  // For non-superadmins, limit to their organization
  if (user.role === 'admin') {
    query = query.eq('organization_id', user.organization_id);
  }

  const { data, error, count } = await query;

  if (error) {
    log.error('Failed to fetch error logs', { error });
    throw new AppError('Failed to fetch error logs', 500, 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: data || [],
    total: count || 0,
    limit: Number(limit),
    offset: Number(offset)
  });
}));

// GET /api/error-logs/stats - Get error statistics
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  
  // Check if user is admin or superadmin
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw new AppError('Unauthorized to view error statistics', 403, 'PERMISSION_ERROR');
  }

  const { period = '7d' } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  // Base query
  let query = supabase
    .from('error_logs')
    .select('id, created_at, method, status_code, error_code')
    .gte('created_at', startDate.toISOString());

  // For non-superadmins, limit to their organization
  if (user.role === 'admin') {
    query = query.eq('organization_id', user.organization_id);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Failed to fetch error statistics', { error });
    throw new AppError('Failed to fetch error statistics', 500, 'DATABASE_ERROR');
  }

  // Calculate statistics
  const stats = {
    total: data?.length || 0,
    byMethod: {} as Record<string, number>,
    byStatusCode: {} as Record<string, number>,
    byErrorCode: {} as Record<string, number>,
    byHour: {} as Record<string, number>,
    trend: [] as Array<{ date: string; count: number }>
  };

  if (data) {
    data.forEach(error => {
      // By method
      stats.byMethod[error.method] = (stats.byMethod[error.method] || 0) + 1;
      
      // By status code
      if (error.status_code) {
        stats.byStatusCode[error.status_code] = (stats.byStatusCode[error.status_code] || 0) + 1;
      }
      
      // By error code
      if (error.error_code) {
        stats.byErrorCode[error.error_code] = (stats.byErrorCode[error.error_code] || 0) + 1;
      }
      
      // By hour
      const hour = new Date(error.created_at).toISOString().slice(0, 13);
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    // Calculate daily trend
    const dailyCounts: Record<string, number> = {};
    data.forEach(error => {
      const date = new Date(error.created_at).toISOString().slice(0, 10);
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    stats.trend = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  res.json({
    success: true,
    data: stats,
    period,
    startDate: startDate.toISOString(),
    endDate: now.toISOString()
  });
}));

export default router;