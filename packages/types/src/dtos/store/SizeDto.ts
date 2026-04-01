/**
 * @file SizeDto
 * @description DTOs for Size CRUD operations using Zod schemas
 */

import { z } from 'zod';
import {
  createSizeSchema,
  updateSizeSchema,
  sizeSchema,
} from '../../validators/store/size.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new size
 */
export const CreateSizeDto = createSizeSchema;
export type CreateSizeDto = z.infer<typeof CreateSizeDto>;

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating a size
 */
export const UpdateSizeDto = updateSizeSchema;
export type UpdateSizeDto = z.infer<typeof UpdateSizeDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for size response (includes all fields)
 */
export const SizeResponseDto = sizeSchema;
export type SizeResponseDto = z.infer<typeof SizeResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for size list item (subset of fields for list views)
 */
export const SizeListItemDto = sizeSchema.pick({
  id: true,
  nom: true,
  ordre: true,
});
export type SizeListItemDto = z.infer<typeof SizeListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated size list response
 */
export const SizeListResponseDto = z.object({
  items: z.array(SizeListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type SizeListResponseDto = z.infer<typeof SizeListResponseDto>;
