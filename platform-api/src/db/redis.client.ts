import { Redis } from "ioredis";
import type { Redis as RedisClient } from "ioredis";

/**
 * Redis client configuration
 */
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryStrategy: (times: number) => number | void;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
}

/**
 * Default Redis configuration
 */
const getRedisConfig = (): RedisConfig => ({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || "clubmanager:",
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

/**
 * Redis Client Singleton
 * Provides centralized Redis connection management with:
 * - Automatic reconnection
 * - Health checks
 * - Graceful shutdown
 * - Connection pooling
 */
class RedisClientSingleton {
  private static instance: RedisClient | null = null;
  private static isConnected = false;
  private static connectionPromise: Promise<void> | null = null;

  /**
   * Get or create Redis client instance
   */
  static getInstance(): RedisClient {
    if (!RedisClientSingleton.instance) {
      const config = getRedisConfig();
      const client = new Redis(config);

      // Connection event handlers
      client.on("connect", () => {
        console.log("🔄 Redis client connecting...");
      });

      client.on("ready", () => {
        RedisClientSingleton.isConnected = true;
        console.log("✅ Redis client connected and ready");
      });

      client.on("error", (error: Error) => {
        console.error("❌ Redis client error:", error.message);
        RedisClientSingleton.isConnected = false;
      });

      client.on("close", () => {
        console.log("🔌 Redis connection closed");
        RedisClientSingleton.isConnected = false;
      });

      client.on("reconnecting", (delay: number) => {
        console.log(`🔄 Redis reconnecting in ${delay}ms...`);
      });

      client.on("end", () => {
        console.log("🛑 Redis connection ended");
        RedisClientSingleton.isConnected = false;
      });

      RedisClientSingleton.instance = client;

      // Handle graceful shutdown
      process.on("SIGTERM", async () => {
        await RedisClientSingleton.disconnect();
      });

      process.on("SIGINT", async () => {
        await RedisClientSingleton.disconnect();
      });

      process.on("beforeExit", async () => {
        await RedisClientSingleton.disconnect();
      });
    }

    return RedisClientSingleton.instance!;
  }

  /**
   * Wait for Redis connection to be ready
   */
  static async waitForConnection(timeoutMs = 5000): Promise<void> {
    if (RedisClientSingleton.isConnected) {
      return;
    }

    if (RedisClientSingleton.connectionPromise) {
      return RedisClientSingleton.connectionPromise;
    }

    RedisClientSingleton.connectionPromise = new Promise((resolve, reject) => {
      const client = RedisClientSingleton.getInstance();
      const timeout = setTimeout(() => {
        reject(new Error(`Redis connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      if (client.status === "ready") {
        clearTimeout(timeout);
        RedisClientSingleton.connectionPromise = null;
        resolve();
      } else {
        client.once("ready", () => {
          clearTimeout(timeout);
          RedisClientSingleton.connectionPromise = null;
          resolve();
        });

        client.once("error", (error: Error) => {
          clearTimeout(timeout);
          RedisClientSingleton.connectionPromise = null;
          reject(error);
        });
      }
    });

    return RedisClientSingleton.connectionPromise;
  }

  /**
   * Check if Redis is connected
   */
  static isReady(): boolean {
    return (
      RedisClientSingleton.isConnected &&
      RedisClientSingleton.instance?.status === "ready"
    );
  }

  /**
   * Disconnect Redis client
   */
  static async disconnect(): Promise<void> {
    if (RedisClientSingleton.instance) {
      try {
        await RedisClientSingleton.instance.quit();
        console.log("✅ Redis client disconnected gracefully");
      } catch (error) {
        console.error("❌ Error disconnecting Redis:", error);
        // Force disconnect if graceful shutdown fails
        RedisClientSingleton.instance.disconnect();
      } finally {
        RedisClientSingleton.instance = null;
        RedisClientSingleton.isConnected = false;
        RedisClientSingleton.connectionPromise = null;
      }
    }
  }

  /**
   * Health check for Redis connection
   */
  static async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    latency?: number;
    error?: string;
  }> {
    try {
      if (!RedisClientSingleton.isReady()) {
        return {
          status: "unhealthy",
          error: "Redis client not ready",
        };
      }

      const client = RedisClientSingleton.getInstance();
      const start = Date.now();
      await client.ping();
      const latency = Date.now() - start;

      return {
        status: "healthy",
        latency,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get Redis info
   */
  static async getInfo(): Promise<{
    connected: boolean;
    host: string;
    port: number;
    db: number;
    keyPrefix: string;
    status?: string;
  }> {
    const config = getRedisConfig();
    const client = RedisClientSingleton.instance;

    return {
      connected: RedisClientSingleton.isConnected,
      host: config.host,
      port: config.port,
      db: config.db,
      keyPrefix: config.keyPrefix,
      status: client?.status,
    };
  }

  /**
   * Clear all keys with the app prefix (use with caution!)
   */
  static async clearAllKeys(): Promise<number> {
    const client = RedisClientSingleton.getInstance();
    const config = getRedisConfig();
    const pattern = `${config.keyPrefix}*`;

    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        // Remove prefix before deleting since Redis client adds it automatically
        const keysWithoutPrefix = keys.map((key: string) =>
          key.startsWith(config.keyPrefix)
            ? key.slice(config.keyPrefix.length)
            : key,
        );
        const deleted = await client.del(...keysWithoutPrefix);
        deletedCount += deleted;
      }
    } while (cursor !== "0");

    console.log(
      `🗑️  Deleted ${deletedCount} keys matching pattern: ${pattern}`,
    );
    return deletedCount;
  }
}

// Export singleton instance
export const redis = RedisClientSingleton.getInstance();

// Export utility functions
export const waitForRedis = (timeout?: number) =>
  RedisClientSingleton.waitForConnection(timeout);

export const disconnectRedis = () => RedisClientSingleton.disconnect();

export const redisHealthCheck = () => RedisClientSingleton.healthCheck();

export const redisInfo = () => RedisClientSingleton.getInfo();

export const isRedisReady = () => RedisClientSingleton.isReady();

export const clearRedisCache = () => RedisClientSingleton.clearAllKeys();
