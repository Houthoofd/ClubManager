/**
 * User Cache Service Tests
 * Tests for user caching functionality with sessions, permissions, and tokens
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { userCacheService } from '../../user-cache.service.js';
import { cacheService } from '../../cache.service.js';
import { waitForRedis, disconnectRedis } from '../../../db/redis.client.js';
import { prisma } from '../../../db/prisma.client.js';

describe('UserCacheService', () => {
  let testTenantId: string;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    // Wait for Redis connection
    try {
      await waitForRedis(5000);
    } catch (error) {
      console.warn('Redis not available for tests - skipping');
      return;
    }

    // Create test tenant and user
    try {
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test User Cache Tenant',
          slug: `test-user-cache-${Date.now()}`,
          email: `test-user-cache-${Date.now()}@example.com`,
          subscription: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE',
              startDate: new Date(),
            },
          },
        },
      });
      testTenantId = tenant.id;

      const user = await prisma.user.create({
        data: {
          email: `test-user-${Date.now()}@example.com`,
          password: 'hashed-password',
          firstName: 'Test',
          lastName: 'User',
          tenantId: testTenantId,
        },
      });
      testUserId = user.id;
      testUserEmail = user.email;
    } catch (error) {
      console.warn('Could not create test data:', error);
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch (error) {
        console.warn('Could not cleanup test user:', error);
      }
    }

    if (testTenantId) {
      try {
        await prisma.subscription.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.tenant.delete({ where: { id: testTenantId } });
      } catch (error) {
        console.warn('Could not cleanup test tenant:', error);
      }
    }

    await userCacheService.clearAllUserCaches();
    await disconnectRedis();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear user cache before each test
    if (testUserId) {
      await userCacheService.invalidateUser(testUserId);
    }
  });

  describe('User Profile Caching', () => {
    it('should cache user profile by ID', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const user1 = await userCacheService.getUser(testUserId);
      expect(user1).not.toBeNull();
      expect(user1?.id).toBe(testUserId);
      expect(user1?.email).toBe(testUserEmail);

      // Second call should be from cache
      const user2 = await userCacheService.getUser(testUserId);
      expect(user2).toEqual(user1);
    });

    it('should cache user profile by email', async () => {
      if (!testUserEmail) {
        console.warn('Skipping test - no test user');
        return;
      }

      const user1 = await userCacheService.getUserByEmail(testUserEmail);
      expect(user1).not.toBeNull();
      expect(user1?.email).toBe(testUserEmail);

      const user2 = await userCacheService.getUserByEmail(testUserEmail);
      expect(user2).toEqual(user1);
    });

    it('should return null for non-existent user', async () => {
      const user = await userCacheService.getUser('non-existent-user-id');
      expect(user).toBeNull();
    });

    it('should return null for non-existent email', async () => {
      const user = await userCacheService.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('User Sessions', () => {
    it('should create and cache user session', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const sessionData = {
        userId: testUserId,
        tenantId: testTenantId,
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
        loginAt: new Date().toISOString(),
      };

      const sessionId = await userCacheService.createSession(testUserId, sessionData, 3600);
      expect(sessionId).toBeTruthy();

      const retrieved = await userCacheService.getSession(sessionId);
      expect(retrieved).toMatchObject(sessionData);
    });

    it('should get all user sessions', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const session1 = await userCacheService.createSession(
        testUserId,
        { userId: testUserId, device: 'desktop' },
        3600
      );
      const session2 = await userCacheService.createSession(
        testUserId,
        { userId: testUserId, device: 'mobile' },
        3600
      );

      const sessions = await userCacheService.getUserSessions(testUserId);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
      expect(sessions).toContain(session1);
      expect(sessions).toContain(session2);

      // Cleanup
      await userCacheService.deleteSession(session1);
      await userCacheService.deleteSession(session2);
    });

    it('should delete a session', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const sessionId = await userCacheService.createSession(
        testUserId,
        { userId: testUserId },
        3600
      );

      const deleted = await userCacheService.deleteSession(sessionId);
      expect(deleted).toBe(true);

      const retrieved = await userCacheService.getSession(sessionId);
      expect(retrieved).toBeNull();
    });

    it('should invalidate all user sessions', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const session1 = await userCacheService.createSession(
        testUserId,
        { userId: testUserId },
        3600
      );
      const session2 = await userCacheService.createSession(
        testUserId,
        { userId: testUserId },
        3600
      );

      await userCacheService.invalidateUserSessions(testUserId);

      const retrieved1 = await userCacheService.getSession(session1);
      const retrieved2 = await userCacheService.getSession(session2);

      expect(retrieved1).toBeNull();
      expect(retrieved2).toBeNull();
    });

    it('should count active sessions', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const session1 = await userCacheService.createSession(
        testUserId,
        { userId: testUserId },
        3600
      );
      const session2 = await userCacheService.createSession(
        testUserId,
        { userId: testUserId },
        3600
      );

      const count = await userCacheService.getUserSessionCount(testUserId);
      expect(count).toBeGreaterThanOrEqual(2);

      // Cleanup
      await userCacheService.deleteSession(session1);
      await userCacheService.deleteSession(session2);
    });
  });

  describe('User Permissions', () => {
    it('should cache user permissions', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const permissions = ['read:users', 'write:posts', 'delete:comments'];
      await userCacheService.setUserPermissions(testUserId, permissions);

      const cached = await userCacheService.getUserPermissions(testUserId);
      expect(cached).toEqual(permissions);
    });

    it('should check if user has permission', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const permissions = ['read:data', 'write:data'];
      await userCacheService.setUserPermissions(testUserId, permissions);

      const hasRead = await userCacheService.userHasPermission(testUserId, 'read:data');
      const hasWrite = await userCacheService.userHasPermission(testUserId, 'write:data');
      const hasDelete = await userCacheService.userHasPermission(testUserId, 'delete:data');

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(true);
      expect(hasDelete).toBe(false);
    });

    it('should add permission to user', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      await userCacheService.setUserPermissions(testUserId, ['read:data']);
      await userCacheService.addUserPermission(testUserId, 'write:data');

      const permissions = await userCacheService.getUserPermissions(testUserId);
      expect(permissions).toContain('read:data');
      expect(permissions).toContain('write:data');
    });

    it('should remove permission from user', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      await userCacheService.setUserPermissions(testUserId, ['read:data', 'write:data']);
      await userCacheService.removeUserPermission(testUserId, 'write:data');

      const permissions = await userCacheService.getUserPermissions(testUserId);
      expect(permissions).toContain('read:data');
      expect(permissions).not.toContain('write:data');
    });

    it('should invalidate user permissions', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      await userCacheService.setUserPermissions(testUserId, ['read:data']);
      await userCacheService.invalidateUserPermissions(testUserId);

      const permissions = await userCacheService.getUserPermissions(testUserId);
      expect(permissions).toBeNull();
    });
  });

  describe('User Tokens', () => {
    it('should store and retrieve refresh token', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const token = 'test-refresh-token-' + Date.now();
      await userCacheService.storeRefreshToken(testUserId, token, 86400);

      const isValid = await userCacheService.isRefreshTokenValid(testUserId, token);
      expect(isValid).toBe(true);
    });

    it('should invalidate refresh token', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const token = 'test-token-to-invalidate-' + Date.now();
      await userCacheService.storeRefreshToken(testUserId, token, 86400);
      await userCacheService.invalidateRefreshToken(testUserId, token);

      const isValid = await userCacheService.isRefreshTokenValid(testUserId, token);
      expect(isValid).toBe(false);
    });

    it('should store and retrieve reset token', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const token = 'reset-token-' + Date.now();
      await userCacheService.storePasswordResetToken(testUserId, token, 3600);

      const userId = await userCacheService.getUserIdByResetToken(token);
      expect(userId).toBe(testUserId);
    });

    it('should invalidate reset token', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const token = 'reset-token-to-invalidate-' + Date.now();
      await userCacheService.storePasswordResetToken(testUserId, token, 3600);
      await userCacheService.invalidatePasswordResetToken(token);

      const userId = await userCacheService.getUserIdByResetToken(token);
      expect(userId).toBeNull();
    });

    it('should store and retrieve verification token', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const token = 'verify-token-' + Date.now();
      await userCacheService.storeEmailVerificationToken(testUserId, token, 86400);

      const userId = await userCacheService.getUserIdByVerificationToken(token);
      expect(userId).toBe(testUserId);
    });
  });

  describe('Online Users Tracking', () => {
    it('should mark user as online', async () => {
      if (!testUserId || !testTenantId) {
        console.warn('Skipping test - no test data');
        return;
      }

      await userCacheService.markUserOnline(testUserId, testTenantId);

      const isOnline = await userCacheService.isUserOnline(testUserId);
      expect(isOnline).toBe(true);
    });

    it('should mark user as offline', async () => {
      if (!testUserId || !testTenantId) {
        console.warn('Skipping test - no test data');
        return;
      }

      await userCacheService.markUserOnline(testUserId, testTenantId);
      await userCacheService.markUserOffline(testUserId, testTenantId);

      const isOnline = await userCacheService.isUserOnline(testUserId);
      expect(isOnline).toBe(false);
    });

    it('should get online users for tenant', async () => {
      if (!testUserId || !testTenantId) {
        console.warn('Skipping test - no test data');
        return;
      }

      await userCacheService.markUserOnline(testUserId, testTenantId);

      const onlineUsers = await userCacheService.getOnlineUsers(testTenantId);
      expect(onlineUsers).toContain(testUserId);

      // Cleanup
      await userCacheService.markUserOffline(testUserId, testTenantId);
    });

    it('should count online users for tenant', async () => {
      if (!testUserId || !testTenantId) {
        console.warn('Skipping test - no test data');
        return;
      }

      await userCacheService.markUserOnline(testUserId, testTenantId);

      const count = await userCacheService.getOnlineUsersCount(testTenantId);
      expect(count).toBeGreaterThanOrEqual(1);

      // Cleanup
      await userCacheService.markUserOffline(testUserId, testTenantId);
    });
  });

  describe('User Preferences', () => {
    it('should cache user preferences', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const preferences = {
        theme: 'dark',
        language: 'fr',
        notifications: true,
        timezone: 'Europe/Paris',
      };

      await userCacheService.setUserPreferences(testUserId, preferences);

      const cached = await userCacheService.getUserPreferences(testUserId);
      expect(cached).toEqual(preferences);
    });

    it('should update user preferences', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      await userCacheService.setUserPreferences(testUserId, { theme: 'light' });
      await userCacheService.setUserPreferences(testUserId, { theme: 'dark' });

      const preferences = await userCacheService.getUserPreferences(testUserId);
      expect(preferences.theme).toBe('dark');
    });
  });

  describe('User Activity Tracking', () => {
    it('should update last activity timestamp', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      await userCacheService.updateUserLastActivity(testUserId);

      const lastActivity = await userCacheService.getUserLastActivity(testUserId);
      expect(lastActivity).not.toBeNull();
      expect(new Date(lastActivity!).getTime()).toBeGreaterThan(Date.now() - 5000);
    });

    it('should track user action count', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      await userCacheService.incrementUserAction(testUserId, 'login');
      await userCacheService.incrementUserAction(testUserId, 'login');
      await userCacheService.incrementUserAction(testUserId, 'login');

      const count = await userCacheService.getUserActionCount(testUserId, 'login');
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate user cache completely', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      // Cache various user data
      await userCacheService.getUser(testUserId);
      await userCacheService.setUserPermissions(testUserId, ['read:data']);
      await userCacheService.setUserPreferences(testUserId, { theme: 'dark' });

      // Invalidate all
      await userCacheService.invalidateUser(testUserId);

      // Verify all are cleared
      const cacheKey = `user:${testUserId}`;
      const user = await cacheService.get(cacheKey);
      const permissions = await userCacheService.getUserPermissions(testUserId);
      const preferences = await userCacheService.getUserPreferences(testUserId);

      expect(user).toBeNull();
      expect(permissions).toBeNull();
      expect(preferences).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple users', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      const users = await userCacheService.getMultipleUsers([
        testUserId,
        'non-existent-id',
      ]);

      expect(users).toHaveLength(2);
      expect(users[0]).not.toBeNull();
      expect(users[0]?.id).toBe(testUserId);
      expect(users[1]).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty user ID gracefully', async () => {
      const user = await userCacheService.getUser('');
      expect(user).toBeNull();
    });

    it('should handle empty email gracefully', async () => {
      const user = await userCacheService.getUserByEmail('');
      expect(user).toBeNull();
    });

    it('should handle invalid session ID', async () => {
      const session = await userCacheService.getSession('invalid-session');
      expect(session).toBeNull();
    });
  });
});
