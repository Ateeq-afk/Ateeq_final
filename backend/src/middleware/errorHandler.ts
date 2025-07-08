import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorLogger = async (error: CustomError, req: Request) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
    organizationId: (req as any).user?.organization_id,
    branchId: (req as any).user?.branch_id,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    },
    body: req.body,
    query: req.query,
    params: req.params
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', errorLog);
  }

  // Log to database
  try {
    await supabase
      .from('error_logs')
      .insert({
        method: errorLog.method,
        url: errorLog.url,
        user_id: errorLog.userId,
        organization_id: errorLog.organizationId,
        branch_id: errorLog.branchId,
        error_message: errorLog.error.message,
        error_code: errorLog.error.code,
        status_code: errorLog.error.statusCode,
        error_details: errorLog.error.details,
        request_body: errorLog.body,
        request_query: errorLog.query,
        request_params: errorLog.params,
        ip_address: errorLog.ip,
        user_agent: errorLog.userAgent
      });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }
};

export const errorHandler = async (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  await errorLogger(error, req);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === '11000') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Supabase errors
  if (err.message?.includes('JWT')) {
    const message = 'Authentication failed';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error.details
      })
    }
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const message = `Route ${req.originalUrl} not found`;
  next(new AppError(message, 404));
};