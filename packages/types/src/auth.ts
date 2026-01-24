/**
 * Types pour l'authentification et la gestion des comptes
 */

/**
 * Résultat d'une opération d'authentification
 */
export interface AuthResult {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    statusId: number;
  };
}

/**
 * Données pour créer un compte utilisateur
 */
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Données pour modifier le mot de passe
 */
export interface ChangePasswordInput {
  userId: number;
  currentPassword?: string;
  newPassword: string;
}

/**
 * Token de récupération de mot de passe
 */
export interface PasswordResetToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Informations de sécurité d'un utilisateur
 */
export interface SecurityInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  dateInscription: Date;
  nbPaiements: number;
  nbInscriptions: number;
  dernierPaiement?: Date;
}

/**
 * Résultat de validation de mot de passe
 */
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Données pour créer un token de récupération
 */
export interface CreateResetTokenInput {
  email: string;
}

/**
 * Données pour réinitialiser le mot de passe
 */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Tentative d'authentification (audit)
 */
export interface AuthAttempt {
  id: number;
  email: string;
  success: boolean;
  attemptedAt: Date;
}

/**
 * Demande de récupération manuelle
 */
export interface ManualRecoveryRequest {
  id: number;
  userId: number;
  reason: string;
  verificationData: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
  processedBy?: number;
  processedAt?: Date;
}

/**
 * Résultat de vérification d'email
 */
export interface EmailCheckResult {
  exists: boolean;
  email: string;
}

/**
 * Statistiques d'authentification
 */
export interface AuthStats {
  totalUsers: number;
  activeUsers: number;
  authAttemptsToday: number;
  successfulAuthsToday: number;
  failedAuthsToday: number;
  successRate: number;
  resetTokensActive: number;
}
