/**
 * Tests pour les validators de status
 */

import { describe, it, expect } from "@jest/globals";
import {
  statusBaseSchema,
  createStatusSchema,
  updateStatusSchema,
  listStatusesSchema,
  statusIdSchema,
  statusIdStringSchema,
  statusIdParamSchema,
} from "../status.validators.js";

describe("Status Validators", () => {
  describe("statusBaseSchema", () => {
    it("devrait valider un status valide", () => {
      const data = { id: 1, nom: "Actif", description: "Utilisateur actif" };
      expect(() => statusBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait valider sans description", () => {
      const data = { id: 1, nom: "Inactif", description: null };
      expect(() => statusBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait trim les espaces", () => {
      const data = {
        id: 1,
        nom: "  Suspendu  ",
        description: "  Temporairement suspendu  ",
      };
      const result = statusBaseSchema.parse(data);
      expect(result.nom).toBe("Suspendu");
      expect(result.description).toBe("Temporairement suspendu");
    });

    it("devrait rejeter nom vide", () => {
      const data = { id: 1, nom: "" };
      expect(() => statusBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter nom trop long", () => {
      const data = { id: 1, nom: "a".repeat(51) };
      expect(() => statusBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter description trop longue", () => {
      const data = { id: 1, nom: "Test", description: "a".repeat(65536) };
      expect(() => statusBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter ID invalide", () => {
      const data = { id: 0, nom: "Test" };
      expect(() => statusBaseSchema.parse(data)).toThrow();
    });
  });

  describe("createStatusSchema", () => {
    it("devrait valider création valide", () => {
      const data = { nom: "En attente", description: "En attente de validation" };
      expect(() => createStatusSchema.parse(data)).not.toThrow();
    });

    it("devrait valider sans description", () => {
      const data = { nom: "Archivé" };
      expect(() => createStatusSchema.parse(data)).not.toThrow();
    });
  });

  describe("updateStatusSchema", () => {
    it("devrait valider update partiel", () => {
      const data = { description: "Nouvelle description" };
      expect(() => updateStatusSchema.parse(data)).not.toThrow();
    });

    it("devrait valider objet vide", () => {
      const data = {};
      expect(() => updateStatusSchema.parse(data)).not.toThrow();
    });
  });

  describe("listStatusesSchema", () => {
    it("devrait valider avec filtres", () => {
      const data = {
        search: "actif",
        has_description: "true",
        page: 1,
        limit: 10,
      };
      expect(() => listStatusesSchema.parse(data)).not.toThrow();
    });

    it("devrait transformer has_description string en boolean", () => {
      const data1 = { has_description: "true", page: 1, limit: 10 };
      const result1 = listStatusesSchema.parse(data1);
      expect(result1.has_description).toBe(true);

      const data2 = { has_description: "1", page: 1, limit: 10 };
      const result2 = listStatusesSchema.parse(data2);
      expect(result2.has_description).toBe(true);

      const data3 = { has_description: "false", page: 1, limit: 10 };
      const result3 = listStatusesSchema.parse(data3);
      expect(result3.has_description).toBe(false);
    });
  });

  describe("statusIdStringSchema", () => {
    it("devrait transformer string en number", () => {
      const result = statusIdStringSchema.parse("2");
      expect(result).toBe(2);
      expect(typeof result).toBe("number");
    });

    it("devrait rejeter 0", () => {
      expect(() => statusIdStringSchema.parse("0")).toThrow();
    });

    it("devrait rejeter nombre négatif", () => {
      expect(() => statusIdStringSchema.parse("-5")).toThrow();
    });
  });

  describe("statusIdParamSchema", () => {
    it("devrait valider ID param valide", () => {
      const data = { id: "3" };
      const result = statusIdParamSchema.parse(data);
      expect(result.id).toBe(3);
    });
  });
});
