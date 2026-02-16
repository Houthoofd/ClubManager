import { z } from "zod";

// ============================================
// SCHEMAS DE DONNÉES (depuis types.ts)
// ============================================

/**
 * Schéma Zod pour validation d'un professeur
 */
export const ProfesseurSchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  nom_utilisateur: z.string().optional(),
  email: z.string().email(),
  genre_id: z.number().int().positive().optional(),
  date_naissance: z.date().nullable(),
  grade_id: z.number().int().positive().nullable(),
  status_id: z.number().int().optional(),
});

/**
 * Planning d'un cours pour un professeur
 */
export const PlanningCoursProfSchema = z.object({
  cours_recurrent_id: z.number().int().positive(),
  type_cours: z.string(),
  jour_semaine: z.number().int().min(0).max(6),
  heure_debut: z.string(),
  heure_fin: z.string(),
  est_recurrent_actif: z.boolean(),
  professeur_id: z.number().int().positive(),
  professeur_nom: z.string(),
  professeur_prenom: z.string(),
});

/**
 * Input pour ajouter un professeur
 */
export const AjouterProfesseurInputSchema = z.object({
  utilisateurs: z.union([
    z.array(z.number().int().positive()),
    z.array(z.object({ id: z.number().int().positive() })),
  ]),
});

/**
 * Input pour modifier le statut d'un professeur
 */
export const ModifierStatutProfesseurInputSchema = z.object({
  id: z.number().int().positive("ID professeur requis"),
  status_id: z.number().int().positive("Statut requis"),
});

// ============================================
// SCHEMAS DE VALIDATION DE REQUÊTES
// ============================================

/**
 * Schema pour récupérer tous les professeurs
 */
export const getProfesseursSchema = z.object({
  // Pas de paramètres requis pour GET /
});

/**
 * Schema pour récupérer un professeur par ID (REST - string param)
 */
export const getProfesseurByIdSchema = z.object({
  id: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID professeur doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID professeur doit être supérieur à 0",
    }),
});

/**
 * Schema pour récupérer un professeur par ID (GraphQL - number)
 */
export const getProfesseurByIdGraphQLSchema = z.object({
  id: z
    .number({
      required_error: "L'ID du professeur est requis",
      invalid_type_error: "L'ID doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),
});

/**
 * Schema pour ajouter/promouvoir un professeur
 */
export const ajouterProfesseurSchema = z
  .object({
    utilisateurs: z
      .array(
        z.union([
          z.number().int().positive(),
          z.string().refine((val) => /^\d+$/.test(val), {
            message: "ID utilisateur doit être un nombre",
          }),
          z.object({
            id: z.number().int().positive(),
          }),
          z.object({
            userId: z.number().int().positive(),
          }),
          z.object({
            user_id: z.number().int().positive(),
          }),
        ]),
      )
      .min(1, "Au moins un utilisateur doit être fourni")
      .optional(),

    // Support pour un seul utilisateur
    id: z.number().int().positive().optional(),
    userId: z.number().int().positive().optional(),
    user_id: z.number().int().positive().optional(),

    // Support pour un tableau d'objets users
    users: z
      .array(
        z.union([
          z.number().int().positive(),
          z.string(),
          z.object({
            id: z.number().int().positive(),
          }),
        ]),
      )
      .optional(),
  })
  .refine(
    (data) => {
      // Au moins une source d'utilisateurs doit être fournie
      return (
        data.utilisateurs?.length ||
        data.id ||
        data.userId ||
        data.user_id ||
        data.users?.length
      );
    },
    {
      message: "Au moins un utilisateur doit être fourni",
    },
  );

/**
 * Schema pour modifier le statut d'un professeur
 */
export const modifierStatutProfesseurSchema = z.object({
  id: z
    .number({
      required_error: "L'ID du professeur est requis",
      invalid_type_error: "L'ID doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),

  status_id: z
    .number({
      required_error: "Le status_id est requis",
      invalid_type_error: "Le status_id doit être un nombre",
    })
    .int("Le status_id doit être un entier")
    .positive("Le status_id doit être positif")
    .min(1, "Le status_id doit être au minimum 1")
    .max(10, "Le status_id doit être au maximum 10"),
});

/**
 * Schema pour récupérer le planning d'un professeur (REST - string param)
 */
export const getPlanningProfesseurSchema = z.object({
  id: z
    .string()
    .refine((val) => /^\d+$/.test(val), {
      message: "ID professeur doit être un nombre positif",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: "ID professeur doit être supérieur à 0",
    }),
});

/**
 * Schema pour récupérer le planning d'un professeur (GraphQL - number)
 */
export const getPlanningProfesseurGraphQLSchema = z.object({
  id: z
    .number({
      required_error: "L'ID du professeur est requis",
      invalid_type_error: "L'ID doit être un nombre",
    })
    .int("L'ID doit être un entier")
    .positive("L'ID doit être positif"),
});

/**
 * Schema pour valider les données d'un utilisateur
 */
export const professeursUtilisateurSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  role_id: z.number().int().positive().optional(),
  status_id: z.number().int().positive().optional(),
});

/**
 * Schema pour valider les données d'un cours dans le planning
 */
export const coursSchema = z.object({
  id: z.number().int().positive(),
  nom_cours: z.string().min(1),
  description: z.string().optional(),
  jour_semaine: z.string().min(1),
  heure_debut: z.string().min(1),
  heure_fin: z.string().min(1),
  salle: z.string().optional(),
  niveau: z.string().optional(),
  capacite_max: z.number().int().positive().optional(),
  professeur_id: z.number().int().positive(),
});

// ============================================
// TYPES TYPESCRIPT EXTRAITS DES SCHÉMAS ZOD
// ============================================

// Types de données
export type Professeur = z.infer<typeof ProfesseurSchema>;
export type PlanningCoursProf = z.infer<typeof PlanningCoursProfSchema>;
export type AjouterProfesseurInput = z.infer<
  typeof AjouterProfesseurInputSchema
>;
export type ModifierStatutProfesseurInput = z.infer<
  typeof ModifierStatutProfesseurInputSchema
>;

// Types de validation de requêtes
export type GetProfesseursData = z.infer<typeof getProfesseursSchema>;
export type GetProfesseurByIdData = z.infer<typeof getProfesseurByIdSchema>;
export type GetProfesseurByIdGraphQLData = z.infer<
  typeof getProfesseurByIdGraphQLSchema
>;
export type AjouterProfesseurData = z.infer<typeof ajouterProfesseurSchema>;
export type ModifierStatutProfesseurData = z.infer<
  typeof modifierStatutProfesseurSchema
>;
export type GetPlanningProfesseurData = z.infer<
  typeof getPlanningProfesseurSchema
>;
export type GetPlanningProfesseurGraphQLData = z.infer<
  typeof getPlanningProfesseurGraphQLSchema
>;
export type UtilisateurData = z.infer<typeof professeursUtilisateurSchema>;
export type CoursData = z.infer<typeof coursSchema>;
