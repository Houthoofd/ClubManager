/**
 * @file Image Validators
 * @description Zod validators for article additional images
 */

import { z } from 'zod';
import { IMAGE_CONSTRAINTS } from '../../constants/store.constants.js';
import { idSchema, idStringSchema } from '../common/common.validators.js';

/**
 * Base image schema with all fields from DB
 */
export const imageSchema = z.object({
  id: idSchema,
  article_id: idSchema,
  url: z
    .string()
    .min(IMAGE_CONSTRAINTS.URL_MIN_LENGTH, 'L\'URL est requise')
    .max(
      IMAGE_CONSTRAINTS.URL_MAX_LENGTH,
      `L'URL ne peut pas dépasser ${IMAGE_CONSTRAINTS.URL_MAX_LENGTH} caractères`
    )
    .url('L\'URL doit être valide')
    .trim(),
  ordre: z
    .number()
    .int('L\'ordre doit être un nombre entier')
    .min(IMAGE_CONSTRAINTS.ORDRE_MIN, `L'ordre doit être supérieur ou égal à ${IMAGE_CONSTRAINTS.ORDRE_MIN}`)
    .default(0),
});

/**
 * Schema for creating a new image
 * Required: article_id, url
 * Optional: ordre
 */
export const createImageSchema = imageSchema
  .pick({
    article_id: true,
    url: true,
    ordre: true,
  })
  .partial({
    ordre: true,
  });

/**
 * Schema for updating an image
 * All fields optional except article_id (should not change)
 */
export const updateImageSchema = imageSchema
  .pick({
    url: true,
    ordre: true,
  })
  .partial();

/**
 * Schema for image ID parameter in routes
 */
export const imageIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for querying images by article
 */
export const imagesByArticleParamSchema = z.object({
  article_id: idStringSchema,
});

/**
 * Schema for bulk image operations
 */
export const bulkImageSchema = z.object({
  ids: z.array(idSchema).min(1, 'Au moins un ID est requis'),
});

/**
 * Schema for reordering images
 */
export const reorderImagesSchema = z.object({
  images: z
    .array(
      z.object({
        id: idSchema,
        ordre: z.number().int().min(IMAGE_CONSTRAINTS.ORDRE_MIN),
      })
    )
    .min(1, 'Au moins une image est requise'),
});

/**
 * Schema for bulk creating images for an article
 */
export const bulkCreateImagesSchema = z.object({
  article_id: idSchema,
  images: z
    .array(
      z.object({
        url: z
          .string()
          .min(IMAGE_CONSTRAINTS.URL_MIN_LENGTH)
          .max(IMAGE_CONSTRAINTS.URL_MAX_LENGTH)
          .url()
          .trim(),
        ordre: z.number().int().min(IMAGE_CONSTRAINTS.ORDRE_MIN).optional(),
      })
    )
    .min(1, 'Au moins une image est requise')
    .max(20, 'Maximum 20 images par article'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Image = z.infer<typeof imageSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
export type ImageIdParam = z.infer<typeof imageIdParamSchema>;
export type ImagesByArticleParam = z.infer<typeof imagesByArticleParamSchema>;
export type BulkImageInput = z.infer<typeof bulkImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
export type BulkCreateImagesInput = z.infer<typeof bulkCreateImagesSchema>;
