import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cacheService';
import { log } from '../utils/logger';

/**
 * Middleware to cache API responses
 */
export function cacheMiddleware(options: {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  prefix?: string;
} = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition if provided
    if (options.condition && !options.condition(req, res)) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = options.keyGenerator 
        ? options.keyGenerator(req)
        : generateDefaultCacheKey(req);

      // Try to get from cache
      const cachedResponse = await cacheService.get(cacheKey, {
        ttl: options.ttl,
        prefix: options.prefix
      });

      if (cachedResponse) {
        log.debug('Serving cached response', { key: cacheKey });
        return res.json(cachedResponse);
      }

      // Store original send function
      const originalSend = res.json;

      // Override send to cache the response
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, {
            ttl: options.ttl,
            prefix: options.prefix
          }).catch(error => {
            log.warn('Failed to cache response', { key: cacheKey, error });
          });
        }

        // Call original send
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      log.error('Cache middleware error', { error });
      next();
    }
  };
}

/**
 * Middleware for branch-scoped caching
 */
export function branchCache(ttl: number = 1800) {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const branchId = req.headers['x-branch-id'] || req.query.branch_id || 'default';
      return `branch:${branchId}:${req.path}:${JSON.stringify(req.query)}`;
    },
    prefix: 'api'
  });
}

/**
 * Middleware for user-specific caching
 */
export function userCache(ttl: number = 3600) {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const userId = (req as any).user?.id || 'anonymous';
      return `user:${userId}:${req.path}:${JSON.stringify(req.query)}`;
    },
    prefix: 'api'
  });
}

/**
 * Middleware for dashboard caching
 */
export function dashboardCache(ttl: number = 300) {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const branchId = req.headers['x-branch-id'] || 'default';
      const orgId = req.headers['x-organization-id'] || 'default';
      return `dashboard:${orgId}:${branchId}:${req.path}:${JSON.stringify(req.query)}`;
    },
    prefix: 'dashboard'
  });
}

/**
 * Middleware for search result caching
 */
export function searchCache(ttl: number = 600) {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const searchTerm = req.query.q || req.query.search || '';
      const filters = { ...req.query };
      delete filters.q;
      delete filters.search;
      
      return `search:${req.path}:${searchTerm}:${JSON.stringify(filters)}`;
    },
    prefix: 'search',
    condition: (req) => {
      // Only cache if there's a search term
      return !!(req.query.q || req.query.search);
    }
  });
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(patterns: string[] | ((req: Request) => string[])) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.json;

    // Override send to invalidate cache after successful operations
    res.json = function(data: any) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const invalidationPatterns = typeof patterns === 'function' 
          ? patterns(req) 
          : patterns;

        invalidationPatterns.forEach(pattern => {
          cacheService.deletePattern(pattern).catch(error => {
            log.warn('Failed to invalidate cache pattern', { pattern, error });
          });
        });
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(req: Request): string {
  const path = req.path;
  const query = JSON.stringify(req.query);
  const userId = (req as any).user?.id || 'anonymous';
  return `${userId}:${path}:${query}`;
}

/**
 * Cache warming utilities
 */
export const cacheWarming = {
  /**
   * Warm up dashboard cache for a branch
   */
  async warmDashboard(branchId: string, orgId: string) {
    try {
      log.info('Warming dashboard cache', { branchId, orgId });
      
      // Simulate dashboard requests to warm cache
      const dashboardEndpoints = [
        '/stats',
        '/recent-bookings',
        '/revenue-summary',
        '/vehicle-status'
      ];

      // This would normally make actual requests to warm the cache
      // For now, we'll just log the intention
      for (const endpoint of dashboardEndpoints) {
        log.debug('Would warm cache for endpoint', { endpoint, branchId });
      }
    } catch (error) {
      log.error('Dashboard cache warming failed', { branchId, error });
    }
  },

  /**
   * Warm up frequently accessed data
   */
  async warmFrequentData(branchId: string) {
    try {
      log.info('Warming frequent data cache', { branchId });
      
      // This would pre-load:
      // - Active vehicles
      // - Recent customers
      // - Rate configurations
      // - Branch settings
    } catch (error) {
      log.error('Frequent data cache warming failed', { branchId, error });
    }
  }
};

// Export cache service for direct use
export { cacheService };