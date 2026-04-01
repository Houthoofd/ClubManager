/**
 * Validators Zod pour les professeurs
 * Schémas basés sur les DTOs et contraintes DB
 */

import { z } from "zod";
import {
  EMAIL_REGEX,
  NAME_REGEX,
  PHONE_REGEX,
  VALIDATION_CONSTANTS,
  VALIDATION_ERRORS,
} from "../../constants/validation.constants.js";
import {
  booleanSchema,
  idSchema,
  paginationSchema,
  searchQuerySchema,
  sortOrderSchema,
} from "../common/common.validators.js";

/**
 * Schéma pour le nom/prénom du professeur
 */
const nameSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.USER.NAME.MIN_LENGTH,
    `Le nom doit contenir au moins ${VALIDATION_CONSTANTS.USER.NAME.MIN_LENGTH} caractères`,
  )
  .max(
    VALIDATION_CONSTANTS.USER.NAME.MAX_LENGTH,
    `Le nom ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.NAME.MAX_LENGTH} caractères`,
  )
  .regex(
    NAME_REGEX,
    "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes",
  );

/**
 * Schéma pour l'email du professeur
 */
const emailSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.USER.EMAIL.MIN_LENGTH,
    VALIDATION_ERRORS.INVALID_EMAIL,
  )
  .max(
    VALIDATION_CONSTANTS.USER.EMAIL.MAX_LENGTH,
    `L'email ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.EMAIL.MAX_LENGTH} caractères`,
  )
  .regex(EMAIL_REGEX, VALIDATION_ERRORS.INVALID_EMAIL)
  .email(VALIDATION_ERRORS.INVALID_EMAIL)
  .optional();

/**
 * Schéma pour le téléphone du professeur
 */
const phoneSchema = z
  .string()
  .regex(PHONE_REGEX, VALIDATION_ERRORS.INVALID_PHONE)
  .optional();

/**
 * Schéma pour la spécialité du professeur
 */
const specialiteSchema = z
  .string()
  .min(1, "La spécialité doit contenir au moins 1 caractère")
  .max(100, "La spécialité ne peut pas dépasser 100 caractères")
  .optional();

/**
 * Schéma pour l'URL de la photo
 */
const photoUrlSchema = z
  .string()
  .url("L'URL de la photo doit être valide")
  .max(255, "L'URL de la photo ne peut pas dépasser 255 caractères")
  .optional();

/**
 * Schéma pour créer un professeur
 * Correspond à CreateProfessorDto
 */
export const createProfessorSchema = z.object({
  nom: nameSchema,
  prenom: nameSchema,
  email: emailSchema,
  telephone: phoneSchema,
  specialite: specialiteSchema,
  grade_id: idSchema.optional().nullable(),
  photo_url: photoUrlSchema,
  actif: z.boolean().default(true),
});

/**
 * Schéma pour mettre à jour un professeur
 * Tous les champs sont optionnels sauf l'ID
 */
export const updateProfessorSchema = z.object({
  id: idSchema,
  nom: nameSchema.optional(),
  prenom: nameSchema.optional(),
  email: emailSchema,
  telephone: phoneSchema,
  specialite: specialiteSchema,
  grade_id: idSchema.optional().nullable(),
  photo_url: photoUrlSchema,
  actif: z.boolean().optional(),
});

/**
 * Schéma pour rechercher des professeurs
 */
export const searchProfessorSchema = z
  .object({
    nom: searchQuerySchema,
    prenom: searchQuerySchema,
    email: searchQuerySchema,
    specialite: searchQuerySchema,
    actif: booleanSchema.optional(),
    grade_id: idSchema.optional(),
    sort_by: z
      .enum(["nom", "prenom", "email", "specialite", "created_at"], {
        errorMap: () => ({
          message:
            "Le tri doit être par 'nom', 'prenom', 'email', 'specialite' ou 'created_at'",
        }),
      })
      .default("nom")
      .optional(),
    sort_order: sortOrderSchema.default("asc").optional(),
  })
  .merge(paginationSchema);

/**
 * Schéma pour activer/désactiver un professeur
 */
export const toggleProfessorSchema = z.object({
  id: idSchema,
  actif: z.boolean(),
});

/**
 * Schéma pour obtenir les cours d'un professeur
 */
export const getProfessorCoursesSchema = z.object({
  professeur_id: idSchema,
  date_debut: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La date doit être au format ISO (YYYY-MM-DD)",
    )
    .optional(),
  date_fin: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La date doit être au format ISO (YYYY-MM-DD)",
    )
    .optional(),
});

/**
 * Types inférés à partir des schémas Zod
 */
export type CreateProfessorInput = z.infer<typeof createProfessorSchema>;
export type UpdateProfessorInput = z.infer<typeof updateProfessorSchema>;
export type SearchProfessorInput = z.infer<typeof searchProfessorSchema>;
export type ToggleProfessorInput = z.infer<typeof toggleProfessorSchema>;
export type GetProfessorCoursesInput = z.infer<
  typeof getProfessorCoursesSchema
>;
