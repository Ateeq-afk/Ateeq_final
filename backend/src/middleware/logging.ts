import { Request, Response, NextFunction } from 'express';
import { log, timer } from '../utils/logger.js';

interface RequestWithTiming extends Request {
  startTime?: number;
  timingLabel?: string;
}

export const requestLoggingMiddleware = () => {
  return (req: RequestWithTiming, res: Response, next: NextFunction) => {
    // Skip logging for health checks and static assets
    if (req.url.includes('/health') || req.url.includes('.')) {
      return next();
    }

    req.startTime = Date.now();
    req.timingLabel = `${req.method} ${req.url}`;

    // Log request
    log.api(`Incoming request`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organization_id,
      branchId: (req as any).user?.branch_id
    });

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data: any) {
      const duration = req.startTime ? Date.now() - req.startTime : 0;
      
      log.api(`Request completed`, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: (req as any).user?.id
      });

      // Log slow requests as warnings
      if (duration > 1000) {
        log.warn(`Slow request detected`, {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          threshold: '1000ms'
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// Business event logging middleware
export const businessEventLogger = (eventType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Only log successful business events
      if (res.statusCode < 400 && data?.success !== false) {
        const user = (req as any).user;
        
        log.info(`Business Event: ${eventType}`, {
          event: eventType,
          userId: user?.id,
          organizationId: user?.organization_id,
          branchId: user?.branch_id,
          method: req.method,
          url: req.url,
          requestBody: req.method !== 'GET' ? req.body : undefined,
          responseData: data
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};