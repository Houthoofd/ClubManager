/**
 * Tests pour les validators de grades
 */

import { describe, it, expect } from "@jest/globals";
import {
  gradeBaseSchema,
  createGradeSchema,
  updateGradeSchema,
  listGradesSchema,
  gradesByOrderRangeSchema,
  gradeIdSchema,
  gradeIdStringSchema,
  gradeIdParamSchema,
} from "../grade.validators.js";

describe("Grade Validators", () => {
  describe("gradeBaseSchema", () => {
    it("devrait valider un grade valide", () => {
      const data = { id: 1, nom: "Blanche", ordre: 0, couleur: "#FFFFFF" };
      expect(() => gradeBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait valider sans couleur", () => {
      const data = { id: 1, nom: "Bleue", ordre: 1, couleur: null };
      expect(() => gradeBaseSchema.parse(data)).not.toThrow();
    });

    it("devrait utiliser ordre par défaut", () => {
      const data = { id: 1, nom: "Noire" };
      const result = gradeBaseSchema.parse(data);
      expect(result.ordre).toBe(0);
    });

    it("devrait trim les espaces", () => {
      const data = { id: 1, nom: "  Violette  ", ordre: 2, couleur: "  #800080  " };
      const result = gradeBaseSchema.parse(data);
      expect(result.nom).toBe("Violette");
      expect(result.couleur).toBe("#800080");
    });

    it("devrait rejeter nom vide", () => {
      const data = { id: 1, nom: "", ordre: 0 };
      expect(() => gradeBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter ordre négatif", () => {
      const data = { id: 1, nom: "Test", ordre: -1 };
      expect(() => gradeBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter ordre trop grand", () => {
      const data = { id: 1, nom: "Test", ordre: 101 };
      expect(() => gradeBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter ordre décimal", () => {
      const data = { id: 1, nom: "Test", ordre: 1.5 };
      expect(() => gradeBaseSchema.parse(data)).toThrow();
    });

    it("devrait rejeter couleur trop longue", () => {
      const data = { id: 1, nom: "Test", ordre: 0, couleur: "a".repeat(21) };
      expect(() => gradeBaseSchema.parse(data)).toThrow();
    });
  });

  describe("createGradeSchema", () => {
    it("devrait valider création valide", () => {
      const data = { nom: "Marron", ordre: 3, couleur: "#8B4513" };
      expect(() => createGradeSchema.parse(data)).not.toThrow();
    });
  });

  describe("updateGradeSchema", () => {
    it("devrait valider update partiel", () => {
      const data = { ordre: 5 };
      expect(() => updateGradeSchema.parse(data)).not.toThrow();
    });

    it("devrait valider objet vide", () => {
      const data = {};
      expect(() => updateGradeSchema.parse(data)).not.toThrow();
    });
  });

  describe("listGradesSchema", () => {
    it("devrait valider avec filtres", () => {
      const data = {
        ordre_min: 0,
        ordre_max: 4,
        couleur: "#000000",
        page: 1,
        limit: 10,
      };
      expect(() => listGradesSchema.parse(data)).not.toThrow();
    });

    it("devrait utiliser sort par ordre par défaut", () => {
      const data = { page: 1, limit: 10 };
      const result = listGradesSchema.parse(data);
      expect(result.sort_by).toBe("ordre");
    });
  });

  describe("gradesByOrderRangeSchema", () => {
    it("devrait valider plage valide", () => {
      const data = { ordre_min: 0, ordre_max: 4 };
      expect(() => gradesByOrderRangeSchema.parse(data)).not.toThrow();
    });

    it("devrait rejeter max < min", () => {
      const data = { ordre_min: 4, ordre_max: 0 };
      expect(() => gradesByOrderRangeSchema.parse(data)).toThrow();
    });
  });

  describe("gradeIdStringSchema", () => {
    it("devrait transformer string en number", () => {
      const result = gradeIdStringSchema.parse("3");
      expect(result).toBe(3);
    });

    it("devrait rejeter 0", () => {
      expect(() => gradeIdStringSchema.parse("0")).toThrow();
    });
  });
});
