/**
 * Validators Zod pour le module Cours
 * ✅ Centralisés dans @clubmanager/types
 *
 * @package @clubmanager/types
 */

import { z } from "zod";

// ============================================
// SCHEMAS DE DONNÉES (depuis types.ts)
// ============================================

/**
 * Schema pour les données de base d'un cours
 */
export const coursdataSchema = z.object({
  id: z.number().positive("L'ID du cours doit être un nombre positif"),
  date_cours: z.string().min(1, "La date du cours doit être requis"),
  type_cours: z.string().min(1, "Le type de cours doit être requis"),
  heure_debut: z.string().min(1, "L'heure de début du cours doit être requis"),
  heure_fin: z.string().min(1, "L'heure de fin du cours doit être requis"),
});

/**
 * Schema pour les données de réservation
 */
export const datareservationSchema = z.object({
  cours_id: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z
      .number({
        required_error: "cours_id est requis",
        invalid_type_error: "cours_id doit être un nombre",
      })
      .positive("L'ID du cours doit être un nombre positif"),
  ),
  utilisateur_nom: z
    .string({
      required_error: "Le nom de l'utilisateur est requis",
      invalid_type_error:
        "Le nom de l'utilisateur doit être une chaîne de caractères",
    })
    .min(1, "Le nom de l'utilisateur est requis"),
  utilisateur_prenom: z
    .string({
      required_error: "Le prenom de l'utilisateur est requis",
      invalid_type_error:
        "Le prenom de l'utilisateur doit être une chaîne de caractères",
    })
    .min(1, "Le prenom de l'utilisateur est requis"),
});

/**
 * Schema pour les données d'annulation
 */
export const datannulationSchema = z.object({
  cours_id: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z
      .number({
        required_error: "cours_id est requis",
        invalid_type_error: "cours_id doit être un nombre",
      })
      .positive("L'ID du cours doit être un nombre positif"),
  ),
  utilisateur_nom: z
    .string({
      required_error: "Le nom de l'utilisateur est requis",
      invalid_type_error:
        "Le nom de l'utilisateur doit être une chaîne de caractères",
    })
    .min(1, "Le nom de l'utilisateur est requis"),
  utilisateur_prenom: z
    .string({
      required_error: "Le prenom de l'utilisateur est requis",
      invalid_type_error:
        "Le prenom de l'utilisateur doit être une chaîne de caractères",
    })
    .min(1, "Le prenom de l'utilisateur est requis"),
});

/**
 * Schema pour les données de validation
 */
export const datavalidationSchema = z.object({
  cours_id: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z
      .number({
        required_error: "cours_id est requis",
        invalid_type_error: "cours_id doit être un nombre",
      })
      .positive("L'ID du cours doit être un nombre positif"),
  ),
  utilisateur_nom: z
    .string({
      required_error: "Le nom de l'utilisateur est requis",
      invalid_type_error:
        "Le nom de l'utilisateur doit être une chaîne de caractères",
    })
    .min(1, "Le nom de l'utilisateur est requis"),
  utilisateur_prenom: z
    .string({
      required_error: "Le prenom de l'utilisateur est requis",
      invalid_type_error:
        "Le prenom de l'utilisateur doit être une chaîne de caractères",
    })
    .min(1, "Le prenom de l'utilisateur est requis"),
});

/**
 * Schema de validation pour le planning professeur
 */
export const planningCoursProfesseurSchema = z.object({
  cours_recurrent_id: z
    .number()
    .positive("L'ID du cours récurrent doit être un nombre positif"),
  type_cours: z.string().min(1, "Le type de cours est requis"),
  jour_semaine: z.union([z.number().min(1).max(7), z.string().min(1)]),
  heure_debut: z
    .string()
    .regex(
      /^\d{2}:\d{2}:\d{2}$/,
      "L'heure de début doit être au format HH:MM:SS",
    ),
  heure_fin: z
    .string()
    .regex(
      /^\d{2}:\d{2}:\d{2}$/,
      "L'heure de fin doit être au format HH:MM:SS",
    ),
  est_recurrent_actif: z.union([z.boolean(), z.number().min(0).max(1)]),
  professeur_id: z
    .number()
    .positive("L'ID du professeur doit être un nombre positif"),
  professeur_nom: z.string().min(1, "Le nom du professeur est requis"),
  professeur_prenom: z.string().min(1, "Le prénom du professeur est requis"),
});

// ============================================
// ENUMS & CONSTANTES
// ============================================

export const JourSemaineEnum = z.enum([
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]);

export type JourSemaine = z.infer<typeof JourSemaineEnum>;

// ============================================
// SCHEMAS DE BASE
// ============================================

/**
 * Schema pour l'heure (format HH:MM ou HH:MM:SS)
 */
export const HeureSchema = z
  .string()
  .regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
    "Format d'heure invalide. Utilisez HH:MM ou HH:MM:SS",
  );

/**
 * Schema pour la date (format YYYY-MM-DD)
 */
export const DateCoursSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide. Utilisez YYYY-MM-DD")
  .refine(
    (date) => {
      const dateCours = new Date(date);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);
      return dateCours >= aujourdhui;
    },
    { message: "La date du cours ne peut pas être dans le passé" },
  );

// ============================================
// SCHEMAS POUR AJOUTER/MODIFIER COURS
// ============================================

/**
 * Schema pour ajouter un cours récurrent
 */
export const ajouterCoursInputSchema = z
  .object({
    nom: z
      .string()
      .min(2, "Le nom du cours doit contenir au moins 2 caractères")
      .max(255, "Le nom du cours ne peut pas dépasser 255 caractères"),
    type_cours: z.string().min(2, "Le type de cours est requis"),
    jour_semaine: JourSemaineEnum,
    heure_debut: HeureSchema,
    heure_fin: HeureSchema,
    professeurs: z.array(z.string()).optional().default([]),
    places_max: z
      .number()
      .int()
      .positive("Le nombre de places doit être positif")
      .optional(),
  })
  .refine(
    (data) => {
      // Validation que heure_fin est après heure_debut
      const [hDebut, mDebut] = data.heure_debut.split(":").map(Number);
      const [hFin, mFin] = data.heure_fin.split(":").map(Number);
      const minutesDebut = hDebut * 60 + mDebut;
      const minutesFin = hFin * 60 + mFin;
      return minutesFin > minutesDebut;
    },
    {
      message: "L'heure de fin doit être après l'heure de début",
      path: ["heure_fin"],
    },
  );

/**
 * Schema pour modifier un cours récurrent
 */
export const modifierCoursInputSchema = z
  .object({
    nom: z.string().min(2).max(255).optional(),
    type_cours: z.string().min(2).optional(),
    jour_semaine: JourSemaineEnum.optional(),
    heure_debut: HeureSchema.optional(),
    heure_fin: HeureSchema.optional(),
    professeurs: z.array(z.string()).optional(),
    places_max: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

// ============================================
// SCHEMAS POUR INSCRIPTIONS
// ============================================

/**
 * Schema pour inscrire un utilisateur
 */
export const inscrireUtilisateurInputSchema = z.object({
  utilisateur_nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  utilisateur_prenom: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  cours_id: z.number().int().positive("ID de cours invalide"),
});

/**
 * Schema pour désinscrire un utilisateur
 */
export const desinscrireUtilisateurInputSchema = z.object({
  utilisateur_id: z.number().int().positive("ID utilisateur invalide"),
  cours_id: z.number().int().positive("ID de cours invalide"),
});

/**
 * Schema pour valider/annuler présence
 */
export const presenceInputSchema = z.object({
  utilisateur_id: z.number().int().positive("ID utilisateur invalide"),
  cours_id: z.number().int().positive("ID de cours invalide"),
});

/**
 * Schema pour retirer un professeur
 */
export const retirerProfesseurInputSchema = z.object({
  cours_recurrent_id: z
    .number()
    .int()
    .positive("ID de cours récurrent invalide"),
  professeur_id: z.number().int().positive("ID professeur invalide"),
});

// ============================================
// SCHEMAS POUR QUERIES
// ============================================

/**
 * Schema pour obtenir un cours par ID
 */
export const coursIdSchema = z.object({
  coursId: z.number().int().positive("ID de cours invalide"),
});

/**
 * Schema pour obtenir les cours d'un utilisateur
 */
export const utilisateurIdSchema = z.object({
  utilisateurId: z.number().int().positive("ID utilisateur invalide"),
});

// ============================================
// TYPES EXPORTÉS
// ============================================

// Types de données
export type CoursDataValidated = z.infer<typeof coursdataSchema>;
export type DataReservationValidated = z.infer<typeof datareservationSchema>;
export type DataAnnulationValidated = z.infer<typeof datannulationSchema>;
export type DataValidationValidated = z.infer<typeof datavalidationSchema>;
export type PlanningCoursProfesseurValidated = z.infer<
  typeof planningCoursProfesseurSchema
>;

// Types de validation de requêtes
export type AjouterCoursInput = z.infer<typeof ajouterCoursInputSchema>;
export type ModifierCoursInput = z.infer<typeof modifierCoursInputSchema>;
export type InscrireUtilisateurInput = z.infer<
  typeof inscrireUtilisateurInputSchema
>;
export type DesinscrireUtilisateurInput = z.infer<
  typeof desinscrireUtilisateurInputSchema
>;
export type PresenceInput = z.infer<typeof presenceInputSchema>;
export type RetirerProfesseurInput = z.infer<
  typeof retirerProfesseurInputSchema
>;

// ============================================
// EXPORTS GROUPÉS
// ============================================

export const coursValidators = {
  ajouterCours: ajouterCoursInputSchema,
  modifierCours: modifierCoursInputSchema,
  inscrireUtilisateur: inscrireUtilisateurInputSchema,
  desinscrireUtilisateur: desinscrireUtilisateurInputSchema,
  presence: presenceInputSchema,
  retirerProfesseur: retirerProfesseurInputSchema,
  coursId: coursIdSchema,
  utilisateurId: utilisateurIdSchema,
  jourSemaine: JourSemaineEnum,
  heure: HeureSchema,
  dateCours: DateCoursSchema,
};
