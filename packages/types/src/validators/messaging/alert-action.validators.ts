/**
 * @fileoverview Alert Action Validators
 * @module @clubmanager/types/validators/messaging/alert-action
 *
 * Zod schemas for validating actions performed on alerts (history tracking).
 *
 * DB Table: alertes_actions
 * Columns: id, alerte_id, action_type, description, effectue_par, date_action
 *
 * Business Rules:
 * - action_type must be one of: 'message_envoye', 'information_mise_a_jour',
 *   'paiement_recu', 'statut_change', 'autre'
 * - Description is optional (up to 65535 chars)
 * - effectue_par references the user who performed the action
 * - date_action defaults to current timestamp
 * - Alert actions are immutable (no updates, only creates)
 */

import { z } from 'zod';
import {
  ALERT_ACTION_DESCRIPTION_MAX_LENGTH,
  ALERT_ACTION_DESCRIPTION_MIN_LENGTH,
  MESSAGING_DEFAULT_PAGE_SIZE,
  MESSAGING_MAX_PAGE_SIZE,
  MESSAGING_MIN_PAGE_SIZE,
  MESSAGING_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/messaging.constants.js';
import { AlertActionType, ALERT_ACTION_TYPES } from '../../enums/messaging.enums.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for alert action type validation
 * DB: alertes_actions.action_type ENUM('message_envoye', 'information_mise_a_jour',
 *     'paiement_recu', 'statut_change', 'autre')
 */
export const alertActionTypeSchema = z.enum(
  ['message_envoye', 'information_mise_a_jour', 'paiement_recu', 'statut_change', 'autre'],
  {
    errorMap: () => ({
      message: `Le type d'action doit être l'un des suivants: ${ALERT_ACTION_TYPES.join(', ')}`,
    }),
  }
);

/**
 * Base alert action schema with all fields
 */
export const alertActionBaseSchema = z.object({
  id: idSchema,
  alerte_id: idSchema,
  action_type: alertActionTypeSchema,
  description: z
    .string()
    .trim()
    .min(ALERT_ACTION_DESCRIPTION_MIN_LENGTH, {
      message: `La description doit contenir au moins ${ALERT_ACTION_DESCRIPTION_MIN_LENGTH} caractère`,
    })
    .max(ALERT_ACTION_DESCRIPTION_MAX_LENGTH, {
      message: `La description ne peut pas dépasser ${ALERT_ACTION_DESCRIPTION_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
  effectue_par: idSchema.nullable().optional(),
  date_action: z.coerce.date(),
});

/**
 * Inferred TypeScript type for AlertAction
 */
export type AlertAction = z.infer<typeof alertActionBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new alert action
 * Required: alerte_id, action_type
 * Optional: description, effectue_par
 */
export const createAlertActionSchema = alertActionBaseSchema.pick({
  alerte_id: true,
  action_type: true,
  description: true,
  effectue_par: true,
});

/**
 * Inferred TypeScript type for CreateAlertAction
 */
export type CreateAlertAction = z.infer<typeof createAlertActionSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing alert actions with filters
 */
export const listAlertActionsSchema = paginationSchema.extend({
  alerte_id: idSchema.optional(),
  action_type: alertActionTypeSchema.optional(),
  effectue_par: idSchema.optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  sort_by: z.enum(['date_action', 'action_type']).default('date_action'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListAlertActions query
 */
export type ListAlertActionsQuery = z.infer<typeof listAlertActionsSchema>;

/**
 * Schema for getting alert history (all actions for a specific alert)
 */
export const alertHistorySchema = z.object({
  alerte_id: idSchema,
  page: z.coerce.number().int().positive().default(MESSAGING_DEFAULT_PAGE),
  page_size: z.coerce
    .number()
    .int()
    .min(MESSAGING_MIN_PAGE_SIZE)
    .max(MESSAGING_MAX_PAGE_SIZE)
    .default(MESSAGING_DEFAULT_PAGE_SIZE),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for AlertHistory query
 */
export type AlertHistoryQuery = z.infer<typeof alertHistorySchema>;

/**
 * Schema for filtering actions by type
 */
export const actionsByTypeSchema = z.object({
  action_type: alertActionTypeSchema,
  alerte_id: idSchema.optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
});

/**
 * Inferred TypeScript type for ActionsByType query
 */
export type ActionsByTypeQuery = z.infer<typeof actionsByTypeSchema>;

/**
 * Schema for filtering actions by user
 */
export const actionsByUserSchema = paginationSchema.extend({
  effectue_par: idSchema,
  action_type: alertActionTypeSchema.optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  sort_by: z.enum(['date_action']).default('date_action'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ActionsByUser query
 */
export type ActionsByUserQuery = z.infer<typeof actionsByUserSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating alert action ID as number
 */
export const alertActionIdSchema = idSchema;

/**
 * Schema for validating alert action ID as string (from params)
 */
export const alertActionIdStringSchema = idStringSchema;

/**
 * Schema for validating alert action ID in route params
 */
export const alertActionIdParamSchema = z.object({
  id: alertActionIdStringSchema,
});

/**
 * Inferred TypeScript type for alert action ID param
 */
export type AlertActionIdParam = z.infer<typeof alertActionIdParamSchema>;

/**
 * Schema for validating alert ID in route params (for nested routes)
 */
export const alertIdParamSchema = z.object({
  alerte_id: idStringSchema,
});

/**
 * Inferred TypeScript type for alert ID param
 */
export type AlertIdParam = z.infer<typeof alertIdParamSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for alert action response (includes all fields)
 */
export const alertActionResponseSchema = alertActionBaseSchema;

/**
 * Inferred TypeScript type for AlertActionResponse
 */
export type AlertActionResponse = z.infer<typeof alertActionResponseSchema>;

/**
 * Schema for paginated alert actions list response
 */
export const alertActionsListResponseSchema = z.object({
  data: z.array(alertActionResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for AlertActionsListResponse
 */
export type AlertActionsListResponse = z.infer<typeof alertActionsListResponseSchema>;

/**
 * Schema for alert action statistics
 */
export const alertActionStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  by_type: z.object({
    message_envoye: z.number().int().nonnegative(),
    information_mise_a_jour: z.number().int().nonnegative(),
    paiement_recu: z.number().int().nonnegative(),
    statut_change: z.number().int().nonnegative(),
    autre: z.number().int().nonnegative(),
  }),
  by_user: z.record(z.number().int().nonnegative()),
  recent_actions: z.array(alertActionResponseSchema).max(10),
});

/**
 * Inferred TypeScript type for AlertActionStats
 */
export type AlertActionStats = z.infer<typeof alertActionStatsSchema>;

/**
 * Schema for alert timeline entry (action with additional context)
 */
export const alertTimelineEntrySchema = alertActionBaseSchema.extend({
  user_name: z.string().optional(),
  alert_status_before: z.string().optional(),
  alert_status_after: z.string().optional(),
});

/**
 * Inferred TypeScript type for AlertTimelineEntry
 */
export type AlertTimelineEntry = z.infer<typeof alertTimelineEntrySchema>;

/**
 * Schema for complete alert timeline
 */
export const alertTimelineSchema = z.object({
  alerte_id: idSchema,
  entries: z.array(alertTimelineEntrySchema),
  total_actions: z.number().int().nonnegative(),
});

/**
 * Inferred TypeScript type for AlertTimeline
 */
export type AlertTimeline = z.infer<typeof alertTimelineSchema>;
