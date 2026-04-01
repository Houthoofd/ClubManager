/**
 * @file StockMovement Validators
 * @description Zod validators for stock movement history (mouvements_stock)
 */

import { z } from "zod";
import { STOCK_MOVEMENT_CONSTRAINTS } from "../../constants/store.constants.js";
import {
  STOCK_MOVEMENT_TYPES,
  StockMovementType,
} from "../../enums/store.enums.js";
import {
  idSchema,
  idStringSchema,
  timestampSchema,
} from "../common/common.validators.js";

/**
 * Base stock movement schema with all fields from DB
 */
export const stockMovementSchema = z.object({
  id: idSchema,
  article_id: idSchema,
  taille: z
    .string()
    .trim()
    .min(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MIN_LENGTH, "La taille est requise")
    .max(
      STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MAX_LENGTH,
      `La taille ne peut pas dépasser ${STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MAX_LENGTH} caractères`,
    ),
  type_mouvement: z.enum(STOCK_MOVEMENT_TYPES),
  quantite_avant: z
    .number()
    .int("La quantité avant doit être un nombre entier"),
  quantite_apres: z
    .number()
    .int("La quantité après doit être un nombre entier"),
  quantite_mouvement: z
    .number()
    .int("La quantité du mouvement doit être un nombre entier")
    .refine(
      (val) => val !== 0,
      "La quantité du mouvement ne peut pas être zéro",
    ),
  commande_id: z
    .string()
    .max(
      STOCK_MOVEMENT_CONSTRAINTS.COMMANDE_ID_MAX_LENGTH,
      `L'ID de commande ne peut pas dépasser ${STOCK_MOVEMENT_CONSTRAINTS.COMMANDE_ID_MAX_LENGTH} caractères`,
    )
    .nullable()
    .optional(),
  motif: z
    .string()
    .max(
      STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH,
      `Le motif ne peut pas dépasser ${STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH} caractères`,
    )
    .nullable()
    .optional(),
  effectue_par: idSchema.nullable().optional(),
  created_at: timestampSchema,
});

/**
 * Schema for creating a new stock movement
 * Required: article_id, taille, type_mouvement, quantite_avant, quantite_apres, quantite_mouvement
 * Optional: commande_id, motif, effectue_par
 */
export const createStockMovementSchema = stockMovementSchema
  .pick({
    article_id: true,
    taille: true,
    type_mouvement: true,
    quantite_avant: true,
    quantite_apres: true,
    quantite_mouvement: true,
    commande_id: true,
    motif: true,
    effectue_par: true,
  })
  .partial({
    commande_id: true,
    motif: true,
    effectue_par: true,
  });

/**
 * Schema for stock movement ID parameter in routes
 */
export const stockMovementIdParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schema for querying stock movements by article
 */
export const stockMovementsByArticleParamSchema = z.object({
  article_id: idStringSchema,
});

/**
 * Schema for stock movement query filters
 */
export const stockMovementQuerySchema = z.object({
  article_id: idStringSchema.optional(),
  taille: z.string().trim().optional(),
  type_mouvement: z.enum(STOCK_MOVEMENT_TYPES).optional(),
  commande_id: z.string().trim().optional(),
  effectue_par: idStringSchema.optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  quantite_mouvement_min: z.coerce.number().int().optional(),
  quantite_mouvement_max: z.coerce.number().int().optional(),
  sort_by: z
    .enum(["created_at", "quantite_mouvement", "type_mouvement"])
    .optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});

/**
 * Schema for recording a stock adjustment movement
 */
export const recordStockAdjustmentSchema = z.object({
  article_id: idSchema,
  taille: z
    .string()
    .trim()
    .min(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MIN_LENGTH)
    .max(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MAX_LENGTH),
  quantite_avant: z.number().int().nonnegative(),
  quantite_apres: z.number().int().nonnegative(),
  motif: z
    .string()
    .trim()
    .min(1, "Le motif est requis pour un ajustement")
    .max(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH),
  effectue_par: idSchema.optional(),
});

/**
 * Schema for recording an order movement
 */
export const recordOrderMovementSchema = z.object({
  article_id: idSchema,
  taille: z
    .string()
    .trim()
    .min(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MIN_LENGTH)
    .max(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MAX_LENGTH),
  quantite_avant: z.number().int().nonnegative(),
  quantite_apres: z.number().int().nonnegative(),
  commande_id: z
    .string()
    .trim()
    .min(1, "L'ID de commande est requis")
    .max(STOCK_MOVEMENT_CONSTRAINTS.COMMANDE_ID_MAX_LENGTH),
  effectue_par: idSchema.optional(),
});

/**
 * Schema for recording a delivery movement
 */
export const recordDeliveryMovementSchema = z.object({
  article_id: idSchema,
  taille: z
    .string()
    .trim()
    .min(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MIN_LENGTH)
    .max(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MAX_LENGTH),
  quantite_avant: z.number().int().nonnegative(),
  quantite_apres: z.number().int().nonnegative(),
  motif: z
    .string()
    .trim()
    .max(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH)
    .optional(),
  effectue_par: idSchema.optional(),
});

/**
 * Schema for recording an inventory movement
 */
export const recordInventoryMovementSchema = z.object({
  article_id: idSchema,
  taille: z
    .string()
    .trim()
    .min(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MIN_LENGTH)
    .max(STOCK_MOVEMENT_CONSTRAINTS.TAILLE_MAX_LENGTH),
  quantite_avant: z.number().int().nonnegative(),
  quantite_apres: z.number().int().nonnegative(),
  motif: z
    .string()
    .trim()
    .min(1, "Le motif est requis pour un inventaire")
    .max(STOCK_MOVEMENT_CONSTRAINTS.MOTIF_MAX_LENGTH),
  effectue_par: idSchema,
});

/**
 * Schema for stock movement statistics query
 */
export const stockMovementStatsQuerySchema = z.object({
  article_id: idStringSchema.optional(),
  type_mouvement: z.enum(STOCK_MOVEMENT_TYPES).optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  effectue_par: idStringSchema.optional(),
});

/**
 * Schema for bulk stock movements (for reporting)
 */
export const bulkStockMovementQuerySchema = z.object({
  article_ids: z.array(idSchema).optional(),
  type_mouvements: z.array(z.enum(STOCK_MOVEMENT_TYPES)).optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StockMovement = z.infer<typeof stockMovementSchema>;
export type CreateStockMovementInput = z.infer<
  typeof createStockMovementSchema
>;
export type StockMovementIdParam = z.infer<typeof stockMovementIdParamSchema>;
export type StockMovementsByArticleParam = z.infer<
  typeof stockMovementsByArticleParamSchema
>;
export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>;
export type RecordStockAdjustmentInput = z.infer<
  typeof recordStockAdjustmentSchema
>;
export type RecordOrderMovementInput = z.infer<
  typeof recordOrderMovementSchema
>;
export type RecordDeliveryMovementInput = z.infer<
  typeof recordDeliveryMovementSchema
>;
export type RecordInventoryMovementInput = z.infer<
  typeof recordInventoryMovementSchema
>;
export type StockMovementStatsQuery = z.infer<
  typeof stockMovementStatsQuerySchema
>;
export type BulkStockMovementQuery = z.infer<
  typeof bulkStockMovementQuerySchema
>;
