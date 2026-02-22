/**
 * Authentication & Authorization Domain Types
 *
 * Comprehensive type definitions for authentication, authorization,
 * user management, and session handling across the ClubManager application.
 */

import type { ID, Timestamps } from "../../core/common.js";

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User role enumeration
 */
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  TEACHER = "TEACHER",
  MANAGER = "MANAGER",
}

/**
 * User status enumeration
 */
export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

/**
 * Base user interface
 */
export interface User {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  date_naissance?: Date | string | null;
  telephone?: string | null;
  adresse?: string | null;
  status_id: number;
  role?: UserRole;
  avatar?: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Authenticated user (with sensitive fields removed)
 */
export interface AuthUser {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role?: UserRole | string;
  avatar?: string | null;
  date_naissance?: Date | string | null;
  telephone?: string | null;
  adresse?: string | null;
  status_id?: number;
}

/**
 * User profile (public information)
 */
export interface UserProfile {
  id: number;
  prenom: string;
  nom: string;
  avatar?: string | null;
  bio?: string | null;
}

/**
 * Full user with all relations
 */
export interface UserWithRelations extends User {
  status?: {
    id: number;
    nom: string;
  };
  abonnement?: {
    id: number;
    nom: string;
  };
}

// ============================================================================
// CREDENTIALS & LOGIN
// ============================================================================

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Token payload (JWT)
 */
export interface TokenPayload {
  userId: number;
  email: string;
  role?: string;
  status_id?: number;
  iat?: number;
  exp?: number;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Registration data
 */
export interface RegisterData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  confirmPassword?: string;
  date_naissance: string | Date;
  abonnement: string;
  genre: string;
  telephone?: string;
  adresse?: string;
  acceptTerms?: boolean;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
  requiresVerification?: boolean;
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Change password data
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Reset password data
 */
export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Password reset response
 */
export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * Password validation rules
 */
export interface PasswordRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Password strength result
 */
export interface PasswordStrength {
  score: number; // 0-4
  strength: "weak" | "fair" | "good" | "strong" | "very-strong";
  feedback: string[];
  passed: boolean;
}

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/**
 * Email verification data
 */
export interface EmailVerificationData {
  token: string;
  email?: string;
}

/**
 * Email verification response
 */
export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

/**
 * Resend verification email request
 */
export interface ResendVerificationRequest {
  email: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Session data
 */
export interface SessionData {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt: string | Date;
  createdAt?: string | Date;
}

/**
 * Session info
 */
export interface SessionInfo {
  id: string;
  userId: number;
  device?: string;
  browser?: string;
  ip?: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

/**
 * Active sessions list
 */
export interface ActiveSessions {
  current: SessionInfo;
  others: SessionInfo[];
  total: number;
}

// ============================================================================
// AUTHENTICATION STATE
// ============================================================================

/**
 * Authentication state
 */
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication status
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean;
  user: AuthUser | null;
}

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Update profile data
 */
export interface UpdateProfileData {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  date_naissance?: string | Date;
  avatar?: string;
  bio?: string;
}

/**
 * Update profile response
 */
export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

/**
 * Avatar upload data
 */
export interface AvatarUploadData {
  file: File | Blob;
  userId: number;
}

/**
 * Avatar upload response
 */
export interface AvatarUploadResponse {
  success: boolean;
  url?: string;
  message?: string;
}

// ============================================================================
// AUTHORIZATION & PERMISSIONS
// ============================================================================

/**
 * Permission type
 */
export type Permission =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "manage"
  | "admin";

/**
 * Resource type
 */
export type Resource =
  | "users"
  | "courses"
  | "messages"
  | "orders"
  | "shop"
  | "settings"
  | "statistics"
  | "teachers";

/**
 * Permission check
 */
export interface PermissionCheck {
  resource: Resource;
  permission: Permission;
  userId?: number;
}

/**
 * Role permissions
 */
export interface RolePermissions {
  role: UserRole;
  permissions: Array<{
    resource: Resource;
    actions: Permission[];
  }>;
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION (2FA)
// ============================================================================

/**
 * 2FA method
 */
export type TwoFactorMethod = "totp" | "sms" | "email";

/**
 * 2FA status
 */
export interface TwoFactorStatus {
  enabled: boolean;
  method?: TwoFactorMethod;
  backupCodesRemaining?: number;
}

/**
 * Enable 2FA request
 */
export interface EnableTwoFactorRequest {
  method: TwoFactorMethod;
  phoneNumber?: string; // for SMS
}

/**
 * Enable 2FA response
 */
export interface EnableTwoFactorResponse {
  success: boolean;
  secret?: string; // TOTP secret
  qrCode?: string; // QR code for TOTP
  backupCodes?: string[];
}

/**
 * Verify 2FA code
 */
export interface VerifyTwoFactorRequest {
  code: string;
  userId: number;
}

/**
 * Verify 2FA response
 */
export interface VerifyTwoFactorResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// ACCOUNT SETTINGS
// ============================================================================

/**
 * Privacy settings
 */
export interface PrivacySettings {
  profileVisibility: "public" | "private" | "friends";
  showEmail: boolean;
  showPhone: boolean;
  showBirthday: boolean;
  allowMessages: boolean;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  courses: boolean;
  messages: boolean;
  orders: boolean;
  marketing: boolean;
}

/**
 * Account settings
 */
export interface AccountSettings {
  privacy: PrivacySettings;
  notifications: NotificationPreferences;
  language: string;
  timezone: string;
}

// ============================================================================
// OAUTH / SOCIAL LOGIN
// ============================================================================

/**
 * OAuth provider
 */
export type OAuthProvider = "google" | "facebook" | "github" | "apple";

/**
 * OAuth login request
 */
export interface OAuthLoginRequest {
  provider: OAuthProvider;
  code: string;
  redirectUri?: string;
}

/**
 * OAuth login response
 */
export interface OAuthLoginResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  isNewUser?: boolean;
}

/**
 * Linked account
 */
export interface LinkedAccount {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  linkedAt: Date;
}

// ============================================================================
// VALIDATION & ERRORS
// ============================================================================

/**
 * Auth form validation errors
 */
export interface AuthFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  prenom?: string;
  nom?: string;
  date_naissance?: string;
  telephone?: string;
  currentPassword?: string;
  newPassword?: string;
  general?: string;
}

/**
 * Auth error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  ACCOUNT_NOT_VERIFIED = "ACCOUNT_NOT_VERIFIED",
  PASSWORD_TOO_WEAK = "PASSWORD_TOO_WEAK",
  INVALID_2FA_CODE = "INVALID_2FA_CODE",
  SESSION_EXPIRED = "SESSION_EXPIRED",
}

/**
 * Auth error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// AUDIT & SECURITY
// ============================================================================

/**
 * Login attempt
 */
export interface LoginAttempt {
  userId?: number;
  email: string;
  success: boolean;
  ip: string;
  userAgent: string;
  timestamp: Date;
  failureReason?: string;
}

/**
 * Security event type
 */
export type SecurityEventType =
  | "login"
  | "logout"
  | "password_change"
  | "password_reset"
  | "email_change"
  | "2fa_enabled"
  | "2fa_disabled"
  | "account_locked"
  | "suspicious_activity";

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  userId: number;
  type: SecurityEventType;
  ip: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Account activity
 */
export interface AccountActivity {
  recentLogins: LoginAttempt[];
  securityEvents: SecurityEvent[];
  activeSessions: SessionInfo[];
}

// ============================================================================
// ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Delete account request
 */
export interface DeleteAccountRequest {
  password: string;
  reason?: string;
  feedback?: string;
}

/**
 * Delete account response
 */
export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  scheduledDeletionDate?: Date;
}

/**
 * Account recovery request
 */
export interface AccountRecoveryRequest {
  email: string;
  verificationCode?: string;
}

/**
 * Account recovery response
 */
export interface AccountRecoveryResponse {
  success: boolean;
  message: string;
  recoveryToken?: string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type Users = User;
export type UsersInsert = User;
export type UsersUpdate = Partial<User>;
