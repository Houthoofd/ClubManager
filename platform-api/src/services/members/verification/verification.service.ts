/**
 * Verification Service
 * Service for handling various verification operations
 * Replaces the old Verifiation client
 */

import { prisma } from "../../../db/prisma.client.js";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcrypt";

// Validation schemas
export const emailVerificationSchema = z.object({
  email: z.string().email("Email invalide"),
  token: z.string().min(1, "Token requis"),
});

export const phoneVerificationSchema = z.object({
  phone: z.string().min(1, "Numéro de téléphone requis"),
  code: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

export const passwordResetSchema = z.object({
  email: z.string().email("Email invalide"),
  token: z.string().min(1, "Token requis"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

interface VerificationResult {
  success: boolean;
  message: string;
  exists?: boolean;
  data?: any;
}

interface TokenData {
  userId: number;
  email: string;
  type: "email" | "password_reset" | "account_activation";
  expiresAt: Date;
}

export class VerificationService {
  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hash a token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  /**
   * Verify a token against its hash
   */
  private async verifyToken(
    token: string,
    hashedToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(userId: number): Promise<string> {
    const token = this.generateToken();
    const hashedToken = await this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store in password reset tokens table for now (we can extend this later)
    await prisma.passwordResetToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
        used: false,
      },
    });

    return token;
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(
    token: string,
    userId: number,
  ): Promise<VerificationResult> {
    try {
      const tokenData = await prisma.passwordResetToken.findFirst({
        where: {
          userId,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!tokenData) {
        return {
          success: false,
          message: "Token invalide ou expiré",
        };
      }

      const isValid = await this.verifyToken(token, tokenData.token);

      if (!isValid) {
        return {
          success: false,
          message: "Token invalide",
        };
      }

      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { id: tokenData.id },
        data: { used: true },
      });

      return {
        success: true,
        message: "Email vérifié avec succès",
        data: { userId },
      };
    } catch (error) {
      console.error("Error verifying email token:", error);
      return {
        success: false,
        message: "Erreur lors de la vérification",
      };
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<VerificationResult> {
    try {
      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message:
            "Si cet email existe, vous recevrez un lien de réinitialisation",
        };
      }

      const token = this.generateToken();
      const hashedToken = await this.hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt,
          used: false,
        },
      });

      return {
        success: true,
        message: "Token de réinitialisation généré",
        data: { token, userId: user.id },
      };
    } catch (error) {
      console.error("Error generating password reset token:", error);
      return {
        success: false,
        message: "Erreur lors de la génération du token",
      };
    }
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<VerificationResult> {
    try {
      const tokenData = await prisma.passwordResetToken.findFirst({
        where: {
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!tokenData) {
        return {
          success: false,
          message: "Token invalide ou expiré",
        };
      }

      const isValid = await this.verifyToken(token, tokenData.token);

      if (!isValid) {
        return {
          success: false,
          message: "Token invalide",
        };
      }

      return {
        success: true,
        message: "Token valide",
        data: {
          userId: tokenData.userId,
          email: tokenData.user.email,
        },
      };
    } catch (error) {
      console.error("Error verifying password reset token:", error);
      return {
        success: false,
        message: "Erreur lors de la vérification",
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<VerificationResult> {
    try {
      const verification = await this.verifyPasswordResetToken(token);

      if (!verification.success) {
        return verification;
      }

      const userId = verification.data?.userId;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await prisma.passwordResetToken.updateMany({
        where: { userId },
        data: { used: true },
      });

      return {
        success: true,
        message: "Mot de passe réinitialisé avec succès",
      };
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        success: false,
        message: "Erreur lors de la réinitialisation",
      };
    }
  }

  /**
   * Verify user account (activate account)
   */
  async verifyAccount(userId: number): Promise<VerificationResult> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { actif: true },
      });

      return {
        success: true,
        message: "Compte activé avec succès",
      };
    } catch (error) {
      console.error("Error verifying account:", error);
      return {
        success: false,
        message: "Erreur lors de l'activation du compte",
      };
    }
  }

  /**
   * Validate email format and domain
   */
  validateEmailFormat(email: string): VerificationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Format d'email invalide",
      };
    }

    // Additional domain validation could be added here
    const domain = email.split("@")[1];
    const blockedDomains = ["tempmail.com", "10minutemail.com"]; // Example blocked domains

    if (blockedDomains.includes(domain)) {
      return {
        success: false,
        message: "Domaine d'email non autorisé",
      };
    }

    return {
      success: true,
      message: "Format d'email valide",
    };
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): VerificationResult {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Au moins ${minLength} caractères`);
    }

    if (!hasUpperCase) {
      errors.push("Au moins une majuscule");
    }

    if (!hasLowerCase) {
      errors.push("Au moins une minuscule");
    }

    if (!hasNumbers) {
      errors.push("Au moins un chiffre");
    }

    if (!hasSpecialChar) {
      errors.push("Au moins un caractère spécial");
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Mot de passe faible. Requis: ${errors.join(", ")}`,
      };
    }

    return {
      success: true,
      message: "Mot de passe fort",
    };
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<VerificationResult> {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return {
        success: true,
        message: `${result.count} tokens expirés supprimés`,
        data: { deletedCount: result.count },
      };
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
      return {
        success: false,
        message: "Erreur lors du nettoyage des tokens",
      };
    }
  }

  /**
   * Check if email exists in database
   */
  async checkEmailExists(email: string): Promise<VerificationResult> {
    try {
      const user = await prisma.user.findFirst({
        where: { email },
        select: { id: true },
      });

      return {
        success: true,
        exists: !!user,
        message: user ? "Email déjà utilisé" : "Email disponible",
      };
    } catch (error) {
      console.error("Error checking email:", error);
      return {
        success: false,
        exists: false,
        message: "Erreur lors de la vérification de l'email",
      };
    }
  }

  /**
   * Check if username exists in database (using firstName + lastName as username)
   */
  async checkUsernameExists(username: string): Promise<VerificationResult> {
    try {
      // Since there's no nom_utilisateur field, we'll check firstName + lastName
      const [firstName, lastName] = username.split(" ");
      const user = await prisma.user.findFirst({
        where: {
          AND: [{ firstName: firstName || "" }, { lastName: lastName || "" }],
        },
        select: { id: true },
      });

      return {
        success: true,
        exists: !!user,
        message: user
          ? "Nom d'utilisateur déjà utilisé"
          : "Nom d'utilisateur disponible",
      };
    } catch (error) {
      console.error("Error checking username:", error);
      return {
        success: false,
        exists: false,
        message: "Erreur lors de la vérification du nom d'utilisateur",
      };
    }
  }

  /**
   * Initiate password reset process
   */
  async initiatePasswordReset(email: string): Promise<VerificationResult> {
    try {
      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        return {
          success: false,
          message: "Aucun utilisateur trouvé avec cet email",
        };
      }

      const token = await this.generateEmailVerificationToken(user.id);

      // In a real app, send email here
      console.log(`Password reset token for ${email}: ${token}`);

      return {
        success: true,
        message: "Email de réinitialisation envoyé",
      };
    } catch (error) {
      console.error("Error initiating password reset:", error);
      return {
        success: false,
        message: "Erreur lors de l'envoi de l'email de réinitialisation",
      };
    }
  }
}

// Export singleton instance
export const verificationService = new VerificationService();
