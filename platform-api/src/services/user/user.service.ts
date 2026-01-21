import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma.service.js";
import type { User, Prisma } from "@prisma/client";

/**
 * UserService - Handle user CRUD operations and utilities
 *
 * Features:
 * - CRUD operations for users
 * - Password hashing utilities
 * - JWT token generation and verification
 * - User profile management
 * - Tenant isolation
 */

// Types
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

export interface CreateUserData {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  genderId?: number;
  userId?: string;
  statusId?: number;
  gradeId?: number;
  abonnementId?: number;
  actif?: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  genderId?: number;
  gradeId?: number;
  statusId?: number;
  abonnementId?: number;
  actif?: boolean;
}

class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

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
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions,
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user by ID with full profile
   */
  async getUserById(
    userId: number,
    tenantId: string,
  ): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
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
      console.error("❌ Get user by ID error:", error);
      return null;
    }
  }

  /**
   * Get user by email
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
        include: {
          status: true,
          genre: true,
          grade: true,
          abonnement: true,
        },
      });
    } catch (error) {
      console.error("❌ Get user by email error:", error);
      return null;
    }
  }

  /**
   * Find user by personal details (for verification)
   */
  async findUserByDetails(details: {
    lastName: string;
    firstName: string;
    dateOfBirth: Date;
    tenantId: string;
  }): Promise<any> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          lastName: details.lastName,
          firstName: details.firstName,
          dateOfBirth: details.dateOfBirth,
          tenantId: details.tenantId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          tenantId: true,
        },
      });

      return user;
    } catch (error) {
      console.error("❌ Find user by details error:", error);
      return null;
    }
  }

  /**
   * Create new user
   */
  async create(data: CreateUserData): Promise<{
    success: boolean;
    message: string;
    user?: UserProfile;
  }> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(data.email, data.tenantId);

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
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: hashedPassword,
          dateOfBirth: data.dateOfBirth,
          genderId: data.genderId,
          tenantId: data.tenantId,
          gradeId: data.gradeId || 1,
          statusId: data.statusId || 1,
          abonnementId: data.abonnementId,
          actif: data.actif !== undefined ? data.actif : true,
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
        message: "Utilisateur créé avec succès",
        user: userProfile,
      };
    } catch (error) {
      console.error("❌ Create user error:", error);
      return {
        success: false,
        message: "Erreur lors de la création de l'utilisateur",
      };
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: number,
    tenantId: string,
    data: UpdateUserData,
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const user = await prisma.user.update({
        where: {
          id: userId,
          tenantId,
        },
        data: {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
          ...(data.genderId && { genderId: data.genderId }),
          ...(data.gradeId && { gradeId: data.gradeId }),
          ...(data.statusId && { statusId: data.statusId }),
          ...(data.abonnementId !== undefined && {
            abonnementId: data.abonnementId,
          }),
          ...(data.actif !== undefined && { actif: data.actif }),
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
      console.error("❌ Update user error:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour de l'utilisateur",
      };
    }
  }

  /**
   * Delete user (soft delete)
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
      console.error("❌ Delete user error:", error);
      return {
        success: false,
        message: "Erreur lors de la désactivation de l'utilisateur",
      };
    }
  }

  /**
   * List users with pagination and filters
   */
  async listUsers(options: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    actif?: boolean;
    statusId?: number;
  }): Promise<{
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
        tenantId: options.tenantId,
        ...(options.actif !== undefined && { actif: options.actif }),
        ...(options.statusId && { statusId: options.statusId }),
        ...(options.search && {
          OR: [
            { firstName: { contains: options.search } },
            { lastName: { contains: options.search } },
            { email: { contains: options.search } },
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
      const userProfiles: UserProfile[] = users.map((user) => ({
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
      console.error("❌ List users error:", error);
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Verify authentication token and get user
   */
  async verifyAuth(
    token: string,
  ): Promise<{ authenticated: boolean; user?: User; error?: string }> {
    try {
      // Verify token
      const decoded = this.verifyToken(token);

      if (!decoded) {
        return {
          authenticated: false,
          error: "Token invalide",
        };
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

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
      console.error("❌ Verify auth error:", error);
      return {
        authenticated: false,
        error: "Erreur d'authentification",
      };
    }
  }

  /**
   * Find user by email (alias for getUserByEmail)
   */
  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.getUserByEmail(email, tenantId);
  }
}

// Export singleton instance
export const userService = new UserService();
export default UserService;
