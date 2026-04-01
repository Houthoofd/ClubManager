/**
 * @file OrderItemDto
 * @description DTOs for OrderItem operations using Zod schemas
 */

import { z } from 'zod';
import {
  createOrderItemSchema,
  updateOrderItemSchema,
  orderItemSchema,
} from '../../validators/store/order-item.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new order item
 */
export const CreateOrderItemDto = createOrderItemSchema;
export type CreateOrderItemDto = z.infer<typeof CreateOrderItemDto>;

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating an order item
 */
export const UpdateOrderItemDto = updateOrderItemSchema;
export type UpdateOrderItemDto = z.infer<typeof UpdateOrderItemDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for order item response (includes all fields)
 */
export const OrderItemResponseDto = orderItemSchema;
export type OrderItemResponseDto = z.infer<typeof OrderItemResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for order item list item (subset of fields for list views)
 */
export const OrderItemListItemDto = orderItemSchema.pick({
  id: true,
  commande_id: true,
  article_id: true,
  taille_id: true,
  quantite: true,
  prix: true,
});
export type OrderItemListItemDto = z.infer<typeof OrderItemListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated order item list response
 */
export const OrderItemListResponseDto = z.object({
  items: z.array(OrderItemListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type OrderItemListResponseDto = z.infer<typeof OrderItemListResponseDto>;
