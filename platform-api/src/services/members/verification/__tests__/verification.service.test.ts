import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { verificationService } from '../verification.service.js';
import { prisma } from '../../../../db/prisma.client.js';
import bcrypt from 'bcrypt';

jest.mock('../../../../db/prisma.client.js', () => ({
  prisma: {
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');

describe('VerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate email verification token', async () => {
      const userId = 1;
      const mockToken = {
        id: 1,
        userId,
        token: 'hashed_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      jest.mocked(bcrypt.hash).mockResolvedValue('hashed_token');
      jest.mocked(prisma.passwordResetToken.create).mockResolvedValue(mockToken);

      const token = await verificationService.generateEmailVerificationToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: 'hashed_token',
          expiresAt: expect.any(Date),
          used: false,
        },
      });
    });

    it('should set expiration to 24 hours', async () => {
      const userId = 1;
      const now = Date.now();

      jest.mocked(bcrypt.hash).mockResolvedValue('hashed_token');
      jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
        id: 1,
        userId,
        token: 'hashed_token',
        expiresAt: new Date(now + 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      });

      await verificationService.generateEmailVerificationToken(userId);

      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should hash token before storing', async () => {
      const userId = 1;

      jest.mocked(bcrypt.hash).mockResolvedValue('hashed_secure_token');
      jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
        id: 1,
        userId,
        token: 'hashed_secure_token',
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
      });

      await verificationService.generateEmailVerificationToken(userId);

      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
    });

    it('should generate unique tokens', async () => {
      const userId = 1;
      const tokens: string[] = [];

      jest.mocked(bcrypt.hash).mockResolvedValue('hashed_token');
      jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
        id: 1,
        userId,
        token: 'hashed_token',
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
      });

      for (let i = 0; i < 5; i++) {
        const token = await verificationService.generateEmailVerificationToken(userId);
        tokens.push(token);
      }

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });

  describe('verifyEmailToken', () => {
    const userId = 1;
    const token = 'verification-token-123';

    describe('Successful Verification', () => {
      it('should verify valid email token', async () => {
        const mockTokenData = {
          id: 1,
          userId,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(bcrypt.compare).mockResolvedValue(true);
        jest.mocked(prisma.passwordResetToken.update).mockResolvedValue(mockTokenData);

        const result = await verificationService.verifyEmailToken(token, userId);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Email vérifié avec succès');
        expect(result.data?.userId).toBe(userId);
      });

      it('should mark token as used after verification', async () => {
        const mockTokenData = {
          id: 1,
          userId,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(bcrypt.compare).mockResolvedValue(true);
        jest.mocked(prisma.passwordResetToken.update).mockResolvedValue(mockTokenData);

        await verificationService.verifyEmailToken(token, userId);

        expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { used: true },
        });
      });
    });

    describe('Invalid Token', () => {
      it('should reject expired token', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

        const result = await verificationService.verifyEmailToken(token, userId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });

      it('should reject already used token', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

        const result = await verificationService.verifyEmailToken(token, userId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });

      it('should reject token with wrong hash', async () => {
        const mockTokenData = {
          id: 1,
          userId,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(bcrypt.compare).mockResolvedValue(false);

        const result = await verificationService.verifyEmailToken(token, userId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide');
      });

      it('should reject token for different user', async () => {
        const mockTokenData = {
          id: 1,
          userId: 999,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

        const result = await verificationService.verifyEmailToken(token, userId);

        expect(result.success).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockRejectedValue(
          new Error('Database error')
        );

        const result = await verificationService.verifyEmailToken(token, userId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Erreur lors de la vérification');
      });

      it('should handle token update errors', async () => {
        const mockTokenData = {
          id: 1,
          userId,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(bcrypt.compare).mockResolvedValue(true);
        jest.mocked(prisma.passwordResetToken.update).mockRejectedValue(
          new Error('Update error')
        );

        const result = await verificationService.verifyEmailToken(token, userId);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('generatePasswordResetToken', () => {
    const email = 'user@example.com';

    describe('Successful Token Generation', () => {
      it('should generate password reset token for existing user', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
        };

        jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
        jest.mocked(bcrypt.hash).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });

        const result = await verificationService.generatePasswordResetToken(email);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Token de réinitialisation généré');
        expect(result.data?.token).toBeDefined();
        expect(result.data?.userId).toBe(1);
      });

      it('should delete existing tokens before creating new one', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
        };

        jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
        jest.mocked(bcrypt.hash).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 2 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });

        await verificationService.generatePasswordResetToken(email);

        expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
          where: { userId: 1 },
        });
      });

      it('should set token expiry to 1 hour', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
        };

        jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
        jest.mocked(bcrypt.hash).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        });

        await verificationService.generatePasswordResetToken(email);

        expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        });
      });
    });

    describe('User Not Found', () => {
      it('should return success even if user not found (security)', async () => {
        jest.mocked(prisma.user.findFirst).mockResolvedValue(null);

        const result = await verificationService.generatePasswordResetToken(email);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Si cet email existe');
        expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      });

      it('should not reveal if email exists', async () => {
        jest.mocked(prisma.user.findFirst).mockResolvedValue(null);

        const result = await verificationService.generatePasswordResetToken(email);

        expect(result.message).not.toContain('utilisateur');
        expect(result.message).not.toContain('trouvé');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        jest.mocked(prisma.user.findFirst).mockRejectedValue(
          new Error('Database error')
        );

        const result = await verificationService.generatePasswordResetToken(email);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Erreur lors de la génération du token');
      });
    });
  });

  describe('verifyPasswordResetToken', () => {
    const token = 'reset-token-123';

    describe('Successful Verification', () => {
      it('should verify valid password reset token', async () => {
        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
          user: {
            id: 1,
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData as any);
        jest.mocked(bcrypt.compare).mockResolvedValue(true);

        const result = await verificationService.verifyPasswordResetToken(token);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Token valide');
        expect(result.data?.userId).toBe(1);
        expect(result.data?.email).toBe('user@example.com');
      });
    });

    describe('Invalid Token', () => {
      it('should reject expired token', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

        const result = await verificationService.verifyPasswordResetToken(token);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });

      it('should reject used token', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

        const result = await verificationService.verifyPasswordResetToken(token);

        expect(result.success).toBe(false);
      });

      it('should reject token with wrong hash', async () => {
        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
          user: {
            id: 1,
            email: 'user@example.com',
          },
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData as any);
        jest.mocked(bcrypt.compare).mockResolvedValue(false);

        const result = await verificationService.verifyPasswordResetToken(token);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockRejectedValue(
          new Error('Database error')
        );

        const result = await verificationService.verifyPasswordResetToken(token);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Erreur lors de la vérification');
      });
    });
  });

  describe('resetPassword', () => {
    const token = 'reset-token-123';
    const newPassword = 'NewPassword123!';

    describe('Successful Password Reset', () => {
      it('should reset password with valid token', async () => {
        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
          user: {
            id: 1,
            email: 'user@example.com',
          },
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData as any);
        jest.mocked(bcrypt.compare).mockResolvedValue(true);
        jest.mocked(bcrypt.hash).mockResolvedValue('hashed_new_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);
        jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 1 });

        const result = await verificationService.resetPassword(token, newPassword);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Mot de passe réinitialisé avec succès');
      });

      it('should hash new password before storing', async () => {
        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
          user: {
            id: 1,
            email: 'user@example.com',
          },
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData as any);
        jest.mocked(bcrypt.compare).mockResolvedValue(true);
        jest.mocked(bcrypt.hash).mockResolvedValue('hashed_new_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);
        jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 1 });

        await verificationService.resetPassword(token, newPassword);

        expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { password: 'hashed_new_password' },
        });
      });

      it('should mark token as used after reset', async () => {
        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
          user: {
            id: 1,
            email: 'user@example.com',
          },
        };

        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData as any);
        jest.mocked(bcrypt.compare).mockResolvedValue(true);
        jest.mocked(bcrypt.hash).mockResolvedValue('hashed_new_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);
        jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 1 });

        await verificationService.resetPassword(token, newPassword);

        expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
          where: { userId: 1 },
          data: { used: true },
        });
      });
    });

    describe('Invalid Token', () => {
      it('should reject invalid token', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

        const result = await verificationService.resetPassword(token, newPassword);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Token invalide');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        jest.mocked(prisma.passwordResetToken.findFirst).mockRejectedValue(
          new Error('Database error')
        );

        const result = await verificationService.resetPassword(token, newPassword);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Erreur lors de la réinitialisation');
      });
    });
  });

  describe('verifyAccount', () => {
    const userId = 1;

    it('should activate user account', async () => {
      jest.mocked(prisma.user.update).mockResolvedValue({ id: userId, actif: true } as any);

      const result = await verificationService.verifyAccount(userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Compte activé avec succès');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { actif: true },
      });
    });

    it('should handle errors gracefully', async () => {
      jest.mocked(prisma.user.update).mockRejectedValue(
        new Error('Database error')
      );

      const result = await verificationService.verifyAccount(userId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de l\'activation du compte');
    });
  });

  describe('validateEmailFormat', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'user123@test.org',
      ];

      validEmails.forEach((email) => {
        const result = verificationService.validateEmailFormat(email);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Format d\'email valide');
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'no-at-sign.com',
        '@no-local-part.com',
        'no-domain@',
        'spaces in@email.com',
        'double@@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = verificationService.validateEmailFormat(email);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Format d\'email invalide');
      });
    });

    it('should reject blocked domains', () => {
      const blockedEmails = [
        'user@tempmail.com',
        'user@10minutemail.com',
      ];

      blockedEmails.forEach((email) => {
        const result = verificationService.validateEmailFormat(email);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Domaine d\'email non autorisé');
      });
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'Secure@Pass2024',
        'MyP@ssw0rd!',
        'C0mpl3x#Pass',
      ];

      strongPasswords.forEach((password) => {
        const result = verificationService.validatePasswordStrength(password);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Mot de passe fort');
      });
    });

    it('should reject password shorter than 8 characters', () => {
      const result = verificationService.validatePasswordStrength('Short1!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Au moins 8 caractères');
    });

    it('should reject password without uppercase', () => {
      const result = verificationService.validatePasswordStrength('password123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Au moins une majuscule');
    });

    it('should reject password without lowercase', () => {
      const result = verificationService.validatePasswordStrength('PASSWORD123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Au moins une minuscule');
    });

    it('should reject password without numbers', () => {
      const result = verificationService.validatePasswordStrength('Password!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Au moins un chiffre');
    });

    it('should reject password without special characters', () => {
      const result = verificationService.validatePasswordStrength('Password123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Au moins un caractère spécial');
    });

    it('should list all missing requirements', () => {
      const result = verificationService.validatePasswordStrength('weak');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Au moins 8 caractères');
      expect(result.message).toContain('Au moins une majuscule');
      expect(result.message).toContain('Au moins un chiffre');
      expect(result.message).toContain('Au moins un caractère spécial');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 5 });

      const result = await verificationService.cleanupExpiredTokens();

      expect(result.success).toBe(true);
      expect(result.message).toBe('5 tokens expirés supprimés');
      expect(result.data?.deletedCount).toBe(5);
    });

    it('should delete tokens with expiresAt in the past', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 3 });

      await verificationService.cleanupExpiredTokens();

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should handle errors gracefully', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockRejectedValue(
        new Error('Database error')
      );

      const result = await verificationService.cleanupExpiredTokens();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors du nettoyage des tokens');
    });

    it('should succeed when no tokens to delete', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });

      const result = await verificationService.cleanupExpiredTokens();

      expect(result.success).toBe(true);
      expect(result.message).toBe('0 tokens expirés supprimés');
      expect(result.data?.deletedCount).toBe(0);
    });
  });

  describe('checkEmailExists', () => {
    it('should return true when email exists', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      } as any);

      const result = await verificationService.checkEmailExists('existing@example.com');

      expect(result.success).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.message).toBe('Email déjà utilisé');
    });

    it('should return false when email does not exist', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const result = await verificationService.checkEmailExists('new@example.com');

      expect(result.success).toBe(true);
      expect(result.exists).toBe(false);
      expect(result.message).toBe('Email disponible');
    });

    it('should handle database errors gracefully', async () => {
      jest.mocked(prisma.user.findFirst).mockRejectedValue(
        new Error('Database error')
      );

      const result = await verificationService.checkEmailExists('user@example.com');

      expect(result.success).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.message).toBe('Erreur lors de la vérification de l\'email');
    });
  });

  describe('checkUsernameExists', () => {
    it('should return true when username exists', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      const result = await verificationService.checkUsernameExists('John Doe');

      expect(result.success).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.message).toBe('Nom d\'utilisateur déjà utilisé');
    });

    it('should return false when username does not exist', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const result = await verificationService.checkUsernameExists('New User');

      expect(result.success).toBe(true);
      expect(result.exists).toBe(false);
      expect(result.message).toBe('Nom d\'utilisateur disponible');
    });

    it('should handle database errors gracefully', async () => {
      jest.mocked(prisma.user.findFirst).mockRejectedValue(
        new Error('Database error')
      );

      const result = await verificationService.checkUsernameExists('John Doe');

      expect(result.success).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.message).toBe('Erreur lors de la vérification du nom d\'utilisateur');
    });
  });

  describe('initiatePasswordReset', () => {
    const email = 'user@example.com';

    it('should initiate password reset for existing user', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed_token');
      jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
        id: 1,
        userId: 1,
        token: 'hashed_token',
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
      });

      const result = await verificationService.initiatePasswordReset(email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email de réinitialisation envoyé');
    });

    it('should return error when user not found', async () => {
      jest.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const result = await verificationService.initiatePasswordReset(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Aucun utilisateur trouvé avec cet email');
    });

    it('should handle errors gracefully', async () => {
      jest.mocked(prisma.user.findFirst).mockRejectedValue(
        new Error('Database error')
      );

      const result = await verificationService.initiatePasswordReset(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de l\'envoi de l\'email de réinitialisation');
    });
  });
});
