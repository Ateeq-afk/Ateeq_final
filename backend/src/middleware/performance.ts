import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

/**
 * Advanced performance middleware with request timing and profiling
 */
export function performanceMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Add request ID for tracking
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set response headers for performance monitoring
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Response-Time', '0');

    // Override end method to capture timing
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endMemory = process.memoryUsage();
      
      // Set performance headers
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('X-Memory-Delta', `${(endMemory.heapUsed - startMemory.heapUsed) / 1024}KB`);

      // Log performance metrics
      log.info('Request performance', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        memoryDelta: `${(endMemory.heapUsed - startMemory.heapUsed) / 1024}KB`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Log slow requests
      if (duration > 1000) {
        log.warn('Slow request detected', {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined
        });
      }

      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Response compression middleware
 */
export function compressionMiddleware() {
  return compression({
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Fallback to standard filter function
      return compression.filter(req, res);
    }
  });
}

/**
 * Smart rate limiting based on request type and user role
 */
export function smartRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Different limits based on endpoint type
      if (req.path.startsWith('/api/dashboard')) {
        return 200; // Higher limit for dashboard
      }
      
      if (req.path.startsWith('/api/bookings') && req.method === 'POST') {
        return 50; // Moderate limit for booking creation
      }
      
      if (req.path.startsWith('/api/auth')) {
        return 20; // Strict limit for auth endpoints
      }
      
      return 100; // Default limit
    },
    message: {
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      log.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
      });
    }
  });
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimit() {
  return (req: Request, res: Response, next: NextFunction) => {
    const maxSize = getMaxSizeForEndpoint(req.path);
    
    if (req.headers['content-length']) {
      const size = parseInt(req.headers['content-length']);
      
      if (size > maxSize) {
        log.warn('Request size limit exceeded', {
          path: req.path,
          size: `${size}B`,
          maxSize: `${maxSize}B`,
          ip: req.ip
        });
        
        return res.status(413).json({
          success: false,
          error: 'Request entity too large',
          maxSize: `${maxSize / 1024 / 1024}MB`
        });
      }
    }
    
    next();
  };
}

function getMaxSizeForEndpoint(path: string): number {
  // File upload endpoints
  if (path.includes('/upload') || path.includes('/import')) {
    return 50 * 1024 * 1024; // 50MB
  }
  
  // Image upload endpoints
  if (path.includes('/image') || path.includes('/photo')) {
    return 10 * 1024 * 1024; // 10MB
  }
  
  // Regular API endpoints
  return 1 * 1024 * 1024; // 1MB
}

/**
 * Database query optimization middleware
 */
export function queryOptimization() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add query hints for pagination
    if (req.query.page || req.query.limit) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      
      req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit
      };
    }
    
    // Add filtering hints
    if (req.query.filters) {
      try {
        req.filters = JSON.parse(req.query.filters as string);
      } catch (error) {
        log.warn('Invalid filters in query', { filters: req.query.filters });
      }
    }
    
    // Add sorting hints
    if (req.query.sort) {
      const sortParts = (req.query.sort as string).split(',');
      req.sorting = sortParts.map(part => {
        const [field, direction] = part.trim().split(':');
        return {
          field,
          direction: direction === 'desc' ? 'DESC' : 'ASC'
        };
      });
    }
    
    next();
  };
}

/**
 * Connection health monitoring
 */
export function connectionHealth() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add connection info to request
    req.connectionInfo = {
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort,
      localAddress: req.connection.localAddress,
      localPort: req.connection.localPort
    };
    
    next();
  };
}

/**
 * Memory monitoring and cleanup
 */
export function memoryMonitoring() {
  let lastMemoryCheck = Date.now();
  const MEMORY_CHECK_INTERVAL = 30000; // 30 seconds
  
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    
    if (now - lastMemoryCheck > MEMORY_CHECK_INTERVAL) {
      const memory = process.memoryUsage();
      const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
      
      log.info('Memory usage', {
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
        usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
        external: `${Math.round(memory.external / 1024 / 1024)}MB`
      });
      
      // Trigger garbage collection if memory usage is high
      if (memoryUsagePercent > 85 && global.gc) {
        log.warn('High memory usage, triggering garbage collection');
        global.gc();
      }
      
      lastMemoryCheck = now;
    }
    
    next();
  };
}

/**
 * API response optimization
 */
export function responseOptimization() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Add performance metadata
      const responseData = {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
          version: '1.0.0'
        }
      };
      
      // Add pagination metadata if applicable
      if (req.pagination && Array.isArray(data)) {
        responseData.meta.pagination = {
          page: req.pagination.page,
          limit: req.pagination.limit,
          total: data.length
        };
      }
      
      return originalJson.call(this, responseData);
    };
    
    next();
  };
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
      filters?: any;
      sorting?: Array<{
        field: string;
        direction: 'ASC' | 'DESC';
      }>;
      connectionInfo?: {
        remoteAddress?: string;
        remotePort?: number;
        localAddress?: string;
        localPort?: number;
      };
    }
  }
}