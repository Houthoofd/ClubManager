/**
 * @fileoverview Tests Complets pour les Validateurs de Types de Messages Personnalisés
 * @module @clubmanager/types/validators/messaging/__tests__/custom-message-type
 *
 * Tests de tous les schémas Zod de custom-message-type.validators.ts avec couverture complète:
 * - customMessageTypeBaseSchema
 * - createCustomMessageTypeSchema
 * - updateCustomMessageTypeSchema
 * - listCustomMessageTypesSchema
 * - activeCustomMessageTypesSchema
 * - customMessageTypeIdSchema
 * - customMessageTypeIdStringSchema
 * - customMessageTypeIdParamSchema
 * - customMessageTypeResponseSchema
 * - customMessageTypesListResponseSchema
 * - customMessageTypeStatsSchema
 */

import { describe, it, expect } from "@jest/globals";
import {
  customMessageTypeBaseSchema,
  createCustomMessageTypeSchema,
  updateCustomMessageTypeSchema,
  listCustomMessageTypesSchema,
  activeCustomMessageTypesSchema,
  customMessageTypeIdSchema,
  customMessageTypeIdStringSchema,
  customMessageTypeIdParamSchema,
  customMessageTypeResponseSchema,
  customMessageTypesListResponseSchema,
  customMessageTypeStatsSchema,
  type CustomMessageType,
  type CreateCustomMessageType,
  type UpdateCustomMessageType,
  type ListCustomMessageTypesQuery,
  type ActiveCustomMessageTypesQuery,
  type CustomMessageTypeIdParam,
  type CustomMessageTypeResponse,
  type CustomMessageTypesListResponse,
  type CustomMessageTypeStats,
} from "../custom-message-type.validators.js";
import {
  CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH,
  CUSTOM_MESSAGE_TYPE_NAME_MIN_LENGTH,
  CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH,
} from "../../../constants/messaging.constants.js";

describe("Custom Message Type Validators", () => {
  // ============================================================================
  // customMessageTypeBaseSchema - Schéma de base avec tous les champs
  // ============================================================================
  describe("customMessageTypeBaseSchema", () => {
    it("devrait valider un type de message personnalisé valide avec tous les champs", () => {
      const validType = {
        id: 1,
        nom: "Bienvenue",
        description: "Message de bienvenue pour les nouveaux membres",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("Bienvenue");
        expect(result.data.description).toBe(
          "Message de bienvenue pour les nouveaux membres",
        );
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec actif par défaut à true", () => {
      const validType = {
        id: 2,
        nom: "Rappel",
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec description à null", () => {
      const validType = {
        id: 3,
        nom: "Notification",
        description: null,
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec description optionnelle (undefined)", () => {
      const validType = {
        id: 4,
        nom: "Alerte",
        actif: false,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it("devrait valider avec actif à false", () => {
      const validType = {
        id: 5,
        nom: "Ancien type",
        description: "Type désactivé",
        actif: false,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec nom de 1 caractère (longueur minimale)", () => {
      const validType = {
        id: 6,
        nom: "A",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("A");
      }
    });

    it("devrait valider avec nom de 100 caractères (longueur maximale)", () => {
      const maxName = "A".repeat(CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH);
      const validType = {
        id: 7,
        nom: maxName,
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe(maxName);
        expect(result.data.nom.length).toBe(
          CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH,
        );
      }
    });

    it("devrait valider avec description de longueur maximale (65535 caractères)", () => {
      const maxDescription = "A".repeat(
        CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH,
      );
      const validType = {
        id: 8,
        nom: "Type avec description longue",
        description: maxDescription,
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description?.length).toBe(
          CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH,
        );
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validType = {
        id: 9,
        nom: "  Bienvenue  ",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Bienvenue");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validType = {
        id: 10,
        nom: "Type test",
        description: "  Description avec espaces  ",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description avec espaces");
      }
    });

    it("devrait valider avec caractères spéciaux dans le nom", () => {
      const validType = {
        id: 11,
        nom: "Message d'accueil - Été 2024",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Message d'accueil - Été 2024");
      }
    });

    it("devrait valider avec caractères accentués dans le nom", () => {
      const validType = {
        id: 12,
        nom: "Réunion générale été",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(validType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Réunion générale été");
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidType = {
        id: 1,
        nom: "",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "au moins 1 caractère",
        );
      }
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidType = {
        id: 2,
        nom: "   ",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "au moins 1 caractère",
        );
      }
    });

    it("devrait rejeter un nom trop long (> 100 caractères)", () => {
      const longName = "A".repeat(CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH + 1);
      const invalidType = {
        id: 3,
        nom: longName,
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          `dépasser ${CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH} caractères`,
        );
      }
    });

    it("devrait rejeter une description trop longue (> 65535 caractères)", () => {
      const longDescription = "A".repeat(
        CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH + 1,
      );
      const invalidType = {
        id: 4,
        nom: "Type test",
        description: longDescription,
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          `dépasser ${CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH} caractères`,
        );
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidType = {
        nom: "Type test",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidType = {
        id: 5,
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidType = {
        id: 0,
        nom: "Type test",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidType = {
        id: -1,
        nom: "Type test",
        actif: true,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidType = {
        id: 6,
        nom: "Type test",
        actif: "true",
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif est un nombre", () => {
      const invalidType = {
        id: 7,
        nom: "Type test",
        actif: 1,
      };
      const result = customMessageTypeBaseSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createCustomMessageTypeSchema - Schéma de création
  // ============================================================================
  describe("createCustomMessageTypeSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        nom: "Bienvenue",
        description: "Message de bienvenue pour les nouveaux membres",
        actif: true,
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Bienvenue");
        expect(result.data.description).toBe(
          "Message de bienvenue pour les nouveaux membres",
        );
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec seulement le nom (champ requis)", () => {
      const validCreate = {
        nom: "Rappel",
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Rappel");
        expect(result.data.actif).toBe(true); // valeur par défaut
      }
    });

    it("devrait appliquer actif par défaut à true", () => {
      const validCreate = {
        nom: "Notification",
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec actif explicitement à false", () => {
      const validCreate = {
        nom: "Type désactivé",
        actif: false,
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec description à null", () => {
      const validCreate = {
        nom: "Type sans description",
        description: null,
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec nom de 1 caractère", () => {
      const validCreate = {
        nom: "X",
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec nom de longueur maximale", () => {
      const maxName = "A".repeat(CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH);
      const validCreate = {
        nom: maxName,
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom.length).toBe(
          CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH,
        );
      }
    });

    it("devrait valider avec description de longueur maximale", () => {
      const maxDescription = "A".repeat(
        CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH,
      );
      const validCreate = {
        nom: "Type test",
        description: maxDescription,
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description?.length).toBe(
          CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH,
        );
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validCreate = {
        nom: "  Bienvenue  ",
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Bienvenue");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validCreate = {
        nom: "Type test",
        description: "  Description avec espaces  ",
      };
      const result = createCustomMessageTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description avec espaces");
      }
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidCreate = {
        description: "Description sans nom",
      };
      const result = createCustomMessageTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom vide", () => {
      const invalidCreate = {
        nom: "",
      };
      const result = createCustomMessageTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidCreate = {
        nom: "   ",
      };
      const result = createCustomMessageTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "A".repeat(CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH + 1);
      const invalidCreate = {
        nom: longName,
      };
      const result = createCustomMessageTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description trop longue", () => {
      const longDescription = "A".repeat(
        CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH + 1,
      );
      const invalidCreate = {
        nom: "Type test",
        description: longDescription,
      };
      const result = createCustomMessageTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidCreate = {
        nom: "Type test",
        actif: "true",
      };
      const result = createCustomMessageTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateCustomMessageTypeSchema - Schéma de mise à jour
  // ============================================================================
  describe("updateCustomMessageTypeSchema", () => {
    it("devrait valider une mise à jour avec tous les champs", () => {
      const validUpdate = {
        nom: "Nouveau nom",
        description: "Nouvelle description",
        actif: false,
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nouveau nom");
        expect(result.data.description).toBe("Nouvelle description");
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec seulement le nom", () => {
      const validUpdate = {
        nom: "Nom modifié",
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nom modifié");
      }
    });

    it("devrait valider avec seulement la description", () => {
      const validUpdate = {
        description: "Description modifiée",
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description modifiée");
      }
    });

    it("devrait valider avec seulement actif", () => {
      const validUpdate = {
        actif: false,
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec description à null", () => {
      const validUpdate = {
        description: null,
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec nom de 1 caractère", () => {
      const validUpdate = {
        nom: "Y",
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec nom de longueur maximale", () => {
      const maxName = "A".repeat(CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH);
      const validUpdate = {
        nom: maxName,
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du nom", () => {
      const validUpdate = {
        nom: "  Nom avec espaces  ",
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nom avec espaces");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validUpdate = {
        description: "  Description avec espaces  ",
      };
      const result = updateCustomMessageTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description avec espaces");
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidUpdate = {
        nom: "",
      };
      const result = updateCustomMessageTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidUpdate = {
        nom: "   ",
      };
      const result = updateCustomMessageTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "A".repeat(CUSTOM_MESSAGE_TYPE_NAME_MAX_LENGTH + 1);
      const invalidUpdate = {
        nom: longName,
      };
      const result = updateCustomMessageTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description trop longue", () => {
      const longDescription = "A".repeat(
        CUSTOM_MESSAGE_TYPE_DESCRIPTION_MAX_LENGTH + 1,
      );
      const invalidUpdate = {
        description: longDescription,
      };
      const result = updateCustomMessageTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidUpdate = {
        actif: "false",
      };
      const result = updateCustomMessageTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listCustomMessageTypesSchema - Schéma de liste avec filtres
  // ============================================================================
  describe("listCustomMessageTypesSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 2,
        limit: 15,
        actif: "true",
        search: "bienvenue",
        sort_by: "nom",
        sort_order: "asc",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(15);
        expect(result.data.actif).toBe(true);
        expect(result.data.search).toBe("bienvenue");
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement actif", () => {
      const validQuery = {
        actif: "true",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it('devrait transformer actif "true" en boolean true', () => {
      const validQuery = {
        actif: "true",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
        expect(typeof result.data.actif).toBe("boolean");
      }
    });

    it('devrait transformer actif "false" en boolean false', () => {
      const validQuery = {
        actif: "false",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
        expect(typeof result.data.actif).toBe("boolean");
      }
    });

    it('devrait transformer actif "1" en boolean true', () => {
      const validQuery = {
        actif: "1",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it('devrait transformer actif "0" en boolean false', () => {
      const validQuery = {
        actif: "0",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait transformer actif autre valeur en false", () => {
      const validQuery = {
        actif: "any",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec seulement search", () => {
      const validQuery = {
        search: "rappel",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("rappel");
      }
    });

    it("devrait trim les espaces du search", () => {
      const validQuery = {
        search: "  bienvenue  ",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("bienvenue");
      }
    });

    it("devrait valider avec sort_by nom", () => {
      const validQuery = {
        sort_by: "nom",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait valider avec sort_by actif", () => {
      const validQuery = {
        sort_by: "actif",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("actif");
      }
    });

    it("devrait appliquer nom comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec page et limit", () => {
      const validQuery = {
        page: 3,
        limit: 25,
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it("devrait valider avec actif et search combinés", () => {
      const validQuery = {
        actif: "true",
        search: "bienvenue",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
        expect(result.data.search).toBe("bienvenue");
      }
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "invalid",
      };
      const result = listCustomMessageTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid",
      };
      const result = listCustomMessageTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec page 1 et limit 1", () => {
      const validQuery = {
        page: 1,
        limit: 1,
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(1);
      }
    });

    it("devrait valider avec search vide après trim", () => {
      const validQuery = {
        search: "   ",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("");
      }
    });

    it("devrait valider avec caractères spéciaux dans search", () => {
      const validQuery = {
        search: "Message d'accueil",
      };
      const result = listCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("Message d'accueil");
      }
    });
  });

  // ============================================================================
  // activeCustomMessageTypesSchema - Schéma pour types actifs uniquement
  // ============================================================================
  describe("activeCustomMessageTypesSchema", () => {
    it("devrait valider une query complète", () => {
      const validQuery = {
        sort_by: "nom",
        sort_order: "asc",
      };
      const result = activeCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = activeCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer nom comme sort_by par défaut", () => {
      const validQuery = {};
      const result = activeCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = activeCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = activeCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "actif",
      };
      const result = activeCustomMessageTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid",
      };
      const result = activeCustomMessageTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec sort_by et sort_order explicites", () => {
      const validQuery = {
        sort_by: "nom",
        sort_order: "asc",
      };
      const result = activeCustomMessageTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("asc");
      }
    });
  });

  // ============================================================================
  // customMessageTypeIdSchema - Validation d'ID numérique
  // ============================================================================
  describe("customMessageTypeIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = customMessageTypeIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = customMessageTypeIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = customMessageTypeIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = customMessageTypeIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = customMessageTypeIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = customMessageTypeIdSchema.safeParse("1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = customMessageTypeIdSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = customMessageTypeIdSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageTypeIdStringSchema - Validation d'ID string
  // ============================================================================
  describe("customMessageTypeIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = customMessageTypeIdStringSchema.safeParse("1");
      expect(result.success).toBe(true);
    });

    it("devrait transformer la string en nombre", () => {
      const result = customMessageTypeIdStringSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
        expect(typeof result.data).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const result = customMessageTypeIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = customMessageTypeIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = customMessageTypeIdStringSchema.safeParse("-1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = customMessageTypeIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = customMessageTypeIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = customMessageTypeIdStringSchema.safeParse("1.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = customMessageTypeIdStringSchema.safeParse(" 1 ");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre directement", () => {
      const result = customMessageTypeIdStringSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageTypeIdParamSchema - Validation d'ID dans les params
  // ============================================================================
  describe("customMessageTypeIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "1",
      };
      const result = customMessageTypeIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "42",
      };
      const result = customMessageTypeIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(42);
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999",
      };
      const result = customMessageTypeIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = customMessageTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = customMessageTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-1",
      };
      const result = customMessageTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = customMessageTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = customMessageTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "1.5",
      };
      const result = customMessageTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageTypeResponseSchema - Schéma de réponse
  // ============================================================================
  describe("customMessageTypeResponseSchema", () => {
    it("devrait valider une réponse complète", () => {
      const validResponse = {
        id: 1,
        nom: "Bienvenue",
        description: "Message de bienvenue pour les nouveaux membres",
        actif: true,
      };
      const result = customMessageTypeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("Bienvenue");
        expect(result.data.description).toBe(
          "Message de bienvenue pour les nouveaux membres",
        );
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 2,
        nom: "Rappel",
        actif: true,
      };
      const result = customMessageTypeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec description à null", () => {
      const validResponse = {
        id: 3,
        nom: "Notification",
        description: null,
        actif: false,
      };
      const result = customMessageTypeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec actif à false", () => {
      const validResponse = {
        id: 4,
        nom: "Type désactivé",
        actif: false,
      };
      const result = customMessageTypeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });
  });

  // ============================================================================
  // customMessageTypesListResponseSchema - Schéma de liste paginée
  // ============================================================================
  describe("customMessageTypesListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            nom: "Bienvenue",
            description: "Message de bienvenue",
            actif: true,
          },
          {
            id: 2,
            nom: "Rappel",
            description: "Message de rappel",
            actif: true,
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      };
      const result =
        customMessageTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(2);
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.page_size).toBe(20);
        expect(result.data.pagination.total).toBe(2);
        expect(result.data.pagination.total_pages).toBe(1);
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
      const result =
        customMessageTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });

    it("devrait valider avec plusieurs pages", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            nom: "Type 1",
            actif: true,
          },
        ],
        pagination: {
          page: 2,
          page_size: 15,
          total: 50,
          total_pages: 4,
        },
      };
      const result =
        customMessageTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pagination.page).toBe(2);
        expect(result.data.pagination.total_pages).toBe(4);
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
        customMessageTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result =
        customMessageTypesListResponseSchema.safeParse(invalidResponse);
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
        customMessageTypesListResponseSchema.safeParse(invalidResponse);
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
        customMessageTypesListResponseSchema.safeParse(invalidResponse);
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
      const result =
        customMessageTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec total_pages à 0", () => {
      const validResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      const result =
        customMessageTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec data contenant des descriptions null", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            nom: "Type 1",
            description: null,
            actif: true,
          },
          {
            id: 2,
            nom: "Type 2",
            description: null,
            actif: false,
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      };
      const result =
        customMessageTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si page_size est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: -1,
          total: 0,
          total_pages: 0,
        },
      };
      const result =
        customMessageTypesListResponseSchema.safeParse(invalidResponse);
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
        customMessageTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageTypeStatsSchema - Schéma de statistiques
  // ============================================================================
  describe("customMessageTypeStatsSchema", () => {
    it("devrait valider des statistiques valides", () => {
      const validStats = {
        total: 10,
        active: 8,
        inactive: 2,
        templates_count: {
          "1": 5,
          "2": 3,
          "3": 0,
        },
      };
      const result = customMessageTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(10);
        expect(result.data.active).toBe(8);
        expect(result.data.inactive).toBe(2);
        expect(result.data.templates_count["1"]).toBe(5);
        expect(result.data.templates_count["2"]).toBe(3);
        expect(result.data.templates_count["3"]).toBe(0);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total: 0,
        active: 0,
        inactive: 0,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
        expect(result.data.active).toBe(0);
        expect(result.data.inactive).toBe(0);
      }
    });

    it("devrait valider avec templates_count vide", () => {
      const validStats = {
        total: 5,
        active: 5,
        inactive: 0,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec de nombreux templates", () => {
      const validStats = {
        total: 5,
        active: 5,
        inactive: 0,
        templates_count: {
          "1": 10,
          "2": 20,
          "3": 30,
          "4": 0,
          "5": 15,
        },
      };
      const result = customMessageTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.templates_count).length).toBe(5);
      }
    });

    it("devrait rejeter si total est manquant", () => {
      const invalidStats = {
        active: 8,
        inactive: 2,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si active est manquant", () => {
      const invalidStats = {
        total: 10,
        inactive: 2,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si inactive est manquant", () => {
      const invalidStats = {
        total: 10,
        active: 8,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si templates_count est manquant", () => {
      const invalidStats = {
        total: 10,
        active: 8,
        inactive: 2,
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidStats = {
        total: -1,
        active: 8,
        inactive: 2,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si active est négatif", () => {
      const invalidStats = {
        total: 10,
        active: -1,
        inactive: 2,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si inactive est négatif", () => {
      const invalidStats = {
        total: 10,
        active: 8,
        inactive: -1,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si templates_count contient une valeur négative", () => {
      const invalidStats = {
        total: 10,
        active: 8,
        inactive: 2,
        templates_count: {
          "1": 5,
          "2": -3,
        },
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des strings", () => {
      const invalidStats = {
        total: "10",
        active: "8",
        inactive: "2",
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des décimaux", () => {
      const invalidStats = {
        total: 10.5,
        active: 8.5,
        inactive: 2.5,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si templates_count contient une valeur décimale", () => {
      const invalidStats = {
        total: 10,
        active: 8,
        inactive: 2,
        templates_count: {
          "1": 5.5,
        },
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si templates_count contient une string", () => {
      const invalidStats = {
        total: 10,
        active: 8,
        inactive: 2,
        templates_count: {
          "1": "5",
        },
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si templates_count n'est pas un objet", () => {
      const invalidStats = {
        total: 10,
        active: 8,
        inactive: 2,
        templates_count: [],
      };
      const result = customMessageTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait valider avec templates_count ayant plusieurs types avec 0 templates", () => {
      const validStats = {
        total: 5,
        active: 5,
        inactive: 0,
        templates_count: {
          "1": 0,
          "2": 0,
          "3": 0,
        },
      };
      const result = customMessageTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec active + inactive égal à total", () => {
      const validStats = {
        total: 100,
        active: 75,
        inactive: 25,
        templates_count: {},
      };
      const result = customMessageTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active + result.data.inactive).toBe(
          result.data.total,
        );
      }
    });
  });

  // ============================================================================
  // Type Inference - Vérification des types TypeScript
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type CustomMessageType", () => {
      const type: CustomMessageType = {
        id: 1,
        nom: "Bienvenue",
        description: "Message de bienvenue",
        actif: true,
      };
      expect(type.id).toBe(1);
      expect(type.nom).toBe("Bienvenue");
    });

    it("devrait inférer correctement le type CreateCustomMessageType", () => {
      const create: CreateCustomMessageType = {
        nom: "Nouveau type",
        description: "Description",
        actif: true,
      };
      expect(create.nom).toBe("Nouveau type");
    });

    it("devrait inférer correctement le type UpdateCustomMessageType", () => {
      const update: UpdateCustomMessageType = {
        nom: "Nom modifié",
      };
      expect(update.nom).toBe("Nom modifié");
    });

    it("devrait inférer correctement le type ListCustomMessageTypesQuery", () => {
      const query: ListCustomMessageTypesQuery = {
        page: 1,
        limit: 20,
        actif: true,
        search: "test",
        sort_by: "nom",
        sort_order: "asc",
      };
      expect(query.page).toBe(1);
    });

    it("devrait inférer correctement le type ActiveCustomMessageTypesQuery", () => {
      const query: ActiveCustomMessageTypesQuery = {
        sort_by: "nom",
        sort_order: "asc",
      };
      expect(query.sort_by).toBe("nom");
    });

    it("devrait inférer correctement le type CustomMessageTypeIdParam", () => {
      const param: CustomMessageTypeIdParam = {
        id: 1,
      };
      expect(param.id).toBe(1);
    });

    it("devrait inférer correctement le type CustomMessageTypeResponse", () => {
      const response: CustomMessageTypeResponse = {
        id: 1,
        nom: "Bienvenue",
        description: "Description",
        actif: true,
      };
      expect(response.id).toBe(1);
    });

    it("devrait inférer correctement le type CustomMessageTypesListResponse", () => {
      const response: CustomMessageTypesListResponse = {
        data: [
          {
            id: 1,
            nom: "Type 1",
            actif: true,
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 1,
          total_pages: 1,
        },
      };
      expect(response.data.length).toBe(1);
    });

    it("devrait inférer correctement le type CustomMessageTypeStats", () => {
      const stats: CustomMessageTypeStats = {
        total: 10,
        active: 8,
        inactive: 2,
        templates_count: {
          "1": 5,
          "2": 3,
        },
      };
      expect(stats.total).toBe(10);
    });
  });
});
