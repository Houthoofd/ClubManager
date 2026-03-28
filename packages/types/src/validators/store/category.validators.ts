/**
 * @file Category Validators
 * @description Zod validators for store categories
 */

import { z } from "zod";
import { CATEGORY_CONSTRAINTS } from "../../constants/store.constants.js";
import { idSchema, idStringSchema } from "../common/common.validators.js";

/**
 * Base category schema with all fields from DB
 */
export const categorySchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .min(CATEGORY_CONSTRAINTS.NOM_MIN_LENGTH, "Le nom est requis")
    .max(
      CATEGORY_CONSTRAINTS.NOM_MAX_LENGTH,
      `Le nom ne peut pas dépasser ${CATEGORY_CONSTRAINTS.NOM_MAX_LENGTH} caractères`,
    )
    .trim(),
  description: z
    .string()
    .max(
      CATEGORY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
      `La description ne peut pas dépasser ${CATEGORY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} caractères`,
    )
    .nullable()
    .optional(),
  ordre: z.number().int("L'ordre doit être un nombre entier").default(0),
});

/**
 * Schema for creating a new category
 * Required: nom
 * Optional: description, ordre
 */
export const createCategorySchema = categorySchema
  .pick({
    nom: true,
    description: true,
    ordre: true,
  })
  .partial({
    description: true,
    ordre: true,
  });

/**
 * Schema for updating a category
 * All fields optional
 */
export const updateCategorySchema = categorySchema
  .pick({
    nom: true,
    description: true,
    ordre: true,
  })
  .partial();

/**
 * Schema for category ID parameter in routes
 */
export const categoryIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for category query filters
 */
export const categoryQuerySchema = z.object({
  search: z.string().trim().optional(),
  ordre_min: z.coerce.number().int().nonnegative().optional(),
  ordre_max: z.coerce.number().int().nonnegative().optional(),
});

/**
 * Schema for bulk category operations
 */
export const bulkCategorySchema = z.object({
  ids: z.array(idSchema).min(1, "Au moins un ID est requis"),
});

/**
 * Schema for reordering categories
 */
export const reorderCategoriesSchema = z.object({
  categories: z
    .array(
      z.object({
        id: idSchema,
        ordre: z.number().int().nonnegative(),
      }),
    )
    .min(1, "Au moins une catégorie est requise"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
export type BulkCategoryInput = z.infer<typeof bulkCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
