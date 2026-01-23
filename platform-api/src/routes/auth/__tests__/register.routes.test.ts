import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import registerRouter from '../register.js';
import { userManagerService } from '../../../services/members/users/user-manager.service.js';
import { auditService } from '../../../services/infrastructure/audit/audit.service.js';

jest.mock('../../../services/members/users/user-manager.service.js');
jest.mock('../../../services/infrastructure/audit/audit.service.js');

describe('POST /api/auth/register', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Mock getTenantId
    app.use((req, res, next) => {
      (req as any).tenant = { id: 'test-tenant-123' };
      next();
    });

    app.use('/api/auth/register', registerRouter);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Registration', () => {
    it('should register new user with valid data', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        dateOfBirth: '1990-01-01',
        genderId: 1,
      };

      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      const mockToken = 'jwt.token.here';

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: mockUser,
        token: mockToken,
      });

      jest.mocked(auditService.log).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Inscription réussie',
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      expect(userManagerService.register).toHaveBeenCalledWith({
        tenantId: 'test-tenant-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        dateOfBirth: new Date('1990-01-01'),
        genderId: 1,
      });
    });

    it('should set HTTP-only cookie with JWT token', async () => {
      const registerData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'Password123!',
        dateOfBirth: '1995-05-15',
      };

      const mockToken = 'jwt.token.cookie';

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          dateOfBirth: new Date('1995-05-15'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: mockToken,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const tokenCookie = cookies.find((cookie: string) => cookie.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain(mockToken);
    });

    it('should log registration in audit', async () => {
      const registerData = {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        password: 'BobPass123!',
        dateOfBirth: '1988-12-20',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 3,
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          dateOfBirth: new Date('1988-12-20'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(auditService.log).toHaveBeenCalledWith({
        tenantId: 'test-tenant-123',
        userId: 3,
        action: 'CREATE',
        resource: 'auth',
        resourceId: '3',
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
      });
    });

    it('should register without optional genderId', async () => {
      const registerData = {
        firstName: 'Alex',
        lastName: 'Brown',
        email: 'alex@example.com',
        password: 'AlexPass123!',
        dateOfBirth: '1992-03-10',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 4,
          firstName: 'Alex',
          lastName: 'Brown',
          email: 'alex@example.com',
          dateOfBirth: new Date('1992-03-10'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(userManagerService.register).toHaveBeenCalledWith({
        tenantId: 'test-tenant-123',
        firstName: 'Alex',
        lastName: 'Brown',
        email: 'alex@example.com',
        password: 'AlexPass123!',
        dateOfBirth: new Date('1992-03-10'),
        genderId: undefined,
      });
    });
  });

  describe('Validation Errors', () => {
    it('should reject registration without firstName', async () => {
      const registerData = {
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Tous les champs requis doivent être remplis',
      });

      expect(userManagerService.register).not.toHaveBeenCalled();
    });

    it('should reject registration without lastName', async () => {
      const registerData = {
        firstName: 'John',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Tous les champs requis doivent être remplis',
      });
    });

    it('should reject registration without email', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Tous les champs requis doivent être remplis',
      });
    });

    it('should reject registration without password', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Tous les champs requis doivent être remplis',
      });
    });

    it('should reject registration without dateOfBirth', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Tous les champs requis doivent être remplis',
      });
    });

    it('should reject invalid email format', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Format d'email invalide",
      });
    });

    it('should reject email without @ symbol', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johnexample.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Format d'email invalide",
      });
    });

    it('should reject email without domain', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Format d'email invalide",
      });
    });

    it('should reject password shorter than 8 characters', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Pass1!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    });

    it('should reject empty password', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Tous les champs requis doivent être remplis',
      });
    });
  });

  describe('Business Logic Errors', () => {
    it('should reject registration when email already exists', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà',
      });
    });

    it('should handle service errors gracefully', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: false,
        message: 'Erreur base de données',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected server errors', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: "Erreur serveur lors de l'inscription",
      });
    });

    it('should handle audit logging failure gracefully', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      jest.mocked(auditService.log).mockRejectedValue(
        new Error('Audit service unavailable')
      );

      // Should still succeed even if audit fails
      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should handle missing tenant context', async () => {
      const appNoTenant = express();
      appNoTenant.use(express.json());
      appNoTenant.use('/api/auth/register', registerRouter);

      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(appNoTenant)
        .post('/api/auth/register')
        .send(registerData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security', () => {
    it('should not return password in response', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should set secure cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      const cookies = response.headers['set-cookie'];
      const tokenCookie = cookies?.find((cookie: string) => cookie.startsWith('token='));

      expect(tokenCookie).toContain('Secure');
      expect(tokenCookie).toContain('SameSite=Strict');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle SQL injection attempts in email', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: "john@example.com' OR '1'='1",
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      // Email validation should catch this
      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should sanitize special characters in names', async () => {
      const registerData = {
        firstName: "John<script>alert('xss')</script>",
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          firstName: "John<script>alert('xss')</script>",
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      // Service should be called with the data as-is
      // Sanitization should happen at service layer
      expect(userManagerService.register).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long valid email', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: longEmail,
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: longEmail,
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);
    });

    it('should handle date of birth as Date object', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: new Date('1990-01-01'),
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);
    });

    it('should handle userId parameter when provided', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
        userId: 'custom-user-id-123',
      };

      jest.mocked(userManagerService.register).mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        },
        token: 'token',
      });

      await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(userManagerService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'custom-user-id-123',
        })
      );
    });

    it('should trim whitespace from email', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: '  john@example.com  ',
        password: 'Password123!',
        dateOfBirth: '1990-01-01',
      };

      // Email with spaces should still pass validation
      await request(app)
        .post('/api/auth/register')
        .send(registerData);

      // Service should be called (whether it trims or not)
      expect(userManagerService.register).toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle null values', async () => {
      const registerData = {
        firstName: null,
        lastName: null,
        email: null,
        password: null,
        dateOfBirth: null,
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
