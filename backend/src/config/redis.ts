import Redis from 'ioredis';
import { log } from '../utils/logger';

class RedisConfig {
  private static instance: Redis | null = null;
  private static isConnected = false;

  static getInstance(): Redis | null {
    if (!this.instance) {
      this.instance = this.createConnection();
    }
    return this.instance;
  }

  private static createConnection(): Redis | null {
    try {
      // Redis configuration from environment
      const redisUrl = process.env.REDIS_URL;
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword = process.env.REDIS_PASSWORD;
      const redisDb = parseInt(process.env.REDIS_DB || '0');

      let redis: Redis;

      if (redisUrl) {
        // Use Redis URL (production/staging)
        redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          family: 4,
        });
      } else {
        // Use individual config options (development)
        redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          db: redisDb,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          family: 4,
        });
      }

      // Connection event handlers
      redis.on('connect', () => {
        this.isConnected = true;
        log.info('Redis connection established', {
          host: redisHost,
          port: redisPort,
          db: redisDb
        });
      });

      redis.on('ready', () => {
        log.info('Redis client ready');
      });

      redis.on('error', (error) => {
        this.isConnected = false;
        log.error('Redis connection error', {
          error: error.message,
          stack: error.stack
        });
      });

      redis.on('close', () => {
        this.isConnected = false;
        log.warn('Redis connection closed');
      });

      redis.on('reconnecting', () => {
        log.info('Redis reconnecting...');
      });

      // Attempt to connect
      redis.connect().catch(error => {
        log.error('Failed to connect to Redis', { error: error.message });
      });

      return redis;

    } catch (error) {
      log.error('Redis initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  static isRedisConnected(): boolean {
    return this.isConnected && this.instance?.status === 'ready';
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
      this.isConnected = false;
      log.info('Redis connection closed');
    }
  }

  // Health check
  static async healthCheck(): Promise<{
    connected: boolean;
    latency?: number;
    memory?: string;
    error?: string;
  }> {
    if (!this.instance || !this.isConnected) {
      return { connected: false, error: 'Redis not connected' };
    }

    try {
      const start = Date.now();
      await this.instance.ping();
      const latency = Date.now() - start;

      // Get memory info
      const info = await this.instance.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        connected: true,
        latency,
        memory
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default RedisConfig;