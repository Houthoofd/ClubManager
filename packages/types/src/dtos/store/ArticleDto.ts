/**
 * @file ArticleDto
 * @description DTOs for Article CRUD operations using Zod schemas
 */

import { z } from 'zod';
import {
  createArticleSchema,
  updateArticleSchema,
  articleSchema,
} from '../../validators/store/article.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new article
 */
export const CreateArticleDto = createArticleSchema;
export type CreateArticleDto = z.infer<typeof CreateArticleDto>;

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating an article
 */
export const UpdateArticleDto = updateArticleSchema;
export type UpdateArticleDto = z.infer<typeof UpdateArticleDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for article response (includes all fields)
 */
export const ArticleResponseDto = articleSchema;
export type ArticleResponseDto = z.infer<typeof ArticleResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for article list item (subset of fields for list views)
 */
export const ArticleListItemDto = articleSchema.pick({
  id: true,
  nom: true,
  prix: true,
  image_url: true,
  categorie_id: true,
  actif: true,
});
export type ArticleListItemDto = z.infer<typeof ArticleListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated article list response
 */
export const ArticleListResponseDto = z.object({
  items: z.array(ArticleListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type ArticleListResponseDto = z.infer<typeof ArticleListResponseDto>;
