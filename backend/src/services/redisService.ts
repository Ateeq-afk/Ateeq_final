import Redis from 'ioredis';
import { log } from '../utils/logger';

/**
 * Redis Service for caching and session management
 * 
 * Development Setup with Docker:
 * 1. Pull Redis image: docker pull redis:7-alpine
 * 2. Run Redis container: docker run -d --name desicargo-redis -p 6379:6379 redis:7-alpine
 * 3. Connect to Redis CLI: docker exec -it desicargo-redis redis-cli
 * 
 * Alternative: Use Redis Stack for GUI
 * docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
 * Access RedisInsight at http://localhost:8001
 */

interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryStrategy?: (times: number) => number | null;
}

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private config: RedisConfig;

  constructor() {
    this.config = this.getConfig();
    this.initialize();
  }

  private getConfig(): RedisConfig {
    // Parse Redis URL if provided
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const url = new URL(redisUrl);
        return {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: url.password || undefined,
          db: 0,
          keyPrefix: 'desicargo:',
          retryStrategy: this.retryStrategy
        };
      } catch (error) {
        log.error('Invalid REDIS_URL format', { error });
      }
    }

    // Fallback to individual env vars
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'desicargo:',
      retryStrategy: this.retryStrategy
    };
  }

  private retryStrategy(times: number): number | null {
    if (times > 10) {
      log.error('Redis connection failed after 10 attempts');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    log.warn(`Redis reconnection attempt ${times}, retrying in ${delay}ms`);
    return delay;
  }

  private initialize() {
    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        retryStrategy: this.config.retryStrategy,
        enableOfflineQueue: true,
        connectTimeout: 10000,
        maxRetriesPerRequest: 3
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        log.info('Redis connected successfully', {
          host: this.config.host,
          port: this.config.port,
          keyPrefix: this.config.keyPrefix
        });
      });

      this.client.on('error', (error) => {
        log.error('Redis connection error', { error: error.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        log.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        log.info('Redis reconnecting...');
      });

    } catch (error) {
      log.error('Failed to initialize Redis client', { error });
      this.client = null;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis | null {
    if (!this.client) {
      log.warn('Redis client not initialized');
    }
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * OTP-specific methods
   */
  async setOTP(phoneNumber: string, otp: string, expirySeconds: number = 600): Promise<boolean> {
    if (!this.client) {
      log.error('Cannot set OTP: Redis not connected');
      return false;
    }

    try {
      const key = `otp:${phoneNumber}`;
      const data = JSON.stringify({
        otp,
        attempts: 0,
        createdAt: new Date().toISOString()
      });
      
      const result = await this.client.setex(key, expirySeconds, data);
      return result === 'OK';
    } catch (error) {
      log.error('Failed to store OTP in Redis', { error, phoneNumber });
      return false;
    }
  }

  async getOTP(phoneNumber: string): Promise<{ otp: string; attempts: number } | null> {
    if (!this.client) {
      log.error('Cannot get OTP: Redis not connected');
      return null;
    }

    try {
      const key = `otp:${phoneNumber}`;
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      log.error('Failed to retrieve OTP from Redis', { error, phoneNumber });
      return null;
    }
  }

  async incrementOTPAttempts(phoneNumber: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const key = `otp:${phoneNumber}`;
      const data = await this.client.get(key);
      
      if (!data) {
        return false;
      }

      const otpData = JSON.parse(data);
      otpData.attempts += 1;
      
      // Get remaining TTL
      const ttl = await this.client.ttl(key);
      if (ttl > 0) {
        await this.client.setex(key, ttl, JSON.stringify(otpData));
      }
      
      return true;
    } catch (error) {
      log.error('Failed to increment OTP attempts', { error, phoneNumber });
      return false;
    }
  }

  async deleteOTP(phoneNumber: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const key = `otp:${phoneNumber}`;
      const result = await this.client.del(key);
      return result === 1;
    } catch (error) {
      log.error('Failed to delete OTP from Redis', { error, phoneNumber });
      return false;
    }
  }

  /**
   * Generic cache methods
   */
  async set(key: string, value: any, expirySeconds?: number): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (expirySeconds) {
        const result = await this.client.setex(key, expirySeconds, serialized);
        return result === 'OK';
      } else {
        const result = await this.client.set(key, serialized);
        return result === 'OK';
      }
    } catch (error) {
      log.error('Redis set error', { error, key });
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      log.error('Redis get error', { error, key });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result === 1;
    } catch (error) {
      log.error('Redis delete error', { error, key });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      log.error('Redis exists error', { error, key });
      return false;
    }
  }

  /**
   * Session management methods
   */
  async setSession(sessionId: string, data: any, expirySeconds: number = 86400): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.set(key, data, expirySeconds);
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return this.get<T>(key);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.delete(key);
  }

  /**
   * Rate limiting methods
   */
  async incrementRateLimit(identifier: string, windowSeconds: number = 60): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      const key = `ratelimit:${identifier}`;
      const count = await this.client.incr(key);
      
      if (count === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      return count;
    } catch (error) {
      log.error('Rate limit increment error', { error, identifier });
      return 0;
    }
  }

  async getRateLimitCount(identifier: string): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      const key = `ratelimit:${identifier}`;
      const count = await this.client.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      log.error('Rate limit get error', { error, identifier });
      return 0;
    }
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      log.info('Redis connection closed gracefully');
    }
  }
}

// Export singleton instance
const redisService = new RedisService();
export default redisService;

// Export class for testing
export { RedisService };