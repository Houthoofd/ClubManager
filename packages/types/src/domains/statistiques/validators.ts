/**
 * Schémas de validation pour le module statistiques
 *
 * Utilise Zod pour valider les paramètres des requêtes
 * et garantir la sécurité et cohérence des données.
 *
 * @module statistiques.schema
 */

import { z } from "zod";

/**
 * Schéma de validation pour l'ID utilisateur (REST - string param)
 */
export const utilisateurIdSchema = z.object({
  utilisateurId: z
    .string()
    .regex(/^\d+$/, "ID utilisateur doit être un nombre")
    .transform(Number)
    .refine((val) => val > 0, "ID utilisateur doit être positif"),
});

/**
 * Schéma de validation pour userId (alias - REST - string param)
 */
export const userIdSchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, "ID utilisateur doit être un nombre")
    .transform(Number)
    .refine((val) => val > 0, "ID utilisateur doit être positif"),
});

/**
 * Schéma de validation pour l'ID utilisateur (GraphQL - number)
 */
export const utilisateurIdGraphQLSchema = z.object({
  utilisateurId: z
    .number({
      required_error: "L'ID utilisateur est requis",
      invalid_type_error: "L'ID doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),
});

/**
 * Schéma de validation pour userId (GraphQL - number)
 */
export const userIdGraphQLSchema = z.object({
  userId: z
    .number({
      required_error: "L'ID utilisateur est requis",
      invalid_type_error: "L'ID doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),
});

/**
 * Schéma pour les statistiques de fréquentation
 * GET /statistiques/frequentation/:utilisateurId
 */
export const getFrequentationSchema = z.object({
  params: utilisateurIdSchema,
});

/**
 * Schéma pour les statistiques de progression
 * GET /statistiques/progression/:userId
 */
export const getProgressionSchema = z.object({
  params: userIdSchema,
});

/**
 * Schéma pour les statistiques de présence
 * GET /statistiques/presence/:userId
 */
export const getPresenceSchema = z.object({
  params: userIdSchema,
});

/**
 * Schéma pour les statistiques de présence brutes
 * GET /statistiques/presence-raw/:userId
 */
export const getPresenceRawSchema = z.object({
  params: userIdSchema,
});

/**
 * Schéma vide pour les routes sans paramètres
 * Utilisé pour les endpoints de statistiques globales
 */
export const emptyParamsSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * Schéma pour les query parameters de pagination (pour usage futur)
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page doit être un nombre")
    .transform(Number)
    .refine((val) => val > 0, "Page doit être supérieure à 0")
    .optional()
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit doit être un nombre")
    .transform(Number)
    .refine((val) => val > 0 && val <= 100, "Limit doit être entre 1 et 100")
    .optional()
    .default("10"),
});

/**
 * Schéma pour les filtres de date (pour usage futur)
 */
export const dateRangeSchema = z.object({
  dateDebut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date doit être au format YYYY-MM-DD")
    .optional(),
  dateFin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date doit être au format YYYY-MM-DD")
    .optional(),
});

/**
 * Schéma simple pour valider un ID utilisateur (nombre uniquement)
 * Pour les tests unitaires de validation
 */
export const simpleUtilisateurIdSchema = z
  .number()
  .int("L'ID utilisateur doit être un nombre entier")
  .positive("L'ID utilisateur doit être positif");

/**
 * Schéma pour valider le nombre de jours d'historique
 * Min: 1 jour, Max: 365 jours, Défaut: 30 jours
 */
export const joursHistoriqueSchema = z
  .number()
  .int("Doit être un nombre entier")
  .min(1, "Le nombre de jours doit être au moins 1")
  .max(365, "Le nombre de jours ne peut pas dépasser 365")
  .default(30);

/**
 * Schéma pour valider le nombre de mois d'historique
 * Min: 1 mois, Max: 36 mois, Défaut: 12 mois
 */
export const moisHistoriqueSchema = z
  .number()
  .int("Doit être un nombre entier")
  .min(1, "Le nombre de mois doit être au moins 1")
  .max(36, "Le nombre de mois ne peut pas dépasser 36")
  .default(12);

/**
 * Schéma pour valider une période avec dates de début et fin
 * dateDebut doit être avant ou égale à dateFin
 */
export const periodeSchema = z
  .object({
    dateDebut: z.date().optional(),
    dateFin: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.dateDebut && data.dateFin) {
        return data.dateDebut <= data.dateFin;
      }
      return true;
    },
    {
      message:
        "La date de début doit être antérieure ou égale à la date de fin",
    },
  );

// Types TypeScript extraits des schémas Zod
export type UtilisateurIdData = z.infer<typeof utilisateurIdSchema>;
export type UserIdData = z.infer<typeof userIdSchema>;
export type UtilisateurIdGraphQLData = z.infer<
  typeof utilisateurIdGraphQLSchema
>;
export type UserIdGraphQLData = z.infer<typeof userIdGraphQLSchema>;
export type GetFrequentationData = z.infer<typeof getFrequentationSchema>;
export type GetProgressionData = z.infer<typeof getProgressionSchema>;
export type GetPresenceData = z.infer<typeof getPresenceSchema>;
export type GetPresenceRawData = z.infer<typeof getPresenceRawSchema>;
export type EmptyParamsData = z.infer<typeof emptyParamsSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type DateRangeData = z.infer<typeof dateRangeSchema>;
export type JoursHistoriqueData = z.infer<typeof joursHistoriqueSchema>;
export type MoisHistoriqueData = z.infer<typeof moisHistoriqueSchema>;
export type PeriodeData = z.infer<typeof periodeSchema>;
