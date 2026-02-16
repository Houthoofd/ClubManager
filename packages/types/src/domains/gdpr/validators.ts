/**
 * Validateurs Zod pour le domaine GDPR
 * Schémas de validation des données
 *
 * @module gdpr/validators
 */

import { z } from "zod";

// ============================================================================
// ENUMS SCHEMAS
// ============================================================================

/**
 * Schéma pour UserConsentType
 */
export const UserConsentTypeSchema = z.enum([
  "MARKETING",
  "ANALYTICS",
  "TERMS",
  "PRIVACY",
  "DATA_PROCESSING",
]);

/**
 * Schéma pour DataExportStatus
 */
export const DataExportStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
]);

/**
 * Schéma pour AccountDeletionStatus
 */
export const AccountDeletionStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
]);

// ============================================================================
// USER CONSENT SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour UserConsent
 */
export const UserConsentSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  consent_type: UserConsentTypeSchema,
  given: z.boolean(),
  ip_address: z.string().ip().max(45).nullable().optional(),
  user_agent: z.string().max(1000).nullable().optional(),
  given_at: z.date(),
  revoked_at: z.date().nullable().optional(),
  version: z.string().max(20).nullable().optional(),
});

/**
 * Schéma de validation pour CreateUserConsentInput
 */
export const CreateUserConsentInputSchema = z.object({
  user_id: z.number().int().positive(),
  consent_type: z.union([UserConsentTypeSchema, z.string().min(1).max(50)]),
  given: z.boolean(),
  ip_address: z.string().ip().max(45).optional(),
  user_agent: z.string().max(1000).trim().optional(),
  version: z.string().max(20).trim().optional(),
});

/**
 * Schéma de validation pour UpdateUserConsentInput
 */
export const UpdateUserConsentInputSchema = z.object({
  given: z.boolean().optional(),
  revoked_at: z.coerce.date().optional(),
});

/**
 * Schéma de validation pour RevokeConsentInput
 */
export const RevokeConsentInputSchema = z.object({
  user_id: z.number().int().positive(),
  consent_type: z.union([UserConsentTypeSchema, z.string().min(1).max(50)]),
});

// ============================================================================
// DATA EXPORT REQUEST SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour DataExportRequest
 */
export const DataExportRequestSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  status: DataExportStatusSchema,
  requested_at: z.date(),
  processing_started_at: z.date().nullable().optional(),
  completed_at: z.date().nullable().optional(),
  expires_at: z.date().nullable().optional(),
  file_path: z.string().max(500).nullable().optional(),
  file_size_bytes: z.bigint().nullable().optional(),
  request_ip: z.string().ip().max(45).nullable().optional(),
  download_count: z.number().int().min(0).default(0),
  last_downloaded_at: z.date().nullable().optional(),
  error_message: z.string().max(1000).nullable().optional(),
});

/**
 * Schéma de validation pour CreateDataExportRequestInput
 */
export const CreateDataExportRequestInputSchema = z.object({
  user_id: z.number().int().positive(),
  request_ip: z.string().ip().max(45).optional(),
});

/**
 * Schéma de validation pour UpdateDataExportRequestInput
 */
export const UpdateDataExportRequestInputSchema = z.object({
  status: DataExportStatusSchema.optional(),
  processing_started_at: z.coerce.date().optional(),
  completed_at: z.coerce.date().optional(),
  expires_at: z.coerce.date().optional(),
  file_path: z.string().max(500).optional(),
  file_size_bytes: z.union([z.bigint(), z.number()]).optional(),
  error_message: z.string().max(1000).trim().optional(),
});

// ============================================================================
// ACCOUNT DELETION REQUEST SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour AccountDeletionRequest
 */
export const AccountDeletionRequestSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  status: AccountDeletionStatusSchema,
  reason: z.string().max(1000).nullable().optional(),
  requested_at: z.date(),
  approved_at: z.date().nullable().optional(),
  approved_by: z.number().int().positive().nullable().optional(),
  completed_at: z.date().nullable().optional(),
  rejection_reason: z.string().max(1000).nullable().optional(),
  request_ip: z.string().ip().max(45).nullable().optional(),
});

/**
 * Schéma de validation pour CreateAccountDeletionRequestInput
 */
export const CreateAccountDeletionRequestInputSchema = z.object({
  user_id: z.number().int().positive(),
  reason: z
    .string()
    .min(10, "La raison doit contenir au moins 10 caractères")
    .max(1000)
    .trim()
    .optional(),
  request_ip: z.string().ip().max(45).optional(),
});

/**
 * Schéma de validation pour ApproveAccountDeletionInput
 */
export const ApproveAccountDeletionInputSchema = z.object({
  request_id: z.number().int().positive(),
  approved_by: z.number().int().positive(),
});

/**
 * Schéma de validation pour RejectAccountDeletionInput
 */
export const RejectAccountDeletionInputSchema = z.object({
  request_id: z.number().int().positive(),
  approved_by: z.number().int().positive(),
  rejection_reason: z
    .string()
    .min(10, "La raison du rejet doit contenir au moins 10 caractères")
    .max(1000)
    .trim(),
});

/**
 * Schéma de validation pour CancelAccountDeletionInput
 */
export const CancelAccountDeletionInputSchema = z.object({
  request_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour GetUserConsentsInput
 */
export const GetUserConsentsInputSchema = z.object({
  user_id: z.number().int().positive(),
  consent_type: z.union([UserConsentTypeSchema, z.string()]).optional(),
  given: z.boolean().optional(),
  include_revoked: z.boolean().default(false),
});

/**
 * Schéma de validation pour GetDataExportRequestsInput
 */
export const GetDataExportRequestsInputSchema = z.object({
  user_id: z.number().int().positive().optional(),
  status: DataExportStatusSchema.optional(),
  include_expired: z.boolean().default(false),
  include_user: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Schéma de validation pour GetAccountDeletionRequestsInput
 */
export const GetAccountDeletionRequestsInputSchema = z.object({
  user_id: z.number().int().positive().optional(),
  status: AccountDeletionStatusSchema.optional(),
  include_details: z.boolean().default(true),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// COMPLIANCE SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour vérifier la conformité GDPR
 */
export const CheckGdprComplianceSchema = z.object({
  user_id: z.number().int().positive(),
  required_consents: z
    .array(UserConsentTypeSchema)
    .default(["TERMS", "PRIVACY", "DATA_PROCESSING"]),
});

/**
 * Schéma de validation pour le rapport de conformité GDPR
 */
export const GdprComplianceReportQuerySchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  include_details: z.boolean().default(false),
});

// ============================================================================
// DATA EXPORT SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour le format d'export
 */
export const ExportFormatSchema = z.enum(["json", "csv", "xml"]);

/**
 * Schéma de validation pour les options d'export
 */
export const DataExportOptionsSchema = z.object({
  format: ExportFormatSchema.default("json"),
  include_profile: z.boolean().default(true),
  include_consents: z.boolean().default(true),
  include_orders: z.boolean().default(true),
  include_payments: z.boolean().default(true),
  include_messages: z.boolean().default(true),
  include_sessions: z.boolean().default(false),
  include_audit_logs: z.boolean().default(false),
  anonymize_sensitive_data: z.boolean().default(false),
});

/**
 * Schéma de validation pour télécharger un export
 */
export const DownloadDataExportSchema = z.object({
  request_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
});

// ============================================================================
// RETENTION POLICY SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour la politique de rétention
 */
export const RetentionPolicySchema = z.object({
  data_type: z.string().min(1).max(100),
  retention_days: z.number().int().positive().min(1).max(7300), // Max 20 ans
  auto_delete: z.boolean().default(false),
  notify_before_deletion: z.boolean().default(true),
  notification_days: z.number().int().positive().min(1).max(90).default(30),
});

/**
 * Schéma de validation pour appliquer la politique de rétention
 */
export const ApplyRetentionPolicySchema = z.object({
  data_type: z.string().min(1).max(100),
  user_id: z.number().int().positive().optional(),
  dry_run: z.boolean().default(false),
});

// ============================================================================
// CONSENT WITHDRAWAL SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour retirer tous les consentements
 */
export const WithdrawAllConsentsSchema = z.object({
  user_id: z.number().int().positive(),
  reason: z.string().max(500).trim().optional(),
  ip_address: z.string().ip().max(45).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifie si une demande d'export a expiré
 */
export const isDataExportExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) return false;
  return expiresAt < new Date();
};

/**
 * Calcule la date d'expiration d'un export (par défaut 7 jours)
 */
export const getExportExpirationDate = (daysFromNow: number = 7): Date => {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
};

/**
 * Vérifie si tous les consentements requis sont donnés
 */
export const areAllRequiredConsentsGiven = (
  userConsents: Array<{ consent_type: string; given: boolean }>,
  requiredTypes: string[],
): boolean => {
  const givenTypes = userConsents
    .filter((c) => c.given)
    .map((c) => c.consent_type);

  return requiredTypes.every((type) => givenTypes.includes(type));
};

/**
 * Valide la taille du fichier exporté (max 500MB)
 */
export const validateExportFileSize = (sizeBytes: bigint | number): boolean => {
  const maxSizeBytes = 500 * 1024 * 1024; // 500MB
  const size = typeof sizeBytes === "bigint" ? Number(sizeBytes) : sizeBytes;
  return size <= maxSizeBytes;
};

/**
 * Sanitize la raison de suppression de compte
 */
export const sanitizeDeletionReason = (reason: string): string => {
  return reason
    .trim()
    .replace(/[<>]/g, "") // Remove HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Vérifie si une demande de suppression peut être annulée
 */
export const canCancelDeletionRequest = (status: string): boolean => {
  return ["PENDING", "APPROVED"].includes(status);
};

/**
 * Vérifie si une demande de suppression peut être approuvée
 */
export const canApproveDeletionRequest = (status: string): boolean => {
  return status === "PENDING";
};

/**
 * Génère un ID de corrélation pour tracer les opérations GDPR
 */
export const generateCorrelationId = (): string => {
  return `gdpr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Valide la version du consentement
 */
export const ConsentVersionSchema = z
  .string()
  .regex(/^\d+\.\d+(\.\d+)?$/, "Format de version invalide (ex: 1.0 ou 1.0.0)");

/**
 * Schéma pour valider un email GDPR
 */
export const GdprEmailSchema = z
  .string()
  .email("Email invalide")
  .max(255)
  .toLowerCase();

/**
 * Schéma pour valider les données personnelles à anonymiser
 */
export const AnonymizeDataSchema = z.object({
  user_id: z.number().int().positive(),
  keep_statistics: z.boolean().default(true),
  anonymization_method: z.enum(["hash", "random", "delete"]).default("hash"),
  dry_run: z.boolean().default(false),
});
