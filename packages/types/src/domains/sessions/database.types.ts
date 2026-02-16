/**
 * Database Types pour le module Sessions
 * Types snake_case correspondant aux colonnes de la base de données
 *
 * @module sessions/database.types
 */

// ============================================================================
// SESSION DATABASE TYPES
// ============================================================================

/**
 * Session dans la base de données (snake_case)
 */
export interface SessionDB {
  id: string;
  token: string;
  user_id: number;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  is_active: boolean;
  last_activity_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type pour création d'une session dans la DB
 */
export interface SessionInsertDB {
  id?: string;
  token: string;
  user_id: number;
  ip_address?: string | null;
  user_agent?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  is_active?: boolean;
  last_activity_at?: Date;
  expires_at: Date;
}

/**
 * Type pour mise à jour d'une session dans la DB
 */
export interface SessionUpdateDB {
  is_active?: boolean;
  last_activity_at?: Date;
  updated_at?: Date;
}

// ============================================================================
// SESSION QUERY RESULT TYPES
// ============================================================================

/**
 * Session avec informations de l'utilisateur (JOIN)
 */
export interface SessionQueryResult extends SessionDB {
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  user_user_id?: string;
  user_nom_utilisateur?: string;
}

// ============================================================================
// SESSION CLEANUP TYPES
// ============================================================================

/**
 * Requête pour nettoyer les sessions
 */
export interface SessionCleanupQuery {
  before_date: Date;
  is_active?: boolean;
}

/**
 * Requête pour récupérer les sessions d'un utilisateur
 */
export interface SessionsByUserQuery {
  user_id: number;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SESSION STATISTICS TYPES
// ============================================================================

/**
 * Statistiques des sessions dans la DB
 */
export interface SessionStatsDB {
  total_sessions: number;
  active_sessions: number;
  expired_sessions: number;
}

/**
 * Statistiques par type d'appareil
 */
export interface SessionDeviceStatsDB {
  device_type: string | null;
  count: number;
}

/**
 * Statistiques par navigateur
 */
export interface SessionBrowserStatsDB {
  browser: string | null;
  count: number;
}

/**
 * Statistiques par système d'exploitation
 */
export interface SessionOsStatsDB {
  os: string | null;
  count: number;
}

/**
 * Statistiques des sessions par utilisateur
 */
export interface UserSessionStatsDB {
  user_id: number;
  total_sessions: number;
  active_sessions: number;
  last_activity_at: Date | null;
  most_used_device: string | null;
  most_used_browser: string | null;
  most_used_os: string | null;
}
