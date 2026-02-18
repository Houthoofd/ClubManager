/**
 * Authentication Service
 * Handles JWT authentication, refresh tokens, and email verification
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type {
  Users,
  LoginCredentials,
  LoginResponse,
  RegisterInput,
  AuthTokens,
  JWTPayload,
  RefreshToken,
  EmailVerificationToken,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordChangeInput,
} from '@clubmanager/types';
import prisma from '../../../../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput, ipAddress?: string): Promise<LoginResponse> {
    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        password: hashedPassword,
        phone: input.phone,
        birth_date: input.birth_date,
        address: input.address,
        gender_id: input.gender_id,
        email_verified: false,
        active: false, // Activate after email verification
      },
    });

    // Create email verification token
    const verificationToken = await this.createEmailVerificationToken(user.id);

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken.token);

    // Generate tokens
    const tokens = await this.generateTokens(user, ipAddress);

    return {
      user,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(
    credentials: LoginCredentials,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    // Find user
    const user = await prisma.users.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    if (!isValidPassword) {
      // Update failed login attempts
      await this.incrementFailedLoginAttempts(user.id);
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    const security = await prisma.user_security.findUnique({
      where: { user_id: user.id },
    });

    if (security?.account_locked_until && new Date(security.account_locked_until) > new Date()) {
      throw new Error('Account is locked. Please try again later.');
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new Error('Please verify your email before logging in');
    }

    // Update security info
    await this.updateLoginSuccess(user.id, ipAddress);

    // Generate tokens
    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    return {
      user,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload;

      // Check if refresh token exists and is not revoked
      const tokenRecord = await prisma.refresh_tokens.findFirst({
        where: {
          token: refreshToken,
          user_id: decoded.userId,
          revoked_at: null,
          expires_at: {
            gte: new Date(),
          },
        },
      });

      if (!tokenRecord) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get user
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.active) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return {
        accessToken,
        refreshToken, // Keep the same refresh token
        expiresIn: 900, // 15 minutes
        tokenType: 'Bearer',
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refresh_tokens.updateMany({
      where: { token: refreshToken },
      data: { revoked_at: new Date() },
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<Users> {
    const verificationToken = await prisma.email_verification_tokens.findFirst({
      where: {
        token,
        verified_at: null,
        expires_at: {
          gte: new Date(),
        },
      },
    });

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark token as verified
    await prisma.email_verification_tokens.update({
      where: { id: verificationToken.id },
      data: { verified_at: new Date() },
    });

    // Update user
    const user = await prisma.users.update({
      where: { id: verificationToken.user_id },
      data: {
        email_verified: true,
        active: true,
      },
    });

    return user;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { email: request.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Create password reset token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await prisma.password_reset_tokens.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    });

    // TODO: Send password reset email
    // await emailService.sendPasswordResetEmail(user.email, token);
  }

  /**
   * Reset password with token
   */
  async resetPassword(request: PasswordResetConfirm): Promise<void> {
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: request.token,
        used_at: null,
        expires_at: {
          gte: new Date(),
        },
      },
    });

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(request.newPassword, 10);

    // Update password
    await prisma.users.update({
      where: { id: resetToken.user_id },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { used_at: new Date() },
    });

    // Update security info
    await prisma.user_security.update({
      where: { user_id: resetToken.user_id },
      data: { password_changed_at: new Date() },
    });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: number, input: PasswordChangeInput): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(input.currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(input.newPassword, 10);

    // Update password
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Update security info
    await prisma.user_security.update({
      where: { user_id: userId },
      data: { password_changed_at: new Date() },
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async generateTokens(
    user: Users,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
    };
  }

  private generateAccessToken(user: Users): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'member',
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  private async generateRefreshToken(
    user: Users,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'member',
    };

    const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token in database
    await prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return token;
  }

  private async createEmailVerificationToken(userId: number): Promise<EmailVerificationToken> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours

    const verificationToken = await prisma.email_verification_tokens.create({
      data: {
        user_id: userId,
        token,
        expires_at: expiresAt,
      },
    });

    return verificationToken as EmailVerificationToken;
  }

  private async incrementFailedLoginAttempts(userId: number): Promise<void> {
    const security = await prisma.user_security.upsert({
      where: { user_id: userId },
      update: {
        failed_login_attempts: {
          increment: 1,
        },
      },
      create: {
        user_id: userId,
        failed_login_attempts: 1,
      },
    });

    // Lock account after 5 failed attempts
    if (security.failed_login_attempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes

      await prisma.user_security.update({
        where: { user_id: userId },
        data: { account_locked_until: lockUntil },
      });
    }
  }

  private async updateLoginSuccess(userId: number, ipAddress?: string): Promise<void> {
    await prisma.user_security.upsert({
      where: { user_id: userId },
      update: {
        failed_login_attempts: 0,
        last_login_at: new Date(),
        last_login_ip: ipAddress,
        account_locked_until: null,
      },
      create: {
        user_id: userId,
        failed_login_attempts: 0,
        last_login_at: new Date(),
        last_login_ip: ipAddress,
      },
    });
  }
}

export default new AuthService();
