/**
 * Validators Zod pour le module Informations
 * Validation des données de référence (grades, genres, status, abonnements)
 */

import { z } from "zod";

/**
 * Schema pour la validation d'une réponse de référence générique
 */
export const referenceItemSchema = z.object({
  id: z.number().int().positive({
    message: "L'ID doit être un nombre entier positif",
  }),
  nom: z.string().min(1, {
    message: "Le nom ne peut pas être vide",
  }),
});

/**
 * Schema pour la validation d'un grade
 */
export const gradeSchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().trim().min(1).max(50),
  ordre: z.number().int().nonnegative().optional(),
});

/**
 * Schema pour la validation d'un genre
 */
export const genreSchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().trim().min(1).max(20),
});

/**
 * Schema pour la validation d'un statut
 */
export const statusSchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().trim().min(1).max(50),
});

/**
 * Schema pour la validation d'un plan tarifaire
 */
export const planTarifaireSchema = z.object({
  id: z.number().int().positive(),
  nom_plan: z.string().trim().min(1).max(100),
  prix: z.number().nonnegative().finite({
    message: "Le prix doit être un nombre positif",
  }),
  duree_mois: z.number().int().positive({
    message: "La durée doit être un nombre entier positif",
  }),
  description: z.string().max(500).optional(),
});

/**
 * Schema pour la validation de toutes les références
 */
export const allReferencesSchema = z.object({
  grades: z.array(gradeSchema),
  genres: z.array(genreSchema),
  status: z.array(statusSchema),
  abonnements: z.array(planTarifaireSchema),
});

/**
 * Schema pour la validation du health check
 */
export const healthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  checks: z.object({
    grades: z.boolean(),
    genres: z.boolean(),
    status: z.boolean(),
    abonnements: z.boolean(),
  }),
  message: z.string(),
  timestamp: z.string().datetime().optional(),
});

/**
 * Types dérivés des schémas
 */
export type ReferenceItem = z.infer<typeof referenceItemSchema>;
export type Grade = z.infer<typeof gradeSchema>;
export type Genre = z.infer<typeof genreSchema>;
export type Status = z.infer<typeof statusSchema>;
export type PlanTarifaire = z.infer<typeof planTarifaireSchema>;
export type AllReferences = z.infer<typeof allReferencesSchema>;
export type HealthCheck = z.infer<typeof healthCheckSchema>;
