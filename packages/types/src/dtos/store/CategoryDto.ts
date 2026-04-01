/**
 * @file CategoryDto
 * @description DTOs for Category CRUD operations using Zod schemas
 */

import { z } from 'zod';
import {
  createCategorySchema,
  updateCategorySchema,
  categorySchema,
} from '../../validators/store/category.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new category
 */
export const CreateCategoryDto = createCategorySchema;
export type CreateCategoryDto = z.infer<typeof CreateCategoryDto>;

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating a category
 */
export const UpdateCategoryDto = updateCategorySchema;
export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for category response (includes all fields)
 */
export const CategoryResponseDto = categorySchema;
export type CategoryResponseDto = z.infer<typeof CategoryResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for category list item (subset of fields for list views)
 */
export const CategoryListItemDto = categorySchema.pick({
  id: true,
  nom: true,
  ordre: true,
});
export type CategoryListItemDto = z.infer<typeof CategoryListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated category list response
 */
export const CategoryListResponseDto = z.object({
  items: z.array(CategoryListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type CategoryListResponseDto = z.infer<typeof CategoryListResponseDto>;
