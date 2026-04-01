/**
 * @fileoverview Comprehensive Tests for Message Validators
 * @module @clubmanager/types/validators/messaging/__tests__/message
 *
 * Tests all Zod schemas from message.validators.ts with comprehensive coverage:
 * - messageBaseSchema
 * - createMessageSchema
 * - updateMessageSchema
 * - listMessagesSchema
 * - messageInboxSchema
 * - messageOutboxSchema
 * - bulkMarkReadSchema
 * - bulkDeleteMessagesSchema
 * - messageIdParamSchema
 * - And all other exported schemas
 */

import { describe, it, expect } from "@jest/globals";
import {
  messageBaseSchema,
  createMessageSchema,
  updateMessageSchema,
  listMessagesSchema,
  messageInboxSchema,
  messageOutboxSchema,
  bulkMarkReadSchema,
  bulkDeleteMessagesSchema,
  messageIdSchema,
  messageIdStringSchema,
  messageIdParamSchema,
  messageResponseSchema,
  messagesListResponseSchema,
  messageStatsSchema,
  type Message,
  type CreateMessage,
  type UpdateMessage,
  type ListMessagesQuery,
  type MessageInboxQuery,
  type MessageOutboxQuery,
  type BulkMarkRead,
  type BulkDeleteMessages,
  type MessageIdParam,
  type MessageResponse,
  type MessagesListResponse,
  type MessageStats,
} from "../message.validators.js";
import {
  MESSAGE_SUBJECT_MAX_LENGTH,
  MESSAGE_SUBJECT_MIN_LENGTH,
  MESSAGE_CONTENT_MIN_LENGTH,
  MESSAGE_CONTENT_MAX_LENGTH,
} from "../../../constants/messaging.constants.js";

describe("Message Validators", () => {
  // ============================================================================
  // messageBaseSchema - Base message schema with all fields
  // ============================================================================
  describe("messageBaseSchema", () => {
    it("devrait valider un message valide avec tous les champs", () => {
      const validMessage = {
        id: 1,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "Réunion équipe",
        contenu: "Bonjour, voici le contenu du message",
        lu: false,
        date_lecture: null,
        created_at: new Date("2024-01-15T10:00:00Z"),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.expediteur_id).toBe(10);
        expect(result.data.destinataire_id).toBe(20);
        expect(result.data.sujet).toBe("Réunion équipe");
        expect(result.data.contenu).toBe(
          "Bonjour, voici le contenu du message",
        );
        expect(result.data.lu).toBe(false);
        expect(result.data.date_lecture).toBe(null);
      }
    });

    it("devrait valider avec lu par défaut à false", () => {
      const validMessage = {
        id: 2,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message test",
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec sujet à null", () => {
      const validMessage = {
        id: 3,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: null,
        contenu: "Message sans sujet",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sujet optionnel (undefined)", () => {
      const validMessage = {
        id: 4,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message sans sujet",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_lecture à null", () => {
      const validMessage = {
        id: 5,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message non lu",
        lu: false,
        date_lecture: null,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_lecture optionnelle (undefined)", () => {
      const validMessage = {
        id: 6,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message non lu",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_lecture définie quand lu est true", () => {
      const validMessage = {
        id: 7,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message lu",
        lu: true,
        date_lecture: new Date("2024-01-16T10:00:00Z"),
        created_at: new Date("2024-01-15T10:00:00Z"),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
        expect(result.data.date_lecture).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec sujet de 1 caractère (longueur minimale)", () => {
      const validMessage = {
        id: 8,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "A",
        contenu: "Message avec sujet minimal",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sujet de 255 caractères (longueur maximale)", () => {
      const maxSubject = "A".repeat(MESSAGE_SUBJECT_MAX_LENGTH);
      const validMessage = {
        id: 9,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: maxSubject,
        contenu: "Message avec sujet maximal",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sujet).toBe(maxSubject);
      }
    });

    it("devrait valider avec contenu de 1 caractère (longueur minimale)", () => {
      const validMessage = {
        id: 10,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "A",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de longueur maximale (65535 caractères)", () => {
      const maxContent = "A".repeat(MESSAGE_CONTENT_MAX_LENGTH);
      const validMessage = {
        id: 11,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: maxContent,
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu.length).toBe(MESSAGE_CONTENT_MAX_LENGTH);
      }
    });

    it("devrait trim les espaces du sujet", () => {
      const validMessage = {
        id: 12,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "  Sujet avec espaces  ",
        contenu: "Contenu du message",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sujet).toBe("Sujet avec espaces");
      }
    });

    it("devrait trim les espaces du contenu", () => {
      const validMessage = {
        id: 13,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "  Contenu avec espaces  ",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu).toBe("Contenu avec espaces");
      }
    });

    it("devrait coercer une string en Date pour created_at", () => {
      const validMessage = {
        id: 14,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message test",
        lu: false,
        created_at: "2024-01-15T10:00:00Z",
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_at).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour date_lecture", () => {
      const validMessage = {
        id: 15,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message lu",
        lu: true,
        date_lecture: "2024-01-16T10:00:00Z",
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_lecture).toBeInstanceOf(Date);
      }
    });

    it("devrait rejeter un sujet vide après trim", () => {
      const invalidMessage = {
        id: 16,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "",
        contenu: "Contenu du message",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("au moins");
      }
    });

    it("devrait rejeter un sujet qui devient vide après trim", () => {
      const invalidMessage = {
        id: 17,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "   ",
        contenu: "Contenu du message",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("au moins");
      }
    });

    it("devrait rejeter un sujet trop long (> 255 caractères)", () => {
      const longSubject = "A".repeat(MESSAGE_SUBJECT_MAX_LENGTH + 1);
      const invalidMessage = {
        id: 18,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: longSubject,
        contenu: "Contenu du message",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("dépasser");
      }
    });

    it("devrait rejeter un contenu vide", () => {
      const invalidMessage = {
        id: 19,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("au moins");
      }
    });

    it("devrait rejeter un contenu qui devient vide après trim", () => {
      const invalidMessage = {
        id: 20,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "    ",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("au moins");
      }
    });

    it("devrait rejeter un contenu trop long (> 65535 caractères)", () => {
      const longContent = "A".repeat(MESSAGE_CONTENT_MAX_LENGTH + 1);
      const invalidMessage = {
        id: 21,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: longContent,
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("dépasser");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidMessage = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message sans ID",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si expediteur_id est manquant", () => {
      const invalidMessage = {
        id: 22,
        destinataire_id: 20,
        contenu: "Message sans expéditeur",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est manquant", () => {
      const invalidMessage = {
        id: 23,
        expediteur_id: 10,
        contenu: "Message sans destinataire",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si contenu est manquant", () => {
      const invalidMessage = {
        id: 24,
        expediteur_id: 10,
        destinataire_id: 20,
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si created_at est manquant", () => {
      const invalidMessage = {
        id: 25,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message sans date",
        lu: false,
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidMessage = {
        id: 0,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message avec ID 0",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidMessage = {
        id: -1,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message avec ID négatif",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si expediteur_id est 0", () => {
      const invalidMessage = {
        id: 26,
        expediteur_id: 0,
        destinataire_id: 20,
        contenu: "Message avec expéditeur 0",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si expediteur_id est négatif", () => {
      const invalidMessage = {
        id: 27,
        expediteur_id: -1,
        destinataire_id: 20,
        contenu: "Message avec expéditeur négatif",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est 0", () => {
      const invalidMessage = {
        id: 28,
        expediteur_id: 10,
        destinataire_id: 0,
        contenu: "Message avec destinataire 0",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est négatif", () => {
      const invalidMessage = {
        id: 29,
        expediteur_id: 10,
        destinataire_id: -1,
        contenu: "Message avec destinataire négatif",
        lu: false,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu n'est pas un boolean", () => {
      const invalidMessage = {
        id: 30,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message test",
        lu: "true" as any,
        created_at: new Date(),
      };
      const result = messageBaseSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createMessageSchema - Schema for creating a new message
  // ============================================================================
  describe("createMessageSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "Réunion d'équipe",
        contenu: "Bonjour, merci de confirmer votre présence",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expediteur_id).toBe(10);
        expect(result.data.destinataire_id).toBe(20);
        expect(result.data.sujet).toBe("Réunion d'équipe");
        expect(result.data.contenu).toBe(
          "Bonjour, merci de confirmer votre présence",
        );
      }
    });

    it("devrait valider avec seulement les champs requis (sans sujet)", () => {
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message sans sujet",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sujet à null", () => {
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: null,
        contenu: "Message avec sujet null",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sujet de 1 caractère", () => {
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "A",
        contenu: "Message avec sujet minimal",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sujet de longueur maximale", () => {
      const maxSubject = "A".repeat(MESSAGE_SUBJECT_MAX_LENGTH);
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: maxSubject,
        contenu: "Message avec sujet maximal",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de 1 caractère", () => {
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "A",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec contenu de longueur maximale", () => {
      const maxContent = "A".repeat(MESSAGE_CONTENT_MAX_LENGTH);
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: maxContent,
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du sujet", () => {
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "  Sujet avec espaces  ",
        contenu: "Contenu du message",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sujet).toBe("Sujet avec espaces");
      }
    });

    it("devrait trim les espaces du contenu", () => {
      const validCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "  Contenu avec espaces  ",
      };
      const result = createMessageSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contenu).toBe("Contenu avec espaces");
      }
    });

    it("devrait rejeter si expediteur_id et destinataire_id sont identiques", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 10,
        contenu: "Message à soi-même",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("différents");
        expect(result.error.issues[0].path).toContain("destinataire_id");
      }
    });

    it("devrait rejeter si expediteur_id est manquant", () => {
      const invalidCreate = {
        destinataire_id: 20,
        contenu: "Message sans expéditeur",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est manquant", () => {
      const invalidCreate = {
        expediteur_id: 10,
        contenu: "Message sans destinataire",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si contenu est manquant", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu vide", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu qui devient vide après trim", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "   ",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sujet vide", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "",
        contenu: "Contenu valide",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sujet qui devient vide après trim", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "   ",
        contenu: "Contenu valide",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sujet trop long", () => {
      const longSubject = "A".repeat(MESSAGE_SUBJECT_MAX_LENGTH + 1);
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: longSubject,
        contenu: "Contenu valide",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un contenu trop long", () => {
      const longContent = "A".repeat(MESSAGE_CONTENT_MAX_LENGTH + 1);
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: longContent,
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si expediteur_id est 0", () => {
      const invalidCreate = {
        expediteur_id: 0,
        destinataire_id: 20,
        contenu: "Contenu valide",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si expediteur_id est négatif", () => {
      const invalidCreate = {
        expediteur_id: -1,
        destinataire_id: 20,
        contenu: "Contenu valide",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est 0", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: 0,
        contenu: "Contenu valide",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est négatif", () => {
      const invalidCreate = {
        expediteur_id: 10,
        destinataire_id: -1,
        contenu: "Contenu valide",
      };
      const result = createMessageSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateMessageSchema - Schema for updating message read status
  // ============================================================================
  describe("updateMessageSchema", () => {
    it("devrait valider une mise à jour avec lu à true", () => {
      const validUpdate = {
        lu: true,
      };
      const result = updateMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait valider une mise à jour avec lu à false", () => {
      const validUpdate = {
        lu: false,
      };
      const result = updateMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider une mise à jour avec date_lecture", () => {
      const validUpdate = {
        date_lecture: new Date("2024-01-16T10:00:00Z"),
      };
      const result = updateMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_lecture).toBeInstanceOf(Date);
      }
    });

    it("devrait valider une mise à jour avec lu et date_lecture", () => {
      const validUpdate = {
        lu: true,
        date_lecture: new Date("2024-01-16T10:00:00Z"),
      };
      const result = updateMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
        expect(result.data.date_lecture).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec date_lecture à null", () => {
      const validUpdate = {
        date_lecture: null,
      };
      const result = updateMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait coercer une string en Date pour date_lecture", () => {
      const validUpdate = {
        date_lecture: "2024-01-16T10:00:00Z",
      };
      const result = updateMessageSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_lecture).toBeInstanceOf(Date);
      }
    });

    it("devrait rejeter si lu n'est pas un boolean", () => {
      const invalidUpdate = {
        lu: "true" as any,
      };
      const result = updateMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu est un nombre", () => {
      const invalidUpdate = {
        lu: 1 as any,
      };
      const result = updateMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_lecture invalide", () => {
      const invalidUpdate = {
        date_lecture: "invalid-date" as any,
      };
      const result = updateMessageSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listMessagesSchema - Schema for listing messages with filters
  // ============================================================================
  describe("listMessagesSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 1,
        limit: 20,
        expediteur_id: 10,
        destinataire_id: 20,
        lu: "true",
        sujet: "Réunion",
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-12-31"),
        sort_by: "created_at" as const,
        sort_order: "desc" as const,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.expediteur_id).toBe(10);
        expect(result.data.destinataire_id).toBe(20);
        expect(result.data.lu).toBe(true);
        expect(result.data.sujet).toBe("Réunion");
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement expediteur_id", () => {
      const validQuery = {
        expediteur_id: 10,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expediteur_id).toBe(10);
      }
    });

    it("devrait valider avec seulement destinataire_id", () => {
      const validQuery = {
        destinataire_id: 20,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destinataire_id).toBe(20);
      }
    });

    it('devrait valider avec lu à "true" (transformé en boolean true)', () => {
      const validQuery = {
        lu: "true",
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it('devrait valider avec lu à "false" (transformé en boolean false)', () => {
      const validQuery = {
        lu: "false",
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it('devrait valider avec lu à "1" (transformé en boolean true)', () => {
      const validQuery = {
        lu: "1",
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it('devrait valider avec lu à "0" (transformé en boolean false)', () => {
      const validQuery = {
        lu: "0",
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec seulement sujet", () => {
      const validQuery = {
        sujet: "Réunion",
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du sujet", () => {
      const validQuery = {
        sujet: "  Réunion  ",
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sujet).toBe("Réunion");
      }
    });

    it("devrait valider avec seulement date_debut", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement date_fin", () => {
      const validQuery = {
        date_fin: new Date("2024-12-31"),
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_debut et date_fin", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-12-31"),
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait coercer des strings en Date", () => {
      const validQuery = {
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        sort_by: "created_at" as const,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by date_lecture", () => {
      const validQuery = {
        sort_by: "date_lecture" as const,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by sujet", () => {
      const validQuery = {
        sort_by: "sujet" as const,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc" as const,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order desc (défaut)", () => {
      const validQuery = {
        sort_order: "desc" as const,
      };
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer created_at comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer desc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listMessagesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter si expediteur_id est 0", () => {
      const invalidQuery = {
        expediteur_id: 0,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si expediteur_id est négatif", () => {
      const invalidQuery = {
        expediteur_id: -1,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est 0", () => {
      const invalidQuery = {
        destinataire_id: 0,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est négatif", () => {
      const invalidQuery = {
        destinataire_id: -1,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "invalid" as any,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid" as any,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        date_debut: "invalid-date" as any,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        date_fin: "invalid-date" as any,
      };
      const result = listMessagesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageInboxSchema - Schema for message inbox query
  // ============================================================================
  describe("messageInboxSchema", () => {
    it("devrait valider une query inbox complète", () => {
      const validQuery = {
        page: 1,
        limit: 20,
        lu: "true",
        expediteur_id: 10,
        sort_by: "created_at" as const,
        sort_order: "desc" as const,
      };
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.lu).toBe(true);
        expect(result.data.expediteur_id).toBe(10);
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement lu", () => {
      const validQuery = {
        lu: "true",
      };
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it('devrait transformer "1" en true pour lu', () => {
      const validQuery = {
        lu: "1",
      };
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it('devrait transformer "0" en false pour lu', () => {
      const validQuery = {
        lu: "0",
      };
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec seulement expediteur_id", () => {
      const validQuery = {
        expediteur_id: 10,
      };
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        sort_by: "created_at" as const,
      };
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by date_lecture", () => {
      const validQuery = {
        sort_by: "date_lecture" as const,
      };
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer created_at comme sort_by par défaut", () => {
      const validQuery = {};
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer desc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = messageInboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter si expediteur_id est 0", () => {
      const invalidQuery = {
        expediteur_id: 0,
      };
      const result = messageInboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si expediteur_id est négatif", () => {
      const invalidQuery = {
        expediteur_id: -1,
      };
      const result = messageInboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "sujet" as any,
      };
      const result = messageInboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid" as any,
      };
      const result = messageInboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageOutboxSchema - Schema for message outbox query
  // ============================================================================
  describe("messageOutboxSchema", () => {
    it("devrait valider une query outbox complète", () => {
      const validQuery = {
        page: 1,
        limit: 20,
        destinataire_id: 20,
        sort_by: "created_at" as const,
        sort_order: "desc" as const,
      };
      const result = messageOutboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.destinataire_id).toBe(20);
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = messageOutboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement destinataire_id", () => {
      const validQuery = {
        destinataire_id: 20,
      };
      const result = messageOutboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destinataire_id).toBe(20);
      }
    });

    it("devrait valider avec sort_by created_at", () => {
      const validQuery = {
        sort_by: "created_at" as const,
      };
      const result = messageOutboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer created_at comme sort_by par défaut", () => {
      const validQuery = {};
      const result = messageOutboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer desc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = messageOutboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc" as const,
      };
      const result = messageOutboxSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si destinataire_id est 0", () => {
      const invalidQuery = {
        destinataire_id: 0,
      };
      const result = messageOutboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si destinataire_id est négatif", () => {
      const invalidQuery = {
        destinataire_id: -1,
      };
      const result = messageOutboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "date_lecture" as any,
      };
      const result = messageOutboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid" as any,
      };
      const result = messageOutboxSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkMarkReadSchema - Schema for marking multiple messages as read
  // ============================================================================
  describe("bulkMarkReadSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        message_ids: [1, 2, 3, 4, 5],
      };
      const result = bulkMarkReadSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message_ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        message_ids: [1],
      };
      const result = bulkMarkReadSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        message_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
      const result = bulkMarkReadSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 100 IDs (maximum)", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        message_ids: manyIds,
      };
      const result = bulkMarkReadSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        message_ids: [5, 2, 8, 1, 3],
      };
      const result = bulkMarkReadSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués", () => {
      const validBulk = {
        message_ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkMarkReadSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si message_ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        message_ids: [],
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins un");
      }
    });

    it("devrait rejeter plus de 100 IDs", () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);
      const invalidBulk = {
        message_ids: tooManyIds,
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        message_ids: [1, 2, 0, 3],
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        message_ids: [1, 2, -3, 4],
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        message_ids: [1, 2, "3" as any, 4],
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        message_ids: [1, 2, 3.5, 4],
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        message_ids: [1, 2, null as any, 4],
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        message_ids: [1, 2, undefined as any, 4],
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si message_ids n'est pas un array", () => {
      const invalidBulk = {
        message_ids: 1 as any,
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si message_ids est une string", () => {
      const invalidBulk = {
        message_ids: "1,2,3" as any,
      };
      const result = bulkMarkReadSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkDeleteMessagesSchema - Schema for deleting multiple messages
  // ============================================================================
  describe("bulkDeleteMessagesSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        message_ids: [1, 2, 3, 4, 5],
      };
      const result = bulkDeleteMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message_ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        message_ids: [1],
      };
      const result = bulkDeleteMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        message_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
      const result = bulkDeleteMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 100 IDs (maximum)", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        message_ids: manyIds,
      };
      const result = bulkDeleteMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        message_ids: [5, 2, 8, 1, 3],
      };
      const result = bulkDeleteMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués", () => {
      const validBulk = {
        message_ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkDeleteMessagesSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si message_ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        message_ids: [],
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins un");
      }
    });

    it("devrait rejeter plus de 100 IDs", () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);
      const invalidBulk = {
        message_ids: tooManyIds,
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        message_ids: [1, 2, 0, 3],
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        message_ids: [1, 2, -3, 4],
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        message_ids: [1, 2, "3" as any, 4],
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        message_ids: [1, 2, 3.5, 4],
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        message_ids: [1, 2, null as any, 4],
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        message_ids: [1, 2, undefined as any, 4],
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si message_ids n'est pas un array", () => {
      const invalidBulk = {
        message_ids: 1 as any,
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si message_ids est une string", () => {
      const invalidBulk = {
        message_ids: "1,2,3" as any,
      };
      const result = bulkDeleteMessagesSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageIdSchema - Schema for validating message ID as number
  // ============================================================================
  describe("messageIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = messageIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = messageIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = messageIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = messageIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = messageIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = messageIdSchema.safeParse("1" as any);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageIdStringSchema - Schema for validating message ID as string
  // ============================================================================
  describe("messageIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = messageIdStringSchema.safeParse("1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const result = messageIdStringSchema.safeParse("123");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe("number");
        expect(result.data).toBe(123);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = messageIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = messageIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = messageIdStringSchema.safeParse("-1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = messageIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = messageIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = messageIdStringSchema.safeParse("1.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = messageIdStringSchema.safeParse(" 1 ");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageIdParamSchema - Schema for validating message ID in route params
  // ============================================================================
  describe("messageIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "1",
      };
      const result = messageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "123",
      };
      const result = messageIdParamSchema.safeParse(validParam);
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
      const result = messageIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = messageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = messageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-1",
      };
      const result = messageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = messageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = messageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "1.5",
      };
      const result = messageIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageResponseSchema - Schema for message response
  // ============================================================================
  describe("messageResponseSchema", () => {
    it("devrait valider une réponse de message complète", () => {
      const validResponse = {
        id: 1,
        expediteur_id: 10,
        destinataire_id: 20,
        sujet: "Test",
        contenu: "Message de test",
        lu: false,
        date_lecture: null,
        created_at: new Date(),
      };
      const result = messageResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 1,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Message de test",
        lu: false,
        created_at: new Date(),
      };
      const result = messageResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // messagesListResponseSchema - Schema for paginated messages list response
  // ============================================================================
  describe("messagesListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            expediteur_id: 10,
            destinataire_id: 20,
            contenu: "Message 1",
            lu: false,
            created_at: new Date(),
          },
          {
            id: 2,
            expediteur_id: 10,
            destinataire_id: 20,
            contenu: "Message 2",
            lu: true,
            date_lecture: new Date(),
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
      const result = messagesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(2);
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
      const result = messagesListResponseSchema.safeParse(validResponse);
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
      const result = messagesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = messagesListResponseSchema.safeParse(invalidResponse);
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
      const result = messagesListResponseSchema.safeParse(invalidResponse);
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
      const result = messagesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // messageStatsSchema - Schema for message statistics
  // ============================================================================
  describe("messageStatsSchema", () => {
    it("devrait valider des statistiques valides", () => {
      const validStats = {
        total_messages: 100,
        unread_messages: 10,
        sent_messages: 50,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_messages).toBe(100);
        expect(result.data.unread_messages).toBe(10);
        expect(result.data.sent_messages).toBe(50);
        expect(result.data.received_messages).toBe(50);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total_messages: 0,
        unread_messages: 0,
        sent_messages: 0,
        received_messages: 0,
      };
      const result = messageStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si total_messages est manquant", () => {
      const invalidStats = {
        unread_messages: 10,
        sent_messages: 50,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si unread_messages est manquant", () => {
      const invalidStats = {
        total_messages: 100,
        sent_messages: 50,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si sent_messages est manquant", () => {
      const invalidStats = {
        total_messages: 100,
        unread_messages: 10,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si received_messages est manquant", () => {
      const invalidStats = {
        total_messages: 100,
        unread_messages: 10,
        sent_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_messages est négatif", () => {
      const invalidStats = {
        total_messages: -1,
        unread_messages: 10,
        sent_messages: 50,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si unread_messages est négatif", () => {
      const invalidStats = {
        total_messages: 100,
        unread_messages: -1,
        sent_messages: 50,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si sent_messages est négatif", () => {
      const invalidStats = {
        total_messages: 100,
        unread_messages: 10,
        sent_messages: -1,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si received_messages est négatif", () => {
      const invalidStats = {
        total_messages: 100,
        unread_messages: 10,
        sent_messages: 50,
        received_messages: -1,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des strings", () => {
      const invalidStats = {
        total_messages: "100" as any,
        unread_messages: 10,
        sent_messages: 50,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des décimaux", () => {
      const invalidStats = {
        total_messages: 100.5,
        unread_messages: 10,
        sent_messages: 50,
        received_messages: 50,
      };
      const result = messageStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference Tests - Test TypeScript type inference
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type Message", () => {
      const message: Message = {
        id: 1,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Test",
        lu: false,
        created_at: new Date(),
      };
      expect(message.id).toBe(1);
    });

    it("devrait inférer correctement le type CreateMessage", () => {
      const createMessage: CreateMessage = {
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Test",
      };
      expect(createMessage.expediteur_id).toBe(10);
    });

    it("devrait inférer correctement le type UpdateMessage", () => {
      const updateMessage: UpdateMessage = {
        lu: true,
      };
      expect(updateMessage.lu).toBe(true);
    });

    it("devrait inférer correctement le type ListMessagesQuery", () => {
      const query: ListMessagesQuery = {
        page: 1,
        limit: 20,
        sort_by: "created_at",
        sort_order: "desc",
      };
      expect(query.page).toBe(1);
    });

    it("devrait inférer correctement le type MessageInboxQuery", () => {
      const query: MessageInboxQuery = {
        page: 1,
        limit: 20,
        sort_by: "created_at",
        sort_order: "desc",
      };
      expect(query.page).toBe(1);
    });

    it("devrait inférer correctement le type MessageOutboxQuery", () => {
      const query: MessageOutboxQuery = {
        page: 1,
        limit: 20,
        sort_by: "created_at",
        sort_order: "desc",
      };
      expect(query.page).toBe(1);
    });

    it("devrait inférer correctement le type BulkMarkRead", () => {
      const bulk: BulkMarkRead = {
        message_ids: [1, 2, 3],
      };
      expect(bulk.message_ids.length).toBe(3);
    });

    it("devrait inférer correctement le type BulkDeleteMessages", () => {
      const bulk: BulkDeleteMessages = {
        message_ids: [1, 2, 3],
      };
      expect(bulk.message_ids.length).toBe(3);
    });

    it("devrait inférer correctement le type MessageIdParam", () => {
      const param: MessageIdParam = {
        id: 123,
      };
      expect(param.id).toBe(123);
    });

    it("devrait inférer correctement le type MessageResponse", () => {
      const response: MessageResponse = {
        id: 1,
        expediteur_id: 10,
        destinataire_id: 20,
        contenu: "Test",
        lu: false,
        created_at: new Date(),
      };
      expect(response.id).toBe(1);
    });

    it("devrait inférer correctement le type MessagesListResponse", () => {
      const response: MessagesListResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      expect(response.data).toEqual([]);
    });

    it("devrait inférer correctement le type MessageStats", () => {
      const stats: MessageStats = {
        total_messages: 100,
        unread_messages: 10,
        sent_messages: 50,
        received_messages: 50,
      };
      expect(stats.total_messages).toBe(100);
    });
  });
});
