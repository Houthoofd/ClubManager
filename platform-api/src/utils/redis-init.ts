/**
 * Redis Initialization Utility
 * Handles Redis connection startup and health checks
 */

import { redis, waitForRedis, redisHealthCheck, redisInfo } from '../db/redis.client.js';
import { tenantCacheService } from '../cache/tenant-cache.service.js';
import { isRedisReady } from '../cache/index.js';

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<boolean> {
  console.log('🔄 Initializing Redis connection...');

  try {
    // Wait for Redis to be ready (with timeout)
    await waitForRedis(5000);

    // Perform health check
    const health = await redisHealthCheck();
    if (health.status !== 'healthy') {
      console.error('❌ Redis health check failed:', health.error);
      return false;
    }

    // Get Redis info
    const info = await redisInfo();
    console.log('✅ Redis connected successfully');
    console.log(`   Host: ${info.host}:${info.port}`);
    console.log(`   Database: ${info.db}`);
    console.log(`   Key Prefix: ${info.keyPrefix}`);
    console.log(`   Status: ${info.status}`);
    console.log(`   Latency: ${health.latency}ms`);

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    return false;
  }
}

/**
 * Check Redis connection status
 */
export async function checkRedisConnection(): Promise<boolean> {
  if (!isRedisReady()) {
    return false;
  }

  const health = await redisHealthCheck();
  return health.status === 'healthy';
}

/**
 * Warm up cache with essential data
 * Should be called after Redis initialization
 */
export async function warmUpCache(): Promise<void> {
  console.log('🔥 Warming up cache...');

  try {
    // Here you can preload frequently accessed data
    // For example: active tenants, system settings, etc.

    // Example: Load active tenants (commented out - implement as needed)
    /*
    const activeTenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      take: 100,
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
      },
    });

    for (const tenant of activeTenants) {
      await tenantCacheService.setTenant(tenant as any);
      await tenantCacheService.addToActiveTenants(tenant.id);
    }

    console.log(`✅ Cached ${activeTenants.length} active tenants`);
    */

    console.log('✅ Cache warm-up completed');
  } catch (error) {
    console.error('⚠️  Cache warm-up failed (non-critical):', error);
    // Don't throw - cache warm-up failure should not prevent app startup
  }
}

/**
 * Test Redis functionality
 */
export async function testRedisOperations(): Promise<boolean> {
  console.log('🧪 Testing Redis operations...');

  try {
    const testKey = 'test:redis:init';
    const testValue = { timestamp: Date.now(), test: true };

    // Test SET
    await redis.setex(testKey, 10, JSON.stringify(testValue));

    // Test GET
    const retrieved = await redis.get(testKey);
    if (!retrieved) {
      throw new Error('Failed to retrieve test value');
    }

    const parsed = JSON.parse(retrieved);
    if (parsed.timestamp !== testValue.timestamp) {
      throw new Error('Retrieved value does not match');
    }

    // Test DELETE
    await redis.del(testKey);

    // Test key doesn't exist anymore
    const deleted = await redis.get(testKey);
    if (deleted !== null) {
      throw new Error('Failed to delete test key');
    }

    console.log('✅ Redis operations test passed');
    return true;
  } catch (error) {
    console.error('❌ Redis operations test failed:', error);
    return false;
  }
}

/**
 * Full Redis initialization with tests
 */
export async function initializeRedisWithTests(): Promise<boolean> {
  // Initialize connection
  const connected = await initializeRedis();
  if (!connected) {
    console.warn('⚠️  Redis not available - running without cache');
    return false;
  }

  // Test operations
  const tested = await testRedisOperations();
  if (!tested) {
    console.warn('⚠️  Redis operations test failed - cache may not work correctly');
    return false;
  }

  // Warm up cache
  await warmUpCache();

  return true;
}

/**
 * Handle Redis graceful shutdown
 */
export async function shutdownRedis(): Promise<void> {
  console.log('🛑 Shutting down Redis connection...');
  try {
    const { disconnectRedis } = await import('../db/redis.client.js');
    await disconnectRedis();
    console.log('✅ Redis disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error);
  }
}

/**
 * Setup Redis shutdown handlers
 */
export function setupRedisShutdownHandlers(): void {
  // Handle SIGTERM (Docker/Kubernetes shutdown)
  process.on('SIGTERM', async () => {
    console.log('📥 SIGTERM received');
    await shutdownRedis();
    process.exit(0);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('📥 SIGINT received');
    await shutdownRedis();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught exception:', error);
    await shutdownRedis();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    await shutdownRedis();
    process.exit(1);
  });
}
