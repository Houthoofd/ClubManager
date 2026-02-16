/**
 * Validateurs Zod pour le domaine Audit
 * Schémas de validation des données
 *
 * @module audit/validators
 */

import { z } from "zod";

// ============================================================================
// ENUMS SCHEMAS
// ============================================================================

/**
 * Schéma pour AuditEventType
 */
export const AuditEventTypeSchema = z.enum([
  // Authentication
  "login",
  "logout",
  "login_failed",
  "password_reset",
  "password_change",
  "email_verification",
  "two_factor_enabled",
  "two_factor_disabled",
  // User Management
  "user_created",
  "user_updated",
  "user_deleted",
  "user_suspended",
  "user_reactivated",
  // Session Management
  "session_created",
  "session_revoked",
  "session_expired",
  // Data Access
  "data_accessed",
  "data_exported",
  "data_imported",
  // GDPR
  "consent_given",
  "consent_revoked",
  "data_export_requested",
  "account_deletion_requested",
  // Payments
  "payment_created",
  "payment_completed",
  "payment_failed",
  "payment_refunded",
  // Orders
  "order_created",
  "order_updated",
  "order_cancelled",
  // System
  "system_error",
  "configuration_changed",
  "api_key_created",
  "api_key_revoked",
  // Security
  "security_alert",
  "suspicious_activity",
  "rate_limit_exceeded",
  "unauthorized_access",
  // Other
  "other",
]);

/**
 * Schéma pour AuditSeverity
 */
export const AuditSeveritySchema = z.enum([
  "info",
  "warning",
  "error",
  "critical",
]);

// ============================================================================
// AUDIT LOG SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour AuditLog
 */
export const AuditLogSchema = z.object({
  id: z.string().cuid(),
  event_type: z.string().min(1).max(100),
  severity: z.string().min(1).max(20),
  user_id: z.number().int().positive().nullable().optional(),
  ip_address: z.string().ip().max(45).nullable().optional(),
  user_agent: z.string().max(1000).nullable().optional(),
  resource: z.string().max(100).nullable().optional(),
  action: z.string().max(100).nullable().optional(),
  success: z.boolean().default(true),
  error_code: z.string().max(50).nullable().optional(),
  message: z.string().max(1000).nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  timestamp: z.date(),
});

/**
 * Schéma de validation pour CreateAuditLogInput
 */
export const CreateAuditLogInputSchema = z.object({
  event_type: z.union([AuditEventTypeSchema, z.string().min(1).max(100)]),
  severity: z.union([AuditSeveritySchema, z.string().min(1).max(20)]),
  user_id: z.number().int().positive().optional(),
  ip_address: z.string().ip().max(45).optional(),
  user_agent: z.string().max(1000).trim().optional(),
  resource: z.string().max(100).trim().optional(),
  action: z
    .string()
    .max(100)
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return ["create", "read", "update", "delete", "execute"].includes(
          val.toLowerCase(),
        );
      },
      {
        message: "action doit être: create, read, update, delete ou execute",
      },
    ),
  success: z.boolean().default(true),
  error_code: z.string().max(50).trim().optional(),
  message: z.string().max(1000).trim().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour GetAuditLogsInput
 */
export const GetAuditLogsInputSchema = z
  .object({
    user_id: z.number().int().positive().optional(),
    event_type: z.union([AuditEventTypeSchema, z.string()]).optional(),
    severity: z.union([AuditSeveritySchema, z.string()]).optional(),
    resource: z.string().max(100).optional(),
    action: z.string().max(100).optional(),
    success: z.boolean().optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    ip_address: z.string().ip().optional(),
    include_user: z.boolean().default(false),
    limit: z.number().int().positive().max(1000).default(100),
    offset: z.number().int().min(0).default(0),
    order_by: z
      .enum(["timestamp", "severity", "event_type"])
      .default("timestamp"),
    order_direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date <= data.end_date;
      }
      return true;
    },
    {
      message: "start_date doit être antérieure à end_date",
      path: ["start_date"],
    },
  );

/**
 * Schéma de validation pour GetSecurityAuditLogsInput
 */
export const GetSecurityAuditLogsInputSchema = z.object({
  severity: AuditSeveritySchema.optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  include_user: z.boolean().default(true),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

/**
 * Schéma de validation pour GetUserAuditLogsInput
 */
export const GetUserAuditLogsInputSchema = z.object({
  user_id: z.number().int().positive(),
  event_type: z.union([AuditEventTypeSchema, z.string()]).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// STATISTICS SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour les statistiques d'audit
 */
export const AuditStatsQuerySchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  group_by: z
    .enum(["severity", "event_type", "user", "day", "hour"])
    .default("severity"),
  include_details: z.boolean().default(false),
});

/**
 * Schéma de validation pour les statistiques de sécurité
 */
export const SecurityStatsQuerySchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  include_top_attackers: z.boolean().default(true),
  include_top_targets: z.boolean().default(true),
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Schéma de validation pour les statistiques d'activité utilisateur
 */
export const UserActivityStatsQuerySchema = z.object({
  user_id: z.number().int().positive(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  include_actions_breakdown: z.boolean().default(true),
  include_daily_stats: z.boolean().default(false),
});

// ============================================================================
// CLEANUP SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour nettoyer les anciens logs
 */
export const CleanupOldLogsSchema = z
  .object({
    older_than_days: z.number().int().positive().min(1).max(3650).default(90), // Entre 1 jour et 10 ans
    severity: AuditSeveritySchema.optional(),
    keep_critical: z.boolean().default(true),
    dry_run: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Si on garde les critiques, on ne peut pas spécifier severity=critical
      if (data.keep_critical && data.severity === "critical") {
        return false;
      }
      return true;
    },
    {
      message:
        "Ne peut pas spécifier severity=critical si keep_critical est true",
      path: ["severity"],
    },
  );

// ============================================================================
// RESOURCE AUDIT TRAIL SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour récupérer l'audit trail d'une ressource
 */
export const GetResourceAuditTrailSchema = z.object({
  resource: z.string().min(1).max(100),
  resource_id: z.union([z.string(), z.number()]),
  include_metadata: z.boolean().default(true),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// BATCH OPERATIONS SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour créer plusieurs logs en batch
 */
export const CreateBatchAuditLogsSchema = z.object({
  logs: z
    .array(CreateAuditLogInputSchema)
    .min(1, "Au moins un log doit être fourni")
    .max(100, "Maximum 100 logs par batch"),
});

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour exporter les logs d'audit
 */
export const ExportAuditLogsSchema = z.object({
  format: z.enum(["json", "csv", "xlsx"]).default("json"),
  filters: GetAuditLogsInputSchema.optional(),
  include_metadata: z.boolean().default(true),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Détermine la sévérité en fonction de l'événement
 */
export const getSeverityForEvent = (eventType: string): string => {
  const criticalEvents = [
    "security_alert",
    "unauthorized_access",
    "account_deletion_requested",
    "data_exported",
  ];
  const errorEvents = [
    "login_failed",
    "payment_failed",
    "system_error",
    "suspicious_activity",
  ];
  const warningEvents = [
    "rate_limit_exceeded",
    "password_reset",
    "session_expired",
  ];

  if (criticalEvents.includes(eventType)) return "critical";
  if (errorEvents.includes(eventType)) return "error";
  if (warningEvents.includes(eventType)) return "warning";
  return "info";
};

/**
 * Valide si un log d'audit doit être conservé
 */
export const shouldKeepLog = (
  severity: string,
  daysOld: number,
  keepCritical: boolean,
): boolean => {
  if (keepCritical && severity === "critical") return true;
  if (severity === "error" && daysOld < 180) return true; // 6 mois
  if (severity === "warning" && daysOld < 90) return true; // 3 mois
  if (severity === "info" && daysOld < 30) return true; // 1 mois
  return false;
};

/**
 * Sanitize metadata pour éviter les données sensibles
 */
export const sanitizeMetadata = (metadata: any): any => {
  if (!metadata || typeof metadata !== "object") return metadata;

  const sanitized = { ...metadata };
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "api_key",
    "credit_card",
    "ssn",
  ];

  for (const key in sanitized) {
    if (
      sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
    ) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
};

/**
 * Valide l'ID d'un log d'audit (CUID)
 */
export const AuditLogIdSchema = z.string().cuid("ID de log d'audit invalide");
