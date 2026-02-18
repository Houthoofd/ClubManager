#!/usr/bin/env node

/**
 * Generate Utility Services for Domain Routes
 *
 * This script generates specialized services for utility functionalities:
 * - Auth Service (users domain) - JWT, refresh tokens, email verification
 * - Upload Service (documents domain) - S3, file uploads, presigned URLs
 * - Payment Service (shop domain) - Stripe payments, webhooks
 * - Monitoring Service (settings domain) - Health checks, metrics, error logs
 *
 * Usage:
 *   node scripts/generate-utility-services.js [domain] [service]
 *   node scripts/generate-utility-services.js users auth
 *   node scripts/generate-utility-services.js --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_PATH = path.join(__dirname, '..', 'src', 'routes');

// ============================================================================
// SERVICE TEMPLATES
// ============================================================================

const serviceTemplates = {
  auth: {
    domain: 'users',
    filename: 'auth.service.ts',
    content: `/**
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
`,
  },

  upload: {
    domain: 'documents',
    filename: 'upload.service.ts',
    content: `/**
 * Upload Service
 * Handles file uploads to S3, presigned URLs, and image processing
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type {
  FileUploadInput,
  FileUploadResult,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ImageProcessingOptions,
  ProcessedImage,
} from '@clubmanager/types';
import prisma from '../../../../config/database.js';

const S3_BUCKET = process.env.S3_BUCKET || 'clubmanager-uploads';
const S3_REGION = process.env.S3_REGION || 'eu-west-1';
const PRESIGNED_URL_EXPIRY = 900; // 15 minutes

export class UploadService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    input: FileUploadInput,
    userId: number
  ): Promise<FileUploadResult> {
    const key = this.generateS3Key(input.filename);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: input.file,
      ContentType: input.mimetype,
      Metadata: {
        uploadedBy: userId.toString(),
      },
    });

    await this.s3Client.send(command);

    // Save document record
    const document = await prisma.documents.create({
      data: {
        title: input.title || input.filename,
        description: input.description,
        file_url: \`https://\${S3_BUCKET}.s3.\${S3_REGION}.amazonaws.com/\${key}\`,
        file_name: input.filename,
        file_type: input.mimetype,
        file_size: input.size,
        category: input.category || 'other',
        visibility: input.visibility || 'members',
        uploaded_by: userId,
      },
    });

    return {
      id: document.id,
      url: document.file_url,
      key,
      bucket: S3_BUCKET,
      filename: input.filename,
      mimetype: input.mimetype,
      size: input.size,
      uploadedAt: document.created_at?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Generate presigned URL for direct upload
   */
  async generatePresignedUrl(
    request: PresignedUrlRequest,
    userId: number
  ): Promise<PresignedUrlResponse> {
    const key = this.generateS3Key(request.filename);
    const expiresIn = request.expiresIn || PRESIGNED_URL_EXPIRY;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: request.mimetype,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    return {
      url,
      key,
      bucket: S3_BUCKET,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Process and upload image with variants
   */
  async processAndUploadImage(
    input: FileUploadInput,
    userId: number,
    options?: ImageProcessingOptions
  ): Promise<ProcessedImage> {
    // Upload original
    const original = await this.uploadFile(input, userId);

    const variants: Record<string, FileUploadResult> = {};

    // Generate thumbnail
    if (this.isImage(input.mimetype)) {
      const thumbnailBuffer = await sharp(input.file as Buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnail = await this.uploadFile(
        {
          ...input,
          file: thumbnailBuffer,
          filename: \`thumb_\${input.filename}\`,
          size: thumbnailBuffer.length,
        },
        userId
      );

      // Process additional variants if options provided
      if (options?.resize) {
        const resizedBuffer = await sharp(input.file as Buffer)
          .resize(options.resize.width, options.resize.height, {
            fit: options.resize.fit || 'cover',
          })
          .toFormat(options.format || 'jpeg', { quality: options.quality || 85 })
          .toBuffer();

        variants.resized = await this.uploadFile(
          {
            ...input,
            file: resizedBuffer,
            filename: \`resized_\${input.filename}\`,
            size: resizedBuffer.length,
          },
          userId
        );
      }

      return {
        original,
        thumbnail,
        variants,
      };
    }

    return {
      original,
      variants,
    };
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(documentId: number, expiresIn = 3600): Promise<string> {
    const document = await prisma.documents.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Extract key from URL
    const url = new URL(document.file_url);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateS3Key(filename: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = filename.split('.').pop();
    return \`uploads/\${timestamp}-\${uuid}.\${ext}\`;
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }
}

export default new UploadService();
`,
  },

  payment: {
    domain: 'shop',
    filename: 'payment.service.ts',
    content: `/**
 * Payment Service
 * Handles Stripe payments, webhooks, and subscription management
 */

import Stripe from 'stripe';
import type {
  CreatePaymentIntentInput,
  ConfirmPaymentIntentInput,
  RefundInput,
  StripePaymentIntent,
  StripeWebhookEvent,
} from '@clubmanager/types';
import prisma from '../../../../config/database.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<StripePaymentIntent> {
    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100), // Convert to cents
      currency: input.currency || 'eur',
      payment_method: input.payment_method,
      customer: input.customer_id,
      metadata: {
        order_id: input.order_id?.toString() || '',
        ...input.metadata,
      },
    });

    // Save to database
    const record = await prisma.payments.create({
      data: {
        user_id: 1, // TODO: Get from context
        amount: input.amount,
        payment_method: 'online',
        payment_type: 'product',
        reference_id: input.order_id,
        status: 'pending',
        transaction_id: paymentIntent.id,
        notes: JSON.stringify({ stripe_payment_intent: paymentIntent }),
      },
    });

    return {
      id: record.id,
      stripe_payment_intent_id: paymentIntent.id,
      user_id: record.user_id,
      order_id: input.order_id,
      amount: input.amount,
      currency: input.currency || 'eur',
      status: this.mapStripeStatus(paymentIntent.status),
      payment_method: input.payment_method,
      client_secret: paymentIntent.client_secret || undefined,
      metadata: input.metadata,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<StripePaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.confirm(input.payment_intent_id, {
      payment_method: input.payment_method,
    });

    // Update payment record
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: paymentIntent.id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        },
      });
    }

    return {
      id: payment?.id || 0,
      stripe_payment_intent_id: paymentIntent.id,
      user_id: payment?.user_id || 0,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: this.mapStripeStatus(paymentIntent.status),
      payment_method: input.payment_method,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Process a refund
   */
  async refundPayment(input: RefundInput): Promise<void> {
    await this.stripe.refunds.create({
      payment_intent: input.payment_intent_id,
      amount: input.amount ? Math.round(input.amount * 100) : undefined,
      reason: input.reason,
      metadata: input.metadata,
    });

    // Update payment record
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: input.payment_intent_id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      });
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(payload: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw new Error(\`Webhook signature verification failed: \${err}\`);
    }

    // Log webhook event
    await this.logWebhookEvent(event);

    // Process event
    try {
      await this.processWebhookEvent(event);

      // Mark as succeeded
      await this.updateWebhookStatus(event.id, 'succeeded');
    } catch (error) {
      // Mark as failed
      await this.updateWebhookStatus(event.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async logWebhookEvent(event: Stripe.Event): Promise<void> {
    await prisma.stripe_webhook_events.create({
      data: {
        stripe_event_id: event.id,
        event_type: event.type,
        object_type: (event.data.object as any).object || 'unknown',
        object_id: (event.data.object as any).id || 'unknown',
        status: 'pending',
        payload: event as any,
      },
    });
  }

  private async updateWebhookStatus(
    eventId: string,
    status: 'succeeded' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await prisma.stripe_webhook_events.updateMany({
      where: { stripe_event_id: eventId },
      data: {
        status,
        error_message: errorMessage,
        processed_at: new Date(),
      },
    });
  }

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: paymentIntent.id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'completed' },
      });

      // Update order if exists
      if (payment.reference_id && payment.payment_type === 'product') {
        await prisma.orders.update({
          where: { id: payment.reference_id },
          data: {
            payment_status: 'paid',
            status: 'processing',
          },
        });
      }
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: paymentIntent.id },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const payment = await prisma.payments.findFirst({
      where: { transaction_id: charge.payment_intent as string },
    });

    if (payment) {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      });
    }
  }

  private mapStripeStatus(
    status: string
  ): 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded' {
    return status as any;
  }
}

export default new PaymentService();
`,
  },

  monitoring: {
    domain: 'settings',
    filename: 'monitoring.service.ts',
    content: `/**
 * Monitoring Service
 * Handles health checks, metrics, error logging, and system monitoring
 */

import type {
  HealthCheck,
  HealthCheckDetail,
  MetricsSnapshot,
  MonitoringAlert,
  ErrorLog,
} from '@clubmanager/types';
import prisma from '../../../../config/database.js';

export class MonitoringService {
  /**
   * Perform comprehensive health check
   */
  async getHealthCheck(): Promise<HealthCheck> {
    const checks: HealthCheckDetail[] = [];

    // Database health check
    const dbCheck = await this.checkDatabase();
    checks.push(dbCheck);

    // Determine overall status
    const hasDown = checks.some((c) => c.status === 'down');
    const hasDegraded = checks.some((c) => c.status === 'degraded');

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (hasDown) {
      status = 'unhealthy';
    } else if (hasDegraded) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
      checks,
    };
  }

  /**
   * Get system metrics snapshot
   */
  async getMetrics(): Promise<MetricsSnapshot> {
    return {
      timestamp: new Date().toISOString(),
      http: {
        requests_total: 0, // TODO: Implement request counter
        requests_duration_seconds: {
          count: 0,
          sum: 0,
          buckets: {},
        },
        requests_by_status: {},
        requests_by_path: {},
        active_connections: 0,
      },
      system: {
        process_cpu_usage: process.cpuUsage().user / 1000000,
        process_memory_bytes: process.memoryUsage().heapUsed,
        process_heap_bytes: process.memoryUsage().heapTotal,
        process_uptime_seconds: process.uptime(),
        nodejs_version: process.version,
      },
      business: {
        active_users: await this.getActiveUsersCount(),
        total_orders: await this.getTotalOrdersCount(),
      },
    };
  }

  /**
   * Log an error
   */
  async logError(error: Partial<ErrorLog>): Promise<void> {
    console.error('Error logged:', error);

    // In production, send to external service like Sentry
    // await sentry.captureException(error);
  }

  /**
   * Create a monitoring alert
   */
  async createAlert(alert: Partial<MonitoringAlert>): Promise<MonitoringAlert> {
    console.warn('Alert created:', alert);

    // In production, send notification via email/Slack/etc.
    // await notificationService.sendAlert(alert);

    return alert as MonitoringAlert;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async checkDatabase(): Promise<HealthCheckDetail> {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw\`SELECT 1\`;
      const responseTime = Date.now() - startTime;

      return {
        name: 'database',
        status: responseTime < 100 ? 'up' : 'degraded',
        message: \`Database is accessible (response time: \${responseTime}ms)\`,
        responseTime,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'down',
        message: \`Database is unreachable: \${error}\`,
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      return await prisma.users.count({
        where: { active: true },
      });
    } catch {
      return 0;
    }
  }

  private async getTotalOrdersCount(): Promise<number> {
    try {
      return await prisma.orders.count();
    } catch {
      return 0;
    }
  }
}

export default new MonitoringService();
`,
  },
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

function generateService(domain, serviceName) {
  const template = serviceTemplates[serviceName];

  if (!template) {
    console.error(`❌ Unknown service: ${serviceName}`);
    console.log(`Available services: ${Object.keys(serviceTemplates).join(', ')}`);
    process.exit(1);
  }

  if (template.domain !== domain) {
    console.error(`❌ Service '${serviceName}' belongs to domain '${template.domain}', not '${domain}'`);
    process.exit(1);
  }

  const servicePath = path.join(ROUTES_PATH, domain, 'core', 'services', template.filename);

  // Check if file already exists
  if (fs.existsSync(servicePath)) {
    console.error(`❌ Service already exists: ${servicePath}`);
    process.exit(1);
  }

  // Write file
  fs.writeFileSync(servicePath, template.content, 'utf8');
  console.log(`✅ Created: ${servicePath}`);
}

function generateAll() {
  console.log('🚀 Generating all utility services...\n');

  for (const [serviceName, template] of Object.entries(serviceTemplates)) {
    const servicePath = path.join(ROUTES_PATH, template.domain, 'core', 'services', template.filename);

    if (fs.existsSync(servicePath)) {
      console.log(`⏭️  Skipped (exists): ${servicePath}`);
      continue;
    }

    fs.writeFileSync(servicePath, template.content, 'utf8');
    console.log(`✅ Created: ${servicePath}`);
  }

  console.log('\n✨ All utility services generated successfully!');
}

function showUsage() {
  console.log(`
Usage:
  node scripts/generate-utility-services.js [domain] [service]
  node scripts/generate-utility-services.js --all

Services:
  - auth        (users domain)       JWT authentication, refresh tokens
  - upload      (documents domain)   S3 uploads, presigned URLs
  - payment     (shop domain)        Stripe payments, webhooks
  - monitoring  (settings domain)    Health checks, metrics

Examples:
  node scripts/generate-utility-services.js users auth
  node scripts/generate-utility-services.js documents upload
  node scripts/generate-utility-services.js shop payment
  node scripts/generate-utility-services.js settings monitoring
  node scripts/generate-utility-services.js --all
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

const [domain, serviceName] = args;
generateService(domain, serviceName);
