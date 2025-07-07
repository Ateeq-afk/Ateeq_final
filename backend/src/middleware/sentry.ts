import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import SentryManager from '../config/sentry';
import { log } from '../utils/logger';

/**
 * Middleware to setup Sentry request context
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'role', 'branch_id'],
    request: ['method', 'url', 'headers', 'query_string'],
    serverName: false, // Don't send server name for privacy
  });
}

/**
 * Middleware to setup Sentry tracing
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Enhanced error handler middleware that integrates with Sentry
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error: Error) {
      // Filter out certain types of errors
      const ignoredErrors = [
        'ValidationError',
        'UnauthorizedError',
        'ForbiddenError',
        'NotFoundError'
      ];

      // Don't send client errors (4xx) to Sentry by default
      if (error.name && ignoredErrors.includes(error.name)) {
        return false;
      }

      // Always handle server errors (5xx)
      return true;
    }
  });
}

/**
 * Middleware to capture user context from authenticated requests
 */
export function captureUserContext(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract user info from request (assuming it's set by auth middleware)
    const user = (req as any).user;
    const orgId = (req as any).orgId;
    const branchId = (req as any).branchId;
    const role = (req as any).role;

    if (user && SentryManager.isReady()) {
      SentryManager.setUser({
        id: user.id || user.user_id,
        email: user.email,
        username: user.username || user.name,
        role: role || user.role,
        branch_id: branchId || user.branch_id
      });

      // Add additional context
      Sentry.setContext('organization', {
        id: orgId,
        branch_id: branchId
      });

      // Add request context
      Sentry.setContext('request_info', {
        method: req.method,
        url: req.url,
        user_agent: req.get('User-Agent'),
        ip: req.ip,
        branch_header: req.headers['x-branch-id'],
        org_header: req.headers['x-organization-id']
      });
    }

    next();
  } catch (error) {
    log.warn('Failed to capture user context for Sentry', { error });
    next();
  }
}

/**
 * Middleware to add performance monitoring breadcrumbs
 */
export function performanceBreadcrumbs(req: Request, res: Response, next: NextFunction): void {
  if (!SentryManager.isReady()) {
    return next();
  }

  const startTime = Date.now();

  // Add request breadcrumb
  SentryManager.addBreadcrumb({
    message: `${req.method} ${req.path}`,
    category: 'http.request',
    level: 'info',
    data: {
      method: req.method,
      url: req.url,
      query: req.query,
      body_size: req.get('content-length'),
      user_agent: req.get('User-Agent')
    }
  });

  // Override res.end to capture response info
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Add response breadcrumb
    SentryManager.addBreadcrumb({
      message: `Response ${res.statusCode} in ${duration}ms`,
      category: 'http.response',
      level: res.statusCode >= 400 ? 'warning' : 'info',
      data: {
        status_code: res.statusCode,
        duration,
        response_size: res.get('content-length')
      }
    });

    // Log slow requests
    if (duration > 5000) { // 5 seconds
      SentryManager.captureMessage(
        `Slow request: ${req.method} ${req.path} took ${duration}ms`,
        'warning',
        {
          request: {
            method: req.method,
            path: req.path,
            duration,
            status_code: res.statusCode
          }
        }
      );
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Middleware to capture database operation context
 */
export function databaseBreadcrumbs(operation: string, table?: string, query?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!SentryManager.isReady()) {
      return next();
    }

    SentryManager.addBreadcrumb({
      message: `Database ${operation}${table ? ` on ${table}` : ''}`,
      category: 'database',
      level: 'info',
      data: {
        operation,
        table,
        query: query?.substring(0, 200), // Truncate long queries
        timestamp: new Date().toISOString()
      }
    });

    next();
  };
}

/**
 * Middleware to capture business logic errors
 */
export function captureBusinessError(error: Error, context: {
  operation: string;
  entity?: string;
  user_id?: string;
  branch_id?: string;
  additional_data?: Record<string, any>;
}): void {
  if (!SentryManager.isReady()) {
    log.error('Business logic error', { error: error.message, context });
    return;
  }

  SentryManager.captureException(error, {
    business_context: {
      operation: context.operation,
      entity: context.entity,
      user_id: context.user_id,
      branch_id: context.branch_id,
      timestamp: new Date().toISOString()
    },
    additional_data: context.additional_data
  });
}

/**
 * Helper function to capture API validation errors
 */
export function captureValidationError(
  validationErrors: any[],
  endpoint: string,
  requestData?: any
): void {
  if (!SentryManager.isReady()) return;

  SentryManager.captureMessage(
    `Validation error in ${endpoint}`,
    'warning',
    {
      validation: {
        endpoint,
        errors: validationErrors,
        request_data: requestData ? JSON.stringify(requestData).substring(0, 500) : undefined
      }
    }
  );
}

/**
 * Helper function to capture performance metrics
 */
export function capturePerformanceMetric(
  metric: string,
  value: number,
  unit: string,
  context?: Record<string, any>
): void {
  if (!SentryManager.isReady()) return;

  SentryManager.addBreadcrumb({
    message: `Performance: ${metric} = ${value}${unit}`,
    category: 'performance',
    level: 'info',
    data: {
      metric,
      value,
      unit,
      context,
      timestamp: Date.now()
    }
  });
}

/**
 * Transaction wrapper for database operations
 */
export async function withSentryTransaction<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  if (!SentryManager.isReady()) {
    return await operation();
  }

  const transaction = SentryManager.startTransaction(name, 'db.operation');
  
  try {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        transaction.setData(key, value);
      });
    }

    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    SentryManager.captureException(error as Error, { transaction_context: context });
    throw error;
  } finally {
    transaction.finish();
  }
}