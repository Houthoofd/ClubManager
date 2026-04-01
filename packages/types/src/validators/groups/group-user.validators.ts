/**
 * @fileoverview Group-User Validators
 * @module @clubmanager/types/validators/groups/group-user
 *
 * Zod schemas for validating Group-User associations (many-to-many).
 * Covers assignment/unassignment of users to/from groups.
 *
 * DB Schema Reference: SCHEMA_CONSOLIDATE.sql v4.1
 * Table: groupes_utilisateurs
 */

import { z } from "zod";
import {
  MAX_USERS_PER_BULK_ASSIGNMENT,
  GROUPS_DEFAULT_PAGE_SIZE,
  GROUPS_MAX_PAGE_SIZE,
  GROUPS_MIN_PAGE_SIZE,
  GROUPS_DEFAULT_PAGE,
  DEFAULT_SORT_ORDER,
} from "../../constants/groups.constants.js";
import {
  idSchema,
  timestampSchema,
  sortOrderSchema,
} from "../common/common.validators.js";

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for base group-user association fields
 */
export const groupUserBaseSchema = z.object({
  groupe_id: idSchema,
  utilisateur_id: idSchema,
  created_at: z.coerce.date({
    required_error: "Le timestamp est requis",
    invalid_type_error: "Format de timestamp invalide",
  }),
});

// ============================================================================
// ASSIGNMENT SCHEMAS
// ============================================================================

/**
 * Schema for assigning a user to a group
 */
export const assignUserToGroupSchema = z.object({
  utilisateur_id: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int({
      message: "L'ID de l'utilisateur doit être un entier",
    })
    .positive({
      message: "L'ID de l'utilisateur doit être un nombre positif",
    }),
  groupe_id: z
    .number({
      required_error: "L'ID du groupe est requis",
      invalid_type_error: "L'ID du groupe doit être un nombre",
    })
    .int({
      message: "L'ID du groupe doit être un entier",
    })
    .positive({
      message: "L'ID du groupe doit être un nombre positif",
    }),
});

/**
 * Schema for unassigning a user from a group
 */
export const unassignUserFromGroupSchema = z.object({
  utilisateur_id: z
    .number({
      required_error: "L'ID de l'utilisateur est requis",
      invalid_type_error: "L'ID de l'utilisateur doit être un nombre",
    })
    .int({
      message: "L'ID de l'utilisateur doit être un entier",
    })
    .positive({
      message: "L'ID de l'utilisateur doit être un nombre positif",
    }),
  groupe_id: z
    .number({
      required_error: "L'ID du groupe est requis",
      invalid_type_error: "L'ID du groupe doit être un nombre",
    })
    .int({
      message: "L'ID du groupe doit être un entier",
    })
    .positive({
      message: "L'ID du groupe doit être un nombre positif",
    }),
});

// ============================================================================
// BULK ASSIGNMENT SCHEMAS
// ============================================================================

/**
 * Schema for bulk assigning users to a group
 */
export const bulkAssignUsersSchema = z.object({
  groupe_id: z
    .number({
      required_error: "L'ID du groupe est requis",
      invalid_type_error: "L'ID du groupe doit être un nombre",
    })
    .int({
      message: "L'ID du groupe doit être un entier",
    })
    .positive({
      message: "L'ID du groupe doit être un nombre positif",
    }),
  utilisateur_ids: z
    .array(
      z
        .number({
          invalid_type_error: "Chaque ID d'utilisateur doit être un nombre",
        })
        .int({
          message: "Chaque ID d'utilisateur doit être un entier",
        })
        .positive({
          message: "Chaque ID d'utilisateur doit être un nombre positif",
        }),
      {
        required_error: "La liste des IDs d'utilisateurs est requise",
        invalid_type_error:
          "Les IDs d'utilisateurs doivent être dans un tableau",
      },
    )
    .min(1, "Au moins un ID d'utilisateur est requis")
    .max(
      MAX_USERS_PER_BULK_ASSIGNMENT,
      `Maximum ${MAX_USERS_PER_BULK_ASSIGNMENT} utilisateurs peuvent être assignés en une fois`,
    ),
});

/**
 * Schema for bulk unassigning users from a group
 */
export const bulkUnassignUsersSchema = z.object({
  groupe_id: z
    .number({
      required_error: "L'ID du groupe est requis",
      invalid_type_error: "L'ID du groupe doit être un nombre",
    })
    .int({
      message: "L'ID du groupe doit être un entier",
    })
    .positive({
      message: "L'ID du groupe doit être un nombre positif",
    }),
  utilisateur_ids: z
    .array(
      z
        .number({
          invalid_type_error: "Chaque ID d'utilisateur doit être un nombre",
        })
        .int({
          message: "Chaque ID d'utilisateur doit être un entier",
        })
        .positive({
          message: "Chaque ID d'utilisateur doit être un nombre positif",
        }),
      {
        required_error: "La liste des IDs d'utilisateurs est requise",
        invalid_type_error:
          "Les IDs d'utilisateurs doivent être dans un tableau",
      },
    )
    .min(1, "Au moins un ID d'utilisateur est requis")
    .max(
      MAX_USERS_PER_BULK_ASSIGNMENT,
      `Maximum ${MAX_USERS_PER_BULK_ASSIGNMENT} utilisateurs peuvent être désassignés en une fois`,
    ),
});

// ============================================================================
// LIST/QUERY SCHEMAS
// ============================================================================

/**
 * Valid sort fields for group users listing
 */
const groupUserSortByValues = ["created_at", "utilisateur_id"] as const;

/**
 * Schema for listing users in a group
 */
export const listGroupUsersSchema = z.object({
  groupe_id: idSchema,
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
  sort_by: z
    .enum(groupUserSortByValues, {
      errorMap: () => ({
        message: "Le champ de tri doit être 'created_at' ou 'utilisateur_id'",
      }),
    })
    .optional()
    .default("created_at"),
  sort_order: sortOrderSchema.optional().default(DEFAULT_SORT_ORDER),
});

/**
 * Valid sort fields for user groups listing
 */
const userGroupSortByValues = ["created_at", "groupe_id"] as const;

/**
 * Schema for listing groups for a user
 */
export const listUserGroupsSchema = z.object({
  utilisateur_id: idSchema,
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
  sort_by: z
    .enum(userGroupSortByValues, {
      errorMap: () => ({
        message: "Le champ de tri doit être 'created_at' ou 'groupe_id'",
      }),
    })
    .optional()
    .default("created_at"),
  sort_order: sortOrderSchema.optional().default(DEFAULT_SORT_ORDER),
});

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for a single group-user association response
 */
export const groupUserResponseSchema = groupUserBaseSchema;

/**
 * Schema for paginated group users list response
 */
export const groupUsersListResponseSchema = z.object({
  data: z.array(groupUserBaseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Schema for paginated user groups list response
 */
export const userGroupsListResponseSchema = z.object({
  data: z.array(groupUserBaseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Schema for bulk operation response
 */
export const bulkOperationResponseSchema = z.object({
  success: z.boolean(),
  assigned_count: z.number().int().nonnegative().optional(),
  unassigned_count: z.number().int().nonnegative().optional(),
  errors: z.array(z.string()).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GroupUser = z.infer<typeof groupUserBaseSchema>;
export type AssignUserToGroup = z.infer<typeof assignUserToGroupSchema>;
export type UnassignUserFromGroup = z.infer<typeof unassignUserFromGroupSchema>;
export type BulkAssignUsers = z.infer<typeof bulkAssignUsersSchema>;
export type BulkUnassignUsers = z.infer<typeof bulkUnassignUsersSchema>;
export type ListGroupUsersQuery = z.infer<typeof listGroupUsersSchema>;
export type ListUserGroupsQuery = z.infer<typeof listUserGroupsSchema>;
export type GroupUserResponse = z.infer<typeof groupUserResponseSchema>;
export type GroupUsersListResponse = z.infer<
  typeof groupUsersListResponseSchema
>;
export type UserGroupsListResponse = z.infer<
  typeof userGroupsListResponseSchema
>;
export type BulkOperationResponse = z.infer<typeof bulkOperationResponseSchema>;
export type GroupUserSortBy = (typeof groupUserSortByValues)[number];
export type UserGroupSortBy = (typeof userGroupSortByValues)[number];
