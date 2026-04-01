/**
 * Validators Zod communs
 * Schémas réutilisables pour ID, dates, pagination, etc.
 */

import { z } from "zod";
import {
  DATE_ISO_REGEX,
  VALIDATION_CONSTANTS,
  VALIDATION_ERRORS,
} from "../../constants/validation.constants.js";

/**
 * Schéma pour un ID numérique (utilisé dans les params/body)
 */
export const idSchema = z.number().int().positive({
  message: "L'ID doit être un nombre positif",
});

/**
 * Schéma pour un ID en string (utilisé dans les params d'URL)
 */
export const idStringSchema = z
  .string()
  .regex(/^\d+$/, "L'ID doit être un nombre")
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, {
    message: "L'ID doit être un nombre positif",
  });

/**
 * Schéma pour un userId (format U-YYYY-XXXX)
 */
export const userIdSchema = z
  .string()
  .regex(/^U-\d{4}-\d{4}$/, "Format userId invalide (attendu: U-YYYY-XXXX)");

/**
 * Schéma pour une date ISO (YYYY-MM-DD)
 */
export const dateISOSchema = z
  .string()
  .regex(DATE_ISO_REGEX, VALIDATION_ERRORS.INVALID_DATE);

/**
 * Schéma pour une date ISO optionnelle
 */
export const dateISOOptionalSchema = dateISOSchema.optional();

/**
 * Schéma pour une date JavaScript
 */
export const dateSchema = z.date({
  required_error: "La date est requise",
  invalid_type_error: "Format de date invalide",
});

/**
 * Schéma pour une date optionnelle
 */
export const dateOptionalSchema = dateSchema.optional().nullable();

/**
 * Schéma pour un timestamp (utilisé pour created_at, updated_at, etc.)
 */
export const timestampSchema = z.date({
  required_error: "Le timestamp est requis",
  invalid_type_error: "Format de timestamp invalide",
});

/**
 * Schéma pour valider qu'une date est dans le passé
 */
export const pastDateSchema = z
  .string()
  .regex(DATE_ISO_REGEX, VALIDATION_ERRORS.INVALID_DATE)
  .refine(
    (date) => {
      const inputDate = new Date(date);
      return inputDate < new Date();
    },
    { message: "La date doit être dans le passé" },
  );

/**
 * Schéma pour valider qu'une date est dans le futur
 */
export const futureDateSchema = z
  .string()
  .regex(DATE_ISO_REGEX, VALIDATION_ERRORS.INVALID_DATE)
  .refine(
    (date) => {
      const inputDate = new Date(date);
      return inputDate > new Date();
    },
    { message: "La date doit être dans le futur" },
  );

/**
 * Schéma pour valider l'âge (5-120 ans)
 */
export const ageValidationSchema = z
  .string()
  .regex(DATE_ISO_REGEX, VALIDATION_ERRORS.INVALID_DATE)
  .refine(
    (date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        return (
          age - 1 >= VALIDATION_CONSTANTS.USER.AGE.MIN &&
          age - 1 <= VALIDATION_CONSTANTS.USER.AGE.MAX
        );
      }

      return (
        age >= VALIDATION_CONSTANTS.USER.AGE.MIN &&
        age <= VALIDATION_CONSTANTS.USER.AGE.MAX
      );
    },
    {
      message: `L'âge doit être entre ${VALIDATION_CONSTANTS.USER.AGE.MIN} et ${VALIDATION_CONSTANTS.USER.AGE.MAX} ans`,
    },
  );

/**
 * Schéma pour la pagination
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .default(VALIDATION_CONSTANTS.PAGINATION.DEFAULT_PAGE),
  limit: z
    .number()
    .int()
    .positive()
    .max(
      VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT,
      `La limite maximale est de ${VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT} éléments`,
    )
    .optional()
    .default(VALIDATION_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
});

/**
 * Schéma pour la pagination en query params (strings)
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Le numéro de page doit être un nombre")
    .transform((val) => parseInt(val, 10))
    .default(String(VALIDATION_CONSTANTS.PAGINATION.DEFAULT_PAGE))
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, "La limite doit être un nombre")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val <= VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT, {
      message: `La limite maximale est de ${VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT} éléments`,
    })
    .default(String(VALIDATION_CONSTANTS.PAGINATION.DEFAULT_LIMIT))
    .optional(),
});

/**
 * Schéma pour un boolean (utilisé dans les query params)
 */
export const booleanSchema = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    return val === "true" || val === "1";
  });

/**
 * Schéma pour un array d'IDs
 */
export const idsArraySchema = z
  .array(idSchema)
  .min(1, "Au moins un ID est requis");

/**
 * Schéma pour recherche/filtre par texte
 */
export const searchQuerySchema = z
  .string()
  .min(1, "Le terme de recherche ne peut pas être vide")
  .max(100, "Le terme de recherche est trop long (max 100 caractères)")
  .optional();

/**
 * Schéma pour tri (order by)
 */
export const sortOrderSchema = z.enum(["asc", "desc"], {
  errorMap: () => ({
    message: "L'ordre doit être 'asc' ou 'desc'",
  }),
});

/**
 * Schéma pour un paramètre d'ID dans l'URL
 */
export const idParamSchema = z.object({
  id: idStringSchema,
});

/**
 * Schéma pour un paramètre userId dans l'URL
 */
export const userIdParamSchema = z.object({
  userId: userIdSchema,
});

/**
 * Type inféré pour pagination
 */
export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Type inféré pour pagination query
 */
export type PaginationQueryParams = z.infer<typeof paginationQuerySchema>;

/**
 * Type inféré pour search
 */
export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Type inféré pour sort order
 */
export type SortOrder = z.infer<typeof sortOrderSchema>;
