/**
 * @fileoverview User Alert Validators
 * @module @clubmanager/types/validators/messaging/user-alert
 *
 * Zod schemas for validating user-specific alerts.
 *
 * DB Table: alertes_utilisateurs
 * Columns: id, utilisateur_id, alerte_type_id, statut, message, donnees_contexte,
 *          date_detection, date_resolution, notes, resolu_par, lu, date_lecture
 *
 * Business Rules:
 * - Status must be one of: 'active', 'resolue', 'ignoree'
 * - Message is optional (up to 65535 chars)
 * - donnees_contexte is JSON field for contextual data
 * - date_resolution is set when status becomes 'resolue'
 * - resolu_par references the user who resolved the alert
 * - Read status (lu) is boolean with default false
 */

import { z } from 'zod';
import {
  USER_ALERT_MESSAGE_MAX_LENGTH,
  USER_ALERT_MESSAGE_MIN_LENGTH,
  USER_ALERT_NOTES_MAX_LENGTH,
  USER_ALERT_NOTES_MIN_LENGTH,
  MESSAGING_DEFAULT_PAGE_SIZE,
  MESSAGING_MAX_PAGE_SIZE,
  MESSAGING_MIN_PAGE_SIZE,
  MESSAGING_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/messaging.constants.js';
import { AlertStatus, ALERT_STATUSES, AlertSeverity } from '../../enums/messaging.enums.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for alert status validation
 * DB: alertes_utilisateurs.statut ENUM('active', 'resolue', 'ignoree')
 */
export const alertStatusSchema = z.enum(['active', 'resolue', 'ignoree'], {
  errorMap: () => ({
    message: `Le statut doit être l'un des suivants: ${ALERT_STATUSES.join(', ')}`,
  }),
});

/**
 * Schema for alert context data (JSON field)
 * DB: alertes_utilisateurs.donnees_contexte JSON
 */
export const alertContextDataSchema = z.record(z.unknown()).nullable().optional();

/**
 * Base user alert schema with all fields
 */
export const userAlertBaseSchema = z.object({
  id: idSchema,
  utilisateur_id: idSchema,
  alerte_type_id: idSchema,
  statut: alertStatusSchema.default(AlertStatus.ACTIVE),
  message: z
    .string()
    .trim()
    .min(USER_ALERT_MESSAGE_MIN_LENGTH, {
      message: `Le message doit contenir au moins ${USER_ALERT_MESSAGE_MIN_LENGTH} caractère`,
    })
    .max(USER_ALERT_MESSAGE_MAX_LENGTH, {
      message: `Le message ne peut pas dépasser ${USER_ALERT_MESSAGE_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
  donnees_contexte: alertContextDataSchema,
  date_detection: z.coerce.date(),
  date_resolution: z.coerce.date().nullable().optional(),
  notes: z
    .string()
    .trim()
    .min(USER_ALERT_NOTES_MIN_LENGTH, {
      message: `Les notes doivent contenir au moins ${USER_ALERT_NOTES_MIN_LENGTH} caractère`,
    })
    .max(USER_ALERT_NOTES_MAX_LENGTH, {
      message: `Les notes ne peuvent pas dépasser ${USER_ALERT_NOTES_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
  resolu_par: idSchema.nullable().optional(),
  lu: z.boolean().default(false),
  date_lecture: z.coerce.date().nullable().optional(),
});

/**
 * Inferred TypeScript type for UserAlert
 */
export type UserAlert = z.infer<typeof userAlertBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new user alert
 * Required: utilisateur_id, alerte_type_id
 * Optional: statut (defaults to 'active'), message, donnees_contexte
 */
export const createUserAlertSchema = userAlertBaseSchema.pick({
  utilisateur_id: true,
  alerte_type_id: true,
  statut: true,
  message: true,
  donnees_contexte: true,
});

/**
 * Inferred TypeScript type for CreateUserAlert
 */
export type CreateUserAlert = z.infer<typeof createUserAlertSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a user alert
 * Can update: statut, message, notes, resolu_par, lu, date_lecture
 */
export const updateUserAlertSchema = z
  .object({
    statut: alertStatusSchema.optional(),
    message: z
      .string()
      .trim()
      .min(USER_ALERT_MESSAGE_MIN_LENGTH, {
        message: `Le message doit contenir au moins ${USER_ALERT_MESSAGE_MIN_LENGTH} caractère`,
      })
      .max(USER_ALERT_MESSAGE_MAX_LENGTH, {
        message: `Le message ne peut pas dépasser ${USER_ALERT_MESSAGE_MAX_LENGTH} caractères`,
      })
      .nullable()
      .optional(),
    notes: z
      .string()
      .trim()
      .min(USER_ALERT_NOTES_MIN_LENGTH, {
        message: `Les notes doivent contenir au moins ${USER_ALERT_NOTES_MIN_LENGTH} caractère`,
      })
      .max(USER_ALERT_NOTES_MAX_LENGTH, {
        message: `Les notes ne peuvent pas dépasser ${USER_ALERT_NOTES_MAX_LENGTH} caractères`,
      })
      .nullable()
      .optional(),
    resolu_par: idSchema.nullable().optional(),
    lu: z.boolean().optional(),
    date_lecture: z.coerce.date().nullable().optional(),
    date_resolution: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      // If status is 'resolue', date_resolution and resolu_par should be provided
      if (data.statut === AlertStatus.RESOLVED) {
        return data.date_resolution !== undefined && data.resolu_par !== undefined;
      }
      return true;
    },
    {
      message: "Une alerte résolue doit avoir une date de résolution et un utilisateur résolveur",
      path: ['statut'],
    }
  );

/**
 * Inferred TypeScript type for UpdateUserAlert
 */
export type UpdateUserAlert = z.infer<typeof updateUserAlertSchema>;

/**
 * Schema for resolving an alert
 */
export const resolveAlertSchema = z.object({
  resolu_par: idSchema,
  notes: z
    .string()
    .trim()
    .min(USER_ALERT_NOTES_MIN_LENGTH, {
      message: `Les notes doivent contenir au moins ${USER_ALERT_NOTES_MIN_LENGTH} caractère`,
    })
    .max(USER_ALERT_NOTES_MAX_LENGTH, {
      message: `Les notes ne peuvent pas dépasser ${USER_ALERT_NOTES_MAX_LENGTH} caractères`,
    })
    .optional(),
});

/**
 * Inferred TypeScript type for ResolveAlert
 */
export type ResolveAlert = z.infer<typeof resolveAlertSchema>;

/**
 * Schema for ignoring an alert
 */
export const ignoreAlertSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(USER_ALERT_NOTES_MIN_LENGTH, {
      message: `Les notes doivent contenir au moins ${USER_ALERT_NOTES_MIN_LENGTH} caractère`,
    })
    .max(USER_ALERT_NOTES_MAX_LENGTH, {
      message: `Les notes ne peuvent pas dépasser ${USER_ALERT_NOTES_MAX_LENGTH} caractères`,
    })
    .optional(),
});

/**
 * Inferred TypeScript type for IgnoreAlert
 */
export type IgnoreAlert = z.infer<typeof ignoreAlertSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing user alerts with filters
 */
export const listUserAlertsSchema = paginationSchema.extend({
  utilisateur_id: idSchema.optional(),
  alerte_type_id: idSchema.optional(),
  statut: alertStatusSchema.optional(),
  lu: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  resolu_par: idSchema.optional(),
  sort_by: z.enum(['date_detection', 'date_resolution', 'statut']).default('date_detection'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListUserAlerts query
 */
export type ListUserAlertsQuery = z.infer<typeof listUserAlertsSchema>;

/**
 * Schema for active alerts query
 */
export const activeAlertsSchema = paginationSchema.extend({
  utilisateur_id: idSchema.optional(),
  alerte_type_id: idSchema.optional(),
  sort_by: z.enum(['date_detection']).default('date_detection'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ActiveAlerts query
 */
export type ActiveAlertsQuery = z.infer<typeof activeAlertsSchema>;

/**
 * Schema for resolved alerts query
 */
export const resolvedAlertsSchema = paginationSchema.extend({
  utilisateur_id: idSchema.optional(),
  resolu_par: idSchema.optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  sort_by: z.enum(['date_resolution', 'date_detection']).default('date_resolution'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ResolvedAlerts query
 */
export type ResolvedAlertsQuery = z.infer<typeof resolvedAlertsSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating user alert ID as number
 */
export const userAlertIdSchema = idSchema;

/**
 * Schema for validating user alert ID as string (from params)
 */
export const userAlertIdStringSchema = idStringSchema;

/**
 * Schema for validating user alert ID in route params
 */
export const userAlertIdParamSchema = z.object({
  id: userAlertIdStringSchema,
});

/**
 * Inferred TypeScript type for user alert ID param
 */
export type UserAlertIdParam = z.infer<typeof userAlertIdParamSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

/**
 * Schema for marking multiple alerts as read
 */
export const bulkMarkReadAlertsSchema = z.object({
  alert_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins une alerte doit être sélectionnée' })
    .max(100, { message: 'Vous ne pouvez pas marquer plus de 100 alertes à la fois' }),
});

/**
 * Inferred TypeScript type for BulkMarkReadAlerts
 */
export type BulkMarkReadAlerts = z.infer<typeof bulkMarkReadAlertsSchema>;

/**
 * Schema for bulk resolving alerts
 */
export const bulkResolveAlertsSchema = z.object({
  alert_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins une alerte doit être sélectionnée' })
    .max(50, { message: 'Vous ne pouvez pas résoudre plus de 50 alertes à la fois' }),
  resolu_par: idSchema,
  notes: z
    .string()
    .trim()
    .min(USER_ALERT_NOTES_MIN_LENGTH, {
      message: `Les notes doivent contenir au moins ${USER_ALERT_NOTES_MIN_LENGTH} caractère`,
    })
    .max(USER_ALERT_NOTES_MAX_LENGTH, {
      message: `Les notes ne peuvent pas dépasser ${USER_ALERT_NOTES_MAX_LENGTH} caractères`,
    })
    .optional(),
});

/**
 * Inferred TypeScript type for BulkResolveAlerts
 */
export type BulkResolveAlerts = z.infer<typeof bulkResolveAlertsSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for user alert response (includes all fields)
 */
export const userAlertResponseSchema = userAlertBaseSchema;

/**
 * Inferred TypeScript type for UserAlertResponse
 */
export type UserAlertResponse = z.infer<typeof userAlertResponseSchema>;

/**
 * Schema for paginated user alerts list response
 */
export const userAlertsListResponseSchema = z.object({
  data: z.array(userAlertResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for UserAlertsListResponse
 */
export type UserAlertsListResponse = z.infer<typeof userAlertsListResponseSchema>;

/**
 * Schema for user alert statistics
 */
export const userAlertStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  resolved: z.number().int().nonnegative(),
  ignored: z.number().int().nonnegative(),
  unread: z.number().int().nonnegative(),
  by_type: z.record(z.number().int().nonnegative()),
});

/**
 * Inferred TypeScript type for UserAlertStats
 */
export type UserAlertStats = z.infer<typeof userAlertStatsSchema>;
