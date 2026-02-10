/**
 * Schémas de validation Zod pour le module Vérification
 * Validation des données de vérification d'existence
 */

import { z } from "zod";

/**
 * Jours de la semaine valides
 */
export const JourSemaineEnum = z.enum([
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
]);

/**
 * Schéma pour la vérification d'email
 */
export const verifierEmailSchema = z.object({
  email: z.string().email("Email invalide").min(5, "Email trop court"),
});

/**
 * Schéma pour la vérification de nom d'utilisateur
 */
export const verifierNomUtilisateurSchema = z.object({
  nom_utilisateur: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(50, "Le nom d'utilisateur ne doit pas dépasser 50 caractères"),
});

/**
 * Schéma pour la vérification de prénom
 */
export const verifierPrenomSchema = z.object({
  prenom: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères"),
});

/**
 * Schéma pour la vérification de nom
 */
export const verifierNomSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
});

/**
 * Schéma pour la vérification de prénom et nom
 */
export const verifierPrenomNomSchema = z.object({
  prenom: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères"),
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
});

/**
 * Schéma pour la vérification d'email, prénom et nom
 */
export const verifierEmailPrenomNomSchema = z.object({
  email: z.string().email("Email invalide").min(5, "Email trop court"),
  prenom: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères"),
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
});

/**
 * Schéma pour la validation d'heure (format HH:MM)
 */
const heureSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM attendu)");

/**
 * Schéma pour la vérification de planning
 */
export const verifierPlanningSchema = z.object({
  jour: JourSemaineEnum,
  heure_debut: heureSchema,
  heure_fin: heureSchema,
  type_cours: z
    .string()
    .min(2, "Le type de cours doit contenir au moins 2 caractères")
    .max(100, "Le type de cours ne doit pas dépasser 100 caractères"),
});

/**
 * Schéma pour la vérification d'article magasin
 */
export const verifierArticleMagasinSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom de l'article doit contenir au moins 2 caractères")
    .max(200, "Le nom de l'article ne doit pas dépasser 200 caractères"),
});

/**
 * Schéma pour la vérification d'article magasin par catégorie
 */
export const verifierArticleMagasinCategorieSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom de l'article doit contenir au moins 2 caractères")
    .max(200, "Le nom de l'article ne doit pas dépasser 200 caractères"),
  categorie_id: z
    .number()
    .int("L'ID de catégorie doit être un entier")
    .positive("L'ID de catégorie doit être positif"),
});

/**
 * Schéma pour un utilisateur (nom et prénom)
 */
export const utilisateurInputSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
  prenom: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères"),
});

/**
 * Schéma pour la vérification de professeurs
 */
export const verifierProfesseursSchema = z.object({
  utilisateurs: z
    .array(utilisateurInputSchema)
    .min(1, "Au moins un utilisateur doit être fourni"),
});

/**
 * Schéma pour la vérification générique (email en mutation)
 */
export const verifierEmailMutationSchema = z.object({
  email: z.string().email("Email invalide").min(5, "Email trop court"),
});

/**
 * Type exports pour TypeScript
 */
export type VerifierEmail = z.infer<typeof verifierEmailSchema>;
export type VerifierNomUtilisateur = z.infer<typeof verifierNomUtilisateurSchema>;
export type VerifierPrenom = z.infer<typeof verifierPrenomSchema>;
export type VerifierNom = z.infer<typeof verifierNomSchema>;
export type VerifierPrenomNom = z.infer<typeof verifierPrenomNomSchema>;
export type VerifierEmailPrenomNom = z.infer<typeof verifierEmailPrenomNomSchema>;
export type VerifierPlanning = z.infer<typeof verifierPlanningSchema>;
export type VerifierArticleMagasin = z.infer<typeof verifierArticleMagasinSchema>;
export type VerifierArticleMagasinCategorie = z.infer<typeof verifierArticleMagasinCategorieSchema>;
export type UtilisateurInput = z.infer<typeof utilisateurInputSchema>;
export type VerifierProfesseurs = z.infer<typeof verifierProfesseursSchema>;
export type JourSemaine = z.infer<typeof JourSemaineEnum>;
