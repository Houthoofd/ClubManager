import bcrypt from "bcrypt";
import { prisma } from "../../prisma/prisma.service.js";
import { emailService } from "../../operations/communication/email.service.js";
import { userService } from "./user.service.js";
import type { User } from "@prisma/client";
import type { UserProfile } from "../../infrastructure/auth/auth.types.js";

/**
 * UserAuthService - Handle user authentication operations
 *
 * Features:
 * - User login
 * - User registration
 * - Token generation
 * - Welcome email on registration
 */

// Types
export interface LoginCredentials {
  email: string;
  password: string;
  tenantId: string;
}

export interface RegisterUserData {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  genderId?: number;
  userId?: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
}

class UserAuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password, tenantId } = credentials;

      // Validate input
      if (!email || !password) {
        return {
          success: false,
          message: "Email et mot de passe requis",
        };
      }

      // Find user by email and tenantId
      const user = await prisma.user.findUnique({
        where: {
          unique_email_per_tenant: {
            email,
            tenantId,
          },
        },
        include: {
          status: true,
          genre: true,
          grade: true,
          abonnement: true,
        },
      });

      if (!user) {
        return {
          success: false,
          message: "Email ou mot de passe incorrect",
        };
      }

      // Check if user is active
      if (!user.actif) {
        return {
          success: false,
          message: "Compte désactivé. Contactez l'administrateur.",
        };
      }

      // Verify password
      if (!user.password) {
        return {
          success: false,
          message: "Aucun mot de passe défini pour ce compte",
        };
      }

      const isValidPassword = await userService.verifyPassword(
        password,
        user.password,
      );

      if (!isValidPassword) {
        return {
          success: false,
          message: "Email ou mot de passe incorrect",
        };
      }

      // Generate token
      const token = userService.generateToken(
        user.id,
        user.email,
        user.tenantId,
        user.statusId,
      );

      // Build user profile
      const userProfile: UserProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        actif: user.actif,
        tenantId: user.tenantId,
      };

      return {
        success: true,
        message: "Connexion réussie",
        user: userProfile,
        token,
      };
    } catch (error) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        message: "Erreur lors de la connexion",
      };
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterUserData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          unique_email_per_tenant: {
            email: data.email,
            tenantId: data.tenantId,
          },
        },
      });

      if (existingUser) {
        return {
          success: false,
          message: "Un utilisateur avec cet email existe déjà",
        };
      }

      // Hash password
      const hashedPassword = await userService.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          tenantId: data.tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: hashedPassword,
          dateOfBirth: data.dateOfBirth,
          genderId: data.genderId,
          userId: data.userId,
          statusId: 1, // Default status
          gradeId: 1, // Default grade
          actif: true,
        },
        include: {
          status: true,
          genre: true,
          grade: true,
        },
      });

      // Generate token
      const token = userService.generateToken(
        user.id,
        user.email,
        user.tenantId,
        user.statusId,
      );

      // Send welcome email (non-blocking)
      const tenant = await prisma.tenant.findUnique({
        where: { id: data.tenantId },
        select: { name: true, slug: true },
      });

      if (tenant) {
        emailService
          .sendWelcomeEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            tenantName: tenant.name,
            loginUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login`,
          })
          .catch((err: any) =>
            console.error("Failed to send welcome email:", err),
          );
      }

      // Build user profile
      const userProfile: UserProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        actif: user.actif,
        tenantId: user.tenantId,
      };

      return {
        success: true,
        message: "Inscription réussie",
        user: userProfile,
        token,
      };
    } catch (error) {
      console.error("❌ Register error:", error);
      return {
        success: false,
        message: "Erreur lors de l'inscription",
      };
    }
  }

  /**
   * Logout user (client-side token removal)
   * This is a placeholder for any server-side cleanup if needed
   */
  async logout(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Add any server-side cleanup here if needed
      // For now, JWT tokens are stateless, so logout is handled client-side

      return {
        success: true,
        message: "Déconnexion réussie",
      };
    } catch (error) {
      console.error("❌ Logout error:", error);
      return {
        success: false,
        message: "Erreur lors de la déconnexion",
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(
    currentToken: string,
  ): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      // Verify current token
      const decoded = userService.verifyToken(currentToken);

      if (!decoded) {
        return {
          success: false,
          message: "Token invalide",
        };
      }

      // Get user to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.actif) {
        return {
          success: false,
          message: "Utilisateur non trouvé ou inactif",
        };
      }

      // Generate new token
      const newToken = userService.generateToken(
        user.id,
        user.email,
        user.tenantId,
        user.statusId,
      );

      return {
        success: true,
        message: "Token rafraîchi avec succès",
        token: newToken,
      };
    } catch (error) {
      console.error("❌ Refresh token error:", error);
      return {
        success: false,
        message: "Erreur lors du rafraîchissement du token",
      };
    }
  }

  /**
   * Verify if user is authenticated
   */
  async verifyAuthentication(
    token: string,
  ): Promise<{ authenticated: boolean; user?: UserProfile; error?: string }> {
    try {
      const result = await userService.verifyAuth(token);

      if (!result.success || !result.user) {
        return {
          authenticated: false,
          error: result.error || "Non authentifié",
        };
      }

      // Get full user profile
      const userProfile = await userService.getUserById(
        result.user.id,
        result.user.tenantId,
      );

      if (!userProfile) {
        return {
          authenticated: false,
          error: "Utilisateur non trouvé",
        };
      }

      return {
        authenticated: true,
        user: userProfile,
      };
    } catch (error) {
      console.error("❌ Verify authentication error:", error);
      return {
        authenticated: false,
        error: "Erreur de vérification",
      };
    }
  }
}

// Export singleton instance
export const userAuthService = new UserAuthService();
export default UserAuthService;
