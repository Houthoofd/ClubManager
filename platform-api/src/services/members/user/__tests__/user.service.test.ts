/**
 * User Service Tests
 * Comprehensive unit tests for the UserService facade
 *
 * Coverage:
 * - Authentication delegation (login, register, verify)
 * - User management delegation (CRUD operations)
 * - Token operations
 * - Password operations
 * - Error handling
 * - Multi-tenant isolation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { userService } from '../user.service.js';
import { authService } from '../../../infrastructure/auth/auth.service.js';
import { userManagerService } from '../../users/user-manager.service.js';
import type { LoginCredentials, RegisterUserData, AuthResult } from '../../../infrastructure/auth/auth.types.js';

// Mock dependencies
jest.mock('../../../infrastructure/auth/auth.service');
jest.mock('../../users/user-manager.service');

describe('UserService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Methods - Delegation to AuthService', () => {

    describe('login()', () => {
      it('should delegate login to authService', async () => {
        // Arrange
        const credentials: LoginCredentials = {
          email: 'test@example.com',
          password: 'Password123!',
          tenantId: 'tenant-123'
        };

        const expectedResult: AuthResult = {
          success: true,
          token: 'jwt-token-xyz',
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            tenantId: 'tenant-123'
          }
        };

        (authService.login as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.login(credentials);

        // Assert
        expect(authService.login).toHaveBeenCalledWith(credentials);
        expect(authService.login).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedResult);
      });

      it('should propagate authService errors', async () => {
        // Arrange
        const credentials: LoginCredentials = {
          email: 'test@example.com',
          password: 'wrong',
          tenantId: 'tenant-123'
        };

        const error = new Error('Invalid credentials');
        (authService.login as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.login(credentials)).rejects.toThrow('Invalid credentials');
        expect(authService.login).toHaveBeenCalledWith(credentials);
      });

      it('should handle multi-tenant login correctly', async () => {
        // Arrange
        const tenant1Credentials: LoginCredentials = {
          email: 'user@example.com',
          password: 'password',
          tenantId: 'tenant-1'
        };

        const tenant2Credentials: LoginCredentials = {
          email: 'user@example.com',
          password: 'password',
          tenantId: 'tenant-2'
        };

        const tenant1Result: AuthResult = {
          success: true,
          token: 'token-tenant-1',
          user: { id: 1, email: 'user@example.com', tenantId: 'tenant-1', firstName: 'User', lastName: 'One' }
        };

        const tenant2Result: AuthResult = {
          success: true,
          token: 'token-tenant-2',
          user: { id: 2, email: 'user@example.com', tenantId: 'tenant-2', firstName: 'User', lastName: 'Two' }
        };

        (authService.login as jest.Mock)
          .mockResolvedValueOnce(tenant1Result)
          .mockResolvedValueOnce(tenant2Result);

        // Act
        const result1 = await userService.login(tenant1Credentials);
        const result2 = await userService.login(tenant2Credentials);

        // Assert
        expect(result1.user?.tenantId).toBe('tenant-1');
        expect(result2.user?.tenantId).toBe('tenant-2');
        expect(authService.login).toHaveBeenCalledTimes(2);
      });
    });

    describe('register()', () => {
      it('should delegate registration to authService', async () => {
        // Arrange
        const userData: RegisterUserData = {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1990-01-01'),
          tenantId: 'tenant-123'
        };

        const expectedResult: AuthResult = {
          success: true,
          token: 'new-user-token',
          user: {
            id: 10,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            tenantId: userData.tenantId
          }
        };

        (authService.register as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.register(userData);

        // Assert
        expect(authService.register).toHaveBeenCalledWith(userData);
        expect(authService.register).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedResult);
      });

      it('should propagate registration validation errors', async () => {
        // Arrange
        const invalidData: RegisterUserData = {
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '',
          lastName: '',
          dateOfBirth: new Date(),
          tenantId: 'tenant-123'
        };

        const error = new Error('Validation failed');
        (authService.register as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.register(invalidData)).rejects.toThrow('Validation failed');
      });

      it('should handle duplicate email registration', async () => {
        // Arrange
        const userData: RegisterUserData = {
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Duplicate',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          tenantId: 'tenant-123'
        };

        const error = new Error('Email already exists');
        (authService.register as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.register(userData)).rejects.toThrow('Email already exists');
      });
    });

    describe('verifyAuth()', () => {
      it('should delegate token verification to authService', async () => {
        // Arrange
        const token = 'valid-jwt-token';
        const expectedPayload = {
          userId: 1,
          email: 'test@example.com',
          tenantId: 'tenant-123',
          iat: 1234567890,
          exp: 1234571490
        };

        (authService.verifyAuth as jest.Mock).mockResolvedValue(expectedPayload);

        // Act
        const result = await userService.verifyAuth(token);

        // Assert
        expect(authService.verifyAuth).toHaveBeenCalledWith(token);
        expect(result).toEqual(expectedPayload);
      });

      it('should handle invalid token', async () => {
        // Arrange
        const invalidToken = 'invalid-token';
        const error = new Error('Invalid token');
        (authService.verifyAuth as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.verifyAuth(invalidToken)).rejects.toThrow('Invalid token');
      });

      it('should handle expired token', async () => {
        // Arrange
        const expiredToken = 'expired-token';
        const error = new Error('Token expired');
        (authService.verifyAuth as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.verifyAuth(expiredToken)).rejects.toThrow('Token expired');
      });
    });

    describe('hashPassword()', () => {
      it('should delegate password hashing to authService', async () => {
        // Arrange
        const password = 'MySecurePassword123!';
        const expectedHash = '$2b$10$hashedPasswordString';

        (authService.hashPassword as jest.Mock).mockResolvedValue(expectedHash);

        // Act
        const result = await userService.hashPassword(password);

        // Assert
        expect(authService.hashPassword).toHaveBeenCalledWith(password);
        expect(result).toBe(expectedHash);
      });

      it('should handle hashing errors', async () => {
        // Arrange
        const password = 'password';
        const error = new Error('Hashing failed');
        (authService.hashPassword as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.hashPassword(password)).rejects.toThrow('Hashing failed');
      });
    });

    describe('verifyPassword()', () => {
      it('should delegate password verification to authService', async () => {
        // Arrange
        const password = 'MyPassword123!';
        const hash = '$2b$10$hashedPasswordString';

        (authService.verifyPassword as jest.Mock).mockResolvedValue(true);

        // Act
        const result = await userService.verifyPassword(password, hash);

        // Assert
        expect(authService.verifyPassword).toHaveBeenCalledWith(password, hash);
        expect(result).toBe(true);
      });

      it('should return false for wrong password', async () => {
        // Arrange
        const password = 'WrongPassword';
        const hash = '$2b$10$hashedPasswordString';

        (authService.verifyPassword as jest.Mock).mockResolvedValue(false);

        // Act
        const result = await userService.verifyPassword(password, hash);

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('Token Methods - Delegation to AuthService', () => {

    describe('generateToken()', () => {
      it('should generate token with user info', () => {
        // Arrange
        const userId = 42;
        const email = 'user@example.com';
        const tenantId = 'tenant-abc';
        const expectedToken = 'jwt-token-generated';

        (authService.generateToken as jest.Mock).mockReturnValue(expectedToken);

        // Act
        const token = userService.generateToken(userId, email, tenantId);

        // Assert
        expect(authService.generateToken).toHaveBeenCalledWith({
          id: userId,
          email,
          tenantId
        });
        expect(token).toBe(expectedToken);
      });

      it('should generate token without statusId', () => {
        // Arrange
        const userId = 1;
        const email = 'test@example.com';
        const tenantId = 'tenant-1';

        (authService.generateToken as jest.Mock).mockReturnValue('token');

        // Act
        userService.generateToken(userId, email, tenantId);

        // Assert
        expect(authService.generateToken).toHaveBeenCalledWith({
          id: userId,
          email,
          tenantId
        });
      });

      it('should handle different tenant tokens correctly', () => {
        // Arrange
        (authService.generateToken as jest.Mock)
          .mockReturnValueOnce('token-tenant-1')
          .mockReturnValueOnce('token-tenant-2');

        // Act
        const token1 = userService.generateToken(1, 'user@example.com', 'tenant-1');
        const token2 = userService.generateToken(1, 'user@example.com', 'tenant-2');

        // Assert
        expect(token1).toBe('token-tenant-1');
        expect(token2).toBe('token-tenant-2');
        expect(authService.generateToken).toHaveBeenCalledTimes(2);
      });
    });

    describe('verifyToken()', () => {
      it('should verify and decode token', () => {
        // Arrange
        const token = 'valid-token';
        const expectedPayload = {
          id: 1,
          email: 'test@example.com',
          tenantId: 'tenant-123',
          iat: 1234567890,
          exp: 1234571490
        };

        (authService.verifyToken as jest.Mock).mockReturnValue(expectedPayload);

        // Act
        const result = userService.verifyToken(token);

        // Assert
        expect(authService.verifyToken).toHaveBeenCalledWith(token);
        expect(result).toEqual(expectedPayload);
      });

      it('should throw on invalid token', () => {
        // Arrange
        const invalidToken = 'invalid';
        const error = new Error('Invalid token');
        (authService.verifyToken as jest.Mock).mockImplementation(() => {
          throw error;
        });

        // Act & Assert
        expect(() => userService.verifyToken(invalidToken)).toThrow('Invalid token');
      });
    });
  });

  describe('User Management Methods - Delegation to UserManagerService', () => {

    describe('findByEmail()', () => {
      it('should find user by email and tenantId', async () => {
        // Arrange
        const email = 'user@example.com';
        const tenantId = 'tenant-123';
        const expectedUser = {
          id: 1,
          email,
          firstName: 'John',
          lastName: 'Doe',
          tenantId,
          actif: true,
          password: 'hashed',
          dateOfBirth: new Date('1990-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          genderId: 1,
          roleId: 1,
          statusId: 1
        };

        (userManagerService.findByEmail as jest.Mock).mockResolvedValue(expectedUser);

        // Act
        const result = await userService.findByEmail(email, tenantId);

        // Assert
        expect(userManagerService.findByEmail).toHaveBeenCalledWith(email, tenantId);
        expect(result).toEqual(expectedUser);
      });

      it('should return null if user not found', async () => {
        // Arrange
        (userManagerService.findByEmail as jest.Mock).mockResolvedValue(null);

        // Act
        const result = await userService.findByEmail('nonexistent@example.com', 'tenant-123');

        // Assert
        expect(result).toBeNull();
      });

      it('should enforce tenant isolation', async () => {
        // Arrange
        const email = 'user@example.com';

        (userManagerService.findByEmail as jest.Mock)
          .mockResolvedValueOnce({ id: 1, tenantId: 'tenant-1' })
          .mockResolvedValueOnce(null);

        // Act
        const tenant1Result = await userService.findByEmail(email, 'tenant-1');
        const tenant2Result = await userService.findByEmail(email, 'tenant-2');

        // Assert
        expect(tenant1Result).toBeTruthy();
        expect(tenant2Result).toBeNull();
      });
    });

    describe('getUserById()', () => {
      it('should get user profile by ID', async () => {
        // Arrange
        const userId = 42;
        const tenantId = 'tenant-xyz';
        const expectedProfile = {
          id: userId,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          dateOfBirth: new Date('1985-05-15'),
          actif: true,
          tenantId
        };

        (userManagerService.getUserById as jest.Mock).mockResolvedValue(expectedProfile);

        // Act
        const result = await userService.getUserById(userId, tenantId);

        // Assert
        expect(userManagerService.getUserById).toHaveBeenCalledWith(userId, tenantId);
        expect(result).toEqual(expectedProfile);
      });

      it('should return null for non-existent user', async () => {
        // Arrange
        (userManagerService.getUserById as jest.Mock).mockResolvedValue(null);

        // Act
        const result = await userService.getUserById(999, 'tenant-123');

        // Assert
        expect(result).toBeNull();
      });

      it('should respect tenant boundaries', async () => {
        // Arrange
        const userId = 1;

        (userManagerService.getUserById as jest.Mock)
          .mockResolvedValueOnce({ id: userId, tenantId: 'tenant-a' })
          .mockResolvedValueOnce(null);

        // Act
        const resultA = await userService.getUserById(userId, 'tenant-a');
        const resultB = await userService.getUserById(userId, 'tenant-b');

        // Assert
        expect(resultA).toBeTruthy();
        expect(resultB).toBeNull();
      });
    });

    describe('getUserByEmail()', () => {
      it('should get user by email', async () => {
        // Arrange
        const email = 'test@example.com';
        const tenantId = 'tenant-123';
        const expectedUser = {
          id: 5,
          email,
          tenantId,
          actif: true
        };

        (userManagerService.getUserByEmail as jest.Mock).mockResolvedValue(expectedUser);

        // Act
        const result = await userService.getUserByEmail(email, tenantId);

        // Assert
        expect(userManagerService.getUserByEmail).toHaveBeenCalledWith(email, tenantId);
        expect(result).toEqual(expectedUser);
      });
    });

    describe('updateUser()', () => {
      it('should update user profile', async () => {
        // Arrange
        const userId = 10;
        const tenantId = 'tenant-123';
        const updateData = {
          firstName: 'UpdatedName',
          lastName: 'UpdatedLast',
          email: 'updated@example.com'
        };

        const expectedResult = {
          success: true,
          message: 'Utilisateur mis à jour avec succès',
          user: {
            id: userId,
            ...updateData,
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId
          }
        };

        (userManagerService.updateUser as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.updateUser(userId, tenantId, updateData);

        // Assert
        expect(userManagerService.updateUser).toHaveBeenCalledWith(userId, tenantId, updateData);
        expect(result.success).toBe(true);
        expect(result.user?.firstName).toBe('UpdatedName');
      });

      it('should handle partial updates', async () => {
        // Arrange
        const userId = 1;
        const tenantId = 'tenant-123';
        const partialUpdate = { firstName: 'OnlyFirstName' };

        const expectedResult = {
          success: true,
          message: 'Utilisateur mis à jour avec succès',
          user: {
            id: userId,
            firstName: 'OnlyFirstName',
            lastName: 'Unchanged',
            email: 'unchanged@example.com',
            dateOfBirth: new Date(),
            actif: true,
            tenantId
          }
        };

        (userManagerService.updateUser as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.updateUser(userId, tenantId, partialUpdate);

        // Assert
        expect(result.success).toBe(true);
        expect(userManagerService.updateUser).toHaveBeenCalledWith(userId, tenantId, partialUpdate);
      });

      it('should handle update failures', async () => {
        // Arrange
        const userId = 1;
        const tenantId = 'tenant-123';
        const updateData = { email: 'invalid' };

        const expectedResult = {
          success: false,
          message: 'Erreur lors de la mise à jour de l\'utilisateur'
        };

        (userManagerService.updateUser as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.updateUser(userId, tenantId, updateData);

        // Assert
        expect(result.success).toBe(false);
        expect(result.user).toBeUndefined();
      });
    });

    describe('deleteUser()', () => {
      it('should soft delete user', async () => {
        // Arrange
        const userId = 15;
        const tenantId = 'tenant-123';

        const expectedResult = {
          success: true,
          message: 'Utilisateur supprimé avec succès'
        };

        (userManagerService.deleteUser as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.deleteUser(userId, tenantId);

        // Assert
        expect(userManagerService.deleteUser).toHaveBeenCalledWith(userId, tenantId);
        expect(result.success).toBe(true);
      });

      it('should handle deletion errors', async () => {
        // Arrange
        const userId = 999;
        const tenantId = 'tenant-123';

        const expectedResult = {
          success: false,
          message: 'Erreur lors de la suppression de l\'utilisateur'
        };

        (userManagerService.deleteUser as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.deleteUser(userId, tenantId);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe('listUsers()', () => {
      it('should list users with default options', async () => {
        // Arrange
        const tenantId = 'tenant-123';
        const expectedResult = {
          users: [
            { id: 1, firstName: 'User1', lastName: 'Last1', email: 'user1@example.com', dateOfBirth: new Date(), actif: true, tenantId },
            { id: 2, firstName: 'User2', lastName: 'Last2', email: 'user2@example.com', dateOfBirth: new Date(), actif: true, tenantId }
          ],
          total: 2,
          page: 1,
          totalPages: 1
        };

        (userManagerService.listUsers as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.listUsers(tenantId);

        // Assert
        expect(userManagerService.listUsers).toHaveBeenCalledWith(tenantId, {});
        expect(result.users).toHaveLength(2);
        expect(result.total).toBe(2);
      });

      it('should support pagination', async () => {
        // Arrange
        const tenantId = 'tenant-123';
        const options = { page: 2, limit: 10 };

        const expectedResult = {
          users: [],
          total: 25,
          page: 2,
          totalPages: 3
        };

        (userManagerService.listUsers as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.listUsers(tenantId, options);

        // Assert
        expect(userManagerService.listUsers).toHaveBeenCalledWith(tenantId, options);
        expect(result.page).toBe(2);
        expect(result.totalPages).toBe(3);
      });

      it('should support search filtering', async () => {
        // Arrange
        const tenantId = 'tenant-123';
        const options = { search: 'john' };

        const expectedResult = {
          users: [
            { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', dateOfBirth: new Date(), actif: true, tenantId }
          ],
          total: 1,
          page: 1,
          totalPages: 1
        };

        (userManagerService.listUsers as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.listUsers(tenantId, options);

        // Assert
        expect(userManagerService.listUsers).toHaveBeenCalledWith(tenantId, options);
        expect(result.users).toHaveLength(1);
        expect(result.users[0].firstName).toBe('John');
      });

      it('should filter by active status', async () => {
        // Arrange
        const tenantId = 'tenant-123';
        const options = { actif: true };

        const expectedResult = {
          users: [
            { id: 1, actif: true, tenantId },
            { id: 2, actif: true, tenantId }
          ],
          total: 2,
          page: 1,
          totalPages: 1
        };

        (userManagerService.listUsers as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.listUsers(tenantId, options);

        // Assert
        expect(result.users.every(u => u.actif)).toBe(true);
      });

      it('should handle empty results', async () => {
        // Arrange
        const tenantId = 'tenant-empty';

        const expectedResult = {
          users: [],
          total: 0,
          page: 1,
          totalPages: 0
        };

        (userManagerService.listUsers as jest.Mock).mockResolvedValue(expectedResult);

        // Act
        const result = await userService.listUsers(tenantId);

        // Assert
        expect(result.users).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    describe('create()', () => {
      it('should create new user', async () => {
        // Arrange
        const userData = {
          firstName: 'New',
          lastName: 'User',
          email: 'new@example.com',
          password: 'HashedPassword123',
          dateOfBirth: new Date('1995-03-20'),
          tenantId: 'tenant-123',
          genderId: 1
        };

        const expectedUser = {
          id: 100,
          ...userData,
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          roleId: 1,
          statusId: 1
        };

        (userManagerService.create as jest.Mock).mockResolvedValue(expectedUser);

        // Act
        const result = await userService.create(userData);

        // Assert
        expect(userManagerService.create).toHaveBeenCalledWith(userData);
        expect(result.id).toBe(100);
        expect(result.email).toBe(userData.email);
      });

      it('should handle creation errors', async () => {
        // Arrange
        const userData = {
          firstName: 'New',
          lastName: 'User',
          email: 'duplicate@example.com',
          password: 'password',
          dateOfBirth: new Date(),
          tenantId: 'tenant-123'
        };

        const error = new Error('Erreur lors de la création de l\'utilisateur: Email already exists');
        (userManagerService.create as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.create(userData)).rejects.toThrow('Email already exists');
      });
    });
  });

  describe('Password Reset Methods (TODO)', () => {

    describe('requestPasswordReset()', () => {
      it('should return TODO success response', async () => {
        // Arrange
        const email = 'user@example.com';
        const tenantId = 'tenant-123';

        // Act
        const result = await userService.requestPasswordReset(email, tenantId);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password reset requested');
      });
    });

    describe('resetPassword()', () => {
      it('should return TODO success response', async () => {
        // Arrange
        const token = 'reset-token';
        const newPassword = 'NewPassword123!';
        const tenantId = 'tenant-123';

        // Act
        const result = await userService.resetPassword(token, newPassword, tenantId);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password reset successful');
      });
    });
  });

  describe('Integration Scenarios', () => {

    it('should handle complete user lifecycle', async () => {
      // Arrange
      const registerData: RegisterUserData = {
        email: 'lifecycle@example.com',
        password: 'Password123!',
        firstName: 'Life',
        lastName: 'Cycle',
        dateOfBirth: new Date('1990-01-01'),
        tenantId: 'tenant-123'
      };

      const authResult: AuthResult = {
        success: true,
        token: 'token',
        user: { id: 1, email: registerData.email, firstName: registerData.firstName, lastName: registerData.lastName, tenantId: registerData.tenantId }
      };

      const userProfile = {
        id: 1,
        firstName: 'Life',
        lastName: 'Cycle',
        email: 'lifecycle@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'tenant-123'
      };

      (authService.register as jest.Mock).mockResolvedValue(authResult);
      (userManagerService.getUserById as jest.Mock).mockResolvedValue(userProfile);
      (userManagerService.updateUser as jest.Mock).mockResolvedValue({ success: true, user: { ...userProfile, firstName: 'Updated' } });
      (userManagerService.deleteUser as jest.Mock).mockResolvedValue({ success: true, message: 'Deleted' });

      // Act & Assert - Register
      const registered = await userService.register(registerData);
      expect(registered.success).toBe(true);

      // Act & Assert - Get
      const fetched = await userService.getUserById(1, 'tenant-123');
      expect(fetched?.id).toBe(1);

      // Act & Assert - Update
      const updated = await userService.updateUser(1, 'tenant-123', { firstName: 'Updated' });
      expect(updated.success).toBe(true);

      // Act & Assert - Delete
      const deleted = await userService.deleteUser(1, 'tenant-123');
      expect(deleted.success).toBe(true);
    });

    it('should maintain tenant isolation across operations', async () => {
      // Arrange
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';
      const email = 'shared@example.com';

      (userManagerService.findByEmail as jest.Mock)
        .mockImplementation((e, t) => {
          if (t === tenant1) return Promise.resolve({ id: 1, tenantId: tenant1, email: e });
          if (t === tenant2) return Promise.resolve({ id: 2, tenantId: tenant2, email: e });
          return Promise.resolve(null);
        });

      // Act
      const user1 = await userService.findByEmail(email, tenant1);
      const user2 = await userService.findByEmail(email, tenant2);

      // Assert
      expect(user1?.tenantId).toBe(tenant1);
      expect(user2?.tenantId).toBe(tenant2);
      expect(user1?.id).not.toBe(user2?.id);
    });
  });

  describe('Error Handling', () => {

    it('should propagate database errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      (userManagerService.findByEmail as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userService.findByEmail('test@example.com', 'tenant-123'))
        .rejects.toThrow('Database connection failed');
    });

    it('should propagate authentication errors', async () => {
      // Arrange
      const error = new Error('Auth service unavailable');
      (authService.login as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userService.login({ email: 'test@example.com', password: 'pass', tenantId: 'tenant-123' }))
        .rejects.toThrow('Auth service unavailable');
    });
  });
});
