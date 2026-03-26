/**
 * Validators Zod pour l'authentification
 * Schémas pour login, register, token validation, password reset
 */

import { z } from "zod";
import {
  EMAIL_REGEX,
  VALIDATION_CONSTANTS,
  VALIDATION_ERRORS,
} from "../../constants/validation.constants.js";
import {
  ageValidationSchema,
  idSchema,
  userIdSchema,
} from "../common/common.validators.js";

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
 * Schéma pour le mot de passe
 */
const passwordSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.USER.PASSWORD.MIN_LENGTH,
    VALIDATION_ERRORS.INVALID_PASSWORD,
  )
  .max(
    VALIDATION_CONSTANTS.USER.PASSWORD.MAX_LENGTH,
    `Le mot de passe ne peut pas dépasser ${VALIDATION_CONSTANTS.USER.PASSWORD.MAX_LENGTH} caractères`,
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
  );

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
  );

/**
 * Schéma pour le token (email validation, password reset)
 */
const tokenSchema = z
  .string()
  .min(32, "Le token doit contenir au moins 32 caractères")
  .max(255, "Le token ne peut pas dépasser 255 caractères");

/**
 * Schéma pour connexion par email
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Schéma pour connexion par userId
 */
export const loginByUserIdSchema = z.object({
  userId: userIdSchema,
  password: passwordSchema,
});

/**
 * Schéma pour inscription
 */
export const registerSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  nom_utilisateur: usernameSchema.optional(),
  email: emailSchema,
  password: passwordSchema,
  date_of_birth: ageValidationSchema,
  genre_id: idSchema,
  abonnement_id: idSchema.optional(),
});

/**
 * Schéma pour inscription avec confirmation du mot de passe
 */
export const registerWithConfirmSchema = registerSchema
  .extend({
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

/**
 * Schéma pour validation de token email
 */
export const validateEmailTokenSchema = z.object({
  token: tokenSchema,
  userId: userIdSchema,
});

/**
 * Schéma pour demande de reset password
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Schéma pour reset password
 */
export const passwordResetSchema = z.object({
  token: tokenSchema,
  newPassword: passwordSchema,
});

/**
 * Schéma pour reset password avec confirmation
 */
export const passwordResetWithConfirmSchema = z
  .object({
    token: tokenSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

/**
 * Schéma pour changement de mot de passe (utilisateur connecté)
 */
export const changePasswordSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'ancien",
    path: ["newPassword"],
  });

/**
 * Schéma pour recherche utilisateur par email
 */
export const searchUserByEmailSchema = z.object({
  email: emailSchema,
});

/**
 * Schéma pour vérification existence utilisateur
 */
export const verifyUserExistsSchema = z.object({
  nom: nameSchema,
  prenom: nameSchema,
  date_naissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, VALIDATION_ERRORS.INVALID_DATE),
});

/**
 * Schéma pour refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: tokenSchema,
});

/**
 * Schéma pour vérification de token JWT
 */
export const verifyJwtSchema = z.object({
  token: z.string().min(1, "Le token est requis"),
});

/**
 * Schéma pour logout
 */
export const logoutSchema = z.object({
  token: z.string().optional(), // Optionnel si on utilise les cookies
});

/**
 * Schéma pour renvoi d'email de validation
 */
export const resendEmailValidationSchema = z.object({
  email: emailSchema,
});

/**
 * Types inférés à partir des schémas Zod
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginByUserIdInput = z.infer<typeof loginByUserIdSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterWithConfirmInput = z.infer<
  typeof registerWithConfirmSchema
>;
export type ValidateEmailTokenInput = z.infer<typeof validateEmailTokenSchema>;
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordResetWithConfirmInput = z.infer<
  typeof passwordResetWithConfirmSchema
>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SearchUserByEmailInput = z.infer<typeof searchUserByEmailSchema>;
export type VerifyUserExistsInput = z.infer<typeof verifyUserExistsSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyJwtInput = z.infer<typeof verifyJwtSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ResendEmailValidationInput = z.infer<
  typeof resendEmailValidationSchema
>;
