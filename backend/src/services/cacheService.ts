// import RedisConfig from '../config/redis'; // Redis disabled
import { log, timer } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  serialize?: boolean; // Whether to JSON serialize
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
}

class CacheService {
  private redis: any = null; // Redis disabled for now
  private stats = {
    hits: 0,
    misses: 0
  };

  // Default TTL values for different data types
  private readonly DEFAULT_TTL = {
    user_session: 86400, // 24 hours
    user_data: 3600, // 1 hour
    booking_data: 1800, // 30 minutes
    customer_data: 3600, // 1 hour
    vehicle_data: 7200, // 2 hours
    dashboard_stats: 300, // 5 minutes
    search_results: 600, // 10 minutes
    rate_calculations: 1800, // 30 minutes
    ogpl_data: 1800, // 30 minutes
    temporary: 300 // 5 minutes
  };

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.redis) {
      log.warn('Redis not available, cache miss');
      this.stats.misses++;
      return null;
    }

    try {
      const perfTimer = timer(`cache-get-${key}`);
      const fullKey = this.buildKey(key, options.prefix);
      
      const value = await this.redis.get(fullKey);
      perfTimer.end();

      if (value === null) {
        this.stats.misses++;
        log.debug('Cache miss', { key: fullKey });
        return null;
      }

      this.stats.hits++;
      log.debug('Cache hit', { key: fullKey });

      // Deserialize if needed
      if (options.serialize !== false) {
        try {
          return JSON.parse(value);
        } catch (error) {
          log.warn('Failed to parse cached JSON', { key: fullKey, error });
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      log.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.redis) {
      log.warn('Redis not available, cache set skipped');
      return false;
    }

    try {
      const perfTimer = timer(`cache-set-${key}`);
      const fullKey = this.buildKey(key, options.prefix);
      const ttl = options.ttl || this.DEFAULT_TTL.temporary;

      // Serialize if needed
      const serializedValue = options.serialize !== false 
        ? JSON.stringify(value)
        : value;

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        await this.redis.set(fullKey, serializedValue);
      }

      perfTimer.end();
      log.debug('Cache set', { key: fullKey, ttl });
      return true;
    } catch (error) {
      log.error('Cache set error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string, prefix?: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.del(fullKey);
      log.debug('Cache delete', { key: fullKey, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      log.error('Cache delete error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      log.error('Cache exists error', { key, error });
      return false;
    }
  }

  /**
   * Set cache with expiration time
   */
  async setWithExpiry(
    key: string, 
    value: any, 
    seconds: number, 
    prefix?: string
  ): Promise<boolean> {
    return this.set(key, value, { ttl: seconds, prefix });
  }

  /**
   * Get or set pattern - if key doesn't exist, run callback and cache result
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    try {
      // Execute callback to get fresh data
      const perfTimer = timer(`cache-callback-${key}`);
      const freshData = await callback();
      perfTimer.end();

      // Cache the result
      await this.set(key, freshData, options);
      return freshData;
    } catch (error) {
      log.error('Cache getOrSet callback error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1, prefix?: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.incrby(fullKey, by);
    } catch (error) {
      log.error('Cache increment error', { key, error });
      return 0;
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs: Record<string, any>, options: CacheOptions = {}): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      const ttl = options.ttl || this.DEFAULT_TTL.temporary;

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = this.buildKey(key, options.prefix);
        const serializedValue = options.serialize !== false 
          ? JSON.stringify(value)
          : value;

        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }

      await pipeline.exec();
      log.debug('Cache mset', { count: Object.keys(keyValuePairs).length, ttl });
      return true;
    } catch (error) {
      log.error('Cache mset error', { error });
      return false;
    }
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern: string, prefix?: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      const fullPattern = this.buildKey(pattern, prefix);
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      log.info('Cache pattern delete', { pattern: fullPattern, deleted: result });
      return result;
    } catch (error) {
      log.error('Cache pattern delete error', { pattern, error });
      return 0;
    }
  }

  /**
   * Cache invalidation helpers
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
    await this.deletePattern(`session:${userId}:*`);
  }

  async invalidateBranch(branchId: string): Promise<void> {
    await this.deletePattern(`branch:${branchId}:*`);
    await this.deletePattern(`dashboard:${branchId}:*`);
  }

  async invalidateBooking(bookingId: string): Promise<void> {
    await this.deletePattern(`booking:${bookingId}:*`);
    // Also invalidate related dashboard stats
    await this.deletePattern(`dashboard:*:stats`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    let totalKeys = 0;
    let memoryUsage = 'unknown';

    if (this.redis) {
      try {
        totalKeys = await this.redis.dbsize();
        const info = await this.redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';
      } catch (error) {
        log.warn('Failed to get Redis stats', { error });
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalKeys,
      memoryUsage
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Build cache key with optional prefix
   */
  private buildKey(key: string, prefix?: string): string {
    const basePrefix = process.env.CACHE_PREFIX || 'desicargo';
    const fullPrefix = prefix ? `${basePrefix}:${prefix}` : basePrefix;
    return `${fullPrefix}:${key}`;
  }

  /**
   * Get TTL for data type
   */
  getTTL(dataType: keyof typeof CacheService.prototype.DEFAULT_TTL): number {
    return this.DEFAULT_TTL[dataType];
  }
}

export default new CacheService();