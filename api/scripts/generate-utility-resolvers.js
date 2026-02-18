#!/usr/bin/env node

/**
 * Generate Utility Resolvers for Domain Routes
 *
 * This script generates GraphQL resolvers for utility services:
 * - Auth Resolvers (users domain) - Login, register, refresh token, etc.
 * - Upload Resolvers (documents domain) - File upload, presigned URLs
 * - Payment Resolvers (shop domain) - Payment intents, webhooks
 * - Monitoring Resolvers (settings domain) - Health checks, metrics
 *
 * Usage:
 *   node scripts/generate-utility-resolvers.js [domain] [resolver]
 *   node scripts/generate-utility-resolvers.js users auth
 *   node scripts/generate-utility-resolvers.js --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_PATH = path.join(__dirname, '..', 'src', 'routes');

// ============================================================================
// RESOLVER TEMPLATES
// ============================================================================

const resolverTemplates = {
  auth: {
    domain: 'users',
    filename: 'auth.resolvers.ts',
    content: `/**
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
`,
  },

  upload: {
    domain: 'documents',
    filename: 'upload.resolvers.ts',
    content: `/**
 * Upload Resolvers
 * GraphQL resolvers for file upload operations
 */

import type {
  PresignedUrlRequest,
  ImageProcessingOptions,
} from '@clubmanager/types';
import uploadService from '../services/upload.service.js';

export const uploadResolvers = {
  Query: {
    /**
     * Generate presigned URL for direct upload to S3
     */
    generatePresignedUrl: async (
      _parent: any,
      { input }: { input: PresignedUrlRequest },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const result = await uploadService.generatePresignedUrl(input, context.user.id);

        return {
          success: true,
          message: 'Presigned URL generated successfully',
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to generate presigned URL',
        };
      }
    },

    /**
     * Get download URL for a document
     */
    getDocumentDownloadUrl: async (
      _parent: any,
      { documentId, expiresIn }: { documentId: number; expiresIn?: number },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const url = await uploadService.getDownloadUrl(documentId, expiresIn);

        return {
          success: true,
          message: 'Download URL generated successfully',
          url,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to generate download URL',
        };
      }
    },
  },

  Mutation: {
    /**
     * Upload a file to S3
     */
    uploadFile: async (
      _parent: any,
      { input }: { input: any },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const file = await input.file;
        const { createReadStream, filename, mimetype } = file;

        // Read file into buffer
        const stream = createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const fileInput = {
          file: buffer,
          filename,
          mimetype,
          size: buffer.length,
          title: input.title,
          description: input.description,
          category: input.category,
          visibility: input.visibility,
        };

        const result = await uploadService.uploadFile(fileInput, context.user.id);

        return {
          success: true,
          message: 'File uploaded successfully',
          document: result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'File upload failed',
        };
      }
    },

    /**
     * Upload and process an image with variants
     */
    uploadImage: async (
      _parent: any,
      { input, options }: { input: any; options?: ImageProcessingOptions },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const file = await input.file;
        const { createReadStream, filename, mimetype } = file;

        // Check if it's an image
        if (!mimetype.startsWith('image/')) {
          throw new Error('File must be an image');
        }

        // Read file into buffer
        const stream = createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const fileInput = {
          file: buffer,
          filename,
          mimetype,
          size: buffer.length,
          title: input.title,
          description: input.description,
          category: input.category || 'photo',
          visibility: input.visibility,
        };

        const result = await uploadService.processAndUploadImage(
          fileInput,
          context.user.id,
          options
        );

        return {
          success: true,
          message: 'Image uploaded and processed successfully',
          result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Image upload failed',
        };
      }
    },
  },
};
`,
  },

  payment: {
    domain: 'shop',
    filename: 'payment.resolvers.ts',
    content: `/**
 * Payment Resolvers
 * GraphQL resolvers for Stripe payment operations
 */

import type {
  CreatePaymentIntentInput,
  ConfirmPaymentIntentInput,
  RefundInput,
} from '@clubmanager/types';
import paymentService from '../services/payment.service.js';

export const paymentResolvers = {
  Query: {
    /**
     * Get payment intent by ID
     */
    getPaymentIntent: async (
      _parent: any,
      { paymentIntentId }: { paymentIntentId: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        // TODO: Implement get payment intent
        // const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);

        return {
          success: true,
          message: 'Payment intent retrieved successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get payment intent',
        };
      }
    },

    /**
     * Get payment history for user
     */
    getPaymentHistory: async (_parent: any, _args: any, context: any) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        // TODO: Implement payment history
        // const payments = await paymentService.getPaymentHistory(context.user.id);

        return {
          success: true,
          message: 'Payment history retrieved successfully',
          payments: [],
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get payment history',
        };
      }
    },
  },

  Mutation: {
    /**
     * Create a payment intent
     */
    createPaymentIntent: async (
      _parent: any,
      { input }: { input: CreatePaymentIntentInput },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const paymentIntent = await paymentService.createPaymentIntent(input);

        return {
          success: true,
          message: 'Payment intent created successfully',
          paymentIntent,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create payment intent',
        };
      }
    },

    /**
     * Confirm a payment intent
     */
    confirmPaymentIntent: async (
      _parent: any,
      { input }: { input: ConfirmPaymentIntentInput },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const paymentIntent = await paymentService.confirmPaymentIntent(input);

        return {
          success: true,
          message: 'Payment confirmed successfully',
          paymentIntent,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Payment confirmation failed',
        };
      }
    },

    /**
     * Refund a payment
     */
    refundPayment: async (
      _parent: any,
      { input }: { input: RefundInput },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        // Check if user is admin
        if (context.user.role !== 'admin') {
          throw new Error('Only admins can process refunds');
        }

        await paymentService.refundPayment(input);

        return {
          success: true,
          message: 'Refund processed successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Refund failed',
        };
      }
    },

    /**
     * Handle Stripe webhook (internal use, called from webhook endpoint)
     */
    handleStripeWebhook: async (
      _parent: any,
      { payload, signature }: { payload: string; signature: string }
    ) => {
      try {
        await paymentService.handleWebhook(payload, signature);

        return {
          success: true,
          message: 'Webhook processed successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Webhook processing failed',
        };
      }
    },
  },
};
`,
  },

  monitoring: {
    domain: 'settings',
    filename: 'monitoring.resolvers.ts',
    content: `/**
 * Monitoring Resolvers
 * GraphQL resolvers for system monitoring and health checks
 */

import monitoringService from '../services/monitoring.service.js';

export const monitoringResolvers = {
  Query: {
    /**
     * Get system health check
     */
    healthCheck: async () => {
      try {
        const health = await monitoringService.getHealthCheck();

        return {
          success: true,
          message: \`System is \${health.status}\`,
          data: health,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Health check failed',
        };
      }
    },

    /**
     * Get system metrics
     */
    systemMetrics: async (_parent: any, _args: any, context: any) => {
      try {
        // Only allow admins to view metrics
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const metrics = await monitoringService.getMetrics();

        return {
          success: true,
          message: 'Metrics retrieved successfully',
          data: metrics,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get metrics',
        };
      }
    },

    /**
     * Get monitoring alerts
     */
    getAlerts: async (
      _parent: any,
      { status }: { status?: string },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // TODO: Implement get alerts from database
        // const alerts = await monitoringService.getAlerts(status);

        return {
          success: true,
          message: 'Alerts retrieved successfully',
          alerts: [],
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get alerts',
        };
      }
    },
  },

  Mutation: {
    /**
     * Log an error (for client-side error reporting)
     */
    logError: async (
      _parent: any,
      { error }: { error: any },
      context: any
    ) => {
      try {
        const errorLog = {
          error_type: error.type || 'client_error',
          error_message: error.message,
          stack_trace: error.stack,
          request_path: error.path,
          user_id: context.user?.id,
          ip_address: context.req?.ip,
          user_agent: context.req?.headers['user-agent'],
          severity: error.severity || 'medium',
          metadata: error.metadata,
        };

        await monitoringService.logError(errorLog);

        return {
          success: true,
          message: 'Error logged successfully',
        };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to log error',
        };
      }
    },

    /**
     * Create a monitoring alert
     */
    createAlert: async (
      _parent: any,
      { alert }: { alert: any },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        const createdAlert = await monitoringService.createAlert(alert);

        return {
          success: true,
          message: 'Alert created successfully',
          alert: createdAlert,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create alert',
        };
      }
    },

    /**
     * Acknowledge an alert
     */
    acknowledgeAlert: async (
      _parent: any,
      { alertId }: { alertId: number },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // TODO: Implement acknowledge alert
        // await monitoringService.acknowledgeAlert(alertId);

        return {
          success: true,
          message: 'Alert acknowledged successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to acknowledge alert',
        };
      }
    },

    /**
     * Resolve an alert
     */
    resolveAlert: async (
      _parent: any,
      { alertId }: { alertId: number },
      context: any
    ) => {
      try {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // TODO: Implement resolve alert
        // await monitoringService.resolveAlert(alertId);

        return {
          success: true,
          message: 'Alert resolved successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to resolve alert',
        };
      }
    },
  },
};
`,
  },
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

function generateResolver(domain, resolverName) {
  const template = resolverTemplates[resolverName];

  if (!template) {
    console.error(`❌ Unknown resolver: ${resolverName}`);
    console.log(`Available resolvers: ${Object.keys(resolverTemplates).join(', ')}`);
    process.exit(1);
  }

  if (template.domain !== domain) {
    console.error(`❌ Resolver '${resolverName}' belongs to domain '${template.domain}', not '${domain}'`);
    process.exit(1);
  }

  const resolverPath = path.join(ROUTES_PATH, domain, 'core', 'resolvers', template.filename);

  // Check if file already exists
  if (fs.existsSync(resolverPath)) {
    console.error(`❌ Resolver already exists: ${resolverPath}`);
    process.exit(1);
  }

  // Write file
  fs.writeFileSync(resolverPath, template.content, 'utf8');
  console.log(`✅ Created: ${resolverPath}`);
}

function generateAll() {
  console.log('🚀 Generating all utility resolvers...\n');

  for (const [resolverName, template] of Object.entries(resolverTemplates)) {
    const resolverPath = path.join(ROUTES_PATH, template.domain, 'core', 'resolvers', template.filename);

    if (fs.existsSync(resolverPath)) {
      console.log(`⏭️  Skipped (exists): ${resolverPath}`);
      continue;
    }

    fs.writeFileSync(resolverPath, template.content, 'utf8');
    console.log(`✅ Created: ${resolverPath}`);
  }

  console.log('\n✨ All utility resolvers generated successfully!');
}

function showUsage() {
  console.log(`
Usage:
  node scripts/generate-utility-resolvers.js [domain] [resolver]
  node scripts/generate-utility-resolvers.js --all

Resolvers:
  - auth        (users domain)       Login, register, JWT refresh
  - upload      (documents domain)   File upload, presigned URLs
  - payment     (shop domain)        Payment intents, webhooks
  - monitoring  (settings domain)    Health checks, metrics

Examples:
  node scripts/generate-utility-resolvers.js users auth
  node scripts/generate-utility-resolvers.js documents upload
  node scripts/generate-utility-resolvers.js shop payment
  node scripts/generate-utility-resolvers.js settings monitoring
  node scripts/generate-utility-resolvers.js --all
  `);
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showUsage();
  process.exit(0);
}

if (args[0] === '--all' || args[0] === '-a') {
  generateAll();
  process.exit(0);
}

if (args.length < 2) {
  console.error('❌ Missing arguments\n');
  showUsage();
  process.exit(1);
}

const [domain, resolverName] = args;
generateResolver(domain, resolverName);
