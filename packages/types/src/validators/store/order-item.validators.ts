/**
 * @file OrderItem Validators
 * @description Zod validators for order line items (commande_articles)
 */

import { z } from 'zod';
import { ORDER_ITEM_CONSTRAINTS } from '../../constants/store.constants.js';
import { idSchema, idStringSchema } from '../common/common.validators.js';

/**
 * Base order item schema with all fields from DB
 */
export const orderItemSchema = z.object({
  id: idSchema,
  commande_id: idSchema,
  article_id: idSchema,
  taille_id: idSchema,
  quantite: z
    .number()
    .int('La quantité doit être un nombre entier')
    .min(ORDER_ITEM_CONSTRAINTS.QUANTITE_MIN, `La quantité doit être supérieure ou égale à ${ORDER_ITEM_CONSTRAINTS.QUANTITE_MIN}`),
  prix: z
    .number()
    .min(ORDER_ITEM_CONSTRAINTS.PRIX_MIN, `Le prix doit être supérieur ou égal à ${ORDER_ITEM_CONSTRAINTS.PRIX_MIN}`)
    .max(ORDER_ITEM_CONSTRAINTS.PRIX_MAX, `Le prix ne peut pas dépasser ${ORDER_ITEM_CONSTRAINTS.PRIX_MAX}`)
    .refine((val) => {
      // Validate max 2 decimal places
      const decimalPart = val.toString().split('.')[1];
      return !decimalPart || decimalPart.length <= 2;
    }, 'Le prix ne peut avoir que 2 décimales maximum'),
});

/**
 * Schema for creating a new order item
 * Required: commande_id, article_id, taille_id, quantite, prix
 */
export const createOrderItemSchema = orderItemSchema.pick({
  commande_id: true,
  article_id: true,
  taille_id: true,
  quantite: true,
  prix: true,
});

/**
 * Schema for updating an order item
 * Only quantite and prix can be updated
 */
export const updateOrderItemSchema = orderItemSchema
  .pick({
    quantite: true,
    prix: true,
  })
  .partial();

/**
 * Schema for order item ID parameter in routes
 */
export const orderItemIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for querying order items by order
 */
export const orderItemsByOrderParamSchema = z.object({
  commande_id: idStringSchema,
});

/**
 * Schema for querying order items by article
 */
export const orderItemsByArticleParamSchema = z.object({
  article_id: idStringSchema,
});

/**
 * Schema for order item query filters
 */
export const orderItemQuerySchema = z.object({
  commande_id: idStringSchema.optional(),
  article_id: idStringSchema.optional(),
  taille_id: idStringSchema.optional(),
  quantite_min: z.coerce.number().int().positive().optional(),
  quantite_max: z.coerce.number().int().positive().optional(),
  prix_min: z.coerce.number().nonnegative().optional(),
  prix_max: z.coerce.number().nonnegative().optional(),
});

/**
 * Schema for bulk order item operations
 */
export const bulkOrderItemSchema = z.object({
  ids: z.array(idSchema).min(1, 'Au moins un ID est requis'),
});

/**
 * Schema for adding items to an order
 */
export const addOrderItemsSchema = z.object({
  commande_id: idSchema,
  items: z
    .array(
      z.object({
        article_id: idSchema,
        taille_id: idSchema,
        quantite: z.number().int().min(ORDER_ITEM_CONSTRAINTS.QUANTITE_MIN),
        prix: z
          .number()
          .min(ORDER_ITEM_CONSTRAINTS.PRIX_MIN)
          .max(ORDER_ITEM_CONSTRAINTS.PRIX_MAX)
          .refine((val) => {
            const decimalPart = val.toString().split('.')[1];
            return !decimalPart || decimalPart.length <= 2;
          }, 'Le prix ne peut avoir que 2 décimales maximum'),
      })
    )
    .min(1, 'Au moins un article est requis')
    .max(100, 'Maximum 100 articles par commande'),
});

/**
 * Schema for updating order item quantity
 */
export const updateOrderItemQuantitySchema = z.object({
  quantite: z
    .number()
    .int('La quantité doit être un nombre entier')
    .min(ORDER_ITEM_CONSTRAINTS.QUANTITE_MIN, `La quantité doit être supérieure ou égale à ${ORDER_ITEM_CONSTRAINTS.QUANTITE_MIN}`),
});

/**
 * Schema for calculating order item total
 */
export const calculateOrderItemTotalSchema = z.object({
  items: z
    .array(
      z.object({
        quantite: z.number().int().positive(),
        prix: z.number().nonnegative(),
      })
    )
    .min(1, 'Au moins un article est requis'),
});

/**
 * Schema for validating order items before checkout
 */
export const validateOrderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        article_id: idSchema,
        taille_id: idSchema,
        quantite: z.number().int().min(ORDER_ITEM_CONSTRAINTS.QUANTITE_MIN),
      })
    )
    .min(1, 'Au moins un article est requis'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;
export type OrderItemIdParam = z.infer<typeof orderItemIdParamSchema>;
export type OrderItemsByOrderParam = z.infer<typeof orderItemsByOrderParamSchema>;
export type OrderItemsByArticleParam = z.infer<typeof orderItemsByArticleParamSchema>;
export type OrderItemQuery = z.infer<typeof orderItemQuerySchema>;
export type BulkOrderItemInput = z.infer<typeof bulkOrderItemSchema>;
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>;
export type UpdateOrderItemQuantityInput = z.infer<typeof updateOrderItemQuantitySchema>;
export type CalculateOrderItemTotalInput = z.infer<typeof calculateOrderItemTotalSchema>;
export type ValidateOrderItemsInput = z.infer<typeof validateOrderItemsSchema>;
