/**
 * Cache Service
 * Base cache service providing common caching operations
 * with Redis backend and graceful fallback
 */

import { redis } from "../db/redis.client.js";
import {
  CacheTTL,
  CacheOptions,
  defaultCacheOptions,
  CacheErrorHandling,
} from "./cache.config.js";
import { generateCacheKey } from "./cache-keys.js";

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

/**
 * Cache entry metadata
 */
interface CacheMetadata {
  key: string;
  ttl?: number;
  createdAt: number;
  expiresAt?: number;
}

/**
 * Base Cache Service
 */
export class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return this.deserialize<T>(value);
    } catch (error) {
      this.handleError("get", error, key);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = defaultCacheOptions,
  ): Promise<boolean> {
    try {
      const serialized = this.serialize(value);
      const ttl = options.ttl || CacheTTL.API_RESPONSE;

      if (ttl > 0) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.handleError("set", error, key);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.handleError("delete", error, key);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      let cursor = "0";
      let deletedCount = 0;

      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          const deleted = await redis.del(...keys);
          deletedCount += deleted;
        }
      } while (cursor !== "0");

      this.stats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      this.handleError("deletePattern", error, pattern);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result > 0;
    } catch (error) {
      this.handleError("exists", error, key);
      return false;
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    try {
      const values = await redis.mget(...keys);

      return values.map((value: string | null) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        this.stats.hits++;
        return this.deserialize<T>(value);
      });
    } catch (error) {
      this.handleError("mget", error, keys.join(","));
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(
    items: Array<{ key: string; value: any; ttl?: number }>,
  ): Promise<boolean> {
    if (items.length === 0) return true;

    try {
      const pipeline = redis.pipeline();

      for (const item of items) {
        const serialized = this.serialize(item.value);
        const ttl = item.ttl || CacheTTL.API_RESPONSE;

        if (ttl > 0) {
          pipeline.setex(item.key, ttl, serialized);
        } else {
          pipeline.set(item.key, serialized);
        }
      }

      await pipeline.exec();
      this.stats.sets += items.length;
      return true;
    } catch (error) {
      this.handleError("mset", error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = defaultCacheOptions,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - generate value
    const value = await factory();

    // Store in cache (fire and forget)
    this.set(key, value, options).catch((error) => {
      this.handleError("getOrSet:set", error, key);
    });

    return value;
  }

  /**
   * Get TTL (time to live) for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      const ttl = await redis.ttl(key);
      return ttl;
    } catch (error) {
      this.handleError("getTTL", error, key);
      return -1;
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.handleError("expire", error, key);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      if (amount === 1) {
        return await redis.incr(key);
      }
      return await redis.incrby(key, amount);
    } catch (error) {
      this.handleError("increment", error, key);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      if (amount === 1) {
        return await redis.decr(key);
      }
      return await redis.decrby(key, amount);
    } catch (error) {
      this.handleError("decrement", error, key);
      return 0;
    }
  }

  /**
   * Add item to set
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.sadd(key, ...members);
    } catch (error) {
      this.handleError("addToSet", error, key);
      return 0;
    }
  }

  /**
   * Remove item from set
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.srem(key, ...members);
    } catch (error) {
      this.handleError("removeFromSet", error, key);
      return 0;
    }
  }

  /**
   * Get all members of set
   */
  async getSetMembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key);
    } catch (error) {
      this.handleError("getSetMembers", error, key);
      return [];
    }
  }

  /**
   * Check if member exists in set
   */
  async isInSet(key: string, member: string): Promise<boolean> {
    try {
      const result = await redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.handleError("isInSet", error, key);
      return false;
    }
  }

  /**
   * Add item to sorted set with score
   */
  async addToSortedSet(
    key: string,
    score: number,
    member: string,
  ): Promise<number> {
    try {
      return await redis.zadd(key, score, member);
    } catch (error) {
      this.handleError("addToSortedSet", error, key);
      return 0;
    }
  }

  /**
   * Get sorted set members by score range
   */
  async getSortedSetByScore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<string[]> {
    try {
      return await redis.zrangebyscore(key, min, max);
    } catch (error) {
      this.handleError("getSortedSetByScore", error, key);
      return [];
    }
  }

  /**
   * Acquire distributed lock
   */
  async acquireLock(
    key: string,
    ttl: number = 30,
    retries: number = 3,
  ): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random()}`;

    for (let i = 0; i < retries; i++) {
      try {
        const result = await redis.set(key, lockValue, "EX", ttl, "NX");
        if (result === "OK") {
          return lockValue;
        }
      } catch (error) {
        this.handleError("acquireLock", error, key);
      }

      // Wait before retry
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
      }
    }

    return null;
  }

  /**
   * Release distributed lock
   */
  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    try {
      // Lua script to ensure we only delete our own lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await redis.eval(script, 1, key, lockValue);
      return result === 1;
    } catch (error) {
      this.handleError("releaseLock", error, key);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  /**
   * Serialize value for storage
   */
  private serialize<T>(value: T): string {
    return JSON.stringify(value);
  }

  /**
   * Deserialize value from storage
   */
  private deserialize<T>(value: string): T {
    return JSON.parse(value) as T;
  }

  /**
   * Handle cache errors
   */
  private handleError(operation: string, error: unknown, key?: string): void {
    this.stats.errors++;

    if (CacheErrorHandling.LOG_ERRORS) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `❌ Cache ${operation} error${key ? ` for key: ${key}` : ""}:`,
        errorMessage,
      );
    }

    if (!CacheErrorHandling.FAIL_SILENTLY) {
      throw error;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
