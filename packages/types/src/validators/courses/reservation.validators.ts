/**
 * Validators Zod pour les réservations de cours
 * Schémas basés sur les DTOs et contraintes DB
 */

import { z } from "zod";
import { VALIDATION_CONSTANTS } from "../../constants/validation.constants.js";
import {
  booleanSchema,
  dateISOSchema,
  idSchema,
  paginationSchema,
  sortOrderSchema,
} from "../common/common.validators.js";

/**
 * Schéma pour créer une réservation
 * Correspond à CreateReservationDto
 */
export const createReservationSchema = z.object({
  utilisateur_id: idSchema,
  cours_id: idSchema,
});

/**
 * Schéma pour annuler une réservation
 */
export const cancelReservationSchema = z.object({
  id: idSchema,
  raison_annulation: z
    .string()
    .min(10, "La raison d'annulation doit contenir au moins 10 caractères")
    .max(500, "La raison d'annulation ne peut pas dépasser 500 caractères")
    .optional(),
});

/**
 * Schéma pour rechercher des réservations
 */
export const searchReservationSchema = z
  .object({
    utilisateur_id: idSchema.optional(),
    cours_id: idSchema.optional(),
    date_debut: dateISOSchema.optional(),
    date_fin: dateISOSchema.optional(),
    status: z
      .enum(["active", "cancelled", "converted"], {
        errorMap: () => ({
          message:
            "Le statut doit être 'active', 'cancelled' ou 'converted'",
        }),
      })
      .optional(),
    sort_by: z
      .enum(["created_at", "date_cours", "utilisateur_id"], {
        errorMap: () => ({
          message:
            "Le tri doit être par 'created_at', 'date_cours' ou 'utilisateur_id'",
        }),
      })
      .default("created_at")
      .optional(),
    sort_order: sortOrderSchema.default("desc").optional(),
  })
  .merge(paginationSchema)
  .refine(
    (data) => {
      // Si date_debut et date_fin sont présentes, vérifier que date_fin >= date_debut
      if (data.date_debut && data.date_fin) {
        return new Date(data.date_fin) >= new Date(data.date_debut);
      }
      return true;
    },
    {
      message: "La date de fin doit être supérieure ou égale à la date de début",
      path: ["date_fin"],
    },
  );

/**
 * Schéma pour vérifier la disponibilité d'un cours
 */
export const checkAvailabilitySchema = z.object({
  cours_id: idSchema,
  utilisateur_id: idSchema.optional(),
});

/**
 * Schéma pour obtenir les réservations d'un utilisateur
 */
export const getUserReservationsSchema = z
  .object({
    utilisateur_id: idSchema,
    date_debut: dateISOSchema.optional(),
    date_fin: dateISOSchema.optional(),
    status: z
      .enum(["active", "cancelled", "converted"], {
        errorMap: () => ({
          message:
            "Le statut doit être 'active', 'cancelled' ou 'converted'",
        }),
      })
      .optional(),
  })
  .merge(paginationSchema);

/**
 * Schéma pour obtenir les réservations d'un cours
 */
export const getCourseReservationsSchema = z
  .object({
    cours_id: idSchema,
    status: z
      .enum(["active", "cancelled", "converted"], {
        errorMap: () => ({
          message:
            "Le statut doit être 'active', 'cancelled' ou 'converted'",
        }),
      })
      .optional(),
  })
  .merge(paginationSchema);

/**
 * Schéma pour convertir une réservation en inscription
 */
export const convertReservationToInscriptionSchema = z.object({
  reservation_id: idSchema,
  status_id: idSchema.optional().nullable(),
  commentaire: z
    .string()
    .min(1, "Le commentaire doit contenir au moins 1 caractère")
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
    .optional(),
});

/**
 * Schéma pour vérifier les conflits de réservation
 */
export const checkReservationConflictSchema = z.object({
  utilisateur_id: idSchema,
  cours_id: idSchema,
  date_cours: dateISOSchema,
});

/**
 * Types inférés à partir des schémas Zod
 */
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
export type SearchReservationInput = z.infer<typeof searchReservationSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type GetUserReservationsInput = z.infer<
  typeof getUserReservationsSchema
>;
export type GetCourseReservationsInput = z.infer<
  typeof getCourseReservationsSchema
>;
export type ConvertReservationToInscriptionInput = z.infer<
  typeof convertReservationToInscriptionSchema
>;
export type CheckReservationConflictInput = z.infer<
  typeof checkReservationConflictSchema
>;
