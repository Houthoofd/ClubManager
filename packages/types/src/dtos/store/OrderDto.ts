/**
 * @file OrderDto
 * @description DTOs for Order operations using Zod schemas
 */

import { z } from 'zod';
import {
  createOrderSchema,
  updateOrderSchema,
  orderSchema,
} from '../../validators/store/order.validators.js';

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * DTO for creating a new order
 */
export const CreateOrderDto = createOrderSchema;
export type CreateOrderDto = z.infer<typeof CreateOrderDto>;

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * DTO for updating an order
 */
export const UpdateOrderDto = updateOrderSchema;
export type UpdateOrderDto = z.infer<typeof UpdateOrderDto>;

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * DTO for order response (includes all fields)
 */
export const OrderResponseDto = orderSchema;
export type OrderResponseDto = z.infer<typeof OrderResponseDto>;

// ============================================================================
// LIST ITEM DTO
// ============================================================================

/**
 * DTO for order list item (subset of fields for list views)
 */
export const OrderListItemDto = orderSchema.pick({
  id: true,
  unique_id: true,
  numero_commande: true,
  utilisateur_id: true,
  total: true,
  date_commande: true,
  statut: true,
});
export type OrderListItemDto = z.infer<typeof OrderListItemDto>;

// ============================================================================
// LIST RESPONSE DTO
// ============================================================================

/**
 * DTO for paginated order list response
 */
export const OrderListResponseDto = z.object({
  items: z.array(OrderListItemDto),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type OrderListResponseDto = z.infer<typeof OrderListResponseDto>;
