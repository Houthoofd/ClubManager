/**
 * Validators Zod pour les utilisateurs
 * Schémas basés sur les DTOs et contraintes DB
 */

import { z } from "zod";
import {
  EMAIL_REGEX,
  HASHED_PASSWORD_REGEX,
  NAME_REGEX,
  PHONE_REGEX,
  USERNAME_REGEX,
  VALIDATION_CONSTANTS,
  VALIDATION_ERRORS,
} from "../../constants/validation.constants.js";
import {
  ageValidationSchema,
  dateISOSchema,
  idSchema,
  idStringSchema,
} from "../common/common.validators.js";

/**
 * Schéma pour le nom d'utilisateur
 */
const usernameSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.USER.USERNAME.MIN_LENGTH,
    `Le nom d'utilisateur doit contenir au moins ${VALIDATION_CONSTANTS.USER.USERNAME.MIN_LENGTH} caractères`,
  )
  .max(
    VALIDATION_CONSTANTS.USER.USERNAME.MAX_LENGTH,
    `Le nom d'utilisateur ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.USERNAME.MAX_LENGTH} caractères`,
  )
  .regex(
    USERNAME_REGEX,
    "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
  );

/**
 * Schéma pour l'email
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
  .email(VALIDATION_ERRORS.INVALID_EMAIL);

/**
 * Schéma pour le mot de passe en clair (lors de la création/modification)
 */
const passwordSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.USER.PASSWORD.MIN_LENGTH,
    `Le mot de passe doit contenir au moins ${VALIDATION_CONSTANTS.USER.PASSWORD.MIN_LENGTH} caractères`,
  )
  .max(
    VALIDATION_CONSTANTS.USER.PASSWORD.MAX_LENGTH,
    `Le mot de passe ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.PASSWORD.MAX_LENGTH} caractères`,
  );

/**
 * Schéma pour le mot de passe hashé (vérification côté DB)
 */
const hashedPasswordSchema = z
  .string()
  .regex(
    HASHED_PASSWORD_REGEX,
    "Le mot de passe doit être hashé avec bcrypt ou argon2",
  );

/**
 * Schéma pour le prénom/nom
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
 * Schéma pour le téléphone
 */
const phoneSchema = z
  .string()
  .regex(PHONE_REGEX, VALIDATION_ERRORS.INVALID_PHONE)
  .optional();

/**
 * Schéma pour l'adresse
 */
const addressSchema = z
  .string()
  .min(5, "L'adresse doit contenir au moins 5 caractères")
  .max(255, "L'adresse ne peut pas dépasser 255 caractères")
  .optional();

/**
 * Schéma pour créer un utilisateur
 * Correspond à CreateUserDto
 */
export const createUserSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  nom_utilisateur: usernameSchema.optional(), // Auto-généré si absent
  email: emailSchema,
  password: passwordSchema,
  date_of_birth: ageValidationSchema, // Valide l'âge (5-120 ans)
  telephone: phoneSchema,
  adresse: addressSchema,
  genre_id: idSchema,
  grade_id: idSchema.optional(),
  abonnement_id: idSchema.optional(),
  status_id: idSchema.optional(), // Default: 1 (actif)
});

/**
 * Schéma pour mettre à jour un utilisateur
 * Tous les champs sont optionnels sauf l'ID
 */
export const updateUserSchema = z.object({
  id: idSchema,
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  nom_utilisateur: usernameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  date_of_birth: ageValidationSchema.optional(),
  telephone: phoneSchema,
  adresse: addressSchema,
  genre_id: idSchema.optional(),
  grade_id: idSchema.optional().nullable(),
  abonnement_id: idSchema.optional().nullable(),
  status_id: idSchema.optional(),
});

/**
 * Schéma pour soft delete (RGPD v4.1)
 */
export const softDeleteUserSchema = z.object({
  userId: idSchema,
  deletedBy: idSchema,
  reason: z
    .string()
    .min(
      VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MIN_LENGTH,
      `La raison doit contenir au moins ${VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MIN_LENGTH} caractères`,
    )
    .max(
      VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MAX_LENGTH,
      `La raison ne peut pas dépasser ${VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MAX_LENGTH} caractères`,
    ),
});

/**
 * Schéma pour restaurer un utilisateur supprimé
 */
export const restoreUserSchema = z.object({
  userId: idSchema,
  restoredBy: idSchema,
});

/**
 * Schéma pour mettre à jour le mot de passe
 */
export const updatePasswordSchema = z.object({
  userId: idSchema,
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
});

/**
 * Schéma pour mettre à jour l'email
 */
export const updateEmailSchema = z.object({
  userId: idSchema,
  newEmail: emailSchema,
});

/**
 * Schéma pour mettre à jour le profil utilisateur (données publiques)
 */
export const updateProfileSchema = z.object({
  userId: idSchema,
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  telephone: phoneSchema,
  adresse: addressSchema,
  photo_url: z
    .string()
    .url("L'URL de la photo doit être valide")
    .max(255, "L'URL de la photo ne peut pas dépasser 255 caractères")
    .optional(),
});

/**
 * Schéma pour anonymiser un utilisateur (RGPD)
 */
export const anonymizeUserSchema = z.object({
  userId: idSchema,
  anonymizedBy: idSchema,
  reason: z
    .string()
    .min(
      VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MIN_LENGTH,
      `La raison doit contenir au moins ${VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MIN_LENGTH} caractères`,
    )
    .max(
      VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MAX_LENGTH,
      `La raison ne peut pas dépasser ${VALIDATION_CONSTANTS.RGPD.DELETION_REASON_MAX_LENGTH} caractères`,
    ),
});

/**
 * Types inférés à partir des schémas Zod
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SoftDeleteUserInput = z.infer<typeof softDeleteUserSchema>;
export type RestoreUserInput = z.infer<typeof restoreUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AnonymizeUserInput = z.infer<typeof anonymizeUserSchema>;
