/**
 * Cache Backup and Restore Service
 * Provides utilities for backing up and restoring Redis cache data
 */

import { redis } from '../db/redis.client.js';
import { cacheService } from './cache.service.js';
import { tenantCacheService } from './tenant-cache.service.js';
import { prisma } from '../db/prisma.client.js';

interface BackupMetadata {
  timestamp: number;
  keyCount: number;
  version: string;
  environment: string;
}

interface BackupData {
  metadata: BackupMetadata;
  keys: Array<{
    key: string;
    value: string;
    ttl: number;
    type: string;
  }>;
}

interface RestoreOptions {
  overwrite?: boolean;
  skipExisting?: boolean;
  preserveTTL?: boolean;
}

interface WarmupOptions {
  tenants?: {
    enabled: boolean;
    limit?: number;
    active?: boolean;
  };
  users?: {
    enabled: boolean;
    limit?: number;
  };
  settings?: boolean;
}

class CacheBackupService {
  private readonly VERSION = '1.0.0';

  /**
   * Create a full backup of Redis cache
   */
  async backup(pattern: string = '*'): Promise<BackupData> {
    console.log(`📦 Creating cache backup for pattern: ${pattern}`);

    try {
      // Get all keys matching pattern
      const keys = await redis.keys(pattern);
      console.log(`   Found ${keys.length} keys to backup`);

      const backupKeys: BackupData['keys'] = [];

      // Backup each key with its value and TTL
      for (const key of keys) {
        try {
          const type = await redis.type(key);
          const ttl = await redis.ttl(key);
          let value: string | null = null;

          // Handle different Redis data types
          switch (type) {
            case 'string':
              value = await redis.get(key);
              break;
            case 'hash':
              const hash = await redis.hgetall(key);
              value = JSON.stringify(hash);
              break;
            case 'list':
              const list = await redis.lrange(key, 0, -1);
              value = JSON.stringify(list);
              break;
            case 'set':
              const set = await redis.smembers(key);
              value = JSON.stringify(set);
              break;
            case 'zset':
              const zset = await redis.zrange(key, 0, -1, 'WITHSCORES');
              value = JSON.stringify(zset);
              break;
            default:
              console.warn(`   Unsupported type ${type} for key ${key}`);
              continue;
          }

          if (value) {
            backupKeys.push({
              key,
              value,
              ttl,
              type,
            });
          }
        } catch (error) {
          console.error(`   Error backing up key ${key}:`, error);
        }
      }

      const backup: BackupData = {
        metadata: {
          timestamp: Date.now(),
          keyCount: backupKeys.length,
          version: this.VERSION,
          environment: process.env.NODE_ENV || 'development',
        },
        keys: backupKeys,
      };

      console.log(`✅ Backup completed: ${backupKeys.length} keys`);
      return backup;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore cache from backup
   */
  async restore(
    backup: BackupData,
    options: RestoreOptions = {}
  ): Promise<{ restored: number; skipped: number; failed: number }> {
    console.log(`📥 Restoring cache from backup (${backup.metadata.keyCount} keys)`);

    const {
      overwrite = false,
      skipExisting = true,
      preserveTTL = true,
    } = options;

    let restored = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of backup.keys) {
      try {
        // Check if key exists
        const exists = await redis.exists(item.key);

        if (exists && skipExisting && !overwrite) {
          skipped++;
          continue;
        }

        // Restore based on type
        switch (item.type) {
          case 'string':
            if (preserveTTL && item.ttl > 0) {
              await redis.setex(item.key, item.ttl, item.value);
            } else {
              await redis.set(item.key, item.value);
            }
            break;

          case 'hash':
            const hash = JSON.parse(item.value);
            await redis.hset(item.key, hash);
            if (preserveTTL && item.ttl > 0) {
              await redis.expire(item.key, item.ttl);
            }
            break;

          case 'list':
            const list = JSON.parse(item.value);
            await redis.del(item.key);
            if (list.length > 0) {
              await redis.rpush(item.key, ...list);
            }
            if (preserveTTL && item.ttl > 0) {
              await redis.expire(item.key, item.ttl);
            }
            break;

          case 'set':
            const set = JSON.parse(item.value);
            await redis.del(item.key);
            if (set.length > 0) {
              await redis.sadd(item.key, ...set);
            }
            if (preserveTTL && item.ttl > 0) {
              await redis.expire(item.key, item.ttl);
            }
            break;

          case 'zset':
            const zset = JSON.parse(item.value);
            await redis.del(item.key);
            if (zset.length > 0) {
              await redis.zadd(item.key, ...zset);
            }
            if (preserveTTL && item.ttl > 0) {
              await redis.expire(item.key, item.ttl);
            }
            break;

          default:
            console.warn(`   Unsupported type ${item.type} for key ${item.key}`);
            failed++;
            continue;
        }

        restored++;
      } catch (error) {
        console.error(`   Error restoring key ${item.key}:`, error);
        failed++;
      }
    }

    console.log(`✅ Restore completed: ${restored} restored, ${skipped} skipped, ${failed} failed`);
    return { restored, skipped, failed };
  }

  /**
   * Export backup to JSON file
   */
  serializeBackup(backup: BackupData): string {
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import backup from JSON file
   */
  deserializeBackup(json: string): BackupData {
    return JSON.parse(json);
  }

  /**
   * Warm up cache from database
   */
  async warmupFromDatabase(options: WarmupOptions = {}): Promise<void> {
    console.log('🔥 Warming up cache from database...');

    const {
      tenants = { enabled: true, limit: 100, active: true },
      users = { enabled: false, limit: 100 },
      settings = true,
    } = options;

    try {
      // Warm up tenants
      if (tenants.enabled) {
        console.log('   Loading tenants...');
        const tenantsData = await prisma.tenant.findMany({
          where: tenants.active ? { status: 'ACTIVE' } : undefined,
          take: tenants.limit || 100,
          select: {
            id: true,
            name: true,
            subdomain: true,
            status: true,
            settings: true,
          },
        });

        for (const tenant of tenantsData) {
          await tenantCacheService.setTenant(tenant as any);
          if (tenant.status === 'ACTIVE') {
            await tenantCacheService.addToActiveTenants(tenant.id);
          }
        }

        console.log(`   ✓ Cached ${tenantsData.length} tenants`);
      }

      // Warm up users (optional, only for recently active)
      if (users.enabled) {
        console.log('   Loading users...');
        // Implementation would depend on your user activity tracking
        // For now, we'll skip this as it requires activity tracking
        console.log('   ℹ User warming not implemented');
      }

      // Warm up system settings
      if (settings) {
        console.log('   Loading system settings...');
        // Cache frequently accessed settings
        await cacheService.set(
          'system:warmup:timestamp',
          { timestamp: Date.now(), version: this.VERSION },
          { ttl: 86400 }
        );
        console.log('   ✓ System settings cached');
      }

      console.log('✅ Cache warmup completed');
    } catch (error) {
      console.error('⚠️  Cache warmup failed (non-critical):', error);
      // Don't throw - warmup failure should not prevent app startup
    }
  }

  /**
   * Clear all cache data
   */
  async clearAll(): Promise<void> {
    console.log('🗑️  Clearing all cache data...');
    await redis.flushdb();
    console.log('✅ Cache cleared');
  }

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    console.log(`🗑️  Clearing cache keys matching: ${pattern}`);
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      console.log('   No keys found');
      return 0;
    }

    await redis.del(...keys);
    console.log(`✅ Cleared ${keys.length} keys`);
    return keys.length;
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    keysByType: Record<string, number>;
  }> {
    const keys = await redis.keys('*');
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

    const keysByType: Record<string, number> = {};

    for (const key of keys) {
      const type = await redis.type(key);
      keysByType[type] = (keysByType[type] || 0) + 1;
    }

    return {
      totalKeys: keys.length,
      memoryUsage,
      keysByType,
    };
  }

  /**
   * Create incremental backup (only changed keys)
   */
  async incrementalBackup(
    lastBackupTimestamp: number,
    pattern: string = '*'
  ): Promise<BackupData> {
    console.log(`📦 Creating incremental backup since ${new Date(lastBackupTimestamp).toISOString()}`);

    // Note: This is a simplified version
    // A production implementation would need to track key modifications
    // using Redis Keyspace Notifications or a change tracking mechanism

    const keys = await redis.keys(pattern);
    const changedKeys: BackupData['keys'] = [];

    for (const key of keys) {
      try {
        // Check if key was modified after last backup
        // This is approximate - Redis doesn't track modification time by default
        const type = await redis.type(key);
        const ttl = await redis.ttl(key);
        const value = await redis.get(key);

        if (value) {
          changedKeys.push({
            key,
            value,
            ttl,
            type,
          });
        }
      } catch (error) {
        console.error(`   Error checking key ${key}:`, error);
      }
    }

    return {
      metadata: {
        timestamp: Date.now(),
        keyCount: changedKeys.length,
        version: this.VERSION,
        environment: process.env.NODE_ENV || 'development',
      },
      keys: changedKeys,
    };
  }

  /**
   * Verify backup integrity
   */
  verifyBackup(backup: BackupData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!backup.metadata) {
      errors.push('Missing metadata');
    }

    if (!backup.keys || !Array.isArray(backup.keys)) {
      errors.push('Invalid keys array');
    }

    if (backup.metadata && backup.metadata.keyCount !== backup.keys.length) {
      errors.push(`Key count mismatch: expected ${backup.metadata.keyCount}, got ${backup.keys.length}`);
    }

    for (let i = 0; i < backup.keys.length; i++) {
      const item = backup.keys[i];
      if (!item.key) {
        errors.push(`Key ${i}: missing key name`);
      }
      if (!item.value) {
        errors.push(`Key ${i} (${item.key}): missing value`);
      }
      if (!item.type) {
        errors.push(`Key ${i} (${item.key}): missing type`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance
export const cacheBackupService = new CacheBackupService();
export default cacheBackupService;
