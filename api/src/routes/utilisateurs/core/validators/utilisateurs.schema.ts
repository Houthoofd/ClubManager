/**
 * Schémas de validation Zod pour le module Utilisateurs
 * Validation des données utilisateur
 */

import { z } from "zod";

/**
 * Schéma pour la vérification d'existence d'un utilisateur
 */
export const verifierUtilisateurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD requis)"),
});

/**
 * Schéma pour l'inscription d'un utilisateur
 */
export const inscriptionUtilisateurSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  nom_utilisateur: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  genre_id: z.number().int().positive("L'ID du genre doit être positif"),
  abonnement_id: z.number().int().positive("L'ID de l'abonnement doit être positif"),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD requis)"),
  date_inscription: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD requis)").optional(),
  status_id: z.number().int().positive("L'ID du status doit être positif").optional(),
  grade_id: z.number().int().positive("L'ID du grade doit être positif").optional(),
});

/**
 * Schéma pour la connexion par userId
 */
export const connexionUserIdSchema = z.object({
  userId: z.string().min(1, "L'userId est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

/**
 * Schéma pour la connexion par email
 */
export const connexionEmailSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

/**
 * Schéma pour la recherche par email
 */
export const rechercheEmailSchema = z.object({
  email: z.string().email("Email invalide"),
});

/**
 * Schéma pour la validation du token email
 */
export const validationTokenSchema = z.object({
  token: z.string().min(1, "Le token est requis"),
  userId: z.string().min(1, "L'userId est requis"),
});

/**
 * Schéma pour l'envoi d'email de test
 */
export const emailTestSchema = z.object({
  email: z.string().email("Email invalide"),
});

/**
 * Schéma pour l'ID utilisateur en paramètre
 */
export const utilisateurIdParamSchema = z.object({
  id: z.string().transform((val, ctx) => {
    if (!/^\s*-?\d+\s*$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'ID de l'utilisateur doit être un nombre entier valide",
      });
      return z.NEVER;
    }

    const parsed = parseInt(val, 10);

    if (parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'ID de l'utilisateur doit être positif",
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

/**
 * Schéma pour la mise à jour d'un utilisateur
 */
export const miseAJourUtilisateurSchema = z.object({
  id: z.number().int().positive("L'ID doit être positif").optional(),
  email: z.string().email("Email invalide").optional(),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide").optional(),
  genres: z.number().int().positive().optional(),
  grades: z.number().int().positive().optional(),
  abonnement: z.number().int().positive().optional(),
  status: z.number().int().positive().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Au moins un champ doit être fourni pour la mise à jour",
});

/**
 * Schéma pour la suppression (soft/hard)
 */
export const suppressionUtilisateurSchema = z.object({
  utilisateurId: z.number().int().positive("L'ID de l'utilisateur doit être positif"),
  isConfirm: z.boolean().optional(),
});

/**
 * Schéma pour les paramètres de requête (liste)
 */
export const listeUtilisateursQuerySchema = z.object({
  includeInactive: z.string().transform((val) => val === "true").optional(),
});

/**
 * Schéma pour les stats
 */
export const statsSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  checks: z.object({
    database: z.boolean(),
    utilisateurs: z.boolean(),
    email: z.boolean(),
  }),
  message: z.string().min(1, "Le message ne peut pas être vide"),
  data: z.object({
    totalUtilisateurs: z.number().nonnegative(),
    utilisateursActifs: z.number().nonnegative(),
    utilisateursInactifs: z.number().nonnegative(),
  }).optional(),
});

/**
 * Schéma pour un utilisateur complet
 */
export const utilisateurSchema = z.object({
  id: z.number().int().positive(),
  prenom: z.string().min(1),
  nom: z.string().min(1),
  nom_utilisateur: z.string().min(3),
  email: z.string().email(),
  genre_id: z.number().int().positive(),
  abonnement_id: z.number().int().positive(),
  date_naissance: z.string(),
  date_inscription: z.string(),
  status_id: z.number().int().positive(),
  grade_id: z.number().int().positive().optional(),
  email_verifie: z.boolean().optional(),
  date_verification_email: z.string().optional(),
});

/**
 * Schéma pour un tableau d'utilisateurs
 */
export const utilisateursArraySchema = z.array(utilisateurSchema);

/**
 * Schéma pour l'envoi d'email d'inscription
 */
export const envoyerEmailInscriptionSchema = z.object({
  email: z.string().email("Email invalide"),
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  userId: z.string().min(1, "L'userId est requis"),
  utilisateurId: z.number().int().positive("L'utilisateurId doit être positif"),
});

/**
 * Schéma pour la vérification d'utilisateur (admin)
 */
export const verifierUtilisateurAdminSchema = z.object({
  email: z.string().email("Email invalide"),
  nom_utilisateur: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  genre_id: z.number().int().positive(),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  status_id: z.number().int().positive(),
  grade_id: z.number().int().positive(),
  abonnement_id: z.number().int().positive(),
  date_inscription: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Type exports pour TypeScript
 */
export type VerifierUtilisateur = z.infer<typeof verifierUtilisateurSchema>;
export type InscriptionUtilisateur = z.infer<typeof inscriptionUtilisateurSchema>;
export type ConnexionUserId = z.infer<typeof connexionUserIdSchema>;
export type ConnexionEmail = z.infer<typeof connexionEmailSchema>;
export type RechercheEmail = z.infer<typeof rechercheEmailSchema>;
export type ValidationToken = z.infer<typeof validationTokenSchema>;
export type EmailTest = z.infer<typeof emailTestSchema>;
export type UtilisateurIdParam = z.infer<typeof utilisateurIdParamSchema>;
export type MiseAJourUtilisateur = z.infer<typeof miseAJourUtilisateurSchema>;
export type SuppressionUtilisateur = z.infer<typeof suppressionUtilisateurSchema>;
export type ListeUtilisateursQuery = z.infer<typeof listeUtilisateursQuerySchema>;
export type Stats = z.infer<typeof statsSchema>;
export type Utilisateur = z.infer<typeof utilisateurSchema>;
export type EnvoyerEmailInscription = z.infer<typeof envoyerEmailInscriptionSchema>;
export type VerifierUtilisateurAdmin = z.infer<typeof verifierUtilisateurAdminSchema>;
