/**
 * @file StockDto
 * @description DTOs for Stock operations using Zod schemas
 */

import { z } from 'zod';
import {
  createStockSchema,
  updateStockSchema,
  stockSchema,
} from '../../validators/store/stock.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new stock entry
 */
export const CreateStockDto = createStockSchema;
export type CreateStockDto = z.infer<typeof CreateStockDto>;

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating a stock entry
 */
export const UpdateStockDto = updateStockSchema;
export type UpdateStockDto = z.infer<typeof UpdateStockDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for stock response (includes all fields)
 */
export const StockResponseDto = stockSchema;
export type StockResponseDto = z.infer<typeof StockResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for stock list item (subset of fields for list views)
 */
export const StockListItemDto = stockSchema.pick({
  id: true,
  article_id: true,
  taille_id: true,
  quantite: true,
  quantite_minimum: true,
});
export type StockListItemDto = z.infer<typeof StockListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated stock list response
 */
export const StockListResponseDto = z.object({
  items: z.array(StockListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type StockListResponseDto = z.infer<typeof StockListResponseDto>;
