/**
 * Types pour l'authentification et la gestion des comptes
 * Alignés avec le schéma Prisma
 */

/**
 * Résultat d'une opération d'authentification
 */
export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    status_id: number;
  };
}

/**
 * Données pour créer un compte utilisateur
 */
export interface CreateUserInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

/**
 * Données pour modifier le mot de passe
 */
export interface ChangePasswordInput {
  user_id: number;
  current_password?: string;
  new_password: string;
}

/**
 * Token de récupération de mot de passe
 */
export interface PasswordResetToken {
  id: number;
  utilisateur_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  used_at?: Date | null;
  utilisateur?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Informations de sécurité d'un utilisateur
 */
export interface SecurityInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  date_inscription: Date;
  nb_paiements: number;
  nb_inscriptions: number;
  dernier_paiement?: Date;
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
  new_password: string;
}

/**
 * Tentative d'authentification (audit)
 */
export interface AuthAttempt {
  id: number;
  email: string;
  ip_address?: string | null;
  user_agent?: string | null;
  success: boolean;
  attempted_at: Date;
}

/**
 * Demande de récupération manuelle
 */
export interface ManualRecoveryRequest {
  id: number;
  utilisateur_id: number;
  reason: string;
  verification_data?: any;
  status: "pending" | "approved" | "rejected" | "expired";
  admin_notes?: string | null;
  processed_by?: number | null;
  processed_at?: Date | null;
  created_at: Date;
  expires_at?: Date | null;
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
  total_users: number;
  active_users: number;
  auth_attempts_today: number;
  successful_auths_today: number;
  failed_auths_today: number;
  success_rate: number;
  reset_tokens_active: number;
}

/**
 * Token de validation d'email
 */
export interface EmailValidationToken {
  id: number;
  utilisateur_id: number;
  token: string;
  type: "email_confirmation" | "password_setup";
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

/**
 * Refresh token
 */
export interface RefreshToken {
  id: number;
  utilisateur_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date | null;
  replaced_by?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Code de récupération SMS
 */
export interface SmsRecoveryCode {
  id: number;
  utilisateur_id: number;
  phone: string;
  code: string;
  attempts: number;
  expires_at: Date;
  created_at: Date;
  used_at?: Date | null;
}

/**
 * Tentative de réinitialisation de mot de passe
 */
export interface PasswordResetAttempt {
  id: number;
  email: string;
  ip_address?: string | null;
  user_agent?: string | null;
  success: boolean;
  attempted_at: Date;
}
