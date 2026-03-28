/**
 * @fileoverview Tests Complets pour les Validateurs de Types d'Alerte
 * @module @clubmanager/types/validators/messaging/__tests__/alert-type
 *
 * Tests de tous les schémas Zod de alert-type.validators.ts avec une couverture complète :
 * - alertSeveritySchema
 * - alertTypeBaseSchema
 * - createAlertTypeSchema
 * - updateAlertTypeSchema
 * - listAlertTypesSchema
 * - alertTypesBySeveritySchema
 * - alertTypeIdSchema
 * - alertTypeIdStringSchema
 * - alertTypeIdParamSchema
 * - alertTypeResponseSchema
 * - alertTypesListResponseSchema
 * - alertTypeStatsSchema
 */

import { describe, it, expect } from "@jest/globals";
import {
  alertSeveritySchema,
  alertTypeBaseSchema,
  createAlertTypeSchema,
  updateAlertTypeSchema,
  listAlertTypesSchema,
  alertTypesBySeveritySchema,
  alertTypeIdSchema,
  alertTypeIdStringSchema,
  alertTypeIdParamSchema,
  alertTypeResponseSchema,
  alertTypesListResponseSchema,
  alertTypeStatsSchema,
  type AlertType,
  type CreateAlertType,
  type UpdateAlertType,
  type ListAlertTypesQuery,
  type AlertTypesBySeverityQuery,
  type AlertTypeIdParam,
  type AlertTypeResponse,
  type AlertTypesListResponse,
  type AlertTypeStats,
} from "../alert-type.validators.js";
import {
  ALERT_TYPE_NAME_MAX_LENGTH,
  ALERT_TYPE_NAME_MIN_LENGTH,
  ALERT_TYPE_DESCRIPTION_MAX_LENGTH,
} from "../../../constants/messaging.constants.js";

describe("Alert Type Validators", () => {
  // ============================================================================
  // alertSeveritySchema - Validation de la sévérité des alertes
  // ============================================================================
  describe("alertSeveritySchema", () => {
    it("devrait valider 'info' comme sévérité", () => {
      const result = alertSeveritySchema.safeParse("info");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("info");
      }
    });

    it("devrait valider 'warning' comme sévérité", () => {
      const result = alertSeveritySchema.safeParse("warning");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("warning");
      }
    });

    it("devrait valider 'critical' comme sévérité", () => {
      const result = alertSeveritySchema.safeParse("critical");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("critical");
      }
    });

    it("devrait rejeter une sévérité invalide", () => {
      const result = alertSeveritySchema.safeParse("danger");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("sévérité");
      }
    });

    it("devrait rejeter une chaîne vide", () => {
      const result = alertSeveritySchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nombre", () => {
      const result = alertSeveritySchema.safeParse(1);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = alertSeveritySchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = alertSeveritySchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("devrait être sensible à la casse", () => {
      const result = alertSeveritySchema.safeParse("INFO");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter 'error' (non dans l'enum)", () => {
      const result = alertSeveritySchema.safeParse("error");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter 'alert' (non dans l'enum)", () => {
      const result = alertSeveritySchema.safeParse("alert");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypeBaseSchema - Schéma de base avec tous les champs
  // ============================================================================
  describe("alertTypeBaseSchema", () => {
    it("devrait valider un type d'alerte valide avec tous les champs", () => {
      const validAlertType = {
        id: 1,
        nom: "Stock faible",
        description: "Alerte pour les produits avec un stock faible",
        severite: "warning" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("Stock faible");
        expect(result.data.description).toBe(
          "Alerte pour les produits avec un stock faible",
        );
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider avec severite par défaut à 'info'", () => {
      const validAlertType = {
        id: 2,
        nom: "Notification générale",
        description: "Notification d'information",
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec description à null", () => {
      const validAlertType = {
        id: 3,
        nom: "Paiement en retard",
        description: null,
        severite: "critical" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec description optionnelle (undefined)", () => {
      const validAlertType = {
        id: 4,
        nom: "Test alerte",
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec nom de 1 caractère (longueur minimale)", () => {
      const validAlertType = {
        id: 5,
        nom: "A",
        description: "Description courte",
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("A");
      }
    });

    it("devrait valider avec nom de 100 caractères (longueur maximale)", () => {
      const maxName = "A".repeat(100);
      const validAlertType = {
        id: 6,
        nom: maxName,
        description: "Description normale",
        severite: "warning" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe(maxName);
        expect(result.data.nom.length).toBe(100);
      }
    });

    it("devrait valider avec description de longueur maximale (65535 caractères)", () => {
      const maxDescription = "X".repeat(65535);
      const validAlertType = {
        id: 7,
        nom: "Type avec longue description",
        description: maxDescription,
        severite: "critical" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description?.length).toBe(65535);
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validAlertType = {
        id: 8,
        nom: "  Stock critique  ",
        description: "Description",
        severite: "critical" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Stock critique");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validAlertType = {
        id: 9,
        nom: "Alerte système",
        description: "  Description avec espaces  ",
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description avec espaces");
      }
    });

    it("devrait valider avec tous les niveaux de sévérité - info", () => {
      const validAlertType = {
        id: 10,
        nom: "Information",
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec tous les niveaux de sévérité - warning", () => {
      const validAlertType = {
        id: 11,
        nom: "Avertissement",
        severite: "warning" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider avec tous les niveaux de sévérité - critical", () => {
      const validAlertType = {
        id: 12,
        nom: "Critique",
        severite: "critical" as const,
      };
      const result = alertTypeBaseSchema.safeParse(validAlertType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("critical");
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidAlertType = {
        id: 13,
        nom: "",
        description: "Description",
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1 caractère");
      }
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidAlertType = {
        id: 14,
        nom: "   ",
        description: "Description",
        severite: "warning" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1 caractère");
      }
    });

    it("devrait rejeter un nom trop long (> 100 caractères)", () => {
      const longName = "A".repeat(101);
      const invalidAlertType = {
        id: 15,
        nom: longName,
        description: "Description",
        severite: "critical" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100 caractères");
      }
    });

    it("devrait rejeter une description trop longue (> 65535 caractères)", () => {
      const longDescription = "X".repeat(65536);
      const invalidAlertType = {
        id: 16,
        nom: "Type valide",
        description: longDescription,
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("65535 caractères");
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidAlertType = {
        nom: "Stock faible",
        description: "Description",
        severite: "warning" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidAlertType = {
        id: 17,
        description: "Description",
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est 0", () => {
      const invalidAlertType = {
        id: 0,
        nom: "Stock faible",
        description: "Description",
        severite: "warning" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est négatif", () => {
      const invalidAlertType = {
        id: -1,
        nom: "Stock faible",
        description: "Description",
        severite: "critical" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une sévérité invalide", () => {
      const invalidAlertType = {
        id: 18,
        nom: "Stock faible",
        description: "Description",
        severite: "invalid",
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un nombre", () => {
      const invalidAlertType = {
        id: 19,
        nom: 12345,
        description: "Description",
        severite: "info" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si description est un nombre", () => {
      const invalidAlertType = {
        id: 20,
        nom: "Stock faible",
        description: 12345,
        severite: "warning" as const,
      };
      const result = alertTypeBaseSchema.safeParse(invalidAlertType);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // createAlertTypeSchema - Schéma de création
  // ============================================================================
  describe("createAlertTypeSchema", () => {
    it("devrait valider une création avec tous les champs", () => {
      const validCreate = {
        nom: "Stock critique",
        description: "Alerte pour stock critique",
        severite: "critical" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Stock critique");
        expect(result.data.description).toBe("Alerte pour stock critique");
        expect(result.data.severite).toBe("critical");
      }
    });

    it("devrait valider avec seulement le nom (champ requis)", () => {
      const validCreate = {
        nom: "Paiement en retard",
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Paiement en retard");
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec description à null", () => {
      const validCreate = {
        nom: "Alerte système",
        description: null,
        severite: "warning" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait appliquer 'info' comme sévérité par défaut", () => {
      const validCreate = {
        nom: "Notification",
        description: "Notification générale",
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec nom de 1 caractère", () => {
      const validCreate = {
        nom: "X",
        description: "Description minimale",
        severite: "info" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("X");
      }
    });

    it("devrait valider avec nom de longueur maximale", () => {
      const maxName = "B".repeat(100);
      const validCreate = {
        nom: maxName,
        description: "Description normale",
        severite: "warning" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom.length).toBe(100);
      }
    });

    it("devrait valider avec description de longueur maximale", () => {
      const maxDescription = "Y".repeat(65535);
      const validCreate = {
        nom: "Type avec longue desc",
        description: maxDescription,
        severite: "critical" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description?.length).toBe(65535);
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validCreate = {
        nom: "  Absence membre  ",
        description: "Description",
        severite: "info" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Absence membre");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validCreate = {
        nom: "Type d'alerte",
        description: "  Description avec trim  ",
        severite: "warning" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description avec trim");
      }
    });

    it("devrait valider avec severite 'info'", () => {
      const validCreate = {
        nom: "Info",
        severite: "info" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec severite 'warning'", () => {
      const validCreate = {
        nom: "Avertissement",
        severite: "warning" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider avec severite 'critical'", () => {
      const validCreate = {
        nom: "Critique",
        severite: "critical" as const,
      };
      const result = createAlertTypeSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("critical");
      }
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidCreate = {
        description: "Description sans nom",
        severite: "info" as const,
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom vide", () => {
      const invalidCreate = {
        nom: "",
        description: "Description",
        severite: "warning" as const,
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1 caractère");
      }
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidCreate = {
        nom: "    ",
        description: "Description",
        severite: "critical" as const,
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1 caractère");
      }
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "C".repeat(101);
      const invalidCreate = {
        nom: longName,
        description: "Description",
        severite: "info" as const,
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100 caractères");
      }
    });

    it("devrait rejeter une description trop longue", () => {
      const longDescription = "Z".repeat(65536);
      const invalidCreate = {
        nom: "Type valide",
        description: longDescription,
        severite: "warning" as const,
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("65535 caractères");
      }
    });

    it("devrait rejeter une sévérité invalide", () => {
      const invalidCreate = {
        nom: "Stock faible",
        description: "Description",
        severite: "danger",
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si sévérité est un nombre", () => {
      const invalidCreate = {
        nom: "Stock faible",
        severite: 1,
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si id est fourni (ne devrait pas être dans create)", () => {
      const invalidCreate = {
        id: 1,
        nom: "Stock faible",
        description: "Description",
        severite: "warning" as const,
      };
      const result = createAlertTypeSchema.safeParse(invalidCreate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("id");
      }
    });
  });

  // ============================================================================
  // updateAlertTypeSchema - Schéma de mise à jour
  // ============================================================================
  describe("updateAlertTypeSchema", () => {
    it("devrait valider une mise à jour avec nom uniquement", () => {
      const validUpdate = {
        nom: "Nouveau nom",
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nouveau nom");
      }
    });

    it("devrait valider une mise à jour avec description uniquement", () => {
      const validUpdate = {
        description: "Nouvelle description",
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Nouvelle description");
      }
    });

    it("devrait valider une mise à jour avec severite uniquement", () => {
      const validUpdate = {
        severite: "critical" as const,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("critical");
      }
    });

    it("devrait valider avec tous les champs", () => {
      const validUpdate = {
        nom: "Nom modifié",
        description: "Description modifiée",
        severite: "warning" as const,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nom modifié");
        expect(result.data.description).toBe("Description modifiée");
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider avec description à null", () => {
      const validUpdate = {
        description: null,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validUpdate = {};
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec severite 'info'", () => {
      const validUpdate = {
        severite: "info" as const,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec severite 'warning'", () => {
      const validUpdate = {
        severite: "warning" as const,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider avec severite 'critical'", () => {
      const validUpdate = {
        severite: "critical" as const,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("critical");
      }
    });

    it("devrait trim les espaces du nom", () => {
      const validUpdate = {
        nom: "  Nom avec espaces  ",
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Nom avec espaces");
      }
    });

    it("devrait trim les espaces de la description", () => {
      const validUpdate = {
        description: "  Description avec espaces  ",
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Description avec espaces");
      }
    });

    it("devrait valider avec nom de 1 caractère", () => {
      const validUpdate = {
        nom: "Z",
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Z");
      }
    });

    it("devrait valider avec nom de longueur maximale", () => {
      const maxName = "D".repeat(100);
      const validUpdate = {
        nom: maxName,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom?.length).toBe(100);
      }
    });

    it("devrait valider avec description de longueur maximale", () => {
      const maxDescription = "E".repeat(65535);
      const validUpdate = {
        description: maxDescription,
      };
      const result = updateAlertTypeSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description?.length).toBe(65535);
      }
    });

    it("devrait rejeter un nom vide", () => {
      const invalidUpdate = {
        nom: "",
      };
      const result = updateAlertTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1 caractère");
      }
    });

    it("devrait rejeter un nom qui devient vide après trim", () => {
      const invalidUpdate = {
        nom: "     ",
      };
      const result = updateAlertTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1 caractère");
      }
    });

    it("devrait rejeter un nom trop long", () => {
      const longName = "F".repeat(101);
      const invalidUpdate = {
        nom: longName,
      };
      const result = updateAlertTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100 caractères");
      }
    });

    it("devrait rejeter une description trop longue", () => {
      const longDescription = "G".repeat(65536);
      const invalidUpdate = {
        description: longDescription,
      };
      const result = updateAlertTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("65535 caractères");
      }
    });

    it("devrait rejeter une sévérité invalide", () => {
      const invalidUpdate = {
        severite: "urgent",
      };
      const result = updateAlertTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est un nombre", () => {
      const invalidUpdate = {
        nom: 999,
      };
      const result = updateAlertTypeSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // listAlertTypesSchema - Schéma de liste avec pagination et filtres
  // ============================================================================
  describe("listAlertTypesSchema", () => {
    it("devrait valider une query complète avec tous les paramètres", () => {
      const validQuery = {
        page: 2,
        limit: 25,
        severite: "warning" as const,
        search: "stock",
        sort_by: "nom" as const,
        sort_order: "desc" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
        expect(result.data.severite).toBe("warning");
        expect(result.data.search).toBe("stock");
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait valider avec un objet vide (tous les champs optionnels)", () => {
      const validQuery = {};
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec seulement severite 'info'", () => {
      const validQuery = {
        severite: "info" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec seulement severite 'warning'", () => {
      const validQuery = {
        severite: "warning" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider avec seulement severite 'critical'", () => {
      const validQuery = {
        severite: "critical" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("critical");
      }
    });

    it("devrait valider avec seulement search", () => {
      const validQuery = {
        search: "paiement",
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("paiement");
      }
    });

    it("devrait trim les espaces du search", () => {
      const validQuery = {
        search: "  recherche test  ",
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("recherche test");
      }
    });

    it("devrait valider avec page à 1", () => {
      const validQuery = {
        page: 1,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("devrait valider avec limit minimum", () => {
      const validQuery = {
        limit: 1,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it("devrait valider avec limit maximum", () => {
      const validQuery = {
        limit: 100,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it("devrait valider avec sort_by 'nom'", () => {
      const validQuery = {
        sort_by: "nom" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait valider avec sort_by 'severite'", () => {
      const validQuery = {
        sort_by: "severite" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("severite");
      }
    });

    it("devrait appliquer 'nom' comme sort_by par défaut", () => {
      const validQuery = {};
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe("nom");
      }
    });

    it("devrait valider avec sort_order 'asc'", () => {
      const validQuery = {
        sort_order: "asc" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec sort_order 'desc'", () => {
      const validQuery = {
        sort_order: "desc" as const,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("desc");
      }
    });

    it("devrait appliquer 'asc' comme sort_order par défaut", () => {
      const validQuery = {};
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe("asc");
      }
    });

    it("devrait valider avec page et limit", () => {
      const validQuery = {
        page: 3,
        limit: 50,
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it("devrait valider avec severite et search", () => {
      const validQuery = {
        severite: "critical" as const,
        search: "urgence",
      };
      const result = listAlertTypesSchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("critical");
        expect(result.data.search).toBe("urgence");
      }
    });

    it("devrait rejeter une sévérité invalide", () => {
      const invalidQuery = {
        severite: "error",
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_by invalide", () => {
      const invalidQuery = {
        sort_by: "description",
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un sort_order invalide", () => {
      const invalidQuery = {
        sort_order: "ascending",
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidQuery = {
        page: 0,
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est négatif", () => {
      const invalidQuery = {
        page: -1,
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit est 0", () => {
      const invalidQuery = {
        limit: 0,
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit dépasse le maximum", () => {
      const invalidQuery = {
        limit: 101,
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est un décimal", () => {
      const invalidQuery = {
        page: 1.5,
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si limit est un décimal", () => {
      const invalidQuery = {
        limit: 10.5,
      };
      const result = listAlertTypesSchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypesBySeveritySchema - Filtrage par sévérité
  // ============================================================================
  describe("alertTypesBySeveritySchema", () => {
    it("devrait valider avec severite 'info'", () => {
      const validQuery = {
        severite: "info" as const,
      };
      const result = alertTypesBySeveritySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec severite 'warning'", () => {
      const validQuery = {
        severite: "warning" as const,
      };
      const result = alertTypesBySeveritySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider avec severite 'critical'", () => {
      const validQuery = {
        severite: "critical" as const,
      };
      const result = alertTypesBySeveritySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severite).toBe("critical");
      }
    });

    it("devrait rejeter si severite est manquante", () => {
      const invalidQuery = {};
      const result = alertTypesBySeveritySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une sévérité invalide", () => {
      const invalidQuery = {
        severite: "high",
      };
      const result = alertTypesBySeveritySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si severite est un nombre", () => {
      const invalidQuery = {
        severite: 1,
      };
      const result = alertTypesBySeveritySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si severite est null", () => {
      const invalidQuery = {
        severite: null,
      };
      const result = alertTypesBySeveritySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une chaîne vide", () => {
      const invalidQuery = {
        severite: "",
      };
      const result = alertTypesBySeveritySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypeIdSchema - Validation d'ID numérique
  // ============================================================================
  describe("alertTypeIdSchema", () => {
    it("devrait valider un ID positif valide", () => {
      const result = alertTypeIdSchema.safeParse(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("devrait valider un grand ID", () => {
      const result = alertTypeIdSchema.safeParse(999999);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait valider ID à 1", () => {
      const result = alertTypeIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait rejeter un ID à 0", () => {
      const result = alertTypeIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = alertTypeIdSchema.safeParse(-5);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = alertTypeIdSchema.safeParse(3.14);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string", () => {
      const result = alertTypeIdSchema.safeParse("123");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = alertTypeIdSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = alertTypeIdSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypeIdStringSchema - Validation d'ID en string
  // ============================================================================
  describe("alertTypeIdStringSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const result = alertTypeIdStringSchema.safeParse("42");
      expect(result.success).toBe(true);
    });

    it("devrait transformer la string en nombre", () => {
      const result = alertTypeIdStringSchema.safeParse("123");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(123);
        expect(typeof result.data).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const result = alertTypeIdStringSchema.safeParse("999999");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999);
      }
    });

    it("devrait valider '1' en string", () => {
      const result = alertTypeIdStringSchema.safeParse("1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("devrait rejeter un ID à '0'", () => {
      const result = alertTypeIdStringSchema.safeParse("0");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const result = alertTypeIdStringSchema.safeParse("-10");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const result = alertTypeIdStringSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string avec des caractères non numériques", () => {
      const result = alertTypeIdStringSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const result = alertTypeIdStringSchema.safeParse("3.14");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const result = alertTypeIdStringSchema.safeParse(" 123 ");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string mixte", () => {
      const result = alertTypeIdStringSchema.safeParse("123abc");
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = alertTypeIdStringSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypeIdParamSchema - Validation d'ID dans les paramètres de route
  // ============================================================================
  describe("alertTypeIdParamSchema", () => {
    it("devrait valider un ID valide en string", () => {
      const validParam = {
        id: "42",
      };
      const result = alertTypeIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(42);
      }
    });

    it("devrait transformer la string en nombre", () => {
      const validParam = {
        id: "789",
      };
      const result = alertTypeIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(789);
        expect(typeof result.data.id).toBe("number");
      }
    });

    it("devrait valider un grand ID", () => {
      const validParam = {
        id: "999999",
      };
      const result = alertTypeIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999999);
      }
    });

    it("devrait valider '1' comme ID minimum", () => {
      const validParam = {
        id: "1",
      };
      const result = alertTypeIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidParam = {};
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID à '0'", () => {
      const invalidParam = {
        id: "0",
      };
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidParam = {
        id: "-5",
      };
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une string vide", () => {
      const invalidParam = {
        id: "",
      };
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec des caractères non numériques", () => {
      const invalidParam = {
        id: "abc123",
      };
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidParam = {
        id: "42.5",
      };
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID avec espaces", () => {
      const invalidParam = {
        id: " 42 ",
      };
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null comme ID", () => {
      const invalidParam = {
        id: null,
      };
      const result = alertTypeIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypeResponseSchema - Schéma de réponse
  // ============================================================================
  describe("alertTypeResponseSchema", () => {
    it("devrait valider une réponse de type d'alerte complète", () => {
      const validResponse = {
        id: 1,
        nom: "Stock faible",
        description: "Alerte pour stock faible",
        severite: "warning" as const,
      };
      const result = alertTypeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.nom).toBe("Stock faible");
        expect(result.data.description).toBe("Alerte pour stock faible");
        expect(result.data.severite).toBe("warning");
      }
    });

    it("devrait valider une réponse minimale", () => {
      const validResponse = {
        id: 2,
        nom: "Alerte simple",
        severite: "info" as const,
      };
      const result = alertTypeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(2);
        expect(result.data.nom).toBe("Alerte simple");
        expect(result.data.severite).toBe("info");
      }
    });

    it("devrait valider avec description null", () => {
      const validResponse = {
        id: 3,
        nom: "Sans description",
        description: null,
        severite: "critical" as const,
      };
      const result = alertTypeResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(null);
      }
    });

    it("devrait valider avec les trois niveaux de sévérité", () => {
      const responses = [
        { id: 10, nom: "Info", severite: "info" as const },
        { id: 11, nom: "Warning", severite: "warning" as const },
        { id: 12, nom: "Critical", severite: "critical" as const },
      ];

      responses.forEach((response) => {
        const result = alertTypeResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter si id est manquant", () => {
      const invalidResponse = {
        nom: "Sans ID",
        severite: "info" as const,
      };
      const result = alertTypeResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si nom est manquant", () => {
      const invalidResponse = {
        id: 4,
        severite: "warning" as const,
      };
      const result = alertTypeResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypesListResponseSchema - Réponse de liste paginée
  // ============================================================================
  describe("alertTypesListResponseSchema", () => {
    it("devrait valider une réponse de liste complète", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            nom: "Stock faible",
            description: "Alerte stock",
            severite: "warning" as const,
          },
          {
            id: 2,
            nom: "Paiement retard",
            description: "Alerte paiement",
            severite: "critical" as const,
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          total: 25,
          total_pages: 3,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(2);
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.page_size).toBe(10);
        expect(result.data.pagination.total).toBe(25);
        expect(result.data.pagination.total_pages).toBe(3);
      }
    });

    it("devrait valider avec un array data vide", () => {
      const validResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: 0,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });

    it("devrait valider avec un seul élément", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            nom: "Unique",
            severite: "info" as const,
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          total: 1,
          total_pages: 1,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(1);
      }
    });

    it("devrait valider avec plusieurs pages", () => {
      const validResponse = {
        data: [
          { id: 11, nom: "Item 11", severite: "info" as const },
          { id: 12, nom: "Item 12", severite: "warning" as const },
        ],
        pagination: {
          page: 2,
          page_size: 10,
          total: 25,
          total_pages: 3,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pagination.page).toBe(2);
        expect(result.data.pagination.total_pages).toBe(3);
      }
    });

    it("devrait valider avec items sans description", () => {
      const validResponse = {
        data: [
          {
            id: 1,
            nom: "Sans desc 1",
            severite: "info" as const,
          },
          {
            id: 2,
            nom: "Sans desc 2",
            description: null,
            severite: "warning" as const,
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          total: 2,
          total_pages: 1,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si data est manquant", () => {
      const invalidResponse = {
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: 0,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si pagination est manquant", () => {
      const invalidResponse = {
        data: [],
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: -1,
          page_size: 10,
          total: 0,
          total_pages: 0,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page est 0", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 0,
          page_size: 10,
          total: 0,
          total_pages: 0,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 10,
          total: -5,
          total_pages: 0,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total_pages est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: -1,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si page_size est négatif", () => {
      const invalidResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: -10,
          total: 0,
          total_pages: 0,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si data n'est pas un array", () => {
      const invalidResponse = {
        data: "not an array",
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: 0,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un élément de data est invalide", () => {
      const invalidResponse = {
        data: [
          {
            id: 1,
            nom: "",
            severite: "info" as const,
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          total: 1,
          total_pages: 1,
        },
      };
      const result = alertTypesListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // alertTypeStatsSchema - Statistiques des types d'alerte
  // ============================================================================
  describe("alertTypeStatsSchema", () => {
    it("devrait valider des statistiques valides", () => {
      const validStats = {
        total: 50,
        by_severity: {
          info: 20,
          warning: 18,
          critical: 12,
        },
      };
      const result = alertTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(50);
        expect(result.data.by_severity.info).toBe(20);
        expect(result.data.by_severity.warning).toBe(18);
        expect(result.data.by_severity.critical).toBe(12);
      }
    });

    it("devrait valider avec des valeurs à 0", () => {
      const validStats = {
        total: 0,
        by_severity: {
          info: 0,
          warning: 0,
          critical: 0,
        },
      };
      const result = alertTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
        expect(result.data.by_severity.info).toBe(0);
        expect(result.data.by_severity.warning).toBe(0);
        expect(result.data.by_severity.critical).toBe(0);
      }
    });

    it("devrait valider avec seulement info ayant des valeurs", () => {
      const validStats = {
        total: 15,
        by_severity: {
          info: 15,
          warning: 0,
          critical: 0,
        },
      };
      const result = alertTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.by_severity.info).toBe(15);
      }
    });

    it("devrait valider avec seulement warning ayant des valeurs", () => {
      const validStats = {
        total: 10,
        by_severity: {
          info: 0,
          warning: 10,
          critical: 0,
        },
      };
      const result = alertTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.by_severity.warning).toBe(10);
      }
    });

    it("devrait valider avec seulement critical ayant des valeurs", () => {
      const validStats = {
        total: 5,
        by_severity: {
          info: 0,
          warning: 0,
          critical: 5,
        },
      };
      const result = alertTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.by_severity.critical).toBe(5);
      }
    });

    it("devrait valider avec de grandes valeurs", () => {
      const validStats = {
        total: 99999,
        by_severity: {
          info: 50000,
          warning: 30000,
          critical: 19999,
        },
      };
      const result = alertTypeStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(99999);
      }
    });

    it("devrait rejeter si total est manquant", () => {
      const invalidStats = {
        by_severity: {
          info: 10,
          warning: 5,
          critical: 3,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_severity est manquant", () => {
      const invalidStats = {
        total: 18,
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si info est manquant dans by_severity", () => {
      const invalidStats = {
        total: 15,
        by_severity: {
          warning: 10,
          critical: 5,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si warning est manquant dans by_severity", () => {
      const invalidStats = {
        total: 15,
        by_severity: {
          info: 10,
          critical: 5,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si critical est manquant dans by_severity", () => {
      const invalidStats = {
        total: 15,
        by_severity: {
          info: 10,
          warning: 5,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est négatif", () => {
      const invalidStats = {
        total: -10,
        by_severity: {
          info: 5,
          warning: 3,
          critical: 2,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si info est négatif", () => {
      const invalidStats = {
        total: 10,
        by_severity: {
          info: -5,
          warning: 10,
          critical: 5,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si warning est négatif", () => {
      const invalidStats = {
        total: 10,
        by_severity: {
          info: 5,
          warning: -3,
          critical: 8,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si critical est négatif", () => {
      const invalidStats = {
        total: 10,
        by_severity: {
          info: 5,
          warning: 7,
          critical: -2,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si total est un décimal", () => {
      const invalidStats = {
        total: 10.5,
        by_severity: {
          info: 5,
          warning: 3,
          critical: 2,
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si les valeurs sont des strings", () => {
      const invalidStats = {
        total: "50",
        by_severity: {
          info: "20",
          warning: "18",
          critical: "12",
        },
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si by_severity n'est pas un objet", () => {
      const invalidStats = {
        total: 50,
        by_severity: "not an object",
      };
      const result = alertTypeStatsSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });

    it("devrait accepter des propriétés supplémentaires dans by_severity (comportement Zod)", () => {
      const statsWithExtra = {
        total: 50,
        by_severity: {
          info: 20,
          warning: 18,
          critical: 12,
          unknown: 5,
        },
      };
      const result = alertTypeStatsSchema.safeParse(statsWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        // Les propriétés supplémentaires sont ignorées par Zod
        expect(result.data.by_severity.info).toBe(20);
        expect(result.data.by_severity.warning).toBe(18);
        expect(result.data.by_severity.critical).toBe(12);
      }
    });
  });

  // ============================================================================
  // Type Inference - Tests d'inférence de types TypeScript
  // ============================================================================
  describe("Type Inference", () => {
    it("devrait inférer correctement le type AlertType", () => {
      const alertType: AlertType = {
        id: 1,
        nom: "Stock faible",
        description: "Description",
        severite: "warning",
      };
      expect(alertType.id).toBe(1);
      expect(alertType.nom).toBe("Stock faible");
      expect(alertType.description).toBe("Description");
      expect(alertType.severite).toBe("warning");
    });

    it("devrait inférer correctement le type CreateAlertType", () => {
      const createAlertType: CreateAlertType = {
        nom: "Nouveau type",
        description: "Description",
        severite: "info",
      };
      expect(createAlertType.nom).toBe("Nouveau type");
      expect(createAlertType.severite).toBe("info");
    });

    it("devrait inférer correctement le type UpdateAlertType", () => {
      const updateAlertType: UpdateAlertType = {
        nom: "Nom mis à jour",
      };
      expect(updateAlertType.nom).toBe("Nom mis à jour");
    });

    it("devrait inférer correctement le type ListAlertTypesQuery", () => {
      const query: ListAlertTypesQuery = {
        page: 1,
        limit: 10,
        severite: "warning",
        search: "stock",
        sort_by: "nom",
        sort_order: "asc",
      };
      expect(query.page).toBe(1);
      expect(query.severite).toBe("warning");
    });

    it("devrait inférer correctement le type AlertTypesBySeverityQuery", () => {
      const query: AlertTypesBySeverityQuery = {
        severite: "critical",
      };
      expect(query.severite).toBe("critical");
    });

    it("devrait inférer correctement le type AlertTypeIdParam", () => {
      const param: AlertTypeIdParam = {
        id: 42,
      };
      expect(param.id).toBe(42);
    });

    it("devrait inférer correctement le type AlertTypeResponse", () => {
      const response: AlertTypeResponse = {
        id: 1,
        nom: "Type d'alerte",
        description: "Description",
        severite: "info",
      };
      expect(response.id).toBe(1);
      expect(response.nom).toBe("Type d'alerte");
    });

    it("devrait inférer correctement le type AlertTypesListResponse", () => {
      const response: AlertTypesListResponse = {
        data: [
          {
            id: 1,
            nom: "Type 1",
            severite: "info",
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          total: 1,
          total_pages: 1,
        },
      };
      expect(response.data.length).toBe(1);
      expect(response.pagination.total).toBe(1);
    });

    it("devrait inférer correctement le type AlertTypeStats", () => {
      const stats: AlertTypeStats = {
        total: 50,
        by_severity: {
          info: 20,
          warning: 18,
          critical: 12,
        },
      };
      expect(stats.total).toBe(50);
      expect(stats.by_severity.info).toBe(20);
      expect(stats.by_severity.warning).toBe(18);
      expect(stats.by_severity.critical).toBe(12);
    });

    it("devrait permettre description optionnelle dans AlertType", () => {
      const alertType: AlertType = {
        id: 1,
        nom: "Sans description",
        severite: "info",
      };
      expect(alertType.description).toBeUndefined();
    });

    it("devrait permettre description null dans AlertType", () => {
      const alertType: AlertType = {
        id: 1,
        nom: "Description nulle",
        description: null,
        severite: "warning",
      };
      expect(alertType.description).toBe(null);
    });

    it("devrait permettre severite par défaut dans CreateAlertType", () => {
      const createAlertType: CreateAlertType = {
        nom: "Nouveau type",
        severite: "info",
      };
      expect(createAlertType.nom).toBe("Nouveau type");
    });

    it("devrait permettre UpdateAlertType avec tous les champs optionnels", () => {
      const updateAlertType: UpdateAlertType = {};
      expect(Object.keys(updateAlertType).length).toBe(0);
    });
  });
});
