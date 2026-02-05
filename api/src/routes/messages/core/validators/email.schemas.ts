import { z } from 'zod';

/**
 * Schéma de validation pour l'envoi d'un email personnalisé
 */
export const sendCustomEmailSchema = z.object({
  to: z.string()
    .email('Adresse email invalide')
    .trim(),
  subject: z.string()
    .min(1, 'Le sujet est requis')
    .max(500, 'Le sujet ne peut pas dépasser 500 caractères')
    .trim(),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.string().email().optional(),
  bcc: z.string().email().optional(),
  saveToDb: z.boolean().optional().default(true),
  utilisateurId: z.number().int().positive().optional(),
  type_message: z.string().optional().default('custom_email'),
}).refine(
  (data) => data.html || data.text,
  {
    message: 'Au moins un champ (html ou text) doit être fourni',
    path: ['html'],
  }
);

/**
 * Schéma de validation pour l'envoi d'un email de test
 */
export const sendTestEmailSchema = z.object({
  email: z.string()
    .email('Adresse email invalide')
    .trim(),
});

/**
 * Schéma de validation pour l'envoi avec template
 */
export const sendTemplateEmailSchema = z.object({
  templateTitle: z.string()
    .min(1, 'Le titre du template est requis')
    .trim(),
  to: z.string()
    .email('Adresse email invalide')
    .trim(),
  variables: z.record(z.any()).optional().default({}),
  saveToDb: z.boolean().optional().default(true),
  utilisateurId: z.number().int().positive().optional(),
});

/**
 * Schéma de validation pour l'envoi d'un email de bienvenue
 */
export const sendWelcomeEmailSchema = z.object({
  email: z.string()
    .email('Adresse email invalide')
    .trim(),
  firstName: z.string()
    .min(1, 'Le prénom est requis')
    .trim(),
  lastName: z.string()
    .min(1, 'Le nom est requis')
    .trim(),
  userId: z.string()
    .min(1, 'L\'identifiant utilisateur est requis')
    .trim(),
  utilisateurId: z.number().int().positive().optional(),
});

/**
 * Schéma de validation pour l'envoi d'un email de validation
 */
export const sendValidationEmailSchema = z.object({
  email: z.string()
    .email('Adresse email invalide')
    .trim(),
  firstName: z.string()
    .min(1, 'Le prénom est requis')
    .trim(),
  userId: z.string()
    .min(1, 'L\'identifiant utilisateur est requis')
    .trim(),
  utilisateurId: z.number().int().positive().optional(),
});

/**
 * Schéma de validation pour la récupération de l'userId
 */
export const recoverUserIdSchema = z.object({
  email: z.string()
    .email('Adresse email invalide')
    .trim(),
});

/**
 * Schéma de validation pour la confirmation d'email
 */
export const confirmEmailSchema = z.object({
  token: z.string()
    .min(1, 'Le token est requis')
    .trim(),
});

/**
 * Schéma de validation pour l'historique des messages
 */
export const messageHistorySchema = z.object({
  utilisateurId: z.string()
    .regex(/^\d+$/, 'L\'ID utilisateur doit être un nombre valide')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'L\'ID doit être supérieur à 0'),
  limit: z.string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10))
    .optional()
    .default('100'),
});

/**
 * Schéma de validation pour les statistiques d'emails
 */
export const emailStatsSchema = z.object({
  utilisateurId: z.string()
    .regex(/^\d+$/, 'L\'ID utilisateur doit être un nombre valide')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'L\'ID doit être supérieur à 0'),
  limit: z.string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10))
    .optional()
    .default('1000'),
});

/**
 * Types TypeScript générés à partir des schémas Zod
 */
export type SendCustomEmailInput = z.infer<typeof sendCustomEmailSchema>;
export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>;
export type SendTemplateEmailInput = z.infer<typeof sendTemplateEmailSchema>;
export type SendWelcomeEmailInput = z.infer<typeof sendWelcomeEmailSchema>;
export type SendValidationEmailInput = z.infer<typeof sendValidationEmailSchema>;
export type RecoverUserIdInput = z.infer<typeof recoverUserIdSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
export type MessageHistoryInput = z.infer<typeof messageHistorySchema>;
export type EmailStatsInput = z.infer<typeof emailStatsSchema>;
