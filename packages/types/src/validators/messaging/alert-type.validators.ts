/**
 * @fileoverview Alert Type Validators
 * @module @clubmanager/types/validators/messaging/alert-type
 *
 * Zod schemas for validating alert types (low stock, late payment, etc.).
 *
 * DB Table: alertes_types
 * Columns: id, nom, description, severite
 *
 * Business Rules:
 * - Name is required and unique (1-100 chars)
 * - Description is optional (up to 65535 chars)
 * - Severity must be one of: 'info', 'warning', 'critical'
 * - Alert types are reference data used to categorize alerts
 */

import { z } from 'zod';
import {
  ALERT_TYPE_NAME_MAX_LENGTH,
  ALERT_TYPE_NAME_MIN_LENGTH,
  ALERT_TYPE_DESCRIPTION_MAX_LENGTH,
  MESSAGING_DEFAULT_PAGE_SIZE,
  MESSAGING_MAX_PAGE_SIZE,
  MESSAGING_MIN_PAGE_SIZE,
  MESSAGING_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/messaging.constants.js';
import { AlertSeverity, ALERT_SEVERITIES } from '../../enums/messaging.enums.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for alert severity validation
 * DB: alertes_types.severite ENUM('info', 'warning', 'critical')
 */
export const alertSeveritySchema = z.enum(['info', 'warning', 'critical'], {
  errorMap: () => ({
    message: `La sévérité doit être l'une des suivantes: ${ALERT_SEVERITIES.join(', ')}`,
  }),
});

/**
 * Base alert type schema with all fields
 */
export const alertTypeBaseSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .trim()
    .min(ALERT_TYPE_NAME_MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${ALERT_TYPE_NAME_MIN_LENGTH} caractère`,
    })
    .max(ALERT_TYPE_NAME_MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${ALERT_TYPE_NAME_MAX_LENGTH} caractères`,
    }),
  description: z
    .string()
    .trim()
    .max(ALERT_TYPE_DESCRIPTION_MAX_LENGTH, {
      message: `La description ne peut pas dépasser ${ALERT_TYPE_DESCRIPTION_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
  severite: alertSeveritySchema.default(AlertSeverity.INFO),
});

/**
 * Inferred TypeScript type for AlertType
 */
export type AlertType = z.infer<typeof alertTypeBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new alert type
 * Required: nom
 * Optional: description, severite (defaults to 'info')
 */
export const createAlertTypeSchema = alertTypeBaseSchema.pick({
  nom: true,
  description: true,
  severite: true,
});

/**
 * Inferred TypeScript type for CreateAlertType
 */
export type CreateAlertType = z.infer<typeof createAlertTypeSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating an alert type
 * All fields are optional
 */
export const updateAlertTypeSchema = alertTypeBaseSchema
  .pick({
    nom: true,
    description: true,
    severite: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateAlertType
 */
export type UpdateAlertType = z.infer<typeof updateAlertTypeSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing alert types with filters
 */
export const listAlertTypesSchema = paginationSchema.extend({
  severite: alertSeveritySchema.optional(),
  search: z.string().trim().optional(),
  sort_by: z.enum(['nom', 'severite']).default('nom'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for ListAlertTypes query
 */
export type ListAlertTypesQuery = z.infer<typeof listAlertTypesSchema>;

/**
 * Schema for filtering alert types by severity
 */
export const alertTypesBySeveritySchema = z.object({
  severite: alertSeveritySchema,
});

/**
 * Inferred TypeScript type for AlertTypesBySeverity query
 */
export type AlertTypesBySeverityQuery = z.infer<typeof alertTypesBySeveritySchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating alert type ID as number
 */
export const alertTypeIdSchema = idSchema;

/**
 * Schema for validating alert type ID as string (from params)
 */
export const alertTypeIdStringSchema = idStringSchema;

/**
 * Schema for validating alert type ID in route params
 */
export const alertTypeIdParamSchema = z.object({
  id: alertTypeIdStringSchema,
});

/**
 * Inferred TypeScript type for alert type ID param
 */
export type AlertTypeIdParam = z.infer<typeof alertTypeIdParamSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for alert type response (includes all fields)
 */
export const alertTypeResponseSchema = alertTypeBaseSchema;

/**
 * Inferred TypeScript type for AlertTypeResponse
 */
export type AlertTypeResponse = z.infer<typeof alertTypeResponseSchema>;

/**
 * Schema for paginated alert types list response
 */
export const alertTypesListResponseSchema = z.object({
  data: z.array(alertTypeResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for AlertTypesListResponse
 */
export type AlertTypesListResponse = z.infer<typeof alertTypesListResponseSchema>;

/**
 * Schema for alert type statistics
 */
export const alertTypeStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  by_severity: z.object({
    info: z.number().int().nonnegative(),
    warning: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for AlertTypeStats
 */
export type AlertTypeStats = z.infer<typeof alertTypeStatsSchema>;
