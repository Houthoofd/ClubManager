import { z } from "zod";

/**
 * Enum pour les types d'alertes
 */
export const AlerteTypeEnum = z.enum([
  "stock_bas",
  "paiement_echoue",
  "utilisateur_inactif",
  "echeance_approche",
  "activite_suspecte",
  "erreur_systeme",
  "autre",
]);

/**
 * Enum pour la sévérité des alertes
 */
export const AlerteSeveriteEnum = z.enum([
  "info",
  "warning",
  "error",
  "critical",
]);

/**
 * Enum pour le statut des alertes
 */
export const AlerteStatutEnum = z.enum([
  "en_attente",
  "en_cours",
  "resolue",
  "ignoree",
]);

/**
 * Schéma de validation pour l'ID d'une alerte
 */
export const alerteIdSchema = z.object({
  alerteId: z
    .number({
      required_error: "L'ID de l'alerte est requis",
      invalid_type_error: "L'ID de l'alerte doit être un nombre",
    })
    .int("L'ID de l'alerte doit être un entier")
    .positive("L'ID de l'alerte doit être positif"),
});

/**
 * Schéma de validation pour l'ID d'un utilisateur
 */
export const userIdAlerteSchema = z.object({
  userId: z
    .number({
      required_error: "L'ID utilisateur est requis",
      invalid_type_error: "L'ID utilisateur doit être un nombre",
    })
    .int("L'ID utilisateur doit être un entier")
    .positive("L'ID utilisateur doit être positif"),
});

/**
 * Schéma de validation pour résoudre une alerte
 */
export const resoudreAlerteSchema = z.object({
  alerteId: z
    .number({
      required_error: "L'ID de l'alerte est requis",
      invalid_type_error: "L'ID de l'alerte doit être un nombre",
    })
    .int("L'ID de l'alerte doit être un entier")
    .positive("L'ID de l'alerte doit être positif"),
  notes: z
    .string()
    .max(1000, "Les notes ne peuvent pas dépasser 1000 caractères")
    .optional()
    .default(""),
});

/**
 * Schéma de validation pour ignorer une alerte
 */
export const ignorerAlerteSchema = z.object({
  alerteId: z
    .number({
      required_error: "L'ID de l'alerte est requis",
      invalid_type_error: "L'ID de l'alerte doit être un nombre",
    })
    .int("L'ID de l'alerte doit être un entier")
    .positive("L'ID de l'alerte doit être positif"),
  notes: z
    .string()
    .max(1000, "Les notes ne peuvent pas dépasser 1000 caractères")
    .optional()
    .default(""),
});

/**
 * Schéma de validation pour obtenir une alerte par ID
 */
export const obtenirAlerteSchema = z.object({
  id: z
    .number({
      required_error: "L'ID de l'alerte est requis",
      invalid_type_error: "L'ID de l'alerte doit être un nombre",
    })
    .int("L'ID de l'alerte doit être un entier")
    .positive("L'ID de l'alerte doit être positif"),
});

/**
 * Schéma de validation pour obtenir les alertes d'un utilisateur
 */
export const obtenirAlertesUtilisateurSchema = z.object({
  userId: z
    .number({
      required_error: "L'ID utilisateur est requis",
      invalid_type_error: "L'ID utilisateur doit être un nombre",
    })
    .int("L'ID utilisateur doit être un entier")
    .positive("L'ID utilisateur doit être positif"),
});

/**
 * Schema complet pour une alerte
 */
export const alerteSchema = z.object({
  id: z.number().int().positive(),
  type: AlerteTypeEnum,
  severite: AlerteSeveriteEnum,
  message: z.string().min(1).max(500),
  utilisateur_id: z.number().int().positive().optional(),
  statut: AlerteStatutEnum,
  date_detection: z.date().or(z.string()),
  date_resolution: z.date().or(z.string()).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

/**
 * Schéma de validation pour créer une alerte (admin uniquement)
 */
export const creerAlerteSchema = z.object({
  type: AlerteTypeEnum,
  severite: AlerteSeveriteEnum,
  message: z
    .string()
    .min(1, "Le message est requis")
    .max(500, "Le message ne peut pas dépasser 500 caractères"),
  utilisateur_id: z.number().int().positive().optional(),
});

/**
 * Schéma de validation pour mettre à jour une alerte
 */
export const mettreAJourAlerteSchema = z.object({
  alerteId: z.number().int().positive(),
  statut: AlerteStatutEnum.optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Schéma de validation pour filtrer les alertes
 */
export const filtrerAlertesSchema = z.object({
  type: AlerteTypeEnum.optional(),
  severite: AlerteSeveriteEnum.optional(),
  statut: AlerteStatutEnum.optional(),
  utilisateur_id: z.number().int().positive().optional(),
  dateDebut: z.date().or(z.string()).optional(),
  dateFin: z.date().or(z.string()).optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Types TypeScript générés à partir des schémas Zod
 */
export type AlerteIdInput = z.infer<typeof alerteIdSchema>;
export type UserIdAlerteInput = z.infer<typeof userIdAlerteSchema>;
export type ResoudreAlerteInput = z.infer<typeof resoudreAlerteSchema>;
export type IgnorerAlerteInput = z.infer<typeof ignorerAlerteSchema>;
export type ObtenirAlerteInput = z.infer<typeof obtenirAlerteSchema>;
export type ObtenirAlertesUtilisateurInput = z.infer<
  typeof obtenirAlertesUtilisateurSchema
>;
export type AlerteData = z.infer<typeof alerteSchema>;
export type CreerAlerteInput = z.infer<typeof creerAlerteSchema>;
export type MettreAJourAlerteInput = z.infer<typeof mettreAJourAlerteSchema>;
export type FiltrerAlertesInput = z.infer<typeof filtrerAlertesSchema>;
export type AlerteType = z.infer<typeof AlerteTypeEnum>;
export type AlerteSeverite = z.infer<typeof AlerteSeveriteEnum>;
export type AlerteStatut = z.infer<typeof AlerteStatutEnum>;
