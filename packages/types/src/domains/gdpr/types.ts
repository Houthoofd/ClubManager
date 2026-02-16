/**
 * Types pour le domaine GDPR
 * Gestion de la conformité GDPR (consentements, exports de données, suppressions)
 *
 * @module gdpr/types
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Type de consentement utilisateur
 */
export enum UserConsentType {
  MARKETING = "MARKETING",
  ANALYTICS = "ANALYTICS",
  TERMS = "TERMS",
  PRIVACY = "PRIVACY",
  DATA_PROCESSING = "DATA_PROCESSING",
}

/**
 * Statut d'une demande d'export de données
 */
export enum DataExportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

/**
 * Statut d'une demande de suppression de compte
 */
export enum AccountDeletionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// USER CONSENT TYPES
// ============================================================================

/**
 * Représente un consentement utilisateur
 *
 * @example
 * const consent: UserConsent = {
 *   id: 1,
 *   user_id: 123,
 *   consent_type: "MARKETING",
 *   given: true,
 *   ip_address: "192.168.1.1",
 *   user_agent: "Mozilla/5.0...",
 *   given_at: new Date(),
 *   version: "1.0",
 * };
 */
export interface UserConsent {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** Type de consentement */
  consent_type: UserConsentType;

  /** Le consentement a-t-il été donné ? */
  given: boolean;

  /** Adresse IP lors du consentement */
  ip_address?: string | null;

  /** User agent du navigateur */
  user_agent?: string | null;

  /** Date à laquelle le consentement a été donné */
  given_at: Date;

  /** Date à laquelle le consentement a été révoqué */
  revoked_at?: Date | null;

  /** Version du document de consentement */
  version?: string | null;
}

/**
 * Données pour créer un consentement
 */
export interface CreateUserConsentInput {
  user_id: number;
  consent_type: UserConsentType | string;
  given: boolean;
  ip_address?: string;
  user_agent?: string;
  version?: string;
}

/**
 * Données pour mettre à jour un consentement
 */
export interface UpdateUserConsentInput {
  given?: boolean;
  revoked_at?: Date | string;
}

/**
 * Données pour révoquer un consentement
 */
export interface RevokeConsentInput {
  user_id: number;
  consent_type: UserConsentType | string;
}

// ============================================================================
// DATA EXPORT REQUEST TYPES
// ============================================================================

/**
 * Représente une demande d'export de données
 *
 * @example
 * const exportRequest: DataExportRequest = {
 *   id: 1,
 *   user_id: 123,
 *   status: "PENDING",
 *   requested_at: new Date(),
 *   request_ip: "192.168.1.1",
 *   download_count: 0,
 * };
 */
export interface DataExportRequest {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** Statut de la demande */
  status: DataExportStatus;

  /** Date de la demande */
  requested_at: Date;

  /** Date de début du traitement */
  processing_started_at?: Date | null;

  /** Date de fin du traitement */
  completed_at?: Date | null;

  /** Date d'expiration du fichier */
  expires_at?: Date | null;

  /** Chemin du fichier généré */
  file_path?: string | null;

  /** Taille du fichier en octets */
  file_size_bytes?: bigint | null;

  /** Adresse IP de la demande */
  request_ip?: string | null;

  /** Nombre de téléchargements */
  download_count: number;

  /** Date du dernier téléchargement */
  last_downloaded_at?: Date | null;

  /** Message d'erreur (si échec) */
  error_message?: string | null;
}

/**
 * Données pour créer une demande d'export
 */
export interface CreateDataExportRequestInput {
  user_id: number;
  request_ip?: string;
}

/**
 * Données pour mettre à jour une demande d'export
 */
export interface UpdateDataExportRequestInput {
  status?: DataExportStatus;
  processing_started_at?: Date | string;
  completed_at?: Date | string;
  expires_at?: Date | string;
  file_path?: string;
  file_size_bytes?: bigint | number;
  error_message?: string;
}

/**
 * Demande d'export avec informations utilisateur
 */
export interface DataExportRequestWithUser extends DataExportRequest {
  /** Informations de l'utilisateur */
  user?: {
    id: number;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// ============================================================================
// ACCOUNT DELETION REQUEST TYPES
// ============================================================================

/**
 * Représente une demande de suppression de compte
 *
 * @example
 * const deletionRequest: AccountDeletionRequest = {
 *   id: 1,
 *   user_id: 123,
 *   status: "PENDING",
 *   reason: "Je ne souhaite plus utiliser le service",
 *   requested_at: new Date(),
 *   request_ip: "192.168.1.1",
 * };
 */
export interface AccountDeletionRequest {
  /** Identifiant unique */
  id: number;

  /** ID de l'utilisateur */
  user_id: number;

  /** Statut de la demande */
  status: AccountDeletionStatus;

  /** Raison de la suppression */
  reason?: string | null;

  /** Date de la demande */
  requested_at: Date;

  /** Date d'approbation */
  approved_at?: Date | null;

  /** ID de l'approbateur */
  approved_by?: number | null;

  /** Date de finalisation */
  completed_at?: Date | null;

  /** Raison du rejet */
  rejection_reason?: string | null;

  /** Adresse IP de la demande */
  request_ip?: string | null;
}

/**
 * Données pour créer une demande de suppression
 */
export interface CreateAccountDeletionRequestInput {
  user_id: number;
  reason?: string;
  request_ip?: string;
}

/**
 * Données pour approuver une demande de suppression
 */
export interface ApproveAccountDeletionInput {
  request_id: number;
  approved_by: number;
}

/**
 * Données pour rejeter une demande de suppression
 */
export interface RejectAccountDeletionInput {
  request_id: number;
  approved_by: number;
  rejection_reason: string;
}

/**
 * Données pour annuler une demande de suppression
 */
export interface CancelAccountDeletionInput {
  request_id: number;
  user_id: number;
}

/**
 * Demande de suppression avec informations complètes
 */
export interface AccountDeletionRequestWithDetails extends AccountDeletionRequest {
  /** Informations de l'utilisateur */
  user?: {
    id: number;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };

  /** Informations de l'approbateur */
  approver?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

// ============================================================================
// QUERY & FILTER TYPES
// ============================================================================

/**
 * Filtre pour récupérer les consentements
 */
export interface GetUserConsentsInput {
  user_id: number;
  consent_type?: UserConsentType | string;
  given?: boolean;
  include_revoked?: boolean;
}

/**
 * Filtre pour récupérer les demandes d'export
 */
export interface GetDataExportRequestsInput {
  user_id?: number;
  status?: DataExportStatus;
  include_expired?: boolean;
  include_user?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Filtre pour récupérer les demandes de suppression
 */
export interface GetAccountDeletionRequestsInput {
  user_id?: number;
  status?: AccountDeletionStatus;
  include_details?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

/**
 * Résultat de création d'un consentement
 */
export interface CreateConsentResult {
  success: boolean;
  message: string;
  consent?: UserConsent;
  error?: string;
}

/**
 * Résultat de révocation d'un consentement
 */
export interface RevokeConsentResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Résultat de vérification des consentements
 */
export interface CheckConsentsResult {
  success: boolean;
  consents: {
    [key in UserConsentType]?: boolean;
  };
  missing_consents: UserConsentType[];
  all_given: boolean;
}

/**
 * Résultat de création d'une demande d'export
 */
export interface CreateDataExportResult {
  success: boolean;
  message: string;
  request?: DataExportRequest;
  estimated_completion?: Date;
  error?: string;
}

/**
 * Résultat de téléchargement d'un export
 */
export interface DownloadDataExportResult {
  success: boolean;
  file_url?: string;
  file_path?: string;
  expires_at?: Date;
  error?: string;
}

/**
 * Résultat de création d'une demande de suppression
 */
export interface CreateAccountDeletionResult {
  success: boolean;
  message: string;
  request?: AccountDeletionRequest;
  estimated_completion?: Date;
  error?: string;
}

/**
 * Résultat d'approbation de suppression
 */
export interface ApproveAccountDeletionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Résultat de rejet de suppression
 */
export interface RejectAccountDeletionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Résultat de traitement de suppression
 */
export interface ProcessAccountDeletionResult {
  success: boolean;
  message: string;
  deleted_data: {
    users: number;
    sessions: number;
    orders: number;
    payments: number;
    messages: number;
    [key: string]: number;
  };
  error?: string;
}

// ============================================================================
// GDPR COMPLIANCE TYPES
// ============================================================================

/**
 * État de conformité GDPR d'un utilisateur
 */
export interface UserGdprCompliance {
  user_id: number;
  consents_given: UserConsentType[];
  consents_missing: UserConsentType[];
  is_compliant: boolean;
  last_consent_date?: Date;
  has_pending_export?: boolean;
  has_pending_deletion?: boolean;
}

/**
 * Rapport de conformité GDPR
 */
export interface GdprComplianceReport {
  total_users: number;
  compliant_users: number;
  non_compliant_users: number;
  pending_exports: number;
  pending_deletions: number;
  completed_exports: number;
  completed_deletions: number;
  consents_by_type: {
    type: UserConsentType;
    total_given: number;
    total_revoked: number;
  }[];
  generated_at: Date;
}

/**
 * Données exportées d'un utilisateur
 */
export interface UserDataExport {
  user: {
    id: number;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    date_of_birth: Date;
    created_at: Date;
  };
  profile?: any;
  consents: UserConsent[];
  orders?: any[];
  payments?: any[];
  messages?: any[];
  sessions?: any[];
  audit_logs?: any[];
  exported_at: Date;
  export_version: string;
}

// ============================================================================
// LIST TYPES
// ============================================================================

/**
 * Liste paginée de consentements
 */
export interface UserConsentsList {
  items: UserConsent[];
  total: number;
  hasMore: boolean;
}

/**
 * Liste paginée de demandes d'export
 */
export interface DataExportRequestsList {
  items: DataExportRequest[];
  total: number;
  hasMore: boolean;
}

/**
 * Liste paginée de demandes de suppression
 */
export interface AccountDeletionRequestsList {
  items: AccountDeletionRequest[];
  total: number;
  hasMore: boolean;
}
