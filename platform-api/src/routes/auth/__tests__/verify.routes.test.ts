import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import verifyRouter from '../verify.js';
import { userManagerService } from '../../../services/members/users/user-manager.service.js';

jest.mock('../../../services/members/users/user-manager.service.js');

describe('GET /api/auth/verify', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth/verify', verifyRouter);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Token Verification', () => {
    it('should verify valid token from Authorization header', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        authenticated: true,
        user: mockUser,
      });

      expect(userManagerService.verifyAuth).toHaveBeenCalledWith('valid.jwt.token');
    });

    it('should verify valid token from cookie', async () => {
      const mockUser = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        dateOfBirth: new Date('1995-05-15'),
        actif: true,
        tenantId: 'test-tenant-456',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Cookie', ['token=cookie.jwt.token'])
        .expect(200);

      expect(response.body).toEqual({
        authenticated: true,
        user: mockUser,
      });

      expect(userManagerService.verifyAuth).toHaveBeenCalledWith('cookie.jwt.token');
    });

    it('should return authenticated true with complete user data', async () => {
      const mockUser = {
        id: 3,
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        dateOfBirth: new Date('1988-12-20'),
        actif: true,
        tenantId: 'test-tenant-789',
        statusId: 1,
        gradeId: 2,
        genderId: 1,
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toEqual(mockUser);
      expect(response.body.user.id).toBe(3);
      expect(response.body.user.email).toBe('bob@example.com');
    });

    it('should prioritize Authorization header over cookie', async () => {
      const mockUser = {
        id: 4,
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice@example.com',
        dateOfBirth: new Date('1992-03-10'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer header.jwt.token')
        .set('Cookie', ['token=cookie.jwt.token'])
        .expect(200);

      expect(response.body.authenticated).toBe(true);
      expect(userManagerService.verifyAuth).toHaveBeenCalledWith('header.jwt.token');
    });

    it('should handle Bearer prefix correctly', async () => {
      const mockUser = {
        id: 5,
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie@example.com',
        dateOfBirth: new Date('1985-07-25'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer token.with.bearer.prefix')
        .expect(200);

      expect(response.body.authenticated).toBe(true);
      expect(userManagerService.verifyAuth).toHaveBeenCalledWith('token.with.bearer.prefix');
    });
  });

  describe('Missing Token', () => {
    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token manquant',
      });

      expect(userManagerService.verifyAuth).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is empty', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', '')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token manquant',
      });
    });

    it('should return 401 when Authorization header is just "Bearer"', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token manquant',
      });
    });

    it('should return 401 when cookie is empty', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Cookie', ['token='])
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token manquant',
      });
    });

    it('should return 401 when no authentication method provided', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
      expect(response.body.error).toBe('Token manquant');
    });
  });

  describe('Invalid Token', () => {
    it('should return 401 for invalid token', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token invalide',
      });
    });

    it('should return 401 for expired token', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token expiré',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer expired.token')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token expiré',
      });
    });

    it('should return 401 for malformed token', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token malformé',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer malformed')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token malformé',
      });
    });

    it('should return 401 for tampered token', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Signature invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer tampered.jwt.token')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 when user not found', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Utilisateur non trouvé',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.but.user.deleted')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Utilisateur non trouvé',
      });
    });

    it('should return 401 when user is inactive', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Compte désactivé',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer inactive.user.token')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Compte désactivé',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      jest.mocked(userManagerService.verifyAuth).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.token')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Erreur de vérification du token',
      });
    });

    it('should handle JWT verification errors', async () => {
      jest.mocked(userManagerService.verifyAuth).mockRejectedValue(
        new Error('JsonWebTokenError')
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer bad.jwt.token')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
      expect(response.body.error).toBe('Erreur de vérification du token');
    });

    it('should handle token expired errors', async () => {
      jest.mocked(userManagerService.verifyAuth).mockRejectedValue(
        new Error('TokenExpiredError')
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer expired.token')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });

    it('should handle null user in successful response', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.token')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });

    it('should handle unexpected service responses', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: null as any,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.token')
        .expect(200);

      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toBeNull();
    });
  });

  describe('Security', () => {
    it('should not leak sensitive information in errors', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      expect(response.body.error).not.toContain('database');
      expect(response.body.error).not.toContain('secret');
      expect(response.body.error).not.toContain('key');
    });

    it('should not return password in user object', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.token')
        .expect(200);

      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should handle SQL injection attempts in token', async () => {
      const maliciousToken = "' OR '1'='1";

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${maliciousToken}`)
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });

    it('should handle XSS attempts in token', async () => {
      const xssToken = '<script>alert("xss")</script>';

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${xssToken}`)
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });

    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(10000);

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${longToken}`)
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });

    it('should validate token signature', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Signature invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.token.invalidsignature')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Signature invalide',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle Authorization header without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'token.without.bearer')
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token manquant',
      });
    });

    it('should handle multiple Bearer keywords', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer Bearer token')
        .expect(200);

      expect(response.body.authenticated).toBe(true);
    });

    it('should handle token with spaces', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer token with spaces')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });

    it('should handle token with special characters', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer token!@#$%^&*()')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });

    it('should handle case-insensitive Bearer keyword', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Note: Express is case-sensitive by default, so this might fail
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'bearer valid.token')
        .expect(401);

      // Should fail because "bearer" is lowercase
      expect(response.body.authenticated).toBe(false);
    });

    it('should handle undefined cookie value', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Cookie', ['other=value'])
        .expect(401);

      expect(response.body).toEqual({
        authenticated: false,
        error: 'Token manquant',
      });
    });

    it('should handle multiple cookies', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Cookie', ['sessionId=123', 'token=valid.jwt.token', 'other=value'])
        .expect(200);

      expect(response.body.authenticated).toBe(true);
    });

    it('should handle empty user object from service', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: {} as any,
      });

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.token')
        .expect(200);

      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toEqual({});
    });

    it('should handle service returning success without user', async () => {
      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: false,
        error: 'Token invalide',
      } as any);

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer valid.token')
        .expect(401);

      expect(response.body.authenticated).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent verification requests', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const requests = Array(10)
        .fill(null)
        .map((_, i) =>
          request(app)
            .get('/api/auth/verify')
            .set('Authorization', `Bearer token${i}`)
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.authenticated).toBe(true);
      });
    });

    it('should not cache verification results', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // First request
      await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer token1')
        .expect(200);

      // Second request should also call service
      await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer token1')
        .expect(200);

      expect(userManagerService.verifyAuth).toHaveBeenCalledTimes(2);
    });
  });

  describe('Different Token Sources', () => {
    it('should extract token from Authorization header with Bearer', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer header.token')
        .expect(200);

      expect(userManagerService.verifyAuth).toHaveBeenCalledWith('header.token');
    });

    it('should extract token from cookie when no Authorization header', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      await request(app)
        .get('/api/auth/verify')
        .set('Cookie', ['token=cookie.token'])
        .expect(200);

      expect(userManagerService.verifyAuth).toHaveBeenCalledWith('cookie.token');
    });

    it('should prefer Authorization header when both provided', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'test-tenant-123',
      };

      jest.mocked(userManagerService.verifyAuth).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer header.token')
        .set('Cookie', ['token=cookie.token'])
        .expect(200);

      expect(userManagerService.verifyAuth).toHaveBeenCalledWith('header.token');
      expect(userManagerService.verifyAuth).not.toHaveBeenCalledWith('cookie.token');
    });
  });
});
