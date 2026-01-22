/**
 * User Cache Service
 * Handles user-specific caching operations
 */

import { cacheService } from './cache.service.js';
import { UserCacheKeys } from './cache-keys.js';
import { CacheTTL } from './cache.config.js';

/**
 * User profile cache interface
 */
export interface UserProfile {
  id: string;
  email: string;
  nom?: string;
  prenom?: string;
  role: string;
  tenantId: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User permissions interface
 */
export interface UserPermissions {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  scopes: string[];
  features: string[];
}

/**
 * User session interface
 */
export interface UserSession {
  sessionId: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActivity?: Date;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  userId: string;
  language?: string;
  timezone?: string;
  theme?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  settings?: Record<string, any>;
}

/**
 * User Cache Service
 */
export class UserCacheService {
  /**
   * Get user profile from cache
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const key = UserCacheKeys.profile(userId);
    return await cacheService.get<UserProfile>(key);
  }

  /**
   * Set user profile in cache
   */
  async setUserProfile(user: UserProfile): Promise<boolean> {
    const key = UserCacheKeys.profile(user.id);
    return await cacheService.set(key, user, {
      ttl: CacheTTL.USER_PROFILE,
    });
  }

  /**
   * Get or set user profile (cache-aside pattern)
   */
  async getOrSetUserProfile(
    userId: string,
    factory: () => Promise<UserProfile>
  ): Promise<UserProfile> {
    const key = UserCacheKeys.profile(userId);
    return await cacheService.getOrSet(key, factory, {
      ttl: CacheTTL.USER_PROFILE,
    });
  }

  /**
   * Delete user profile from cache
   */
  async deleteUserProfile(userId: string): Promise<boolean> {
    const key = UserCacheKeys.profile(userId);
    return await cacheService.delete(key);
  }

  /**
   * Invalidate all user cache
   */
  async invalidateUser(userId: string): Promise<number> {
    const pattern = UserCacheKeys.pattern(userId);
    return await cacheService.deletePattern(pattern);
  }

  /**
   * Get user permissions from cache
   */
  async getUserPermissions(
    userId: string,
    tenantId?: string
  ): Promise<UserPermissions | null> {
    const key = UserCacheKeys.permissions(userId, tenantId);
    return await cacheService.get<UserPermissions>(key);
  }

  /**
   * Set user permissions in cache
   */
  async setUserPermissions(permissions: UserPermissions): Promise<boolean> {
    const key = UserCacheKeys.permissions(permissions.userId, permissions.tenantId);
    return await cacheService.set(key, permissions, {
      ttl: CacheTTL.USER_PROFILE,
    });
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    permission: string,
    tenantId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    return permissions ? permissions.permissions.includes(permission) : false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    userId: string,
    permissionsToCheck: string[],
    tenantId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    if (!permissions) return false;

    return permissionsToCheck.some(p => permissions.permissions.includes(p));
  }

  /**
   * Check if user has all specified permissions
   */
  async hasAllPermissions(
    userId: string,
    permissionsToCheck: string[],
    tenantId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    if (!permissions) return false;

    return permissionsToCheck.every(p => permissions.permissions.includes(p));
  }

  /**
   * Get user session from cache
   */
  async getUserSession(
    userId: string,
    sessionId?: string
  ): Promise<UserSession | null> {
    const key = UserCacheKeys.session(userId, sessionId);
    return await cacheService.get<UserSession>(key);
  }

  /**
   * Set user session in cache
   */
  async setUserSession(session: UserSession): Promise<boolean> {
    const key = UserCacheKeys.session(session.userId, session.sessionId);
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);

    if (ttl <= 0) {
      return false; // Session already expired
    }

    return await cacheService.set(key, session, { ttl });
  }

  /**
   * Delete user session from cache
   */
  async deleteUserSession(userId: string, sessionId?: string): Promise<boolean> {
    const key = UserCacheKeys.session(userId, sessionId);
    return await cacheService.delete(key);
  }

  /**
   * Update session last activity
   */
  async updateSessionActivity(
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    const session = await this.getUserSession(userId, sessionId);
    if (!session) return false;

    session.lastActivity = new Date();
    return await this.setUserSession(session);
  }

  /**
   * Get user preferences from cache
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const key = UserCacheKeys.preferences(userId);
    return await cacheService.get<UserPreferences>(key);
  }

  /**
   * Set user preferences in cache
   */
  async setUserPreferences(preferences: UserPreferences): Promise<boolean> {
    const key = UserCacheKeys.preferences(preferences.userId);
    return await cacheService.set(key, preferences, {
      ttl: CacheTTL.USER_PROFILE,
    });
  }

  /**
   * Update specific user preference
   */
  async updateUserPreference(
    userId: string,
    prefKey: string,
    value: any
  ): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences) return false;

    (preferences as any)[prefKey] = value;
    return await this.setUserPreferences(preferences);
  }

  /**
   * Store active user session ID in set
   */
  async addActiveSession(userId: string, sessionId: string): Promise<number> {
    const key = `user:${userId}:sessions:active`;
    const result = await cacheService.addToSet(key, sessionId);

    // Set expiration
    await cacheService.expire(key, CacheTTL.USER_SESSION);

    return result;
  }

  /**
   * Remove active user session
   */
  async removeActiveSession(userId: string, sessionId: string): Promise<number> {
    const key = `user:${userId}:sessions:active`;
    return await cacheService.removeFromSet(key, sessionId);
  }

  /**
   * Get all active sessions for user
   */
  async getActiveSessions(userId: string): Promise<string[]> {
    const key = `user:${userId}:sessions:active`;
    return await cacheService.getSetMembers(key);
  }

  /**
   * Check if user has active session
   */
  async hasActiveSession(userId: string, sessionId: string): Promise<boolean> {
    const key = `user:${userId}:sessions:active`;
    return await cacheService.isInSet(key, sessionId);
  }

  /**
   * Clear all user sessions
   */
  async clearAllUserSessions(userId: string): Promise<boolean> {
    const activeSessions = await this.getActiveSessions(userId);

    const promises: Promise<any>[] = activeSessions.map(sessionId =>
      this.deleteUserSession(userId, sessionId)
    );

    const key = `user:${userId}:sessions:active`;
    promises.push(cacheService.delete(key));

    await Promise.allSettled(promises);
    return true;
  }

  /**
   * Store user token (JWT, refresh token, etc.)
   */
  async storeUserToken(
    userId: string,
    tokenType: string,
    token: string,
    ttlSeconds: number
  ): Promise<boolean> {
    const key = `user:${userId}:token:${tokenType}`;
    return await cacheService.set(key, token, {
      ttl: ttlSeconds,
    });
  }

  /**
   * Get user token
   */
  async getUserToken(userId: string, tokenType: string): Promise<string | null> {
    const key = `user:${userId}:token:${tokenType}`;
    return await cacheService.get<string>(key);
  }

  /**
   * Delete user token
   */
  async deleteUserToken(userId: string, tokenType: string): Promise<boolean> {
    const key = `user:${userId}:token:${tokenType}`;
    return await cacheService.delete(key);
  }

  /**
   * Verify user token matches cached value
   */
  async verifyUserToken(
    userId: string,
    tokenType: string,
    token: string
  ): Promise<boolean> {
    const cachedToken = await this.getUserToken(userId, tokenType);
    return cachedToken === token;
  }

  /**
   * Store user online status
   */
  async setUserOnline(userId: string, ttlSeconds: number = 300): Promise<boolean> {
    const key = `user:${userId}:online`;
    return await cacheService.set(key, Date.now().toString(), {
      ttl: ttlSeconds,
    });
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const key = `user:${userId}:online`;
    return await cacheService.exists(key);
  }

  /**
   * Get user last seen timestamp
   */
  async getUserLastSeen(userId: string): Promise<number | null> {
    const key = `user:${userId}:online`;
    const timestamp = await cacheService.get<string>(key);
    return timestamp ? parseInt(timestamp, 10) : null;
  }

  /**
   * Add user to online users set
   */
  async addToOnlineUsers(tenantId: string, userId: string): Promise<number> {
    const key = `tenant:${tenantId}:users:online`;
    return await cacheService.addToSet(key, userId);
  }

  /**
   * Remove user from online users set
   */
  async removeFromOnlineUsers(tenantId: string, userId: string): Promise<number> {
    const key = `tenant:${tenantId}:users:online`;
    return await cacheService.removeFromSet(key, userId);
  }

  /**
   * Get all online users for tenant
   */
  async getOnlineUsers(tenantId: string): Promise<string[]> {
    const key = `tenant:${tenantId}:users:online`;
    return await cacheService.getSetMembers(key);
  }

  /**
   * Get online users count for tenant
   */
  async getOnlineUsersCount(tenantId: string): Promise<number> {
    const users = await this.getOnlineUsers(tenantId);
    return users.length;
  }

  /**
   * Cache multiple user profiles at once
   */
  async cacheMultipleProfiles(users: UserProfile[]): Promise<boolean> {
    if (users.length === 0) return true;

    const items = users.map(user => ({
      key: UserCacheKeys.profile(user.id),
      value: user,
      ttl: CacheTTL.USER_PROFILE,
    }));

    return await cacheService.mset(items);
  }

  /**
   * Get multiple user profiles at once
   */
  async getMultipleProfiles(userIds: string[]): Promise<(UserProfile | null)[]> {
    if (userIds.length === 0) return [];

    const keys = userIds.map(id => UserCacheKeys.profile(id));
    return await cacheService.mget<UserProfile>(keys);
  }

  /**
   * Warm up user cache (preload common data)
   */
  async warmUpUserCache(
    user: UserProfile,
    permissions?: UserPermissions,
    preferences?: UserPreferences
  ): Promise<void> {
    const promises: Promise<any>[] = [
      this.setUserProfile(user),
    ];

    if (permissions) {
      promises.push(this.setUserPermissions(permissions));
    }

    if (preferences) {
      promises.push(this.setUserPreferences(preferences));
    }

    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const userCacheService = new UserCacheService();
