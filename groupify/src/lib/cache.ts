/**
 * Simple in-memory cache with TTL (Time To Live) support
 * This helps reduce database load for frequently accessed data
 */

class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set data in cache with optional TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds (optional, default is 300s)
   */
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expires });
  }

  /**
   * Delete entry from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('Cache cleared completely');
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      keys: Array.from(this.cache.keys()),
      size: this.cache.size,
    };
  }
}

// Create a singleton cache instance
export const cache = new SimpleCache();

// Set up periodic cleanup (every 10 minutes)
if (typeof window === 'undefined') {
  // Only run cleanup on server-side
  setInterval(
    () => {
      cache.cleanup();
    },
    10 * 60 * 1000
  );
}

/**
 * Cache decorator for API responses
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @param fetchFn Function to fetch fresh data if cache miss
 * @returns Cached data or fresh data
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss, fetch fresh data
  const data = await fetchFn();
  cache.set(key, data, ttl);

  return data;
}
