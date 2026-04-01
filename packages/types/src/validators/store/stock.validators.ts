/**
 * @file Stock Validators
 * @description Zod validators for article stock management (stocks by article and size)
 */

import { z } from "zod";
import { STOCK_CONSTRAINTS } from "../../constants/store.constants.js";
import {
  idSchema,
  idStringSchema,
  timestampSchema,
} from "../common/common.validators.js";

/**
 * Base stock schema with all fields from DB
 */
export const stockSchema = z.object({
  id: idSchema,
  article_id: idSchema,
  taille_id: idSchema,
  quantite: z
    .number()
    .int("La quantité doit être un nombre entier")
    .min(
      STOCK_CONSTRAINTS.QUANTITE_MIN,
      `La quantité doit être supérieure ou égale à ${STOCK_CONSTRAINTS.QUANTITE_MIN}`,
    ),
  quantite_minimum: z
    .number()
    .int("La quantité minimum doit être un nombre entier")
    .min(
      STOCK_CONSTRAINTS.QUANTITE_MINIMUM_MIN,
      `La quantité minimum doit être supérieure ou égale à ${STOCK_CONSTRAINTS.QUANTITE_MINIMUM_MIN}`,
    )
    .default(STOCK_CONSTRAINTS.QUANTITE_MINIMUM_DEFAULT),
  updated_at: timestampSchema.nullable().optional(),
});

/**
 * Schema for creating a new stock entry
 * Required: article_id, taille_id, quantite
 * Optional: quantite_minimum
 */
export const createStockSchema = z.object({
  article_id: idSchema,
  taille_id: idSchema,
  quantite: z
    .number()
    .int("La quantité doit être un nombre entier")
    .min(
      STOCK_CONSTRAINTS.QUANTITE_MIN,
      `La quantité doit être supérieure ou égale à ${STOCK_CONSTRAINTS.QUANTITE_MIN}`,
    ),
  quantite_minimum: z
    .number()
    .int("La quantité minimum doit être un nombre entier")
    .min(
      STOCK_CONSTRAINTS.QUANTITE_MINIMUM_MIN,
      `La quantité minimum doit être supérieure ou égale à ${STOCK_CONSTRAINTS.QUANTITE_MINIMUM_MIN}`,
    )
    .default(STOCK_CONSTRAINTS.QUANTITE_MINIMUM_DEFAULT)
    .optional(),
});

/**
 * Schema for updating a stock entry
 * All fields optional
 */
export const updateStockSchema = stockSchema
  .pick({
    quantite: true,
    quantite_minimum: true,
  })
  .partial();

/**
 * Schema for stock ID parameter in routes
 */
export const stockIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for querying stocks by article
 */
export const stocksByArticleParamSchema = z.object({
  article_id: idStringSchema,
});

/**
 * Schema for querying stocks by size
 */
export const stocksBySizeParamSchema = z.object({
  taille_id: idStringSchema,
});

/**
 * Schema for stock query filters
 */
export const stockQuerySchema = z.object({
  article_id: idStringSchema.optional(),
  taille_id: idStringSchema.optional(),
  low_stock: z
    .enum(["true", "false", "1", "0"])
    .transform((val) => val === "true" || val === "1")
    .optional(),
  out_of_stock: z
    .enum(["true", "false", "1", "0"])
    .transform((val) => val === "true" || val === "1")
    .optional(),
  quantite_min: z.coerce.number().int().nonnegative().optional(),
  quantite_max: z.coerce.number().int().nonnegative().optional(),
});

/**
 * Schema for adjusting stock quantity (add/remove)
 */
export const adjustStockSchema = z.object({
  quantite: z
    .number()
    .int("La quantité doit être un nombre entier")
    .refine((val) => val !== 0, "La quantité ne peut pas être zéro"),
  motif: z.string().min(1, "Le motif est requis").max(65535).trim().optional(),
});

/**
 * Schema for setting stock quantity (absolute value)
 */
export const setStockQuantitySchema = z.object({
  quantite: z
    .number()
    .int("La quantité doit être un nombre entier")
    .min(STOCK_CONSTRAINTS.QUANTITE_MIN),
  motif: z.string().min(1, "Le motif est requis").max(65535).trim().optional(),
});

/**
 * Schema for bulk stock operations
 */
export const bulkStockSchema = z.object({
  ids: z.array(idSchema).min(1, "Au moins un ID est requis"),
});

/**
 * Schema for bulk stock update
 */
export const bulkUpdateStockSchema = z.object({
  stocks: z
    .array(
      z.object({
        id: idSchema,
        quantite: z
          .number()
          .int()
          .min(STOCK_CONSTRAINTS.QUANTITE_MIN)
          .optional(),
        quantite_minimum: z
          .number()
          .int()
          .min(STOCK_CONSTRAINTS.QUANTITE_MINIMUM_MIN)
          .optional(),
      }),
    )
    .min(1, "Au moins un stock est requis"),
});

/**
 * Schema for checking stock availability for an article/size
 */
export const checkStockAvailabilitySchema = z.object({
  article_id: idSchema,
  taille_id: idSchema,
  quantite_demandee: z
    .number()
    .int()
    .positive("La quantité demandée doit être positive"),
});

/**
 * Schema for bulk stock adjustment (replenishment)
 */
export const bulkAdjustStockSchema = z.object({
  adjustments: z
    .array(
      z.object({
        article_id: idSchema,
        taille_id: idSchema,
        quantite: z
          .number()
          .int()
          .refine((val) => val !== 0, "La quantité ne peut pas être zéro"),
      }),
    )
    .min(1, "Au moins un ajustement est requis"),
  motif: z.string().min(1, "Le motif est requis").max(65535).trim(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Stock = z.infer<typeof stockSchema>;
export type CreateStockInput = z.infer<typeof createStockSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type StockIdParam = z.infer<typeof stockIdParamSchema>;
export type StocksByArticleParam = z.infer<typeof stocksByArticleParamSchema>;
export type StocksBySizeParam = z.infer<typeof stocksBySizeParamSchema>;
export type StockQuery = z.infer<typeof stockQuerySchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type SetStockQuantityInput = z.infer<typeof setStockQuantitySchema>;
export type BulkStockInput = z.infer<typeof bulkStockSchema>;
export type BulkUpdateStockInput = z.infer<typeof bulkUpdateStockSchema>;
export type CheckStockAvailabilityInput = z.infer<
  typeof checkStockAvailabilitySchema
>;
export type BulkAdjustStockInput = z.infer<typeof bulkAdjustStockSchema>;
