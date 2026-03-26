/**
 * Validators Zod pour les plans tarifaires
 * Schémas basés sur les DTOs et contraintes DB
 */

import { z } from "zod";
import { VALIDATION_CONSTANTS } from "../../constants/validation.constants.js";
import {
  booleanSchema,
  idSchema,
  paginationSchema,
  searchQuerySchema,
  sortOrderSchema,
} from "../common/common.validators.js";

/**
 * Schéma pour un montant positif (DECIMAL)
 */
const positiveAmountSchema = z
  .number({
    required_error: "Le prix est requis",
    invalid_type_error: "Le prix doit être un nombre",
  })
  .positive("Le prix doit être strictement positif")
  .multipleOf(0.01, "Le prix ne peut avoir que 2 décimales maximum");

/**
 * Schéma pour la durée en mois
 */
const durationMonthsSchema = z
  .number({
    required_error: "La durée en mois est requise",
    invalid_type_error: "La durée doit être un nombre",
  })
  .int("La durée doit être un nombre entier")
  .positive("La durée doit être strictement positive")
  .min(1, "La durée doit être d'au moins 1 mois")
  .max(60, "La durée ne peut pas dépasser 60 mois");

/**
 * Schéma pour créer un plan tarifaire
 * Correspond à CreatePricingPlanDto
 */
export const createPricingPlanSchema = z.object({
  nom: z
    .string({
      required_error: "Le nom est requis",
      invalid_type_error: "Le nom doit être une chaîne de caractères",
    })
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  description: z
    .string()
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .optional(),
  prix: positiveAmountSchema,
  duree_mois: durationMonthsSchema,
  actif: z.boolean().default(true).optional(),
});

/**
 * Schéma pour mettre à jour un plan tarifaire (partiel)
 */
export const updatePricingPlanSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .optional(),
  prix: positiveAmountSchema.optional(),
  duree_mois: durationMonthsSchema.optional(),
  actif: z.boolean().optional(),
});

/**
 * Schéma pour rechercher/filtrer des plans tarifaires
 */
export const searchPricingPlanSchema = z
  .object({
    actif: booleanSchema.optional(),
    prix_min: z
      .number()
      .positive("Le prix minimum doit être positif")
      .optional(),
    prix_max: z
      .number()
      .positive("Le prix maximum doit être positif")
      .optional(),
    duree_mois: durationMonthsSchema.optional(),
    nom: searchQuerySchema,
    search: searchQuerySchema,
    sort_by: z
      .enum(["nom", "prix", "duree_mois", "ordre", "created_at"])
      .default("ordre")
      .optional(),
    sort_order: sortOrderSchema.default("asc").optional(),
  })
  .merge(paginationSchema)
  .refine(
    (data) => {
      // Vérifier que prix_max >= prix_min
      if (data.prix_min !== undefined && data.prix_max !== undefined) {
        return data.prix_max >= data.prix_min;
      }
      return true;
    },
    {
      message:
        "Le prix maximum doit être supérieur ou égal au prix minimum",
      path: ["prix_max"],
    },
  );

/**
 * Schéma pour activer/désactiver un plan tarifaire
 */
export const togglePricingPlanSchema = z.object({
  id: idSchema,
  actif: z.boolean({
    required_error: "Le statut actif est requis",
    invalid_type_error: "Le statut actif doit être un boolean",
  }),
});

/**
 * Types inférés
 */
export type CreatePricingPlanInput = z.infer<typeof createPricingPlanSchema>;
export type UpdatePricingPlanInput = z.infer<typeof updatePricingPlanSchema>;
export type SearchPricingPlanInput = z.infer<typeof searchPricingPlanSchema>;
export type TogglePricingPlanInput = z.infer<typeof togglePricingPlanSchema>;
