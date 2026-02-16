/**
 * Types pour le domaine Sessions
 * Gestion des sessions utilisateur
 *
 * @module sessions/types
 */

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Représente une session utilisateur
 *
 * @example
 * const session: Session = {
 *   id: "cuid123",
 *   token: "unique_token",
 *   user_id: 1,
 *   ip_address: "192.168.1.1",
 *   user_agent: "Mozilla/5.0...",
 *   device_type: "desktop",
 *   browser: "Chrome",
 *   os: "Windows",
 *   is_active: true,
 *   last_activity_at: new Date(),
 *   expires_at: new Date(),
 *   created_at: new Date(),
 *   updated_at: new Date(),
 * };
 */
export interface Session {
  /** Identifiant unique (CUID) */
  id: string;

  /** Token de session unique */
  token: string;

  /** ID de l'utilisateur */
  user_id: number;

  /** Adresse IP de connexion */
  ip_address?: string | null;

  /** User agent du navigateur */
  user_agent?: string | null;

  /** Type d'appareil (desktop, mobile, tablet) */
  device_type?: string | null;

  /** Navigateur utilisé */
  browser?: string | null;

  /** Système d'exploitation */
  os?: string | null;

  /** La session est-elle active ? */
  is_active: boolean;

  /** Dernière activité de la session */
  last_activity_at: Date;

  /** Date d'expiration de la session */
  expires_at: Date;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer une nouvelle session
 */
export interface CreateSessionInput {
  user_id: number;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  expires_at: Date | string;
}

/**
 * Données pour mettre à jour une session
 */
export interface UpdateSessionInput {
  is_active?: boolean;
  last_activity_at?: Date | string;
}

// ============================================================================
// SESSION WITH USER INFO
// ============================================================================

/**
 * Session avec informations de l'utilisateur
 */
export interface SessionWithUser extends Session {
  /** Informations de l'utilisateur */
  user?: {
    id: number;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    nom_utilisateur: string;
  };
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Filtre pour récupérer les sessions
 */
export interface GetSessionsInput {
  user_id?: number;
  is_active?: boolean;
  include_user?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Requête pour récupérer une session par token
 */
export interface GetSessionByTokenInput {
  token: string;
  include_user?: boolean;
}

/**
 * Requête pour nettoyer les sessions expirées
 */
export interface CleanupExpiredSessionsInput {
  before_date?: Date | string;
}

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

/**
 * Résultat de création d'une session
 */
export interface CreateSessionResult {
  success: boolean;
  message: string;
  session?: Session;
  token?: string;
  error?: string;
}

/**
 * Résultat de validation d'une session
 */
export interface ValidateSessionResult {
  success: boolean;
  valid: boolean;
  session?: Session;
  user_id?: number;
  message?: string;
  error?: string;
}

/**
 * Résultat de révocation d'une session
 */
export interface RevokeSessionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Résultat de révocation de toutes les sessions d'un utilisateur
 */
export interface RevokeAllUserSessionsResult {
  success: boolean;
  message: string;
  revoked_count: number;
  error?: string;
}

/**
 * Résultat du nettoyage des sessions expirées
 */
export interface CleanupExpiredSessionsResult {
  success: boolean;
  message: string;
  deleted_count: number;
  error?: string;
}

// ============================================================================
// SESSION STATISTICS
// ============================================================================

/**
 * Statistiques globales des sessions
 */
export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  expired_sessions: number;
  sessions_by_device?: {
    device_type: string;
    count: number;
  }[];
  sessions_by_browser?: {
    browser: string;
    count: number;
  }[];
  sessions_by_os?: {
    os: string;
    count: number;
  }[];
}

/**
 * Statistiques des sessions d'un utilisateur
 */
export interface UserSessionStats {
  user_id: number;
  total_sessions: number;
  active_sessions: number;
  last_activity?: Date;
  most_used_device?: string;
  most_used_browser?: string;
  most_used_os?: string;
  average_session_duration?: number; // en minutes
}

// ============================================================================
// LIST TYPES
// ============================================================================

/**
 * Liste paginée de sessions
 */
export interface SessionsList {
  items: Session[];
  total: number;
  hasMore: boolean;
}

/**
 * Liste de sessions avec informations utilisateur
 */
export interface SessionsWithUserList {
  items: SessionWithUser[];
  total: number;
  hasMore: boolean;
}
