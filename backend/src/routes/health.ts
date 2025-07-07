import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { log, timer } from '../utils/logger';
import DatabaseConnectionPool from '../config/database';
import SupabasePoolManager from '../utils/supabasePool';
// import RedisConfig from '../config/redis';
// import cacheService from '../services/cacheService';
import SentryManager from '../config/sentry';

const router = Router();

// Health check configuration
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const CRITICAL_SERVICES = ['supabase', 'memory', 'disk'];

// Initialize Supabase client for health checks
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Memory usage check
function getMemoryUsage() {
  const usage = process.memoryUsage();
  const totalMemory = usage.heapTotal + usage.external + usage.arrayBuffers;
  const usedMemory = usage.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
    arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100, // MB
    usagePercent: Math.round(memoryUsagePercent * 100) / 100
  };
}

// Disk usage check (basic)
function getDiskUsage() {
  try {
    const stats = require('fs').statSync('/app');
    return {
      available: true,
      writable: true // Simplified check
    };
  } catch (error) {
    return {
      available: false,
      writable: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Database health check
async function checkDatabaseHealth(): Promise<{ 
  status: 'healthy' | 'unhealthy' | 'degraded'; 
  responseTime: number; 
  error?: string 
}> {
  const healthTimer = timer('supabase-health-check');
  
  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
      .single();

    const responseTime = healthTimer.end();

    if (error) {
      log.warn('Database health check failed', { 
        error: error.message, 
        responseTime 
      });
      return { 
        status: 'unhealthy', 
        responseTime, 
        error: error.message 
      };
    }

    // Check if response time is concerning
    if (responseTime > 2000) {
      return { 
        status: 'degraded', 
        responseTime,
        error: 'Slow database response'
      };
    }

    return { 
      status: 'healthy', 
      responseTime 
    };
  } catch (error) {
    const responseTime = healthTimer.end();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Database health check exception', { 
      error: errorMessage, 
      responseTime 
    });
    
    return { 
      status: 'unhealthy', 
      responseTime, 
      error: errorMessage 
    };
  }
}

// Database connection pool health check
async function checkDatabasePoolHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  stats: any;
  error?: string;
}> {
  try {
    const dbPool = DatabaseConnectionPool.getInstance();
    const health = await dbPool.healthCheck();
    
    return {
      status: health.status as 'healthy' | 'unhealthy' | 'degraded',
      stats: health.details
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      stats: {},
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Environment configuration check
function checkEnvironmentHealth() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    status: missing.length === 0 ? 'healthy' : 'unhealthy',
    nodeEnv,
    missingVars: missing,
    hasAllRequired: missing.length === 0
  };
}

// Basic health endpoint
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const memory = getMemoryUsage();
    const environment = checkEnvironmentHealth();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: environment.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      memory,
      pid: process.pid
    };

    // Check if memory usage is too high
    if (memory.usagePercent > 90) {
      healthStatus.status = 'degraded';
    }

    if (environment.status === 'unhealthy') {
      healthStatus.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    
    res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
      ...healthStatus,
      responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    log.error('Health check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime 
    });

    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      responseTime
    });
  }
});

// Detailed health endpoint
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const [database, memory, disk, environment, dbPool] = await Promise.allSettled([
      checkDatabaseHealth(),
      Promise.resolve(getMemoryUsage()),
      Promise.resolve(getDiskUsage()),
      Promise.resolve(checkEnvironmentHealth()),
      checkDatabasePoolHealth()
      // RedisConfig.healthCheck(),
      // cacheService.getStats()
    ]);

    const checks = {
      database: database.status === 'fulfilled' ? database.value : { 
        status: 'unhealthy', 
        error: 'Health check failed' 
      },
      memory: memory.status === 'fulfilled' ? memory.value : { 
        error: 'Memory check failed' 
      },
      disk: disk.status === 'fulfilled' ? disk.value : { 
        error: 'Disk check failed' 
      },
      environment: environment.status === 'fulfilled' ? environment.value : { 
        error: 'Environment check failed' 
      },
      databasePool: dbPool.status === 'fulfilled' ? dbPool.value : {
        status: 'unhealthy',
        error: 'Pool health check failed'
      },
      redis: { 
        connected: false,
        status: 'disabled',
        note: 'Redis is disabled in this environment'
      },
      cache: { 
        hits: 0,
        misses: 0,
        status: 'disabled',
        note: 'Cache is disabled (Redis not available)'
      },
      sentry: {
        enabled: SentryManager.isReady(),
        config: SentryManager.getConfig()
      }
    };

    // Determine overall status
    let overallStatus = 'healthy';
    
    if (checks.database.status === 'unhealthy' || 
        checks.environment.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (checks.database.status === 'degraded' || 
               (checks.memory.usagePercent && checks.memory.usagePercent > 80)) {
      overallStatus = 'degraded';
    }

    const responseTime = Date.now() - startTime;

    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks
    };

    res.status(overallStatus === 'healthy' ? 200 : 503).json(healthReport);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    log.error('Detailed health check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime 
    });

    res.status(503).json({
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
      responseTime
    });
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const envHealth = checkEnvironmentHealth();

    if (dbHealth.status === 'unhealthy' || envHealth.status === 'unhealthy') {
      return res.status(503).json({
        ready: false,
        reason: 'Critical services unavailable'
      });
    }

    res.json({
      ready: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Connection pool specific endpoint
router.get('/pool', async (req: Request, res: Response) => {
  try {
    const dbPool = DatabaseConnectionPool.getInstance();
    const stats = dbPool.getPoolStats();
    
    res.json({
      service: 'connection_pool',
      timestamp: new Date().toISOString(),
      status: dbPool.isReady() ? 'healthy' : 'not_ready',
      stats
    });
  } catch (error) {
    log.error('Pool health check failed', error);
    res.status(503).json({
      service: 'connection_pool',
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Performance metrics endpoint
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    
    // Test database query performance
    const dbPool = DatabaseConnectionPool.getInstance();
    await dbPool.query('SELECT 1 as test');
    const dbResponseTime = Date.now() - start;
    
    const performance = {
      timestamp: new Date().toISOString(),
      metrics: {
        database_response_time: dbResponseTime,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
        cpu_usage: process.cpuUsage()
      },
      pool_stats: dbPool.getPoolStats()
    };

    res.json(performance);
  } catch (error) {
    log.error('Performance check failed', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;