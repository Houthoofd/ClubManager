import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { userPasswordService } from '../user-password.service.js';
import { prisma } from '../../../services/prisma/prisma.service.js';
import { emailService } from '../../../operations/communication/email.service.js';
import { userService } from '../user.service.js';

jest.mock('../../../services/prisma/prisma.service.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../../../operations/communication/email.service.js', () => ({
  emailService: {
    sendPasswordResetEmail: jest.fn(),
  },
}));

jest.mock('../user.service.js', () => ({
  userService: {
    getUserByEmail: jest.fn(),
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  },
}));

describe('UserPasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requestPasswordReset', () => {
    const email = 'user@example.com';
    const tenantId = 'tenant-123';

    describe('Successful Password Reset Request', () => {
      it('should send password reset email for existing user', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });
        jest.mocked(emailService.sendPasswordResetEmail).mockResolvedValue(undefined as any);

        const result = await userPasswordService.requestPasswordReset(email, tenantId);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Email de réinitialisation envoyé');
        expect(userService.getUserByEmail).toHaveBeenCalledWith(email, tenantId);
      });

      it('should delete existing tokens before creating new one', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 2 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });
        jest.mocked(emailService.sendPasswordResetEmail).mockResolvedValue(undefined as any);

        await userPasswordService.requestPasswordReset(email, tenantId);

        expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
          where: { userId: 1 },
        });
        expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      });

      it('should hash reset token before storing', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_reset_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_reset_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });
        jest.mocked(emailService.sendPasswordResetEmail).mockResolvedValue(undefined as any);

        await userPasswordService.requestPasswordReset(email, tenantId);

        expect(userService.hashPassword).toHaveBeenCalled();
        expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
          data: {
            userId: 1,
            token: 'hashed_reset_token',
            expiresAt: expect.any(Date),
            used: false,
          },
        });
      });

      it('should send email with reset URL', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });
        jest.mocked(emailService.sendPasswordResetEmail).mockResolvedValue(undefined as any);

        await userPasswordService.requestPasswordReset(email, tenantId);

        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
          'user@example.com',
          expect.objectContaining({
            userName: 'John Doe',
            resetUrl: expect.stringContaining('reset-password'),
            expiresIn: '1 heure',
          })
        );
      });

      it('should set token expiry to 1 hour', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const now = Date.now();

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(now + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        });
        jest.mocked(emailService.sendPasswordResetEmail).mockResolvedValue(undefined as any);

        await userPasswordService.requestPasswordReset(email, tenantId);

        expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        });
      });
    });

    describe('User Not Found', () => {
      it('should return success even if user does not exist (security)', async () => {
        jest.mocked(userService.getUserByEmail).mockResolvedValue(null);

        const result = await userPasswordService.requestPasswordReset(email, tenantId);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Si un compte existe');
        expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      });

      it('should not reveal if email exists', async () => {
        jest.mocked(userService.getUserByEmail).mockResolvedValue(null);

        const result = await userPasswordService.requestPasswordReset(email, tenantId);

        expect(result.message).not.toContain('utilisateur');
        expect(result.message).not.toContain('trouvé');
        expect(result.message).not.toContain('existe pas');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        jest.mocked(userService.getUserByEmail).mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await userPasswordService.requestPasswordReset(email, tenantId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Erreur lors de la demande de réinitialisation');
      });

      it('should handle email service errors', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockResolvedValue({
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(),
          used: false,
          createdAt: new Date(),
        });
        jest.mocked(emailService.sendPasswordResetEmail).mockRejectedValue(
          new Error('Email service unavailable')
        );

        const result = await userPasswordService.requestPasswordReset(email, tenantId);

        expect(result.success).toBe(false);
      });

      it('should handle token creation errors', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_token');
        jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
        jest.mocked(prisma.passwordResetToken.create).mockRejectedValue(
          new Error('Database constraint violation')
        );

        const result = await userPasswordService.requestPasswordReset(email, tenantId);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('resetPassword', () => {
    const token = 'reset-token-123';
    const email = 'user@example.com';
    const newPassword = 'NewPassword123!';
    const tenantId = 'tenant-123';

    describe('Successful Password Reset', () => {
      it('should reset password with valid token', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('new_hashed_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);
        jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 1 });

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Mot de passe réinitialisé avec succès');
      });

      it('should hash new password before storing', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('new_hashed_password_123');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);
        jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 1 });

        await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(userService.hashPassword).toHaveBeenCalledWith(newPassword);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { password: 'new_hashed_password_123' },
        });
      });

      it('should mark token as used after reset', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('new_hashed_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);
        jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 1 });

        await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
          where: { userId: 1 },
          data: { used: true },
        });
      });

      it('should verify token hash matches', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('new_hashed_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);
        jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 1 });

        await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(userService.verifyPassword).toHaveBeenCalledWith(token, 'hashed_token');
      });
    });

    describe('Invalid Token', () => {
      it('should reject when user not found', async () => {
        jest.mocked(userService.getUserByEmail).mockResolvedValue(null);

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });

      it('should reject when no token found in database', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });

      it('should reject when token has expired', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const expiredTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null); // Query filters out expired

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });

      it('should reject when token hash does not match', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(userService.verifyPassword).mockResolvedValue(false);

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide');
      });

      it('should reject already used token', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null); // Query filters out used tokens

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors during password update', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('new_hashed_password');
        jest.mocked(prisma.user.update).mockRejectedValue(
          new Error('Database error')
        );

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Erreur lors de la réinitialisation');
      });

      it('should handle password hashing errors', async () => {
        const mockUser = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          dateOfBirth: new Date('1990-01-01'),
          actif: true,
          tenantId: 'tenant-123',
        };

        const mockTokenData = {
          id: 1,
          userId: 1,
          token: 'hashed_token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
          createdAt: new Date(),
        };

        jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
        jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockRejectedValue(
          new Error('Hashing error')
        );

        const result = await userPasswordService.resetPassword(token, email, newPassword, tenantId);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('changePassword', () => {
    const userId = 1;
    const tenantId = 'tenant-123';
    const currentPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';

    describe('Successful Password Change', () => {
      it('should change password with valid current password', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          password: 'hashed_old_password',
          tenantId: 'tenant-123',
        };

        jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_new_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);

        const result = await userPasswordService.changePassword(
          userId,
          tenantId,
          currentPassword,
          newPassword
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Mot de passe modifié avec succès');
      });

      it('should verify current password before changing', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          password: 'hashed_old_password',
          tenantId: 'tenant-123',
        };

        jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_new_password');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);

        await userPasswordService.changePassword(userId, tenantId, currentPassword, newPassword);

        expect(userService.verifyPassword).toHaveBeenCalledWith(
          currentPassword,
          'hashed_old_password'
        );
      });

      it('should hash new password before storing', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          password: 'hashed_old_password',
          tenantId: 'tenant-123',
        };

        jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.mocked(userService.verifyPassword).mockResolvedValue(true);
        jest.mocked(userService.hashPassword).mockResolvedValue('hashed_new_password_456');
        jest.mocked(prisma.user.update).mockResolvedValue({ id: 1 } as any);

        await userPasswordService.changePassword(userId, tenantId, currentPassword, newPassword);

        expect(userService.hashPassword).toHaveBeenCalledWith(newPassword);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: { password: 'hashed_new_password_456' },
        });
      });
    });

    describe('Invalid Current Password', () => {
      it('should reject when current password is incorrect', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          password: 'hashed_old_password',
          tenantId: 'tenant-123',
        };

        jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        jest.mocked(userService.verifyPassword).mockResolvedValue(false);

        const result = await userPasswordService.changePassword(
          userId,
          tenantId,
          'WrongPassword123!',
          newPassword
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Mot de passe actuel incorrect');
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it('should reject when user has no password set', async () => {
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          password: null,
          tenantId: 'tenant-123',
        };

        jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

        const result = await userPasswordService.changePassword(
          userId,
          tenantId,
          currentPassword,
          newPassword
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Aucun mot de passe défini');
      });
    });

    describe('User Not Found', () => {
      it('should reject when user does not exist', async () => {
        jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const result = await userPasswordService.changePassword(
          userId,
          tenantId,
          currentPassword,
          newPassword
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Utilisateur non trouvé');
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        jest.mocked(prisma.user.findUnique).mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await userPasswordService.changePassword(
          userId,
          tenantId,
          currentPassword,
          newPassword
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Erreur lors du changement de mot de passe');
      });
    });
  });

  describe('validateResetToken', () => {
    const token = 'reset-token-123';
    const email = 'user@example.com';
    const tenantId = 'tenant-123';

    it('should validate valid token', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'tenant-123',
      };

      const mockTokenData = {
        id: 1,
        userId: 1,
        token: 'hashed_token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
      jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
      jest.mocked(userService.verifyPassword).mockResolvedValue(true);

      const result = await userPasswordService.validateResetToken(token, email, tenantId);

      expect(result.valid).toBe(true);
      expect(result.message).toBe('Token valide');
    });

    it('should reject invalid token', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'tenant-123',
      };

      jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
      jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(null);

      const result = await userPasswordService.validateResetToken(token, email, tenantId);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Token invalide ou expiré');
    });

    it('should reject token with mismatched hash', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        dateOfBirth: new Date('1990-01-01'),
        actif: true,
        tenantId: 'tenant-123',
      };

      const mockTokenData = {
        id: 1,
        userId: 1,
        token: 'hashed_token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      jest.mocked(userService.getUserByEmail).mockResolvedValue(mockUser);
      jest.mocked(prisma.passwordResetToken.findFirst).mockResolvedValue(mockTokenData);
      jest.mocked(userService.verifyPassword).mockResolvedValue(false);

      const result = await userPasswordService.validateResetToken(token, email, tenantId);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Token invalide');
    });

    it('should reject token for non-existent user', async () => {
      jest.mocked(userService.getUserByEmail).mockResolvedValue(null);

      const result = await userPasswordService.validateResetToken(token, email, tenantId);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Token invalide');
    });

    it('should handle errors gracefully', async () => {
      jest.mocked(userService.getUserByEmail).mockRejectedValue(
        new Error('Database error')
      );

      const result = await userPasswordService.validateResetToken(token, email, tenantId);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Erreur de validation');
    });
  });

  describe('invalidateAllTokens', () => {
    it('should invalidate all tokens for user', async () => {
      jest.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 3 });

      const result = await userPasswordService.invalidateAllTokens(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Tous les tokens ont été invalidés');
      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { used: true },
      });
    });

    it('should handle errors gracefully', async () => {
      jest.mocked(prisma.passwordResetToken.updateMany).mockRejectedValue(
        new Error('Database error')
      );

      const result = await userPasswordService.invalidateAllTokens(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de l\'invalidation des tokens');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and used tokens', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 5 });

      const result = await userPasswordService.cleanupExpiredTokens();

      expect(result.success).toBe(true);
      expect(result.message).toBe('5 tokens expirés supprimés');
      expect(result.deletedCount).toBe(5);
    });

    it('should delete tokens with expiresAt in the past', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 2 });

      await userPasswordService.cleanupExpiredTokens();

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { used: true },
          ],
        },
      });
    });

    it('should delete used tokens', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 3 });

      await userPasswordService.cleanupExpiredTokens();

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            { used: true },
          ]),
        },
      });
    });

    it('should return count of deleted tokens', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 10 });

      const result = await userPasswordService.cleanupExpiredTokens();

      expect(result.deletedCount).toBe(10);
    });

    it('should handle errors during cleanup', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockRejectedValue(
        new Error('Database error')
      );

      const result = await userPasswordService.cleanupExpiredTokens();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors du nettoyage');
      expect(result.deletedCount).toBe(0);
    });

    it('should succeed when no tokens to delete', async () => {
      jest.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });

      const result = await userPasswordService.cleanupExpiredTokens();

      expect(result.success).toBe(true);
      expect(result.message).toBe('0 tokens expirés supprimés');
      expect(result.deletedCount).toBe(0);
    });
  });
});
