/**
 * @fileoverview Comprehensive Tests for Message Status Validators
 * @module @clubmanager/types/validators/messaging/__tests__/message-status
 *
 * Tests all Zod schemas from message-status.validators.ts with comprehensive coverage:
 * - messageStatusBaseSchema
 * - createMessageStatusSchema
 * - updateMessageStatusSchema
 * - listMessageStatusesSchema
 * - messageStatusIdSchema
 * - messageStatusIdStringSchema
 * - messageStatusIdParamSchema
 * - messageStatusResponseSchema
 * - messageStatusesListResponseSchema
 * - messageStatusStatsSchema
 *
 * Coverage: ~120 test cases covering all validation rules, edge cases, and type inference
 */

import { describe, it, expect } from "@jest/globals";
import {
  messageStatusBaseSchema,
  createMessageStatusSchema,
  updateMessageStatusSchema,
  listMessageStatusesSchema,
  messageStatusIdSchema,
  messageStatusIdStringSchema,
  messageStatusIdParamSchema,
  messageStatusResponseSchema,
  messageStatusesListResponseSchema,
  messageStatusStatsSchema,
  type MessageStatus,
  type CreateMessageStatus,
  type UpdateMessageStatus,
  type ListMessageStatusesQuery,
  type MessageStatusIdParam,
  type MessageStatusResponse,
  type MessageStatusesListResponse,
  type MessageStatusStats,
} from "../message-status.validators.js";
import {
  MESSAGE_STATUS_NAME_MAX_LENGTH,
  MESSAGE_STATUS_NAME_MIN_LENGTH,
} from "../../../constants/messaging.constants.js";

describe("Message Status Validators", () => {
  // ============================================================================
  // messageStatusBaseSchema - Base message status schema with all fields
  // ============================================================================
  describe("messageStatusBaseSchema", () => {
    it("devrait valider un statut de message valide avec tous les champs", () => {
      const validStatus = {
        id: 1,
        nom: "En attente",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("En attente");
      }
    });

    it("devrait valider avec un nom de 1 caractère (longueur minimale)", () => {
      const validStatus = {
        id: 2,
        nom: "A",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("A");
      }
    });

    it("devrait valider avec un nom de 50 caractères (longueur maximale)", () => {
      const maxName = "A".repeat(MESSAGE_STATUS_NAME_MAX_LENGTH);
      const validStatus = {
        id: 3,
        nom: maxName,
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe(maxName);
        expect(result.data.nom.length).toBe(MESSAGE_STATUS_NAME_MAX_LENGTH);
      }
    });

    it("devrait valider avec des caractères spéciaux dans le nom", () => {
      const validStatus = {
        id: 4,
        nom: "En attente - Révision (étape 1)",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("En attente - Révision (étape 1)");
      }
    });

    it("devrait valider avec des accents dans le nom", () => {
      const validStatus = {
        id: 5,
        nom: "Envoyé à réviser",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Envoyé à réviser");
      }
    });

    it("devrait valider avec des chiffres dans le nom", () => {
      const validStatus = {
        id: 6,
        nom: "Statut 123",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Statut 123");
      }
    });

    it("devrait trim les espaces au début du nom", () => {
      const validStatus = {
        id: 7,
        nom: "   Archivé",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Archivé");
      }
    });

    it("devrait trim les espaces à la fin du nom", () => {
      const validStatus = {
        id: 8,
        nom: "Traité   ",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Traité");
      }
    });

    it("devrait trim les espaces au début et à la fin du nom", () => {
      const validStatus = {
        id: 9,
        nom: "   Supprimé   ",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Supprimé");
      }
    });

    it("devrait préserver les espaces internes du nom", () => {
      const validStatus = {
        id: 10,
        nom: "En cours de traitement",
      };
      const result = messageStatusBaseSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("En cours de traitement");
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidStatus = {
        id: 11,
        nom: "",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          `Le nom doit contenir au moins ${MESSAGE_STATUS_NAME_MIN_LENGTH} caractère`,
        );
      }
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidStatus = {
        id: 12,
        nom: "   ",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          `Le nom doit contenir au moins ${MESSAGE_STATUS_NAME_MIN_LENGTH} caractère`,
        );
      }
    });

    it("devrait rejeter un nom avec seulement des tabulations", () => {
      const invalidStatus = {
        id: 13,
        nom: "\t\t\t",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom avec seulement des sauts de ligne", () => {
      const invalidStatus = {
        id: 14,
        nom: "\n\n\n",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long (> 50 caractères)", () => {
      const longName = "A".repeat(MESSAGE_STATUS_NAME_MAX_LENGTH + 1);
      const invalidStatus = {
        id: 15,
        nom: longName,
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          `Le nom ne peut pas dépasser ${MESSAGE_STATUS_NAME_MAX_LENGTH} caractères`,
        );
      }
    });

    it("devrait rejeter un nom de 51 caractères", () => {
      const longName = "A".repeat(51);
      const invalidStatus = {
        id: 16,
        nom: longName,
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom de 100 caractères", () => {
      const longName = "A".repeat(100);
      const invalidStatus = {
        id: 17,
        nom: longName,
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidStatus = {
        nom: "Statut valide",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidStatus = {
        id: 18,
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidStatus = {
        id: 0,
        nom: "Statut",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidStatus = {
        id: -1,
        nom: "Statut",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est un décimal", () => {
      const invalidStatus = {
        id: 1.5,
        nom: "Statut",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est une string", () => {
      const invalidStatus = {
        id: "1",
        nom: "Statut",
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un nombre", () => {
      const invalidStatus = {
        id: 19,
        nom: 123,
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est null", () => {
      const invalidStatus = {
        id: 20,
        nom: null,
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est undefined", () => {
      const invalidStatus = {
        id: 21,
        nom: undefined,
      };
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const invalidStatus = {};
      const result = messageStatusBaseSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createMessageStatusSchema - Schema for creating a new message status
  // ============================================================================
  describe("createMessageStatusSchema", () => {
    it("devrait valider une création avec un nom valide", () => {
      const validCreate = {
        nom: "Nouveau statut",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nouveau statut");
      }
    });

    it("devrait valider avec un nom de 1 caractère", () => {
      const validCreate = {
        nom: "X",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("X");
      }
    });

    it("devrait valider avec un nom de longueur maximale", () => {
      const maxName = "B".repeat(MESSAGE_STATUS_NAME_MAX_LENGTH);
      const validCreate = {
        nom: maxName,
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe(maxName);
        expect(result.data.nom.length).toBe(MESSAGE_STATUS_NAME_MAX_LENGTH);
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validCreate = {
        nom: "  Brouillon  ",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Brouillon");
      }
    });

    it("devrait valider avec des caractères spéciaux", () => {
      const validCreate = {
        nom: "État @#$ spécial!",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("État @#$ spécial!");
      }
    });

    it("devrait valider avec des émojis", () => {
      const validCreate = {
        nom: "En attente ⏳",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("En attente ⏳");
      }
    });

    it("devrait valider avec un nom multilingue", () => {
      const validCreate = {
        nom: "Status 状態 حالة",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Status 状態 حالة");
      }
    });

    it("ne devrait pas inclure le champ id", () => {
      const validCreate = {
        nom: "Test",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("id");
      }
    });

    it("devrait ignorer le champ id s'il est fourni", () => {
      const validCreate = {
        id: 999,
        nom: "Test avec ID",
      };
      const result = createMessageStatusSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("id");
        expect(result.data.nom).toBe("Test avec ID");
      }
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidCreate = {};
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom vide", () => {
      const invalidCreate = {
        nom: "",
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidCreate = {
        nom: "     ",
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "C".repeat(MESSAGE_STATUS_NAME_MAX_LENGTH + 1);
      const invalidCreate = {
        nom: longName,
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est null", () => {
      const invalidCreate = {
        nom: null,
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est undefined", () => {
      const invalidCreate = {
        nom: undefined,
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un nombre", () => {
      const invalidCreate = {
        nom: 456,
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un boolean", () => {
      const invalidCreate = {
        nom: true,
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un array", () => {
      const invalidCreate = {
        nom: ["statut"],
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un objet", () => {
      const invalidCreate = {
        nom: { value: "statut" },
      };
      const result = createMessageStatusSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateMessageStatusSchema - Schema for updating a message status
  // ============================================================================
  describe("updateMessageStatusSchema", () => {
    it("devrait valider une mise à jour avec un nom valide", () => {
      const validUpdate = {
        nom: "Statut modifié",
      };
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Statut modifié");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data).length).toBe(0);
      }
    });

    it("devrait valider avec un nom de 1 caractère", () => {
      const validUpdate = {
        nom: "Z",
      };
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Z");
      }
    });

    it("devrait valider avec un nom de longueur maximale", () => {
      const maxName = "D".repeat(MESSAGE_STATUS_NAME_MAX_LENGTH);
      const validUpdate = {
        nom: maxName,
      };
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe(maxName);
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validUpdate = {
        nom: "   Mis à jour   ",
      };
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Mis à jour");
      }
    });

    it("devrait valider nom avec undefined (champ optionnel)", () => {
      const validUpdate = {
        nom: undefined,
      };
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("ne devrait pas inclure le champ id", () => {
      const validUpdate = {
        nom: "Update test",
      };
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("id");
      }
    });

    it("devrait ignorer le champ id s'il est fourni", () => {
      const validUpdate = {
        id: 888,
        nom: "Update avec ID",
      };
      const result = updateMessageStatusSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("id");
        expect(result.data.nom).toBe("Update avec ID");
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidUpdate = {
        nom: "",
      };
      const result = updateMessageStatusSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidUpdate = {
        nom: "    ",
      };
      const result = updateMessageStatusSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "E".repeat(MESSAGE_STATUS_NAME_MAX_LENGTH + 1);
      const invalidUpdate = {
        nom: longName,
      };
      const result = updateMessageStatusSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est null", () => {
      const invalidUpdate = {
        nom: null,
      };
      const result = updateMessageStatusSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un nombre", () => {
      const invalidUpdate = {
        nom: 789,
      };
      const result = updateMessageStatusSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un boolean", () => {
      const invalidUpdate = {
        nom: false,
      };
      const result = updateMessageStatusSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un array", () => {
      const invalidUpdate = {
        nom: ["nouveau", "statut"],
      };
      const result = updateMessageStatusSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listMessageStatusesSchema - Schema for listing message statuses with filters
  // ============================================================================
  describe("listMessageStatusesSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 2,
        limit: 25,
        search: "en attente",
        sort_by: "nom",
        sort_order: "asc",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
        expect(result.data.search).toBe("en attente");
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom"); // Valeur par défaut
        expect(result.data.sort_order).toBe("asc"); // Valeur par défaut
      }
    });

    it("devrait appliquer nom comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec seulement search", () => {
      const validQuery = {
        search: "archivé",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("archivé");
      }
    });

    it("devrait trim les espaces de search", () => {
      const validQuery = {
        search: "   traité   ",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("traité");
      }
    });

    it("devrait valider search avec des caractères spéciaux", () => {
      const validQuery = {
        search: "état-2024 (v2)",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("état-2024 (v2)");
      }
    });

    it("devrait valider avec search vide après trim", () => {
      const validQuery = {
        search: "   ",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("");
      }
    });

    it("devrait valider avec sort_by nom", () => {
      const validQuery = {
        sort_by: "nom",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait valider avec sort_by id", () => {
      const validQuery = {
        sort_by: "id",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("id");
      }
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec page 1", () => {
      const validQuery = {
        page: 1,
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("devrait valider avec page 100", () => {
      const validQuery = {
        page: 100,
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(100);
      }
    });

    it("devrait valider avec limit 1 (minimum)", () => {
      const validQuery = {
        limit: 1,
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it("devrait valider avec limit 100 (maximum)", () => {
      const validQuery = {
        limit: 100,
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it("devrait valider avec limit 50", () => {
      const validQuery = {
        limit: 50,
      };
      const result = listMessageStatusesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "invalid_field",
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid",
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter page à 0", () => {
      const invalidQuery = {
        page: 0,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter page négative", () => {
      const invalidQuery = {
        page: -1,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit à 0", () => {
      const invalidQuery = {
        limit: 0,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit négative", () => {
      const invalidQuery = {
        limit: -5,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit supérieure à 100", () => {
      const invalidQuery = {
        limit: 101,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter limit de 200", () => {
      const invalidQuery = {
        limit: 200,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est un décimal", () => {
      const invalidQuery = {
        page: 1.5,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit est un décimal", () => {
      const invalidQuery = {
        limit: 10.5,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si search est un nombre", () => {
      const invalidQuery = {
        search: 123,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si search est null", () => {
      const invalidQuery = {
        search: null,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter sort_by avec une valeur numérique", () => {
      const invalidQuery = {
        sort_by: 123,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter sort_order avec une valeur numérique", () => {
      const invalidQuery = {
        sort_order: 1,
      };
      const result = listMessageStatusesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageStatusIdSchema - Schema for validating message status ID as number
  // ============================================================================
  describe("messageStatusIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = messageStatusIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = messageStatusIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait valider l'ID 100", () => {
      const result = messageStatusIdSchema.safeParse(100);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(100);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = messageStatusIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = messageStatusIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = messageStatusIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = messageStatusIdSchema.safeParse("1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = messageStatusIdSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = messageStatusIdSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un boolean", () => {
      const result = messageStatusIdSchema.safeParse(true);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageStatusIdStringSchema - Schema for validating ID as string (from params)
  // ============================================================================
  describe("messageStatusIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = messageStatusIdStringSchema.safeParse("1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const result = messageStatusIdStringSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
        expect(typeof result.data).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const result = messageStatusIdStringSchema.safeParse("888888");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(888888);
      }
    });

    it("devrait valider l'ID 1000", () => {
      const result = messageStatusIdStringSchema.safeParse("1000");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1000);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = messageStatusIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = messageStatusIdStringSchema.safeParse("-5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = messageStatusIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = messageStatusIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = messageStatusIdStringSchema.safeParse("1.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = messageStatusIdStringSchema.safeParse(" 1 ");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID alphanumérique", () => {
      const result = messageStatusIdStringSchema.safeParse("12abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = messageStatusIdStringSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = messageStatusIdStringSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const result = messageStatusIdStringSchema.safeParse(123);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageStatusIdParamSchema - Schema for validating ID in route params
  // ============================================================================
  describe("messageStatusIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "1",
      };
      const result = messageStatusIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "55",
      };
      const result = messageStatusIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(55);
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "777777",
      };
      const result = messageStatusIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(777777);
      }
    });

    it("devrait valider l'ID 500", () => {
      const validParam = {
        id: "500",
      };
      const result = messageStatusIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(500);
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-10",
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "xyz",
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "2.5",
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est null", () => {
      const invalidParam = {
        id: null,
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est undefined", () => {
      const invalidParam = {
        id: undefined,
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est un nombre", () => {
      const invalidParam = {
        id: 123,
      };
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const invalidParam = {};
      const result = messageStatusIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageStatusResponseSchema - Schema for message status response
  // ============================================================================
  describe("messageStatusResponseSchema", () => {
    it("devrait valider une réponse de statut de message complète", () => {
      const validResponse = {
        id: 1,
        nom: "En cours",
      };
      const result = messageStatusResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("En cours");
      }
    });

    it("devrait valider une réponse avec un nom long", () => {
      const validResponse = {
        id: 2,
        nom: "Statut de message en attente de validation finale",
      };
      const result = messageStatusResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe(
          "Statut de message en attente de validation finale",
        );
      }
    });

    it("devrait valider une réponse avec un nom minimal", () => {
      const validResponse = {
        id: 3,
        nom: "A",
      };
      const result = messageStatusResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("A");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidResponse = {
        nom: "Statut",
      };
      const result = messageStatusResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidResponse = {
        id: 4,
      };
      const result = messageStatusResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une réponse vide", () => {
      const invalidResponse = {};
      const result = messageStatusResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageStatusesListResponseSchema - Schema for paginated list response
  // ============================================================================
  describe("messageStatusesListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          { id: 1, nom: "Brouillon" },
          { id: 2, nom: "Envoyé" },
          { id: 3, nom: "Archivé" },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 3,
          total_pages: 1,
        },
      };
      const result = messageStatusesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(3);
        expect(result.data.data[0].nom).toBe("Brouillon");
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.total).toBe(3);
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
      const result = messageStatusesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });

    it("devrait valider avec un seul élément", () => {
      const validResponse = {
        data: [{ id: 1, nom: "Unique" }],
        pagination: {
          page: 1,
          page_size: 20,
          total: 1,
          total_pages: 1,
        },
      };
      const result = messageStatusesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(1);
      }
    });

    it("devrait valider avec plusieurs pages", () => {
      const validResponse = {
        data: [
          { id: 21, nom: "Statut page 2" },
          { id: 22, nom: "Autre statut" },
        ],
        pagination: {
          page: 2,
          page_size: 10,
          total: 25,
          total_pages: 3,
        },
      };
      const result = messageStatusesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pagination.page).toBe(2);
        expect(result.data.pagination.total_pages).toBe(3);
      }
    });

    it("devrait valider avec page_size 100", () => {
      const validResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 100,
          total: 0,
          total_pages: 0,
        },
      };
      const result = messageStatusesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pagination.page_size).toBe(100);
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
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [{ id: 1, nom: "Test" }],
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
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
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 0,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page_size est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: -5,
          total: 0,
          total_pages: 0,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: -10,
          total_pages: 0,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_pages est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: -1,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si data n'est pas un array", () => {
      const invalidResponse = {
        data: "not an array",
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un élément de data est invalide", () => {
      const invalidResponse = {
        data: [{ id: 0, nom: "Invalid" }],
        pagination: {
          page: 1,
          page_size: 20,
          total: 1,
          total_pages: 1,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un élément de data manque le nom", () => {
      const invalidResponse = {
        data: [{ id: 1 }],
        pagination: {
          page: 1,
          page_size: 20,
          total: 1,
          total_pages: 1,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est un décimal", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1.5,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page_size est un décimal", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20.5,
          total: 0,
          total_pages: 0,
        },
      };
      const result =
        messageStatusesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageStatusStatsSchema - Schema for message status statistics
  // ============================================================================
  describe("messageStatusStatsSchema", () => {
    it("devrait valider des statistiques valides", () => {
      const validStats = {
        total: 50,
        usage_count: {
          "1": 10,
          "2": 25,
          "3": 15,
        },
      };
      const result = messageStatusStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(50);
        expect(result.data.usage_count["1"]).toBe(10);
        expect(result.data.usage_count["2"]).toBe(25);
        expect(result.data.usage_count["3"]).toBe(15);
      }
    });

    it("devrait valider avec total à 0", () => {
      const validStats = {
        total: 0,
        usage_count: {},
      };
      const result = messageStatusStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
        expect(Object.keys(result.data.usage_count).length).toBe(0);
      }
    });

    it("devrait valider avec usage_count vide", () => {
      const validStats = {
        total: 100,
        usage_count: {},
      };
      const result = messageStatusStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
      }
    });

    it("devrait valider avec un seul usage_count", () => {
      const validStats = {
        total: 5,
        usage_count: {
          "1": 5,
        },
      };
      const result = messageStatusStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usage_count["1"]).toBe(5);
      }
    });

    it("devrait valider avec plusieurs usage_counts", () => {
      const validStats = {
        total: 200,
        usage_count: {
          "1": 50,
          "2": 75,
          "3": 40,
          "4": 35,
        },
      };
      const result = messageStatusStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.usage_count).length).toBe(4);
      }
    });

    it("devrait valider avec usage_count à 0", () => {
      const validStats = {
        total: 10,
        usage_count: {
          "1": 0,
          "2": 10,
        },
      };
      const result = messageStatusStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usage_count["1"]).toBe(0);
      }
    });

    it("devrait valider avec des clés numériques en string", () => {
      const validStats = {
        total: 20,
        usage_count: {
          "100": 15,
          "200": 5,
        },
      };
      const result = messageStatusStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usage_count["100"]).toBe(15);
      }
    });

    it("devrait rejeter si total est manquant", () => {
      const invalidStats = {
        usage_count: {
          "1": 10,
        },
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si usage_count est manquant", () => {
      const invalidStats = {
        total: 50,
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidStats = {
        total: -5,
        usage_count: {},
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est un décimal", () => {
      const invalidStats = {
        total: 10.5,
        usage_count: {},
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est une string", () => {
      const invalidStats = {
        total: "50",
        usage_count: {},
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si usage_count n'est pas un objet", () => {
      const invalidStats = {
        total: 50,
        usage_count: "not an object",
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si usage_count est un array", () => {
      const invalidStats = {
        total: 50,
        usage_count: [1, 2, 3],
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si une valeur de usage_count est négative", () => {
      const invalidStats = {
        total: 50,
        usage_count: {
          "1": -10,
        },
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si une valeur de usage_count est un décimal", () => {
      const invalidStats = {
        total: 50,
        usage_count: {
          "1": 10.5,
        },
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si une valeur de usage_count est une string", () => {
      const invalidStats = {
        total: 50,
        usage_count: {
          "1": "10",
        },
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si usage_count est null", () => {
      const invalidStats = {
        total: 50,
        usage_count: null,
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est null", () => {
      const invalidStats = {
        total: null,
        usage_count: {},
      };
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const invalidStats = {};
      const result = messageStatusStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference - Verify TypeScript types are correctly inferred
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type MessageStatus", () => {
      const status: MessageStatus = {
        id: 1,
        nom: "En attente",
      };
      expect(status.id).toBe(1);
      expect(status.nom).toBe("En attente");
    });

    it("devrait inférer correctement le type CreateMessageStatus", () => {
      const createStatus: CreateMessageStatus = {
        nom: "Nouveau statut",
      };
      expect(createStatus.nom).toBe("Nouveau statut");
    });

    it("devrait inférer correctement le type UpdateMessageStatus", () => {
      const updateStatus: UpdateMessageStatus = {
        nom: "Statut modifié",
      };
      expect(updateStatus.nom).toBe("Statut modifié");
    });

    it("devrait inférer correctement le type UpdateMessageStatus vide", () => {
      const updateStatus: UpdateMessageStatus = {};
      expect(Object.keys(updateStatus).length).toBe(0);
    });

    it("devrait inférer correctement le type ListMessageStatusesQuery", () => {
      const query: ListMessageStatusesQuery = {
        page: 1,
        limit: 20,
        search: "test",
        sort_by: "nom",
        sort_order: "asc",
      };
      expect(query.page).toBe(1);
      expect(query.sort_by).toBe("nom");
    });

    it("devrait inférer correctement le type MessageStatusIdParam", () => {
      const param: MessageStatusIdParam = {
        id: 123,
      };
      expect(param.id).toBe(123);
    });

    it("devrait inférer correctement le type MessageStatusResponse", () => {
      const response: MessageStatusResponse = {
        id: 5,
        nom: "Réponse test",
      };
      expect(response.id).toBe(5);
      expect(response.nom).toBe("Réponse test");
    });

    it("devrait inférer correctement le type MessageStatusesListResponse", () => {
      const response: MessageStatusesListResponse = {
        data: [
          { id: 1, nom: "Statut 1" },
          { id: 2, nom: "Statut 2" },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      };
      expect(response.data).toHaveLength(2);
      expect(response.pagination.total).toBe(2);
    });

    it("devrait inférer correctement le type MessageStatusStats", () => {
      const stats: MessageStatusStats = {
        total: 100,
        usage_count: {
          "1": 50,
          "2": 30,
          "3": 20,
        },
      };
      expect(stats.total).toBe(100);
      expect(stats.usage_count["1"]).toBe(50);
    });
  });
});
