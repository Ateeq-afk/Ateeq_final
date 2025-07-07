import { Request, Response, NextFunction } from 'express';
import DatabaseConnectionPool from '../config/database';
import { log } from '../utils/logger';
import { sendServerError } from '../utils/apiResponse';

// Extend Express Request to include database client
declare global {
  namespace Express {
    interface Request {
      db?: {
        query: (text: string, params?: any[]) => Promise<any>;
        transaction: <T>(callback: (client: any) => Promise<T>) => Promise<T>;
        getClient: () => Promise<any>;
      };
    }
  }
}

/**
 * Middleware to provide database access to routes
 */
export const databaseMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const dbPool = DatabaseConnectionPool.getInstance();
  
  // Check if pool is ready
  if (!dbPool.isReady()) {
    log.error('Database pool not ready for request', {
      method: req.method,
      url: req.url,
      ip: req.ip
    });
    
    sendServerError(res, new Error('Database connection not available'));
    return;
  }

  // Attach database methods to request
  req.db = {
    query: async (text: string, params?: any[]) => {
      try {
        return await dbPool.query(text, params);
      } catch (error) {
        log.error('Database query error in middleware', {
          error: error instanceof Error ? error.message : String(error),
          method: req.method,
          url: req.url
        });
        throw error;
      }
    },

    transaction: async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
      try {
        return await dbPool.transaction(callback);
      } catch (error) {
        log.error('Database transaction error in middleware', {
          error: error instanceof Error ? error.message : String(error),
          method: req.method,
          url: req.url
        });
        throw error;
      }
    },

    getClient: async () => {
      try {
        return await dbPool.getClient();
      } catch (error) {
        log.error('Database client acquisition error in middleware', {
          error: error instanceof Error ? error.message : String(error),
          method: req.method,
          url: req.url
        });
        throw error;
      }
    }
  };

  next();
};

/**
 * Middleware to log database performance metrics
 */
export const databasePerformanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const dbPool = DatabaseConnectionPool.getInstance();
  
  // Log pool stats for monitoring
  const originalQuery = req.db?.query;
  if (originalQuery) {
    req.db!.query = async (text: string, params?: any[]) => {
      const start = Date.now();
      const stats = dbPool.getPoolStats();
      
      try {
        const result = await originalQuery(text, params);
        const duration = Date.now() - start;
        
        // Log slow queries
        if (duration > 1000) { // Log queries taking more than 1 second
          log.warn('Slow database query detected', {
            duration,
            queryLength: text.length,
            method: req.method,
            url: req.url,
            poolStats: stats
          });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        log.error('Database query failed with performance context', {
          duration,
          error: error instanceof Error ? error.message : String(error),
          queryLength: text.length,
          method: req.method,
          url: req.url,
          poolStats: stats
        });
        throw error;
      }
    };
  }

  next();
};

/**
 * Middleware to handle database errors gracefully
 */
export const databaseErrorMiddleware = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error) {
    // Check if it's a database-related error
    if (error.code || error.severity || error.routine) {
      // PostgreSQL error
      log.error('PostgreSQL error caught by middleware', {
        code: error.code,
        severity: error.severity,
        message: error.message,
        detail: error.detail,
        hint: error.hint,
        position: error.position,
        routine: error.routine,
        method: req.method,
        url: req.url,
        ip: req.ip
      });

      // Map PostgreSQL errors to appropriate HTTP responses
      switch (error.code) {
        case '23505': // unique_violation
          res.status(409).json({
            success: false,
            error: 'Resource already exists',
            code: 'DUPLICATE_RESOURCE'
          });
          return;

        case '23503': // foreign_key_violation
          res.status(400).json({
            success: false,
            error: 'Invalid reference to related resource',
            code: 'INVALID_REFERENCE'
          });
          return;

        case '23502': // not_null_violation
          res.status(400).json({
            success: false,
            error: 'Required field is missing',
            code: 'MISSING_REQUIRED_FIELD'
          });
          return;

        case '42P01': // undefined_table
          res.status(500).json({
            success: false,
            error: 'Database schema error',
            code: 'SCHEMA_ERROR'
          });
          return;

        case '42703': // undefined_column
          res.status(500).json({
            success: false,
            error: 'Database column error',
            code: 'COLUMN_ERROR'
          });
          return;

        case '57014': // query_canceled
          res.status(408).json({
            success: false,
            error: 'Query timeout',
            code: 'TIMEOUT'
          });
          return;

        case '53300': // too_many_connections
          res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            code: 'TOO_MANY_CONNECTIONS'
          });
          return;

        default:
          // Generic database error
          res.status(500).json({
            success: false,
            error: 'Database operation failed',
            code: 'DATABASE_ERROR'
          });
          return;
      }
    }

    // Connection pool specific errors
    if (error.message?.includes('pool') || error.message?.includes('connection')) {
      log.error('Database connection pool error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        poolStats: DatabaseConnectionPool.getInstance().getPoolStats()
      });

      res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        code: 'CONNECTION_ERROR'
      });
      return;
    }
  }

  // Pass to next error handler if not a database error
  next(error);
};

/**
 * Middleware to provide database health information
 */
export const databaseHealthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.path === '/health/database' || req.path === '/health/db') {
    try {
      const dbPool = DatabaseConnectionPool.getInstance();
      const health = await dbPool.healthCheck();
      
      res.status(health.status === 'healthy' ? 200 : 503).json({
        success: health.status === 'healthy',
        service: 'database',
        status: health.status,
        timestamp: new Date().toISOString(),
        details: health.details
      });
      return;
    } catch (error) {
      res.status(503).json({
        success: false,
        service: 'database',
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
      return;
    }
  }

  next();
};

/**
 * Initialize database connection pool
 */
export const initializeDatabase = async (): Promise<void> => {
  const dbPool = DatabaseConnectionPool.getInstance();
  
  try {
    await dbPool.initialize();
    log.info('Database connection pool initialized');
  } catch (error) {
    log.error('Failed to initialize database connection pool', error);
    throw error;
  }
};

/**
 * Gracefully close database connections
 */
export const closeDatabaseConnections = async (): Promise<void> => {
  const dbPool = DatabaseConnectionPool.getInstance();
  
  try {
    await dbPool.close();
    log.info('Database connections closed gracefully');
  } catch (error) {
    log.error('Error closing database connections', error);
    throw error;
  }
};