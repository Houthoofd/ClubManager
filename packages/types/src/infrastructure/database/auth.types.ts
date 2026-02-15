/**
 * Types Database pour Auth (snake_case pour Prisma/DB)
 * Ces types correspondent aux tables de la base de données
 */

/**
 * Utilisateur dans la DB (pour Auth)
 */
export interface UtilisateurAuthDB {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  nom_utilisateur?: string;
  password?: string;
  date_naissance: string | Date;
  date_inscription: string | Date;
  genre_id: number;
  grade_id: number | null;
  abonnement_id: number | null;
  status_id: number;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Token de réinitialisation de mot de passe dans la DB
 */
export interface PasswordResetTokenDB {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  used_at?: Date | null;
}

/**
 * Token de validation d'email dans la DB
 */
export interface EmailValidationTokenDB {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  validated_at?: Date | null;
}

/**
 * Tentative d'authentification (audit) dans la DB
 */
export interface AuthAttemptDB {
  id: number;
  email: string;
  user_id?: number | null;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  attempted_at: Date;
  failure_reason?: string;
}

/**
 * Session utilisateur dans la DB
 */
export interface UserSessionDB {
  id: number;
  user_id: number;
  token: string;
  refresh_token?: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
  last_activity: Date;
  revoked_at?: Date | null;
}

/**
 * Demande de récupération manuelle dans la DB
 */
export interface ManualRecoveryRequestDB {
  id: number;
  user_id: number;
  reason: string;
  verification_data: any;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  expires_at: Date;
  processed_by?: number | null;
  processed_at?: Date | null;
  rejection_reason?: string;
}

/**
 * Configuration de sécurité utilisateur dans la DB
 */
export interface UserSecurityConfigDB {
  id: number;
  user_id: number;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  backup_codes?: string[];
  last_password_change?: Date;
  password_reset_count: number;
  account_locked: boolean;
  locked_until?: Date | null;
  failed_login_attempts: number;
  last_failed_login?: Date | null;
  updated_at: Date;
}
