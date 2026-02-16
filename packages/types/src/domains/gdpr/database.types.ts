/**
 * Database Types pour le module GDPR
 * Types snake_case correspondant aux colonnes de la base de données
 *
 * @module gdpr/database.types
 */

// ============================================================================
// USER CONSENT DATABASE TYPES
// ============================================================================

/**
 * Consentement utilisateur dans la base de données (snake_case)
 */
export interface UserConsentDB {
  id: number;
  user_id: number;
  consent_type:
    | "MARKETING"
    | "ANALYTICS"
    | "TERMS"
    | "PRIVACY"
    | "DATA_PROCESSING";
  given: boolean;
  ip_address: string | null;
  user_agent: string | null;
  given_at: Date;
  revoked_at: Date | null;
  version: string | null;
}

/**
 * Type pour création d'un consentement dans la DB
 */
export interface UserConsentInsertDB {
  user_id: number;
  consent_type:
    | "MARKETING"
    | "ANALYTICS"
    | "TERMS"
    | "PRIVACY"
    | "DATA_PROCESSING";
  given: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  given_at?: Date;
  version?: string | null;
}

/**
 * Type pour mise à jour d'un consentement dans la DB
 */
export interface UserConsentUpdateDB {
  given?: boolean;
  revoked_at?: Date | null;
}

// ============================================================================
// DATA EXPORT REQUEST DATABASE TYPES
// ============================================================================

/**
 * Demande d'export de données dans la base de données
 */
export interface DataExportRequestDB {
  id: number;
  user_id: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  requested_at: Date;
  processing_started_at: Date | null;
  completed_at: Date | null;
  expires_at: Date | null;
  file_path: string | null;
  file_size_bytes: bigint | null;
  request_ip: string | null;
  download_count: number;
  last_downloaded_at: Date | null;
  error_message: string | null;
}

/**
 * Type pour création d'une demande d'export dans la DB
 */
export interface DataExportRequestInsertDB {
  user_id: number;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  requested_at?: Date;
  request_ip?: string | null;
  download_count?: number;
}

/**
 * Type pour mise à jour d'une demande d'export dans la DB
 */
export interface DataExportRequestUpdateDB {
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  processing_started_at?: Date | null;
  completed_at?: Date | null;
  expires_at?: Date | null;
  file_path?: string | null;
  file_size_bytes?: bigint | null;
  download_count?: number;
  last_downloaded_at?: Date | null;
  error_message?: string | null;
}

// ============================================================================
// ACCOUNT DELETION REQUEST DATABASE TYPES
// ============================================================================

/**
 * Demande de suppression de compte dans la base de données
 */
export interface AccountDeletionRequestDB {
  id: number;
  user_id: number;
  status:
    | "PENDING"
    | "APPROVED"
    | "PROCESSING"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED";
  reason: string | null;
  requested_at: Date;
  approved_at: Date | null;
  approved_by: number | null;
  completed_at: Date | null;
  rejection_reason: string | null;
  request_ip: string | null;
}

/**
 * Type pour création d'une demande de suppression dans la DB
 */
export interface AccountDeletionRequestInsertDB {
  user_id: number;
  status?:
    | "PENDING"
    | "APPROVED"
    | "PROCESSING"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED";
  reason?: string | null;
  requested_at?: Date;
  request_ip?: string | null;
}

/**
 * Type pour mise à jour d'une demande de suppression dans la DB
 */
export interface AccountDeletionRequestUpdateDB {
  status?:
    | "PENDING"
    | "APPROVED"
    | "PROCESSING"
    | "COMPLETED"
    | "REJECTED"
    | "CANCELLED";
  approved_at?: Date | null;
  approved_by?: number | null;
  completed_at?: Date | null;
  rejection_reason?: string | null;
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

/**
 * Consentement avec informations de l'utilisateur
 */
export interface UserConsentQueryResult extends UserConsentDB {
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  user_user_id?: string;
}

/**
 * Demande d'export avec informations de l'utilisateur
 */
export interface DataExportRequestQueryResult extends DataExportRequestDB {
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  user_user_id?: string;
}

/**
 * Demande de suppression avec informations complètes
 */
export interface AccountDeletionRequestQueryResult extends AccountDeletionRequestDB {
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  user_user_id?: string;
  approver_first_name?: string;
  approver_last_name?: string;
  approver_email?: string;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Statistiques des consentements par type
 */
export interface ConsentStatsByTypeDB {
  consent_type: string;
  total_given: number;
  total_revoked: number;
  total_active: number;
}

/**
 * Statistiques des demandes d'export
 */
export interface DataExportStatsDB {
  total_requests: number;
  pending_requests: number;
  processing_requests: number;
  completed_requests: number;
  failed_requests: number;
  expired_requests: number;
}

/**
 * Statistiques des demandes de suppression
 */
export interface AccountDeletionStatsDB {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  processing_requests: number;
  completed_requests: number;
  rejected_requests: number;
  cancelled_requests: number;
}

/**
 * Conformité GDPR d'un utilisateur
 */
export interface UserGdprComplianceDB {
  user_id: number;
  has_marketing_consent: boolean;
  has_analytics_consent: boolean;
  has_terms_consent: boolean;
  has_privacy_consent: boolean;
  has_data_processing_consent: boolean;
  is_compliant: boolean;
  last_consent_date: Date | null;
  has_pending_export: boolean;
  has_pending_deletion: boolean;
}

/**
 * Rapport de conformité GDPR global
 */
export interface GdprComplianceReportDB {
  total_users: number;
  compliant_users: number;
  non_compliant_users: number;
  pending_exports: number;
  pending_deletions: number;
  completed_exports_last_30_days: number;
  completed_deletions_last_30_days: number;
  generated_at: Date;
}
