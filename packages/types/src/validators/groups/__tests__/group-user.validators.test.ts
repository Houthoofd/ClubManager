/**
 * @fileoverview Comprehensive Tests for Group-User Validators
 * @module @clubmanager/types/validators/groups/__tests__/group-user
 *
 * Tests all Zod schemas from group-user.validators.ts with comprehensive coverage:
 * - groupUserBaseSchema
 * - assignUserToGroupSchema
 * - unassignUserFromGroupSchema
 * - bulkAssignUsersSchema
 * - bulkUnassignUsersSchema
 * - listGroupUsersSchema
 * - listUserGroupsSchema
 * - groupUserResponseSchema
 * - groupUsersListResponseSchema
 * - userGroupsListResponseSchema
 * - bulkOperationResponseSchema
 * - Type inference
 */

import { describe, it, expect } from "@jest/globals";
import {
  groupUserBaseSchema,
  assignUserToGroupSchema,
  unassignUserFromGroupSchema,
  bulkAssignUsersSchema,
  bulkUnassignUsersSchema,
  listGroupUsersSchema,
  listUserGroupsSchema,
  groupUserResponseSchema,
  groupUsersListResponseSchema,
  userGroupsListResponseSchema,
  bulkOperationResponseSchema,
  type GroupUser,
  type AssignUserToGroup,
  type UnassignUserFromGroup,
  type BulkAssignUsers,
  type BulkUnassignUsers,
  type ListGroupUsersQuery,
  type ListUserGroupsQuery,
  type GroupUserResponse,
  type GroupUsersListResponse,
  type UserGroupsListResponse,
  type BulkOperationResponse,
} from "../group-user.validators.js";
import {
  MAX_USERS_PER_BULK_ASSIGNMENT,
  GROUPS_DEFAULT_PAGE_SIZE,
  GROUPS_MAX_PAGE_SIZE,
  GROUPS_DEFAULT_PAGE,
} from "../../../constants/groups.constants.js";

describe("Group-User Validators", () => {
  // ============================================================================
  // groupUserBaseSchema - Base group-user association schema
  // ============================================================================
  describe("groupUserBaseSchema", () => {
    it("devrait valider une association valide avec tous les champs", () => {
      const validAssociation = {
        groupe_id: 1,
        utilisateur_id: 100,
        created_at: new Date("2024-01-15T10:00:00Z"),
      };
      const result = groupUserBaseSchema.safeParse(validAssociation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupe_id).toBe(1);
        expect(result.data.utilisateur_id).toBe(100);
        expect(result.data.created_at).toEqual(new Date("2024-01-15T10:00:00Z"));
      }
    });

    it("devrait coercer une string en Date pour created_at", () => {
      const validAssociation = {
        groupe_id: 1,
        utilisateur_id: 100,
        created_at: "2024-01-15T10:00:00Z",
      };
      const result = groupUserBaseSchema.safeParse(validAssociation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_at).toBeInstanceOf(Date);
      }
    });

    it("devrait rejeter si groupe_id est manquant", () => {
      const invalidAssociation = {
        utilisateur_id: 100,
        created_at: new Date(),
      };
      const result = groupUserBaseSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidAssociation = {
        groupe_id: 1,
        created_at: new Date(),
      };
      const result = groupUserBaseSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si created_at est manquant", () => {
      const invalidAssociation = {
        groupe_id: 1,
        utilisateur_id: 100,
      };
      const result = groupUserBaseSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est 0", () => {
      const invalidAssociation = {
        groupe_id: 0,
        utilisateur_id: 100,
        created_at: new Date(),
      };
      const result = groupUserBaseSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidAssociation = {
        groupe_id: 1,
        utilisateur_id: 0,
        created_at: new Date(),
      };
      const result = groupUserBaseSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est négatif", () => {
      const invalidAssociation = {
        groupe_id: -1,
        utilisateur_id: 100,
        created_at: new Date(),
      };
      const result = groupUserBaseSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidAssociation = {
        groupe_id: 1,
        utilisateur_id: -1,
        created_at: new Date(),
      };
      const result = groupUserBaseSchema.safeParse(invalidAssociation);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // assignUserToGroupSchema - Schema for assigning a user to a group
  // ============================================================================
  describe("assignUserToGroupSchema", () => {
    it("devrait valider une assignation valide", () => {
      const validAssignment = {
        utilisateur_id: 100,
        groupe_id: 1,
      };
      const result = assignUserToGroupSchema.safeParse(validAssignment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(100);
        expect(result.data.groupe_id).toBe(1);
      }
    });

    it("devrait valider avec des IDs élevés", () => {
      const validAssignment = {
        utilisateur_id: 999999,
        groupe_id: 888888,
      };
      const result = assignUserToGroupSchema.safeParse(validAssignment);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidAssignment = {
        groupe_id: 1,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("requis");
      }
    });

    it("devrait rejeter si groupe_id est manquant", () => {
      const invalidAssignment = {
        utilisateur_id: 100,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("requis");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidAssignment = {
        utilisateur_id: 0,
        groupe_id: 1,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positif");
      }
    });

    it("devrait rejeter si groupe_id est 0", () => {
      const invalidAssignment = {
        utilisateur_id: 100,
        groupe_id: 0,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidAssignment = {
        utilisateur_id: -1,
        groupe_id: 1,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est négatif", () => {
      const invalidAssignment = {
        utilisateur_id: 100,
        groupe_id: -1,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est un décimal", () => {
      const invalidAssignment = {
        utilisateur_id: 100.5,
        groupe_id: 1,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("entier");
      }
    });

    it("devrait rejeter si groupe_id est un décimal", () => {
      const invalidAssignment = {
        utilisateur_id: 100,
        groupe_id: 1.5,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est une string", () => {
      const invalidAssignment = {
        utilisateur_id: "100",
        groupe_id: 1,
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nombre");
      }
    });

    it("devrait rejeter si groupe_id est une string", () => {
      const invalidAssignment = {
        utilisateur_id: 100,
        groupe_id: "1",
      };
      const result = assignUserToGroupSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // unassignUserFromGroupSchema - Schema for unassigning a user from a group
  // ============================================================================
  describe("unassignUserFromGroupSchema", () => {
    it("devrait valider une désassignation valide", () => {
      const validUnassignment = {
        utilisateur_id: 100,
        groupe_id: 1,
      };
      const result = unassignUserFromGroupSchema.safeParse(validUnassignment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(100);
        expect(result.data.groupe_id).toBe(1);
      }
    });

    it("devrait valider avec des IDs élevés", () => {
      const validUnassignment = {
        utilisateur_id: 999999,
        groupe_id: 888888,
      };
      const result = unassignUserFromGroupSchema.safeParse(validUnassignment);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidUnassignment = {
        groupe_id: 1,
      };
      const result = unassignUserFromGroupSchema.safeParse(invalidUnassignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est manquant", () => {
      const invalidUnassignment = {
        utilisateur_id: 100,
      };
      const result = unassignUserFromGroupSchema.safeParse(invalidUnassignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidUnassignment = {
        utilisateur_id: 0,
        groupe_id: 1,
      };
      const result = unassignUserFromGroupSchema.safeParse(invalidUnassignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est 0", () => {
      const invalidUnassignment = {
        utilisateur_id: 100,
        groupe_id: 0,
      };
      const result = unassignUserFromGroupSchema.safeParse(invalidUnassignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidUnassignment = {
        utilisateur_id: -1,
        groupe_id: 1,
      };
      const result = unassignUserFromGroupSchema.safeParse(invalidUnassignment);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est négatif", () => {
      const invalidUnassignment = {
        utilisateur_id: 100,
        groupe_id: -1,
      };
      const result = unassignUserFromGroupSchema.safeParse(invalidUnassignment);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkAssignUsersSchema - Schema for bulk assigning users to a group
  // ============================================================================
  describe("bulkAssignUsersSchema", () => {
    it("devrait valider une assignation en masse valide", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [100, 101, 102],
      };
      const result = bulkAssignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupe_id).toBe(1);
        expect(result.data.utilisateur_ids).toHaveLength(3);
      }
    });

    it("devrait valider avec un seul utilisateur", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [100],
      };
      const result = bulkAssignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_ids).toHaveLength(1);
      }
    });

    it("devrait valider avec plusieurs utilisateurs", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
      const result = bulkAssignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 100 utilisateurs (maximum)", () => {
      const manyIds = Array.from({ length: MAX_USERS_PER_BULK_ASSIGNMENT }, (_, i) => i + 1);
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: manyIds,
      };
      const result = bulkAssignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_ids).toHaveLength(MAX_USERS_PER_BULK_ASSIGNMENT);
      }
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [5, 2, 8, 1, 3],
      };
      const result = bulkAssignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkAssignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si groupe_id est manquant", () => {
      const invalidBulk = {
        utilisateur_ids: [100, 101],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_ids est manquant", () => {
      const invalidBulk = {
        groupe_id: 1,
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("requise");
      }
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins");
      }
    });

    it("devrait rejeter plus de 100 utilisateurs", () => {
      const tooManyIds = Array.from({ length: MAX_USERS_PER_BULK_ASSIGNMENT + 1 }, (_, i) => i + 1);
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: tooManyIds,
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Maximum");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, 0, 3],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, -1, 3],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, "3", 4],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, 3.5, 4],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, null, 3],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, undefined, 3],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_ids n'est pas un array", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: 100,
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("tableau");
      }
    });

    it("devrait rejeter si utilisateur_ids est une string", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: "100,101,102",
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est 0", () => {
      const invalidBulk = {
        groupe_id: 0,
        utilisateur_ids: [100, 101],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est négatif", () => {
      const invalidBulk = {
        groupe_id: -1,
        utilisateur_ids: [100, 101],
      };
      const result = bulkAssignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkUnassignUsersSchema - Schema for bulk unassigning users from a group
  // ============================================================================
  describe("bulkUnassignUsersSchema", () => {
    it("devrait valider une désassignation en masse valide", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [100, 101, 102],
      };
      const result = bulkUnassignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupe_id).toBe(1);
        expect(result.data.utilisateur_ids).toHaveLength(3);
      }
    });

    it("devrait valider avec un seul utilisateur", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [100],
      };
      const result = bulkUnassignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs utilisateurs", () => {
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 2, 3, 4, 5],
      };
      const result = bulkUnassignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 100 utilisateurs (maximum)", () => {
      const manyIds = Array.from({ length: MAX_USERS_PER_BULK_ASSIGNMENT }, (_, i) => i + 1);
      const validBulk = {
        groupe_id: 1,
        utilisateur_ids: manyIds,
      };
      const result = bulkUnassignUsersSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si groupe_id est manquant", () => {
      const invalidBulk = {
        utilisateur_ids: [100, 101],
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_ids est manquant", () => {
      const invalidBulk = {
        groupe_id: 1,
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [],
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter plus de 100 utilisateurs", () => {
      const tooManyIds = Array.from({ length: MAX_USERS_PER_BULK_ASSIGNMENT + 1 }, (_, i) => i + 1);
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: tooManyIds,
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Maximum");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, 0, 2],
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        groupe_id: 1,
        utilisateur_ids: [1, -1, 2],
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est 0", () => {
      const invalidBulk = {
        groupe_id: 0,
        utilisateur_ids: [100, 101],
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est négatif", () => {
      const invalidBulk = {
        groupe_id: -1,
        utilisateur_ids: [100, 101],
      };
      const result = bulkUnassignUsersSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listGroupUsersSchema - Schema for listing users in a group
  // ============================================================================
  describe("listGroupUsersSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        groupe_id: 1,
        page: 2,
        limit: 50,
        sort_by: "created_at" as const,
        sort_order: "desc" as const,
      };
      const result = listGroupUsersSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupe_id).toBe(1);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec seulement groupe_id", () => {
      const validQuery = {
        groupe_id: 1,
      };
      const result = listGroupUsersSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(GROUPS_DEFAULT_PAGE);
        expect(result.data.limit).toBe(GROUPS_DEFAULT_PAGE_SIZE);
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        groupe_id: 1,
        sort_by: "created_at" as const,
      };
      const result = listGroupUsersSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait valider avec sort_by utilisateur_id", () => {
      const validQuery = {
        groupe_id: 1,
        sort_by: "utilisateur_id" as const,
      };
      const result = listGroupUsersSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("utilisateur_id");
      }
    });

    it("devrait appliquer created_at comme sort_by par défaut", () => {
      const validQuery = {
        groupe_id: 1,
      };
      const result = listGroupUsersSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {
        groupe_id: 1,
      };
      const result = listGroupUsersSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait rejeter si groupe_id est manquant", () => {
      const invalidQuery = {
        page: 1,
      };
      const result = listGroupUsersSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est 0", () => {
      const invalidQuery = {
        groupe_id: 0,
      };
      const result = listGroupUsersSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groupe_id est négatif", () => {
      const invalidQuery = {
        groupe_id: -1,
      };
      const result = listGroupUsersSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidQuery = {
        groupe_id: 1,
        page: 0,
      };
      const result = listGroupUsersSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit dépasse le maximum", () => {
      const invalidQuery = {
        groupe_id: 1,
        limit: GROUPS_MAX_PAGE_SIZE + 1,
      };
      const result = listGroupUsersSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        groupe_id: 1,
        sort_by: "invalid_field",
      };
      const result = listGroupUsersSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        groupe_id: 1,
        sort_order: "invalid",
      };
      const result = listGroupUsersSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listUserGroupsSchema - Schema for listing groups for a user
  // ============================================================================
  describe("listUserGroupsSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        utilisateur_id: 100,
        page: 2,
        limit: 50,
        sort_by: "created_at" as const,
        sort_order: "desc" as const,
      };
      const result = listUserGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(100);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: 100,
      };
      const result = listUserGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(GROUPS_DEFAULT_PAGE);
        expect(result.data.limit).toBe(GROUPS_DEFAULT_PAGE_SIZE);
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        utilisateur_id: 100,
        sort_by: "created_at" as const,
      };
      const result = listUserGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait valider avec sort_by groupe_id", () => {
      const validQuery = {
        utilisateur_id: 100,
        sort_by: "groupe_id" as const,
      };
      const result = listUserGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("groupe_id");
      }
    });

    it("devrait appliquer created_at comme sort_by par défaut", () => {
      const validQuery = {
        utilisateur_id: 100,
      };
      const result = listUserGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {
        utilisateur_id: 100,
      };
      const result = listUserGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidQuery = {
        page: 1,
      };
      const result = listUserGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidQuery = {
        utilisateur_id: 0,
      };
      const result = listUserGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidQuery = {
        utilisateur_id: -1,
      };
      const result = listUserGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidQuery = {
        utilisateur_id: 100,
        page: 0,
      };
      const result = listUserGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit dépasse le maximum", () => {
      const invalidQuery = {
        utilisateur_id: 100,
        limit: GROUPS_MAX_PAGE_SIZE + 1,
      };
      const result = listUserGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        utilisateur_id: 100,
        sort_by: "invalid_field",
      };
      const result = listUserGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        utilisateur_id: 100,
        sort_order: "invalid",
      };
      const result = listUserGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // groupUserResponseSchema - Single group-user association response
  // ============================================================================
  describe("groupUserResponseSchema", () => {
    it("devrait valider une réponse d'association complète", () => {
      const validResponse = {
        groupe_id: 1,
        utilisateur_id: 100,
        created_at: new Date(),
      };
      const result = groupUserResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // groupUsersListResponseSchema - Paginated group users list response
  // ============================================================================
  describe("groupUsersListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            groupe_id: 1,
            utilisateur_id: 100,
            created_at: new Date(),
          },
          {
            groupe_id: 1,
            utilisateur_id: 101,
            created_at: new Date(),
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      };
      const result = groupUsersListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
      }
    });

    it("devrait valider avec un array data vide", () => {
      const validResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result = groupUsersListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si data est manquant", () => {
      const invalidResponse = {
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result = groupUsersListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = groupUsersListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // userGroupsListResponseSchema - Paginated user groups list response
  // ============================================================================
  describe("userGroupsListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            groupe_id: 1,
            utilisateur_id: 100,
            created_at: new Date(),
          },
          {
            groupe_id: 2,
            utilisateur_id: 100,
            created_at: new Date(),
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      };
      const result = userGroupsListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
      }
    });

    it("devrait valider avec un array data vide", () => {
      const validResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result = userGroupsListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si data est manquant", () => {
      const invalidResponse = {
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result = userGroupsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = userGroupsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkOperationResponseSchema - Bulk operation response
  // ============================================================================
  describe("bulkOperationResponseSchema", () => {
    it("devrait valider une réponse de succès complète", () => {
      const validResponse = {
        success: true,
        assigned_count: 5,
        errors: [],
      };
      const result = bulkOperationResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.assigned_count).toBe(5);
      }
    });

    it("devrait valider avec unassigned_count", () => {
      const validResponse = {
        success: true,
        unassigned_count: 3,
      };
      const result = bulkOperationResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des erreurs", () => {
      const validResponse = {
        success: false,
        errors: ["Erreur 1", "Erreur 2"],
      };
      const result = bulkOperationResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(2);
      }
    });

    it("devrait valider avec seulement success", () => {
      const validResponse = {
        success: true,
      };
      const result = bulkOperationResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si success est manquant", () => {
      const invalidResponse = {
        assigned_count: 5,
      };
      const result = bulkOperationResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si success n'est pas un boolean", () => {
      const invalidResponse = {
        success: "true",
      };
      const result = bulkOperationResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si assigned_count est négatif", () => {
      const invalidResponse = {
        success: true,
        assigned_count: -1,
      };
      const result = bulkOperationResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si unassigned_count est négatif", () => {
      const invalidResponse = {
        success: true,
        unassigned_count: -1,
      };
      const result = bulkOperationResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference - Verify TypeScript types are correctly inferred
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type GroupUser", () => {
      const groupUser: GroupUser = {
        groupe_id: 1,
        utilisateur_id: 100,
        created_at: new Date(),
      };
      expect(groupUser.groupe_id).toBe(1);
      expect(groupUser.utilisateur_id).toBe(100);
    });

    it("devrait inférer correctement le type AssignUserToGroup", () => {
      const assignment: AssignUserToGroup = {
        utilisateur_id: 100,
        groupe_id: 1,
      };
      expect(assignment.utilisateur_id).toBe(100);
    });

    it("devrait inférer correctement le type UnassignUserFromGroup", () => {
      const unassignment: UnassignUserFromGroup = {
        utilisateur_id: 100,
        groupe_id: 1,
      };
      expect(unassignment.groupe_id).toBe(1);
    });

    it("devrait inférer correctement le type BulkAssignUsers", () => {
      const bulkAssign: BulkAssignUsers = {
        groupe_id: 1,
        utilisateur_ids: [100, 101, 102],
      };
      expect(bulkAssign.utilisateur_ids).toHaveLength(3);
    });

    it("devrait inférer correctement le type BulkUnassignUsers", () => {
      const bulkUnassign: BulkUnassignUsers = {
        groupe_id: 1,
        utilisateur_ids: [100, 101],
      };
      expect(bulkUnassign.utilisateur_ids).toHaveLength(2);
    });

    it("devrait inférer correctement le type ListGroupUsersQuery", () => {
      const query: ListGroupUsersQuery = {
        groupe_id: 1,
        page: 1,
        limit: 20,
        sort_by: "created_at",
        sort_order: "asc",
      };
      expect(query.groupe_id).toBe(1);
    });

    it("devrait inférer correctement le type ListUserGroupsQuery", () => {
      const query: ListUserGroupsQuery = {
        utilisateur_id: 100,
        page: 1,
        limit: 20,
        sort_by: "created_at",
        sort_order: "asc",
      };
      expect(query.utilisateur_id).toBe(100);
    });

    it("devrait inférer correctement le type GroupUserResponse", () => {
      const response: GroupUserResponse = {
        groupe_id: 1,
        utilisateur_id: 100,
        created_at: new Date(),
      };
      expect(response.groupe_id).toBe(1);
    });

    it("devrait inférer correctement le type GroupUsersListResponse", () => {
      const response: GroupUsersListResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      expect(response.data).toHaveLength(0);
    });

    it("devrait inférer correctement le type UserGroupsListResponse", () => {
      const response: UserGroupsListResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      expect(response.data).toHaveLength(0);
    });

    it("devrait inférer correctement le type BulkOperationResponse", () => {
      const response: BulkOperationResponse = {
        success: true,
        assigned_count: 5,
      };
      expect(response.success).toBe(true);
    });
  });
});
