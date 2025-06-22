// Cache configuration
const CACHE_PREFIX = 'ftl_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Set item in cache
export function setCacheItem<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  const item: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    ttl
  };
  localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
}

// Get item from cache
export function getCacheItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;

    const { data, timestamp, ttl }: CacheItem<T> = JSON.parse(item);
    
    // Check if cache is expired
    if (Date.now() - timestamp > ttl) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Cache retrieval failed:', err);
    return null;
  }
}

// Clear cache for a specific key
export function clearCacheItem(key: string): void {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

// Clear all cache
export function clearCache(): void {
  Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}

// Clear expired cache items
export function clearExpiredCache(): void {
  const now = Date.now();
  Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_PREFIX))
    .forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        const { timestamp, ttl }: CacheItem<any> = JSON.parse(item);
        if (now - timestamp > ttl) {
          localStorage.removeItem(key);
        }
      } catch (err) {
        console.error('Error clearing expired cache:', err);
      }
    });
}