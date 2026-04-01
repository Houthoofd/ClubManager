/**
 * @fileoverview Genre Validators
 * @module @clubmanager/types/validators/lookup/genre
 *
 * Zod schemas for validating genre (gender) lookup table.
 *
 * DB Table: genres
 * Columns: id, nom
 *
 * Business Rules:
 * - Name is required and unique (1-50 chars)
 * - Simple lookup table for gender/genre types (Homme, Femme, Autre, etc.)
 */

import { z } from 'zod';
import {
  GENRE_NAME_MAX_LENGTH,
  GENRE_NAME_MIN_LENGTH,
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
 * Base genre schema with all fields
 */
export const genreBaseSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .trim()
    .min(GENRE_NAME_MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${GENRE_NAME_MIN_LENGTH} caractère`,
    })
    .max(GENRE_NAME_MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${GENRE_NAME_MAX_LENGTH} caractères`,
    }),
});

/**
 * Inferred TypeScript type for Genre
 */
export type Genre = z.infer<typeof genreBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new genre
 * Required: nom
 */
export const createGenreSchema = genreBaseSchema.pick({
  nom: true,
});

/**
 * Inferred TypeScript type for CreateGenre
 */
export type CreateGenre = z.infer<typeof createGenreSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a genre
 * Only nom can be updated
 */
export const updateGenreSchema = genreBaseSchema
  .pick({
    nom: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateGenre
 */
export type UpdateGenre = z.infer<typeof updateGenreSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing genres with filters
 */
export const listGenresSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  sort_by: z.enum(['nom', 'id']).default('nom'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListGenres query
 */
export type ListGenresQuery = z.infer<typeof listGenresSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating genre ID as number
 */
export const genreIdSchema = idSchema;

/**
 * Schema for validating genre ID as string (from params)
 */
export const genreIdStringSchema = idStringSchema;

/**
 * Schema for validating genre ID in route params
 */
export const genreIdParamSchema = z.object({
  id: genreIdStringSchema,
});

/**
 * Inferred TypeScript type for genre ID param
 */
export type GenreIdParam = z.infer<typeof genreIdParamSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for genre response (includes all fields)
 */
export const genreResponseSchema = genreBaseSchema;

/**
 * Inferred TypeScript type for GenreResponse
 */
export type GenreResponse = z.infer<typeof genreResponseSchema>;

/**
 * Schema for paginated genres list response
 */
export const genresListResponseSchema = z.object({
  data: z.array(genreResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for GenresListResponse
 */
export type GenresListResponse = z.infer<typeof genresListResponseSchema>;

/**
 * Schema for genre statistics
 */
export const genreStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  usage_count: z.record(z.number().int().nonnegative()),
});

/**
 * Inferred TypeScript type for GenreStats
 */
export type GenreStats = z.infer<typeof genreStatsSchema>;
