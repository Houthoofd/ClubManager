/**
 * UserManagerService Tests
 * Comprehensive unit tests for user management CRUD operations
 *
 * Coverage:
 * - findByEmail with tenant isolation
 * - getUserById with profile mapping
 * - getUserByEmail (alias test)
 * - updateUser with partial updates
 * - deleteUser (soft delete)
 * - listUsers with pagination, search, filtering
 * - create user
 * - Multi-tenant isolation
 * - Error handling
 * - Edge cases
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { userManagerService } from '../user-manager.service.js';
import { prisma } from '../../../prisma/prisma.service.js';
import type { User } from '@prisma/client';

// Mock Prisma
jest.mock('../../../prisma/prisma.service', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('UserManagerService', () => {

  const mockUser: User = {
    id: 1,
    tenantId: 'tenant-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$hashedPasswordString',
    dateOfBirth: new Date('1990-01-01'),
    genderId: 1,
    roleId: 1,
    statusId: 1,
    actif: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findByEmail()', () => {

    it('should find user by email and tenantId', async () => {
      // Arrange
      const email = 'john.doe@example.com';
      const tenantId = 'tenant-123';

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userManagerService.findByEmail(email, tenantId);

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: email,
          tenantId: tenantId,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await userManagerService.findByEmail('nonexistent@example.com', 'tenant-123');

      // Assert
      expect(result).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      // Arrange
      const email = 'user@example.com';

      (prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser, tenantId: 'tenant-1' })
        .mockResolvedValueOnce(null);

      // Act
      const tenant1Result = await userManagerService.findByEmail(email, 'tenant-1');
      const tenant2Result = await userManagerService.findByEmail(email, 'tenant-2');

      // Assert
      expect(tenant1Result).toBeTruthy();
      expect(tenant1Result?.tenantId).toBe('tenant-1');
      expect(tenant2Result).toBeNull();
      expect(prisma.user.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await userManagerService.findByEmail('test@example.com', 'tenant-123');

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error finding user by email:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle case-sensitive email search', async () => {
      // Arrange
      const email = 'John.Doe@Example.COM';
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await userManagerService.findByEmail(email, 'tenant-123');

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: email, // Exact match as provided
          tenantId: 'tenant-123',
        },
      });
    });

    it('should handle special characters in email', async () => {
      // Arrange
      const email = 'user+test@example.com';
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await userManagerService.findByEmail(email, 'tenant-123');

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: email,
          tenantId: 'tenant-123',
        },
      });
    });
  });

  describe('getUserById()', () => {

    it('should get user profile by ID', async () => {
      // Arrange
      const userId = 1;
      const tenantId = 'tenant-123';

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userManagerService.getUserById(userId, tenantId);

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: userId,
          tenantId: tenantId,
        },
      });

      expect(result).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        dateOfBirth: mockUser.dateOfBirth,
        actif: mockUser.actif,
        tenantId: mockUser.tenantId,
      });
    });

    it('should exclude sensitive fields from profile', async () => {
      // Arrange
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userManagerService.getUserById(1, 'tenant-123');

      // Assert
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('roleId');
      expect(result).not.toHaveProperty('statusId');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should return null when user not found', async () => {
      // Arrange
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await userManagerService.getUserById(999, 'tenant-123');

      // Assert
      expect(result).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      // Arrange
      const userId = 5;

      (prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser, id: userId, tenantId: 'tenant-a' })
        .mockResolvedValueOnce(null);

      // Act
      const tenantAResult = await userManagerService.getUserById(userId, 'tenant-a');
      const tenantBResult = await userManagerService.getUserById(userId, 'tenant-b');

      // Assert
      expect(tenantAResult).toBeTruthy();
      expect(tenantAResult?.tenantId).toBe('tenant-a');
      expect(tenantBResult).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await userManagerService.getUserById(1, 'tenant-123');

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching user by ID:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getUserByEmail()', () => {

    it('should be an alias for findByEmail', async () => {
      // Arrange
      const email = 'test@example.com';
      const tenantId = 'tenant-123';
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userManagerService.getUserByEmail(email, tenantId);

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email, tenantId },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser()', () => {

    it('should update user successfully', async () => {
      // Arrange
      const userId = 1;
      const tenantId = 'tenant-123';
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      };

      const updatedUser = { ...mockUser, ...updateData };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await userManagerService.updateUser(userId, tenantId, updateData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Utilisateur mis à jour avec succès');
      expect(result.user?.firstName).toBe('Jane');
      expect(result.user?.email).toBe('jane.smith@example.com');
    });

    it('should handle partial updates', async () => {
      // Arrange
      const userId = 1;
      const tenantId = 'tenant-123';
      const partialData = { firstName: 'UpdatedName' };

      const updatedUser = { ...mockUser, firstName: 'UpdatedName' };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await userManagerService.updateUser(userId, tenantId, partialData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: partialData,
      });
      expect(result.success).toBe(true);
      expect(result.user?.firstName).toBe('UpdatedName');
      expect(result.user?.lastName).toBe(mockUser.lastName); // Unchanged
    });

    it('should update actif status', async () => {
      // Arrange
      const userId = 1;
      const tenantId = 'tenant-123';
      const updateData = { actif: false };

      const updatedUser = { ...mockUser, actif: false };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await userManagerService.updateUser(userId, tenantId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.actif).toBe(false);
    });

    it('should handle update errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const userId = 1;
      const tenantId = 'tenant-123';

      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

      // Act
      const result = await userManagerService.updateUser(userId, tenantId, { firstName: 'Test' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de la mise à jour de l\'utilisateur');
      expect(result.user).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle non-existent user', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Record not found'));

      // Act
      const result = await userManagerService.updateUser(999, 'tenant-123', { firstName: 'Test' });

      // Assert
      expect(result.success).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle dateOfBirth updates', async () => {
      // Arrange
      const newDate = new Date('1995-05-15');
      const updatedUser = { ...mockUser, dateOfBirth: newDate };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await userManagerService.updateUser(1, 'tenant-123', { dateOfBirth: newDate });

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.dateOfBirth).toEqual(newDate);
    });
  });

  describe('deleteUser()', () => {

    it('should soft delete user successfully', async () => {
      // Arrange
      const userId = 1;
      const tenantId = 'tenant-123';
      const timestamp = Date.now();

      jest.spyOn(Date, 'now').mockReturnValue(timestamp);

      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        actif: false,
        email: `deleted_${timestamp}_${userId}`,
      });

      // Act
      const result = await userManagerService.deleteUser(userId, tenantId);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          actif: false,
          email: `deleted_${timestamp}_${userId}`,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Utilisateur supprimé avec succès');
    });

    it('should prevent email conflicts on deletion', async () => {
      // Arrange
      const userId = 42;
      const timestamp = 1234567890;

      jest.spyOn(Date, 'now').mockReturnValue(timestamp);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await userManagerService.deleteUser(userId, 'tenant-123');

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          actif: false,
          email: `deleted_${timestamp}_${userId}`,
        },
      });
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      // Act
      const result = await userManagerService.deleteUser(1, 'tenant-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de la suppression de l\'utilisateur');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle non-existent user deletion', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('User not found'));

      // Act
      const result = await userManagerService.deleteUser(999, 'tenant-123');

      // Assert
      expect(result.success).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('listUsers()', () => {

    const mockUsers: User[] = [
      { ...mockUser, id: 1, email: 'user1@example.com' },
      { ...mockUser, id: 2, email: 'user2@example.com' },
      { ...mockUser, id: 3, email: 'user3@example.com' },
    ];

    it('should list users with default options', async () => {
      // Arrange
      const tenantId = 'tenant-123';

      (prisma.user.count as jest.Mock).mockResolvedValue(3);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      const result = await userManagerService.listUsers(tenantId);

      // Assert
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { tenantId },
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should support pagination', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const options = { page: 2, limit: 10 };

      (prisma.user.count as jest.Mock).mockResolvedValue(25);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      const result = await userManagerService.listUsers(tenantId, options);

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        skip: 10, // (page 2 - 1) * 10
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.page).toBe(2);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });

    it('should support search filtering', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const options = { search: 'john' };

      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);

      // Act
      const result = await userManagerService.listUsers(tenantId, options);

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          OR: [
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.users).toHaveLength(1);
    });

    it('should filter by actif status', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const options = { actif: true };

      (prisma.user.count as jest.Mock).mockResolvedValue(2);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers.slice(0, 2));

      // Act
      const result = await userManagerService.listUsers(tenantId, options);

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId, actif: true },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.total).toBe(2);
    });

    it('should combine search and actif filter', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const options = { search: 'doe', actif: true };

      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);

      // Act
      const result = await userManagerService.listUsers(tenantId, options);

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          actif: true,
          OR: [
            { firstName: { contains: 'doe', mode: 'insensitive' } },
            { lastName: { contains: 'doe', mode: 'insensitive' } },
            { email: { contains: 'doe', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await userManagerService.listUsers('empty-tenant');

      // Assert
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should map users to UserProfile format', async () => {
      // Arrange
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      // Act
      const result = await userManagerService.listUsers('tenant-123');

      // Assert
      const profile = result.users[0];
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('firstName');
      expect(profile).toHaveProperty('lastName');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('dateOfBirth');
      expect(profile).toHaveProperty('actif');
      expect(profile).toHaveProperty('tenantId');

      // Should not include sensitive fields
      expect(profile).not.toHaveProperty('password');
      expect(profile).not.toHaveProperty('roleId');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.user.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await userManagerService.listUsers('tenant-123');

      // Assert
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should calculate totalPages correctly', async () => {
      // Arrange
      const testCases = [
        { total: 0, limit: 10, expected: 0 },
        { total: 1, limit: 10, expected: 1 },
        { total: 10, limit: 10, expected: 1 },
        { total: 11, limit: 10, expected: 2 },
        { total: 25, limit: 10, expected: 3 },
        { total: 100, limit: 25, expected: 4 },
      ];

      for (const testCase of testCases) {
        (prisma.user.count as jest.Mock).mockResolvedValue(testCase.total);
        (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

        // Act
        const result = await userManagerService.listUsers('tenant-123', { limit: testCase.limit });

        // Assert
        expect(result.totalPages).toBe(testCase.expected);
      }
    });

    it('should order by createdAt desc', async () => {
      // Arrange
      (prisma.user.count as jest.Mock).mockResolvedValue(3);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      // Act
      await userManagerService.listUsers('tenant-123');

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('create()', () => {

    it('should create new user successfully', async () => {
      // Arrange
      const userData = {
        tenantId: 'tenant-123',
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        password: '$2b$10$hashedPassword',
        dateOfBirth: new Date('1995-06-15'),
        genderId: 2,
      };

      const createdUser = {
        ...mockUser,
        ...userData,
        id: 100,
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      // Act
      const result = await userManagerService.create(userData);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          tenantId: userData.tenantId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          dateOfBirth: userData.dateOfBirth,
          genderId: userData.genderId,
          actif: true,
        },
      });

      expect(result.id).toBe(100);
      expect(result.email).toBe(userData.email);
    });

    it('should create user without optional genderId', async () => {
      // Arrange
      const userData = {
        tenantId: 'tenant-123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashed',
        dateOfBirth: new Date('1990-01-01'),
      };

      const createdUser = { ...mockUser, ...userData };
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      // Act
      const result = await userManagerService.create(userData);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          genderId: undefined,
          actif: true,
        },
      });
      expect(result).toBeTruthy();
    });

    it('should set actif to true by default', async () => {
      // Arrange
      const userData = {
        tenantId: 'tenant-123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashed',
        dateOfBirth: new Date('1990-01-01'),
      };

      const createdUser = { ...mockUser, ...userData, actif: true };
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      // Act
      const result = await userManagerService.create(userData);

      // Assert
      expect(result.actif).toBe(true);
    });

    it('should handle duplicate email errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const userData = {
        tenantId: 'tenant-123',
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'hashed',
        dateOfBirth: new Date('1990-01-01'),
      };

      const error = new Error('Unique constraint failed on email');
      (prisma.user.create as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userManagerService.create(userData))
        .rejects.toThrow('Erreur lors de la création de l\'utilisateur: Unique constraint failed on email');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const userData = {
        tenantId: 'tenant-123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashed',
        dateOfBirth: new Date('1990-01-01'),
      };

      const error = new Error('Database connection failed');
      (prisma.user.create as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userManagerService.create(userData))
        .rejects.toThrow('Erreur lors de la création de l\'utilisateur: Database connection failed');

      consoleSpy.mockRestore();
    });
  });

  describe('Multi-Tenant Isolation', () => {

    it('should isolate users by tenantId in all operations', async () => {
      // Arrange
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';

      // Act & Assert - findByEmail
      await userManagerService.findByEmail('user@example.com', tenant1);
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: tenant1 }) })
      );

      // Act & Assert - getUserById
      await userManagerService.getUserById(1, tenant2);
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: tenant2 }) })
      );

      // Act & Assert - listUsers
      await userManagerService.listUsers(tenant1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: tenant1 }) })
      );
    });
  });

  describe('Edge Cases', () => {

    it('should handle very long names', async () => {
      // Arrange
      const longName = 'A'.repeat(500);
      const userData = {
        tenantId: 'tenant-123',
        firstName: longName,
        lastName: longName,
        email: 'test@example.com',
        password: 'hashed',
        dateOfBirth: new Date('1990-01-01'),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser, ...userData });

      // Act
      const result = await userManagerService.create(userData);

      // Assert
      expect(result.firstName).toBe(longName);
    });

    it('should handle future birth dates', async () => {
      // Arrange
      const futureDate = new Date('2030-01-01');
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, dateOfBirth: futureDate });

      // Act
      const result = await userManagerService.getUserById(1, 'tenant-123');

      // Assert
      expect(result?.dateOfBirth).toEqual(futureDate);
    });

    it('should handle very old dates', async () => {
      // Arrange
      const oldDate = new Date('1900-01-01');
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, dateOfBirth: oldDate });

      // Act
      const result = await userManagerService.getUserById(1, 'tenant-123');

      // Assert
      expect(result?.dateOfBirth).toEqual(oldDate);
    });

    it('should handle large page numbers', async () => {
      // Arrange
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await userManagerService.listUsers('tenant-123', { page: 999, limit: 10 });

      // Assert
      expect(result.page).toBe(999);
      expect(result.users).toHaveLength(0);
    });

    it('should handle very large limits', async () => {
      // Arrange
      (prisma.user.count as jest.Mock).mockResolvedValue(10000);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await userManagerService.listUsers('tenant-123', { limit: 10000 });

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10000 })
      );
    });
  });
});
