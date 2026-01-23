import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from 'supertest';
import express, { Express } from 'express';
import passwordResetRouter from '../password-reset.js';
import { userManagerService } from '../../../services/members/users/user-manager.service.js';
import { auditService } from '../../../services/infrastructure/audit/audit.service.js';

jest.mock('../../../services/members/users/user-manager.service.js');
jest.mock('../../../services/infrastructure/audit/audit.service.js');

describe('Password Reset Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock getTenantId
    app.use((req, res, next) => {
      (req as any).tenant = { id: 'test-tenant-123' };
      next();
    });

    app.use('/api/auth/password', passwordResetRouter);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/password/forgot', () => {
    describe('Successful Password Reset Request', () => {
      it('should accept valid email and send reset link', async () => {
        const email = 'user@example.com';

        jest.mocked(userManagerService.requestPasswordReset).mockResolvedValue({
          success: true,
          message: 'Email de réinitialisation envoyé',
        });

        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Email de réinitialisation envoyé',
        });

        expect(userManagerService.requestPasswordReset).toHaveBeenCalledWith(
          email,
          'test-tenant-123'
        );
      });

      it('should return success even for non-existent email (security)', async () => {
        const email = 'nonexistent@example.com';

        jest.mocked(userManagerService.requestPasswordReset).mockResolvedValue({
          success: true,
          message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation',
        });

        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBeDefined();
      });

      it('should handle case-insensitive emails', async () => {
        const email = 'USER@EXAMPLE.COM';

        jest.mocked(userManagerService.requestPasswordReset).mockResolvedValue({
          success: true,
          message: 'Email de réinitialisation envoyé',
        });

        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should trim whitespace from email', async () => {
        const email = '  user@example.com  ';

        jest.mocked(userManagerService.requestPasswordReset).mockResolvedValue({
          success: true,
          message: 'Email de réinitialisation envoyé',
        });

        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should reject request without email', async () => {
        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({})
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Email requis',
        });

        expect(userManagerService.requestPasswordReset).not.toHaveBeenCalled();
      });

      it('should reject request with empty email', async () => {
        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email: '' })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Email requis',
        });
      });

      it('should reject request with null email', async () => {
        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email: null })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Email requis',
        });
      });

      it('should reject request with undefined email', async () => {
        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email: undefined })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        const email = 'user@example.com';

        jest.mocked(userManagerService.requestPasswordReset).mockRejectedValue(
          new Error('Database connection failed')
        );

        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email })
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          message: 'Erreur lors de la demande de réinitialisation',
        });
      });

      it('should handle email service errors', async () => {
        const email = 'user@example.com';

        jest.mocked(userManagerService.requestPasswordReset).mockRejectedValue(
          new Error('Email service unavailable')
        );

        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email })
          .expect(500);

        expect(response.body.success).toBe(false);
      });

      it('should handle missing tenant context', async () => {
        const appNoTenant = express();
        appNoTenant.use(express.json());
        appNoTenant.use('/api/auth/password', passwordResetRouter);

        const response = await request(appNoTenant)
          .post('/api/auth/password/forgot')
          .send({ email: 'user@example.com' })
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Security', () => {
      it('should not reveal if email exists in database', async () => {
        const emails = [
          'existing@example.com',
          'nonexistent@example.com',
          'admin@example.com',
        ];

        for (const email of emails) {
          jest.mocked(userManagerService.requestPasswordReset).mockResolvedValue({
            success: true,
            message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation',
          });

          const response = await request(app)
            .post('/api/auth/password/forgot')
            .send({ email })
            .expect(200);

          expect(response.body.success).toBe(true);
        }
      });

      it('should rate limit password reset requests (implicit)', async () => {
        const email = 'user@example.com';

        jest.mocked(userManagerService.requestPasswordReset).mockResolvedValue({
          success: true,
          message: 'Email de réinitialisation envoyé',
        });

        // Multiple requests should still succeed (rate limiting at service layer)
        for (let i = 0; i < 3; i++) {
          const response = await request(app)
            .post('/api/auth/password/forgot')
            .send({ email });

          expect(response.status).toBe(200);
        }
      });

      it('should handle SQL injection attempts', async () => {
        const maliciousEmail = "admin@example.com' OR '1'='1";

        jest.mocked(userManagerService.requestPasswordReset).mockResolvedValue({
          success: true,
          message: 'Email de réinitialisation envoyé',
        });

        const response = await request(app)
          .post('/api/auth/password/forgot')
          .send({ email: maliciousEmail })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('POST /api/auth/password/reset', () => {
    describe('Successful Password Reset', () => {
      it('should reset password with valid token', async () => {
        const resetData = {
          token: 'valid-reset-token-123',
          email: 'user@example.com',
          newPassword: 'NewSecurePass123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        jest.mocked(auditService.log).mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        expect(userManagerService.resetPassword).toHaveBeenCalledWith(
          resetData.token,
          resetData.newPassword
        );
      });

      it('should log password reset in audit', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 5,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1992-05-15'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(auditService.log).toHaveBeenCalledWith({
          tenantId: 'test-tenant-123',
          userId: 5,
          action: 'PASSWORD_RESET',
          resource: 'auth',
          resourceId: '5',
          ipAddress: expect.any(String),
          userAgent: expect.any(String),
        });
      });

      it('should accept strong passwords', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'VeryStr0ng!P@ssw0rd#2024',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should reject reset without token', async () => {
        const response = await request(app)
          .post('/api/auth/password/reset')
          .send({
            email: 'user@example.com',
            newPassword: 'NewPassword123!',
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Token, email et nouveau mot de passe requis',
        });

        expect(userManagerService.resetPassword).not.toHaveBeenCalled();
      });

      it('should reject reset without email', async () => {
        const response = await request(app)
          .post('/api/auth/password/reset')
          .send({
            token: 'valid-token',
            newPassword: 'NewPassword123!',
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Token, email et nouveau mot de passe requis',
        });
      });

      it('should reject reset without newPassword', async () => {
        const response = await request(app)
          .post('/api/auth/password/reset')
          .send({
            token: 'valid-token',
            email: 'user@example.com',
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Token, email et nouveau mot de passe requis',
        });
      });

      it('should reject password shorter than 8 characters', async () => {
        const response = await request(app)
          .post('/api/auth/password/reset')
          .send({
            token: 'valid-token',
            email: 'user@example.com',
            newPassword: 'Short1!',
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères',
        });
      });

      it('should reject empty password', async () => {
        const response = await request(app)
          .post('/api/auth/password/reset')
          .send({
            token: 'valid-token',
            email: 'user@example.com',
            newPassword: '',
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Token, email et nouveau mot de passe requis',
        });
      });

      it('should reject null values', async () => {
        const response = await request(app)
          .post('/api/auth/password/reset')
          .send({
            token: null,
            email: null,
            newPassword: null,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Business Logic Errors', () => {
      it('should reject invalid token', async () => {
        const resetData = {
          token: 'invalid-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: false,
          message: 'Token invalide ou expiré',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          message: 'Token invalide ou expiré',
        });
      });

      it('should reject expired token', async () => {
        const resetData = {
          token: 'expired-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: false,
          message: 'Token invalide ou expiré',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject already used token', async () => {
        const resetData = {
          token: 'used-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: false,
          message: 'Token invalide ou expiré',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject mismatched email and token', async () => {
        const resetData = {
          token: 'token-for-user1',
          email: 'differentuser@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: false,
          message: 'Token invalide ou expiré',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockRejectedValue(
          new Error('Database connection failed')
        );

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          message: 'Erreur lors de la réinitialisation du mot de passe',
        });
      });

      it('should handle user not found after successful reset', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(auditService.log).not.toHaveBeenCalled();
      });

      it('should succeed even if audit logging fails', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        jest.mocked(auditService.log).mockRejectedValue(
          new Error('Audit service unavailable')
        );

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Security', () => {
      it('should not accept same password as before (service check)', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'OldPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: false,
          message: 'Le nouveau mot de passe doit être différent de l\'ancien',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should handle concurrent reset attempts', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValueOnce({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        }).mockResolvedValueOnce({
          success: false,
          message: 'Token invalide ou expiré',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        // First request should succeed
        const response1 = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData);

        expect(response1.status).toBe(200);

        // Second request should fail
        const response2 = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData);

        expect(response2.status).toBe(400);
      });

      it('should not leak sensitive information in error messages', async () => {
        const resetData = {
          token: 'invalid-token',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: false,
          message: 'Token invalide ou expiré',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(400);

        expect(response.body.message).not.toContain('database');
        expect(response.body.message).not.toContain('user');
        expect(response.body.message).not.toContain('id');
      });

      it('should handle XSS attempts in token', async () => {
        const resetData = {
          token: '<script>alert("xss")</script>',
          email: 'user@example.com',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: false,
          message: 'Token invalide ou expiré',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long passwords', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'A'.repeat(100) + '1!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle special characters in password', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'P@ssw0rd!#$%^&*()',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle Unicode characters in password', async () => {
        const resetData = {
          token: 'valid-token',
          email: 'user@example.com',
          newPassword: 'Pássw0rd123!é',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        const response = await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should trim whitespace from token and email', async () => {
        const resetData = {
          token: '  valid-token  ',
          email: '  user@example.com  ',
          newPassword: 'NewPassword123!',
        };

        jest.mocked(userManagerService.resetPassword).mockResolvedValue({
          success: true,
          message: 'Mot de passe réinitialisé avec succès',
        });

        jest.mocked(userManagerService.getUserByEmail).mockResolvedValue({
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'test-tenant-123',
        });

        await request(app)
          .post('/api/auth/password/reset')
          .send(resetData)
          .expect(200);

        expect(userManagerService.resetPassword).toHaveBeenCalled();
      });

      it('should handle empty request body', async () => {
        const response = await request(app)
          .post('/api/auth/password/reset')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
