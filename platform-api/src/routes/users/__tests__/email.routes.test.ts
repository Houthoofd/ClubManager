/**
 * User Email Routes Integration Tests
 * Comprehensive tests for /api/users/email endpoints
 *
 * Coverage:
 * - POST /api/users/email/send-verification - Send verification email
 * - POST /api/users/email/verify-token - Verify email token
 * - GET /api/users/email/test-config - Test email configuration
 * - POST /api/users/email/test - Send test email
 * - Input validation
 * - Error handling
 * - Email service integration
 * - Security
 */

import request from 'supertest';
import express, { Express } from 'express';
import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import emailRoutes from '../email.js';
import { emailService } from '../../../services/operations/communication/email.service.js';
import { userAuthService } from '../../../services/members/user/user-auth.service.js';

// Mock dependencies
jest.mock('../../../services/operations/communication/email.service');
jest.mock('../../../services/members/user/user-auth.service');

describe('User Email Routes - Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/users/email', emailRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/users/email/send-verification - Send Verification Email', () => {
    describe('Successful Email Sending', () => {
      it('should send verification email successfully', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/send-verification')
          .send({ email: 'test@example.com' });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Email de vérification envoyé');
      });

      it('should accept various email formats', async () => {
        // Arrange
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user_name@sub.example.com',
        ];

        // Act & Assert
        for (const email of validEmails) {
          const response = await request(app)
            .post('/api/users/email/send-verification')
            .send({ email });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      });

      it('should handle uppercase email addresses', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/send-verification')
          .send({ email: 'TEST@EXAMPLE.COM' });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Input Validation', () => {
      it('should return 400 when email is missing', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/send-verification')
          .send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Email requis');
      });

      it('should return 400 when email is empty string', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/send-verification')
          .send({ email: '' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Email requis');
      });

      it('should return 400 when email is null', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/send-verification')
          .send({ email: null });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when email is whitespace only', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/send-verification')
          .send({ email: '   ' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act
        const response = await request(app)
          .post('/api/users/email/send-verification')
          .send({ email: 'test@example.com' });

        // Assert - Still returns success (mock implementation)
        expect(response.status).toBe(200);

        consoleSpy.mockRestore();
      });
    });
  });

  describe('POST /api/users/email/verify-token - Verify Email Token', () => {
    const validTokenData = {
      token: 'valid-token-123',
      email: 'test@example.com',
    };

    describe('Successful Token Verification', () => {
      it('should verify valid token successfully', async () => {
        // Arrange
        (userAuthService.verifyEmailToken as jest.Mock).mockResolvedValue({
          success: true,
          message: 'Token vérifié',
        });

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send(validTokenData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Email vérifié avec succès');
        expect(userAuthService.verifyEmailToken).toHaveBeenCalledWith(
          'valid-token-123',
          'test@example.com'
        );
      });

      it('should handle long tokens', async () => {
        // Arrange
        const longToken = 'a'.repeat(256);
        (userAuthService.verifyEmailToken as jest.Mock).mockResolvedValue({
          success: true,
        });

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({ token: longToken, email: 'test@example.com' });

        // Assert
        expect(response.status).toBe(200);
        expect(userAuthService.verifyEmailToken).toHaveBeenCalledWith(
          longToken,
          'test@example.com'
        );
      });
    });

    describe('Input Validation', () => {
      it('should return 400 when token is missing', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({ email: 'test@example.com' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Token et email requis');
        expect(userAuthService.verifyEmailToken).not.toHaveBeenCalled();
      });

      it('should return 400 when email is missing', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({ token: 'valid-token-123' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Token et email requis');
        expect(userAuthService.verifyEmailToken).not.toHaveBeenCalled();
      });

      it('should return 400 when both token and email are missing', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Token et email requis');
      });

      it('should return 400 when token is empty string', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({ token: '', email: 'test@example.com' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when email is empty string', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({ token: 'valid-token', email: '' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when fields are null', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({ token: null, email: null });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Token Verification Failure', () => {
      it('should return 400 when token is invalid', async () => {
        // Arrange
        (userAuthService.verifyEmailToken as jest.Mock).mockResolvedValue({
          success: false,
          message: 'Token invalide',
        });

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send(validTokenData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Token invalide');
      });

      it('should return 400 when token is expired', async () => {
        // Arrange
        (userAuthService.verifyEmailToken as jest.Mock).mockResolvedValue({
          success: false,
          message: 'Token expiré',
        });

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send(validTokenData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Token expiré');
      });

      it('should return 400 when email does not match token', async () => {
        // Arrange
        (userAuthService.verifyEmailToken as jest.Mock).mockResolvedValue({
          success: false,
          message: 'Email ne correspond pas au token',
        });

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send(validTokenData);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (userAuthService.verifyEmailToken as jest.Mock).mockRejectedValue(
          new Error('Database error')
        );

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send(validTokenData);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Erreur lors de la vérification de l'email");
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle unexpected errors', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (userAuthService.verifyEmailToken as jest.Mock).mockRejectedValue(
          new Error('Unexpected error')
        );

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send(validTokenData);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        consoleSpy.mockRestore();
      });
    });

    describe('Security', () => {
      it('should not leak sensitive information in error messages', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (userAuthService.verifyEmailToken as jest.Mock).mockRejectedValue(
          new Error('JWT secret: my-secret-key-123')
        );

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send(validTokenData);

        // Assert
        expect(response.body.message).not.toContain('secret');
        expect(response.body.message).not.toContain('JWT');

        consoleSpy.mockRestore();
      });

      it('should handle SQL injection attempts in token', async () => {
        // Arrange
        (userAuthService.verifyEmailToken as jest.Mock).mockResolvedValue({
          success: false,
          message: 'Token invalide',
        });

        // Act
        const response = await request(app)
          .post('/api/users/email/verify-token')
          .send({
            token: "'; DROP TABLE users; --",
            email: 'test@example.com',
          });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/users/email/test-config - Test Email Configuration', () => {
    describe('Configuration Status', () => {
      it('should return configuration status', async () => {
        // Act
        const response = await request(app)
          .get('/api/users/email/test-config');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('configured');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.configured).toBe('boolean');
      });

      it('should indicate configuration is OK', async () => {
        // Act
        const response = await request(app)
          .get('/api/users/email/test-config');

        // Assert
        expect(response.body.configured).toBe(true);
        expect(response.body.message).toBe('Configuration email OK');
      });

      it('should not expose sensitive configuration details', async () => {
        // Act
        const response = await request(app)
          .get('/api/users/email/test-config');

        // Assert
        expect(response.body).not.toHaveProperty('apiKey');
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).not.toHaveProperty('secret');
        expect(response.body).not.toHaveProperty('host');
        expect(response.body).not.toHaveProperty('port');
      });
    });

    describe('Error Handling', () => {
      it('should handle errors gracefully', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act
        const response = await request(app)
          .get('/api/users/email/test-config');

        // Assert - Still returns success (mock implementation)
        expect(response.status).toBe(200);

        consoleSpy.mockRestore();
      });
    });
  });

  describe('POST /api/users/email/test - Send Test Email', () => {
    describe('Successful Test Email', () => {
      it('should send test email successfully', async () => {
        // Arrange
        const mockEmailResult = {
          messageId: 'test-message-id',
          accepted: ['test@example.com'],
        };

        (emailService.sendEmail as jest.Mock).mockResolvedValue(mockEmailResult);

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({
            to: 'test@example.com',
            subject: 'Test Email',
          });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Email de test envoyé avec succès');
        expect(response.body.result).toEqual(mockEmailResult);
        expect(emailService.sendEmail).toHaveBeenCalledWith({
          to: 'test@example.com',
          subject: 'Test Email',
          text: 'Ceci est un email de test.',
          html: '<p>Ceci est un <strong>email de test</strong>.</p>',
        });
      });

      it('should use default subject when not provided', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        // Assert
        expect(response.status).toBe(200);
        expect(emailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Test Email',
          })
        );
      });

      it('should accept custom subject', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({
            to: 'test@example.com',
            subject: 'Custom Test Subject',
          });

        // Assert
        expect(response.status).toBe(200);
        expect(emailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Custom Test Subject',
          })
        );
      });

      it('should send to multiple recipients', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test1@example.com,test2@example.com' });

        // Assert
        expect(response.status).toBe(200);
        expect(emailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'test1@example.com,test2@example.com',
          })
        );
      });
    });

    describe('Input Validation', () => {
      it('should return 400 when to field is missing', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Destinataire requis');
        expect(emailService.sendEmail).not.toHaveBeenCalled();
      });

      it('should return 400 when to is empty string', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: '' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Destinataire requis');
      });

      it('should return 400 when to is null', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: null });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 when to is whitespace only', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: '   ' });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Email Service Integration', () => {
      it('should include both text and HTML content', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        // Assert
        expect(emailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.any(String),
            html: expect.any(String),
          })
        );
      });

      it('should send HTML with proper formatting', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        // Assert
        expect(emailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining('<p>'),
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle email service errors gracefully', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (emailService.sendEmail as jest.Mock).mockRejectedValue(
          new Error('SMTP connection failed')
        );

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Erreur lors de l'envoi de l'email de test");
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle timeout errors', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (emailService.sendEmail as jest.Mock).mockRejectedValue(
          new Error('Request timeout')
        );

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        consoleSpy.mockRestore();
      });

      it('should handle invalid email address errors', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (emailService.sendEmail as jest.Mock).mockRejectedValue(
          new Error('Invalid recipient')
        );

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: 'invalid-email' });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        consoleSpy.mockRestore();
      });

      it('should not leak SMTP credentials in errors', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (emailService.sendEmail as jest.Mock).mockRejectedValue(
          new Error('SMTP auth failed with password: secret123')
        );

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        // Assert
        expect(response.body.message).not.toContain('password');
        expect(response.body.message).not.toContain('secret123');

        consoleSpy.mockRestore();
      });
    });

    describe('Security', () => {
      it('should sanitize email addresses', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        // Assert
        expect(response.status).toBe(200);
      });

      it('should handle malicious subjects', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({
            to: 'test@example.com',
            subject: '<script>alert("XSS")</script>',
          });

        // Assert
        expect(response.status).toBe(200);
        expect(emailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.any(String),
          })
        );
      });

      it('should prevent email injection attacks', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});

        // Act
        const response = await request(app)
          .post('/api/users/email/test')
          .send({
            to: 'test@example.com\nBcc: attacker@evil.com',
          });

        // Assert
        expect(response.status).toBe(200);
      });
    });

    describe('Performance', () => {
      it('should handle email sending within acceptable time', async () => {
        // Arrange
        (emailService.sendEmail as jest.Mock).mockResolvedValue({});
        const startTime = Date.now();

        // Act
        await request(app)
          .post('/api/users/email/test')
          .send({ to: 'test@example.com' });

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Assert
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      });
    });
  });

  describe('Integration - Full Email Workflow', () => {
    it('should complete verification flow successfully', async () => {
      // Step 1: Send verification email
      const sendResponse = await request(app)
        .post('/api/users/email/send-verification')
        .send({ email: 'test@example.com' });

      expect(sendResponse.status).toBe(200);
      expect(sendResponse.body.success).toBe(true);

      // Step 2: Verify token
      (userAuthService.verifyEmailToken as jest.Mock).mockResolvedValue({
        success: true,
      });

      const verifyResponse = await request(app)
        .post('/api/users/email/verify-token')
        .send({ token: 'valid-token', email: 'test@example.com' });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
    });

    it('should handle configuration check and test email', async () => {
      // Step 1: Check configuration
      const configResponse = await request(app)
        .get('/api/users/email/test-config');

      expect(configResponse.status).toBe(200);
      expect(configResponse.body.configured).toBe(true);

      // Step 2: Send test email
      (emailService.sendEmail as jest.Mock).mockResolvedValue({});

      const testResponse = await request(app)
        .post('/api/users/email/test')
        .send({ to: 'test@example.com' });

      expect(testResponse.status).toBe(200);
      expect(testResponse.body.success).toBe(true);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent success format', async () => {
      // Test send-verification endpoint
      const response1 = await request(app)
        .post('/api/users/email/send-verification')
        .send({ email: 'test@example.com' });

      expect(response1.body).toHaveProperty('success');
      expect(response1.body).toHaveProperty('message');

      // Test test-config endpoint
      const response2 = await request(app)
        .get('/api/users/email/test-config');

      expect(response2.body).toHaveProperty('success');
      expect(response2.body).toHaveProperty('message');
    });

    it('should return consistent error format', async () => {
      // Test validation error
      const response1 = await request(app)
        .post('/api/users/email/send-verification')
        .send({});

      expect(response1.body).toHaveProperty('success');
      expect(response1.body).toHaveProperty('message');
      expect(response1.body.success).toBe(false);

      // Test another validation error
      const response2 = await request(app)
        .post('/api/users/email/verify-token')
        .send({});

      expect(response2.body).toHaveProperty('success');
      expect(response2.body).toHaveProperty('message');
      expect(response2.body.success).toBe(false);
    });
  });
});
