/**
 * Validators Zod pour les inscriptions aux cours
 * Schémas basés sur les DTOs et contraintes DB
 */

import { z } from "zod";
import { VALIDATION_CONSTANTS } from "../../constants/validation.constants.js";
import {
  booleanSchema,
  dateISOSchema,
  idSchema,
  idsArraySchema,
  paginationSchema,
  sortOrderSchema,
} from "../common/common.validators.js";

/**
 * Schéma pour le commentaire
 */
const commentaireSchema = z
  .string()
  .min(1, "Le commentaire doit contenir au moins 1 caractère")
  .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
  .optional();

/**
 * Schéma pour créer une inscription
 * Correspond à CreateInscriptionDto
 */
export const createInscriptionSchema = z.object({
  utilisateur_id: idSchema,
  cours_id: idSchema,
  status_id: idSchema.optional().nullable(),
  commentaire: commentaireSchema,
});

/**
 * Schéma pour mettre à jour une inscription
 * Tous les champs sont optionnels sauf l'ID
 */
export const updateInscriptionSchema = z.object({
  id: idSchema,
  status_id: idSchema.optional().nullable(),
  commentaire: commentaireSchema,
});

/**
 * Schéma pour mettre à jour la présence d'un utilisateur à un cours
 */
export const updatePresenceSchema = z.object({
  inscription_id: idSchema,
  present: z.boolean(),
  commentaire: commentaireSchema,
});

/**
 * Schéma pour créer plusieurs inscriptions en masse
 */
export const bulkCreateInscriptionSchema = z.object({
  cours_id: idSchema,
  utilisateur_ids: idsArraySchema,
  status_id: idSchema.optional().nullable(),
  commentaire: commentaireSchema,
});

/**
 * Schéma pour rechercher des inscriptions
 */
export const searchInscriptionSchema = z
  .object({
    utilisateur_id: idSchema.optional(),
    cours_id: idSchema.optional(),
    status_id: idSchema.optional(),
    present: booleanSchema.optional(),
    date_debut: dateISOSchema.optional(),
    date_fin: dateISOSchema.optional(),
    sort_by: z
      .enum(["created_at", "date_cours", "utilisateur_id", "status_id"], {
        errorMap: () => ({
          message:
            "Le tri doit être par 'created_at', 'date_cours', 'utilisateur_id' ou 'status_id'",
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
 * Schéma pour annuler une inscription
 */
export const cancelInscriptionSchema = z.object({
  id: idSchema,
  raison_annulation: z
    .string()
    .min(10, "La raison d'annulation doit contenir au moins 10 caractères")
    .max(500, "La raison d'annulation ne peut pas dépasser 500 caractères")
    .optional(),
});

/**
 * Schéma pour obtenir les inscriptions d'un utilisateur
 */
export const getUserInscriptionsSchema = z
  .object({
    utilisateur_id: idSchema,
    date_debut: dateISOSchema.optional(),
    date_fin: dateISOSchema.optional(),
    status_id: idSchema.optional(),
  })
  .merge(paginationSchema);

/**
 * Schéma pour obtenir les inscriptions d'un cours
 */
export const getCourseInscriptionsSchema = z
  .object({
    cours_id: idSchema,
    status_id: idSchema.optional(),
    present: booleanSchema.optional(),
  })
  .merge(paginationSchema);

/**
 * Schéma pour marquer plusieurs présences en masse
 */
export const bulkUpdatePresenceSchema = z.object({
  cours_id: idSchema,
  presences: z.array(
    z.object({
      inscription_id: idSchema,
      present: z.boolean(),
      commentaire: commentaireSchema,
    }),
  ),
});

/**
 * Types inférés à partir des schémas Zod
 */
export type CreateInscriptionInput = z.infer<typeof createInscriptionSchema>;
export type UpdateInscriptionInput = z.infer<typeof updateInscriptionSchema>;
export type UpdatePresenceInput = z.infer<typeof updatePresenceSchema>;
export type BulkCreateInscriptionInput = z.infer<
  typeof bulkCreateInscriptionSchema
>;
export type SearchInscriptionInput = z.infer<typeof searchInscriptionSchema>;
export type CancelInscriptionInput = z.infer<typeof cancelInscriptionSchema>;
export type GetUserInscriptionsInput = z.infer<
  typeof getUserInscriptionsSchema
>;
export type GetCourseInscriptionsInput = z.infer<
  typeof getCourseInscriptionsSchema
>;
export type BulkUpdatePresenceInput = z.infer<
  typeof bulkUpdatePresenceSchema
>;
