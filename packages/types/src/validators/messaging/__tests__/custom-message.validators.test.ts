/**
 * @fileoverview Comprehensive Tests for Custom Message Validators
 * @module @clubmanager/types/validators/messaging/__tests__/custom-message
 *
 * Tests all Zod schemas from custom-message.validators.ts with comprehensive coverage:
 * - customMessageBaseSchema
 * - createCustomMessageSchema
 * - updateCustomMessageSchema
 * - listCustomMessagesSchema
 * - activeCustomMessagesByTypeSchema
 * - activeCustomMessagesSchema
 * - customMessageIdSchema
 * - customMessageIdStringSchema
 * - customMessageIdParamSchema
 * - activateCustomMessageSchema
 * - deactivateCustomMessageSchema
 * - bulkToggleCustomMessagesSchema
 * - templateVariablesSchema
 * - renderTemplateSchema
 * - renderedTemplateSchema
 * - customMessageResponseSchema
 * - customMessagesListResponseSchema
 * - customMessageStatsSchema
 * - customMessagePreviewSchema
 */

import { describe, it, expect } from "@jest/globals";
import {
  customMessageBaseSchema,
  createCustomMessageSchema,
  updateCustomMessageSchema,
  listCustomMessagesSchema,
  activeCustomMessagesByTypeSchema,
  activeCustomMessagesSchema,
  customMessageIdSchema,
  customMessageIdStringSchema,
  customMessageIdParamSchema,
  activateCustomMessageSchema,
  deactivateCustomMessageSchema,
  bulkToggleCustomMessagesSchema,
  templateVariablesSchema,
  renderTemplateSchema,
  renderedTemplateSchema,
  customMessageResponseSchema,
  customMessagesListResponseSchema,
  customMessageStatsSchema,
  customMessagePreviewSchema,
  type CustomMessage,
  type CreateCustomMessage,
  type UpdateCustomMessage,
  type ListCustomMessagesQuery,
  type ActiveCustomMessagesByTypeQuery,
  type ActiveCustomMessagesQuery,
  type CustomMessageIdParam,
  type ActivateCustomMessage,
  type DeactivateCustomMessage,
  type BulkToggleCustomMessages,
  type TemplateVariables,
  type RenderTemplate,
  type RenderedTemplate,
  type CustomMessageResponse,
  type CustomMessagesListResponse,
  type CustomMessageStats,
  type CustomMessagePreview,
} from "../custom-message.validators.js";
import {
  CUSTOM_MESSAGE_TITLE_MAX_LENGTH,
  CUSTOM_MESSAGE_TITLE_MIN_LENGTH,
  CUSTOM_MESSAGE_CONTENT_MIN_LENGTH,
  CUSTOM_MESSAGE_CONTENT_MAX_LENGTH,
} from "../../../constants/messaging.constants.js";

describe("Custom Message Validators", () => {
  // ============================================================================
  // customMessageBaseSchema - Base schema avec tous les champs
  // ============================================================================
  describe("customMessageBaseSchema", () => {
    it("devrait valider un message personnalisé valide avec tous les champs", () => {
      const validMessage = {
        id: 1,
        type_id: 5,
        titre: "Bienvenue au club",
        contenu: "Bonjour {{prenom}}, bienvenue dans notre club !",
        actif: true,
        created_at: new Date("2024-01-15T10:00:00Z"),
        updated_at: new Date("2024-01-20T14:30:00Z"),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.type_id).toBe(5);
        expect(result.data.titre).toBe("Bienvenue au club");
        expect(result.data.contenu).toBe(
          "Bonjour {{prenom}}, bienvenue dans notre club !",
        );
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec actif par défaut à true", () => {
      const validMessage = {
        id: 2,
        type_id: 3,
        titre: "Rappel cotisation",
        contenu: "Votre cotisation arrive à échéance",
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec updated_at à null", () => {
      const validMessage = {
        id: 3,
        type_id: 2,
        titre: "Message test",
        contenu: "Contenu de test",
        actif: true,
        created_at: new Date(),
        updated_at: null,
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec updated_at optionnel (undefined)", () => {
      const validMessage = {
        id: 4,
        type_id: 1,
        titre: "Test",
        contenu: "Contenu",
        actif: false,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec titre de 1 caractère (longueur minimale)", () => {
      const validMessage = {
        id: 5,
        type_id: 2,
        titre: "A",
        contenu: "Contenu du message",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe("A");
      }
    });

    it("devrait valider avec titre de 255 caractères (longueur maximale)", () => {
      const maxTitle = "A".repeat(CUSTOM_MESSAGE_TITLE_MAX_LENGTH);
      const validMessage = {
        id: 6,
        type_id: 3,
        titre: maxTitle,
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre.length).toBe(CUSTOM_MESSAGE_TITLE_MAX_LENGTH);
      }
    });

    it("devrait valider avec contenu de 1 caractère (longueur minimale)", () => {
      const validMessage = {
        id: 7,
        type_id: 1,
        titre: "Titre court",
        contenu: "X",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de longueur maximale (65535 caractères)", () => {
      const maxContent = "X".repeat(CUSTOM_MESSAGE_CONTENT_MAX_LENGTH);
      const validMessage = {
        id: 8,
        type_id: 2,
        titre: "Long message",
        contenu: maxContent,
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu.length).toBe(
          CUSTOM_MESSAGE_CONTENT_MAX_LENGTH,
        );
      }
    });

    it("devrait trim les espaces du titre", () => {
      const validMessage = {
        id: 9,
        type_id: 4,
        titre: "  Message avec espaces  ",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe("Message avec espaces");
      }
    });

    it("devrait trim les espaces du contenu", () => {
      const validMessage = {
        id: 10,
        type_id: 2,
        titre: "Test",
        contenu: "  Contenu avec espaces  ",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu).toBe("Contenu avec espaces");
      }
    });

    it("devrait coercer une string en Date pour created_at", () => {
      const validMessage = {
        id: 11,
        type_id: 1,
        titre: "Test date",
        contenu: "Contenu",
        actif: true,
        created_at: "2024-01-15T10:00:00Z",
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_at).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour updated_at", () => {
      const validMessage = {
        id: 12,
        type_id: 2,
        titre: "Test",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
        updated_at: "2024-01-20T15:30:00Z",
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updated_at).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec variables de template", () => {
      const validMessage = {
        id: 13,
        type_id: 1,
        titre: "Message avec variables",
        contenu:
          "Bonjour {{nom}} {{prenom}}, votre rendez-vous est le {{date}} à {{heure}}.",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un titre vide après trim", () => {
      const invalidMessage = {
        id: 14,
        type_id: 1,
        titre: "",
        contenu: "Contenu valide",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("titre");
      }
    });

    it("devrait rejeter un titre qui devient vide après trim", () => {
      const invalidMessage = {
        id: 15,
        type_id: 2,
        titre: "   ",
        contenu: "Contenu valide",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("titre");
      }
    });

    it("devrait rejeter un titre trop long (> 255 caractères)", () => {
      const longTitle = "A".repeat(CUSTOM_MESSAGE_TITLE_MAX_LENGTH + 1);
      const invalidMessage = {
        id: 16,
        type_id: 3,
        titre: longTitle,
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("titre");
      }
    });

    it("devrait rejeter un contenu vide", () => {
      const invalidMessage = {
        id: 17,
        type_id: 1,
        titre: "Titre valide",
        contenu: "",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("contenu");
      }
    });

    it("devrait rejeter un contenu qui devient vide après trim", () => {
      const invalidMessage = {
        id: 18,
        type_id: 2,
        titre: "Titre valide",
        contenu: "    ",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("contenu");
      }
    });

    it("devrait rejeter un contenu trop long (> 65535 caractères)", () => {
      const longContent = "X".repeat(CUSTOM_MESSAGE_CONTENT_MAX_LENGTH + 1);
      const invalidMessage = {
        id: 19,
        type_id: 1,
        titre: "Titre",
        contenu: longContent,
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("contenu");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidMessage = {
        type_id: 1,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("devrait rejeter si type_id est manquant", () => {
      const invalidMessage = {
        id: 1,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_id");
      }
    });

    it("devrait rejeter si titre est manquant", () => {
      const invalidMessage = {
        id: 1,
        type_id: 2,
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("titre");
      }
    });

    it("devrait rejeter si contenu est manquant", () => {
      const invalidMessage = {
        id: 1,
        type_id: 2,
        titre: "Titre",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("contenu");
      }
    });

    it("devrait rejeter si created_at est manquant", () => {
      const invalidMessage = {
        id: 1,
        type_id: 2,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("created_at");
      }
    });

    it("devrait rejeter si id est 0", () => {
      const invalidMessage = {
        id: 0,
        type_id: 1,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidMessage = {
        id: -1,
        type_id: 1,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est 0", () => {
      const invalidMessage = {
        id: 1,
        type_id: 0,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est négatif", () => {
      const invalidMessage = {
        id: 1,
        type_id: -1,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidMessage = {
        id: 1,
        type_id: 1,
        titre: "Titre",
        contenu: "Contenu",
        actif: "true",
        created_at: new Date(),
      };
      const result = customMessageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createCustomMessageSchema - Création d'un message personnalisé
  // ============================================================================
  describe("createCustomMessageSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        type_id: 5,
        titre: "Nouveau message",
        contenu: "Bienvenue {{prenom}} {{nom}}",
        actif: true,
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type_id).toBe(5);
        expect(result.data.titre).toBe("Nouveau message");
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec seulement les champs requis", () => {
      const validCreate = {
        type_id: 3,
        titre: "Message minimal",
        contenu: "Contenu minimal",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec actif à false", () => {
      const validCreate = {
        type_id: 2,
        titre: "Message inactif",
        contenu: "Ce message est désactivé",
        actif: false,
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait appliquer actif à true par défaut", () => {
      const validCreate = {
        type_id: 1,
        titre: "Message",
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider avec titre de 1 caractère", () => {
      const validCreate = {
        type_id: 4,
        titre: "T",
        contenu: "Contenu du message",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec titre de longueur maximale", () => {
      const maxTitle = "T".repeat(CUSTOM_MESSAGE_TITLE_MAX_LENGTH);
      const validCreate = {
        type_id: 2,
        titre: maxTitle,
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de 1 caractère", () => {
      const validCreate = {
        type_id: 1,
        titre: "Titre",
        contenu: "C",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de longueur maximale", () => {
      const maxContent = "C".repeat(CUSTOM_MESSAGE_CONTENT_MAX_LENGTH);
      const validCreate = {
        type_id: 3,
        titre: "Long contenu",
        contenu: maxContent,
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du titre", () => {
      const validCreate = {
        type_id: 2,
        titre: "  Titre avec espaces  ",
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe("Titre avec espaces");
      }
    });

    it("devrait trim les espaces du contenu", () => {
      const validCreate = {
        type_id: 3,
        titre: "Titre",
        contenu: "  Contenu avec espaces  ",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu).toBe("Contenu avec espaces");
      }
    });

    it("devrait valider avec plusieurs variables de template", () => {
      const validCreate = {
        type_id: 1,
        titre: "Message {{type}}",
        contenu:
          "Bonjour {{prenom}}, votre {{objet}} est prévu le {{date}} à {{heure}}.",
      };
      const result = createCustomMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si type_id est manquant", () => {
      const invalidCreate = {
        titre: "Titre",
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("type_id");
      }
    });

    it("devrait rejeter si titre est manquant", () => {
      const invalidCreate = {
        type_id: 1,
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("titre");
      }
    });

    it("devrait rejeter si contenu est manquant", () => {
      const invalidCreate = {
        type_id: 1,
        titre: "Titre",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("contenu");
      }
    });

    it("devrait rejeter un titre vide", () => {
      const invalidCreate = {
        type_id: 1,
        titre: "",
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre qui devient vide après trim", () => {
      const invalidCreate = {
        type_id: 1,
        titre: "   ",
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu vide", () => {
      const invalidCreate = {
        type_id: 1,
        titre: "Titre",
        contenu: "",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu qui devient vide après trim", () => {
      const invalidCreate = {
        type_id: 1,
        titre: "Titre",
        contenu: "   ",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre trop long", () => {
      const longTitle = "T".repeat(CUSTOM_MESSAGE_TITLE_MAX_LENGTH + 1);
      const invalidCreate = {
        type_id: 1,
        titre: longTitle,
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu trop long", () => {
      const longContent = "C".repeat(CUSTOM_MESSAGE_CONTENT_MAX_LENGTH + 1);
      const invalidCreate = {
        type_id: 1,
        titre: "Titre",
        contenu: longContent,
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est 0", () => {
      const invalidCreate = {
        type_id: 0,
        titre: "Titre",
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est négatif", () => {
      const invalidCreate = {
        type_id: -1,
        titre: "Titre",
        contenu: "Contenu",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidCreate = {
        type_id: 1,
        titre: "Titre",
        contenu: "Contenu",
        actif: "true",
      };
      const result = createCustomMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateCustomMessageSchema - Mise à jour d'un message personnalisé
  // ============================================================================
  describe("updateCustomMessageSchema", () => {
    it("devrait valider une mise à jour avec tous les champs", () => {
      const validUpdate = {
        type_id: 3,
        titre: "Titre modifié",
        contenu: "Contenu modifié",
        actif: false,
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement type_id", () => {
      const validUpdate = {
        type_id: 2,
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement titre", () => {
      const validUpdate = {
        titre: "Nouveau titre",
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement contenu", () => {
      const validUpdate = {
        contenu: "Nouveau contenu",
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement actif", () => {
      const validUpdate = {
        actif: true,
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec actif à false", () => {
      const validUpdate = {
        actif: false,
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du titre", () => {
      const validUpdate = {
        titre: "  Titre modifié  ",
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe("Titre modifié");
      }
    });

    it("devrait trim les espaces du contenu", () => {
      const validUpdate = {
        contenu: "  Contenu modifié  ",
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu).toBe("Contenu modifié");
      }
    });

    it("devrait valider avec titre de longueur minimale", () => {
      const validUpdate = {
        titre: "T",
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec titre de longueur maximale", () => {
      const maxTitle = "T".repeat(CUSTOM_MESSAGE_TITLE_MAX_LENGTH);
      const validUpdate = {
        titre: maxTitle,
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de longueur minimale", () => {
      const validUpdate = {
        contenu: "C",
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de longueur maximale", () => {
      const maxContent = "C".repeat(CUSTOM_MESSAGE_CONTENT_MAX_LENGTH);
      const validUpdate = {
        contenu: maxContent,
      };
      const result = updateCustomMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un titre vide", () => {
      const invalidUpdate = {
        titre: "",
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre qui devient vide après trim", () => {
      const invalidUpdate = {
        titre: "   ",
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu vide", () => {
      const invalidUpdate = {
        contenu: "",
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu qui devient vide après trim", () => {
      const invalidUpdate = {
        contenu: "   ",
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre trop long", () => {
      const longTitle = "T".repeat(CUSTOM_MESSAGE_TITLE_MAX_LENGTH + 1);
      const invalidUpdate = {
        titre: longTitle,
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu trop long", () => {
      const longContent = "C".repeat(CUSTOM_MESSAGE_CONTENT_MAX_LENGTH + 1);
      const invalidUpdate = {
        contenu: longContent,
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est 0", () => {
      const invalidUpdate = {
        type_id: 0,
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est négatif", () => {
      const invalidUpdate = {
        type_id: -1,
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidUpdate = {
        actif: "true",
      };
      const result = updateCustomMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listCustomMessagesSchema - Liste avec filtres et pagination
  // ============================================================================
  describe("listCustomMessagesSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 2,
        page_size: 20,
        type_id: 5,
        actif: "true",
        search: "bienvenue",
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
        sort_by: "titre",
        sort_order: "asc",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.actif).toBe(true);
        expect(result.data.sort_by).toBe("titre");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement type_id", () => {
      const validQuery = {
        type_id: 3,
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait transformer actif 'true' en boolean true", () => {
      const validQuery = {
        actif: "true",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait transformer actif 'false' en boolean false", () => {
      const validQuery = {
        actif: "false",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait transformer actif '1' en boolean true", () => {
      const validQuery = {
        actif: "1",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait transformer actif '0' en boolean false", () => {
      const validQuery = {
        actif: "0",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec search", () => {
      const validQuery = {
        search: "cotisation",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du search", () => {
      const validQuery = {
        search: "  recherche  ",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("recherche");
      }
    });

    it("devrait valider avec date_debut", () => {
      const validQuery = {
        date_debut: "2024-01-01",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec date_fin", () => {
      const validQuery = {
        date_fin: "2024-12-31",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec date_debut et date_fin", () => {
      const validQuery = {
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        sort_by: "created_at",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by updated_at", () => {
      const validQuery = {
        sort_by: "updated_at",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by titre", () => {
      const validQuery = {
        sort_by: "titre",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by actif", () => {
      const validQuery = {
        sort_by: "actif",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer created_at comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer desc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter si type_id est 0", () => {
      const invalidQuery = {
        type_id: 0,
      };
      const result = listCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est négatif", () => {
      const invalidQuery = {
        type_id: -1,
      };
      const result = listCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "invalid_field",
      };
      const result = listCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid_order",
      };
      const result = listCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        date_debut: "invalid-date",
      };
      const result = listCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        date_fin: "invalid-date",
      };
      const result = listCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // activeCustomMessagesByTypeSchema - Messages actifs par type
  // ============================================================================
  describe("activeCustomMessagesByTypeSchema", () => {
    it("devrait valider avec type_id requis", () => {
      const validQuery = {
        type_id: 5,
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type_id).toBe(5);
      }
    });

    it("devrait appliquer titre comme sort_by par défaut", () => {
      const validQuery = {
        type_id: 3,
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("titre");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {
        type_id: 2,
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        type_id: 1,
        sort_by: "created_at",
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by titre", () => {
      const validQuery = {
        type_id: 4,
        sort_by: "titre",
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        type_id: 2,
        sort_order: "desc",
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si type_id est manquant", () => {
      const invalidQuery = {};
      const result = activeCustomMessagesByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est 0", () => {
      const invalidQuery = {
        type_id: 0,
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est négatif", () => {
      const invalidQuery = {
        type_id: -1,
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        type_id: 1,
        sort_by: "actif",
      };
      const result = activeCustomMessagesByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // activeCustomMessagesSchema - Tous les messages actifs
  // ============================================================================
  describe("activeCustomMessagesSchema", () => {
    it("devrait valider avec tous les champs", () => {
      const validQuery = {
        page: 1,
        page_size: 30,
        type_id: 2,
        sort_by: "titre",
        sort_order: "asc",
      };
      const result = activeCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = activeCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer titre comme sort_by par défaut", () => {
      const validQuery = {};
      const result = activeCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("titre");
      }
    });

    it("devrait appliquer asc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = activeCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec type_id optionnel", () => {
      const validQuery = {
        type_id: 5,
      };
      const result = activeCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        sort_by: "created_at",
      };
      const result = activeCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = activeCustomMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si type_id est 0", () => {
      const invalidQuery = {
        type_id: 0,
      };
      const result = activeCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "actif",
      };
      const result = activeCustomMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageIdSchema - Validation ID numérique
  // ============================================================================
  describe("customMessageIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = customMessageIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = customMessageIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = customMessageIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = customMessageIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = customMessageIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = customMessageIdSchema.safeParse("1");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageIdStringSchema - Validation ID string
  // ============================================================================
  describe("customMessageIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = customMessageIdStringSchema.safeParse("1");
      expect(result.success).toBe(true);
    });

    it("devrait transformer la string en nombre", () => {
      const result = customMessageIdStringSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
        expect(typeof result.data).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const result = customMessageIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = customMessageIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = customMessageIdStringSchema.safeParse("-1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = customMessageIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = customMessageIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = customMessageIdStringSchema.safeParse("1.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = customMessageIdStringSchema.safeParse(" 1 ");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageIdParamSchema - Validation paramètre de route
  // ============================================================================
  describe("customMessageIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "1",
      };
      const result = customMessageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "42",
      };
      const result = customMessageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999",
      };
      const result = customMessageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = customMessageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = customMessageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-1",
      };
      const result = customMessageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = customMessageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = customMessageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "1.5",
      };
      const result = customMessageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // activateCustomMessageSchema - Activation
  // ============================================================================
  describe("activateCustomMessageSchema", () => {
    it("devrait valider avec actif à true", () => {
      const validActivation = {
        actif: true,
      };
      const result = activateCustomMessageSchema.safeParse(validActivation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait rejeter avec actif à false", () => {
      const invalidActivation = {
        actif: false,
      };
      const result = activateCustomMessageSchema.safeParse(invalidActivation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif est manquant", () => {
      const invalidActivation = {};
      const result = activateCustomMessageSchema.safeParse(invalidActivation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidActivation = {
        actif: "true",
      };
      const result = activateCustomMessageSchema.safeParse(invalidActivation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif est 1", () => {
      const invalidActivation = {
        actif: 1,
      };
      const result = activateCustomMessageSchema.safeParse(invalidActivation);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // deactivateCustomMessageSchema - Désactivation
  // ============================================================================
  describe("deactivateCustomMessageSchema", () => {
    it("devrait valider avec actif à false", () => {
      const validDeactivation = {
        actif: false,
      };
      const result = deactivateCustomMessageSchema.safeParse(validDeactivation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait rejeter avec actif à true", () => {
      const invalidDeactivation = {
        actif: true,
      };
      const result =
        deactivateCustomMessageSchema.safeParse(invalidDeactivation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif est manquant", () => {
      const invalidDeactivation = {};
      const result =
        deactivateCustomMessageSchema.safeParse(invalidDeactivation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidDeactivation = {
        actif: "false",
      };
      const result =
        deactivateCustomMessageSchema.safeParse(invalidDeactivation);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif est 0", () => {
      const invalidDeactivation = {
        actif: 0,
      };
      const result =
        deactivateCustomMessageSchema.safeParse(invalidDeactivation);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkToggleCustomMessagesSchema - Opérations groupées
  // ============================================================================
  describe("bulkToggleCustomMessagesSchema", () => {
    it("devrait valider une opération groupée d'activation valide", () => {
      const validBulk = {
        message_ids: [1, 2, 3, 4, 5],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message_ids.length).toBe(5);
        expect(result.data.actif).toBe(true);
      }
    });

    it("devrait valider une opération groupée de désactivation valide", () => {
      const validBulk = {
        message_ids: [10, 20, 30],
        actif: false,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(false);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        message_ids: [1],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        message_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 50 IDs (maximum)", () => {
      const manyIds = Array.from({ length: 50 }, (_, i) => i + 1);
      const validBulk = {
        message_ids: manyIds,
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message_ids.length).toBe(50);
      }
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        message_ids: [5, 2, 8, 1, 3],
        actif: false,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués", () => {
      const validBulk = {
        message_ids: [1, 2, 2, 3, 3, 3],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si message_ids est manquant", () => {
      const invalidBulk = {
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif est manquant", () => {
      const invalidBulk = {
        message_ids: [1, 2, 3],
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        message_ids: [],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Au moins un message doit être sélectionné",
        );
      }
    });

    it("devrait rejeter plus de 50 IDs", () => {
      const tooManyIds = Array.from({ length: 51 }, (_, i) => i + 1);
      const invalidBulk = {
        message_ids: tooManyIds,
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Vous ne pouvez pas modifier plus de 50 messages à la fois",
        );
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        message_ids: [1, 0, 3],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        message_ids: [1, -1, 3],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        message_ids: [1, "2", 3],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        message_ids: [1, 2.5, 3],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        message_ids: [1, null, 3],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        message_ids: [1, undefined, 3],
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si message_ids n'est pas un array", () => {
      const invalidBulk = {
        message_ids: "1,2,3",
        actif: true,
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si actif n'est pas un boolean", () => {
      const invalidBulk = {
        message_ids: [1, 2, 3],
        actif: "true",
      };
      const result = bulkToggleCustomMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // templateVariablesSchema - Variables de template
  // ============================================================================
  describe("templateVariablesSchema", () => {
    it("devrait valider avec variables et exemple", () => {
      const validVariables = {
        variables: ["nom", "prenom", "date"],
        exemple: {
          nom: "Dupont",
          prenom: "Jean",
          date: "2024-01-15",
        },
      };
      const result = templateVariablesSchema.safeParse(validVariables);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variables.length).toBe(3);
      }
    });

    it("devrait valider avec seulement variables", () => {
      const validVariables = {
        variables: ["email", "telephone"],
      };
      const result = templateVariablesSchema.safeParse(validVariables);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un array vide de variables", () => {
      const validVariables = {
        variables: [],
      };
      const result = templateVariablesSchema.safeParse(validVariables);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec exemple vide", () => {
      const validVariables = {
        variables: ["nom"],
        exemple: {},
      };
      const result = templateVariablesSchema.safeParse(validVariables);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs variables", () => {
      const validVariables = {
        variables: [
          "nom",
          "prenom",
          "email",
          "telephone",
          "adresse",
          "ville",
          "code_postal",
        ],
      };
      const result = templateVariablesSchema.safeParse(validVariables);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec exemple contenant valeurs numériques", () => {
      const validVariables = {
        variables: ["montant", "quantite"],
        exemple: {
          montant: "100.50",
          quantite: "5",
        },
      };
      const result = templateVariablesSchema.safeParse(validVariables);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si variables est manquant", () => {
      const invalidVariables = {
        exemple: { nom: "Test" },
      };
      const result = templateVariablesSchema.safeParse(invalidVariables);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si variables n'est pas un array", () => {
      const invalidVariables = {
        variables: "nom,prenom",
      };
      const result = templateVariablesSchema.safeParse(invalidVariables);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si variables contient des non-strings", () => {
      const invalidVariables = {
        variables: ["nom", 123, "prenom"],
      };
      const result = templateVariablesSchema.safeParse(invalidVariables);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // renderTemplateSchema - Rendu de template
  // ============================================================================
  describe("renderTemplateSchema", () => {
    it("devrait valider avec template_id et data", () => {
      const validRender = {
        template_id: 5,
        data: {
          nom: "Dupont",
          prenom: "Jean",
          date: "2024-01-15",
        },
      };
      const result = renderTemplateSchema.safeParse(validRender);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.template_id).toBe(5);
      }
    });

    it("devrait valider avec data contenant des valeurs variées", () => {
      const validRender = {
        template_id: 1,
        data: {
          string: "texte",
          number: 42,
          boolean: true,
          null_value: null,
        },
      };
      const result = renderTemplateSchema.safeParse(validRender);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec data vide", () => {
      const validRender = {
        template_id: 3,
        data: {},
      };
      const result = renderTemplateSchema.safeParse(validRender);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec data contenant des objets imbriqués", () => {
      const validRender = {
        template_id: 2,
        data: {
          utilisateur: {
            nom: "Dupont",
            prenom: "Jean",
          },
          date: "2024-01-15",
        },
      };
      const result = renderTemplateSchema.safeParse(validRender);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si template_id est manquant", () => {
      const invalidRender = {
        data: { nom: "Test" },
      };
      const result = renderTemplateSchema.safeParse(invalidRender);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si data est manquant", () => {
      const invalidRender = {
        template_id: 1,
      };
      const result = renderTemplateSchema.safeParse(invalidRender);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si template_id est 0", () => {
      const invalidRender = {
        template_id: 0,
        data: {},
      };
      const result = renderTemplateSchema.safeParse(invalidRender);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si template_id est négatif", () => {
      const invalidRender = {
        template_id: -1,
        data: {},
      };
      const result = renderTemplateSchema.safeParse(invalidRender);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si data n'est pas un objet", () => {
      const invalidRender = {
        template_id: 1,
        data: "invalid",
      };
      const result = renderTemplateSchema.safeParse(invalidRender);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // renderedTemplateSchema - Résultat de rendu
  // ============================================================================
  describe("renderedTemplateSchema", () => {
    it("devrait valider un template rendu complet", () => {
      const validRendered = {
        titre: "Bienvenue Jean Dupont",
        contenu: "Bonjour Jean Dupont, votre rendez-vous est le 15/01/2024",
        variables_used: ["prenom", "nom", "date"],
        missing_variables: ["heure"],
      };
      const result = renderedTemplateSchema.safeParse(validRendered);
      expect(result.success).toBe(true);
    });

    it("devrait valider sans missing_variables", () => {
      const validRendered = {
        titre: "Message complet",
        contenu: "Toutes les variables sont présentes",
        variables_used: ["nom", "prenom"],
      };
      const result = renderedTemplateSchema.safeParse(validRendered);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec missing_variables vide", () => {
      const validRendered = {
        titre: "Titre",
        contenu: "Contenu",
        variables_used: ["var1"],
        missing_variables: [],
      };
      const result = renderedTemplateSchema.safeParse(validRendered);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec variables_used vide", () => {
      const validRendered = {
        titre: "Message statique",
        contenu: "Aucune variable utilisée",
        variables_used: [],
      };
      const result = renderedTemplateSchema.safeParse(validRendered);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs variables manquantes", () => {
      const validRendered = {
        titre: "Titre",
        contenu: "Contenu",
        variables_used: ["nom"],
        missing_variables: ["prenom", "email", "telephone"],
      };
      const result = renderedTemplateSchema.safeParse(validRendered);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si titre est manquant", () => {
      const invalidRendered = {
        contenu: "Contenu",
        variables_used: [],
      };
      const result = renderedTemplateSchema.safeParse(invalidRendered);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si contenu est manquant", () => {
      const invalidRendered = {
        titre: "Titre",
        variables_used: [],
      };
      const result = renderedTemplateSchema.safeParse(invalidRendered);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si variables_used est manquant", () => {
      const invalidRendered = {
        titre: "Titre",
        contenu: "Contenu",
      };
      const result = renderedTemplateSchema.safeParse(invalidRendered);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si variables_used n'est pas un array", () => {
      const invalidRendered = {
        titre: "Titre",
        contenu: "Contenu",
        variables_used: "nom,prenom",
      };
      const result = renderedTemplateSchema.safeParse(invalidRendered);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si missing_variables n'est pas un array", () => {
      const invalidRendered = {
        titre: "Titre",
        contenu: "Contenu",
        variables_used: [],
        missing_variables: "email",
      };
      const result = renderedTemplateSchema.safeParse(invalidRendered);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageResponseSchema - Réponse API
  // ============================================================================
  describe("customMessageResponseSchema", () => {
    it("devrait valider une réponse complète", () => {
      const validResponse = {
        id: 1,
        type_id: 5,
        titre: "Bienvenue",
        contenu: "Contenu du message {{nom}}",
        actif: true,
        created_at: new Date("2024-01-15T10:00:00Z"),
        updated_at: new Date("2024-01-20T14:30:00Z"),
      };
      const result = customMessageResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 2,
        type_id: 3,
        titre: "Message",
        contenu: "Contenu",
        actif: false,
        created_at: new Date(),
      };
      const result = customMessageResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec updated_at à null", () => {
      const validResponse = {
        id: 3,
        type_id: 1,
        titre: "Test",
        contenu: "Test",
        actif: true,
        created_at: new Date(),
        updated_at: null,
      };
      const result = customMessageResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // customMessagesListResponseSchema - Liste paginée
  // ============================================================================
  describe("customMessagesListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            type_id: 5,
            titre: "Message 1",
            contenu: "Contenu 1",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 2,
            type_id: 3,
            titre: "Message 2",
            contenu: "Contenu 2",
            actif: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 50,
          total_pages: 3,
        },
      };
      const result = customMessagesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(2);
        expect(result.data.pagination.total).toBe(50);
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
      const result = customMessagesListResponseSchema.safeParse(validResponse);
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
      const result =
        customMessagesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result =
        customMessagesListResponseSchema.safeParse(invalidResponse);
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
        customMessagesListResponseSchema.safeParse(invalidResponse);
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
        customMessagesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessageStatsSchema - Statistiques
  // ============================================================================
  describe("customMessageStatsSchema", () => {
    it("devrait valider des statistiques complètes", () => {
      const validStats = {
        total: 100,
        active: 75,
        inactive: 25,
        by_type: {
          "1": 20,
          "2": 30,
          "3": 50,
        },
        most_used: [
          {
            id: 1,
            type_id: 1,
            titre: "Message populaire",
            contenu: "Contenu",
            actif: true,
            created_at: new Date(),
          },
        ],
      };
      const result = customMessageStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
        expect(result.data.active).toBe(75);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total: 0,
        active: 0,
        inactive: 0,
        by_type: {},
        most_used: [],
      };
      const result = customMessageStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 5 messages les plus utilisés (maximum)", () => {
      const validStats = {
        total: 100,
        active: 80,
        inactive: 20,
        by_type: { "1": 100 },
        most_used: [
          {
            id: 1,
            type_id: 1,
            titre: "Msg 1",
            contenu: "C1",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 2,
            type_id: 1,
            titre: "Msg 2",
            contenu: "C2",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 3,
            type_id: 1,
            titre: "Msg 3",
            contenu: "C3",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 4,
            type_id: 1,
            titre: "Msg 4",
            contenu: "C4",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 5,
            type_id: 1,
            titre: "Msg 5",
            contenu: "C5",
            actif: true,
            created_at: new Date(),
          },
        ],
      };
      const result = customMessageStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.most_used.length).toBe(5);
      }
    });

    it("devrait rejeter si total est manquant", () => {
      const invalidStats = {
        active: 50,
        inactive: 25,
        by_type: {},
        most_used: [],
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si active est manquant", () => {
      const invalidStats = {
        total: 100,
        inactive: 25,
        by_type: {},
        most_used: [],
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si inactive est manquant", () => {
      const invalidStats = {
        total: 100,
        active: 75,
        by_type: {},
        most_used: [],
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_type est manquant", () => {
      const invalidStats = {
        total: 100,
        active: 75,
        inactive: 25,
        most_used: [],
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si most_used est manquant", () => {
      const invalidStats = {
        total: 100,
        active: 75,
        inactive: 25,
        by_type: {},
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidStats = {
        total: -1,
        active: 75,
        inactive: 25,
        by_type: {},
        most_used: [],
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si active est négatif", () => {
      const invalidStats = {
        total: 100,
        active: -1,
        inactive: 25,
        by_type: {},
        most_used: [],
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter plus de 5 messages dans most_used", () => {
      const invalidStats = {
        total: 100,
        active: 80,
        inactive: 20,
        by_type: {},
        most_used: [
          {
            id: 1,
            type_id: 1,
            titre: "M1",
            contenu: "C1",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 2,
            type_id: 1,
            titre: "M2",
            contenu: "C2",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 3,
            type_id: 1,
            titre: "M3",
            contenu: "C3",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 4,
            type_id: 1,
            titre: "M4",
            contenu: "C4",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 5,
            type_id: 1,
            titre: "M5",
            contenu: "C5",
            actif: true,
            created_at: new Date(),
          },
          {
            id: 6,
            type_id: 1,
            titre: "M6",
            contenu: "C6",
            actif: true,
            created_at: new Date(),
          },
        ],
      };
      const result = customMessageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // customMessagePreviewSchema - Aperçu de message
  // ============================================================================
  describe("customMessagePreviewSchema", () => {
    it("devrait valider un aperçu complet", () => {
      const validPreview = {
        id: 1,
        type_id: 5,
        type_name: "Bienvenue",
        titre: "Message de bienvenue",
        contenu_preview: "Bonjour {{nom}}, bienvenue dans notre club...",
        actif: true,
        variables: ["nom", "prenom", "date"],
        created_at: new Date("2024-01-15T10:00:00Z"),
        updated_at: new Date("2024-01-20T14:30:00Z"),
      };
      const result = customMessagePreviewSchema.safeParse(validPreview);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.variables.length).toBe(3);
      }
    });

    it("devrait valider avec contenu_preview de 200 caractères (maximum)", () => {
      const maxPreview = "X".repeat(200);
      const validPreview = {
        id: 2,
        type_id: 3,
        type_name: "Test",
        titre: "Titre",
        contenu_preview: maxPreview,
        actif: false,
        variables: [],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(validPreview);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu_preview.length).toBe(200);
      }
    });

    it("devrait valider avec variables vide", () => {
      const validPreview = {
        id: 3,
        type_id: 1,
        type_name: "Message statique",
        titre: "Titre",
        contenu_preview: "Aperçu sans variables",
        actif: true,
        variables: [],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(validPreview);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec updated_at à null", () => {
      const validPreview = {
        id: 4,
        type_id: 2,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: ["var1"],
        created_at: new Date(),
        updated_at: null,
      };
      const result = customMessagePreviewSchema.safeParse(validPreview);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs variables", () => {
      const validPreview = {
        id: 5,
        type_id: 1,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: [
          "nom",
          "prenom",
          "email",
          "telephone",
          "adresse",
          "ville",
          "code_postal",
        ],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(validPreview);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidPreview = {
        type_id: 1,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: [],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_name est manquant", () => {
      const invalidPreview = {
        id: 1,
        type_id: 1,
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: [],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si variables est manquant", () => {
      const invalidPreview = {
        id: 1,
        type_id: 1,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu_preview trop long (> 200 caractères)", () => {
      const tooLongPreview = "X".repeat(201);
      const invalidPreview = {
        id: 1,
        type_id: 1,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: tooLongPreview,
        actif: true,
        variables: [],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si variables n'est pas un array", () => {
      const invalidPreview = {
        id: 1,
        type_id: 1,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: "nom,prenom",
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidPreview = {
        id: 0,
        type_id: 1,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: [],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si type_id est 0", () => {
      const invalidPreview = {
        id: 1,
        type_id: 0,
        type_name: "Type",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: [],
        created_at: new Date(),
      };
      const result = customMessagePreviewSchema.safeParse(invalidPreview);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference - Vérification des types TypeScript
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type CustomMessage", () => {
      const message: CustomMessage = {
        id: 1,
        type_id: 5,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      expect(message.id).toBe(1);
    });

    it("devrait inférer correctement le type CreateCustomMessage", () => {
      const createMessage: CreateCustomMessage = {
        type_id: 3,
        titre: "Nouveau",
        contenu: "Contenu",
        actif: true,
      };
      expect(createMessage.type_id).toBe(3);
    });

    it("devrait inférer correctement le type UpdateCustomMessage", () => {
      const updateMessage: UpdateCustomMessage = {
        titre: "Modifié",
        actif: false,
      };
      expect(updateMessage.actif).toBe(false);
    });

    it("devrait inférer correctement le type ListCustomMessagesQuery", () => {
      const query: ListCustomMessagesQuery = {
        page: 1,
        limit: 20,
        type_id: 5,
        actif: true,
        sort_by: "titre",
        sort_order: "asc",
      };
      expect(query.sort_by).toBe("titre");
    });

    it("devrait inférer correctement le type ActiveCustomMessagesByTypeQuery", () => {
      const query: ActiveCustomMessagesByTypeQuery = {
        type_id: 3,
        sort_by: "titre",
        sort_order: "asc",
      };
      expect(query.type_id).toBe(3);
    });

    it("devrait inférer correctement le type ActiveCustomMessagesQuery", () => {
      const query: ActiveCustomMessagesQuery = {
        page: 1,
        limit: 20,
        sort_by: "created_at",
        sort_order: "desc",
      };
      expect(query.sort_by).toBe("created_at");
    });

    it("devrait inférer correctement le type CustomMessageIdParam", () => {
      const param: CustomMessageIdParam = {
        id: 42,
      };
      expect(param.id).toBe(42);
    });

    it("devrait inférer correctement le type ActivateCustomMessage", () => {
      const activation: ActivateCustomMessage = {
        actif: true,
      };
      expect(activation.actif).toBe(true);
    });

    it("devrait inférer correctement le type DeactivateCustomMessage", () => {
      const deactivation: DeactivateCustomMessage = {
        actif: false,
      };
      expect(deactivation.actif).toBe(false);
    });

    it("devrait inférer correctement le type BulkToggleCustomMessages", () => {
      const bulk: BulkToggleCustomMessages = {
        message_ids: [1, 2, 3],
        actif: true,
      };
      expect(bulk.message_ids.length).toBe(3);
    });

    it("devrait inférer correctement le type TemplateVariables", () => {
      const variables: TemplateVariables = {
        variables: ["nom", "prenom"],
        exemple: { nom: "Dupont", prenom: "Jean" },
      };
      expect(variables.variables.length).toBe(2);
    });

    it("devrait inférer correctement le type RenderTemplate", () => {
      const render: RenderTemplate = {
        template_id: 5,
        data: { nom: "Test" },
      };
      expect(render.template_id).toBe(5);
    });

    it("devrait inférer correctement le type RenderedTemplate", () => {
      const rendered: RenderedTemplate = {
        titre: "Titre rendu",
        contenu: "Contenu rendu",
        variables_used: ["nom"],
        missing_variables: [],
      };
      expect(rendered.variables_used.length).toBe(1);
    });

    it("devrait inférer correctement le type CustomMessageResponse", () => {
      const response: CustomMessageResponse = {
        id: 1,
        type_id: 5,
        titre: "Titre",
        contenu: "Contenu",
        actif: true,
        created_at: new Date(),
      };
      expect(response.id).toBe(1);
    });

    it("devrait inférer correctement le type CustomMessagesListResponse", () => {
      const response: CustomMessagesListResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      expect(response.pagination.page).toBe(1);
    });

    it("devrait inférer correctement le type CustomMessageStats", () => {
      const stats: CustomMessageStats = {
        total: 100,
        active: 75,
        inactive: 25,
        by_type: { "1": 50 },
        most_used: [],
      };
      expect(stats.total).toBe(100);
    });

    it("devrait inférer correctement le type CustomMessagePreview", () => {
      const preview: CustomMessagePreview = {
        id: 1,
        type_id: 5,
        type_name: "Bienvenue",
        titre: "Titre",
        contenu_preview: "Aperçu",
        actif: true,
        variables: ["nom"],
        created_at: new Date(),
      };
      expect(preview.type_name).toBe("Bienvenue");
    });
  });
});
