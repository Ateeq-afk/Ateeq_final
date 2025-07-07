import { Response } from 'express';
import { log } from './logger';
import SentryManager from '../config/sentry';
import { captureBusinessError } from '../middleware/sentry';

// Standardized API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  path?: string;
}

// Standardized error response interface
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
  timestamp: string;
  path?: string;
  statusCode: number;
}

// Success response helper
export function sendSuccess<T>(
  res: Response, 
  data?: T, 
  message?: string, 
  statusCode: number = 200
): Response<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    path: res.req.originalUrl
  };

  return res.status(statusCode).json(response);
}

// Error response helper
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any,
  message?: string
): Response<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
    path: res.req.originalUrl,
    statusCode
  };

  // Log error with structured logging
  log.error(`API Error: ${res.req.method} ${res.req.originalUrl}`, {
    statusCode,
    method: res.req.method,
    path: res.req.originalUrl,
    userAgent: res.req.get('User-Agent'),
    ip: res.req.ip,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    details,
    timestamp: new Date().toISOString()
  });

  return res.status(statusCode).json(response);
}

// Validation error helper
export function sendValidationError(
  res: Response,
  validationErrors: any,
  message: string = 'Validation failed'
): Response<ApiErrorResponse> {
  // Capture validation errors for analysis (but with lower severity)
  if (SentryManager.isReady()) {
    SentryManager.captureMessage(
      `Validation failed: ${res.req.method} ${res.req.path}`,
      'warning',
      {
        validation_errors: validationErrors,
        request_data: res.req.body
      }
    );
  }

  return sendError(res, 'Validation Error', 400, validationErrors, message);
}

// Not found error helper
export function sendNotFound(
  res: Response,
  resource: string = 'Resource'
): Response<ApiErrorResponse> {
  return sendError(res, `${resource} not found`, 404);
}

// Unauthorized error helper
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized access'
): Response<ApiErrorResponse> {
  return sendError(res, 'Unauthorized', 401, undefined, message);
}

// Forbidden error helper
export function sendForbidden(
  res: Response,
  message: string = 'Access forbidden'
): Response<ApiErrorResponse> {
  return sendError(res, 'Forbidden', 403, undefined, message);
}

// Server error helper
export function sendServerError(
  res: Response,
  error: any,
  message: string = 'Internal server error'
): Response<ApiErrorResponse> {
  // Capture error in Sentry for 500-level errors
  if (SentryManager.isReady() && error instanceof Error) {
    SentryManager.captureException(error, {
      request_context: {
        method: res.req.method,
        url: res.req.url,
        user_agent: res.req.get('User-Agent'),
        ip: res.req.ip
      }
    });
  }

  // Don't expose internal error details in production
  const details = process.env.NODE_ENV === 'development' ? error : undefined;
  return sendError(res, 'Server Error', 500, details, message);
}

// Database error helper
export function sendDatabaseError(
  res: Response,
  error: any,
  operation: string = 'Database operation'
): Response<ApiErrorResponse> {
  const message = `${operation} failed`;
  
  // Capture database errors in Sentry with context
  if (SentryManager.isReady() && error instanceof Error) {
    SentryManager.captureException(error, {
      database_context: {
        operation,
        error_code: error.code || 'unknown',
        error_details: error.details || error.hint || error.message
      }
    });
  }
  
  // Handle common database errors
  if (error.code === 'PGRST116') {
    return sendNotFound(res, 'Record');
  }
  
  if (error.code === '23505') {
    return sendError(res, 'Duplicate entry', 409, undefined, 'A record with this information already exists');
  }
  
  if (error.code === '23503') {
    return sendError(res, 'Foreign key constraint', 400, undefined, 'Referenced record does not exist');
  }

  return sendServerError(res, error, message);
}

// Async handler wrapper to catch errors
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      log.error('Async handler caught unhandled promise rejection', {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      });
      sendServerError(res, error);
    });
  };
}

// Response middleware for consistent formatting
export function responseMiddleware(req: any, res: any, next: any) {
  // Add helper methods to response object
  res.sendSuccess = (data?: any, message?: string, statusCode?: number) => 
    sendSuccess(res, data, message, statusCode);
  
  res.sendError = (error: string, statusCode?: number, details?: any, message?: string) => 
    sendError(res, error, statusCode, details, message);
    
  res.sendValidationError = (validationErrors: any, message?: string) => 
    sendValidationError(res, validationErrors, message);
    
  res.sendNotFound = (resource?: string) => 
    sendNotFound(res, resource);
    
  res.sendUnauthorized = (message?: string) => 
    sendUnauthorized(res, message);
    
  res.sendForbidden = (message?: string) => 
    sendForbidden(res, message);
    
  res.sendServerError = (error: any, message?: string) => 
    sendServerError(res, error, message);
    
  res.sendDatabaseError = (error: any, operation?: string) => 
    sendDatabaseError(res, error, operation);

  next();
}