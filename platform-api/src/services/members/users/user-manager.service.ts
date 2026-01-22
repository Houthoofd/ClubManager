import { prisma } from "../../prisma/prisma.service.js";
import type { User } from "@prisma/client";

interface RegisterUserData {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  genderId?: number;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  actif: boolean;
  tenantId: string;
}

/**
 * User Management Service
 * Handles CRUD operations and user profile management
 */
export class UserManagerService {
  
  /**
   * Find user by email and tenantId
   */
  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: email,
          tenantId: tenantId,
        },
      });

      return user;
    } catch (error: any) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number, tenantId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          tenantId: tenantId,
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
        dateOfBirth: user.dateOfBirth,
        actif: user.actif,
        tenantId: user.tenantId,
      };
    } catch (error: any) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  }

  /**
   * Get user by email (alias for findByEmail with profile mapping)
   */
  async getUserByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.findByEmail(email, tenantId);
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: number,
    tenantId: string,
    data: Partial<{ firstName: string; lastName: string; email: string; dateOfBirth: Date; actif: boolean }>,
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const user = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...data,
        },
      });

      const userProfile = await this.getUserById(userId, tenantId);

      return {
        success: true,
        message: "Utilisateur mis à jour avec succès",
        user: userProfile || undefined,
      };
    } catch (error: any) {
      console.error("Error updating user:", error);
      return {
        success: false,
        message: "Erreur lors de la mise à jour de l'utilisateur",
      };
    }
  }

  /**
   * Soft delete user (set actif to false)
   */
  async deleteUser(
    userId: number,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          actif: false,
          email: `deleted_${Date.now()}_${userId}`, // Prevent email conflicts
        },
      });

      return {
        success: true,
        message: "Utilisateur supprimé avec succès",
      };
    } catch (error: any) {
      console.error("Error deleting user:", error);
      return {
        success: false,
        message: "Erreur lors de la suppression de l'utilisateur",
      };
    }
  }

  /**
   * List users with filtering and pagination
   */
  async listUsers(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
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
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        tenantId: tenantId,
      };

      if (options.actif !== undefined) {
        whereClause.actif = options.actif;
      }

      if (options.search) {
        whereClause.OR = [
          { firstName: { contains: options.search, mode: "insensitive" } },
          { lastName: { contains: options.search, mode: "insensitive" } },
          { email: { contains: options.search, mode: "insensitive" } },
        ];
      }

      // Get total count
      const total = await prisma.user.count({
        where: whereClause,
      });

      // Get users
      const users = await prisma.user.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });

      // Map to UserProfile format
      const userProfiles: UserProfile[] = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        actif: user.actif,
        tenantId: user.tenantId,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        users: userProfiles,
        total,
        page,
        totalPages,
      };
    } catch (error: any) {
      console.error("Error listing users:", error);
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Create a new user directly (without registration flow)
   */
  async create(userData: RegisterUserData): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          tenantId: userData.tenantId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          dateOfBirth: userData.dateOfBirth,
          genderId: userData.genderId,
          actif: true,
        },
      });

      return user;
    } catch (error: any) {
      console.error("Error creating user:", error);
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterUserData) {
    // Implementation placeholder
    return {
      success: true,
      user: { ...userData, id: 1 }, // Mock ID
      message: 'User registered successfully',
      token: 'mock-jwt-token'
    };
  }

  /**
   * User login
   */
  async login(credentials: { email: string; password: string; tenantId: string }) {
    // Placeholder implementation
    return { 
      success: false, 
      message: "Login not implemented",
      token: null,
      user: null
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string, tenantId: string) {
    // Placeholder implementation
    return { success: false, message: "Password reset not implemented" };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    // Placeholder implementation
    return { success: false, message: "Password reset not implemented" };
  }

  /**
   * Verify auth token
   */
  async verifyAuth(token: string) {
    // Placeholder implementation
    return { 
      success: false, 
      message: "Auth verification not implemented",
      error: "Not implemented",
      user: null
    };
  }
}

export const userManagerService = new UserManagerService();