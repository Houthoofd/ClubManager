/**
 * @fileoverview Group Validators
 * @module @clubmanager/types/validators/groups/group
 *
 * Zod schemas for validating Groups domain operations.
 * Covers groups (user groups/roles like admin, member, professor).
 *
 * DB Schema Reference: SCHEMA_CONSOLIDATE.sql v4.1
 * Table: groupes
 */

import { z } from "zod";
import {
  GROUP_NAME_MAX_LENGTH,
  GROUP_NAME_MIN_LENGTH,
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUPS_DEFAULT_PAGE_SIZE,
  GROUPS_MAX_PAGE_SIZE,
  GROUPS_MIN_PAGE_SIZE,
  GROUPS_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from "../../constants/groups.constants.js";
import {
  idSchema,
  idStringSchema,
  idParamSchema,
  timestampSchema,
  sortOrderSchema,
} from "../common/common.validators.js";

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for base group fields (complete group object from DB)
 */
export const groupBaseSchema = z.object({
  id: idSchema,
  nom: z
    .string({
      required_error: "Le nom du groupe est requis",
      invalid_type_error: "Le nom doit être une chaîne de caractères",
    })
    .min(
      GROUP_NAME_MIN_LENGTH,
      `Le nom doit contenir au moins ${GROUP_NAME_MIN_LENGTH} caractère`,
    )
    .max(
      GROUP_NAME_MAX_LENGTH,
      `Le nom ne peut pas dépasser ${GROUP_NAME_MAX_LENGTH} caractères`,
    )
    .trim()
    .refine((val) => val.length > 0, {
      message: "Le nom ne peut pas être vide après suppression des espaces",
    }),
  description: z
    .string({
      invalid_type_error: "La description doit être une chaîne de caractères",
    })
    .max(
      GROUP_DESCRIPTION_MAX_LENGTH,
      `La description ne peut pas dépasser ${GROUP_DESCRIPTION_MAX_LENGTH} caractères`,
    )
    .trim()
    .nullable()
    .optional(),
  created_at: z.coerce.date({
    required_error: "Le timestamp est requis",
    invalid_type_error: "Format de timestamp invalide",
  }),
  updated_at: z.coerce
    .date({
      invalid_type_error: "Format de timestamp invalide",
    })
    .nullable()
    .optional(),
});

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new group
 * Excludes: id, created_at, updated_at (auto-generated)
 */
export const createGroupSchema = z.object({
  nom: z
    .string({
      required_error: "Le nom du groupe est requis",
      invalid_type_error: "Le nom doit être une chaîne de caractères",
    })
    .min(
      GROUP_NAME_MIN_LENGTH,
      `Le nom doit contenir au moins ${GROUP_NAME_MIN_LENGTH} caractère`,
    )
    .max(
      GROUP_NAME_MAX_LENGTH,
      `Le nom ne peut pas dépasser ${GROUP_NAME_MAX_LENGTH} caractères`,
    )
    .trim()
    .refine((val) => val.length > 0, {
      message: "Le nom ne peut pas être vide après suppression des espaces",
    }),
  description: z
    .string({
      invalid_type_error: "La description doit être une chaîne de caractères",
    })
    .max(
      GROUP_DESCRIPTION_MAX_LENGTH,
      `La description ne peut pas dépasser ${GROUP_DESCRIPTION_MAX_LENGTH} caractères`,
    )
    .trim()
    .nullable()
    .optional(),
});

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating an existing group
 * All fields are optional (partial update)
 */
export const updateGroupSchema = z
  .object({
    nom: z
      .string({
        invalid_type_error: "Le nom doit être une chaîne de caractères",
      })
      .min(
        GROUP_NAME_MIN_LENGTH,
        `Le nom doit contenir au moins ${GROUP_NAME_MIN_LENGTH} caractère`,
      )
      .max(
        GROUP_NAME_MAX_LENGTH,
        `Le nom ne peut pas dépasser ${GROUP_NAME_MAX_LENGTH} caractères`,
      )
      .trim()
      .refine((val) => val.length > 0, {
        message: "Le nom ne peut pas être vide après suppression des espaces",
      })
      .optional(),
    description: z
      .string({
        invalid_type_error: "La description doit être une chaîne de caractères",
      })
      .max(
        GROUP_DESCRIPTION_MAX_LENGTH,
        `La description ne peut pas dépasser ${GROUP_DESCRIPTION_MAX_LENGTH} caractères`,
      )
      .trim()
      .nullable()
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
  });

// ============================================================================
// LIST/QUERY SCHEMAS
// ============================================================================

/**
 * Valid sort fields for groups listing
 */
const groupSortByValues = ["nom", "created_at", "updated_at"] as const;

/**
 * Schema for listing/filtering groups
 */
export const listGroupsSchema = z.object({
  page: z
    .number()
    .int()
    .positive({
      message: "Le numéro de page doit être un nombre positif",
    })
    .optional()
    .default(GROUPS_DEFAULT_PAGE),
  limit: z
    .number()
    .int()
    .min(
      GROUPS_MIN_PAGE_SIZE,
      `La limite minimale est de ${GROUPS_MIN_PAGE_SIZE}`,
    )
    .max(
      GROUPS_MAX_PAGE_SIZE,
      `La limite maximale est de ${GROUPS_MAX_PAGE_SIZE}`,
    )
    .optional()
    .default(GROUPS_DEFAULT_PAGE_SIZE),
  search: z
    .string()
    .min(1, "Le terme de recherche ne peut pas être vide")
    .max(100, "Le terme de recherche est trop long (max 100 caractères)")
    .trim()
    .optional(),
  sort_by: z
    .enum(groupSortByValues, {
      errorMap: () => ({
        message:
          "Le champ de tri doit être 'nom', 'created_at' ou 'updated_at'",
      }),
    })
    .optional()
    .default("nom"),
  sort_order: sortOrderSchema.optional().default(DEFAULT_SORT_ORDER),
});

// ============================================================================
// ID SCHEMAS
// ============================================================================

/**
 * Schema for numeric group ID
 */
export const groupIdSchema = idSchema;

/**
 * Schema for group ID as string (from URL params)
 */
export const groupIdStringSchema = idStringSchema;

/**
 * Schema for group ID in URL params
 */
export const groupIdParamSchema = idParamSchema;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for a single group response
 */
export const groupResponseSchema = groupBaseSchema;

/**
 * Schema for paginated groups list response
 */
export const groupsListResponseSchema = z.object({
  data: z.array(groupBaseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Schema for group statistics
 */
export const groupStatsSchema = z.object({
  total_groups: z.number().int().nonnegative({
    message: "Le nombre total de groupes doit être positif ou nul",
  }),
  total_users_assigned: z.number().int().nonnegative({
    message: "Le nombre total d'utilisateurs assignés doit être positif ou nul",
  }),
  groups_with_users: z.number().int().nonnegative({
    message: "Le nombre de groupes avec utilisateurs doit être positif ou nul",
  }),
  groups_without_users: z.number().int().nonnegative({
    message: "Le nombre de groupes sans utilisateurs doit être positif ou nul",
  }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Group = z.infer<typeof groupBaseSchema>;
export type CreateGroup = z.infer<typeof createGroupSchema>;
export type UpdateGroup = z.infer<typeof updateGroupSchema>;
export type ListGroupsQuery = z.infer<typeof listGroupsSchema>;
export type GroupIdParam = z.infer<typeof groupIdParamSchema>;
export type GroupResponse = z.infer<typeof groupResponseSchema>;
export type GroupsListResponse = z.infer<typeof groupsListResponseSchema>;
export type GroupStats = z.infer<typeof groupStatsSchema>;
export type GroupSortBy = (typeof groupSortByValues)[number];
