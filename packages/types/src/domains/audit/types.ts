/**
 * Types pour le domaine Audit
 * Journalisation des événements de sécurité et actions utilisateur
 *
 * @module audit/types
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Type d'événement d'audit
 */
export enum AuditEventType {
  // Authentication
  LOGIN = "login",
  LOGOUT = "logout",
  LOGIN_FAILED = "login_failed",
  PASSWORD_RESET = "password_reset",
  PASSWORD_CHANGE = "password_change",
  EMAIL_VERIFICATION = "email_verification",
  TWO_FACTOR_ENABLED = "two_factor_enabled",
  TWO_FACTOR_DISABLED = "two_factor_disabled",

  // User Management
  USER_CREATED = "user_created",
  USER_UPDATED = "user_updated",
  USER_DELETED = "user_deleted",
  USER_SUSPENDED = "user_suspended",
  USER_REACTIVATED = "user_reactivated",

  // Session Management
  SESSION_CREATED = "session_created",
  SESSION_REVOKED = "session_revoked",
  SESSION_EXPIRED = "session_expired",

  // Data Access
  DATA_ACCESSED = "data_accessed",
  DATA_EXPORTED = "data_exported",
  DATA_IMPORTED = "data_imported",

  // GDPR
  CONSENT_GIVEN = "consent_given",
  CONSENT_REVOKED = "consent_revoked",
  DATA_EXPORT_REQUESTED = "data_export_requested",
  ACCOUNT_DELETION_REQUESTED = "account_deletion_requested",

  // Payments
  PAYMENT_CREATED = "payment_created",
  PAYMENT_COMPLETED = "payment_completed",
  PAYMENT_FAILED = "payment_failed",
  PAYMENT_REFUNDED = "payment_refunded",

  // Orders
  ORDER_CREATED = "order_created",
  ORDER_UPDATED = "order_updated",
  ORDER_CANCELLED = "order_cancelled",

  // System
  SYSTEM_ERROR = "system_error",
  CONFIGURATION_CHANGED = "configuration_changed",
  API_KEY_CREATED = "api_key_created",
  API_KEY_REVOKED = "api_key_revoked",

  // Security
  SECURITY_ALERT = "security_alert",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  UNAUTHORIZED_ACCESS = "unauthorized_access",

  // Other
  OTHER = "other",
}

/**
 * Niveau de sévérité d'un événement
 */
export enum AuditSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

/**
 * Représente un log d'audit
 *
 * @example
 * const auditLog: AuditLog = {
 *   id: "cuid123",
 *   event_type: "login",
 *   severity: "info",
 *   user_id: 1,
 *   ip_address: "192.168.1.1",
 *   user_agent: "Mozilla/5.0...",
 *   resource: "users",
 *   action: "read",
 *   success: true,
 *   message: "User logged in successfully",
 *   timestamp: new Date(),
 * };
 */
export interface AuditLog {
  /** Identifiant unique (CUID) */
  id: string;

  /** Type d'événement */
  event_type: string;

  /** Niveau de sévérité */
  severity: string;

  /** ID de l'utilisateur concerné */
  user_id?: number | null;

  /** Adresse IP */
  ip_address?: string | null;

  /** User agent du navigateur */
  user_agent?: string | null;

  /** Ressource affectée (table, entité) */
  resource?: string | null;

  /** Action effectuée (create, read, update, delete) */
  action?: string | null;

  /** L'action a-t-elle réussi ? */
  success: boolean;

  /** Code d'erreur (si échec) */
  error_code?: string | null;

  /** Message descriptif */
  message?: string | null;

  /** Métadonnées additionnelles (JSON) */
  metadata?: Record<string, any> | null;

  /** Timestamp de l'événement */
  timestamp: Date;
}

/**
 * Données pour créer un log d'audit
 */
export interface CreateAuditLogInput {
  event_type: string | AuditEventType;
  severity: string | AuditSeverity;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  resource?: string;
  action?: string;
  success?: boolean;
  error_code?: string;
  message?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// AUDIT LOG WITH RELATIONS
// ============================================================================

/**
 * Log d'audit avec informations de l'utilisateur
 */
export interface AuditLogWithUser extends AuditLog {
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
// QUERY & FILTER TYPES
// ============================================================================

/**
 * Filtre pour récupérer les logs d'audit
 */
export interface GetAuditLogsInput {
  user_id?: number;
  event_type?: string | AuditEventType;
  severity?: string | AuditSeverity;
  resource?: string;
  action?: string;
  success?: boolean;
  start_date?: Date | string;
  end_date?: Date | string;
  ip_address?: string;
  include_user?: boolean;
  limit?: number;
  offset?: number;
  order_by?: "timestamp" | "severity" | "event_type";
  order_direction?: "asc" | "desc";
}

/**
 * Filtre pour les logs d'audit de sécurité
 */
export interface GetSecurityAuditLogsInput {
  severity?: AuditSeverity;
  start_date?: Date | string;
  end_date?: Date | string;
  include_user?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Filtre pour les logs d'audit d'un utilisateur
 */
export interface GetUserAuditLogsInput {
  user_id: number;
  event_type?: string | AuditEventType;
  start_date?: Date | string;
  end_date?: Date | string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// AUDIT STATISTICS
// ============================================================================

/**
 * Statistiques des logs d'audit
 */
export interface AuditStats {
  total_logs: number;
  total_success: number;
  total_failures: number;
  logs_by_severity: {
    severity: string;
    count: number;
  }[];
  logs_by_event_type: {
    event_type: string;
    count: number;
  }[];
  logs_by_user: {
    user_id: number;
    user_name?: string;
    count: number;
  }[];
  period_start?: Date;
  period_end?: Date;
}

/**
 * Statistiques de sécurité
 */
export interface SecurityStats {
  total_security_events: number;
  failed_login_attempts: number;
  suspicious_activities: number;
  unauthorized_access_attempts: number;
  rate_limit_exceeded: number;
  recent_critical_events: AuditLog[];
  top_attacked_users?: {
    user_id: number;
    user_name?: string;
    failed_attempts: number;
  }[];
  top_attacking_ips?: {
    ip_address: string;
    attempt_count: number;
  }[];
}

/**
 * Statistiques d'activité utilisateur
 */
export interface UserActivityStats {
  user_id: number;
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  last_activity?: Date;
  most_common_actions: {
    action: string;
    count: number;
  }[];
  actions_by_date: {
    date: string;
    count: number;
  }[];
}

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

/**
 * Résultat de création d'un log d'audit
 */
export interface CreateAuditLogResult {
  success: boolean;
  message: string;
  auditLog?: AuditLog;
  error?: string;
}

/**
 * Résultat de récupération des logs d'audit
 */
export interface GetAuditLogsResult {
  success: boolean;
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
  error?: string;
}

/**
 * Résultat de nettoyage des anciens logs
 */
export interface CleanupOldLogsResult {
  success: boolean;
  message: string;
  deleted_count: number;
  error?: string;
}

// ============================================================================
// LIST TYPES
// ============================================================================

/**
 * Liste paginée de logs d'audit
 */
export interface AuditLogsList {
  items: AuditLog[];
  total: number;
  hasMore: boolean;
}

/**
 * Liste de logs d'audit avec informations utilisateur
 */
export interface AuditLogsWithUserList {
  items: AuditLogWithUser[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// AUDIT TRAIL TYPES
// ============================================================================

/**
 * Piste d'audit pour une ressource spécifique
 */
export interface ResourceAuditTrail {
  resource: string;
  resource_id: string | number;
  events: AuditLog[];
  created_at?: Date;
  created_by?: number;
  last_modified_at?: Date;
  last_modified_by?: number;
  total_changes: number;
}

/**
 * Changement d'une ressource
 */
export interface ResourceChange {
  field: string;
  old_value: any;
  new_value: any;
  changed_at: Date;
  changed_by: number;
}

/**
 * Historique complet d'une ressource
 */
export interface ResourceHistory {
  resource: string;
  resource_id: string | number;
  changes: ResourceChange[];
  audit_logs: AuditLog[];
}
