/**
 * Tests de validation Zod pour le module Informations
 * Validation des schémas des données de référence
 */

import { describe, it, expect } from "@jest/globals";
import {
  referenceItemSchema,
  gradeSchema,
  genreSchema,
  statusSchema,
  planTarifaireSchema,
  allReferencesSchema,
  healthCheckSchema,
} from "@clubmanager/types/validators";

describe("Informations - Tests de validation Zod", () => {
  // ==================== REFERENCE ITEM SCHEMA ====================
  describe("referenceItemSchema", () => {
    it("devrait valider un item de référence valide", () => {
      const validItem = {
        id: 1,
        nom: "Test Item",
      };

      const result = referenceItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidItem = {
        id: -1,
        nom: "Test",
      };

      const result = referenceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID égal à zéro", () => {
      const invalidItem = {
        id: 0,
        nom: "Test",
      };

      const result = referenceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID décimal", () => {
      const invalidItem = {
        id: 1.5,
        nom: "Test",
      };

      const result = referenceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom vide", () => {
      const invalidItem = {
        id: 1,
        nom: "",
      };

      const result = referenceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom manquant", () => {
      const invalidItem = {
        id: 1,
      };

      const result = referenceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID manquant", () => {
      const invalidItem = {
        nom: "Test",
      };

      const result = referenceItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  // ==================== GRADE SCHEMA ====================
  describe("gradeSchema", () => {
    it("devrait valider un grade valide avec ordre", () => {
      const validGrade = {
        id: 1,
        nom: "Ceinture Blanche",
        ordre: 1,
      };

      const result = gradeSchema.safeParse(validGrade);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validGrade);
      }
    });

    it("devrait valider un grade sans ordre (optionnel)", () => {
      const validGrade = {
        id: 2,
        nom: "Ceinture Jaune",
      };

      const result = gradeSchema.safeParse(validGrade);
      expect(result.success).toBe(true);
    });

    it("devrait valider un ordre égal à zéro", () => {
      const validGrade = {
        id: 1,
        nom: "Débutant",
        ordre: 0,
      };

      const result = gradeSchema.safeParse(validGrade);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom trop long (> 50 caractères)", () => {
      const invalidGrade = {
        id: 1,
        nom: "A".repeat(51),
        ordre: 1,
      };

      const result = gradeSchema.safeParse(invalidGrade);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre négatif", () => {
      const invalidGrade = {
        id: 1,
        nom: "Test",
        ordre: -1,
      };

      const result = gradeSchema.safeParse(invalidGrade);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID non entier", () => {
      const invalidGrade = {
        id: 1.5,
        nom: "Test",
        ordre: 1,
      };

      const result = gradeSchema.safeParse(invalidGrade);
      expect(result.success).toBe(false);
    });

    it("devrait valider un nom de 50 caractères exactement", () => {
      const validGrade = {
        id: 1,
        nom: "A".repeat(50),
        ordre: 1,
      };

      const result = gradeSchema.safeParse(validGrade);
      expect(result.success).toBe(true);
    });

    it("devrait valider un nom d'un seul caractère", () => {
      const validGrade = {
        id: 1,
        nom: "A",
        ordre: 1,
      };

      const result = gradeSchema.safeParse(validGrade);
      expect(result.success).toBe(true);
    });
  });

  // ==================== GENRE SCHEMA ====================
  describe("genreSchema", () => {
    it("devrait valider un genre valide", () => {
      const validGenre = {
        id: 1,
        nom: "Homme",
      };

      const result = genreSchema.safeParse(validGenre);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validGenre);
      }
    });

    it("devrait rejeter un nom trop long (> 20 caractères)", () => {
      const invalidGenre = {
        id: 1,
        nom: "A".repeat(21),
      };

      const result = genreSchema.safeParse(invalidGenre);
      expect(result.success).toBe(false);
    });

    it("devrait valider un nom de 20 caractères exactement", () => {
      const validGenre = {
        id: 1,
        nom: "A".repeat(20),
      };

      const result = genreSchema.safeParse(validGenre);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidGenre = {
        id: -1,
        nom: "Test",
      };

      const result = genreSchema.safeParse(invalidGenre);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom vide", () => {
      const invalidGenre = {
        id: 1,
        nom: "",
      };

      const result = genreSchema.safeParse(invalidGenre);
      expect(result.success).toBe(false);
    });

    it("devrait valider des caractères spéciaux dans le nom", () => {
      const validGenre = {
        id: 1,
        nom: "Non-binaire",
      };

      const result = genreSchema.safeParse(validGenre);
      expect(result.success).toBe(true);
    });
  });

  // ==================== STATUS SCHEMA ====================
  describe("statusSchema", () => {
    it("devrait valider un statut valide", () => {
      const validStatus = {
        id: 1,
        nom: "Actif",
      };

      const result = statusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validStatus);
      }
    });

    it("devrait rejeter un nom trop long (> 50 caractères)", () => {
      const invalidStatus = {
        id: 1,
        nom: "A".repeat(51),
      };

      const result = statusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait valider un nom de 50 caractères exactement", () => {
      const validStatus = {
        id: 1,
        nom: "A".repeat(50),
      };

      const result = statusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID zéro", () => {
      const invalidStatus = {
        id: 0,
        nom: "Test",
      };

      const result = statusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("devrait valider un nom avec espaces", () => {
      const validStatus = {
        id: 1,
        nom: "En attente de validation",
      };

      const result = statusSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
    });
  });

  // ==================== PLAN TARIFAIRE SCHEMA ====================
  describe("planTarifaireSchema", () => {
    it("devrait valider un plan tarifaire complet", () => {
      const validPlan = {
        id: 1,
        nom_plan: "Mensuel",
        prix: 50.0,
        duree_mois: 1,
        description: "Abonnement mensuel",
      };

      const result = planTarifaireSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPlan);
      }
    });

    it("devrait valider un plan sans description (optionnel)", () => {
      const validPlan = {
        id: 1,
        nom_plan: "Annuel",
        prix: 480.0,
        duree_mois: 12,
      };

      const result = planTarifaireSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider un prix égal à zéro", () => {
      const validPlan = {
        id: 1,
        nom_plan: "Gratuit",
        prix: 0,
        duree_mois: 1,
      };

      const result = planTarifaireSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un prix négatif", () => {
      const invalidPlan = {
        id: 1,
        nom_plan: "Test",
        prix: -10,
        duree_mois: 1,
      };

      const result = planTarifaireSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une durée nulle", () => {
      const invalidPlan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 0,
      };

      const result = planTarifaireSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une durée négative", () => {
      const invalidPlan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: -1,
      };

      const result = planTarifaireSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom_plan trop long (> 100 caractères)", () => {
      const invalidPlan = {
        id: 1,
        nom_plan: "A".repeat(101),
        prix: 50.0,
        duree_mois: 1,
      };

      const result = planTarifaireSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une description trop longue (> 500 caractères)", () => {
      const invalidPlan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: "A".repeat(501),
      };

      const result = planTarifaireSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });

    it("devrait valider une description de 500 caractères exactement", () => {
      const validPlan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: "A".repeat(500),
      };

      const result = planTarifaireSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait valider un prix décimal", () => {
      const validPlan = {
        id: 1,
        nom_plan: "Test",
        prix: 49.99,
        duree_mois: 1,
      };

      const result = planTarifaireSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une durée décimale", () => {
      const invalidPlan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1.5,
      };

      const result = planTarifaireSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
    });
  });

  // ==================== ALL REFERENCES SCHEMA ====================
  describe("allReferencesSchema", () => {
    it("devrait valider un objet complet avec toutes les références", () => {
      const validReferences = {
        grades: [
          { id: 1, nom: "Ceinture Blanche", ordre: 1 },
          { id: 2, nom: "Ceinture Jaune", ordre: 2 },
        ],
        genres: [
          { id: 1, nom: "Homme" },
          { id: 2, nom: "Femme" },
        ],
        status: [
          { id: 1, nom: "Actif" },
          { id: 2, nom: "Inactif" },
        ],
        abonnements: [
          { id: 1, nom_plan: "Mensuel", prix: 50.0, duree_mois: 1 },
          { id: 2, nom_plan: "Annuel", prix: 480.0, duree_mois: 12 },
        ],
      };

      const result = allReferencesSchema.safeParse(validReferences);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grades).toHaveLength(2);
        expect(result.data.genres).toHaveLength(2);
        expect(result.data.status).toHaveLength(2);
        expect(result.data.abonnements).toHaveLength(2);
      }
    });

    it("devrait valider des tableaux vides", () => {
      const validReferences = {
        grades: [],
        genres: [],
        status: [],
        abonnements: [],
      };

      const result = allReferencesSchema.safeParse(validReferences);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter si un tableau manque", () => {
      const invalidReferences = {
        grades: [],
        genres: [],
        status: [],
        // abonnements manquant
      };

      const result = allReferencesSchema.safeParse(invalidReferences);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un grade est invalide", () => {
      const invalidReferences = {
        grades: [{ id: -1, nom: "Invalid" }], // ID négatif
        genres: [{ id: 1, nom: "Homme" }],
        status: [{ id: 1, nom: "Actif" }],
        abonnements: [{ id: 1, nom_plan: "Test", prix: 50.0, duree_mois: 1 }],
      };

      const result = allReferencesSchema.safeParse(invalidReferences);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un abonnement est invalide", () => {
      const invalidReferences = {
        grades: [{ id: 1, nom: "Test", ordre: 1 }],
        genres: [{ id: 1, nom: "Homme" }],
        status: [{ id: 1, nom: "Actif" }],
        abonnements: [
          { id: 1, nom_plan: "Test", prix: -10, duree_mois: 1 }, // Prix négatif
        ],
      };

      const result = allReferencesSchema.safeParse(invalidReferences);
      expect(result.success).toBe(false);
    });
  });

  // ==================== HEALTH CHECK SCHEMA ====================
  describe("healthCheckSchema", () => {
    it("devrait valider un health check healthy", () => {
      const validHealth = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "Tous les services sont opérationnels",
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });

    it("devrait valider un health check degraded", () => {
      const validHealth = {
        status: "degraded" as const,
        checks: {
          grades: true,
          genres: false,
          status: true,
          abonnements: false,
        },
        message: "2/4 services opérationnels",
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });

    it("devrait valider un health check unhealthy", () => {
      const validHealth = {
        status: "unhealthy" as const,
        checks: {
          grades: false,
          genres: false,
          status: false,
          abonnements: false,
        },
        message: "Aucun service opérationnel",
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });

    it("devrait valider avec un timestamp optionnel", () => {
      const validHealth = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "OK",
        timestamp: new Date().toISOString(),
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidHealth = {
        status: "unknown",
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "Test",
      };

      const result = healthCheckSchema.safeParse(invalidHealth);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter si un check manque", () => {
      const invalidHealth = {
        status: "healthy",
        checks: {
          grades: true,
          genres: true,
          // status manquant
          abonnements: true,
        },
        message: "Test",
      };

      const result = healthCheckSchema.safeParse(invalidHealth);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un timestamp invalide", () => {
      const invalidHealth = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "OK",
        timestamp: "not-a-date",
      };

      const result = healthCheckSchema.safeParse(invalidHealth);
      expect(result.success).toBe(false);
    });

    it("devrait valider sans timestamp", () => {
      const validHealth = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "OK",
      };

      const result = healthCheckSchema.safeParse(validHealth);
      expect(result.success).toBe(true);
    });
  });
});
