/**
 * Schémas de validation Zod pour le module Stocks
 * Validation des données de stock
 */

import { z } from "zod";

/**
 * Schéma pour un stock de base
 */
export const stockSchema = z.object({
  id: z.number().int().positive().optional(),
  article_id: z.number().int().positive("L'ID de l'article doit être positif"),
  quantite: z
    .number()
    .int()
    .nonnegative("La quantité ne peut pas être négative"),
  article_nom: z.string().optional(),
  article_prix: z.number().nonnegative().optional(),
  article_description: z.string().optional(),
});

/**
 * Schéma pour la mise à jour d'un stock
 */
export const stockUpdateSchema = z.object({
  article_id: z.number().int().positive("L'ID de l'article doit être positif"),
  quantite: z.number().int("La quantité doit être un nombre entier"),
  operation: z.enum(["set", "add", "subtract"]).default("set"),
});

/**
 * Schéma pour les paramètres d'alerte
 */
export const alerteParamsSchema = z.object({
  seuil: z.number().int().nonnegative().default(5),
});

/**
 * Schéma pour l'ID d'article
 */
export const articleIdParamSchema = z.object({
  articleId: z.string().transform((val, ctx) => {
    // Vérifier si c'est un entier valide (pas de décimales, notation scientifique, etc.)
    if (!/^\s*-?\d+\s*$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'ID de l'article doit être un nombre entier valide",
      });
      return z.NEVER;
    }

    // La regex garantit que parseInt réussira, donc pas besoin de vérifier isNaN
    const parsed = parseInt(val, 10);

    if (parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'ID de l'article doit être positif",
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

/**
 * Schéma pour le health check
 */
export const stocksHealthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  checks: z.object({
    stocks: z.boolean(),
    alertes: z.boolean(),
  }),
  message: z.string().min(1, "Le message ne peut pas être vide"),
});

/**
 * Schéma pour un tableau de stocks
 */
export const stocksArraySchema = z.array(stockSchema);

/**
 * Type exports pour TypeScript
 */
export type Stock = z.infer<typeof stockSchema>;
export type StockUpdate = z.infer<typeof stockUpdateSchema>;
export type AlerteParams = z.infer<typeof alerteParamsSchema>;
export type ArticleIdParam = z.infer<typeof articleIdParamSchema>;
export type HealthCheck = z.infer<typeof stocksHealthCheckSchema>;
