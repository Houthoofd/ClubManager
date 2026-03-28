/**
 * @fileoverview Comprehensive Tests for User Alert Validators
 * @module @clubmanager/types/validators/messaging/__tests__/user-alert
 *
 * Tests all Zod schemas from user-alert.validators.ts with comprehensive coverage:
 * - alertStatusSchema
 * - alertContextDataSchema
 * - userAlertBaseSchema
 * - createUserAlertSchema
 * - updateUserAlertSchema
 * - resolveAlertSchema
 * - ignoreAlertSchema
 * - listUserAlertsSchema
 * - activeAlertsSchema
 * - resolvedAlertsSchema
 * - bulkMarkReadAlertsSchema
 * - bulkResolveAlertsSchema
 * - userAlertIdSchema, userAlertIdStringSchema, userAlertIdParamSchema
 * - userAlertResponseSchema, userAlertsListResponseSchema
 * - userAlertStatsSchema
 *
 * Total: ~250 tests covering all validation rules, edge cases, refinements,
 * JSON validation, bulk operations, and type inference.
 */

import { describe, it, expect } from "@jest/globals";
import {
  alertStatusSchema,
  alertContextDataSchema,
  userAlertBaseSchema,
  createUserAlertSchema,
  updateUserAlertSchema,
  resolveAlertSchema,
  ignoreAlertSchema,
  listUserAlertsSchema,
  activeAlertsSchema,
  resolvedAlertsSchema,
  bulkMarkReadAlertsSchema,
  bulkResolveAlertsSchema,
  userAlertIdSchema,
  userAlertIdStringSchema,
  userAlertIdParamSchema,
  userAlertResponseSchema,
  userAlertsListResponseSchema,
  userAlertStatsSchema,
  type UserAlert,
  type CreateUserAlert,
  type UpdateUserAlert,
  type ResolveAlert,
  type IgnoreAlert,
  type ListUserAlertsQuery,
  type ActiveAlertsQuery,
  type ResolvedAlertsQuery,
  type BulkMarkReadAlerts,
  type BulkResolveAlerts,
  type UserAlertIdParam,
  type UserAlertResponse,
  type UserAlertsListResponse,
  type UserAlertStats,
} from "../user-alert.validators.js";
import {
  USER_ALERT_MESSAGE_MAX_LENGTH,
  USER_ALERT_MESSAGE_MIN_LENGTH,
  USER_ALERT_NOTES_MAX_LENGTH,
  USER_ALERT_NOTES_MIN_LENGTH,
} from "../../../constants/messaging.constants.js";
import { AlertStatus } from "../../../enums/messaging.enums.js";

describe("User Alert Validators", () => {
  // ============================================================================
  // alertStatusSchema - Validation du statut d'alerte
  // ============================================================================
  describe("alertStatusSchema", () => {
    it("devrait valider le statut 'active'", () => {
      const result = alertStatusSchema.safeParse("active");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("active");
      }
    });

    it("devrait valider le statut 'resolue'", () => {
      const result = alertStatusSchema.safeParse("resolue");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("resolue");
      }
    });

    it("devrait valider le statut 'ignoree'", () => {
      const result = alertStatusSchema.safeParse("ignoree");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("ignoree");
      }
    });

    it("devrait rejeter un statut invalide", () => {
      const result = alertStatusSchema.safeParse("en_cours");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Le statut doit être");
      }
    });

    it("devrait rejeter un statut vide", () => {
      const result = alertStatusSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut null", () => {
      const result = alertStatusSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut undefined", () => {
      const result = alertStatusSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const result = alertStatusSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertContextDataSchema - Validation des données contextuelles JSON
  // ============================================================================
  describe("alertContextDataSchema", () => {
    it("devrait valider un objet JSON valide", () => {
      const contextData = {
        montant: 150,
        reference: "PAY-12345",
        date_echeance: "2024-01-31",
      };
      const result = alertContextDataSchema.safeParse(contextData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(contextData);
      }
    });

    it("devrait valider un objet JSON avec valeurs mixtes", () => {
      const contextData = {
        nombre: 42,
        texte: "information",
        booleen: true,
        tableau: [1, 2, 3],
        objet: { cle: "valeur" },
      };
      const result = alertContextDataSchema.safeParse(contextData);
      expect(result.success).toBe(true);
    });

    it("devrait valider un objet JSON vide", () => {
      const result = alertContextDataSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("devrait valider null", () => {
      const result = alertContextDataSchema.safeParse(null);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it("devrait valider undefined", () => {
      const result = alertContextDataSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(undefined);
      }
    });

    it("devrait valider avec des clés complexes", () => {
      const contextData = {
        "cle-avec-tiret": "valeur",
        cle_avec_underscore: 123,
        cléAvecAccent: true,
      };
      const result = alertContextDataSchema.safeParse(contextData);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des objets imbriqués", () => {
      const contextData = {
        niveau1: {
          niveau2: {
            niveau3: "valeur profonde",
          },
        },
      };
      const result = alertContextDataSchema.safeParse(contextData);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des tableaux complexes", () => {
      const contextData = {
        utilisateurs: [
          { id: 1, nom: "Dupont" },
          { id: 2, nom: "Martin" },
        ],
      };
      const result = alertContextDataSchema.safeParse(contextData);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // userAlertBaseSchema - Schéma de base d'une alerte utilisateur
  // ============================================================================
  describe("userAlertBaseSchema", () => {
    it("devrait valider une alerte complète avec tous les champs", () => {
      const validAlert = {
        id: 1,
        utilisateur_id: 10,
        alerte_type_id: 5,
        statut: "active" as const,
        message: "Paiement en retard de 30 jours",
        donnees_contexte: { montant: 150, reference: "PAY-001" },
        date_detection: new Date("2024-01-15T10:00:00Z"),
        date_resolution: null,
        notes: "À suivre avec le trésorier",
        resolu_par: null,
        lu: false,
        date_lecture: null,
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.utilisateur_id).toBe(10);
        expect(result.data.statut).toBe("active");
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait appliquer le statut par défaut 'active'", () => {
      const validAlert = {
        id: 2,
        utilisateur_id: 20,
        alerte_type_id: 3,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("active");
      }
    });

    it("devrait appliquer lu par défaut à false", () => {
      const validAlert = {
        id: 3,
        utilisateur_id: 30,
        alerte_type_id: 2,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec statut 'resolue'", () => {
      const validAlert = {
        id: 4,
        utilisateur_id: 40,
        alerte_type_id: 1,
        statut: "resolue" as const,
        date_detection: new Date(),
        date_resolution: new Date(),
        resolu_par: 100,
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut 'ignoree'", () => {
      const validAlert = {
        id: 5,
        utilisateur_id: 50,
        alerte_type_id: 2,
        statut: "ignoree" as const,
        date_detection: new Date(),
        notes: "Fausse alerte",
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message à null", () => {
      const validAlert = {
        id: 6,
        utilisateur_id: 60,
        alerte_type_id: 3,
        message: null,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message optionnel (undefined)", () => {
      const validAlert = {
        id: 7,
        utilisateur_id: 70,
        alerte_type_id: 4,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message de longueur minimale (1 caractère)", () => {
      const validAlert = {
        id: 8,
        utilisateur_id: 80,
        alerte_type_id: 1,
        message: "X",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("X");
      }
    });

    it("devrait valider avec message de longueur maximale (65535 caractères)", () => {
      const maxMessage = "A".repeat(USER_ALERT_MESSAGE_MAX_LENGTH);
      const validAlert = {
        id: 9,
        utilisateur_id: 90,
        alerte_type_id: 2,
        message: maxMessage,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message?.length).toBe(USER_ALERT_MESSAGE_MAX_LENGTH);
      }
    });

    it("devrait trim les espaces du message", () => {
      const validAlert = {
        id: 10,
        utilisateur_id: 100,
        alerte_type_id: 3,
        message: "  Message avec espaces  ",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Message avec espaces");
      }
    });

    it("devrait valider avec notes à null", () => {
      const validAlert = {
        id: 11,
        utilisateur_id: 110,
        alerte_type_id: 4,
        notes: null,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes de longueur minimale (1 caractère)", () => {
      const validAlert = {
        id: 12,
        utilisateur_id: 120,
        alerte_type_id: 5,
        notes: "N",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes de longueur maximale (65535 caractères)", () => {
      const maxNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH);
      const validAlert = {
        id: 13,
        utilisateur_id: 130,
        alerte_type_id: 1,
        notes: maxNotes,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces des notes", () => {
      const validAlert = {
        id: 14,
        utilisateur_id: 140,
        alerte_type_id: 2,
        notes: "  Notes avec espaces  ",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe("Notes avec espaces");
      }
    });

    it("devrait coercer une string en Date pour date_detection", () => {
      const validAlert = {
        id: 15,
        utilisateur_id: 150,
        alerte_type_id: 3,
        date_detection: "2024-01-15T10:00:00Z",
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_detection).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour date_resolution", () => {
      const validAlert = {
        id: 16,
        utilisateur_id: 160,
        alerte_type_id: 4,
        date_detection: new Date(),
        date_resolution: "2024-01-20T15:30:00Z",
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_resolution).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour date_lecture", () => {
      const validAlert = {
        id: 17,
        utilisateur_id: 170,
        alerte_type_id: 5,
        date_detection: new Date(),
        date_lecture: "2024-01-18T12:00:00Z",
        lu: true,
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_lecture).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec donnees_contexte complexe", () => {
      const validAlert = {
        id: 18,
        utilisateur_id: 180,
        alerte_type_id: 1,
        donnees_contexte: {
          montant: 250.5,
          devise: "EUR",
          details: {
            facture: "INV-2024-001",
            echeance: "2024-02-01",
          },
        },
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un message vide après trim", () => {
      const invalidAlert = {
        id: 19,
        utilisateur_id: 190,
        alerte_type_id: 2,
        message: "",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("au moins");
      }
    });

    it("devrait rejeter un message qui devient vide après trim", () => {
      const invalidAlert = {
        id: 20,
        utilisateur_id: 200,
        alerte_type_id: 3,
        message: "   ",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message trop long (> 65535 caractères)", () => {
      const longMessage = "M".repeat(USER_ALERT_MESSAGE_MAX_LENGTH + 1);
      const invalidAlert = {
        id: 21,
        utilisateur_id: 210,
        alerte_type_id: 4,
        message: longMessage,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "ne peut pas dépasser",
        );
      }
    });

    it("devrait rejeter des notes vides après trim", () => {
      const invalidAlert = {
        id: 22,
        utilisateur_id: 220,
        alerte_type_id: 5,
        notes: "",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes qui deviennent vides après trim", () => {
      const invalidAlert = {
        id: 23,
        utilisateur_id: 230,
        alerte_type_id: 1,
        notes: "   ",
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes trop longues (> 65535 caractères)", () => {
      const longNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH + 1);
      const invalidAlert = {
        id: 24,
        utilisateur_id: 240,
        alerte_type_id: 2,
        notes: longNotes,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidAlert = {
        utilisateur_id: 250,
        alerte_type_id: 3,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidAlert = {
        id: 25,
        alerte_type_id: 4,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est manquant", () => {
      const invalidAlert = {
        id: 26,
        utilisateur_id: 260,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si date_detection est manquante", () => {
      const invalidAlert = {
        id: 27,
        utilisateur_id: 270,
        alerte_type_id: 5,
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidAlert = {
        id: 0,
        utilisateur_id: 280,
        alerte_type_id: 1,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidAlert = {
        id: -1,
        utilisateur_id: 290,
        alerte_type_id: 2,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidAlert = {
        id: 28,
        utilisateur_id: 0,
        alerte_type_id: 3,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidAlert = {
        id: 29,
        utilisateur_id: -10,
        alerte_type_id: 4,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est 0", () => {
      const invalidAlert = {
        id: 30,
        utilisateur_id: 300,
        alerte_type_id: 0,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est négatif", () => {
      const invalidAlert = {
        id: 31,
        utilisateur_id: 310,
        alerte_type_id: -5,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est 0", () => {
      const invalidAlert = {
        id: 32,
        utilisateur_id: 320,
        alerte_type_id: 1,
        resolu_par: 0,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est négatif", () => {
      const invalidAlert = {
        id: 33,
        utilisateur_id: 330,
        alerte_type_id: 2,
        resolu_par: -20,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu n'est pas un boolean", () => {
      const invalidAlert = {
        id: 34,
        utilisateur_id: 340,
        alerte_type_id: 3,
        lu: "false" as any,
        date_detection: new Date(),
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_detection invalide", () => {
      const invalidAlert = {
        id: 35,
        utilisateur_id: 350,
        alerte_type_id: 4,
        date_detection: "date-invalide",
      };
      const result = userAlertBaseSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createUserAlertSchema - Schéma de création d'alerte
  // ============================================================================
  describe("createUserAlertSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        utilisateur_id: 100,
        alerte_type_id: 5,
        statut: "active" as const,
        message: "Nouvelle alerte de paiement",
        donnees_contexte: { montant: 100, reference: "PAY-999" },
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utilisateur_id).toBe(100);
        expect(result.data.alerte_type_id).toBe(5);
      }
    });

    it("devrait valider avec seulement les champs requis", () => {
      const validCreate = {
        utilisateur_id: 200,
        alerte_type_id: 10,
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer statut par défaut 'active'", () => {
      const validCreate = {
        utilisateur_id: 300,
        alerte_type_id: 15,
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("active");
      }
    });

    it("devrait valider avec statut 'resolue'", () => {
      const validCreate = {
        utilisateur_id: 400,
        alerte_type_id: 20,
        statut: "resolue" as const,
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec statut 'ignoree'", () => {
      const validCreate = {
        utilisateur_id: 500,
        alerte_type_id: 25,
        statut: "ignoree" as const,
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message à null", () => {
      const validCreate = {
        utilisateur_id: 600,
        alerte_type_id: 30,
        message: null,
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message de longueur minimale", () => {
      const validCreate = {
        utilisateur_id: 700,
        alerte_type_id: 35,
        message: "M",
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message de longueur maximale", () => {
      const maxMessage = "M".repeat(USER_ALERT_MESSAGE_MAX_LENGTH);
      const validCreate = {
        utilisateur_id: 800,
        alerte_type_id: 40,
        message: maxMessage,
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du message", () => {
      const validCreate = {
        utilisateur_id: 900,
        alerte_type_id: 45,
        message: "  Message avec espaces  ",
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Message avec espaces");
      }
    });

    it("devrait valider avec donnees_contexte null", () => {
      const validCreate = {
        utilisateur_id: 1000,
        alerte_type_id: 50,
        donnees_contexte: null,
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec donnees_contexte vide", () => {
      const validCreate = {
        utilisateur_id: 1100,
        alerte_type_id: 55,
        donnees_contexte: {},
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec donnees_contexte complexe", () => {
      const validCreate = {
        utilisateur_id: 1200,
        alerte_type_id: 60,
        donnees_contexte: {
          utilisateur: { nom: "Dupont", prenom: "Jean" },
          montants: [100, 200, 300],
          actif: true,
        },
      };
      const result = createUserAlertSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est manquant", () => {
      const invalidCreate = {
        alerte_type_id: 65,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est manquant", () => {
      const invalidCreate = {
        utilisateur_id: 1300,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidCreate = {
        utilisateur_id: 0,
        alerte_type_id: 70,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidCreate = {
        utilisateur_id: -100,
        alerte_type_id: 75,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est 0", () => {
      const invalidCreate = {
        utilisateur_id: 1400,
        alerte_type_id: 0,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est négatif", () => {
      const invalidCreate = {
        utilisateur_id: 1500,
        alerte_type_id: -50,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message vide", () => {
      const invalidCreate = {
        utilisateur_id: 1600,
        alerte_type_id: 80,
        message: "",
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message qui devient vide après trim", () => {
      const invalidCreate = {
        utilisateur_id: 1700,
        alerte_type_id: 85,
        message: "   ",
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message trop long", () => {
      const longMessage = "M".repeat(USER_ALERT_MESSAGE_MAX_LENGTH + 1);
      const invalidCreate = {
        utilisateur_id: 1800,
        alerte_type_id: 90,
        message: longMessage,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidCreate = {
        utilisateur_id: 1900,
        alerte_type_id: 95,
        statut: "en_attente" as any,
      };
      const result = createUserAlertSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateUserAlertSchema - Schéma de mise à jour d'alerte
  // ============================================================================
  describe("updateUserAlertSchema", () => {
    it("devrait valider une mise à jour complète", () => {
      const validUpdate = {
        statut: "resolue" as const,
        message: "Message mis à jour",
        notes: "Résolu après contact",
        resolu_par: 50,
        lu: true,
        date_lecture: new Date(),
        date_resolution: new Date(),
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide", () => {
      const validUpdate = {};
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement statut", () => {
      const validUpdate = {
        statut: "active" as const,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement message", () => {
      const validUpdate = {
        message: "Nouveau message",
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement notes", () => {
      const validUpdate = {
        notes: "Nouvelles notes",
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement lu", () => {
      const validUpdate = {
        lu: true,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec message à null", () => {
      const validUpdate = {
        message: null,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes à null", () => {
      const validUpdate = {
        notes: null,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_lecture à null", () => {
      const validUpdate = {
        date_lecture: null,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_resolution à null", () => {
      const validUpdate = {
        date_resolution: null,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec resolu_par à null", () => {
      const validUpdate = {
        resolu_par: null,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider statut 'resolue' avec date_resolution et resolu_par", () => {
      const validUpdate = {
        statut: "resolue" as const,
        date_resolution: new Date(),
        resolu_par: 100,
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces du message", () => {
      const validUpdate = {
        message: "  Message avec espaces  ",
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Message avec espaces");
      }
    });

    it("devrait trim les espaces des notes", () => {
      const validUpdate = {
        notes: "  Notes avec espaces  ",
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe("Notes avec espaces");
      }
    });

    it("devrait coercer une string en Date pour date_lecture", () => {
      const validUpdate = {
        date_lecture: "2024-01-20T10:00:00Z",
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_lecture).toBeInstanceOf(Date);
      }
    });

    it("devrait coercer une string en Date pour date_resolution", () => {
      const validUpdate = {
        date_resolution: "2024-01-21T15:30:00Z",
      };
      const result = updateUserAlertSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_resolution).toBeInstanceOf(Date);
      }
    });

    it("devrait rejeter statut 'resolue' sans date_resolution", () => {
      const invalidUpdate = {
        statut: "resolue" as const,
        resolu_par: 200,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("résolue");
      }
    });

    it("devrait rejeter statut 'resolue' sans resolu_par", () => {
      const invalidUpdate = {
        statut: "resolue" as const,
        date_resolution: new Date(),
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("résolveur");
      }
    });

    it("devrait rejeter statut 'resolue' sans date_resolution ni resolu_par", () => {
      const invalidUpdate = {
        statut: "resolue" as const,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message vide", () => {
      const invalidUpdate = {
        message: "",
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message qui devient vide après trim", () => {
      const invalidUpdate = {
        message: "   ",
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un message trop long", () => {
      const longMessage = "M".repeat(USER_ALERT_MESSAGE_MAX_LENGTH + 1);
      const invalidUpdate = {
        message: longMessage,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes vides", () => {
      const invalidUpdate = {
        notes: "",
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes qui deviennent vides après trim", () => {
      const invalidUpdate = {
        notes: "   ",
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes trop longues", () => {
      const longNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH + 1);
      const invalidUpdate = {
        notes: longNotes,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est 0", () => {
      const invalidUpdate = {
        resolu_par: 0,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est négatif", () => {
      const invalidUpdate = {
        resolu_par: -10,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidUpdate = {
        statut: "en_cours" as any,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si lu n'est pas un boolean", () => {
      const invalidUpdate = {
        lu: "true" as any,
      };
      const result = updateUserAlertSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // resolveAlertSchema - Schéma de résolution d'alerte
  // ============================================================================
  describe("resolveAlertSchema", () => {
    it("devrait valider avec resolu_par seulement", () => {
      const validResolve = {
        resolu_par: 100,
      };
      const result = resolveAlertSchema.safeParse(validResolve);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resolu_par).toBe(100);
      }
    });

    it("devrait valider avec resolu_par et notes", () => {
      const validResolve = {
        resolu_par: 200,
        notes: "Problème résolu après vérification",
      };
      const result = resolveAlertSchema.safeParse(validResolve);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes de longueur minimale", () => {
      const validResolve = {
        resolu_par: 300,
        notes: "X",
      };
      const result = resolveAlertSchema.safeParse(validResolve);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes de longueur maximale", () => {
      const maxNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH);
      const validResolve = {
        resolu_par: 400,
        notes: maxNotes,
      };
      const result = resolveAlertSchema.safeParse(validResolve);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces des notes", () => {
      const validResolve = {
        resolu_par: 500,
        notes: "  Notes avec espaces  ",
      };
      const result = resolveAlertSchema.safeParse(validResolve);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe("Notes avec espaces");
      }
    });

    it("devrait rejeter si resolu_par est manquant", () => {
      const invalidResolve = {
        notes: "Notes sans résolveur",
      };
      const result = resolveAlertSchema.safeParse(invalidResolve);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est 0", () => {
      const invalidResolve = {
        resolu_par: 0,
      };
      const result = resolveAlertSchema.safeParse(invalidResolve);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est négatif", () => {
      const invalidResolve = {
        resolu_par: -50,
      };
      const result = resolveAlertSchema.safeParse(invalidResolve);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes vides", () => {
      const invalidResolve = {
        resolu_par: 600,
        notes: "",
      };
      const result = resolveAlertSchema.safeParse(invalidResolve);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes qui deviennent vides après trim", () => {
      const invalidResolve = {
        resolu_par: 700,
        notes: "   ",
      };
      const result = resolveAlertSchema.safeParse(invalidResolve);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes trop longues", () => {
      const longNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH + 1);
      const invalidResolve = {
        resolu_par: 800,
        notes: longNotes,
      };
      const result = resolveAlertSchema.safeParse(invalidResolve);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // ignoreAlertSchema - Schéma d'ignorance d'alerte
  // ============================================================================
  describe("ignoreAlertSchema", () => {
    it("devrait valider avec un objet vide", () => {
      const validIgnore = {};
      const result = ignoreAlertSchema.safeParse(validIgnore);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes", () => {
      const validIgnore = {
        notes: "Fausse alerte, peut être ignorée",
      };
      const result = ignoreAlertSchema.safeParse(validIgnore);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe("Fausse alerte, peut être ignorée");
      }
    });

    it("devrait valider avec notes de longueur minimale", () => {
      const validIgnore = {
        notes: "X",
      };
      const result = ignoreAlertSchema.safeParse(validIgnore);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes de longueur maximale", () => {
      const maxNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH);
      const validIgnore = {
        notes: maxNotes,
      };
      const result = ignoreAlertSchema.safeParse(validIgnore);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces des notes", () => {
      const validIgnore = {
        notes: "  Notes avec espaces  ",
      };
      const result = ignoreAlertSchema.safeParse(validIgnore);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe("Notes avec espaces");
      }
    });

    it("devrait rejeter des notes vides", () => {
      const invalidIgnore = {
        notes: "",
      };
      const result = ignoreAlertSchema.safeParse(invalidIgnore);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes qui deviennent vides après trim", () => {
      const invalidIgnore = {
        notes: "   ",
      };
      const result = ignoreAlertSchema.safeParse(invalidIgnore);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes trop longues", () => {
      const longNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH + 1);
      const invalidIgnore = {
        notes: longNotes,
      };
      const result = ignoreAlertSchema.safeParse(invalidIgnore);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listUserAlertsSchema - Schéma de listage des alertes utilisateur
  // ============================================================================
  describe("listUserAlertsSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 2,
        limit: 50,
        utilisateur_id: 100,
        alerte_type_id: 5,
        statut: "active" as const,
        lu: "true",
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
        resolu_par: 200,
        sort_by: "date_detection" as const,
        sort_order: "asc" as const,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: 300,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement alerte_type_id", () => {
      const validQuery = {
        alerte_type_id: 10,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement statut", () => {
      const validQuery = {
        statut: "resolue" as const,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait transformer 'true' en boolean true pour lu", () => {
      const validQuery = {
        lu: "true",
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait transformer 'false' en boolean false pour lu", () => {
      const validQuery = {
        lu: "false",
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait transformer '1' en boolean true pour lu", () => {
      const validQuery = {
        lu: "1",
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(true);
      }
    });

    it("devrait transformer '0' en boolean false pour lu", () => {
      const validQuery = {
        lu: "0",
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lu).toBe(false);
      }
    });

    it("devrait valider avec date_debut", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_fin", () => {
      const validQuery = {
        date_fin: new Date("2024-12-31"),
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait coercer des strings en Date", () => {
      const validQuery = {
        date_debut: "2024-01-01T00:00:00Z",
        date_fin: "2024-12-31T23:59:59Z",
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec resolu_par", () => {
      const validQuery = {
        resolu_par: 500,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'date_detection'", () => {
      const validQuery = {
        sort_by: "date_detection" as const,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'date_resolution'", () => {
      const validQuery = {
        sort_by: "date_resolution" as const,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'statut'", () => {
      const validQuery = {
        sort_by: "statut" as const,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer 'date_detection' comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_detection");
      }
    });

    it("devrait valider avec sort_order 'asc'", () => {
      const validQuery = {
        sort_order: "asc" as const,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_order 'desc'", () => {
      const validQuery = {
        sort_order: "desc" as const,
      };
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer 'desc' comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listUserAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidQuery = {
        utilisateur_id: 0,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidQuery = {
        utilisateur_id: -10,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est 0", () => {
      const invalidQuery = {
        alerte_type_id: 0,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est négatif", () => {
      const invalidQuery = {
        alerte_type_id: -5,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est 0", () => {
      const invalidQuery = {
        resolu_par: 0,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est négatif", () => {
      const invalidQuery = {
        resolu_par: -20,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidQuery = {
        statut: "en_cours" as any,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "created_at" as any,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "ascending" as any,
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        date_debut: "date-invalide",
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        date_fin: "pas-une-date",
      };
      const result = listUserAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // activeAlertsSchema - Schéma pour les alertes actives
  // ============================================================================
  describe("activeAlertsSchema", () => {
    it("devrait valider une query complète", () => {
      const validQuery = {
        page: 1,
        limit: 30,
        utilisateur_id: 100,
        alerte_type_id: 5,
        sort_by: "date_detection" as const,
        sort_order: "desc" as const,
      };
      const result = activeAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = activeAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: 200,
      };
      const result = activeAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement alerte_type_id", () => {
      const validQuery = {
        alerte_type_id: 10,
      };
      const result = activeAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer 'date_detection' comme sort_by par défaut", () => {
      const validQuery = {};
      const result = activeAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_detection");
      }
    });

    it("devrait appliquer 'desc' comme sort_order par défaut", () => {
      const validQuery = {};
      const result = activeAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec sort_order 'asc'", () => {
      const validQuery = {
        sort_order: "asc" as const,
      };
      const result = activeAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidQuery = {
        utilisateur_id: 0,
      };
      const result = activeAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidQuery = {
        utilisateur_id: -50,
      };
      const result = activeAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est 0", () => {
      const invalidQuery = {
        alerte_type_id: 0,
      };
      const result = activeAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_type_id est négatif", () => {
      const invalidQuery = {
        alerte_type_id: -15,
      };
      const result = activeAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "date_resolution" as any,
      };
      const result = activeAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "random" as any,
      };
      const result = activeAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // resolvedAlertsSchema - Schéma pour les alertes résolues
  // ============================================================================
  describe("resolvedAlertsSchema", () => {
    it("devrait valider une query complète", () => {
      const validQuery = {
        page: 1,
        limit: 25,
        utilisateur_id: 100,
        resolu_par: 50,
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
        sort_by: "date_resolution" as const,
        sort_order: "asc" as const,
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un objet vide", () => {
      const validQuery = {};
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement utilisateur_id", () => {
      const validQuery = {
        utilisateur_id: 200,
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec seulement resolu_par", () => {
      const validQuery = {
        resolu_par: 300,
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_debut", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec date_fin", () => {
      const validQuery = {
        date_fin: new Date("2024-12-31"),
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait coercer des strings en Date", () => {
      const validQuery = {
        date_debut: "2024-01-01T00:00:00Z",
        date_fin: "2024-12-31T23:59:59Z",
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec sort_by 'date_resolution'", () => {
      const validQuery = {
        sort_by: "date_resolution" as const,
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec sort_by 'date_detection'", () => {
      const validQuery = {
        sort_by: "date_detection" as const,
      };
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer 'date_resolution' comme sort_by par défaut", () => {
      const validQuery = {};
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_resolution");
      }
    });

    it("devrait appliquer 'desc' comme sort_order par défaut", () => {
      const validQuery = {};
      const result = resolvedAlertsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter si utilisateur_id est 0", () => {
      const invalidQuery = {
        utilisateur_id: 0,
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si utilisateur_id est négatif", () => {
      const invalidQuery = {
        utilisateur_id: -10,
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est 0", () => {
      const invalidQuery = {
        resolu_par: 0,
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est négatif", () => {
      const invalidQuery = {
        resolu_par: -25,
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "statut" as any,
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "newest" as any,
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        date_debut: "not-a-date",
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        date_fin: "invalid-date",
      };
      const result = resolvedAlertsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkMarkReadAlertsSchema - Schéma pour marquer plusieurs alertes comme lues
  // ============================================================================
  describe("bulkMarkReadAlertsSchema", () => {
    it("devrait valider un array d'IDs valide", () => {
      const validBulk = {
        alert_ids: [1, 2, 3, 4, 5],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alert_ids).toHaveLength(5);
      }
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        alert_ids: [1],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec plusieurs IDs", () => {
      const validBulk = {
        alert_ids: [10, 20, 30, 40],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 100 IDs (maximum)", () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      const validBulk = {
        alert_ids: manyIds,
      };
      const result = bulkMarkReadAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alert_ids).toHaveLength(100);
      }
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        alert_ids: [50, 10, 30, 20, 40],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec des IDs dupliqués", () => {
      const validBulk = {
        alert_ids: [1, 2, 2, 3, 3, 3],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si alert_ids est manquant", () => {
      const invalidBulk = {};
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        alert_ids: [],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins une alerte");
      }
    });

    it("devrait rejeter plus de 100 IDs", () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);
      const invalidBulk = {
        alert_ids: tooManyIds,
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100 alertes");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        alert_ids: [1, 2, 0, 4],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        alert_ids: [1, 2, -3, 4],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des strings", () => {
      const invalidBulk = {
        alert_ids: [1, 2, "3" as any, 4],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant des décimaux", () => {
      const invalidBulk = {
        alert_ids: [1, 2, 3.5, 4],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant null", () => {
      const invalidBulk = {
        alert_ids: [1, 2, null as any, 4],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant undefined", () => {
      const invalidBulk = {
        alert_ids: [1, 2, undefined as any, 4],
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alert_ids n'est pas un array", () => {
      const invalidBulk = {
        alert_ids: 123 as any,
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alert_ids est une string", () => {
      const invalidBulk = {
        alert_ids: "1,2,3" as any,
      };
      const result = bulkMarkReadAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkResolveAlertsSchema - Schéma pour résoudre plusieurs alertes
  // ============================================================================
  describe("bulkResolveAlertsSchema", () => {
    it("devrait valider une résolution en masse complète", () => {
      const validBulk = {
        alert_ids: [1, 2, 3, 4, 5],
        resolu_par: 100,
        notes: "Toutes ces alertes ont été vérifiées et résolues",
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alert_ids).toHaveLength(5);
        expect(result.data.resolu_par).toBe(100);
      }
    });

    it("devrait valider sans notes (optionnel)", () => {
      const validBulk = {
        alert_ids: [10, 20, 30],
        resolu_par: 200,
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un seul ID", () => {
      const validBulk = {
        alert_ids: [1],
        resolu_par: 300,
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec 50 IDs (maximum)", () => {
      const manyIds = Array.from({ length: 50 }, (_, i) => i + 1);
      const validBulk = {
        alert_ids: manyIds,
        resolu_par: 400,
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alert_ids).toHaveLength(50);
      }
    });

    it("devrait valider avec notes de longueur minimale", () => {
      const validBulk = {
        alert_ids: [5, 6, 7],
        resolu_par: 500,
        notes: "X",
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec notes de longueur maximale", () => {
      const maxNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH);
      const validBulk = {
        alert_ids: [8, 9],
        resolu_par: 600,
        notes: maxNotes,
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait trim les espaces des notes", () => {
      const validBulk = {
        alert_ids: [11, 12],
        resolu_par: 700,
        notes: "  Notes avec espaces  ",
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe("Notes avec espaces");
      }
    });

    it("devrait valider avec des IDs en désordre", () => {
      const validBulk = {
        alert_ids: [50, 10, 30, 20],
        resolu_par: 800,
      };
      const result = bulkResolveAlertsSchema.safeParse(validBulk);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si alert_ids est manquant", () => {
      const invalidBulk = {
        resolu_par: 900,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est manquant", () => {
      const invalidBulk = {
        alert_ids: [1, 2, 3],
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array vide", () => {
      const invalidBulk = {
        alert_ids: [],
        resolu_par: 1000,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Au moins une alerte");
      }
    });

    it("devrait rejeter plus de 50 IDs", () => {
      const tooManyIds = Array.from({ length: 51 }, (_, i) => i + 1);
      const invalidBulk = {
        alert_ids: tooManyIds,
        resolu_par: 1100,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50 alertes");
      }
    });

    it("devrait rejeter un array contenant 0", () => {
      const invalidBulk = {
        alert_ids: [1, 2, 0],
        resolu_par: 1200,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un array contenant un ID négatif", () => {
      const invalidBulk = {
        alert_ids: [1, -2, 3],
        resolu_par: 1300,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est 0", () => {
      const invalidBulk = {
        alert_ids: [1, 2, 3],
        resolu_par: 0,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolu_par est négatif", () => {
      const invalidBulk = {
        alert_ids: [1, 2, 3],
        resolu_par: -100,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes vides", () => {
      const invalidBulk = {
        alert_ids: [1, 2],
        resolu_par: 1400,
        notes: "",
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes qui deviennent vides après trim", () => {
      const invalidBulk = {
        alert_ids: [3, 4],
        resolu_par: 1500,
        notes: "   ",
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des notes trop longues", () => {
      const longNotes = "N".repeat(USER_ALERT_NOTES_MAX_LENGTH + 1);
      const invalidBulk = {
        alert_ids: [5, 6],
        resolu_par: 1600,
        notes: longNotes,
      };
      const result = bulkResolveAlertsSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // userAlertIdSchema - Validation d'ID numérique
  // ============================================================================
  describe("userAlertIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = userAlertIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = userAlertIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = userAlertIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = userAlertIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = userAlertIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = userAlertIdSchema.safeParse("123");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // userAlertIdStringSchema - Validation d'ID en string
  // ============================================================================
  describe("userAlertIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = userAlertIdStringSchema.safeParse("123");
      expect(result.success).toBe(true);
    });

    it("devrait transformer la string en nombre", () => {
      const result = userAlertIdStringSchema.safeParse("456");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(456);
        expect(typeof result.data).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const result = userAlertIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID à 0", () => {
      const result = userAlertIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = userAlertIdStringSchema.safeParse("-10");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = userAlertIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = userAlertIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = userAlertIdStringSchema.safeParse("12.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = userAlertIdStringSchema.safeParse(" 123 ");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // userAlertIdParamSchema - Validation d'ID dans les paramètres de route
  // ============================================================================
  describe("userAlertIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "123",
      };
      const result = userAlertIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "789",
      };
      const result = userAlertIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "888888",
      };
      const result = userAlertIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = userAlertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = userAlertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-50",
      };
      const result = userAlertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = userAlertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc123",
      };
      const result = userAlertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "12.34",
      };
      const result = userAlertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // userAlertResponseSchema - Schéma de réponse d'alerte
  // ============================================================================
  describe("userAlertResponseSchema", () => {
    it("devrait valider une réponse d'alerte complète", () => {
      const validResponse = {
        id: 1,
        utilisateur_id: 100,
        alerte_type_id: 5,
        statut: "active" as const,
        message: "Alerte de paiement en retard",
        donnees_contexte: { montant: 150, reference: "PAY-001" },
        date_detection: new Date(),
        date_resolution: null,
        notes: null,
        resolu_par: null,
        lu: false,
        date_lecture: null,
      };
      const result = userAlertResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 2,
        utilisateur_id: 200,
        alerte_type_id: 10,
        date_detection: new Date(),
      };
      const result = userAlertResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // userAlertsListResponseSchema - Schéma de liste d'alertes paginée
  // ============================================================================
  describe("userAlertsListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            utilisateur_id: 100,
            alerte_type_id: 5,
            statut: "active" as const,
            date_detection: new Date(),
            lu: false,
          },
          {
            id: 2,
            utilisateur_id: 200,
            alerte_type_id: 10,
            statut: "resolue" as const,
            date_detection: new Date(),
            date_resolution: new Date(),
            resolu_par: 50,
            lu: true,
            date_lecture: new Date(),
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 50,
          total_pages: 3,
        },
      };
      const result = userAlertsListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
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
      const result = userAlertsListResponseSchema.safeParse(validResponse);
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
      const result = userAlertsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = userAlertsListResponseSchema.safeParse(invalidResponse);
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
      const result = userAlertsListResponseSchema.safeParse(invalidResponse);
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
      const result = userAlertsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // userAlertStatsSchema - Schéma de statistiques d'alertes
  // ============================================================================
  describe("userAlertStatsSchema", () => {
    it("devrait valider des statistiques valides", () => {
      const validStats = {
        total: 100,
        active: 25,
        resolved: 60,
        ignored: 15,
        unread: 30,
        by_type: {
          "1": 40,
          "2": 30,
          "3": 30,
        },
      };
      const result = userAlertStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
        expect(result.data.active).toBe(25);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total: 0,
        active: 0,
        resolved: 0,
        ignored: 0,
        unread: 0,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec by_type vide", () => {
      const validStats = {
        total: 50,
        active: 10,
        resolved: 30,
        ignored: 10,
        unread: 5,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec by_type contenant plusieurs types", () => {
      const validStats = {
        total: 200,
        active: 50,
        resolved: 120,
        ignored: 30,
        unread: 40,
        by_type: {
          paiement: 80,
          adhesion: 60,
          document: 40,
          autre: 20,
        },
      };
      const result = userAlertStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si total est manquant", () => {
      const invalidStats = {
        active: 10,
        resolved: 20,
        ignored: 5,
        unread: 8,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si active est manquant", () => {
      const invalidStats = {
        total: 50,
        resolved: 30,
        ignored: 10,
        unread: 15,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolved est manquant", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        ignored: 10,
        unread: 15,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ignored est manquant", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        resolved: 25,
        unread: 15,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si unread est manquant", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        resolved: 25,
        ignored: 5,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_type est manquant", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        resolved: 25,
        ignored: 5,
        unread: 15,
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidStats = {
        total: -10,
        active: 5,
        resolved: 10,
        ignored: 2,
        unread: 3,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si active est négatif", () => {
      const invalidStats = {
        total: 50,
        active: -5,
        resolved: 40,
        ignored: 10,
        unread: 5,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si resolved est négatif", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        resolved: -10,
        ignored: 5,
        unread: 15,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si ignored est négatif", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        resolved: 25,
        ignored: -5,
        unread: 10,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si unread est négatif", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        resolved: 25,
        ignored: 5,
        unread: -10,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des strings", () => {
      const invalidStats = {
        total: "50" as any,
        active: "20" as any,
        resolved: "25" as any,
        ignored: "5" as any,
        unread: "10" as any,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des décimaux", () => {
      const invalidStats = {
        total: 50.5,
        active: 20.3,
        resolved: 25.7,
        ignored: 5.1,
        unread: 10.9,
        by_type: {},
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_type contient des valeurs négatives", () => {
      const invalidStats = {
        total: 50,
        active: 20,
        resolved: 25,
        ignored: 5,
        unread: 10,
        by_type: {
          "1": 30,
          "2": -10,
        },
      };
      const result = userAlertStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference - Vérification de l'inférence des types TypeScript
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type UserAlert", () => {
      const alert: UserAlert = {
        id: 1,
        utilisateur_id: 100,
        alerte_type_id: 5,
        statut: "active",
        date_detection: new Date(),
        lu: false,
      };
      expect(alert.id).toBe(1);
      expect(alert.statut).toBe("active");
    });

    it("devrait inférer correctement le type CreateUserAlert", () => {
      const create: CreateUserAlert = {
        utilisateur_id: 200,
        alerte_type_id: 10,
        statut: "active",
      };
      expect(create.utilisateur_id).toBe(200);
    });

    it("devrait inférer correctement le type UpdateUserAlert", () => {
      const update: UpdateUserAlert = {
        statut: "resolue",
        lu: true,
      };
      expect(update.statut).toBe("resolue");
    });

    it("devrait inférer correctement le type ResolveAlert", () => {
      const resolve: ResolveAlert = {
        resolu_par: 300,
        notes: "Résolu avec succès",
      };
      expect(resolve.resolu_par).toBe(300);
    });

    it("devrait inférer correctement le type IgnoreAlert", () => {
      const ignore: IgnoreAlert = {
        notes: "Fausse alerte",
      };
      expect(ignore.notes).toBe("Fausse alerte");
    });

    it("devrait inférer correctement le type ListUserAlertsQuery", () => {
      const query: ListUserAlertsQuery = {
        page: 1,
        limit: 20,
        statut: "active",
        sort_by: "date_detection",
        sort_order: "desc",
      };
      expect(query.statut).toBe("active");
    });

    it("devrait inférer correctement le type ActiveAlertsQuery", () => {
      const query: ActiveAlertsQuery = {
        page: 1,
        limit: 20,
        utilisateur_id: 400,
        sort_by: "date_detection",
        sort_order: "desc",
      };
      expect(query.sort_by).toBe("date_detection");
    });

    it("devrait inférer correctement le type ResolvedAlertsQuery", () => {
      const query: ResolvedAlertsQuery = {
        page: 1,
        limit: 20,
        resolu_par: 500,
        sort_by: "date_resolution",
        sort_order: "desc",
      };
      expect(query.sort_by).toBe("date_resolution");
    });

    it("devrait inférer correctement le type BulkMarkReadAlerts", () => {
      const bulk: BulkMarkReadAlerts = {
        alert_ids: [1, 2, 3],
      };
      expect(bulk.alert_ids).toHaveLength(3);
    });

    it("devrait inférer correctement le type BulkResolveAlerts", () => {
      const bulk: BulkResolveAlerts = {
        alert_ids: [4, 5, 6],
        resolu_par: 600,
      };
      expect(bulk.resolu_par).toBe(600);
    });

    it("devrait inférer correctement le type UserAlertIdParam", () => {
      const param: UserAlertIdParam = {
        id: 700,
      };
      expect(param.id).toBe(700);
    });

    it("devrait inférer correctement le type UserAlertResponse", () => {
      const response: UserAlertResponse = {
        id: 8,
        utilisateur_id: 800,
        alerte_type_id: 15,
        statut: "active",
        date_detection: new Date(),
        lu: false,
      };
      expect(response.id).toBe(8);
    });

    it("devrait inférer correctement le type UserAlertsListResponse", () => {
      const response: UserAlertsListResponse = {
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

    it("devrait inférer correctement le type UserAlertStats", () => {
      const stats: UserAlertStats = {
        total: 100,
        active: 30,
        resolved: 50,
        ignored: 20,
        unread: 25,
        by_type: {
          "1": 50,
          "2": 50,
        },
      };
      expect(stats.total).toBe(100);
    });
  });
});
