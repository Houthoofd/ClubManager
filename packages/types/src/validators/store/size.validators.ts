/**
 * @file Size Validators
 * @description Zod validators for article sizes (tailles)
 */

import { z } from 'zod';
import { SIZE_CONSTRAINTS } from '../../constants/store.constants.js';
import { idSchema, idStringSchema } from '../common/common.validators.js';

/**
 * Base size schema with all fields from DB
 */
export const sizeSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .min(SIZE_CONSTRAINTS.NOM_MIN_LENGTH, 'Le nom est requis')
    .max(
      SIZE_CONSTRAINTS.NOM_MAX_LENGTH,
      `Le nom ne peut pas dépasser ${SIZE_CONSTRAINTS.NOM_MAX_LENGTH} caractères`
    )
    .trim(),
  ordre: z.number().int('L\'ordre doit être un nombre entier').default(0),
});

/**
 * Schema for creating a new size
 * Required: nom
 * Optional: ordre
 */
export const createSizeSchema = sizeSchema
  .pick({
    nom: true,
    ordre: true,
  })
  .partial({
    ordre: true,
  });

/**
 * Schema for updating a size
 * All fields optional
 */
export const updateSizeSchema = sizeSchema
  .pick({
    nom: true,
    ordre: true,
  })
  .partial();

/**
 * Schema for size ID parameter in routes
 */
export const sizeIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for size query filters
 */
export const sizeQuerySchema = z.object({
  search: z.string().trim().optional(),
  ordre_min: z.coerce.number().int().nonnegative().optional(),
  ordre_max: z.coerce.number().int().nonnegative().optional(),
});

/**
 * Schema for bulk size operations
 */
export const bulkSizeSchema = z.object({
  ids: z.array(idSchema).min(1, 'Au moins un ID est requis'),
});

/**
 * Schema for reordering sizes
 */
export const reorderSizesSchema = z.object({
  sizes: z
    .array(
      z.object({
        id: idSchema,
        ordre: z.number().int().nonnegative(),
      })
    )
    .min(1, 'Au moins une taille est requise'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Size = z.infer<typeof sizeSchema>;
export type CreateSizeInput = z.infer<typeof createSizeSchema>;
export type UpdateSizeInput = z.infer<typeof updateSizeSchema>;
export type SizeIdParam = z.infer<typeof sizeIdParamSchema>;
export type SizeQuery = z.infer<typeof sizeQuerySchema>;
export type BulkSizeInput = z.infer<typeof bulkSizeSchema>;
export type ReorderSizesInput = z.infer<typeof reorderSizesSchema>;
