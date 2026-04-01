/**
 * @fileoverview Grade Validators
 * @module @clubmanager/types/validators/lookup/grade
 *
 * Zod schemas for validating grades (belt ranks) for martial arts.
 *
 * DB Table: grades
 * Columns: id, nom, ordre, couleur
 *
 * Business Rules:
 * - Name is required and unique (1-50 chars)
 * - Order (ordre) is required, integer, default 0
 * - Color (couleur) is optional (max 20 chars)
 * - Used for ranking system (white, blue, purple, brown, black belts, etc.)
 */

import { z } from 'zod';
import {
  GRADE_NAME_MAX_LENGTH,
  GRADE_NAME_MIN_LENGTH,
  GRADE_COLOR_MAX_LENGTH,
  GRADE_MIN_ORDER,
  GRADE_MAX_ORDER,
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
 * Base grade schema with all fields
 */
export const gradeBaseSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .trim()
    .min(GRADE_NAME_MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${GRADE_NAME_MIN_LENGTH} caractère`,
    })
    .max(GRADE_NAME_MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${GRADE_NAME_MAX_LENGTH} caractères`,
    }),
  ordre: z
    .number()
    .int({ message: "L'ordre doit être un nombre entier" })
    .min(GRADE_MIN_ORDER, {
      message: `L'ordre doit être supérieur ou égal à ${GRADE_MIN_ORDER}`,
    })
    .max(GRADE_MAX_ORDER, {
      message: `L'ordre ne peut pas dépasser ${GRADE_MAX_ORDER}`,
    })
    .default(0),
  couleur: z
    .string()
    .trim()
    .max(GRADE_COLOR_MAX_LENGTH, {
      message: `La couleur ne peut pas dépasser ${GRADE_COLOR_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
});

/**
 * Inferred TypeScript type for Grade
 */
export type Grade = z.infer<typeof gradeBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new grade
 * Required: nom
 * Optional: ordre (default 0), couleur
 */
export const createGradeSchema = gradeBaseSchema.pick({
  nom: true,
  ordre: true,
  couleur: true,
});

/**
 * Inferred TypeScript type for CreateGrade
 */
export type CreateGrade = z.infer<typeof createGradeSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a grade
 * All fields are optional
 */
export const updateGradeSchema = gradeBaseSchema
  .pick({
    nom: true,
    ordre: true,
    couleur: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateGrade
 */
export type UpdateGrade = z.infer<typeof updateGradeSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing grades with filters
 */
export const listGradesSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  ordre_min: z.coerce.number().int().min(GRADE_MIN_ORDER).optional(),
  ordre_max: z.coerce.number().int().max(GRADE_MAX_ORDER).optional(),
  couleur: z.string().trim().optional(),
  sort_by: z.enum(['nom', 'ordre', 'id']).default('ordre'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListGrades query
 */
export type ListGradesQuery = z.infer<typeof listGradesSchema>;

/**
 * Schema for getting grades by order range
 */
export const gradesByOrderRangeSchema = z
  .object({
    ordre_min: z.number().int().min(GRADE_MIN_ORDER),
    ordre_max: z.number().int().max(GRADE_MAX_ORDER),
  })
  .refine((data) => data.ordre_max >= data.ordre_min, {
    message: "L'ordre maximum doit être supérieur ou égal à l'ordre minimum",
    path: ['ordre_max'],
  });

/**
 * Inferred TypeScript type for GradesByOrderRange query
 */
export type GradesByOrderRangeQuery = z.infer<typeof gradesByOrderRangeSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating grade ID as number
 */
export const gradeIdSchema = idSchema;

/**
 * Schema for validating grade ID as string (from params)
 */
export const gradeIdStringSchema = idStringSchema;

/**
 * Schema for validating grade ID in route params
 */
export const gradeIdParamSchema = z.object({
  id: gradeIdStringSchema,
});

/**
 * Inferred TypeScript type for grade ID param
 */
export type GradeIdParam = z.infer<typeof gradeIdParamSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for grade response (includes all fields)
 */
export const gradeResponseSchema = gradeBaseSchema;

/**
 * Inferred TypeScript type for GradeResponse
 */
export type GradeResponse = z.infer<typeof gradeResponseSchema>;

/**
 * Schema for paginated grades list response
 */
export const gradesListResponseSchema = z.object({
  data: z.array(gradeResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for GradesListResponse
 */
export type GradesListResponse = z.infer<typeof gradesListResponseSchema>;

/**
 * Schema for grade statistics
 */
export const gradeStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  by_order: z.record(z.number().int().nonnegative()),
  highest_order: z.number().int().nonnegative(),
  lowest_order: z.number().int().nonnegative(),
});

/**
 * Inferred TypeScript type for GradeStats
 */
export type GradeStats = z.infer<typeof gradeStatsSchema>;

/**
 * Schema for grade progression (next/previous grades)
 */
export const gradeProgressionSchema = z.object({
  current: gradeResponseSchema,
  previous: gradeResponseSchema.nullable().optional(),
  next: gradeResponseSchema.nullable().optional(),
});

/**
 * Inferred TypeScript type for GradeProgression
 */
export type GradeProgression = z.infer<typeof gradeProgressionSchema>;
