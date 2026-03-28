/**
 * @fileoverview Comprehensive Tests for Group Validators
 * @module @clubmanager/types/validators/groups/__tests__/group
 *
 * Tests all Zod schemas from group.validators.ts with comprehensive coverage:
 * - groupBaseSchema
 * - createGroupSchema
 * - updateGroupSchema
 * - listGroupsSchema
 * - groupIdSchema
 * - groupIdStringSchema
 * - groupIdParamSchema
 * - groupResponseSchema
 * - groupsListResponseSchema
 * - groupStatsSchema
 * - Type inference
 */

import { describe, it, expect } from "@jest/globals";
import {
  groupBaseSchema,
  createGroupSchema,
  updateGroupSchema,
  listGroupsSchema,
  groupIdSchema,
  groupIdStringSchema,
  groupIdParamSchema,
  groupResponseSchema,
  groupsListResponseSchema,
  groupStatsSchema,
  type Group,
  type CreateGroup,
  type UpdateGroup,
  type ListGroupsQuery,
  type GroupIdParam,
  type GroupResponse,
  type GroupsListResponse,
  type GroupStats,
} from "../group.validators.js";
import {
  GROUP_NAME_MAX_LENGTH,
  GROUP_NAME_MIN_LENGTH,
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUPS_DEFAULT_PAGE_SIZE,
  GROUPS_MAX_PAGE_SIZE,
  GROUPS_DEFAULT_PAGE,
} from "../../../constants/groups.constants.js";

describe("Group Validators", () => {
  // ============================================================================
  // groupBaseSchema - Base group schema with all fields
  // ============================================================================
  describe("groupBaseSchema", () => {
    it("devrait valider un groupe valide avec tous les champs", () => {
      const validGroup = {
        id: 1,
        nom: "Administrateurs",
        description: "Groupe des administrateurs du système",
        created_at: new Date("2024-01-15T10:00:00Z"),
        updated_at: new Date("2024-01-20T15:30:00Z"),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("Administrateurs");
        expect(result.data.description).toBe("Groupe des administrateurs du système");
        expect(result.data.created_at).toEqual(new Date("2024-01-15T10:00:00Z"));
        expect(result.data.updated_at).toEqual(new Date("2024-01-20T15:30:00Z"));
      }
    });

    it("devrait valider avec description à null", () => {
      const validGroup = {
        id: 2,
        nom: "Membres",
        description: null,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec description optionnelle (undefined)", () => {
      const validGroup = {
        id: 3,
        nom: "Professeurs",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it("devrait valider avec updated_at à null", () => {
      const validGroup = {
        id: 4,
        nom: "Invités",
        description: "Groupe temporaire",
        created_at: new Date(),
        updated_at: null,
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updated_at).toBe(null);
      }
    });

    it("devrait valider avec updated_at optionnel (undefined)", () => {
      const validGroup = {
        id: 5,
        nom: "Test",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec nom de 1 caractère (longueur minimale)", () => {
      const validGroup = {
        id: 6,
        nom: "A",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("A");
      }
    });

    it("devrait valider avec nom de 100 caractères (longueur maximale)", () => {
      const maxName = "A".repeat(GROUP_NAME_MAX_LENGTH);
      const validGroup = {
        id: 7,
        nom: maxName,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe(maxName);
        expect(result.data.nom.length).toBe(GROUP_NAME_MAX_LENGTH);
      }
    });

    it("devrait valider avec description de longueur maximale (65535 caractères)", () => {
      const maxDescription = "D".repeat(GROUP_DESCRIPTION_MAX_LENGTH);
      const validGroup = {
        id: 8,
        nom: "Test",
        description: maxDescription,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description?.length).toBe(GROUP_DESCRIPTION_MAX_LENGTH);
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validGroup = {
        id: 9,
        nom: "  Administrateurs  ",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Administrateurs");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validGroup = {
        id: 10,
        nom: "Test",
        description: "  Description avec espaces  ",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description avec espaces");
      }
    });

    it("devrait coercer une string en Date pour created_at", () => {
      const validGroup = {
        id: 11,
        nom: "Test",
        created_at: "2024-01-15T10:00:00Z",
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_at).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour updated_at", () => {
      const validGroup = {
        id: 12,
        nom: "Test",
        created_at: new Date(),
        updated_at: "2024-01-20T15:30:00Z",
      };
      const result = groupBaseSchema.safeParse(validGroup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updated_at).toBeInstanceOf(Date);
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidGroup = {
        id: 13,
        nom: "",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("au moins");
      }
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidGroup = {
        id: 14,
        nom: "   ",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long (> 100 caractères)", () => {
      const longName = "A".repeat(GROUP_NAME_MAX_LENGTH + 1);
      const invalidGroup = {
        id: 15,
        nom: longName,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("dépasser");
      }
    });

    it("devrait rejeter une description trop longue (> 65535 caractères)", () => {
      const longDescription = "D".repeat(GROUP_DESCRIPTION_MAX_LENGTH + 1);
      const invalidGroup = {
        id: 16,
        nom: "Test",
        description: longDescription,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidGroup = {
        nom: "Test",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidGroup = {
        id: 17,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("requis");
      }
    });

    it("devrait rejeter si created_at est manquant", () => {
      const invalidGroup = {
        id: 18,
        nom: "Test",
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidGroup = {
        id: 0,
        nom: "Test",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidGroup = {
        id: -1,
        nom: "Test",
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom n'est pas une string", () => {
      const invalidGroup = {
        id: 19,
        nom: 123,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("chaîne");
      }
    });

    it("devrait rejeter si description n'est pas une string", () => {
      const invalidGroup = {
        id: 20,
        nom: "Test",
        description: 123,
        created_at: new Date(),
      };
      const result = groupBaseSchema.safeParse(invalidGroup);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createGroupSchema - Schema for creating a new group
  // ============================================================================
  describe("createGroupSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        nom: "Nouveaux membres",
        description: "Groupe pour les nouveaux membres",
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nouveaux membres");
        expect(result.data.description).toBe("Groupe pour les nouveaux membres");
      }
    });

    it("devrait valider avec seulement les champs requis (sans description)", () => {
      const validCreate = {
        nom: "Test",
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Test");
      }
    });

    it("devrait valider avec description à null", () => {
      const validCreate = {
        nom: "Test",
        description: null,
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec nom de 1 caractère", () => {
      const validCreate = {
        nom: "A",
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("A");
      }
    });

    it("devrait valider avec nom de longueur maximale", () => {
      const maxName = "A".repeat(GROUP_NAME_MAX_LENGTH);
      const validCreate = {
        nom: maxName,
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom.length).toBe(GROUP_NAME_MAX_LENGTH);
      }
    });

    it("devrait valider avec description de longueur maximale", () => {
      const maxDescription = "D".repeat(GROUP_DESCRIPTION_MAX_LENGTH);
      const validCreate = {
        nom: "Test",
        description: maxDescription,
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du nom", () => {
      const validCreate = {
        nom: "  Administrateurs  ",
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Administrateurs");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validCreate = {
        nom: "Test",
        description: "  Description  ",
      };
      const result = createGroupSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description");
      }
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidCreate = {
        description: "Test",
      };
      const result = createGroupSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("requis");
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidCreate = {
        nom: "",
      };
      const result = createGroupSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidCreate = {
        nom: "   ",
      };
      const result = createGroupSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("vide après");
      }
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "A".repeat(GROUP_NAME_MAX_LENGTH + 1);
      const invalidCreate = {
        nom: longName,
      };
      const result = createGroupSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description trop longue", () => {
      const longDescription = "D".repeat(GROUP_DESCRIPTION_MAX_LENGTH + 1);
      const invalidCreate = {
        nom: "Test",
        description: longDescription,
      };
      const result = createGroupSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom n'est pas une string", () => {
      const invalidCreate = {
        nom: 123,
      };
      const result = createGroupSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si description n'est pas une string", () => {
      const invalidCreate = {
        nom: "Test",
        description: 123,
      };
      const result = createGroupSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateGroupSchema - Schema for updating a group
  // ============================================================================
  describe("updateGroupSchema", () => {
    it("devrait valider une mise à jour avec nom", () => {
      const validUpdate = {
        nom: "Nouveau nom",
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nouveau nom");
      }
    });

    it("devrait valider une mise à jour avec description", () => {
      const validUpdate = {
        description: "Nouvelle description",
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Nouvelle description");
      }
    });

    it("devrait valider une mise à jour avec nom et description", () => {
      const validUpdate = {
        nom: "Nouveau nom",
        description: "Nouvelle description",
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec description à null", () => {
      const validUpdate = {
        description: null,
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validUpdate = {
        nom: "  Nouveau nom  ",
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nouveau nom");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validUpdate = {
        description: "  Nouvelle description  ",
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Nouvelle description");
      }
    });

    it("devrait valider avec nom de longueur maximale", () => {
      const maxName = "A".repeat(GROUP_NAME_MAX_LENGTH);
      const validUpdate = {
        nom: maxName,
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec description de longueur maximale", () => {
      const maxDescription = "D".repeat(GROUP_DESCRIPTION_MAX_LENGTH);
      const validUpdate = {
        description: maxDescription,
      };
      const result = updateGroupSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un objet vide", () => {
      const invalidUpdate = {};
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins un champ");
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidUpdate = {
        nom: "",
      };
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidUpdate = {
        nom: "   ",
      };
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "A".repeat(GROUP_NAME_MAX_LENGTH + 1);
      const invalidUpdate = {
        nom: longName,
      };
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description trop longue", () => {
      const longDescription = "D".repeat(GROUP_DESCRIPTION_MAX_LENGTH + 1);
      const invalidUpdate = {
        description: longDescription,
      };
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des champs supplémentaires (strict mode)", () => {
      const invalidUpdate = {
        nom: "Test",
        extra_field: "not allowed",
      };
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom n'est pas une string", () => {
      const invalidUpdate = {
        nom: 123,
      };
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si description n'est pas une string", () => {
      const invalidUpdate = {
        description: 123,
      };
      const result = updateGroupSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listGroupsSchema - Schema for listing/filtering groups
  // ============================================================================
  describe("listGroupsSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 2,
        limit: 50,
        search: "admin",
        sort_by: "nom" as const,
        sort_order: "asc" as const,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.search).toBe("admin");
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(GROUPS_DEFAULT_PAGE);
        expect(result.data.limit).toBe(GROUPS_DEFAULT_PAGE_SIZE);
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec seulement page", () => {
      const validQuery = {
        page: 3,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it("devrait valider avec seulement limit", () => {
      const validQuery = {
        limit: 10,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it("devrait valider avec seulement search", () => {
      const validQuery = {
        search: "professeur",
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("professeur");
      }
    });

    it("devrait trim les espaces du search", () => {
      const validQuery = {
        search: "  admin  ",
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("admin");
      }
    });

    it("devrait valider avec sort_by nom", () => {
      const validQuery = {
        sort_by: "nom" as const,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        sort_by: "created_at" as const,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait valider avec sort_by updated_at", () => {
      const validQuery = {
        sort_by: "updated_at" as const,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("updated_at");
      }
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc" as const,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc" as const,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait appliquer nom comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec limit à la valeur maximale", () => {
      const validQuery = {
        limit: GROUPS_MAX_PAGE_SIZE,
      };
      const result = listGroupsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(GROUPS_MAX_PAGE_SIZE);
      }
    });

    it("devrait rejeter si page est 0", () => {
      const invalidQuery = {
        page: 0,
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est négatif", () => {
      const invalidQuery = {
        page: -1,
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit est 0", () => {
      const invalidQuery = {
        limit: 0,
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit dépasse le maximum", () => {
      const invalidQuery = {
        limit: GROUPS_MAX_PAGE_SIZE + 1,
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un search vide", () => {
      const invalidQuery = {
        search: "",
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un search trop long", () => {
      const invalidQuery = {
        search: "a".repeat(101),
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "invalid_field",
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid",
      };
      const result = listGroupsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // groupIdSchema - Numeric ID schema
  // ============================================================================
  describe("groupIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = groupIdSchema.safeParse(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = groupIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = groupIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = groupIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = groupIdSchema.safeParse(42.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = groupIdSchema.safeParse("42");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // groupIdStringSchema - String ID schema (for URL params)
  // ============================================================================
  describe("groupIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = groupIdStringSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const result = groupIdStringSchema.safeParse("123");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe("number");
        expect(result.data).toBe(123);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = groupIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = groupIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = groupIdStringSchema.safeParse("-1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = groupIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = groupIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = groupIdStringSchema.safeParse("42.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = groupIdStringSchema.safeParse(" 42 ");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // groupIdParamSchema - URL param schema
  // ============================================================================
  describe("groupIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "42",
      };
      const result = groupIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(42);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "123",
      };
      const result = groupIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
        expect(result.data.id).toBe(123);
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999",
      };
      const result = groupIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = groupIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = groupIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-1",
      };
      const result = groupIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = groupIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = groupIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "42.5",
      };
      const result = groupIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // groupResponseSchema - Single group response
  // ============================================================================
  describe("groupResponseSchema", () => {
    it("devrait valider une réponse de groupe complète", () => {
      const validResponse = {
        id: 1,
        nom: "Administrateurs",
        description: "Groupe des administrateurs",
        created_at: new Date(),
        updated_at: new Date(),
      };
      const result = groupResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 2,
        nom: "Test",
        created_at: new Date(),
      };
      const result = groupResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // groupsListResponseSchema - Paginated list response
  // ============================================================================
  describe("groupsListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            nom: "Admin",
            created_at: new Date(),
          },
          {
            id: 2,
            nom: "Membres",
            description: "Groupe des membres",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      };
      const result = groupsListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.total).toBe(2);
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
      const result = groupsListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(0);
      }
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
      const result = groupsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = groupsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: -1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result = groupsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: -1,
          total_pages: 0,
        },
      };
      const result = groupsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // groupStatsSchema - Group statistics
  // ============================================================================
  describe("groupStatsSchema", () => {
    it("devrait valider des statistiques valides", () => {
      const validStats = {
        total_groups: 10,
        total_users_assigned: 50,
        groups_with_users: 8,
        groups_without_users: 2,
      };
      const result = groupStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_groups).toBe(10);
        expect(result.data.total_users_assigned).toBe(50);
        expect(result.data.groups_with_users).toBe(8);
        expect(result.data.groups_without_users).toBe(2);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total_groups: 0,
        total_users_assigned: 0,
        groups_with_users: 0,
        groups_without_users: 0,
      };
      const result = groupStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si total_groups est manquant", () => {
      const invalidStats = {
        total_users_assigned: 50,
        groups_with_users: 8,
        groups_without_users: 2,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_users_assigned est manquant", () => {
      const invalidStats = {
        total_groups: 10,
        groups_with_users: 8,
        groups_without_users: 2,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groups_with_users est manquant", () => {
      const invalidStats = {
        total_groups: 10,
        total_users_assigned: 50,
        groups_without_users: 2,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groups_without_users est manquant", () => {
      const invalidStats = {
        total_groups: 10,
        total_users_assigned: 50,
        groups_with_users: 8,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_groups est négatif", () => {
      const invalidStats = {
        total_groups: -1,
        total_users_assigned: 50,
        groups_with_users: 8,
        groups_without_users: 2,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_users_assigned est négatif", () => {
      const invalidStats = {
        total_groups: 10,
        total_users_assigned: -1,
        groups_with_users: 8,
        groups_without_users: 2,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groups_with_users est négatif", () => {
      const invalidStats = {
        total_groups: 10,
        total_users_assigned: 50,
        groups_with_users: -1,
        groups_without_users: 2,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si groups_without_users est négatif", () => {
      const invalidStats = {
        total_groups: 10,
        total_users_assigned: 50,
        groups_with_users: 8,
        groups_without_users: -1,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des strings", () => {
      const invalidStats = {
        total_groups: "10",
        total_users_assigned: "50",
        groups_with_users: "8",
        groups_without_users: "2",
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des décimaux", () => {
      const invalidStats = {
        total_groups: 10.5,
        total_users_assigned: 50.5,
        groups_with_users: 8.5,
        groups_without_users: 2.5,
      };
      const result = groupStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference - Verify TypeScript types are correctly inferred
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type Group", () => {
      const group: Group = {
        id: 1,
        nom: "Test",
        created_at: new Date(),
      };
      expect(group.id).toBe(1);
      expect(group.nom).toBe("Test");
    });

    it("devrait inférer correctement le type CreateGroup", () => {
      const createGroup: CreateGroup = {
        nom: "Nouveau groupe",
      };
      expect(createGroup.nom).toBe("Nouveau groupe");
    });

    it("devrait inférer correctement le type UpdateGroup", () => {
      const updateGroup: UpdateGroup = {
        nom: "Nom mis à jour",
      };
      expect(updateGroup.nom).toBe("Nom mis à jour");
    });

    it("devrait inférer correctement le type ListGroupsQuery", () => {
      const query: ListGroupsQuery = {
        page: 1,
        limit: 20,
        sort_by: "nom",
        sort_order: "asc",
      };
      expect(query.page).toBe(1);
    });

    it("devrait inférer correctement le type GroupIdParam", () => {
      const param: GroupIdParam = {
        id: 42,
      };
      expect(param.id).toBe(42);
    });

    it("devrait inférer correctement le type GroupResponse", () => {
      const response: GroupResponse = {
        id: 1,
        nom: "Test",
        created_at: new Date(),
      };
      expect(response.id).toBe(1);
    });

    it("devrait inférer correctement le type GroupsListResponse", () => {
      const response: GroupsListResponse = {
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

    it("devrait inférer correctement le type GroupStats", () => {
      const stats: GroupStats = {
        total_groups: 10,
        total_users_assigned: 50,
        groups_with_users: 8,
        groups_without_users: 2,
      };
      expect(stats.total_groups).toBe(10);
    });
  });
});
