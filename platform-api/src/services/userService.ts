import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "./prismaService.js";
import { emailService } from "./emailService.js";
import type { User, Prisma } from "@prisma/client";

/**
 * UserService - Handle all user-related operations with Prisma
 *
 * Features:
 * - User authentication (login/register)
 * - Password hashing with bcrypt
 * - JWT token generation
 * - Password reset flow
 * - Email verification
 * - Tenant isolation
 * - CRUD operations
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

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userId: string | null;
  dateOfBirth: Date;
  status: string;
  genre: string | null;
  grade: string | null;
  abonnement: string | null;
  actif: boolean;
  createdAt: Date;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
}

export interface PasswordResetToken {
  token: string;
  userId: number;
  email: string;
  expiresAt: Date;
}

class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
  private readonly RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in ms

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(
    userId: number,
    email: string,
    tenantId: string,
    statusId: number,
  ): string {
    return jwt.sign(
      {
        id: userId,
        email,
        tenantId,
        status_id: statusId,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN },
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

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

      const isValidPassword = await this.verifyPassword(
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
      const token = this.generateToken(
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
        userId: user.userId,
        dateOfBirth: user.dateOfBirth,
        status: user.status.nomRole,
        genre: user.genre?.genreName || null,
        grade: user.grade?.nom || null,
        abonnement: user.abonnement?.nom || null,
        actif: user.actif,
        createdAt: user.createdAt,
      };

      return {
        success: true,
        message: "Connexion réussie",
        user: userProfile,
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
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
      const hashedPassword = await this.hashPassword(data.password);

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
      const token = this.generateToken(
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
        userId: user.userId,
        dateOfBirth: user.dateOfBirth,
        status: user.status.nomRole,
        genre: user.genre?.genreName || null,
        grade: user.grade?.nom || null,
        abonnement: null,
        actif: user.actif,
        createdAt: user.createdAt,
      };

      return {
        success: true,
        message: "Inscription réussie",
        user: userProfile,
        token,
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: "Erreur lors de l'inscription",
      };
    }
  }

  /**
   * Get user by ID with tenant isolation
   */
  async getUserById(
    userId: number,
    tenantId: string,
  ): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          tenantId,
        },
        include: {
          status: true,
          genre: true,
          grade: true,
          abonnement: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userId: user.userId,
        dateOfBirth: user.dateOfBirth,
        status: user.status.nomRole,
        genre: user.genre?.genreName || null,
        grade: user.grade?.nom || null,
        abonnement: user.abonnement?.nom || null,
        actif: user.actif,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error("Get user by ID error:", error);
      return null;
    }
  }

  /**
   * Get user by email with tenant isolation
   */
  async getUserByEmail(email: string, tenantId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: {
          unique_email_per_tenant: {
            email,
            tenantId,
          },
        },
      });
    } catch (error) {
      console.error("Get user by email error:", error);
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: number,
    tenantId: string,
    data: Partial<Omit<RegisterUserData, "tenantId" | "password">>,
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const user = await prisma.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          genderId: data.genderId,
        },
        include: {
          status: true,
          genre: true,
          grade: true,
          abonnement: true,
        },
      });

      const userProfile: UserProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userId: user.userId,
        dateOfBirth: user.dateOfBirth,
        status: user.status.nomRole,
        genre: user.genre?.genreName || null,
        grade: user.grade?.nom || null,
        abonnement: user.abonnement?.nom || null,
        actif: user.actif,
        createdAt: user.createdAt,
      };

      return {
        success: true,
        message: "Utilisateur mis à jour avec succès",
        user: userProfile,
      };
    } catch (error) {
      console.error("Update user error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour",
      };
    }
  }

  /**
   * Delete user (soft delete by setting actif to false)
   */
  async deleteUser(
    userId: number,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          actif: false,
        },
      });

      return {
        success: true,
        message: "Utilisateur désactivé avec succès",
      };
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        success: false,
        message: "Erreur lors de la désactivation",
      };
    }
  }

  /**
   * List users with pagination and tenant isolation
   */
  async listUsers(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      statusId?: number;
      actif?: boolean;
    } = {},
  ): Promise<{
    users: UserProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.UserWhereInput = {
        tenantId,
        ...(options.actif !== undefined && { actif: options.actif }),
        ...(options.statusId && { statusId: options.statusId }),
        ...(options.search && {
          OR: [
            { firstName: { contains: options.search, mode: "insensitive" } },
            { lastName: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } },
          ],
        }),
      };

      // Get users and total count
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            status: true,
            genre: true,
            grade: true,
            abonnement: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.user.count({ where }),
      ]);

      // Map to user profiles
      const userProfiles: UserProfile[] = users.map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userId: user.userId,
        dateOfBirth: user.dateOfBirth,
        status: user.status.nomRole,
        genre: user.genre?.genreName || null,
        grade: user.grade?.nom || null,
        abonnement: user.abonnement?.nom || null,
        actif: user.actif,
        createdAt: user.createdAt,
      }));

      return {
        users: userProfiles,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("List users error:", error);
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    email: string,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find user
      const user = await this.getUserByEmail(email, tenantId);

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
      const hashedToken = await this.hashPassword(resetToken);
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
      console.error("Request password reset error:", error);
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
      const user = await this.getUserByEmail(email, tenantId);

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
      const isValidToken = await this.verifyPassword(token, tokenData.token);

      if (!isValidToken) {
        return {
          success: false,
          message: "Token invalide",
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

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
      console.error("Reset password error:", error);
      return {
        success: false,
        message: "Erreur lors de la réinitialisation",
      };
    }
  }

  /**
   * Verify authentication token and get user
   */
  async verifyAuth(
    token: string,
  ): Promise<{ authenticated: boolean; user?: UserProfile; error?: string }> {
    try {
      // Verify token
      const decoded = this.verifyToken(token);

      if (!decoded || !decoded.id || !decoded.tenantId) {
        return {
          authenticated: false,
          error: "Token invalide",
        };
      }

      // Get user
      const user = await this.getUserById(decoded.id, decoded.tenantId);

      if (!user) {
        return {
          authenticated: false,
          error: "Utilisateur non trouvé",
        };
      }

      if (!user.actif) {
        return {
          authenticated: false,
          error: "Compte désactivé",
        };
      }

      return {
        authenticated: true,
        user,
      };
    } catch (error) {
      console.error("Verify auth error:", error);
      return {
        authenticated: false,
        error: "Erreur d'authentification",
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default UserService;
