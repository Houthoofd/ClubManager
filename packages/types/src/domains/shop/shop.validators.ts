import { z } from 'zod';

/**
 * product_categories
 */
export const productCategoriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  parent_id: z.number().nullable().optional(), // Pour créer une arborescence de catégories
  display_order: z.number().nullable().optional(),
});

export const productCategoriesCreateSchema = productCategoriesSchema.omit({ id: true });

export const productCategoriesUpdateSchema = productCategoriesSchema.partial().omit({ id: true });


/**
 * products
 */
export const productsSchema = z.object({
  id: z.number(),
  category_id: z.number().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  stock_quantity: z.number().nullable().optional(), // NULL si service/produit dématérialisé
  sku: z.string().nullable().optional(), // Référence produit
  image_url: z.string().nullable().optional(),
  is_physical: z.boolean().nullable().optional(), // 1=produit physique, 0=service/produit virtuel
  active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const productsCreateSchema = productsSchema.omit({ id: true, created_at: true, updated_at: true });

export const productsUpdateSchema = productsSchema.partial().omit({ id: true });


/**
 * orders
 */
export const ordersSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  order_number: z.string(), // Numéro de commande unique
  total_amount: z.number(),
  status: z.enum(["pending", "processing", "completed", "cancelled", "refunded"]).nullable().optional(),
  payment_status: z.enum(["unpaid", "partial", "paid", "refunded"]).nullable().optional(),
  delivery_address: z.string().nullable().optional(), // Adresse de livraison si différente
  delivery_method: z.enum(["pickup", "delivery", "digital"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const ordersCreateSchema = ordersSchema.omit({ id: true, created_at: true, updated_at: true });

export const ordersUpdateSchema = ordersSchema.partial().omit({ id: true });


/**
 * order_items
 */
export const orderItemsSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().optional(),
  unit_price: z.number(),
  total_price: z.number(),
  notes: z.string().nullable().optional(), // Notes spécifiques à cet article
});

export const orderItemsCreateSchema = orderItemsSchema.omit({ id: true });

export const orderItemsUpdateSchema = orderItemsSchema.partial().omit({ id: true });


