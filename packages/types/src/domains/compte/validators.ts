/**
 * Validators Zod pour le module Compte
 * Centralise toutes les validations liées aux comptes utilisateurs
 */

import { z } from "zod";

// ============================================
// SCHEMAS DE BASE
// ============================================

/**
 * Schema pour l'email
 */
export const EmailSchema = z
  .string()
  .email("Email invalide")
  .min(5, "L'email doit contenir au moins 5 caractères")
  .max(255, "L'email ne peut pas dépasser 255 caractères")
  .toLowerCase()
  .trim();

/**
 * Schema pour le téléphone
 */
export const PhoneSchema = z
  .string()
  .min(10, "Le numéro de téléphone doit contenir au moins 10 caractères")
  .max(20, "Le numéro de téléphone ne peut pas dépasser 20 caractères")
  .regex(
    /^[0-9+\-() ]+$/,
    "Le numéro de téléphone contient des caractères invalides",
  )
  .trim()
  .optional();

/**
 * Schema pour le nom
 */
export const NameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(100, "Le nom ne peut pas dépasser 100 caractères")
  .trim();

/**
 * Schema pour le mot de passe
 */
export const PasswordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre",
  );

/**
 * Schema pour la date de naissance
 */
export const DateOfBirthSchema = z
  .string()
  .datetime()
  .or(z.date())
  .transform((val) => (typeof val === "string" ? new Date(val) : val))
  .refine(
    (date) => {
      const age =
        (new Date().getTime() - date.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      return age >= 5 && age <= 120;
    },
    { message: "L'âge doit être entre 5 et 120 ans" },
  )
  .optional();

// ============================================
// SCHEMAS POUR LES QUERIES
// ============================================

/**
 * Schema pour obtenir un compte par ID
 */
export const GetCompteByIdSchema = z.object({
  utilisateurId: z
    .number()
    .int()
    .positive("L'ID utilisateur doit être positif"),
});

export type GetCompteByIdInput = z.infer<typeof GetCompteByIdSchema>;

/**
 * Schema pour obtenir un compte par nom et prénom
 */
export const GetCompteByNomPrenomSchema = z.object({
  prenom: NameSchema,
  nom: NameSchema,
});

export type GetCompteByNomPrenomInput = z.infer<
  typeof GetCompteByNomPrenomSchema
>;

/**
 * Schema pour obtenir les informations complètes d'un compte
 */
export const GetInformationsCompteSchema = z.object({
  prenom: NameSchema,
  nom: NameSchema,
});

export type GetInformationsCompteInput = z.infer<
  typeof GetInformationsCompteSchema
>;

// ============================================
// SCHEMAS POUR LES MUTATIONS
// ============================================

/**
 * Schema pour mettre à jour un compte
 */
export const UpdateCompteSchema = z
  .object({
    first_name: NameSchema.optional(),
    last_name: NameSchema.optional(),
    email: EmailSchema.optional(),
    date_of_birth: DateOfBirthSchema,
    phone: PhoneSchema,
    genre_id: z.number().int().positive().optional(),
    grade_id: z.number().int().positive().optional(),
    abonnement_id: z.number().int().positive().optional(),
    status_id: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

export type UpdateCompteInput = z.infer<typeof UpdateCompteSchema>;

/**
 * Schema pour changer le mot de passe
 */
export const ChangePasswordSchema = z
  .object({
    utilisateur_id: z
      .number()
      .int()
      .positive("L'ID utilisateur doit être positif"),
    current_password: PasswordSchema.optional(),
    new_password: PasswordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Schema pour créer un mot de passe (premier login)
 */
export const CreatePasswordSchema = z
  .object({
    utilisateur_id: z
      .number()
      .int()
      .positive("L'ID utilisateur doit être positif"),
    new_password: PasswordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  });

export type CreatePasswordInput = z.infer<typeof CreatePasswordSchema>;

/**
 * Schema pour mettre à jour le mot de passe (interne)
 */
export const UpdatePasswordSchema = z.object({
  utilisateur_id: z
    .number()
    .int()
    .positive("L'ID utilisateur doit être positif"),
  new_password: PasswordSchema,
  is_creation: z.boolean().optional().default(false),
});

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

/**
 * Schema pour supprimer un compte
 */
export const DeleteCompteSchema = z.object({
  utilisateurId: z
    .number()
    .int()
    .positive("L'ID utilisateur doit être positif"),
});

export type DeleteCompteInput = z.infer<typeof DeleteCompteSchema>;

// ============================================
// SCHEMAS POUR LES CONVERSIONS
// ============================================

/**
 * Schema pour la conversion nom -> ID
 */
export const ConversionInputSchema = z.object({
  genres: z.union([z.string(), z.number()]).optional(),
  grades: z.union([z.string(), z.number()]).optional(),
  status: z.union([z.string(), z.number()]).optional(),
  abonnement: z.union([z.string(), z.number()]).optional(),
});

export type ConversionInputType = z.infer<typeof ConversionInputSchema>;

/**
 * Schema pour obtenir l'ID d'un genre
 */
export const GetGenreIdSchema = z.object({
  genreName: z.string().min(1, "Le nom du genre est requis"),
});

export type GetGenreIdInput = z.infer<typeof GetGenreIdSchema>;

/**
 * Schema pour obtenir l'ID d'un grade
 */
export const GetGradeIdSchema = z.object({
  gradeName: z.string().min(1, "Le nom du grade est requis"),
});

export type GetGradeIdInput = z.infer<typeof GetGradeIdSchema>;

/**
 * Schema pour obtenir l'ID d'un status
 */
export const GetStatusIdSchema = z.object({
  statusName: z.string().min(1, "Le nom du status est requis"),
});

export type GetStatusIdInput = z.infer<typeof GetStatusIdSchema>;

/**
 * Schema pour obtenir l'ID d'un abonnement
 */
export const GetAbonnementIdSchema = z.object({
  abonnementName: z.string().min(1, "Le nom de l'abonnement est requis"),
});

export type GetAbonnementIdInput = z.infer<typeof GetAbonnementIdSchema>;

// ============================================
// SCHEMAS POUR LES PARAMETRES D'URL
// ============================================

/**
 * Schema pour valider un ID utilisateur en paramètre
 */
export const CompteUtilisateurIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "L'ID utilisateur doit être un nombre positif",
    }),
});

// ============================================
// EXPORTS GROUPÉS
// ============================================

export const compteValidators = {
  // Queries
  getById: GetCompteByIdSchema,
  getByNomPrenom: GetCompteByNomPrenomSchema,
  getInformations: GetInformationsCompteSchema,

  // Mutations
  updateCompte: UpdateCompteSchema,
  changePassword: ChangePasswordSchema,
  createPassword: CreatePasswordSchema,
  updatePassword: UpdatePasswordSchema,
  deleteCompte: DeleteCompteSchema,

  // Conversions
  conversionInput: ConversionInputSchema,
  getGenreId: GetGenreIdSchema,
  getGradeId: GetGradeIdSchema,
  getStatusId: GetStatusIdSchema,
  getAbonnementId: GetAbonnementIdSchema,

  // Params
  utilisateurIdParam: CompteUtilisateurIdParamSchema,

  // Base schemas
  email: EmailSchema,
  phone: PhoneSchema,
  name: NameSchema,
  password: PasswordSchema,
  dateOfBirth: DateOfBirthSchema,
};
