/**
 * Schémas de validation pour le module Auth
 * Utilise Zod pour valider les données d'entrée
 */

import { z } from "zod";

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email requis",
      invalid_type_error: "Email doit être une chaîne de caractères",
    })
    .trim()
    .email("Format email invalide")
    .min(1, "Email ne peut pas être vide"),
  password: z
    .string({
      required_error: "Mot de passe requis",
      invalid_type_error: "Mot de passe doit être une chaîne de caractères",
    })
    .min(1, "Mot de passe ne peut pas être vide"),
});

/**
 * Schéma de validation pour la demande de réinitialisation de mot de passe
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: "Email requis",
      invalid_type_error: "Email doit être une chaîne de caractères",
    })
    .trim()
    .email("Format email invalide")
    .min(1, "Email ne peut pas être vide"),
});

/**
 * Schéma de validation pour la réinitialisation de mot de passe
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({
      required_error: "Token requis",
      invalid_type_error: "Token doit être une chaîne de caractères",
    })
    .min(1, "Token ne peut pas être vide"),
  new_password: z
    .string({
      required_error: "Nouveau mot de passe requis",
      invalid_type_error: "Mot de passe doit être une chaîne de caractères",
    })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(100, "Le mot de passe ne peut pas dépasser 100 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
    ),
});

/**
 * Schéma de validation pour la vérification d'un token de reset
 */
export const verifyTokenSchema = z.object({
  token: z
    .string({
      required_error: "Token requis",
      invalid_type_error: "Token doit être une chaîne de caractères",
    })
    .min(1, "Token ne peut pas être vide"),
});

/**
 * Schéma de validation pour la confirmation d'email
 */
export const confirmEmailSchema = z.object({
  token: z
    .string({
      required_error: "Token requis",
      invalid_type_error: "Token doit être une chaîne de caractères",
    })
    .min(1, "Token ne peut pas être vide"),
  user_id: z
    .string({
      required_error: "UserId requis",
      invalid_type_error: "UserId doit être une chaîne de caractères",
    })
    .min(1, "UserId ne peut pas être vide"),
});

/**
 * Type inféré pour la connexion
 */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Type inféré pour la demande de réinitialisation
 */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Type inféré pour la réinitialisation de mot de passe
 */
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Type inféré pour la vérification de token
 */
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;

/**
 * Type inféré pour la confirmation d'email
 */
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;

/**
 * Validation des données de connexion
 */
export function validerLogin(data: unknown): {
  success: boolean;
  data?: LoginInput;
  errors?: string[];
} {
  try {
    const validated = loginSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.message) || [
      "Validation échouée",
    ];
    return { success: false, errors };
  }
}

/**
 * Validation de la demande de réinitialisation
 */
export function validerForgotPassword(data: unknown): {
  success: boolean;
  data?: ForgotPasswordInput;
  errors?: string[];
} {
  try {
    const validated = forgotPasswordSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.message) || [
      "Validation échouée",
    ];
    return { success: false, errors };
  }
}

/**
 * Validation de la réinitialisation de mot de passe
 */
export function validerResetPassword(data: unknown): {
  success: boolean;
  data?: ResetPasswordInput;
  errors?: string[];
} {
  try {
    const validated = resetPasswordSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.message) || [
      "Validation échouée",
    ];
    return { success: false, errors };
  }
}

/**
 * Validation de la vérification de token
 */
export function validerVerifyToken(data: unknown): {
  success: boolean;
  data?: VerifyTokenInput;
  errors?: string[];
} {
  try {
    const validated = verifyTokenSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.message) || [
      "Validation échouée",
    ];
    return { success: false, errors };
  }
}

/**
 * Validation de la confirmation d'email
 */
export function validerConfirmEmail(data: unknown): {
  success: boolean;
  data?: ConfirmEmailInput;
  errors?: string[];
} {
  try {
    const validated = confirmEmailSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.message) || [
      "Validation échouée",
    ];
    return { success: false, errors };
  }
}
