import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from 'supertest';
import express, { Express } from 'express';
import profileRouter from '../profile.js';
import { userManagerService } from '../../../services/members/users/user-manager.service.js';
import { auditService } from '../../../services/infrastructure/audit/audit.service.js';

jest.mock('../../../services/members/users/user-manager.service.js');
jest.mock('../../../services/infrastructure/audit/audit.service.js');

describe('Profile Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock getTenantId and authentication
    app.use((req, res, next) => {
      (req as any).tenant = { id: 'test-tenant-123' };
      (req as any).user = {
        id: 1,
        email: 'user@example.com',
        tenantId: 'test-tenant-123',
      };
      next();
    });

    app.use('/api/auth', profileRouter);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/auth/me', () => {
    describe('Successful Profile Retrieval', () => {
      it('should return current user profile', async () => {
        const mockProfile = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
          statusId: 1,
          gradeId: 2,
          genderId: 1,
        };

        jest.mocked(userManagerService.getUserById).mockResolvedValue(mockProfile);

        const response = await request(app)
          .get('/api/auth/me')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { user: mockProfile },
        });

        expect(userManagerService.getUserById).toHaveBeenCalledWith(
          1,
          'test-tenant-123'
        );
      });

      it('should return complete user profile with all fields', async () => {
        const mockProfile = {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          dateOfBirth: new Date('1995-05-15'),
          actif: true,
          tenantId: 'test-tenant-123',
          statusId: 2,
          gradeId: 3,
          genderId: 2,
          phone: '+33612345678',
          address: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
        };

        jest.mocked(userManagerService.getUserById).mockResolvedValue(mockProfile);

        const response = await request(app)
          .get('/api/auth/me')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toEqual(mockProfile);
        expect(response.body.data.user.email).toBe('jane@example.com');
      });

      it('should not return password in profile', async () => {
        const mockProfile = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        };

        jest.mocked(userManagerService.getUserById).mockResolvedValue(mockProfile);

        const response = await request(app)
          .get('/api/auth/me')
          .expect(200);

        expect(response.body.data.user).not.toHaveProperty('password');
        expect(response.body.data.user).not.toHaveProperty('passwordHash');
      });

      it('should use authenticated user ID', async () => {
        const mockProfile = {
          id: 5,
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@example.com',
          dateOfBirth: new Date('1988-12-20'),
          actif: true,
          tenantId: 'test-tenant-123',
        };

        // Update user in request
        app.use((req, res, next) => {
          (req as any).user = { id: 5, email: 'bob@example.com', tenantId: 'test-tenant-123' };
          next();
        });

        jest.mocked(userManagerService.getUserById).mockResolvedValue(mockProfile);

        const response = await request(app)
          .get('/api/auth/me')
          .expect(200);

        expect(userManagerService.getUserById).toHaveBeenCalledWith(
          5,
          'test-tenant-123'
        );
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when user is not authenticated', async () => {
        const appNoAuth = express();
        appNoAuth.use(express.json());
        appNoAuth.use((req, res, next) => {
          (req as any).tenant = { id: 'test-tenant-123' };
          next();
        });
        appNoAuth.use('/api/auth', profileRouter);

        const response = await request(appNoAuth)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          message: 'Non authentifié',
        });

        expect(userManagerService.getUserById).not.toHaveBeenCalled();
      });

      it('should return 401 when user ID is missing', async () => {
        const appNoUserId = express();
        appNoUserId.use(express.json());
        appNoUserId.use((req, res, next) => {
          (req as any).tenant = { id: 'test-tenant-123' };
          (req as any).user = { email: 'user@example.com' };
          next();
        });
        appNoUserId.use('/api/auth', profileRouter);

        const response = await request(appNoUserId)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Non authentifié');
      });

      it('should return 401 when user object is null', async () => {
        const appNullUser = express();
        appNullUser.use(express.json());
        appNullUser.use((req, res, next) => {
          (req as any).tenant = { id: 'test-tenant-123' };
          (req as any).user = null;
          next();
        });
        appNullUser.use('/api/auth', profileRouter);

        const response = await request(appNullUser)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('User Not Found', () => {
      it('should return 404 when user profile not found', async () => {
        jest.mocked(userManagerService.getUserById).mockResolvedValue(null);

        const response = await request(app)
          .get('/api/auth/me')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      });

      it('should return 404 when user deleted', async () => {
        jest.mocked(userManagerService.getUserById).mockResolvedValue(null);

        const response = await request(app)
          .get('/api/auth/me')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('non trouvé');
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        jest.mocked(userManagerService.getUserById).mockRejectedValue(
          new Error('Database connection failed')
        );

        const response = await request(app)
          .get('/api/auth/me')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          message: 'Erreur lors de la récupération du profil',
        });
      });

      it('should handle database errors', async () => {
        jest.mocked(userManagerService.getUserById).mockRejectedValue(
          new Error('Query timeout')
        );

        const response = await request(app)
          .get('/api/auth/me')
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/auth/profile', () => {
    describe('Successful Profile Update', () => {
      it('should update user profile with valid data', async () => {
        const updateData = {
          firstName: 'John',
          lastName: 'Doe Updated',
          dateOfBirth: '1990-01-01',
          genderId: 1,
        };

        const mockUpdatedUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe Updated',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
          genderId: 1,
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour avec succès',
          user: mockUpdatedUser,
        });

        jest.mocked(auditService.log).mockResolvedValue(undefined);

        const response = await request(app)
          .put('/api/auth/profile')
          .send(updateData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Profil mis à jour avec succès',
          data: { user: mockUpdatedUser },
        });

        expect(userManagerService.updateUser).toHaveBeenCalledWith(
          1,
          'test-tenant-123',
          {
            firstName: 'John',
            lastName: 'Doe Updated',
            dateOfBirth: new Date('1990-01-01'),
          }
        );
      });

      it('should log profile update in audit', async () => {
        const updateData = {
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1995-05-15',
          genderId: 2,
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            dateOfBirth: new Date('1995-05-15'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        await request(app)
          .put('/api/auth/profile')
          .send(updateData)
          .expect(200);

        expect(auditService.log).toHaveBeenCalledWith({
          tenantId: 'test-tenant-123',
          userId: 1,
          action: 'UPDATE',
          resource: 'user_profile',
          resourceId: '1',
          changes: updateData,
          ipAddress: expect.any(String),
          userAgent: expect.any(String),
        });
      });

      it('should update only firstName', async () => {
        const updateData = {
          firstName: 'NewFirstName',
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'NewFirstName',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.firstName).toBe('NewFirstName');
      });

      it('should update only lastName', async () => {
        const updateData = {
          lastName: 'NewLastName',
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'NewLastName',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send(updateData)
          .expect(200);

        expect(response.body.data.user.lastName).toBe('NewLastName');
      });

      it('should update dateOfBirth', async () => {
        const updateData = {
          dateOfBirth: '1992-06-15',
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1992-06-15'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle empty update (no changes)', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Authentication Errors', () => {
      it('should return 401 when user is not authenticated', async () => {
        const appNoAuth = express();
        appNoAuth.use(express.json());
        appNoAuth.use((req, res, next) => {
          (req as any).tenant = { id: 'test-tenant-123' };
          next();
        });
        appNoAuth.use('/api/auth', profileRouter);

        const response = await request(appNoAuth)
          .put('/api/auth/profile')
          .send({ firstName: 'John' })
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          message: 'Non authentifié',
        });

        expect(userManagerService.updateUser).not.toHaveBeenCalled();
      });

      it('should return 401 when user ID is missing', async () => {
        const appNoUserId = express();
        appNoUserId.use(express.json());
        appNoUserId.use((req, res, next) => {
          (req as any).tenant = { id: 'test-tenant-123' };
          (req as any).user = { email: 'user@example.com' };
          next();
        });
        appNoUserId.use('/api/auth', profileRouter);

        const response = await request(appNoUserId)
          .put('/api/auth/profile')
          .send({ firstName: 'John' })
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Validation Errors', () => {
      it('should reject update when service validation fails', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: false,
          message: 'Données invalides',
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ firstName: '' })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Données invalides',
        });
      });

      it('should handle invalid date format', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: false,
          message: 'Format de date invalide',
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ dateOfBirth: 'invalid-date' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        jest.mocked(userManagerService.updateUser).mockRejectedValue(
          new Error('Database connection failed')
        );

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ firstName: 'John' })
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          message: 'Erreur lors de la mise à jour du profil',
        });
      });

      it('should succeed even if audit logging fails', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        jest.mocked(auditService.log).mockRejectedValue(
          new Error('Audit service unavailable')
        );

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ firstName: 'John' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle database constraint errors', async () => {
        jest.mocked(userManagerService.updateUser).mockRejectedValue(
          new Error('Unique constraint violation')
        );

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ firstName: 'John' })
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Security', () => {
      it('should not allow updating email', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ email: 'newemail@example.com' })
          .expect(200);

        // Email should not be passed to updateUser
        expect(userManagerService.updateUser).toHaveBeenCalledWith(
          1,
          'test-tenant-123',
          expect.not.objectContaining({ email: 'newemail@example.com' })
        );
      });

      it('should not allow updating user ID', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        await request(app)
          .put('/api/auth/profile')
          .send({ id: 999, firstName: 'John' })
          .expect(200);

        // Should use authenticated user ID, not the one from body
        expect(userManagerService.updateUser).toHaveBeenCalledWith(
          1,
          'test-tenant-123',
          expect.any(Object)
        );
      });

      it('should not allow updating tenantId', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        await request(app)
          .put('/api/auth/profile')
          .send({ tenantId: 'different-tenant', firstName: 'John' })
          .expect(200);

        expect(userManagerService.updateUser).toHaveBeenCalledWith(
          1,
          'test-tenant-123',
          expect.not.objectContaining({ tenantId: 'different-tenant' })
        );
      });

      it('should handle XSS attempts in names', async () => {
        const xssData = {
          firstName: '<script>alert("xss")</script>',
          lastName: '<img src=x onerror=alert("xss")>',
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: xssData.firstName,
            lastName: xssData.lastName,
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send(xssData)
          .expect(200);

        expect(response.body.success).toBe(true);
        // Service should handle sanitization
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long names', async () => {
        const longName = 'A'.repeat(500);

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: false,
          message: 'Nom trop long',
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ firstName: longName })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should handle special characters in names', async () => {
        const specialData = {
          firstName: "Jean-François",
          lastName: "O'Connor",
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: specialData.firstName,
            lastName: specialData.lastName,
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send(specialData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle Unicode characters in names', async () => {
        const unicodeData = {
          firstName: '李明',
          lastName: 'محمد',
        };

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: unicodeData.firstName,
            lastName: unicodeData.lastName,
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send(unicodeData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle null values', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ firstName: null, lastName: null })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle future dates for dateOfBirth', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: false,
          message: 'Date de naissance invalide',
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ dateOfBirth: futureDate.toISOString() })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should handle very old dates for dateOfBirth', async () => {
        const oldDate = '1850-01-01';

        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: false,
          message: 'Date de naissance invalide',
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .send({ dateOfBirth: oldDate })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should handle undefined dateOfBirth', async () => {
        jest.mocked(userManagerService.updateUser).mockResolvedValue({
          success: true,
          message: 'Profil mis à jour',
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            dateOfBirth: new Date('1990-01-01'),
            actif: true,
            tenantId: 'test-tenant-123',
          },
        });

        await request(app)
          .put('/api/auth/profile')
          .send({ firstName: 'John' })
          .expect(200);

        expect(userManagerService.updateUser).toHaveBeenCalledWith(
          1,
          'test-tenant-123',
          expect.objectContaining({
            dateOfBirth: undefined,
          })
        );
      });
    });
  });
});
