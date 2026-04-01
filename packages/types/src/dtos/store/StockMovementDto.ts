/**
 * @file StockMovementDto
 * @description DTOs for StockMovement operations using Zod schemas
 */

import { z } from 'zod';
import {
  createStockMovementSchema,
  stockMovementSchema,
} from '../../validators/store/stock-movement.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new stock movement
 */
export const CreateStockMovementDto = createStockMovementSchema;
export type CreateStockMovementDto = z.infer<typeof CreateStockMovementDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for stock movement response (includes all fields)
 */
export const StockMovementResponseDto = stockMovementSchema;
export type StockMovementResponseDto = z.infer<typeof StockMovementResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for stock movement list item (subset of fields for list views)
 */
export const StockMovementListItemDto = stockMovementSchema.pick({
  id: true,
  article_id: true,
  taille: true,
  type_mouvement: true,
  quantite_mouvement: true,
  commande_id: true,
  motif: true,
  created_at: true,
});
export type StockMovementListItemDto = z.infer<typeof StockMovementListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated stock movement list response
 */
export const StockMovementListResponseDto = z.object({
  items: z.array(StockMovementListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type StockMovementListResponseDto = z.infer<typeof StockMovementListResponseDto>;
