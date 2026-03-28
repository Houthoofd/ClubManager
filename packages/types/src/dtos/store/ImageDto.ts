/**
 * @file ImageDto
 * @description DTOs for Image operations using Zod schemas
 */

import { z } from 'zod';
import {
  createImageSchema,
  updateImageSchema,
  imageSchema,
} from '../../validators/store/image.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new image
 */
export const CreateImageDto = createImageSchema;
export type CreateImageDto = z.infer<typeof CreateImageDto>;

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating an image
 */
export const UpdateImageDto = updateImageSchema;
export type UpdateImageDto = z.infer<typeof UpdateImageDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for image response (includes all fields)
 */
export const ImageResponseDto = imageSchema;
export type ImageResponseDto = z.infer<typeof ImageResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for image list item (subset of fields for list views)
 */
export const ImageListItemDto = imageSchema.pick({
  id: true,
  article_id: true,
  url: true,
  ordre: true,
});
export type ImageListItemDto = z.infer<typeof ImageListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated image list response
 */
export const ImageListResponseDto = z.object({
  items: z.array(ImageListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type ImageListResponseDto = z.infer<typeof ImageListResponseDto>;
