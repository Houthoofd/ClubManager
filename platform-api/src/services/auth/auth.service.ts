import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { prisma } from "../prisma/prisma.service.js";
import type { User } from "@prisma/client";
import type { LoginCredentials, RegisterUserData, AuthResult, PasswordResetData, ResetPasswordData } from "./auth.types.js";

/**
 * Authentication Service
 * Handles user authentication, registration, and JWT token operations
 */
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";
  private readonly saltRounds = 10;

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error(`Error hashing password: ${error}`);
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(user: { id: number; email: string; tenantId: string }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
      },
      this.jwtSecret,
      { expiresIn: "24h" }
    );
  }

  /**
   * Verify JWT token (simple version for compatibility)
   */
  verifyToken(token: string): any {
    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      return jwt.verify(cleanToken, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify JWT token and return user data
   */
  async verifyAuth(token: string): Promise<{ 
    success: boolean; 
    user?: User; 
    message?: string;
    error?: string;
  }> {
    try {
      if (!token) {
        return { 
          success: false, 
          message: "Token manquant" 
        };
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      
      const decoded = jwt.verify(cleanToken, this.jwtSecret) as any;
      
      const user = await this.getUserById(decoded.id, decoded.tenantId);
      
      if (!user) {
        return { 
          success: false, 
          message: "Utilisateur non trouvé" 
        };
      }

      return { 
        success: true, 
        user 
      };
    } catch (error: any) {
      console.error('Auth verification error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return { 
          success: false, 
          message: "Token expiré",
          error: "TOKEN_EXPIRED"
        };
      } else if (error.name === 'JsonWebTokenError') {
        return { 
          success: false, 
          message: "Token invalide",
          error: "INVALID_TOKEN"
        };
      }
      
      return { 
        success: false, 
        message: "Erreur lors de la vérification du token",
        error: "VERIFICATION_ERROR"
      };
    }
  }

  /**
   * User login
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log("🔐 Login attempt for:", credentials.email);

      // Find user by email and tenantId
      const user = await prisma.user.findFirst({
        where: {
          email: credentials.email,
          tenantId: credentials.tenantId,
          actif: true,
        },
      });

      if (!user) {
        console.log("❌ User not found or inactive");
        return {
          success: false,
          message: "Email ou mot de passe incorrect",
        };
      }

      // Verify password
      const passwordValid = await this.verifyPassword(
        credentials.password,
        user.password || ""
      );

      if (!passwordValid) {
        console.log("❌ Invalid password");
        return {
          success: false,
          message: "Email ou mot de passe incorrect",
        };
      }

      // Update last login (commented out until schema is updated)
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: { lastLogin: new Date() },
      // });

      // Generate JWT token
      const token = this.generateToken({
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
      });

      console.log("✅ Login successful for:", credentials.email);

      return {
        success: true,
        message: "Connexion réussie",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        message: "Erreur lors de la connexion",
      };
    }
  }

  /**
   * User registration
   */
  async register(data: RegisterUserData): Promise<AuthResult> {
    try {
      console.log("📝 Registration attempt for:", data.email);

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          tenantId: data.tenantId,
        },
      });

      if (existingUser) {
        console.log("❌ User already exists");
        return {
          success: false,
          message: "Un compte existe déjà avec cet email",
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: hashedPassword,
          dateOfBirth: data.dateOfBirth || new Date('1990-01-01'),
          genderId: data.genderId || null,
          tenantId: data.tenantId || 'default',
          actif: false, // User needs email verification
          // TODO: Add these fields to schema
          // emailVerified: false,
          // verificationToken,
          // dateInscription: new Date(),
        },
      });

      console.log("✅ User created successfully:", user.id);

      return {
        success: true,
        message: "Inscription réussie - Vérifiez votre email",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      return {
        success: false,
        message: "Erreur lors de l'inscription",
      };
    }
  }

  /**
   * Get user by ID for authentication
   */
  private async getUserById(userId: number, tenantId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          tenantId: tenantId,
          actif: true,
        },
      });

      return user;
    } catch (error: any) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  }
}

export const authService = new AuthService();