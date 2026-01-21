import crypto from "crypto";
import { prisma } from "../../prisma/prisma.service.js";
import { emailService } from "../../operations/communication/email.service.js";
import { userService } from "./user.service.js";

/**
 * UserPasswordService - Handle password management operations
 *
 * Features:
 * - Password reset request
 * - Password reset with token
 * - Password change
 * - Token validation
 */

export interface PasswordResetToken {
  token: string;
  userId: number;
  email: string;
  expiresAt: Date;
}

class UserPasswordService {
  private readonly RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in ms

  /**
   * Request password reset
   */
  async requestPasswordReset(
    email: string,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find user
      const user = await userService.getUserByEmail(email, tenantId);

      if (!user) {
        // Don't reveal if user exists for security
        return {
          success: true,
          message:
            "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation",
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = await userService.hashPassword(resetToken);
      const expiresAt = new Date(Date.now() + this.RESET_TOKEN_EXPIRY);

      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Store new token in database
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt,
          used: false,
        },
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${email}`;

      await emailService.sendPasswordResetEmail(email, {
        userName: `${user.firstName} ${user.lastName}`,
        resetUrl,
        expiresIn: "1 heure",
      });

      return {
        success: true,
        message: "Email de réinitialisation envoyé",
      };
    } catch (error) {
      console.error("❌ Request password reset error:", error);
      return {
        success: false,
        message: "Erreur lors de la demande de réinitialisation",
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    email: string,
    newPassword: string,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find user
      const user = await userService.getUserByEmail(email, tenantId);

      if (!user) {
        return {
          success: false,
          message: "Token invalide ou expiré",
        };
      }

      // Verify token (retrieve from DB and check expiry)
      const tokenData = await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
          used: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!tokenData) {
        return {
          success: false,
          message: "Token invalide ou expiré",
        };
      }

      // Verify token hash
      const isValidToken = await userService.verifyPassword(
        token,
        tokenData.token,
      );

      if (!isValidToken) {
        return {
          success: false,
          message: "Token invalide",
        };
      }

      // Hash new password
      const hashedPassword = await userService.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id },
        data: { used: true },
      });

      return {
        success: true,
        message: "Mot de passe réinitialisé avec succès",
      };
    } catch (error) {
      console.error("❌ Reset password error:", error);
      return {
        success: false,
        message: "Erreur lors de la réinitialisation",
      };
    }
  }

  /**
   * Change password (for authenticated user)
   */
  async changePassword(
    userId: number,
    tenantId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId, tenantId },
      });

      if (!user) {
        return {
          success: false,
          message: "Utilisateur non trouvé",
        };
      }

      // Verify current password
      if (!user.password) {
        return {
          success: false,
          message: "Aucun mot de passe défini",
        };
      }

      const isValidPassword = await userService.verifyPassword(
        currentPassword,
        user.password,
      );

      if (!isValidPassword) {
        return {
          success: false,
          message: "Mot de passe actuel incorrect",
        };
      }

      // Hash new password
      const hashedPassword = await userService.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: "Mot de passe modifié avec succès",
      };
    } catch (error) {
      console.error("❌ Change password error:", error);
      return {
        success: false,
        message: "Erreur lors du changement de mot de passe",
      };
    }
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(
    token: string,
    email: string,
    tenantId: string,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      // Find user
      const user = await userService.getUserByEmail(email, tenantId);

      if (!user) {
        return {
          valid: false,
          message: "Token invalide",
        };
      }

      // Check if token exists and is not expired
      const tokenData = await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
          used: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!tokenData) {
        return {
          valid: false,
          message: "Token invalide ou expiré",
        };
      }

      // Verify token hash
      const isValidToken = await userService.verifyPassword(
        token,
        tokenData.token,
      );

      if (!isValidToken) {
        return {
          valid: false,
          message: "Token invalide",
        };
      }

      return {
        valid: true,
        message: "Token valide",
      };
    } catch (error) {
      console.error("❌ Validate reset token error:", error);
      return {
        valid: false,
        message: "Erreur de validation",
      };
    }
  }

  /**
   * Invalidate all password reset tokens for a user
   */
  async invalidateAllTokens(
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.passwordResetToken.updateMany({
        where: { userId },
        data: { used: true },
      });

      return {
        success: true,
        message: "Tous les tokens ont été invalidés",
      };
    } catch (error) {
      console.error("❌ Invalidate all tokens error:", error);
      return {
        success: false,
        message: "Erreur lors de l'invalidation des tokens",
      };
    }
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true },
          ],
        },
      });

      return {
        success: true,
        message: `${result.count} tokens expirés supprimés`,
        deletedCount: result.count,
      };
    } catch (error) {
      console.error("❌ Cleanup expired tokens error:", error);
      return {
        success: false,
        message: "Erreur lors du nettoyage",
        deletedCount: 0,
      };
    }
  }
}

// Export singleton instance
export const userPasswordService = new UserPasswordService();
export default UserPasswordService;
