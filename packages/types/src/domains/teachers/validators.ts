/**
 * Schémas de validation Zod pour Teachers
 *
 * Conventions:
 * - Nom des schémas en camelCase + "Schema" : createTeachersSchema
 * - Types inférés en PascalCase : CreateTeachersData
 * - Validation stricte avec messages d'erreur clairs
 */

import { z } from "zod";

/**
 * Schéma de validation pour créer un Teachers
 */
export const createTeachersSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .trim(),

  status: z
    .enum(["active", "inactive", "pending"])
    .optional()
    .default("pending"),
});

/**
 * Type inféré depuis le schéma de création
 */
export type CreateTeachersData = z.infer<typeof createTeachersSchema>;

/**
 * Schéma de validation pour mettre à jour un Teachers
 */
export const updateTeachersSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères")
    .trim()
    .optional(),

  status: z
    .enum(["active", "inactive", "pending"])
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être fourni pour la mise à jour" }
);

/**
 * Type inféré depuis le schéma de mise à jour
 */
export type UpdateTeachersData = z.infer<typeof updateTeachersSchema>;

/**
 * Schéma pour valider l'ID d'un Teachers
 */
export const teachersIdSchema = z
  .string()
  .refine((val) => /^\d+$/.test(val), {
    message: "ID doit être un nombre positif",
  })
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, {
    message: "ID doit être supérieur à 0",
  });

/**
 * Schéma pour les filtres de recherche
 */
export const teachersFilterSchema = z.object({
  status: z.enum(["active", "inactive", "pending"]).optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Type inféré pour les filtres
 */
export type TeachersFilterData = z.infer<typeof teachersFilterSchema>;

/**
 * Fonction helper pour valider un Teachers
 */
export function validateTeachers(data: unknown): CreateTeachersData {
  return createTeachersSchema.parse(data);
}

/**
 * Fonction helper pour valider de manière sûre
 */
export function safeValidateTeachers(data: unknown) {
  return createTeachersSchema.safeParse(data);
}
