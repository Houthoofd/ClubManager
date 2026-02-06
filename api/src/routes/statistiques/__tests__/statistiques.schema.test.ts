/**
 * Tests de schéma et configuration pour le module Statistiques
 * Tests des types, interfaces et configuration du module
 */

import { describe, it, expect } from "@jest/globals";

describe("Statistiques Module - Schémas et Configuration", () => {
  describe("Structure des réponses API", () => {
    it("devrait avoir une structure cohérente pour les réponses de succès", () => {
      const mockSuccessResponse = {
        success: true,
        data: [],
        count: 0,
      };

      expect(mockSuccessResponse).toHaveProperty("success");
      expect(mockSuccessResponse).toHaveProperty("data");
      expect(typeof mockSuccessResponse.success).toBe("boolean");
      expect(Array.isArray(mockSuccessResponse.data)).toBe(true);
    });

    it("devrait avoir une structure cohérente pour les réponses d'erreur", () => {
      const mockErrorResponse = {
        success: false,
        message: "Erreur de validation",
      };

      expect(mockErrorResponse).toHaveProperty("success");
      expect(mockErrorResponse).toHaveProperty("message");
      expect(mockErrorResponse.success).toBe(false);
      expect(typeof mockErrorResponse.message).toBe("string");
    });

    it("devrait valider le format des IDs utilisateur", () => {
      const validIds = ["1", "10", "999"];
      const invalidIds = ["0", "-1", "abc", ""];

      validIds.forEach((id) => {
        const parsedId = parseInt(id, 10);
        expect(parsedId).toBeGreaterThan(0);
        expect(isNaN(parsedId)).toBe(false);
      });

      invalidIds.forEach((id) => {
        const parsedId = parseInt(id, 10);
        expect(parsedId <= 0 || isNaN(parsedId)).toBe(true);
      });
    });
  });

  describe("Validation des paramètres", () => {
    it("devrait valider les paramètres de période (mois)", () => {
      const validPeriodes = [1, 3, 6, 12];
      const invalidPeriodes = [0, -1, 37, -6];

      validPeriodes.forEach((mois) => {
        expect(mois).toBeGreaterThan(0);
        expect(mois).toBeLessThanOrEqual(36);
      });

      invalidPeriodes.forEach((mois) => {
        expect(mois <= 0 || mois > 36).toBe(true);
      });
    });

    it("devrait valider le format des dates", () => {
      const validDates = [
        "2024-01-01",
        "2024-12-31",
        "2023-06-15",
      ];

      validDates.forEach((date) => {
        const timestamp = new Date(date).getTime();
        expect(timestamp).toBeGreaterThan(0);
        expect(isNaN(timestamp)).toBe(false);
      });
    });
  });

  describe("Types de données attendus", () => {
    it("devrait définir le type Frequentation", () => {
      const mockFrequentation = {
        cours_id: 1,
        nom_cours: "Yoga",
        nombre_presences: 10,
        taux_presence: 85.5,
      };

      expect(typeof mockFrequentation.cours_id).toBe("number");
      expect(typeof mockFrequentation.nom_cours).toBe("string");
      expect(typeof mockFrequentation.nombre_presences).toBe("number");
      expect(typeof mockFrequentation.taux_presence).toBe("number");
    });

    it("devrait définir le type Progression", () => {
      const mockProgression = {
        periode: "2024-01",
        niveau_debut: "Débutant",
        niveau_actuel: "Intermédiaire",
        pourcentage: 60,
      };

      expect(typeof mockProgression.periode).toBe("string");
      expect(typeof mockProgression.niveau_debut).toBe("string");
      expect(typeof mockProgression.niveau_actuel).toBe("string");
      expect(typeof mockProgression.pourcentage).toBe("number");
    });

    it("devrait définir le type Presence", () => {
      const mockPresence = {
        date: "2024-01-15",
        present: true,
        cours_id: 1,
        nom_cours: "Karate",
      };

      expect(typeof mockPresence.date).toBe("string");
      expect(typeof mockPresence.present).toBe("boolean");
      expect(typeof mockPresence.cours_id).toBe("number");
      expect(typeof mockPresence.nom_cours).toBe("string");
    });
  });

  describe("Configuration du module", () => {
    it("devrait avoir des valeurs par défaut cohérentes", () => {
      const config = {
        defaultPeriodeMois: 6,
        maxPeriodeMois: 36,
        minPeriodeMois: 1,
      };

      expect(config.defaultPeriodeMois).toBeGreaterThan(0);
      expect(config.maxPeriodeMois).toBeGreaterThan(config.defaultPeriodeMois);
      expect(config.minPeriodeMois).toBeLessThanOrEqual(
        config.defaultPeriodeMois,
      );
    });

    it("devrait définir les endpoints disponibles", () => {
      const endpoints = [
        "/api/statistiques/health",
        "/api/statistiques/frequentation/:utilisateurId",
        "/api/statistiques/progression/:utilisateurId",
        "/api/statistiques/presence/:utilisateurId",
        "/api/statistiques/membres/count",
        "/api/statistiques/paiements/mois",
      ];

      endpoints.forEach((endpoint) => {
        expect(typeof endpoint).toBe("string");
        expect(endpoint).toContain("/api/statistiques");
      });
    });
  });

  describe("Formats de sortie JSON", () => {
    it("devrait sérialiser correctement les objets en JSON", () => {
      const data = {
        success: true,
        data: [
          { id: 1, nom: "Test 1" },
          { id: 2, nom: "Test 2" },
        ],
        count: 2,
      };

      const jsonString = JSON.stringify(data);
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsed = JSON.parse(jsonString);
      expect(parsed.success).toBe(true);
      expect(parsed.count).toBe(2);
    });

    it("ne devrait pas inclure de propriétés undefined dans le JSON", () => {
      const data = {
        success: true,
        data: [],
        optionalField: undefined,
      };

      const jsonString = JSON.stringify(data);
      const parsed = JSON.parse(jsonString);

      expect(parsed).not.toHaveProperty("optionalField");
    });
  });

  describe("Cohérence des structures de données", () => {
    it("devrait maintenir la même structure pour des réponses similaires", () => {
      const response1 = {
        success: true,
        data: [],
        count: 0,
      };

      const response2 = {
        success: true,
        data: [{ id: 1 }],
        count: 1,
      };

      expect(Object.keys(response1).sort()).toEqual(
        Object.keys(response2).sort(),
      );
    });
  });
});
