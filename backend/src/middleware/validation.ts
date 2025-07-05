import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// Request validation middleware
export function validateRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate URL parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return (res as any).sendValidationError(error.errors, 'Invalid request data');
      }
      
      return (res as any).sendServerError(error, 'Request validation failed');
    }
  };
}

// Common validation schemas
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: z.object({
    id: z.string().uuid('Invalid ID format')
  }),

  // Pagination query validation
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc')
  }),

  // Search query validation
  search: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query too long').optional(),
    filter: z.string().optional()
  }),

  // Organization context validation
  orgContext: z.object({
    organization_id: z.string().uuid('Invalid organization ID'),
    branch_id: z.string().uuid('Invalid branch ID').optional()
  })
};

// Sanitization helpers
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>\"'&]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\-\s]/g, '');
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize string fields in request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
}

function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Special handling for specific field types
        if (key.includes('email')) {
          sanitized[key] = sanitizeEmail(value);
        } else if (key.includes('phone') || key.includes('mobile')) {
          sanitized[key] = sanitizePhone(value);
        } else {
          sanitized[key] = sanitizeString(value);
        }
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
}

// Rate limiting validation
export function validateRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(key);
      }
    }

    const requestData = requests.get(identifier);
    
    if (!requestData) {
      requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > requestData.resetTime) {
      requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (requestData.count >= maxRequests) {
      return (res as any).sendError('Rate limit exceeded', 429, 
        { retryAfter: Math.ceil((requestData.resetTime - now) / 1000) },
        'Too many requests, please try again later'
      );
    }

    requestData.count++;
    next();
  };
}

// File upload validation
export function validateFileUpload(options: {
  maxSize?: number;
  allowedMimeTypes?: string[];
  required?: boolean;
} = {}) {
  const { maxSize = 5 * 1024 * 1024, allowedMimeTypes = [], required = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as any;
    
    if (!files && required) {
      return (res as any).sendError('File upload required', 400);
    }

    if (!files) {
      return next();
    }

    // Validate each uploaded file
    const fileArray = Array.isArray(files) ? files : [files];
    
    for (const file of fileArray) {
      if (file.size > maxSize) {
        return (res as any).sendError('File too large', 400, 
          { maxSize, actualSize: file.size },
          `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
        );
      }

      if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
        return (res as any).sendError('Invalid file type', 400,
          { allowedTypes: allowedMimeTypes, actualType: file.mimetype },
          'File type not allowed'
        );
      }
    }

    next();
  };
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  next();
}

export default {
  validateRequest,
  commonSchemas,
  sanitizeInput,
  validateRateLimit,
  validateFileUpload,
  securityHeaders
};