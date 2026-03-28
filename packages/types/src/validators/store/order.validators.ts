/**
 * @file Order Validators
 * @description Zod validators for orders (commandes)
 */

import { z } from 'zod';
import { ORDER_CONSTRAINTS } from '../../constants/store.constants.js';
import { ORDER_STATUSES, OrderStatus } from '../../enums/store.enums.js';
import { idSchema, idStringSchema, timestampSchema } from '../common/common.validators.js';

/**
 * Base order schema with all fields from DB
 */
export const orderSchema = z.object({
  id: idSchema,
  unique_id: z
    .string()
    .max(
      ORDER_CONSTRAINTS.UNIQUE_ID_MAX_LENGTH,
      `L'ID unique ne peut pas dépasser ${ORDER_CONSTRAINTS.UNIQUE_ID_MAX_LENGTH} caractères`
    )
    .nullable()
    .optional(),
  numero_commande: z
    .string()
    .max(
      ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH,
      `Le numéro de commande ne peut pas dépasser ${ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH} caractères`
    )
    .nullable()
    .optional(),
  utilisateur_id: idSchema,
  total: z
    .number()
    .min(ORDER_CONSTRAINTS.TOTAL_MIN, `Le total doit être supérieur ou égal à ${ORDER_CONSTRAINTS.TOTAL_MIN}`)
    .max(ORDER_CONSTRAINTS.TOTAL_MAX, `Le total ne peut pas dépasser ${ORDER_CONSTRAINTS.TOTAL_MAX}`)
    .refine((val) => {
      // Validate max 2 decimal places
      const decimalPart = val.toString().split('.')[1];
      return !decimalPart || decimalPart.length <= 2;
    }, 'Le total ne peut avoir que 2 décimales maximum')
    .default(0),
  date_commande: timestampSchema.default(() => new Date()),
  statut: z.enum(ORDER_STATUSES).default(OrderStatus.PENDING),
  ip_address: z
    .string()
    .max(
      ORDER_CONSTRAINTS.IP_ADDRESS_MAX_LENGTH,
      `L'adresse IP ne peut pas dépasser ${ORDER_CONSTRAINTS.IP_ADDRESS_MAX_LENGTH} caractères`
    )
    .ip({ version: 'v4' })
    .or(z.string().ip({ version: 'v6' }))
    .nullable()
    .optional(),
  user_agent: z
    .string()
    .max(
      ORDER_CONSTRAINTS.USER_AGENT_MAX_LENGTH,
      `Le user agent ne peut pas dépasser ${ORDER_CONSTRAINTS.USER_AGENT_MAX_LENGTH} caractères`
    )
    .nullable()
    .optional(),
  created_at: timestampSchema,
  updated_at: timestampSchema.nullable().optional(),
});

/**
 * Schema for creating a new order
 * Required: utilisateur_id
 * Optional: unique_id, numero_commande, total, statut, ip_address, user_agent
 */
export const createOrderSchema = orderSchema
  .pick({
    unique_id: true,
    numero_commande: true,
    utilisateur_id: true,
    total: true,
    date_commande: true,
    statut: true,
    ip_address: true,
    user_agent: true,
  })
  .partial({
    unique_id: true,
    numero_commande: true,
    total: true,
    date_commande: true,
    statut: true,
    ip_address: true,
    user_agent: true,
  });

/**
 * Schema for updating an order
 * All fields optional except utilisateur_id (should not change)
 */
export const updateOrderSchema = orderSchema
  .pick({
    unique_id: true,
    numero_commande: true,
    total: true,
    statut: true,
  })
  .partial();

/**
 * Schema for order ID parameter in routes
 */
export const orderIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for order unique_id parameter
 */
export const orderUniqueIdParamSchema = z.object({
  unique_id: z.string().min(1).trim(),
});

/**
 * Schema for order query filters
 */
export const orderQuerySchema = z.object({
  utilisateur_id: idStringSchema.optional(),
  statut: z.enum(ORDER_STATUSES).optional(),
  numero_commande: z.string().trim().optional(),
  date_min: z.coerce.date().optional(),
  date_max: z.coerce.date().optional(),
  total_min: z.coerce.number().nonnegative().optional(),
  total_max: z.coerce.number().nonnegative().optional(),
  sort_by: z.enum(['date_commande', 'total', 'statut', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Schema for updating order status
 */
export const updateOrderStatusSchema = z.object({
  statut: z.enum(ORDER_STATUSES),
});

/**
 * Schema for bulk order operations
 */
export const bulkOrderSchema = z.object({
  ids: z.array(idSchema).min(1, 'Au moins un ID est requis'),
});

/**
 * Schema for bulk update order status
 */
export const bulkUpdateOrderStatusSchema = z.object({
  order_ids: z.array(idSchema).min(1, 'Au moins une commande est requise'),
  statut: z.enum(ORDER_STATUSES),
});

/**
 * Schema for cancelling an order
 */
export const cancelOrderSchema = z.object({
  motif: z.string().min(1, 'Le motif est requis').max(1000, 'Le motif ne peut pas dépasser 1000 caractères').trim(),
});

/**
 * Schema for order statistics query
 */
export const orderStatsQuerySchema = z.object({
  utilisateur_id: idStringSchema.optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  statut: z.enum(ORDER_STATUSES).optional(),
});

/**
 * Schema for validating order number format
 */
export const validateOrderNumberSchema = z.object({
  numero_commande: z
    .string()
    .min(1)
    .max(ORDER_CONSTRAINTS.NUMERO_COMMANDE_MAX_LENGTH)
    .regex(/^[A-Z0-9-]+$/, 'Le numéro de commande doit contenir uniquement des lettres majuscules, chiffres et tirets')
    .trim(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Order = z.infer<typeof orderSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type OrderUniqueIdParam = z.infer<typeof orderUniqueIdParamSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type BulkOrderInput = z.infer<typeof bulkOrderSchema>;
export type BulkUpdateOrderStatusInput = z.infer<typeof bulkUpdateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderStatsQuery = z.infer<typeof orderStatsQuerySchema>;
export type ValidateOrderNumberInput = z.infer<typeof validateOrderNumberSchema>;
