/**
 * @fileoverview Custom Message Type Validators
 * @module @clubmanager/types/validators/messaging/custom-message-type
 *
 * Zod schemas for validating custom message types (template categories).
 *
 * DB Table: types_messages_personnalises
 * Columns: id, nom, description, actif
 *
 * Business Rules:
 * - Name is required and unique (1-100 chars)
 * - Description is optional (up to 65535 chars)
 * - actif is boolean with default true
 * - Used to categorize message templates (welcome, reminder, etc.)
 */

import { z } from 'zod';
import {
  CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH,
  CUSTOM_MESSAGE_TYPE_NAME_MIN_LENGTH,
  CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH,
  MESSAGING_DEFAULT_PAGE_SIZE,
  MESSAGING_MAX_PAGE_SIZE,
  MESSAGING_MIN_PAGE_SIZE,
  MESSAGING_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/messaging.constants.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Base custom message type schema with all fields
 */
export const customMessageTypeBaseSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .trim()
    .min(CUSTOM_MESSAGE_TYPE_NAME_MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${CUSTOM_MESSAGE_TYPE_NAME_MIN_LENGTH} caractère`,
    })
    .max(CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH} caractères`,
    }),
  description: z
    .string()
    .trim()
    .max(CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH, {
      message: `La description ne peut pas dépasser ${CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
  actif: z.boolean().default(true),
});

/**
 * Inferred TypeScript type for CustomMessageType
 */
export type CustomMessageType = z.infer<typeof customMessageTypeBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new custom message type
 * Required: nom
 * Optional: description, actif (defaults to true)
 */
export const createCustomMessageTypeSchema = customMessageTypeBaseSchema.pick({
  nom: true,
  description: true,
  actif: true,
});

/**
 * Inferred TypeScript type for CreateCustomMessageType
 */
export type CreateCustomMessageType = z.infer<typeof createCustomMessageTypeSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a custom message type
 * All fields are optional
 */
export const updateCustomMessageTypeSchema = customMessageTypeBaseSchema
  .pick({
    nom: true,
    description: true,
    actif: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateCustomMessageType
 */
export type UpdateCustomMessageType = z.infer<typeof updateCustomMessageTypeSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing custom message types with filters
 */
export const listCustomMessageTypesSchema = paginationSchema.extend({
  actif: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  search: z.string().trim().optional(),
  sort_by: z.enum(['nom', 'actif']).default('nom'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for ListCustomMessageTypes query
 */
export type ListCustomMessageTypesQuery = z.infer<typeof listCustomMessageTypesSchema>;

/**
 * Schema for getting active custom message types
 */
export const activeCustomMessageTypesSchema = z.object({
  sort_by: z.enum(['nom']).default('nom'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for ActiveCustomMessageTypes query
 */
export type ActiveCustomMessageTypesQuery = z.infer<typeof activeCustomMessageTypesSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating custom message type ID as number
 */
export const customMessageTypeIdSchema = idSchema;

/**
 * Schema for validating custom message type ID as string (from params)
 */
export const customMessageTypeIdStringSchema = idStringSchema;

/**
 * Schema for validating custom message type ID in route params
 */
export const customMessageTypeIdParamSchema = z.object({
  id: customMessageTypeIdStringSchema,
});

/**
 * Inferred TypeScript type for custom message type ID param
 */
export type CustomMessageTypeIdParam = z.infer<typeof customMessageTypeIdParamSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for custom message type response (includes all fields)
 */
export const customMessageTypeResponseSchema = customMessageTypeBaseSchema;

/**
 * Inferred TypeScript type for CustomMessageTypeResponse
 */
export type CustomMessageTypeResponse = z.infer<typeof customMessageTypeResponseSchema>;

/**
 * Schema for paginated custom message types list response
 */
export const customMessageTypesListResponseSchema = z.object({
  data: z.array(customMessageTypeResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for CustomMessageTypesListResponse
 */
export type CustomMessageTypesListResponse = z.infer<typeof customMessageTypesListResponseSchema>;

/**
 * Schema for custom message type statistics
 */
export const customMessageTypeStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
  templates_count: z.record(z.number().int().nonnegative()),
});

/**
 * Inferred TypeScript type for CustomMessageTypeStats
 */
export type CustomMessageTypeStats = z.infer<typeof customMessageTypeStatsSchema>;
