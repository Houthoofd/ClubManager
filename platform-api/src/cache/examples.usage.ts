/**
 * Cache Usage Examples
 * Demonstrates how to use the various cache services in your application
 */

import { cacheService } from "./cache.service.js";
import { tenantCacheService } from "./tenant-cache.service.js";
import { userCacheService } from "./user-cache.service.js";
import { rateLimiterService } from "./rate-limiter.service.js";
import {
  TenantCacheKeys,
  UserCacheKeys,
  ApiCacheKeys,
  generateCacheKey,
} from "./cache-keys.js";
import { CacheTTL } from "./cache.config.js";

/**
 * EXAMPLE 1: Basic Cache Operations
 */
export async function basicCacheExample() {
  // Simple set/get
  await cacheService.set("user:123:profile", {
    name: "John Doe",
    email: "john@example.com",
  });
  const profile = await cacheService.get("user:123:profile");
  console.log("Profile:", profile);

  // Set with TTL
  await cacheService.set(
    "session:abc",
    { userId: "123", valid: true },
    { ttl: 300 },
  );

  // Check if key exists
  const exists = await cacheService.exists("session:abc");
  console.log("Session exists:", exists);

  // Delete a key
  await cacheService.delete("session:abc");
}

/**
 * EXAMPLE 2: Cache-Aside Pattern (Lazy Loading)
 */
export async function cacheAsideExample(userId: string) {
  // Get from cache or load from database
  const user = await cacheService.getOrSet(
    UserCacheKeys.profile(userId),
    async () => {
      // This function is only called if cache misses
      console.log("Cache miss - loading from database...");
      // Simulate database call
      return {
        id: userId,
        name: "John Doe",
        email: "john@example.com",
        role: "MEMBER",
      };
    },
    { ttl: CacheTTL.USER_PROFILE },
  );

  return user;
}

/**
 * EXAMPLE 3: Tenant Caching
 */
export async function tenantCacheExample(tenantId: string) {
  // Cache tenant configuration
  const tenantConfig = {
    id: tenantId,
    name: "Acme Club",
    slug: "acme",
    status: "ACTIVE",
    settings: {
      theme: "dark",
      language: "fr",
    },
  };

  await tenantCacheService.setTenant(tenantConfig);

  // Retrieve tenant from cache
  const cached = await tenantCacheService.getTenant(tenantId);
  console.log("Cached tenant:", cached);

  // Get by slug
  const bySlug = await tenantCacheService.getTenantBySlug("acme");
  console.log("Tenant by slug:", bySlug);

  // Increment API call counter
  const apiCalls = await tenantCacheService.incrementApiCalls(tenantId);
  console.log("API calls count:", apiCalls);

  // Check if limit reached
  const limitReached = await tenantCacheService.hasReachedApiLimit(
    tenantId,
    1000,
  );
  console.log("Limit reached:", limitReached);

  // Invalidate all tenant cache
  await tenantCacheService.invalidateTenant(tenantId);
}

/**
 * EXAMPLE 4: User Caching with Permissions
 */
export async function userCacheExample(userId: string, tenantId: string) {
  // Cache user profile
  const userProfile = {
    id: userId,
    email: "john@example.com",
    nom: "Doe",
    prenom: "John",
    role: "ADMIN",
    tenantId,
  };

  await userCacheService.setUserProfile(userProfile);

  // Cache user permissions
  const permissions = {
    userId,
    tenantId,
    role: "ADMIN",
    permissions: ["users.read", "users.write", "courses.manage"],
    scopes: ["*"],
    features: ["advanced-analytics", "bulk-import"],
  };

  await userCacheService.setUserPermissions(permissions);

  // Check specific permission
  const canManageUsers = await userCacheService.hasPermission(
    userId,
    "users.write",
    tenantId,
  );
  console.log("Can manage users:", canManageUsers);

  // Cache user session
  const session = {
    sessionId: "session-123",
    userId,
    tenantId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
  };

  await userCacheService.setUserSession(session);

  // Track active sessions
  await userCacheService.addActiveSession(userId, session.sessionId);

  // Set user as online
  await userCacheService.setUserOnline(userId, 300); // 5 minutes

  // Add to online users for tenant
  await userCacheService.addToOnlineUsers(tenantId, userId);

  // Get all online users
  const onlineUsers = await userCacheService.getOnlineUsers(tenantId);
  console.log("Online users:", onlineUsers.length);
}

/**
 * EXAMPLE 5: Rate Limiting
 */
export async function rateLimitExample(
  ip: string,
  tenantId: string,
  userId: string,
) {
  // Check IP rate limit
  const ipLimit = await rateLimiterService.checkIpRateLimit(ip, "/api/users");
  console.log("IP rate limit:", ipLimit);

  if (!ipLimit.allowed) {
    console.log(
      `Rate limit exceeded. Retry after ${ipLimit.retryAfter} seconds`,
    );
    return;
  }

  // Check tenant rate limit
  const tenantLimit = await rateLimiterService.checkTenantRateLimit(
    tenantId,
    "/api/courses",
  );
  console.log("Tenant rate limit:", tenantLimit);

  // Check user rate limit
  const userLimit = await rateLimiterService.checkUserRateLimit(userId);
  console.log("User rate limit:", userLimit);

  // Check auth rate limit (stricter)
  const authLimit = await rateLimiterService.checkAuthRateLimit(ip);
  console.log("Auth rate limit:", authLimit);

  // Whitelist an IP
  await rateLimiterService.addToWhitelist("ip", "192.168.1.100", 86400);

  // Blacklist a user temporarily
  await rateLimiterService.addToBlacklist("user", "malicious-user-id", 3600);
}

/**
 * EXAMPLE 6: Distributed Locking
 */
export async function distributedLockExample(resourceId: string) {
  const lockKey = `lock:resource:${resourceId}`;

  // Acquire lock (30 seconds TTL, 3 retries)
  const lockValue = await cacheService.acquireLock(lockKey, 30, 3);

  if (!lockValue) {
    console.log("Failed to acquire lock - resource is busy");
    return;
  }

  try {
    console.log("Lock acquired, performing critical operation...");

    // Perform critical operation here
    await performCriticalOperation(resourceId);

    console.log("Operation completed successfully");
  } finally {
    // Always release the lock
    const released = await cacheService.releaseLock(lockKey, lockValue);
    console.log("Lock released:", released);
  }
}

/**
 * EXAMPLE 7: Cache Invalidation Patterns
 */
export async function cacheInvalidationExample(
  tenantId: string,
  userId: string,
) {
  // Invalidate specific key
  await cacheService.delete(UserCacheKeys.profile(userId));

  // Invalidate all user keys
  await userCacheService.invalidateUser(userId);

  // Invalidate all tenant keys
  await tenantCacheService.invalidateTenant(tenantId);

  // Invalidate by pattern
  const deletedCount = await cacheService.deletePattern(`tenant:${tenantId}:*`);
  console.log(`Deleted ${deletedCount} keys`);

  // Invalidate API cache for specific endpoint
  const pattern = ApiCacheKeys.pattern("/api/users");
  await cacheService.deletePattern(pattern);
}

/**
 * EXAMPLE 8: Batch Operations
 */
export async function batchOperationsExample() {
  // Set multiple keys at once
  await cacheService.mset([
    { key: "user:1:name", value: "Alice", ttl: 3600 },
    { key: "user:2:name", value: "Bob", ttl: 3600 },
    { key: "user:3:name", value: "Charlie", ttl: 3600 },
  ]);

  // Get multiple keys at once
  const users = await cacheService.mget<string>([
    "user:1:name",
    "user:2:name",
    "user:3:name",
  ]);
  console.log("Users:", users);

  // Cache multiple user profiles
  const profiles = [
    {
      id: "1",
      email: "alice@example.com",
      nom: "Alice",
      prenom: "A",
      role: "MEMBER",
      tenantId: "tenant1",
    },
    {
      id: "2",
      email: "bob@example.com",
      nom: "Bob",
      prenom: "B",
      role: "MEMBER",
      tenantId: "tenant1",
    },
  ];

  await userCacheService.cacheMultipleProfiles(profiles);
}

/**
 * EXAMPLE 9: Sets and Sorted Sets
 */
export async function setsExample(tenantId: string) {
  const key = `tenant:${tenantId}:features`;

  // Add items to set
  await cacheService.addToSet(key, "feature-1", "feature-2", "feature-3");

  // Check if item exists in set
  const hasFeature = await cacheService.isInSet(key, "feature-1");
  console.log("Has feature-1:", hasFeature);

  // Get all members
  const features = await cacheService.getSetMembers(key);
  console.log("All features:", features);

  // Remove from set
  await cacheService.removeFromSet(key, "feature-2");

  // Sorted set example (for leaderboards, rankings, etc.)
  const leaderboardKey = `leaderboard:${tenantId}`;
  await cacheService.addToSortedSet(leaderboardKey, 100, "user:1");
  await cacheService.addToSortedSet(leaderboardKey, 200, "user:2");
  await cacheService.addToSortedSet(leaderboardKey, 150, "user:3");

  // Get top users (score 0 to 200)
  const topUsers = await cacheService.getSortedSetByScore(
    leaderboardKey,
    0,
    200,
  );
  console.log("Top users:", topUsers);
}

/**
 * EXAMPLE 10: Cache Statistics and Monitoring
 */
export async function cacheStatsExample() {
  // Get cache statistics
  const stats = cacheService.getStats();
  console.log("Cache Stats:", {
    hits: stats.hits,
    misses: stats.misses,
    sets: stats.sets,
    deletes: stats.deletes,
    errors: stats.errors,
  });

  // Get hit rate
  const hitRate = cacheService.getHitRate();
  console.log(`Cache hit rate: ${(hitRate * 100).toFixed(2)}%`);

  // Reset stats (useful for monitoring intervals)
  cacheService.resetStats();
}

/**
 * EXAMPLE 11: Cache Warm-up on Application Start
 */
export async function warmUpCacheExample() {
  console.log("Warming up cache...");

  // Load active tenants
  const tenants = [
    { id: "tenant1", name: "Tenant 1", slug: "tenant1", status: "ACTIVE" },
    { id: "tenant2", name: "Tenant 2", slug: "tenant2", status: "ACTIVE" },
  ];

  for (const tenant of tenants) {
    await tenantCacheService.setTenant(tenant as any);
    await tenantCacheService.addToActiveTenants(tenant.id);
  }

  console.log(`Warmed up ${tenants.length} tenants`);
}

/**
 * EXAMPLE 12: Session Management
 */
export async function sessionManagementExample(userId: string) {
  // Store session token
  await userCacheService.storeUserToken(
    userId,
    "access",
    "jwt-token-here",
    3600,
  );

  // Get session token
  const token = await userCacheService.getUserToken(userId, "access");
  console.log("Token:", token);

  // Verify token
  const isValid = await userCacheService.verifyUserToken(
    userId,
    "access",
    "jwt-token-here",
  );
  console.log("Token is valid:", isValid);

  // Store refresh token
  await userCacheService.storeUserToken(
    userId,
    "refresh",
    "refresh-token-here",
    604800, // 7 days
  );

  // Clear all user sessions
  await userCacheService.clearAllUserSessions(userId);
}

/**
 * Helper function to simulate critical operation
 */
async function performCriticalOperation(resourceId: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Processing resource ${resourceId}...`);
      resolve();
    }, 1000);
  });
}

/**
 * EXAMPLE 13: Real-world Service Integration
 */
export class CourseService {
  /**
   * Get course with caching
   */
  async getCourse(courseId: string, tenantId: string) {
    const cacheKey = `tenant:${tenantId}:course:${courseId}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Simulate database query
        console.log("Loading course from database...");
        return {
          id: courseId,
          tenantId,
          title: "Advanced TypeScript",
          description: "Learn TypeScript",
          price: 99.99,
        };
      },
      { ttl: CacheTTL.STATIC_DATA },
    );
  }

  /**
   * Update course and invalidate cache
   */
  async updateCourse(courseId: string, tenantId: string, data: any) {
    // Update in database
    console.log("Updating course in database...");

    // Invalidate cache
    const cacheKey = `tenant:${tenantId}:course:${courseId}`;
    await cacheService.delete(cacheKey);

    // Also invalidate list cache
    await cacheService.deletePattern(`tenant:${tenantId}:courses:list*`);

    return { success: true };
  }

  /**
   * Get courses list with pagination and caching
   */
  async getCoursesList(tenantId: string, page: number = 1, limit: number = 10) {
    const cacheKey = `tenant:${tenantId}:courses:list:${page}:${limit}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log("Loading courses from database...");
        return {
          courses: [],
          total: 0,
          page,
          limit,
        };
      },
      { ttl: CacheTTL.API_RESPONSE },
    );
  }
}

/**
 * EXAMPLE 14: Middleware Usage in Routes
 */
export function routeExamples() {
  // Example of how to use cache middleware in Express routes
  /*
  import { Router } from 'express';
  import { rateLimitByTenant, responseCache } from '../middleware/cache/index.js';

  const router = Router();

  // Route with response caching
  router.get('/courses',
    responseCache({ ttl: 300, varyByTenant: true }),
    async (req, res) => {
      // Your handler
    }
  );

  // Route with rate limiting
  router.post('/courses',
    rateLimitByTenant({ max: 100, windowSeconds: 60 }),
    async (req, res) => {
      // Your handler
    }
  );

  // Auth route with strict rate limiting
  router.post('/auth/login',
    authRateLimit(),
    async (req, res) => {
      // Your handler
    }
  );
  */
}
