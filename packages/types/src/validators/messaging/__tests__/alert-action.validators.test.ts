/**
 * @fileoverview Tests for Alert Action Validators
 * @module @clubmanager/types/validators/messaging/__tests__/alert-action
 */

import { describe, it, expect } from "@jest/globals";
import {
  alertActionTypeSchema,
  alertActionBaseSchema,
  createAlertActionSchema,
  listAlertActionsSchema,
  alertHistorySchema,
  actionsByTypeSchema,
  actionsByUserSchema,
  alertActionIdSchema,
  alertActionIdStringSchema,
  alertActionIdParamSchema,
  alertIdParamSchema,
  alertActionResponseSchema,
  alertActionsListResponseSchema,
  alertActionStatsSchema,
  alertTimelineEntrySchema,
  alertTimelineSchema,
  type AlertAction,
  type CreateAlertAction,
  type ListAlertActionsQuery,
  type AlertHistoryQuery,
  type ActionsByTypeQuery,
  type ActionsByUserQuery,
  type AlertActionIdParam,
  type AlertIdParam,
  type AlertActionResponse,
  type AlertActionsListResponse,
  type AlertActionStats,
  type AlertTimelineEntry,
  type AlertTimeline,
} from "../alert-action.validators.js";

describe("Alert Action Validators", () => {
  // ============================================================================
  // alertActionTypeSchema
  // ============================================================================

  describe("alertActionTypeSchema", () => {
    it('devrait valider le type "message_envoye"', () => {
      const result = alertActionTypeSchema.safeParse("message_envoye");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("message_envoye");
      }
    });

    it('devrait valider le type "information_mise_a_jour"', () => {
      const result = alertActionTypeSchema.safeParse("information_mise_a_jour");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("information_mise_a_jour");
      }
    });

    it('devrait valider le type "paiement_recu"', () => {
      const result = alertActionTypeSchema.safeParse("paiement_recu");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("paiement_recu");
      }
    });

    it('devrait valider le type "statut_change"', () => {
      const result = alertActionTypeSchema.safeParse("statut_change");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("statut_change");
      }
    });

    it('devrait valider le type "autre"', () => {
      const result = alertActionTypeSchema.safeParse("autre");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("autre");
      }
    });

    it("devrait rejeter un type invalide", () => {
      const result = alertActionTypeSchema.safeParse("type_invalide");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Le type d'action doit être l'un des suivants",
        );
      }
    });

    it("devrait rejeter une chaîne vide", () => {
      const result = alertActionTypeSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const result = alertActionTypeSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = alertActionTypeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = alertActionTypeSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet", () => {
      const result = alertActionTypeSchema.safeParse({
        type: "message_envoye",
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertActionBaseSchema
  // ============================================================================

  describe("alertActionBaseSchema", () => {
    it("devrait valider une action complète avec tous les champs", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Message envoyé au membre",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.action_type).toBe("message_envoye");
        expect(result.data.description).toBe("Message envoyé au membre");
        expect(result.data.effectue_par).toBe(5);
        expect(result.data.date_action).toEqual(
          new Date("2024-01-15T10:30:00Z"),
        );
      }
    });

    it("devrait valider avec description à null", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "statut_change",
        description: null,
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it("devrait valider avec description optionnelle (undefined)", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "paiement_recu",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it("devrait valider avec effectue_par à null", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "autre",
        description: "Action système automatique",
        effectue_par: null,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.effectue_par).toBeNull();
      }
    });

    it("devrait valider avec effectue_par optionnel (undefined)", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "information_mise_a_jour",
        description: "Information mise à jour",
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.effectue_par).toBeUndefined();
      }
    });

    it("devrait valider avec description de 1 caractère (longueur minimale)", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "autre",
        description: "A",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("A");
      }
    });

    it("devrait valider avec description de 65535 caractères (longueur maximale)", () => {
      const maxDescription = "A".repeat(65535);
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: maxDescription,
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(maxDescription);
        expect(result.data.description?.length).toBe(65535);
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "paiement_recu",
        description: "  Paiement validé  ",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Paiement validé");
      }
    });

    it("devrait coercer une string en Date pour date_action", () => {
      const validAction = {
        id: 1,
        alerte_id: 100,
        action_type: "statut_change",
        description: "Statut modifié",
        effectue_par: 5,
        date_action: "2024-01-15T10:30:00Z",
      };
      const result = alertActionBaseSchema.safeParse(validAction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_action).toBeInstanceOf(Date);
        expect(result.data.date_action.toISOString()).toBe(
          "2024-01-15T10:30:00.000Z",
        );
      }
    });

    it("devrait valider tous les types d'action", () => {
      const actionTypes = [
        "message_envoye",
        "information_mise_a_jour",
        "paiement_recu",
        "statut_change",
        "autre",
      ];
      actionTypes.forEach((actionType) => {
        const validAction = {
          id: 1,
          alerte_id: 100,
          action_type: actionType,
          description: `Test ${actionType}`,
          effectue_par: 5,
          date_action: new Date("2024-01-15T10:30:00Z"),
        };
        const result = alertActionBaseSchema.safeParse(validAction);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter une description vide après trim", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "au moins 1 caractère",
        );
      }
    });

    it("devrait rejeter une description qui devient vide après trim", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "   ",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "au moins 1 caractère",
        );
      }
    });

    it("devrait rejeter une description trop longue (> 65535 caractères)", () => {
      const longDescription = "A".repeat(65536);
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: longDescription,
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("65535 caractères");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidAction = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est manquant", () => {
      const invalidAction = {
        id: 1,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si action_type est manquant", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si date_action est manquant", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidAction = {
        id: 0,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidAction = {
        id: -1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est 0", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 0,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est négatif", () => {
      const invalidAction = {
        id: 1,
        alerte_id: -100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est 0", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 0,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est négatif", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: -5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_action invalide", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: "date invalide",
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un action_type invalide", () => {
      const invalidAction = {
        id: 1,
        alerte_id: 100,
        action_type: "type_inconnu",
        description: "Test",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionBaseSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createAlertActionSchema
  // ============================================================================

  describe("createAlertActionSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Message envoyé au membre",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.action_type).toBe("message_envoye");
        expect(result.data.description).toBe("Message envoyé au membre");
        expect(result.data.effectue_par).toBe(5);
      }
    });

    it("devrait valider avec seulement les champs requis (sans description)", () => {
      const validCreate = {
        alerte_id: 100,
        action_type: "statut_change",
      };
      const result = createAlertActionSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.action_type).toBe("statut_change");
        expect(result.data.description).toBeUndefined();
        expect(result.data.effectue_par).toBeUndefined();
      }
    });

    it("devrait valider avec description à null", () => {
      const validCreate = {
        alerte_id: 100,
        action_type: "paiement_recu",
        description: null,
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it("devrait valider avec effectue_par à null", () => {
      const validCreate = {
        alerte_id: 100,
        action_type: "autre",
        description: "Action automatique",
        effectue_par: null,
      };
      const result = createAlertActionSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.effectue_par).toBeNull();
      }
    });

    it("devrait valider avec description de 1 caractère", () => {
      const validCreate = {
        alerte_id: 100,
        action_type: "information_mise_a_jour",
        description: "X",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("X");
      }
    });

    it("devrait valider avec description de longueur maximale", () => {
      const maxDescription = "B".repeat(65535);
      const validCreate = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: maxDescription,
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description?.length).toBe(65535);
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validCreate = {
        alerte_id: 100,
        action_type: "paiement_recu",
        description: "  Paiement confirmé  ",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Paiement confirmé");
      }
    });

    it("devrait valider tous les types d'action", () => {
      const actionTypes = [
        "message_envoye",
        "information_mise_a_jour",
        "paiement_recu",
        "statut_change",
        "autre",
      ];
      actionTypes.forEach((actionType) => {
        const validCreate = {
          alerte_id: 100,
          action_type: actionType,
          description: `Test ${actionType}`,
          effectue_par: 5,
        };
        const result = createAlertActionSchema.safeParse(validCreate);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter si alerte_id est manquant", () => {
      const invalidCreate = {
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si action_type est manquant", () => {
      const invalidCreate = {
        alerte_id: 100,
        description: "Test",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description vide", () => {
      const invalidCreate = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: "",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description qui devient vide après trim", () => {
      const invalidCreate = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: "   ",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description trop longue", () => {
      const longDescription = "C".repeat(65536);
      const invalidCreate = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: longDescription,
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est 0", () => {
      const invalidCreate = {
        alerte_id: 0,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est négatif", () => {
      const invalidCreate = {
        alerte_id: -100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est 0", () => {
      const invalidCreate = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 0,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est négatif", () => {
      const invalidCreate = {
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: -5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un action_type invalide", () => {
      const invalidCreate = {
        alerte_id: 100,
        action_type: "type_invalide",
        description: "Test",
        effectue_par: 5,
      };
      const result = createAlertActionSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listAlertActionsSchema
  // ============================================================================

  describe("listAlertActionsSchema", () => {
    it("devrait valider une query complète avec tous les filtres", () => {
      const validQuery = {
        page: 2,
        limit: 50,
        alerte_id: 100,
        action_type: "message_envoye",
        effectue_par: 5,
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
        sort_by: "date_action",
        sort_order: "asc",
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.action_type).toBe("message_envoye");
        expect(result.data.effectue_par).toBe(5);
        expect(result.data.sort_by).toBe("date_action");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_action");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec seulement alerte_id", () => {
      const validQuery = {
        alerte_id: 100,
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(100);
      }
    });

    it("devrait valider avec seulement action_type", () => {
      const validQuery = {
        action_type: "paiement_recu",
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.action_type).toBe("paiement_recu");
      }
    });

    it("devrait valider avec seulement effectue_par", () => {
      const validQuery = {
        effectue_par: 10,
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.effectue_par).toBe(10);
      }
    });

    it("devrait valider avec seulement date_debut", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toEqual(new Date("2024-01-01"));
      }
    });

    it("devrait valider avec seulement date_fin", () => {
      const validQuery = {
        date_fin: new Date("2024-12-31"),
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toEqual(new Date("2024-12-31"));
      }
    });

    it("devrait valider avec date_debut et date_fin", () => {
      const validQuery = {
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-12-31"),
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toEqual(new Date("2024-01-01"));
        expect(result.data.date_fin).toEqual(new Date("2024-12-31"));
      }
    });

    it("devrait coercer des strings en Date", () => {
      const validQuery = {
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider avec sort_by date_action", () => {
      const validQuery = {
        sort_by: "date_action",
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_action");
      }
    });

    it("devrait valider avec sort_by action_type", () => {
      const validQuery = {
        sort_by: "action_type",
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("action_type");
      }
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        sort_order: "asc",
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        sort_order: "desc",
      };
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait appliquer date_action comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_action");
      }
    });

    it("devrait appliquer desc comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listAlertActionsSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec tous les types d'action", () => {
      const actionTypes = [
        "message_envoye",
        "information_mise_a_jour",
        "paiement_recu",
        "statut_change",
        "autre",
      ];
      actionTypes.forEach((actionType) => {
        const validQuery = {
          action_type: actionType,
        };
        const result = listAlertActionsSchema.safeParse(validQuery);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter si alerte_id est 0", () => {
      const invalidQuery = {
        alerte_id: 0,
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est négatif", () => {
      const invalidQuery = {
        alerte_id: -100,
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est 0", () => {
      const invalidQuery = {
        effectue_par: 0,
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est négatif", () => {
      const invalidQuery = {
        effectue_par: -5,
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "invalid_field",
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "invalid_order",
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un action_type invalide", () => {
      const invalidQuery = {
        action_type: "type_inconnu",
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        date_debut: "date invalide",
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        date_fin: "pas une date",
      };
      const result = listAlertActionsSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertHistorySchema
  // ============================================================================

  describe("alertHistorySchema", () => {
    it("devrait valider une query complète d'historique", () => {
      const validQuery = {
        alerte_id: 100,
        page: 2,
        page_size: 50,
        sort_order: "desc",
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.page).toBe(2);
        expect(result.data.page_size).toBe(50);
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec seulement alerte_id (champs par défaut)", () => {
      const validQuery = {
        alerte_id: 100,
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.page).toBe(1);
        expect(result.data.page_size).toBe(20);
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait appliquer page 1 par défaut", () => {
      const validQuery = {
        alerte_id: 100,
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("devrait appliquer page_size 20 par défaut", () => {
      const validQuery = {
        alerte_id: 100,
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page_size).toBe(20);
      }
    });

    it("devrait appliquer sort_order asc par défaut", () => {
      const validQuery = {
        alerte_id: 100,
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec page_size minimum (1)", () => {
      const validQuery = {
        alerte_id: 100,
        page_size: 1,
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page_size).toBe(1);
      }
    });

    it("devrait valider avec page_size maximum (100)", () => {
      const validQuery = {
        alerte_id: 100,
        page_size: 100,
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page_size).toBe(100);
      }
    });

    it("devrait coercer une string en nombre pour page", () => {
      const validQuery = {
        alerte_id: 100,
        page: "3",
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it("devrait coercer une string en nombre pour page_size", () => {
      const validQuery = {
        alerte_id: 100,
        page_size: "25",
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page_size).toBe(25);
      }
    });

    it("devrait valider avec sort_order desc", () => {
      const validQuery = {
        alerte_id: 100,
        sort_order: "desc",
      };
      const result = alertHistorySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait rejeter si alerte_id est manquant", () => {
      const invalidQuery = {
        page: 1,
        page_size: 20,
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est 0", () => {
      const invalidQuery = {
        alerte_id: 0,
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est négatif", () => {
      const invalidQuery = {
        alerte_id: -100,
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidQuery = {
        alerte_id: 100,
        page: 0,
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est négatif", () => {
      const invalidQuery = {
        alerte_id: 100,
        page: -1,
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page_size est 0", () => {
      const invalidQuery = {
        alerte_id: 100,
        page_size: 0,
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page_size est supérieur à 100", () => {
      const invalidQuery = {
        alerte_id: 100,
        page_size: 101,
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        alerte_id: 100,
        sort_order: "invalid",
      };
      const result = alertHistorySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // actionsByTypeSchema
  // ============================================================================

  describe("actionsByTypeSchema", () => {
    it("devrait valider une query complète par type", () => {
      const validQuery = {
        action_type: "message_envoye",
        alerte_id: 100,
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
      };
      const result = actionsByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.action_type).toBe("message_envoye");
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.date_debut).toEqual(new Date("2024-01-01"));
        expect(result.data.date_fin).toEqual(new Date("2024-01-31"));
      }
    });

    it("devrait valider avec seulement action_type", () => {
      const validQuery = {
        action_type: "paiement_recu",
      };
      const result = actionsByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.action_type).toBe("paiement_recu");
      }
    });

    it("devrait valider tous les types d'action", () => {
      const actionTypes = [
        "message_envoye",
        "information_mise_a_jour",
        "paiement_recu",
        "statut_change",
        "autre",
      ];
      actionTypes.forEach((actionType) => {
        const validQuery = {
          action_type: actionType,
        };
        const result = actionsByTypeSchema.safeParse(validQuery);
        expect(result.success).toBe(true);
      });
    });

    it("devrait valider avec alerte_id", () => {
      const validQuery = {
        action_type: "statut_change",
        alerte_id: 50,
      };
      const result = actionsByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(50);
      }
    });

    it("devrait valider avec date_debut", () => {
      const validQuery = {
        action_type: "information_mise_a_jour",
        date_debut: new Date("2024-01-01"),
      };
      const result = actionsByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toEqual(new Date("2024-01-01"));
      }
    });

    it("devrait valider avec date_fin", () => {
      const validQuery = {
        action_type: "autre",
        date_fin: new Date("2024-12-31"),
      };
      const result = actionsByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toEqual(new Date("2024-12-31"));
      }
    });

    it("devrait coercer des strings en Date", () => {
      const validQuery = {
        action_type: "message_envoye",
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result = actionsByTypeSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait rejeter si action_type est manquant", () => {
      const invalidQuery = {
        alerte_id: 100,
      };
      const result = actionsByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un action_type invalide", () => {
      const invalidQuery = {
        action_type: "type_inconnu",
      };
      const result = actionsByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est 0", () => {
      const invalidQuery = {
        action_type: "message_envoye",
        alerte_id: 0,
      };
      const result = actionsByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est négatif", () => {
      const invalidQuery = {
        action_type: "message_envoye",
        alerte_id: -100,
      };
      const result = actionsByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        action_type: "message_envoye",
        date_debut: "invalid date",
      };
      const result = actionsByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        action_type: "message_envoye",
        date_fin: "not a date",
      };
      const result = actionsByTypeSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // actionsByUserSchema
  // ============================================================================

  describe("actionsByUserSchema", () => {
    it("devrait valider une query complète par utilisateur", () => {
      const validQuery = {
        page: 2,
        limit: 50,
        effectue_par: 5,
        action_type: "message_envoye",
        date_debut: new Date("2024-01-01"),
        date_fin: new Date("2024-01-31"),
        sort_by: "date_action",
        sort_order: "asc",
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.effectue_par).toBe(5);
        expect(result.data.action_type).toBe("message_envoye");
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.sort_by).toBe("date_action");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec seulement effectue_par", () => {
      const validQuery = {
        effectue_par: 10,
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.effectue_par).toBe(10);
        expect(result.data.sort_by).toBe("date_action");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec action_type", () => {
      const validQuery = {
        effectue_par: 5,
        action_type: "paiement_recu",
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.action_type).toBe("paiement_recu");
      }
    });

    it("devrait valider avec date_debut", () => {
      const validQuery = {
        effectue_par: 5,
        date_debut: new Date("2024-01-01"),
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toEqual(new Date("2024-01-01"));
      }
    });

    it("devrait valider avec date_fin", () => {
      const validQuery = {
        effectue_par: 5,
        date_fin: new Date("2024-12-31"),
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_fin).toEqual(new Date("2024-12-31"));
      }
    });

    it("devrait coercer des strings en Date", () => {
      const validQuery = {
        effectue_par: 5,
        date_debut: "2024-01-01",
        date_fin: "2024-12-31",
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date_debut).toBeInstanceOf(Date);
        expect(result.data.date_fin).toBeInstanceOf(Date);
      }
    });

    it("devrait valider tous les types d'action", () => {
      const actionTypes = [
        "message_envoye",
        "information_mise_a_jour",
        "paiement_recu",
        "statut_change",
        "autre",
      ];
      actionTypes.forEach((actionType) => {
        const validQuery = {
          effectue_par: 5,
          action_type: actionType,
        };
        const result = actionsByUserSchema.safeParse(validQuery);
        expect(result.success).toBe(true);
      });
    });

    it("devrait appliquer date_action comme sort_by par défaut", () => {
      const validQuery = {
        effectue_par: 5,
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("date_action");
      }
    });

    it("devrait appliquer desc comme sort_order par défaut", () => {
      const validQuery = {
        effectue_par: 5,
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec sort_order asc", () => {
      const validQuery = {
        effectue_par: 5,
        sort_order: "asc",
      };
      const result = actionsByUserSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait rejeter si effectue_par est manquant", () => {
      const invalidQuery = {
        action_type: "message_envoye",
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est 0", () => {
      const invalidQuery = {
        effectue_par: 0,
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si effectue_par est négatif", () => {
      const invalidQuery = {
        effectue_par: -5,
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un action_type invalide", () => {
      const invalidQuery = {
        effectue_par: 5,
        action_type: "type_invalide",
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        effectue_par: 5,
        sort_by: "invalid_field",
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        effectue_par: 5,
        sort_order: "invalid",
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_debut invalide", () => {
      const invalidQuery = {
        effectue_par: 5,
        date_debut: "invalid date",
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une date_fin invalide", () => {
      const invalidQuery = {
        effectue_par: 5,
        date_fin: "not a date",
      };
      const result = actionsByUserSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertActionIdSchema
  // ============================================================================

  describe("alertActionIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = alertActionIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = alertActionIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = alertActionIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = alertActionIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = alertActionIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = alertActionIdSchema.safeParse("1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = alertActionIdSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = alertActionIdSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertActionIdStringSchema
  // ============================================================================

  describe("alertActionIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = alertActionIdStringSchema.safeParse("1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const result = alertActionIdStringSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe("number");
        expect(result.data).toBe(42);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = alertActionIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = alertActionIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = alertActionIdStringSchema.safeParse("-1");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = alertActionIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = alertActionIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = alertActionIdStringSchema.safeParse("1.5");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = alertActionIdStringSchema.safeParse(" 1 ");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = alertActionIdStringSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre (non string)", () => {
      const result = alertActionIdStringSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertActionIdParamSchema
  // ============================================================================

  describe("alertActionIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "1",
      };
      const result = alertActionIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "42",
      };
      const result = alertActionIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe("number");
        expect(result.data.id).toBe(42);
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999",
      };
      const result = alertActionIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999999);
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = alertActionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à 0", () => {
      const invalidParam = {
        id: "0",
      };
      const result = alertActionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-1",
      };
      const result = alertActionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = alertActionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc",
      };
      const result = alertActionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "1.5",
      };
      const result = alertActionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertIdParamSchema
  // ============================================================================

  describe("alertIdParamSchema", () => {
    it("devrait valider un alerte_id valide en string", () => {
      const validParam = {
        alerte_id: "100",
      };
      const result = alertIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(100);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        alerte_id: "50",
      };
      const result = alertIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.alerte_id).toBe("number");
        expect(result.data.alerte_id).toBe(50);
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        alerte_id: "888888",
      };
      const result = alertIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(888888);
      }
    });

    it("devrait rejeter si alerte_id est manquant", () => {
      const invalidParam = {};
      const result = alertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un alerte_id à 0", () => {
      const invalidParam = {
        alerte_id: "0",
      };
      const result = alertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un alerte_id négatif", () => {
      const invalidParam = {
        alerte_id: "-100",
      };
      const result = alertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        alerte_id: "",
      };
      const result = alertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un alerte_id avec des caractères non numériques", () => {
      const invalidParam = {
        alerte_id: "xyz",
      };
      const result = alertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un alerte_id décimal", () => {
      const invalidParam = {
        alerte_id: "100.5",
      };
      const result = alertIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertActionResponseSchema
  // ============================================================================

  describe("alertActionResponseSchema", () => {
    it("devrait valider une réponse complète", () => {
      const validResponse = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Message envoyé",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.action_type).toBe("message_envoye");
        expect(result.data.description).toBe("Message envoyé");
        expect(result.data.effectue_par).toBe(5);
      }
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 1,
        alerte_id: 100,
        action_type: "statut_change",
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertActionResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.action_type).toBe("statut_change");
      }
    });

    it("devrait valider avec tous les types d'action", () => {
      const actionTypes = [
        "message_envoye",
        "information_mise_a_jour",
        "paiement_recu",
        "statut_change",
        "autre",
      ];
      actionTypes.forEach((actionType) => {
        const validResponse = {
          id: 1,
          alerte_id: 100,
          action_type: actionType,
          date_action: new Date("2024-01-15T10:30:00Z"),
        };
        const result = alertActionResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // alertActionsListResponseSchema
  // ============================================================================

  describe("alertActionsListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            alerte_id: 100,
            action_type: "message_envoye",
            description: "Premier message",
            effectue_par: 5,
            date_action: new Date("2024-01-15T10:30:00Z"),
          },
          {
            id: 2,
            alerte_id: 100,
            action_type: "statut_change",
            description: "Statut modifié",
            effectue_par: 5,
            date_action: new Date("2024-01-16T14:20:00Z"),
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 2,
          total_pages: 1,
        },
      };
      const result = alertActionsListResponseSchema.safeParse(validResponse);
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
      const result = alertActionsListResponseSchema.safeParse(validResponse);
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
            id: 21,
            alerte_id: 100,
            action_type: "paiement_recu",
            description: "Paiement validé",
            effectue_par: 5,
            date_action: new Date("2024-01-17T09:00:00Z"),
          },
        ],
        pagination: {
          page: 2,
          page_size: 20,
          total: 25,
          total_pages: 2,
        },
      };
      const result = alertActionsListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pagination.page).toBe(2);
        expect(result.data.pagination.total_pages).toBe(2);
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
      const result = alertActionsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = alertActionsListResponseSchema.safeParse(invalidResponse);
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
      const result = alertActionsListResponseSchema.safeParse(invalidResponse);
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
      const result = alertActionsListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertActionStatsSchema
  // ============================================================================

  describe("alertActionStatsSchema", () => {
    it("devrait valider des statistiques complètes", () => {
      const validStats = {
        total: 100,
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        by_user: {
          "1": 50,
          "2": 30,
          "3": 20,
        },
        recent_actions: [
          {
            id: 1,
            alerte_id: 100,
            action_type: "message_envoye",
            description: "Message récent",
            effectue_par: 5,
            date_action: new Date("2024-01-15T10:30:00Z"),
          },
        ],
      };
      const result = alertActionStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
        expect(result.data.by_type.message_envoye).toBe(30);
        expect(result.data.by_user["1"]).toBe(50);
        expect(result.data.recent_actions.length).toBe(1);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total: 0,
        by_type: {
          message_envoye: 0,
          information_mise_a_jour: 0,
          paiement_recu: 0,
          statut_change: 0,
          autre: 0,
        },
        by_user: {},
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
        expect(result.data.by_type.message_envoye).toBe(0);
      }
    });

    it("devrait valider avec 10 actions récentes (maximum)", () => {
      const recentActions = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        alerte_id: 100,
        action_type: "message_envoye" as const,
        description: `Action ${i + 1}`,
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      }));
      const validStats = {
        total: 100,
        by_type: {
          message_envoye: 100,
          information_mise_a_jour: 0,
          paiement_recu: 0,
          statut_change: 0,
          autre: 0,
        },
        by_user: {
          "5": 100,
        },
        recent_actions: recentActions,
      };
      const result = alertActionStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recent_actions.length).toBe(10);
      }
    });

    it("devrait valider avec plusieurs utilisateurs dans by_user", () => {
      const validStats = {
        total: 100,
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        by_user: {
          "1": 25,
          "2": 25,
          "3": 25,
          "4": 25,
        },
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.by_user).length).toBe(4);
      }
    });

    it("devrait rejeter si total est manquant", () => {
      const invalidStats = {
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        by_user: {},
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_type est manquant", () => {
      const invalidStats = {
        total: 100,
        by_user: {},
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_user est manquant", () => {
      const invalidStats = {
        total: 100,
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si recent_actions est manquant", () => {
      const invalidStats = {
        total: 100,
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        by_user: {},
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidStats = {
        total: -1,
        by_type: {
          message_envoye: 0,
          information_mise_a_jour: 0,
          paiement_recu: 0,
          statut_change: 0,
          autre: 0,
        },
        by_user: {},
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un compteur by_type est négatif", () => {
      const invalidStats = {
        total: 100,
        by_type: {
          message_envoye: -1,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        by_user: {},
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un compteur by_user est négatif", () => {
      const invalidStats = {
        total: 100,
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        by_user: {
          "1": -1,
        },
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si recent_actions contient plus de 10 éléments", () => {
      const recentActions = Array.from({ length: 11 }, (_, i) => ({
        id: i + 1,
        alerte_id: 100,
        action_type: "message_envoye" as const,
        description: `Action ${i + 1}`,
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      }));
      const invalidStats = {
        total: 100,
        by_type: {
          message_envoye: 100,
          information_mise_a_jour: 0,
          paiement_recu: 0,
          statut_change: 0,
          autre: 0,
        },
        by_user: {},
        recent_actions: recentActions,
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un type d'action est manquant dans by_type", () => {
      const invalidStats = {
        total: 100,
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          // autre manquant
        },
        by_user: {},
        recent_actions: [],
      };
      const result = alertActionStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTimelineEntrySchema
  // ============================================================================

  describe("alertTimelineEntrySchema", () => {
    it("devrait valider une entrée de timeline complète", () => {
      const validEntry = {
        id: 1,
        alerte_id: 100,
        action_type: "statut_change",
        description: "Changement de statut",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
        user_name: "Jean Dupont",
        alert_status_before: "en_attente",
        alert_status_after: "traite",
      };
      const result = alertTimelineEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.user_name).toBe("Jean Dupont");
        expect(result.data.alert_status_before).toBe("en_attente");
        expect(result.data.alert_status_after).toBe("traite");
      }
    });

    it("devrait valider sans les champs optionnels de timeline", () => {
      const validEntry = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Message envoyé",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      };
      const result = alertTimelineEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user_name).toBeUndefined();
        expect(result.data.alert_status_before).toBeUndefined();
        expect(result.data.alert_status_after).toBeUndefined();
      }
    });

    it("devrait valider avec seulement user_name", () => {
      const validEntry = {
        id: 1,
        alerte_id: 100,
        action_type: "paiement_recu",
        description: "Paiement validé",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
        user_name: "Marie Martin",
      };
      const result = alertTimelineEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user_name).toBe("Marie Martin");
      }
    });

    it("devrait valider avec seulement alert_status_before", () => {
      const validEntry = {
        id: 1,
        alerte_id: 100,
        action_type: "statut_change",
        description: "Statut changé",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
        alert_status_before: "nouveau",
      };
      const result = alertTimelineEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alert_status_before).toBe("nouveau");
      }
    });

    it("devrait valider avec seulement alert_status_after", () => {
      const validEntry = {
        id: 1,
        alerte_id: 100,
        action_type: "statut_change",
        description: "Statut modifié",
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
        alert_status_after: "cloture",
      };
      const result = alertTimelineEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alert_status_after).toBe("cloture");
      }
    });

    it("devrait valider tous les types d'action", () => {
      const actionTypes = [
        "message_envoye",
        "information_mise_a_jour",
        "paiement_recu",
        "statut_change",
        "autre",
      ];
      actionTypes.forEach((actionType) => {
        const validEntry = {
          id: 1,
          alerte_id: 100,
          action_type: actionType,
          description: `Test ${actionType}`,
          effectue_par: 5,
          date_action: new Date("2024-01-15T10:30:00Z"),
          user_name: "Test User",
        };
        const result = alertTimelineEntrySchema.safeParse(validEntry);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // alertTimelineSchema
  // ============================================================================

  describe("alertTimelineSchema", () => {
    it("devrait valider une timeline complète", () => {
      const validTimeline = {
        alerte_id: 100,
        entries: [
          {
            id: 1,
            alerte_id: 100,
            action_type: "message_envoye",
            description: "Création de l'alerte",
            effectue_par: 5,
            date_action: new Date("2024-01-15T10:30:00Z"),
            user_name: "Admin",
          },
          {
            id: 2,
            alerte_id: 100,
            action_type: "statut_change",
            description: "Prise en charge",
            effectue_par: 5,
            date_action: new Date("2024-01-15T11:00:00Z"),
            user_name: "Admin",
            alert_status_before: "nouveau",
            alert_status_after: "en_cours",
          },
        ],
        total_actions: 2,
      };
      const result = alertTimelineSchema.safeParse(validTimeline);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alerte_id).toBe(100);
        expect(result.data.entries.length).toBe(2);
        expect(result.data.total_actions).toBe(2);
      }
    });

    it("devrait valider avec une timeline vide", () => {
      const validTimeline = {
        alerte_id: 100,
        entries: [],
        total_actions: 0,
      };
      const result = alertTimelineSchema.safeParse(validTimeline);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries.length).toBe(0);
        expect(result.data.total_actions).toBe(0);
      }
    });

    it("devrait valider avec une seule entrée", () => {
      const validTimeline = {
        alerte_id: 100,
        entries: [
          {
            id: 1,
            alerte_id: 100,
            action_type: "autre",
            description: "Action unique",
            effectue_par: 5,
            date_action: new Date("2024-01-15T10:30:00Z"),
          },
        ],
        total_actions: 1,
      };
      const result = alertTimelineSchema.safeParse(validTimeline);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries.length).toBe(1);
        expect(result.data.total_actions).toBe(1);
      }
    });

    it("devrait valider avec de nombreuses entrées", () => {
      const entries = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        alerte_id: 100,
        action_type: "information_mise_a_jour" as const,
        description: `Action ${i + 1}`,
        effectue_par: 5,
        date_action: new Date("2024-01-15T10:30:00Z"),
      }));
      const validTimeline = {
        alerte_id: 100,
        entries: entries,
        total_actions: 50,
      };
      const result = alertTimelineSchema.safeParse(validTimeline);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries.length).toBe(50);
        expect(result.data.total_actions).toBe(50);
      }
    });

    it("devrait rejeter si alerte_id est manquant", () => {
      const invalidTimeline = {
        entries: [],
        total_actions: 0,
      };
      const result = alertTimelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si entries est manquant", () => {
      const invalidTimeline = {
        alerte_id: 100,
        total_actions: 0,
      };
      const result = alertTimelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_actions est manquant", () => {
      const invalidTimeline = {
        alerte_id: 100,
        entries: [],
      };
      const result = alertTimelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est 0", () => {
      const invalidTimeline = {
        alerte_id: 0,
        entries: [],
        total_actions: 0,
      };
      const result = alertTimelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si alerte_id est négatif", () => {
      const invalidTimeline = {
        alerte_id: -100,
        entries: [],
        total_actions: 0,
      };
      const result = alertTimelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_actions est négatif", () => {
      const invalidTimeline = {
        alerte_id: 100,
        entries: [],
        total_actions: -1,
      };
      const result = alertTimelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si entries n'est pas un array", () => {
      const invalidTimeline = {
        alerte_id: 100,
        entries: "not an array",
        total_actions: 0,
      };
      const result = alertTimelineSchema.safeParse(invalidTimeline);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Type Inference
  // ============================================================================

  describe("Type Inference", () => {
    it("devrait inférer correctement le type AlertAction", () => {
      const action: AlertAction = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date(),
      };
      expect(action.id).toBe(1);
    });

    it("devrait inférer correctement le type CreateAlertAction", () => {
      const create: CreateAlertAction = {
        alerte_id: 100,
        action_type: "paiement_recu",
        description: "Test",
        effectue_par: 5,
      };
      expect(create.alerte_id).toBe(100);
    });

    it("devrait inférer correctement le type ListAlertActionsQuery", () => {
      const query: ListAlertActionsQuery = {
        page: 1,
        limit: 20,
        alerte_id: 100,
        action_type: "statut_change",
        sort_by: "date_action",
        sort_order: "desc",
      };
      expect(query.page).toBe(1);
    });

    it("devrait inférer correctement le type AlertHistoryQuery", () => {
      const query: AlertHistoryQuery = {
        alerte_id: 100,
        page: 1,
        page_size: 20,
        sort_order: "asc",
      };
      expect(query.alerte_id).toBe(100);
    });

    it("devrait inférer correctement le type ActionsByTypeQuery", () => {
      const query: ActionsByTypeQuery = {
        action_type: "information_mise_a_jour",
        alerte_id: 100,
      };
      expect(query.action_type).toBe("information_mise_a_jour");
    });

    it("devrait inférer correctement le type ActionsByUserQuery", () => {
      const query: ActionsByUserQuery = {
        page: 1,
        limit: 20,
        effectue_par: 5,
        action_type: "autre",
        sort_by: "date_action",
        sort_order: "desc",
      };
      expect(query.effectue_par).toBe(5);
    });

    it("devrait inférer correctement le type AlertActionIdParam", () => {
      const param: AlertActionIdParam = {
        id: 1,
      };
      expect(param.id).toBe(1);
    });

    it("devrait inférer correctement le type AlertIdParam", () => {
      const param: AlertIdParam = {
        alerte_id: 100,
      };
      expect(param.alerte_id).toBe(100);
    });

    it("devrait inférer correctement le type AlertActionResponse", () => {
      const response: AlertActionResponse = {
        id: 1,
        alerte_id: 100,
        action_type: "message_envoye",
        description: "Test",
        effectue_par: 5,
        date_action: new Date(),
      };
      expect(response.id).toBe(1);
    });

    it("devrait inférer correctement le type AlertActionsListResponse", () => {
      const response: AlertActionsListResponse = {
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

    it("devrait inférer correctement le type AlertActionStats", () => {
      const stats: AlertActionStats = {
        total: 100,
        by_type: {
          message_envoye: 30,
          information_mise_a_jour: 25,
          paiement_recu: 20,
          statut_change: 15,
          autre: 10,
        },
        by_user: {
          "1": 50,
        },
        recent_actions: [],
      };
      expect(stats.total).toBe(100);
    });

    it("devrait inférer correctement le type AlertTimelineEntry", () => {
      const entry: AlertTimelineEntry = {
        id: 1,
        alerte_id: 100,
        action_type: "statut_change",
        description: "Test",
        effectue_par: 5,
        date_action: new Date(),
        user_name: "Test User",
        alert_status_before: "ancien",
        alert_status_after: "nouveau",
      };
      expect(entry.user_name).toBe("Test User");
    });

    it("devrait inférer correctement le type AlertTimeline", () => {
      const timeline: AlertTimeline = {
        alerte_id: 100,
        entries: [],
        total_actions: 0,
      };
      expect(timeline.alerte_id).toBe(100);
    });
  });
});
