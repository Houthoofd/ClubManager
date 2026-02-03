/**
 * Tests avancés des validators Zod pour le module Informations
 * Couverture à 100% des branches - Tests exhaustifs
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
} from "../core/validators/informations.schema.js";
import { z } from "zod";

describe("Informations - Tests avancés des validators (Branch Coverage 100%)", () => {
  // ==================== REFERENCE ITEM SCHEMA - ADVANCED ====================
  describe("referenceItemSchema - Branch Coverage", () => {
    it("devrait accepter un ID très grand", () => {
      const item = { id: 999999999, nom: "Test" };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID null", () => {
      const item = { id: null, nom: "Test" };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID undefined", () => {
      const item = { id: undefined, nom: "Test" };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID string", () => {
      const item = { id: "1", nom: "Test" };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom null", () => {
      const item = { id: 1, nom: null };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom undefined", () => {
      const item = { id: 1, nom: undefined };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un nom number", () => {
      const item = { id: 1, nom: 123 };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un nom avec caractères unicode", () => {
      const item = { id: 1, nom: "测试 🎌" };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un objet vide", () => {
      const item = {};
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = referenceItemSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = referenceItemSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un objet avec propriétés supplémentaires", () => {
      const item = { id: 1, nom: "Test", extra: "ignored" };
      const result = referenceItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });

  // ==================== GRADE SCHEMA - ADVANCED ====================
  describe("gradeSchema - Branch Coverage", () => {
    it("devrait accepter un ordre très grand", () => {
      const grade = { id: 1, nom: "Expert", ordre: 1000000 };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ordre null", () => {
      const grade = { id: 1, nom: "Test", ordre: null };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre string", () => {
      const grade = { id: 1, nom: "Test", ordre: "1" };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(false);
    });

    it("devrait accepter undefined pour ordre (optionnel)", () => {
      const grade = { id: 1, nom: "Test", ordre: undefined };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un nom avec accents", () => {
      const grade = { id: 1, nom: "Ceinture Éméraude" };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un nom avec chiffres", () => {
      const grade = { id: 1, nom: "Niveau 123" };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom whitespace seulement", () => {
      const grade = { id: 1, nom: "   " };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un nom avec espaces", () => {
      const grade = { id: 1, nom: "Ceinture Noire 1er Dan" };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID float", () => {
      const grade = { id: 1.1, nom: "Test" };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ordre float", () => {
      const grade = { id: 1, nom: "Test", ordre: 1.5 };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un nom de 1 caractère", () => {
      const grade = { id: 1, nom: "A" };
      const result = gradeSchema.safeParse(grade);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un array", () => {
      const result = gradeSchema.safeParse([1, 2, 3]);
      expect(result.success).toBe(false);
    });
  });

  // ==================== GENRE SCHEMA - ADVANCED ====================
  describe("genreSchema - Branch Coverage", () => {
    it("devrait accepter un nom avec tiret", () => {
      const genre = { id: 1, nom: "Non-binaire" };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un nom avec apostrophe", () => {
      const genre = { id: 1, nom: "Genre d'autre" };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom de 21 caractères", () => {
      const genre = { id: 1, nom: "A".repeat(21) };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(false);
    });

    it("devrait accepter exactement 20 caractères", () => {
      const genre = { id: 1, nom: "A".repeat(20) };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID NaN", () => {
      const genre = { id: NaN, nom: "Test" };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter Infinity comme ID", () => {
      const genre = { id: Infinity, nom: "Test" };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(false);
    });

    it("devrait accepter des caractères spéciaux", () => {
      const genre = { id: 1, nom: "Autre/Non-défini" };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un objet nested", () => {
      const genre = { id: 1, nom: { value: "Test" } };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(false);
    });

    it("devrait accepter des emojis", () => {
      const genre = { id: 1, nom: "Genre ⚧️" };
      const result = genreSchema.safeParse(genre);
      expect(result.success).toBe(true);
    });
  });

  // ==================== STATUS SCHEMA - ADVANCED ====================
  describe("statusSchema - Branch Coverage", () => {
    it("devrait accepter un nom avec parenthèses", () => {
      const status = { id: 1, nom: "En attente (validation)" };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un nom avec points", () => {
      const status = { id: 1, nom: "En cours..." };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom > 50 caractères", () => {
      const status = { id: 1, nom: "A".repeat(51) };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(false);
    });

    it("devrait accepter exactement 50 caractères", () => {
      const status = { id: 1, nom: "A".repeat(50) };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un ID boolean", () => {
      const status = { id: true, nom: "Test" };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(false);
    });

    it("devrait accepter des chiffres dans le nom", () => {
      const status = { id: 1, nom: "Phase 2 - En cours" };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un nom array", () => {
      const status = { id: 1, nom: ["Test"] };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(false);
    });

    it("devrait accepter des caractères accentués", () => {
      const status = { id: 1, nom: "Résiliation demandée" };
      const result = statusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  // ==================== PLAN TARIFAIRE SCHEMA - ADVANCED ====================
  describe("planTarifaireSchema - Branch Coverage", () => {
    it("devrait accepter un prix avec beaucoup de décimales", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 49.999999,
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un prix null", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: null,
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un prix string", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: "50.00",
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une durée null", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: null,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter NaN comme prix", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: NaN,
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter Infinity comme prix", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: Infinity,
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait accepter description vide", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: "",
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter description null", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: null,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait accepter description undefined", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: undefined,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it("devrait accepter exactement 500 caractères de description", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: "A".repeat(500),
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter 501 caractères de description", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: "A".repeat(501),
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait accepter exactement 100 caractères de nom_plan", () => {
      const plan = {
        id: 1,
        nom_plan: "A".repeat(100),
        prix: 50.0,
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter 101 caractères de nom_plan", () => {
      const plan = {
        id: 1,
        nom_plan: "A".repeat(101),
        prix: 50.0,
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait accepter une durée très longue", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 999999,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un prix très élevé", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 999999.99,
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un objet incomplet", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        // prix manquant
        duree_mois: 1,
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });

    it("devrait accepter description avec caractères spéciaux", () => {
      const plan = {
        id: 1,
        nom_plan: "Test",
        prix: 50.0,
        duree_mois: 1,
        description: "Économisez 20% ! 🎉 Valid until 31/12/2024",
      };
      const result = planTarifaireSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });
  });

  // ==================== ALL REFERENCES SCHEMA - ADVANCED ====================
  describe("allReferencesSchema - Branch Coverage", () => {
    it("devrait accepter un mélange de tableaux vides et pleins", () => {
      const refs = {
        grades: [{ id: 1, nom: "Test" }],
        genres: [],
        status: [{ id: 1, nom: "Test" }],
        abonnements: [],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter grades null", () => {
      const refs = {
        grades: null,
        genres: [],
        status: [],
        abonnements: [],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter genres non-array", () => {
      const refs = {
        grades: [],
        genres: "not an array",
        status: [],
        abonnements: [],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un grade invalide dans le tableau", () => {
      const refs = {
        grades: [
          { id: 1, nom: "Valid" },
          { id: -1, nom: "Invalid" }, // ID négatif
        ],
        genres: [],
        status: [],
        abonnements: [],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un genre invalide dans le tableau", () => {
      const refs = {
        grades: [],
        genres: [
          { id: 1, nom: "Valid" },
          { id: 1, nom: "" }, // Nom vide
        ],
        status: [],
        abonnements: [],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un status invalide dans le tableau", () => {
      const refs = {
        grades: [],
        genres: [],
        status: [{ id: 0, nom: "Invalid" }], // ID = 0
        abonnements: [],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un abonnement invalide dans le tableau", () => {
      const refs = {
        grades: [],
        genres: [],
        status: [],
        abonnements: [
          { id: 1, nom_plan: "Test", prix: -10, duree_mois: 1 }, // Prix négatif
        ],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(false);
    });

    it("devrait accepter des tableaux avec plusieurs éléments valides", () => {
      const refs = {
        grades: [
          { id: 1, nom: "Grade 1", ordre: 1 },
          { id: 2, nom: "Grade 2", ordre: 2 },
          { id: 3, nom: "Grade 3", ordre: 3 },
        ],
        genres: [
          { id: 1, nom: "Genre 1" },
          { id: 2, nom: "Genre 2" },
        ],
        status: [
          { id: 1, nom: "Status 1" },
          { id: 2, nom: "Status 2" },
        ],
        abonnements: [
          { id: 1, nom_plan: "Plan 1", prix: 10, duree_mois: 1 },
          { id: 2, nom_plan: "Plan 2", prix: 20, duree_mois: 2 },
        ],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un objet incomplet", () => {
      const refs = {
        grades: [],
        genres: [],
        // status manquant
        abonnements: [],
      };
      const result = allReferencesSchema.safeParse(refs);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter null", () => {
      const result = allReferencesSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter undefined", () => {
      const result = allReferencesSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  // ==================== HEALTH CHECK SCHEMA - ADVANCED ====================
  describe("healthCheckSchema - Branch Coverage", () => {
    it("devrait rejeter un status invalide", () => {
      const health = {
        status: "ok",
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "Test",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un check non-boolean", () => {
      const health = {
        status: "healthy",
        checks: {
          grades: "yes",
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "Test",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter checks null", () => {
      const health = {
        status: "healthy",
        checks: null,
        message: "Test",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter message non-string", () => {
      const health = {
        status: "healthy",
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: 123,
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait accepter message vide", () => {
      const health = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(true);
    });

    it("devrait accepter un timestamp ISO valide", () => {
      const health = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "OK",
        timestamp: "2024-01-15T10:30:00.000Z",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un timestamp non-ISO", () => {
      const health = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "OK",
        timestamp: "15/01/2024",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter timestamp null", () => {
      const health = {
        status: "healthy" as const,
        checks: {
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        },
        message: "OK",
        timestamp: null,
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait accepter tous les checks à false", () => {
      const health = {
        status: "unhealthy" as const,
        checks: {
          grades: false,
          genres: false,
          status: false,
          abonnements: false,
        },
        message: "Tous les services sont down",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un check manquant", () => {
      const health = {
        status: "healthy",
        checks: {
          grades: true,
          genres: true,
          // status manquant
          abonnements: true,
        },
        message: "Test",
      };
      const result = healthCheckSchema.safeParse(health);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un objet vide", () => {
      const result = healthCheckSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ==================== TESTS DE TYPES TYPESCRIPT ====================
  describe("Types TypeScript générés", () => {
    it("devrait exporter les types corrects", () => {
      type Grade = z.infer<typeof gradeSchema>;
      type Genre = z.infer<typeof genreSchema>;
      type Status = z.infer<typeof statusSchema>;
      type PlanTarifaire = z.infer<typeof planTarifaireSchema>;

      const grade: Grade = { id: 1, nom: "Test", ordre: 1 };
      const genre: Genre = { id: 1, nom: "Test" };
      const status: Status = { id: 1, nom: "Test" };
      const plan: PlanTarifaire = {
        id: 1,
        nom_plan: "Test",
        prix: 50,
        duree_mois: 1,
      };

      expect(grade.id).toBe(1);
      expect(genre.nom).toBe("Test");
      expect(status.id).toBe(1);
      expect(plan.prix).toBe(50);
    });
  });
});
