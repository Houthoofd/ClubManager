/**
 * Authentication Resolvers
 * GraphQL resolvers for authentication operations
 */

import type {
  LoginCredentials,
  RegisterInput,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordChangeInput,
} from '@clubmanager/types';
import authService from '../services/auth.service.js';

export const authResolvers = {
  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_parent: any, _args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return context.user;
    },

    /**
     * Verify email verification token
     */
    verifyEmailToken: async (_parent: any, { token }: { token: string }) => {
      try {
        const user = await authService.verifyEmail(token);
        return {
          success: true,
          message: 'Email verified successfully',
          user,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Verification failed',
        };
      }
    },
  },

  Mutation: {
    /**
     * Register a new user
     */
    register: async (
      _parent: any,
      { input }: { input: RegisterInput },
      context: any
    ) => {
      try {
        const ipAddress = context.req?.ip;
        const result = await authService.register(input, ipAddress);

        return {
          success: true,
          message: 'Registration successful. Please check your email to verify your account.',
          user: result.user,
          tokens: result.tokens,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Registration failed',
        };
      }
    },

    /**
     * Login user
     */
    login: async (
      _parent: any,
      { input }: { input: LoginCredentials },
      context: any
    ) => {
      try {
        const ipAddress = context.req?.ip;
        const userAgent = context.req?.headers['user-agent'];
        const result = await authService.login(input, ipAddress, userAgent);

        return {
          success: true,
          message: 'Login successful',
          user: result.user,
          tokens: result.tokens,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Login failed',
        };
      }
    },

    /**
     * Refresh access token
     */
    refreshToken: async (
      _parent: any,
      { refreshToken }: { refreshToken: string }
    ) => {
      try {
        const tokens = await authService.refreshAccessToken(refreshToken);

        return {
          success: true,
          message: 'Token refreshed successfully',
          tokens,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Token refresh failed',
        };
      }
    },

    /**
     * Logout user
     */
    logout: async (_parent: any, { refreshToken }: { refreshToken: string }) => {
      try {
        await authService.logout(refreshToken);

        return {
          success: true,
          message: 'Logout successful',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Logout failed',
        };
      }
    },

    /**
     * Request password reset
     */
    requestPasswordReset: async (
      _parent: any,
      { input }: { input: PasswordResetRequest }
    ) => {
      try {
        await authService.requestPasswordReset(input);

        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        };
      } catch (error) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        };
      }
    },

    /**
     * Reset password with token
     */
    resetPassword: async (
      _parent: any,
      { input }: { input: PasswordResetConfirm }
    ) => {
      try {
        await authService.resetPassword(input);

        return {
          success: true,
          message: 'Password reset successful. You can now login with your new password.',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Password reset failed',
        };
      }
    },

    /**
     * Change password (authenticated user)
     */
    changePassword: async (
      _parent: any,
      { input }: { input: PasswordChangeInput },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        await authService.changePassword(context.user.id, input);

        return {
          success: true,
          message: 'Password changed successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Password change failed',
        };
      }
    },

    /**
     * Resend email verification
     */
    resendEmailVerification: async (_parent: any, _args: any, context: any) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        // TODO: Implement resend logic
        // await authService.resendEmailVerification(context.user.id);

        return {
          success: true,
          message: 'Verification email sent',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to send verification email',
        };
      }
    },
  },
};
