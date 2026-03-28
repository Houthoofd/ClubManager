/**
 * @fileoverview Status Validators
 * @module @clubmanager/types/validators/lookup/status
 *
 * Zod schemas for validating status lookup table.
 *
 * DB Table: status
 * Columns: id, nom, description
 *
 * Business Rules:
 * - Name is required and unique (1-50 chars)
 * - Description is optional (max 65535 chars)
 * - Used for general status values (Actif, Inactif, Suspendu, etc.)
 */

import { z } from 'zod';
import {
  STATUS_NAME_MAX_LENGTH,
  STATUS_NAME_MIN_LENGTH,
  STATUS_DESCRIPTION_MAX_LENGTH,
  LOOKUP_DEFAULT_PAGE_SIZE,
  LOOKUP_MAX_PAGE_SIZE,
  LOOKUP_MIN_PAGE_SIZE,
  LOOKUP_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/lookup.constants.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Base status schema with all fields
 */
export const statusBaseSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .trim()
    .min(STATUS_NAME_MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${STATUS_NAME_MIN_LENGTH} caractère`,
    })
    .max(STATUS_NAME_MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${STATUS_NAME_MAX_LENGTH} caractères`,
    }),
  description: z
    .string()
    .trim()
    .max(STATUS_DESCRIPTION_MAX_LENGTH, {
      message: `La description ne peut pas dépasser ${STATUS_DESCRIPTION_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
});

/**
 * Inferred TypeScript type for Status
 */
export type Status = z.infer<typeof statusBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new status
 * Required: nom
 * Optional: description
 */
export const createStatusSchema = statusBaseSchema.pick({
  nom: true,
  description: true,
});

/**
 * Inferred TypeScript type for CreateStatus
 */
export type CreateStatus = z.infer<typeof createStatusSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a status
 * All fields are optional
 */
export const updateStatusSchema = statusBaseSchema
  .pick({
    nom: true,
    description: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateStatus
 */
export type UpdateStatus = z.infer<typeof updateStatusSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing status entries with filters
 */
export const listStatusesSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  has_description: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  sort_by: z.enum(['nom', 'id']).default('nom'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListStatuses query
 */
export type ListStatusesQuery = z.infer<typeof listStatusesSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating status ID as number
 */
export const statusIdSchema = idSchema;

/**
 * Schema for validating status ID as string (from params)
 */
export const statusIdStringSchema = idStringSchema;

/**
 * Schema for validating status ID in route params
 */
export const statusIdParamSchema = z.object({
  id: statusIdStringSchema,
});

/**
 * Inferred TypeScript type for status ID param
 */
export type StatusIdParam = z.infer<typeof statusIdParamSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for status response (includes all fields)
 */
export const statusResponseSchema = statusBaseSchema;

/**
 * Inferred TypeScript type for StatusResponse
 */
export type StatusResponse = z.infer<typeof statusResponseSchema>;

/**
 * Schema for paginated statuses list response
 */
export const statusesListResponseSchema = z.object({
  data: z.array(statusResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for StatusesListResponse
 */
export type StatusesListResponse = z.infer<typeof statusesListResponseSchema>;

/**
 * Schema for status statistics
 */
export const statusStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  with_description: z.number().int().nonnegative(),
  without_description: z.number().int().nonnegative(),
  usage_count: z.record(z.number().int().nonnegative()),
});

/**
 * Inferred TypeScript type for StatusStats
 */
export type StatusStats = z.infer<typeof statusStatsSchema>;
