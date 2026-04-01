/**
 * @fileoverview Comprehensive Tests for Notification Validators
 * @module @clubmanager/types/validators/messaging/__tests__/notification
 *
 * Tests all Zod schemas from notification.validators.ts with comprehensive coverage:
 * - notificationTypeSchema
 * - notificationBaseSchema
 * - createNotificationSchema
 * - updateNotificationSchema
 * - listNotificationsSchema
 * - userNotificationsSchema
 * - bulkMarkReadNotificationsSchema
 * - bulkDeleteNotificationsSchema
 * - markAllReadSchema
 * - notificationResponseSchema
 * - notificationsListResponseSchema
 * - notificationStatsSchema
 */

import { describe, it, expect } from "@jest/globals";
import {
  notificationTypeSchema,
  notificationBaseSchema,
  createNotificationSchema,
  updateNotificationSchema,
  listNotificationsSchema,
  userNotificationsSchema,
  bulkMarkReadNotificationsSchema,
  bulkDeleteNotificationsSchema,
  markAllReadSchema,
  notificationIdSchema,
  notificationIdStringSchema,
  notificationIdParamSchema,
  notificationResponseSchema,
  notificationsListResponseSchema,
  notificationStatsSchema,
  type Notification,
  type CreateNotification,
  type UpdateNotification,
  type ListNotificationsQuery,
  type UserNotificationsQuery,
  type BulkMarkReadNotifications,
  type BulkDeleteNotifications,
  type MarkAllRead,
  type NotificationIdParam,
  type NotificationResponse,
  type NotificationsListResponse,
  type NotificationStats,
} from "../notification.validators.js";
import {
  NOTIFICATION_TITLE_MAX_LENGTH,
  NOTIFICATION_TITLE_MIN_LENGTH,
  NOTIFICATION_MESSAGE_MIN_LENGTH,
  NOTIFICATION_MESSAGE_MAX_LENGTH,
} from "../../../constants/messaging.constants.js";

describe("Notification Validators", () => {
  // ============================================================================
  // notificationTypeSchema - Notification type enum validation
  // ============================================================================
  describe("notificationTypeSchema", () => {
    it("devrait valider le type 'info'", () => {
      const result = notificationTypeSchema.safeParse("info");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("info");
      }
    });

    it("devrait valider le type 'warning'", () => {
      const result = notificationTypeSchema.safeParse("warning");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("warning");
      }
    });

    it("devrait valider le type 'error'", () => {
      const result = notificationTypeSchema.safeParse("error");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("error");
      }
    });

    it("devrait valider le type 'success'", () => {
      const result = notificationTypeSchema.safeParse("success");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("success");
      }
    });

    it("devrait rejeter un type invalide", () => {
      const result = notificationTypeSchema.safeParse("invalid");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "info, warning, error, success",
        );
      }
    });

    it("devrait rejeter un type en majuscules", () => {
      const result = notificationTypeSchema.safeParse("INFO");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type vide", () => {
      const result = notificationTypeSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const result = notificationTypeSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = notificationTypeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = notificationTypeSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // notificationBaseSchema - Base notification schema with all fields
  // ============================================================================
  describe("notificationBaseSchema", () => {
    it("devrait valider une notification valide avec tous les champs", () => {
      const validNotification = {
        id: 1,
        utilisateur_id: 10,
        type: "info",
        titre: "Nouvelle notification",
        message: "Ceci est le contenu de la notification",
        lu: false,
        created_at: new Date("2024-01-15T10:00:00Z"),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.type).toBe("info");
        expect(result.data.titre).toBe("Nouvelle notification");
        expect(result.data.message).toBe(
          "Ceci est le contenu de la notification",
        );
        expect(result.data.lu).toBe(false);
        expect(result.data.created_at).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec type 'warning'", () => {
      const validNotification = {
        id: 2,
        utilisateur_id: 10,
        type: "warning",
        titre: "Avertissement",
        message: "Attention à ceci",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("warning");
      }
    });

    it("devrait valider avec type 'error'", () => {
      const validNotification = {
        id: 3,
        utilisateur_id: 10,
        type: "error",
        titre: "Erreur système",
        message: "Une erreur s'est produite",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("error");
      }
    });

    it("devrait valider avec type 'success'", () => {
      const validNotification = {
        id: 4,
        utilisateur_id: 10,
        type: "success",
        titre: "Opération réussie",
        message: "Tout s'est bien passé",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("success");
      }
    });

    it("devrait valider avec lu à true", () => {
      const validNotification = {
        id: 5,
        utilisateur_id: 10,
        type: "info",
        titre: "Notification lue",
        message: "Cette notification a été lue",
        lu: true,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait valider avec lu par défaut à false", () => {
      const validNotification = {
        id: 6,
        utilisateur_id: 10,
        type: "info",
        titre: "Test",
        message: "Message test",
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait appliquer type 'info' par défaut", () => {
      const validNotification = {
        id: 7,
        utilisateur_id: 10,
        titre: "Sans type",
        message: "Message sans type spécifié",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("info");
      }
    });

    it("devrait valider avec titre de 1 caractère (longueur minimale)", () => {
      const validNotification = {
        id: 8,
        utilisateur_id: 10,
        type: "info",
        titre: "A",
        message: "M",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe("A");
      }
    });

    it("devrait valider avec titre de 255 caractères (longueur maximale)", () => {
      const maxTitle = "A".repeat(NOTIFICATION_TITLE_MAX_LENGTH);
      const validNotification = {
        id: 9,
        utilisateur_id: 10,
        type: "info",
        titre: maxTitle,
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe(maxTitle);
        expect(result.data.titre.length).toBe(NOTIFICATION_TITLE_MAX_LENGTH);
      }
    });

    it("devrait valider avec message de 1 caractère (longueur minimale)", () => {
      const validNotification = {
        id: 10,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "M",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("M");
      }
    });

    it("devrait valider avec message de longueur maximale (65535 caractères)", () => {
      const maxMessage = "M".repeat(NOTIFICATION_MESSAGE_MAX_LENGTH);
      const validNotification = {
        id: 11,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: maxMessage,
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message.length).toBe(
          NOTIFICATION_MESSAGE_MAX_LENGTH,
        );
      }
    });

    it("devrait trim les espaces du titre", () => {
      const validNotification = {
        id: 12,
        utilisateur_id: 10,
        type: "info",
        titre: "  Titre avec espaces  ",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe("Titre avec espaces");
      }
    });

    it("devrait trim les espaces du message", () => {
      const validNotification = {
        id: 13,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "  Message avec espaces  ",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Message avec espaces");
      }
    });

    it("devrait coercer une string en Date pour created_at", () => {
      const validNotification = {
        id: 14,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: "2024-01-15T10:00:00Z",
      };
      const result = notificationBaseSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_at).toBeInstanceOf(Date);
        expect(result.data.created_at.toISOString()).toBe(
          "2024-01-15T10:00:00.000Z",
        );
      }
    });

    it("devrait rejeter un titre vide", () => {
      const invalidNotification = {
        id: 15,
        utilisateur_id: 10,
        type: "info",
        titre: "",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("au moins");
      }
    });

    it("devrait rejeter un titre qui devient vide après trim", () => {
      const invalidNotification = {
        id: 16,
        utilisateur_id: 10,
        type: "info",
        titre: "   ",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre trop long (> 255 caractères)", () => {
      const longTitle = "A".repeat(NOTIFICATION_TITLE_MAX_LENGTH + 1);
      const invalidNotification = {
        id: 17,
        utilisateur_id: 10,
        type: "info",
        titre: longTitle,
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255");
      }
    });

    it("devrait rejeter un message vide", () => {
      const invalidNotification = {
        id: 18,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message qui devient vide après trim", () => {
      const invalidNotification = {
        id: 19,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "   ",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message trop long (> 65535 caractères)", () => {
      const longMessage = "M".repeat(NOTIFICATION_MESSAGE_MAX_LENGTH + 1);
      const invalidNotification = {
        id: 20,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: longMessage,
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("65535");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidNotification = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidNotification = {
        id: 21,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si titre est manquant", () => {
      const invalidNotification = {
        id: 22,
        utilisateur_id: 10,
        type: "info",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si message est manquant", () => {
      const invalidNotification = {
        id: 23,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si created_at est manquant", () => {
      const invalidNotification = {
        id: 24,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidNotification = {
        id: 0,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidNotification = {
        id: -1,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidNotification = {
        id: 25,
        utilisateur_id: 0,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidNotification = {
        id: 26,
        utilisateur_id: -1,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu n'est pas un boolean", () => {
      const invalidNotification = {
        id: 27,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: "false",
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type invalide", () => {
      const invalidNotification = {
        id: 28,
        utilisateur_id: 10,
        type: "invalid",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_created invalide", () => {
      const invalidNotification = {
        id: 29,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: "invalid-date",
      };
      const result = notificationBaseSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createNotificationSchema - Schema for creating new notifications
  // ============================================================================
  describe("createNotificationSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Nouvelle notification",
        message: "Contenu de la notification",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.type).toBe("info");
        expect(result.data.titre).toBe("Nouvelle notification");
        expect(result.data.message).toBe("Contenu de la notification");
      }
    });

    it("devrait valider avec seulement les champs requis (sans type)", () => {
      const validCreate = {
        utilisateur_id: 10,
        titre: "Titre",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("info");
      }
    });

    it("devrait valider avec type 'warning'", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "warning",
        titre: "Avertissement",
        message: "Message d'avertissement",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("warning");
      }
    });

    it("devrait valider avec type 'error'", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "error",
        titre: "Erreur",
        message: "Message d'erreur",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("error");
      }
    });

    it("devrait valider avec type 'success'", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "success",
        titre: "Succès",
        message: "Opération réussie",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("success");
      }
    });

    it("devrait valider avec titre de 1 caractère", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "A",
        message: "M",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec titre de longueur maximale", () => {
      const maxTitle = "A".repeat(NOTIFICATION_TITLE_MAX_LENGTH);
      const validCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: maxTitle,
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message de 1 caractère", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "M",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message de longueur maximale", () => {
      const maxMessage = "M".repeat(NOTIFICATION_MESSAGE_MAX_LENGTH);
      const validCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: maxMessage,
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du titre", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "  Titre  ",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titre).toBe("Titre");
      }
    });

    it("devrait trim les espaces du message", () => {
      const validCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "  Message  ",
      };
      const result = createNotificationSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Message");
      }
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidCreate = {
        type: "info",
        titre: "Titre",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si titre est manquant", () => {
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si message est manquant", () => {
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre vide", () => {
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre qui devient vide après trim", () => {
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "   ",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message vide", () => {
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message qui devient vide après trim", () => {
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "   ",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un titre trop long", () => {
      const longTitle = "A".repeat(NOTIFICATION_TITLE_MAX_LENGTH + 1);
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: longTitle,
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message trop long", () => {
      const longMessage = "M".repeat(NOTIFICATION_MESSAGE_MAX_LENGTH + 1);
      const invalidCreate = {
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: longMessage,
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidCreate = {
        utilisateur_id: 0,
        type: "info",
        titre: "Titre",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidCreate = {
        utilisateur_id: -1,
        type: "info",
        titre: "Titre",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type invalide", () => {
      const invalidCreate = {
        utilisateur_id: 10,
        type: "invalid",
        titre: "Titre",
        message: "Message",
      };
      const result = createNotificationSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateNotificationSchema - Schema for updating notification read status
  // ============================================================================
  describe("updateNotificationSchema", () => {
    it("devrait valider une mise à jour avec lu à true", () => {
      const validUpdate = {
        lu: true,
      };
      const result = updateNotificationSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait valider une mise à jour avec lu à false", () => {
      const validUpdate = {
        lu: false,
      };
      const result = updateNotificationSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait rejeter si lu est manquant", () => {
      const invalidUpdate = {};
      const result = updateNotificationSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu n'est pas un boolean", () => {
      const invalidUpdate = {
        lu: "true",
      };
      const result = updateNotificationSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu est un nombre", () => {
      const invalidUpdate = {
        lu: 1,
      };
      const result = updateNotificationSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu est null", () => {
      const invalidUpdate = {
        lu: null,
      };
      const result = updateNotificationSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listNotificationsSchema - Schema for listing notifications with filters
  // ============================================================================
  describe("listNotificationsSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 2,
        limit: 50,
        utilisateur_id: 10,
        type: "info",
        lu: "true",
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-12-31"),
        search: "important",
        sort_by: "created_at",
        sort_order: "desc",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.type).toBe("info");
        expect(result.data.lu).toBe(true);
        expect(result.data.search).toBe("important");
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: 10,
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(10);
      }
    });

    it("devrait valider avec type 'warning'", () => {
      const validQuery = {
        type: "warning",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("warning");
      }
    });

    it("devrait valider avec type 'error'", () => {
      const validQuery = {
        type: "error",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec type 'success'", () => {
      const validQuery = {
        type: "success",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec lu à 'true' (transformé en boolean true)", () => {
      const validQuery = {
        lu: "true",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait valider avec lu à 'false' (transformé en boolean false)", () => {
      const validQuery = {
        lu: "false",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec lu à '1' (transformé en boolean true)", () => {
      const validQuery = {
        lu: "1",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait valider avec lu à '0' (transformé en boolean false)", () => {
      const validQuery = {
        lu: "0",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec seulement search", () => {
      const validQuery = {
        search: "notification",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du search", () => {
      const validQuery = {
        search: "  important  ",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("important");
      }
    });

    it("devrait valider avec seulement date_debut", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement date_fin", () => {
      const validQuery = {
        date_fin: new Date("2024-12-31"),
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_debut et date_fin", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-12-31"),
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait coercer des strings en Date", () => {
      const validQuery = {
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec sort_by 'created_at'", () => {
      const validQuery = {
        sort_by: "created_at",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'type'", () => {
      const validQuery = {
        sort_by: "type",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'titre'", () => {
      const validQuery = {
        sort_by: "titre",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order 'asc'", () => {
      const validQuery = {
        sort_order: "asc",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order 'desc'", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer 'created_at' comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer 'desc' comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidQuery = {
        utilisateur_id: 0,
      };
      const result = listNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidQuery = {
        utilisateur_id: -1,
      };
      const result = listNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type invalide", () => {
      const invalidQuery = {
        type: "invalid",
      };
      const result = listNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "invalid",
      };
      const result = listNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid",
      };
      const result = listNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        date_debut: "invalid-date",
      };
      const result = listNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        date_fin: "invalid-date",
      };
      const result = listNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // userNotificationsSchema - Schema for user-specific notifications
  // ============================================================================
  describe("userNotificationsSchema", () => {
    it("devrait valider une query complète", () => {
      const validQuery = {
        page: 2,
        limit: 30,
        type: "warning",
        lu: "false",
        sort_by: "created_at",
        sort_order: "asc",
      };
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(30);
        expect(result.data.type).toBe("warning");
        expect(result.data.lu).toBe(false);
        expect(result.data.sort_by).toBe("created_at");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement type", () => {
      const validQuery = {
        type: "info",
      };
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement lu", () => {
      const validQuery = {
        lu: "true",
      };
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait transformer '1' en true pour lu", () => {
      const validQuery = {
        lu: "1",
      };
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait transformer '0' en false pour lu", () => {
      const validQuery = {
        lu: "0",
      };
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec sort_by 'created_at'", () => {
      const validQuery = {
        sort_by: "created_at",
      };
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer 'created_at' comme sort_by par défaut", () => {
      const validQuery = {};
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("created_at");
      }
    });

    it("devrait appliquer 'desc' comme sort_order par défaut", () => {
      const validQuery = {};
      const result = userNotificationsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter un type invalide", () => {
      const invalidQuery = {
        type: "invalid",
      };
      const result = userNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "type",
      };
      const result = userNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid",
      };
      const result = userNotificationsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkMarkReadNotificationsSchema - Schema for bulk marking as read
  // ============================================================================
  describe("bulkMarkReadNotificationsSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        notification_ids: [1, 2, 3, 4, 5],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notification_ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        notification_ids: [1],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        notification_ids: [1, 5, 10, 15, 20],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 100 IDs (maximum)", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        notification_ids: manyIds,
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        notification_ids: [5, 1, 3, 2, 4],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués", () => {
      const validBulk = {
        notification_ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si notification_ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        notification_ids: [],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Au moins une notification",
        );
      }
    });

    it("devrait rejeter plus de 100 IDs", () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);
      const invalidBulk = {
        notification_ids: tooManyIds,
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        notification_ids: [1, 2, 0, 3],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        notification_ids: [1, 2, -1, 3],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        notification_ids: [1, 2, "3", 4],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        notification_ids: [1, 2, 3.5, 4],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        notification_ids: [1, 2, null, 4],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        notification_ids: [1, 2, undefined, 4],
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si notification_ids n'est pas un array", () => {
      const invalidBulk = {
        notification_ids: 123,
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si notification_ids est une string", () => {
      const invalidBulk = {
        notification_ids: "1,2,3",
      };
      const result = bulkMarkReadNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkDeleteNotificationsSchema - Schema for bulk deleting notifications
  // ============================================================================
  describe("bulkDeleteNotificationsSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        notification_ids: [1, 2, 3, 4, 5],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notification_ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        notification_ids: [1],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        notification_ids: [1, 5, 10, 15, 20],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 100 IDs (maximum)", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        notification_ids: manyIds,
      };
      const result = bulkDeleteNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        notification_ids: [5, 1, 3, 2, 4],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués", () => {
      const validBulk = {
        notification_ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si notification_ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        notification_ids: [],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Au moins une notification",
        );
      }
    });

    it("devrait rejeter plus de 100 IDs", () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);
      const invalidBulk = {
        notification_ids: tooManyIds,
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        notification_ids: [1, 2, 0, 3],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        notification_ids: [1, 2, -1, 3],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        notification_ids: [1, 2, "3", 4],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        notification_ids: [1, 2, 3.5, 4],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        notification_ids: [1, 2, null, 4],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        notification_ids: [1, 2, undefined, 4],
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si notification_ids n'est pas un array", () => {
      const invalidBulk = {
        notification_ids: 123,
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si notification_ids est une string", () => {
      const invalidBulk = {
        notification_ids: "1,2,3",
      };
      const result = bulkDeleteNotificationsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // markAllReadSchema - Schema for marking all notifications as read
  // ============================================================================
  describe("markAllReadSchema", () => {
    it("devrait valider avec utilisateur_id uniquement", () => {
      const validMarkAll = {
        utilisateur_id: 10,
      };
      const result = markAllReadSchema.safeParse(validMarkAll);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.type).toBeUndefined();
      }
    });

    it("devrait valider avec utilisateur_id et type 'info'", () => {
      const validMarkAll = {
        utilisateur_id: 10,
        type: "info",
      };
      const result = markAllReadSchema.safeParse(validMarkAll);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.type).toBe("info");
      }
    });

    it("devrait valider avec utilisateur_id et type 'warning'", () => {
      const validMarkAll = {
        utilisateur_id: 10,
        type: "warning",
      };
      const result = markAllReadSchema.safeParse(validMarkAll);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et type 'error'", () => {
      const validMarkAll = {
        utilisateur_id: 10,
        type: "error",
      };
      const result = markAllReadSchema.safeParse(validMarkAll);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec utilisateur_id et type 'success'", () => {
      const validMarkAll = {
        utilisateur_id: 10,
        type: "success",
      };
      const result = markAllReadSchema.safeParse(validMarkAll);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidMarkAll = {
        type: "info",
      };
      const result = markAllReadSchema.safeParse(invalidMarkAll);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidMarkAll = {
        utilisateur_id: 0,
      };
      const result = markAllReadSchema.safeParse(invalidMarkAll);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidMarkAll = {
        utilisateur_id: -1,
      };
      const result = markAllReadSchema.safeParse(invalidMarkAll);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un type invalide", () => {
      const invalidMarkAll = {
        utilisateur_id: 10,
        type: "invalid",
      };
      const result = markAllReadSchema.safeParse(invalidMarkAll);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // notificationIdSchema - ID validation
  // ============================================================================
  describe("notificationIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = notificationIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = notificationIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = notificationIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = notificationIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = notificationIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = notificationIdSchema.safeParse("1");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // notificationIdStringSchema - String ID validation with transformation
  // ============================================================================
  describe("notificationIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = notificationIdStringSchema.safeParse("1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const result = notificationIdStringSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
        expect(typeof result.data).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const result = notificationIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = notificationIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = notificationIdStringSchema.safeParse("-1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = notificationIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = notificationIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = notificationIdStringSchema.safeParse("1.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = notificationIdStringSchema.safeParse(" 1 ");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // notificationIdParamSchema - Route parameter validation
  // ============================================================================
  describe("notificationIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "1",
      };
      const result = notificationIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "42",
      };
      const result = notificationIdParamSchema.safeParse(validParam);
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
      const result = notificationIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = notificationIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = notificationIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-1",
      };
      const result = notificationIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = notificationIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = notificationIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "1.5",
      };
      const result = notificationIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // notificationResponseSchema - Response validation
  // ============================================================================
  describe("notificationResponseSchema", () => {
    it("devrait valider une réponse de notification complète", () => {
      const validResponse = {
        id: 1,
        utilisateur_id: 10,
        type: "info",
        titre: "Notification",
        message: "Message de notification",
        lu: false,
        created_at: new Date("2024-01-15T10:00:00Z"),
      };
      const result = notificationResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.type).toBe("info");
        expect(result.data.titre).toBe("Notification");
        expect(result.data.message).toBe("Message de notification");
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 2,
        utilisateur_id: 20,
        titre: "Titre",
        message: "Message",
        created_at: new Date(),
      };
      const result = notificationResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("info");
        expect(result.data.lu).toBe(false);
      }
    });
  });

  // ============================================================================
  // notificationsListResponseSchema - Paginated list response validation
  // ============================================================================
  describe("notificationsListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            utilisateur_id: 10,
            type: "info",
            titre: "Notification 1",
            message: "Message 1",
            lu: false,
            created_at: new Date(),
          },
          {
            id: 2,
            utilisateur_id: 10,
            type: "warning",
            titre: "Notification 2",
            message: "Message 2",
            lu: true,
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
      const result = notificationsListResponseSchema.safeParse(validResponse);
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
      const result = notificationsListResponseSchema.safeParse(validResponse);
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
      const result = notificationsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = notificationsListResponseSchema.safeParse(invalidResponse);
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
      const result = notificationsListResponseSchema.safeParse(invalidResponse);
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
      const result = notificationsListResponseSchema.safeParse(invalidResponse);
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
      const result = notificationsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // notificationStatsSchema - Statistics validation
  // ============================================================================
  describe("notificationStatsSchema", () => {
    it("devrait valider des statistiques valides", () => {
      const validStats = {
        total: 100,
        unread: 25,
        by_type: {
          info: 40,
          warning: 30,
          error: 20,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
        expect(result.data.unread).toBe(25);
        expect(result.data.by_type.info).toBe(40);
        expect(result.data.by_type.warning).toBe(30);
        expect(result.data.by_type.error).toBe(20);
        expect(result.data.by_type.success).toBe(10);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total: 0,
        unread: 0,
        by_type: {
          info: 0,
          warning: 0,
          error: 0,
          success: 0,
        },
      };
      const result = notificationStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec tous les types différents", () => {
      const validStats = {
        total: 50,
        unread: 10,
        by_type: {
          info: 20,
          warning: 15,
          error: 10,
          success: 5,
        },
      };
      const result = notificationStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si total est manquant", () => {
      const invalidStats = {
        unread: 25,
        by_type: {
          info: 40,
          warning: 30,
          error: 20,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si unread est manquant", () => {
      const invalidStats = {
        total: 100,
        by_type: {
          info: 40,
          warning: 30,
          error: 20,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_type est manquant", () => {
      const invalidStats = {
        total: 100,
        unread: 25,
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidStats = {
        total: -1,
        unread: 25,
        by_type: {
          info: 40,
          warning: 30,
          error: 20,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si unread est négatif", () => {
      const invalidStats = {
        total: 100,
        unread: -1,
        by_type: {
          info: 40,
          warning: 30,
          error: 20,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si info est négatif", () => {
      const invalidStats = {
        total: 100,
        unread: 25,
        by_type: {
          info: -1,
          warning: 30,
          error: 20,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si warning est manquant", () => {
      const invalidStats = {
        total: 100,
        unread: 25,
        by_type: {
          info: 40,
          error: 20,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si error est manquant", () => {
      const invalidStats = {
        total: 100,
        unread: 25,
        by_type: {
          info: 40,
          warning: 30,
          success: 10,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si success est manquant", () => {
      const invalidStats = {
        total: 100,
        unread: 25,
        by_type: {
          info: 40,
          warning: 30,
          error: 20,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des strings", () => {
      const invalidStats = {
        total: "100",
        unread: "25",
        by_type: {
          info: "40",
          warning: "30",
          error: "20",
          success: "10",
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des décimaux", () => {
      const invalidStats = {
        total: 100.5,
        unread: 25.5,
        by_type: {
          info: 40.5,
          warning: 30.5,
          error: 20.5,
          success: 10.5,
        },
      };
      const result = notificationStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference - Test TypeScript type inference
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type Notification", () => {
      const notification: Notification = {
        id: 1,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      expect(notification.id).toBe(1);
    });

    it("devrait inférer correctement le type CreateNotification", () => {
      const createNotification: CreateNotification = {
        utilisateur_id: 10,
        type: "warning",
        titre: "Titre",
        message: "Message",
      };
      expect(createNotification.utilisateur_id).toBe(10);
    });

    it("devrait inférer correctement le type UpdateNotification", () => {
      const updateNotification: UpdateNotification = {
        lu: true,
      };
      expect(updateNotification.lu).toBe(true);
    });

    it("devrait inférer correctement le type ListNotificationsQuery", () => {
      const query: ListNotificationsQuery = {
        page: 1,
        limit: 20,
        type: "error",
        sort_by: "created_at",
        sort_order: "desc",
      };
      expect(query.page).toBe(1);
    });

    it("devrait inférer correctement le type UserNotificationsQuery", () => {
      const query: UserNotificationsQuery = {
        page: 1,
        limit: 20,
        type: "success",
        sort_by: "created_at",
        sort_order: "asc",
      };
      expect(query.type).toBe("success");
    });

    it("devrait inférer correctement le type BulkMarkReadNotifications", () => {
      const bulk: BulkMarkReadNotifications = {
        notification_ids: [1, 2, 3],
      };
      expect(bulk.notification_ids).toEqual([1, 2, 3]);
    });

    it("devrait inférer correctement le type BulkDeleteNotifications", () => {
      const bulk: BulkDeleteNotifications = {
        notification_ids: [1, 2, 3],
      };
      expect(bulk.notification_ids).toEqual([1, 2, 3]);
    });

    it("devrait inférer correctement le type MarkAllRead", () => {
      const markAll: MarkAllRead = {
        utilisateur_id: 10,
        type: "info",
      };
      expect(markAll.utilisateur_id).toBe(10);
    });

    it("devrait inférer correctement le type NotificationIdParam", () => {
      const param: NotificationIdParam = {
        id: 1,
      };
      expect(param.id).toBe(1);
    });

    it("devrait inférer correctement le type NotificationResponse", () => {
      const response: NotificationResponse = {
        id: 1,
        utilisateur_id: 10,
        type: "info",
        titre: "Titre",
        message: "Message",
        lu: false,
        created_at: new Date(),
      };
      expect(response.id).toBe(1);
    });

    it("devrait inférer correctement le type NotificationsListResponse", () => {
      const response: NotificationsListResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
        },
      };
      expect(response.data.length).toBe(0);
    });

    it("devrait inférer correctement le type NotificationStats", () => {
      const stats: NotificationStats = {
        total: 100,
        unread: 25,
        by_type: {
          info: 40,
          warning: 30,
          error: 20,
          success: 10,
        },
      };
      expect(stats.total).toBe(100);
    });
  });
});
