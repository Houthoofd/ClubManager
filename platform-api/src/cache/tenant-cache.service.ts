/**
 * Tenant Cache Service
 * Handles tenant-specific caching operations
 */

import { cacheService } from "./cache.service.js";
import { TenantCacheKeys } from "./cache-keys.js";
import { CacheTTL } from "./cache.config.js";

/**
 * Tenant configuration cache interface
 */
interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings?: Record<string, any>;
  features?: string[];
  limits?: {
    maxUsers?: number;
    maxStorage?: number;
    maxApiCalls?: number;
  };
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: Date;
  };
}

/**
 * Tenant limits interface
 */
interface TenantLimits {
  maxUsers: number;
  maxStorage: number;
  maxApiCalls: number;
  currentUsers: number;
  currentStorage: number;
  currentApiCalls: number;
}

/**
 * Tenant Cache Service
 */
export class TenantCacheService {
  /**
   * Get tenant data from cache
   */
  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    const key = TenantCacheKeys.data(tenantId);
    return await cacheService.get<TenantConfig>(key);
  }

  /**
   * Get tenant by slug from cache
   */
  async getTenantBySlug(slug: string): Promise<TenantConfig | null> {
    const key = `tenant:slug:${slug}`;
    return await cacheService.get<TenantConfig>(key);
  }

  /**
   * Set tenant data in cache
   */
  async setTenant(tenant: TenantConfig): Promise<boolean> {
    const key = TenantCacheKeys.data(tenant.id);
    const slugKey = `tenant:slug:${tenant.slug}`;

    // Cache by ID
    const result1 = await cacheService.set(key, tenant, {
      ttl: CacheTTL.TENANT_CONFIG,
    });

    // Cache by slug for quick lookup
    const result2 = await cacheService.set(slugKey, tenant, {
      ttl: CacheTTL.TENANT_CONFIG,
    });

    return result1 && result2;
  }

  /**
   * Get or set tenant (cache-aside pattern)
   */
  async getOrSetTenant(
    tenantId: string,
    factory: () => Promise<TenantConfig>,
  ): Promise<TenantConfig> {
    const key = TenantCacheKeys.data(tenantId);
    return await cacheService.getOrSet(key, factory, {
      ttl: CacheTTL.TENANT_CONFIG,
    });
  }

  /**
   * Delete tenant from cache
   */
  async deleteTenant(tenantId: string, slug?: string): Promise<boolean> {
    const key = TenantCacheKeys.data(tenantId);
    const result1 = await cacheService.delete(key);

    if (slug) {
      const slugKey = `tenant:slug:${slug}`;
      await cacheService.delete(slugKey);
    }

    return result1;
  }

  /**
   * Invalidate all tenant cache
   */
  async invalidateTenant(tenantId: string): Promise<number> {
    const pattern = TenantCacheKeys.pattern(tenantId);
    return await cacheService.deletePattern(pattern);
  }

  /**
   * Get tenant configuration
   */
  async getTenantConfig(tenantId: string): Promise<Record<string, any> | null> {
    const key = TenantCacheKeys.config(tenantId);
    return await cacheService.get<Record<string, any>>(key);
  }

  /**
   * Set tenant configuration
   */
  async setTenantConfig(
    tenantId: string,
    config: Record<string, any>,
  ): Promise<boolean> {
    const key = TenantCacheKeys.config(tenantId);
    return await cacheService.set(key, config, {
      ttl: CacheTTL.TENANT_SETTINGS,
    });
  }

  /**
   * Get specific tenant setting
   */
  async getTenantSetting(
    tenantId: string,
    settingKey: string,
  ): Promise<any | null> {
    const key = TenantCacheKeys.settings(tenantId, settingKey);
    return await cacheService.get(key);
  }

  /**
   * Set specific tenant setting
   */
  async setTenantSetting(
    tenantId: string,
    settingKey: string,
    value: any,
  ): Promise<boolean> {
    const key = TenantCacheKeys.settings(tenantId, settingKey);
    return await cacheService.set(key, value, {
      ttl: CacheTTL.TENANT_SETTINGS,
    });
  }

  /**
   * Get tenant limits
   */
  async getTenantLimits(tenantId: string): Promise<TenantLimits | null> {
    const key = TenantCacheKeys.limits(tenantId);
    return await cacheService.get<TenantLimits>(key);
  }

  /**
   * Set tenant limits
   */
  async setTenantLimits(
    tenantId: string,
    limits: TenantLimits,
  ): Promise<boolean> {
    const key = TenantCacheKeys.limits(tenantId);
    return await cacheService.set(key, limits, {
      ttl: CacheTTL.TENANT_SETTINGS,
    });
  }

  /**
   * Increment tenant API call counter
   */
  async incrementApiCalls(tenantId: string): Promise<number> {
    const key = `${TenantCacheKeys.limits(tenantId)}:api_calls`;
    const count = await cacheService.increment(key);

    // Set expiration to end of hour if first call
    if (count === 1) {
      const now = new Date();
      const endOfHour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours() + 1,
        0,
        0,
        0,
      );
      const secondsUntilEndOfHour = Math.floor(
        (endOfHour.getTime() - now.getTime()) / 1000,
      );
      await cacheService.expire(key, secondsUntilEndOfHour);
    }

    return count;
  }

  /**
   * Get current API call count for tenant
   */
  async getApiCallCount(tenantId: string): Promise<number> {
    const key = `${TenantCacheKeys.limits(tenantId)}:api_calls`;
    const value = await cacheService.get<string>(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Check if tenant has reached API limit
   */
  async hasReachedApiLimit(
    tenantId: string,
    maxCalls: number,
  ): Promise<boolean> {
    const currentCalls = await this.getApiCallCount(tenantId);
    return currentCalls >= maxCalls;
  }

  /**
   * Get tenant subscription from cache
   */
  async getTenantSubscription(tenantId: string): Promise<any | null> {
    const key = TenantCacheKeys.subscription(tenantId);
    return await cacheService.get(key);
  }

  /**
   * Set tenant subscription in cache
   */
  async setTenantSubscription(
    tenantId: string,
    subscription: any,
  ): Promise<boolean> {
    const key = TenantCacheKeys.subscription(tenantId);
    return await cacheService.set(key, subscription, {
      ttl: CacheTTL.TENANT_SETTINGS,
    });
  }

  /**
   * Get tenant features from cache
   */
  async getTenantFeatures(tenantId: string): Promise<string[] | null> {
    const key = TenantCacheKeys.features(tenantId);
    return await cacheService.get<string[]>(key);
  }

  /**
   * Set tenant features in cache
   */
  async setTenantFeatures(
    tenantId: string,
    features: string[],
  ): Promise<boolean> {
    const key = TenantCacheKeys.features(tenantId);
    return await cacheService.set(key, features, {
      ttl: CacheTTL.FEATURE_FLAGS,
    });
  }

  /**
   * Check if tenant has specific feature enabled
   */
  async hasTenantFeature(tenantId: string, feature: string): Promise<boolean> {
    const features = await this.getTenantFeatures(tenantId);
    return features ? features.includes(feature) : false;
  }

  /**
   * Get tenant users count
   */
  async getTenantUsersCount(tenantId: string): Promise<number | null> {
    const key = `${TenantCacheKeys.users(tenantId)}:count`;
    const value = await cacheService.get<string>(key);
    return value ? parseInt(value, 10) : null;
  }

  /**
   * Set tenant users count
   */
  async setTenantUsersCount(tenantId: string, count: number): Promise<boolean> {
    const key = `${TenantCacheKeys.users(tenantId)}:count`;
    return await cacheService.set(key, count.toString(), {
      ttl: CacheTTL.TENANT_SETTINGS,
    });
  }

  /**
   * Increment tenant users count
   */
  async incrementTenantUsersCount(tenantId: string): Promise<number> {
    const key = `${TenantCacheKeys.users(tenantId)}:count`;
    return await cacheService.increment(key);
  }

  /**
   * Decrement tenant users count
   */
  async decrementTenantUsersCount(tenantId: string): Promise<number> {
    const key = `${TenantCacheKeys.users(tenantId)}:count`;
    return await cacheService.decrement(key);
  }

  /**
   * Store tenant in active tenants set
   */
  async addToActiveTenants(tenantId: string): Promise<number> {
    return await cacheService.addToSet("tenants:active", tenantId);
  }

  /**
   * Remove tenant from active tenants set
   */
  async removeFromActiveTenants(tenantId: string): Promise<number> {
    return await cacheService.removeFromSet("tenants:active", tenantId);
  }

  /**
   * Get all active tenant IDs
   */
  async getActiveTenants(): Promise<string[]> {
    return await cacheService.getSetMembers("tenants:active");
  }

  /**
   * Check if tenant is active
   */
  async isTenantActive(tenantId: string): Promise<boolean> {
    return await cacheService.isInSet("tenants:active", tenantId);
  }

  /**
   * Warm up cache for tenant (preload common data)
   */
  async warmUpTenantCache(
    tenantId: string,
    tenantData: TenantConfig,
    features?: string[],
    limits?: TenantLimits,
  ): Promise<void> {
    const promises: Promise<any>[] = [
      this.setTenant(tenantData),
      this.addToActiveTenants(tenantId),
    ];

    if (features) {
      promises.push(this.setTenantFeatures(tenantId, features));
    }

    if (limits) {
      promises.push(this.setTenantLimits(tenantId, limits));
    }

    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const tenantCacheService = new TenantCacheService();
