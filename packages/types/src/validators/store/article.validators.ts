/**
 * @file Article Validators
 * @description Zod validators for store articles
 */

import { z } from 'zod';
import { ARTICLE_CONSTRAINTS } from '../../constants/store.constants.js';
import { idSchema, idStringSchema, timestampSchema, booleanSchema } from '../common/common.validators.js';

/**
 * Base article schema with all fields from DB
 */
export const articleSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .min(ARTICLE_CONSTRAINTS.NOM_MIN_LENGTH, 'Le nom est requis')
    .max(
      ARTICLE_CONSTRAINTS.NOM_MAX_LENGTH,
      `Le nom ne peut pas dépasser ${ARTICLE_CONSTRAINTS.NOM_MAX_LENGTH} caractères`
    )
    .trim(),
  description: z
    .string()
    .max(
      ARTICLE_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
      `La description ne peut pas dépasser ${ARTICLE_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} caractères`
    )
    .nullable()
    .optional(),
  prix: z
    .number()
    .min(ARTICLE_CONSTRAINTS.PRIX_MIN, `Le prix doit être supérieur ou égal à ${ARTICLE_CONSTRAINTS.PRIX_MIN}`)
    .max(ARTICLE_CONSTRAINTS.PRIX_MAX, `Le prix ne peut pas dépasser ${ARTICLE_CONSTRAINTS.PRIX_MAX}`)
    .refine((val) => {
      // Validate max 2 decimal places
      const decimalPart = val.toString().split('.')[1];
      return !decimalPart || decimalPart.length <= 2;
    }, 'Le prix ne peut avoir que 2 décimales maximum'),
  image_url: z
    .string()
    .max(
      ARTICLE_CONSTRAINTS.IMAGE_URL_MAX_LENGTH,
      `L'URL de l'image ne peut pas dépasser ${ARTICLE_CONSTRAINTS.IMAGE_URL_MAX_LENGTH} caractères`
    )
    .url('L\'URL de l\'image doit être valide')
    .nullable()
    .optional(),
  categorie_id: idSchema.nullable().optional(),
  actif: booleanSchema.default(true),
  created_at: timestampSchema,
  updated_at: timestampSchema.nullable().optional(),
});

/**
 * Schema for creating a new article
 * Required: nom, prix
 * Optional: description, image_url, categorie_id, actif
 */
export const createArticleSchema = articleSchema
  .pick({
    nom: true,
    description: true,
    prix: true,
    image_url: true,
    categorie_id: true,
    actif: true,
  })
  .partial({
    description: true,
    image_url: true,
    categorie_id: true,
    actif: true,
  });

/**
 * Schema for updating an article
 * All fields optional
 */
export const updateArticleSchema = articleSchema
  .pick({
    nom: true,
    description: true,
    prix: true,
    image_url: true,
    categorie_id: true,
    actif: true,
  })
  .partial();

/**
 * Schema for article ID parameter in routes
 */
export const articleIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for article query filters
 */
export const articleQuerySchema = z.object({
  search: z.string().trim().optional(),
  categorie_id: idStringSchema.optional(),
  actif: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  prix_min: z.coerce.number().nonnegative().optional(),
  prix_max: z.coerce.number().nonnegative().optional(),
  sort_by: z.enum(['nom', 'prix', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Schema for bulk article operations
 */
export const bulkArticleSchema = z.object({
  ids: z.array(idSchema).min(1, 'Au moins un ID est requis'),
});

/**
 * Schema for activating/deactivating articles
 */
export const toggleArticleActiveSchema = z.object({
  actif: booleanSchema,
});

/**
 * Schema for bulk update article prices
 */
export const bulkUpdateArticlePricesSchema = z.object({
  articles: z
    .array(
      z.object({
        id: idSchema,
        prix: z
          .number()
          .min(ARTICLE_CONSTRAINTS.PRIX_MIN)
          .max(ARTICLE_CONSTRAINTS.PRIX_MAX)
          .refine((val) => {
            const decimalPart = val.toString().split('.')[1];
            return !decimalPart || decimalPart.length <= 2;
          }, 'Le prix ne peut avoir que 2 décimales maximum'),
      })
    )
    .min(1, 'Au moins un article est requis'),
});

/**
 * Schema for bulk update article categories
 */
export const bulkUpdateArticleCategoriesSchema = z.object({
  article_ids: z.array(idSchema).min(1, 'Au moins un article est requis'),
  categorie_id: idSchema.nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Article = z.infer<typeof articleSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleIdParam = z.infer<typeof articleIdParamSchema>;
export type ArticleQuery = z.infer<typeof articleQuerySchema>;
export type BulkArticleInput = z.infer<typeof bulkArticleSchema>;
export type ToggleArticleActiveInput = z.infer<typeof toggleArticleActiveSchema>;
export type BulkUpdateArticlePricesInput = z.infer<typeof bulkUpdateArticlePricesSchema>;
export type BulkUpdateArticleCategoriesInput = z.infer<typeof bulkUpdateArticleCategoriesSchema>;
