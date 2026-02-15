/**
 * Types GraphQL pour Auth (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL
 */

/**
 * Utilisateur authentifié (GraphQL)
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  statusId: number;
  status: string;
  role: string;
}

/**
 * Payload d'authentification (GraphQL)
 */
export interface AuthPayload {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

/**
 * Résultat de déconnexion (GraphQL)
 */
export interface LogoutResult {
  success: boolean;
  message: string;
  cookiesCleared: string[];
  headersSet: number;
}

/**
 * Résultat de vérification d'authentification (GraphQL)
 */
export interface VerifyAuthResult {
  success: boolean;
  user: User;
}

/**
 * Résultat de demande de réinitialisation (GraphQL)
 */
export interface ForgotPasswordResult {
  message: string;
}

/**
 * Résultat de vérification de token (GraphQL)
 */
export interface VerifyTokenResult {
  valid: boolean;
  email?: string;
  userName?: string;
  error?: string;
}

/**
 * Résultat de réinitialisation de mot de passe (GraphQL)
 */
export interface ResetPasswordResult {
  message: string;
  error?: string;
}

/**
 * Résultat de rafraîchissement de token (GraphQL)
 */
export interface RefreshTokenResult {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

/**
 * Résultat de statut d'authentification (GraphQL)
 */
export interface StatusResult {
  authenticated: boolean;
  user?: User;
  message?: string;
}

/**
 * Résultat de confirmation d'email (GraphQL)
 */
export interface ConfirmEmailResult {
  success: boolean;
  message: string;
  redirectTo: string;
}

/**
 * Résultat de test (GraphQL)
 */
export interface TestResult {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Input pour connexion (GraphQL)
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Input pour demande de réinitialisation (GraphQL)
 */
export interface ForgotPasswordInput {
  email: string;
}

/**
 * Input pour réinitialisation de mot de passe (GraphQL)
 */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Input pour confirmation d'email (GraphQL)
 */
export interface ConfirmEmailInput {
  token: string;
  userId: string;
}

/**
 * Données de token de réinitialisation
 */
export interface TokenData {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  expiresAt: Date;
}

/**
 * Configuration des cookies
 */
export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain: string;
  maxAge: number;
  path?: string;
}

/**
 * Contexte GraphQL pour Auth
 */
export interface AuthContext {
  user?: User;
  token?: string;
  req?: any;
  res?: any;
}

/**
 * Options de validation de mot de passe
 */
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

/**
 * Résultat de validation de mot de passe
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors?: string[];
}
