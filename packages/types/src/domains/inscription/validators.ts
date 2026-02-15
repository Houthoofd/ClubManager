/**
 * Schémas de validation Zod pour le module Inscription
 * Définit les règles de validation pour les données d'inscription
 */

import { z } from "zod";

/**
 * Schéma pour la vérification d'email
 * Utilisé par POST /api/inscription/verification
 */
export const verificationEmailSchema = z.object({
  email: z
    .string({
      required_error: "L'email est requis",
      invalid_type_error: "L'email doit être une chaîne de caractères",
    })
    .trim()
    .toLowerCase()
    .min(5, {
      message: "L'email doit contenir au moins 5 caractères",
    })
    .max(255, {
      message: "L'email ne peut pas dépasser 255 caractères",
    })
    .email({
      message: "Format d'email invalide",
    }),
});

/**
 * Schéma pour la validation complète de l'inscription
 * Utilisé par POST /api/inscription/validation
 */
export const inscriptionSchema = z.object({
  nom: z
    .string({
      required_error: "Le nom est requis",
      invalid_type_error: "Le nom doit être une chaîne de caractères",
    })
    .trim()
    .min(1, {
      message: "Le nom ne peut pas être vide",
    })
    .max(100, {
      message: "Le nom ne peut pas dépasser 100 caractères",
    })
    .regex(/^[\p{L}\s'-]+$/u, {
      message:
        "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets",
    }),

  prenom: z
    .string({
      required_error: "Le prénom est requis",
      invalid_type_error: "Le prénom doit être une chaîne de caractères",
    })
    .trim()
    .min(1, {
      message: "Le prénom ne peut pas être vide",
    })
    .max(100, {
      message: "Le prénom ne peut pas dépasser 100 caractères",
    })
    .regex(/^[\p{L}\s'-]+$/u, {
      message:
        "Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets",
    }),

  email: z
    .string({
      required_error: "L'email est requis",
      invalid_type_error: "L'email doit être une chaîne de caractères",
    })
    .trim()
    .toLowerCase()
    .min(5, {
      message: "L'email doit contenir au moins 5 caractères",
    })
    .max(255, {
      message: "L'email ne peut pas dépasser 255 caractères",
    })
    .email({
      message: "Format d'email invalide",
    }),

  password: z
    .string({
      required_error: "Le mot de passe est requis",
      invalid_type_error: "Le mot de passe doit être une chaîne de caractères",
    })
    .min(8, {
      message: "Le mot de passe doit contenir au moins 8 caractères",
    })
    .max(128, {
      message: "Le mot de passe ne peut pas dépasser 128 caractères",
    })
    .regex(/[A-Z]/, {
      message: "Le mot de passe doit contenir au moins une majuscule",
    })
    .regex(/[a-z]/, {
      message: "Le mot de passe doit contenir au moins une minuscule",
    })
    .regex(/[0-9]/, {
      message: "Le mot de passe doit contenir au moins un chiffre",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: "Le mot de passe doit contenir au moins un caractère spécial",
    }),

  date: z
    .string({
      required_error: "La date de naissance est requise",
      invalid_type_error:
        "La date de naissance doit être une chaîne de caractères",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "La date doit être au format YYYY-MM-DD",
    })
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      },
      {
        message: "Date invalide",
      },
    )
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date <= today;
      },
      {
        message: "La date de naissance ne peut pas être dans le futur",
      },
    )
    .refine(
      (dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        // Vérifier que la date est valide (pas de 31 février, etc.)
        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const age =
          today.getFullYear() -
          date.getFullYear() -
          (today.getMonth() < date.getMonth() ||
          (today.getMonth() === date.getMonth() &&
            today.getDate() < date.getDate())
            ? 1
            : 0);

        return age >= 5 && age <= 120;
      },
      {
        message: "L'âge doit être entre 5 et 120 ans",
      },
    ),

  abonnement: z
    .number({
      required_error: "L'ID de l'abonnement est requis",
      invalid_type_error: "L'ID de l'abonnement doit être un nombre",
    })
    .int({
      message: "L'ID de l'abonnement doit être un nombre entier",
    })
    .positive({
      message: "L'ID de l'abonnement doit être un nombre positif",
    }),

  genre: z
    .number({
      required_error: "Le genre est requis",
      invalid_type_error: "Le genre doit être un nombre",
    })
    .int({
      message: "Le genre doit être un nombre entier",
    })
    .positive({
      message: "Le genre doit être un nombre positif",
    }),
});

/**
 * Schéma pour évaluer la force d'un mot de passe
 */
export const evaluerMotDePasseInputSchema = z.object({
  password: z.string().min(1, {
    message: "Le mot de passe ne peut pas être vide",
  }),
});

/**
 * Schéma pour la réponse de vérification d'email
 */
export const verificationEmailResponseSchema = z.object({
  exists: z.boolean(),
  message: z.string().optional(),
});

/**
 * Schéma pour la réponse d'inscription
 */
export const inscriptionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  userId: z.number().int().positive().optional(),
});

/**
 * Schéma pour la force du mot de passe
 */
export const passwordStrengthSchema = z.object({
  score: z.number().int().min(0).max(4),
  feedback: z.string(),
});

// ============================================
// TYPES INFÉRÉS
// ============================================

export type VerificationEmailData = z.infer<typeof verificationEmailSchema>;
export type InscriptionData = z.infer<typeof inscriptionSchema>;
export type EvaluerMotDePasseInput = z.infer<
  typeof evaluerMotDePasseInputSchema
>;
export type EmailVerificationResponse = z.infer<
  typeof verificationEmailResponseSchema
>;
export type InscriptionResponse = z.infer<typeof inscriptionResponseSchema>;
export type PasswordStrength = z.infer<typeof passwordStrengthSchema>;
