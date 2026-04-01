/**
 * Validators Zod pour les cours
 * Schémas basés sur les DTOs et contraintes DB
 */

import { z } from "zod";
import { VALIDATION_CONSTANTS } from "../../constants/validation.constants.js";
import {
  booleanSchema,
  dateISOSchema,
  idSchema,
  paginationSchema,
  searchQuerySchema,
  sortOrderSchema,
} from "../common/common.validators.js";

/**
 * Schéma pour le type de cours
 */
const typeCourseSchema = z
  .string()
  .min(1, "Le type de cours doit contenir au moins 1 caractère")
  .max(50, "Le type de cours ne peut pas dépasser 50 caractères");

/**
 * Schéma pour l'heure au format HH:MM
 */
const timeSchema = z
  .string()
  .regex(
    /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    "L'heure doit être au format HH:MM (00:00 à 23:59)",
  );

/**
 * Schéma pour créer un cours
 * Correspond à CreateCourseDto
 */
export const createCourseSchema = z
  .object({
    date_cours: dateISOSchema,
    type_cours: typeCourseSchema,
    heure_debut: timeSchema,
    heure_fin: timeSchema,
    cours_recurrent_id: idSchema.optional().nullable(),
    annule: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Vérifier que heure_fin > heure_debut
      const [heureDebutH, heureDebutM] = data.heure_debut
        .split(":")
        .map(Number);
      const [heureFinH, heureFinM] = data.heure_fin.split(":").map(Number);
      const debutMinutes = heureDebutH * 60 + heureDebutM;
      const finMinutes = heureFinH * 60 + heureFinM;
      return finMinutes > debutMinutes;
    },
    {
      message: "L'heure de fin doit être supérieure à l'heure de début",
      path: ["heure_fin"],
    },
  );

/**
 * Schéma pour mettre à jour un cours
 * Tous les champs sont optionnels sauf l'ID
 */
export const updateCourseSchema = z
  .object({
    id: idSchema,
    date_cours: dateISOSchema.optional(),
    type_cours: typeCourseSchema.optional(),
    heure_debut: timeSchema.optional(),
    heure_fin: timeSchema.optional(),
    cours_recurrent_id: idSchema.optional().nullable(),
    annule: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Si les deux heures sont présentes, vérifier que heure_fin > heure_debut
      if (data.heure_debut && data.heure_fin) {
        const [heureDebutH, heureDebutM] = data.heure_debut
          .split(":")
          .map(Number);
        const [heureFinH, heureFinM] = data.heure_fin.split(":").map(Number);
        const debutMinutes = heureDebutH * 60 + heureDebutM;
        const finMinutes = heureFinH * 60 + heureFinM;
        return finMinutes > debutMinutes;
      }
      return true;
    },
    {
      message: "L'heure de fin doit être supérieure à l'heure de début",
      path: ["heure_fin"],
    },
  );

/**
 * Schéma pour annuler un cours
 */
export const cancelCourseSchema = z.object({
  id: idSchema,
  annule: z.boolean(),
  raison_annulation: z
    .string()
    .min(10, "La raison d'annulation doit contenir au moins 10 caractères")
    .max(500, "La raison d'annulation ne peut pas dépasser 500 caractères")
    .optional(),
});

/**
 * Schéma pour rechercher des cours
 */
export const searchCourseSchema = z
  .object({
    type_cours: searchQuerySchema,
    date_debut: dateISOSchema.optional(),
    date_fin: dateISOSchema.optional(),
    annule: booleanSchema.optional(),
    cours_recurrent_id: idSchema.optional(),
    professeur_id: idSchema.optional(),
    sort_by: z
      .enum(["date_cours", "type_cours", "heure_debut", "created_at"], {
        errorMap: () => ({
          message:
            "Le tri doit être par 'date_cours', 'type_cours', 'heure_debut' ou 'created_at'",
        }),
      })
      .default("date_cours")
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
 * Schéma pour dupliquer un cours
 */
export const duplicateCourseSchema = z.object({
  id: idSchema,
  nouvelle_date: dateISOSchema,
});

/**
 * Schéma pour générer des cours à partir d'un cours récurrent
 */
export const generateCoursesFromRecurrentSchema = z.object({
  cours_recurrent_id: idSchema,
  date_debut: dateISOSchema,
  date_fin: dateISOSchema,
});

/**
 * Types inférés à partir des schémas Zod
 */
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CancelCourseInput = z.infer<typeof cancelCourseSchema>;
export type SearchCourseInput = z.infer<typeof searchCourseSchema>;
export type DuplicateCourseInput = z.infer<typeof duplicateCourseSchema>;
export type GenerateCoursesFromRecurrentInput = z.infer<
  typeof generateCoursesFromRecurrentSchema
>;
