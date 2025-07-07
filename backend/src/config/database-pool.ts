import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from '../utils/logger';

/**
 * Advanced Supabase connection pool with health monitoring
 */
class DatabaseConnectionPool {
  private pools: Map<string, SupabaseClient> = new Map();
  private healthChecks: Map<string, { lastCheck: number; isHealthy: boolean }> = new Map();
  private config: {
    maxConnections: number;
    healthCheckInterval: number;
    connectionTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  constructor() {
    this.config = {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
      healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000')
    };

    this.initializePools();
    this.startHealthChecking();
  }

  private initializePools() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create primary connection pool
    for (let i = 0; i < this.config.maxConnections; i++) {
      const poolId = `primary_${i}`;
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Pool-ID': poolId,
            'X-Connection-Type': 'pooled'
          }
        }
      });

      this.pools.set(poolId, client);
      this.healthChecks.set(poolId, { lastCheck: 0, isHealthy: false });
    }

    log.info('Database connection pool initialized', {
      totalConnections: this.pools.size,
      maxConnections: this.config.maxConnections
    });
  }

  private startHealthChecking() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);

    // Initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
  }

  private async performHealthChecks() {
    const promises = Array.from(this.pools.entries()).map(async ([poolId, client]) => {
      try {
        const startTime = Date.now();
        
        // Simple health check query
        const { data, error } = await client
          .from('organizations')
          .select('count')
          .limit(1)
          .single();

        const responseTime = Date.now() - startTime;

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" which is fine
          throw error;
        }

        this.healthChecks.set(poolId, {
          lastCheck: Date.now(),
          isHealthy: true
        });

        log.debug('Health check passed', {
          poolId,
          responseTime: `${responseTime}ms`
        });

      } catch (error) {
        this.healthChecks.set(poolId, {
          lastCheck: Date.now(),
          isHealthy: false
        });

        log.warn('Health check failed', {
          poolId,
          error: error.message
        });
      }
    });

    await Promise.allSettled(promises);

    // Log overall health status
    const healthyConnections = Array.from(this.healthChecks.values())
      .filter(check => check.isHealthy).length;

    log.info('Connection pool health status', {
      healthy: healthyConnections,
      total: this.pools.size,
      healthRatio: `${((healthyConnections / this.pools.size) * 100).toFixed(1)}%`
    });
  }

  /**
   * Get a healthy connection from the pool
   */
  async getConnection(preferredPoolId?: string): Promise<SupabaseClient> {
    // Try preferred connection first
    if (preferredPoolId && this.isConnectionHealthy(preferredPoolId)) {
      return this.pools.get(preferredPoolId)!;
    }

    // Find any healthy connection
    for (const [poolId, client] of this.pools.entries()) {
      if (this.isConnectionHealthy(poolId)) {
        return client;
      }
    }

    // If no healthy connections, try to use any connection with retry
    log.warn('No healthy connections available, using fallback');
    return this.pools.values().next().value;
  }

  /**
   * Get connection with automatic retry logic
   */
  async getConnectionWithRetry(): Promise<SupabaseClient> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const connection = await this.getConnection();
        
        // Test connection with a simple query
        await connection.from('organizations').select('count').limit(1);
        
        return connection;
      } catch (error) {
        lastError = error;
        
        log.warn('Connection attempt failed', {
          attempt,
          maxAttempts: this.config.retryAttempts,
          error: error.message
        });

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Failed to get database connection after ${this.config.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Execute query with automatic connection management
   */
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<T>,
    options: { retries?: boolean } = {}
  ): Promise<T> {
    const connection = options.retries 
      ? await this.getConnectionWithRetry()
      : await this.getConnection();

    return await queryFn(connection);
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    const healthyCount = Array.from(this.healthChecks.values())
      .filter(check => check.isHealthy).length;

    return {
      totalConnections: this.pools.size,
      healthyConnections: healthyCount,
      unhealthyConnections: this.pools.size - healthyCount,
      healthRatio: (healthyCount / this.pools.size) * 100,
      lastHealthCheck: Math.max(...Array.from(this.healthChecks.values()).map(check => check.lastCheck)),
      config: this.config
    };
  }

  private isConnectionHealthy(poolId: string): boolean {
    const healthCheck = this.healthChecks.get(poolId);
    if (!healthCheck) return false;

    // Consider connection unhealthy if not checked in the last 2 intervals
    const staleThreshold = Date.now() - (this.config.healthCheckInterval * 2);
    return healthCheck.isHealthy && healthCheck.lastCheck > staleThreshold;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    log.info('Shutting down database connection pool');
    
    // No explicit close method for Supabase clients, they handle cleanup automatically
    this.pools.clear();
    this.healthChecks.clear();
  }
}

// Singleton instance
const dbPool = new DatabaseConnectionPool();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await dbPool.shutdown();
});

process.on('SIGINT', async () => {
  await dbPool.shutdown();
});

export default dbPool;

/**
 * Middleware to inject database connection into requests
 */
export function databasePoolMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      req.db = await dbPool.getConnection();
      req.dbPool = dbPool;
      next();
    } catch (error) {
      log.error('Failed to get database connection for request', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(503).json({
        success: false,
        error: 'Database temporarily unavailable',
        requestId: req.requestId
      });
    }
  };
}

/**
 * Database health check endpoint
 */
export function createHealthCheckEndpoint() {
  return async (req: any, res: any) => {
    try {
      const stats = dbPool.getPoolStats();
      const isHealthy = stats.healthRatio >= 50; // At least 50% connections healthy

      res.status(isHealthy ? 200 : 503).json({
        success: true,
        healthy: isHealthy,
        data: stats
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        healthy: false,
        error: error.message
      });
    }
  };
}