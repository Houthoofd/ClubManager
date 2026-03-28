/**
 * @fileoverview Information Validators
 * @module @clubmanager/types/validators/statistics/information
 *
 * Zod schemas for validating general club information (key-value store).
 *
 * DB Table: informations
 * Columns: id, cle, valeur, description, updated_at
 *
 * Business Rules:
 * - Key (cle): required, unique, 1-100 chars
 * - Value (valeur): required, 1-65535 chars
 * - Description: optional, max 65535 chars
 * - Used for club settings, contact info, hours, etc.
 */

import { z } from 'zod';
import {
  INFORMATION_KEY_MAX_LENGTH,
  INFORMATION_KEY_MIN_LENGTH,
  INFORMATION_VALUE_MAX_LENGTH,
  INFORMATION_VALUE_MIN_LENGTH,
  INFORMATION_DESCRIPTION_MAX_LENGTH,
  STATISTICS_DEFAULT_PAGE_SIZE,
  STATISTICS_MAX_PAGE_SIZE,
  STATISTICS_MIN_PAGE_SIZE,
  STATISTICS_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/statistics.constants.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Base information schema with all fields
 */
export const informationBaseSchema = z.object({
  id: idSchema,
  cle: z
    .string()
    .trim()
    .min(INFORMATION_KEY_MIN_LENGTH, {
      message: `La clé doit contenir au moins ${INFORMATION_KEY_MIN_LENGTH} caractère`,
    })
    .max(INFORMATION_KEY_MAX_LENGTH, {
      message: `La clé ne peut pas dépasser ${INFORMATION_KEY_MAX_LENGTH} caractères`,
    }),
  valeur: z
    .string()
    .trim()
    .min(INFORMATION_VALUE_MIN_LENGTH, {
      message: `La valeur doit contenir au moins ${INFORMATION_VALUE_MIN_LENGTH} caractère`,
    })
    .max(INFORMATION_VALUE_MAX_LENGTH, {
      message: `La valeur ne peut pas dépasser ${INFORMATION_VALUE_MAX_LENGTH} caractères`,
    }),
  description: z
    .string()
    .trim()
    .max(INFORMATION_DESCRIPTION_MAX_LENGTH, {
      message: `La description ne peut pas dépasser ${INFORMATION_DESCRIPTION_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
  updated_at: z.coerce.date().nullable().optional(),
});

/**
 * Inferred TypeScript type for Information
 */
export type Information = z.infer<typeof informationBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new information entry
 * Required: cle, valeur
 * Optional: description
 */
export const createInformationSchema = informationBaseSchema.pick({
  cle: true,
  valeur: true,
  description: true,
});

/**
 * Inferred TypeScript type for CreateInformation
 */
export type CreateInformation = z.infer<typeof createInformationSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating an information entry
 * Can update: valeur, description
 * Key (cle) cannot be updated to maintain consistency
 */
export const updateInformationSchema = z.object({
  valeur: z
    .string()
    .trim()
    .min(INFORMATION_VALUE_MIN_LENGTH)
    .max(INFORMATION_VALUE_MAX_LENGTH)
    .optional(),
  description: z
    .string()
    .trim()
    .max(INFORMATION_DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional(),
});

/**
 * Inferred TypeScript type for UpdateInformation
 */
export type UpdateInformation = z.infer<typeof updateInformationSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing information entries with filters
 */
export const listInformationsSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  cle: z.string().trim().optional(),
  sort_by: z.enum(['cle', 'updated_at']).default('cle'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for ListInformations query
 */
export type ListInformationsQuery = z.infer<typeof listInformationsSchema>;

/**
 * Schema for getting information by key
 */
export const getInformationByKeySchema = z.object({
  cle: z
    .string()
    .trim()
    .min(INFORMATION_KEY_MIN_LENGTH)
    .max(INFORMATION_KEY_MAX_LENGTH),
});

/**
 * Inferred TypeScript type for GetInformationByKey
 */
export type GetInformationByKey = z.infer<typeof getInformationByKeySchema>;

/**
 * Schema for checking if information key exists
 */
export const informationKeyExistsSchema = z.object({
  cle: z.string().trim().min(1),
});

/**
 * Inferred TypeScript type for InformationKeyExists
 */
export type InformationKeyExists = z.infer<typeof informationKeyExistsSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating information ID as number
 */
export const informationIdSchema = idSchema;

/**
 * Schema for validating information ID as string (from params)
 */
export const informationIdStringSchema = idStringSchema;

/**
 * Schema for validating information ID in route params
 */
export const informationIdParamSchema = z.object({
  id: informationIdStringSchema,
});

/**
 * Inferred TypeScript type for information ID param
 */
export type InformationIdParam = z.infer<typeof informationIdParamSchema>;

/**
 * Schema for validating information key in route params
 */
export const informationKeyParamSchema = z.object({
  cle: z.string().trim().min(1),
});

/**
 * Inferred TypeScript type for information key param
 */
export type InformationKeyParam = z.infer<typeof informationKeyParamSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

/**
 * Schema for bulk creating/updating information entries
 */
export const bulkUpsertInformationsSchema = z.object({
  informations: z
    .array(createInformationSchema)
    .min(1, { message: 'Au moins une information doit être fournie' })
    .max(50, { message: 'Vous ne pouvez pas créer/modifier plus de 50 informations à la fois' }),
});

/**
 * Inferred TypeScript type for BulkUpsertInformations
 */
export type BulkUpsertInformations = z.infer<typeof bulkUpsertInformationsSchema>;

/**
 * Schema for bulk deleting information entries
 */
export const bulkDeleteInformationsSchema = z.object({
  information_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins une information doit être sélectionnée' })
    .max(50, { message: 'Vous ne pouvez pas supprimer plus de 50 informations à la fois' }),
});

/**
 * Inferred TypeScript type for BulkDeleteInformations
 */
export type BulkDeleteInformations = z.infer<typeof bulkDeleteInformationsSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for information response (includes all fields)
 */
export const informationResponseSchema = informationBaseSchema;

/**
 * Inferred TypeScript type for InformationResponse
 */
export type InformationResponse = z.infer<typeof informationResponseSchema>;

/**
 * Schema for paginated informations list response
 */
export const informationsListResponseSchema = z.object({
  data: z.array(informationResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for InformationsListResponse
 */
export type InformationsListResponse = z.infer<typeof informationsListResponseSchema>;

/**
 * Schema for information statistics
 */
export const informationStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  with_description: z.number().int().nonnegative(),
  without_description: z.number().int().nonnegative(),
  recently_updated: z.number().int().nonnegative(),
});

/**
 * Inferred TypeScript type for InformationStats
 */
export type InformationStats = z.infer<typeof informationStatsSchema>;

/**
 * Schema for grouped information (e.g., by category prefix)
 */
export const groupedInformationsSchema = z.object({
  category: z.string(),
  informations: z.array(informationResponseSchema),
  count: z.number().int().nonnegative(),
});

/**
 * Inferred TypeScript type for GroupedInformations
 */
export type GroupedInformations = z.infer<typeof groupedInformationsSchema>;
