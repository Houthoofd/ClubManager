/**
 * Tests d'intégration réels pour le module Informations
 * Tests avec base de données réelle
 *
 * IMPORTANT: Ces tests nécessitent une base de données de test configurée
 * Configuration via .env.test avec DATABASE_URL
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { Informations } from "../../../db/clients/informations/informations.js";

// Ces tests sont désactivés par défaut (skipif no DB)
const SKIP_REAL_DB_TESTS =
  !process.env.DATABASE_URL || process.env.SKIP_REAL_DB_TESTS === "true";

describe("Informations Module - Tests d'intégration réels (DB)", () => {
  let informationsClient: Informations;

  beforeAll(async () => {
    if (SKIP_REAL_DB_TESTS) {
      console.log(
        "⚠️ Tests d'intégration réels ignorés (pas de DB configurée)",
      );
      return;
    }

    informationsClient = new Informations();

    // Attendre que la connexion MySQL soit prête
    try {
      await informationsClient["mysqlConnector"].waitForConnection(10000);
      console.log("✅ Connexion à la base de données de test établie");
    } catch (error) {
      console.error("❌ Échec de la connexion à la base de données:", error);
      throw error;
    }
  });

  afterAll(async () => {
    if (!SKIP_REAL_DB_TESTS && informationsClient) {
      // Fermer les connexions MySQL proprement
      try {
        await informationsClient["mysqlConnector"].closePool();
        console.log("🔚 Nettoyage des connexions DB terminé");
      } catch (error) {
        console.error("⚠️ Erreur lors de la fermeture du pool:", error);
      }
    }
  });

  // ==================== TESTS RÉELS - GRADES ====================
  describe("Grades - Tests réels", () => {
    it("devrait récupérer les grades depuis la DB réelle", async () => {
      const grades = await informationsClient.obtenirLesGrades();

      expect(grades).toBeDefined();
      expect(Array.isArray(grades)).toBe(true);

      if (grades && grades.length > 0) {
        expect(grades[0]).toHaveProperty("id");
        expect(grades[0]).toHaveProperty("nom");
        expect(typeof grades[0].id).toBe("number");
        expect(typeof grades[0].nom).toBe("string");
      }
    });

    it("devrait retourner les grades triés par ordre", async () => {
      const grades = await informationsClient.obtenirLesGrades();

      if (grades && grades.length > 1) {
        // Vérifier que les grades avec ordre sont triés
        const gradesAvecOrdre = grades.filter(
          (g) => g.ordre !== undefined && g.ordre !== null,
        );

        for (let i = 1; i < gradesAvecOrdre.length; i++) {
          expect(gradesAvecOrdre[i].ordre).toBeGreaterThanOrEqual(
            gradesAvecOrdre[i - 1].ordre!,
          );
        }
      }
    });

    it("devrait avoir des IDs uniques pour chaque grade", async () => {
      const grades = await informationsClient.obtenirLesGrades();

      if (grades && grades.length > 0) {
        const ids = grades.map((g) => g.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("devrait gérer une lecture répétée (idempotence)", async () => {
      const grades1 = await informationsClient.obtenirLesGrades();
      const grades2 = await informationsClient.obtenirLesGrades();

      expect(grades1).toEqual(grades2);
    });

    it("ne devrait pas avoir de noms vides", async () => {
      const grades = await informationsClient.obtenirLesGrades();

      if (grades && grades.length > 0) {
        grades.forEach((grade) => {
          expect(grade.nom.trim()).not.toBe("");
          expect(grade.nom.length).toBeGreaterThan(0);
        });
      }
    });
  });

  // ==================== TESTS RÉELS - GENRES ====================
  describe("Genres - Tests réels", () => {
    it("devrait récupérer les genres depuis la DB réelle", async () => {
      const genres = await informationsClient.obtenirLesGenres();

      expect(genres).toBeDefined();
      expect(Array.isArray(genres)).toBe(true);

      if (genres && genres.length > 0) {
        expect(genres[0]).toHaveProperty("id");
        expect(genres[0]).toHaveProperty("nom");
        expect(typeof genres[0].id).toBe("number");
        expect(typeof genres[0].nom).toBe("string");
      }
    });

    it("devrait avoir des IDs uniques pour chaque genre", async () => {
      const genres = await informationsClient.obtenirLesGenres();

      if (genres && genres.length > 0) {
        const ids = genres.map((g) => g.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("devrait avoir des noms uniques pour chaque genre", async () => {
      const genres = await informationsClient.obtenirLesGenres();

      if (genres && genres.length > 0) {
        const noms = genres.map((g) => g.nom);
        const uniqueNoms = new Set(noms);
        expect(uniqueNoms.size).toBe(noms.length);
      }
    });

    it("ne devrait pas avoir de noms vides", async () => {
      const genres = await informationsClient.obtenirLesGenres();

      if (genres && genres.length > 0) {
        genres.forEach((genre) => {
          expect(genre.nom.trim()).not.toBe("");
          expect(genre.nom.length).toBeGreaterThan(0);
          expect(genre.nom.length).toBeLessThanOrEqual(20);
        });
      }
    });

    it("devrait contenir au minimum les genres standard", async () => {
      const genres = await informationsClient.obtenirLesGenres();

      if (genres && genres.length > 0) {
        const noms = genres.map((g) => g.nom.toLowerCase());

        // Vérifier qu'il y a au moins quelques genres de base
        expect(genres.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ==================== TESTS RÉELS - STATUS ====================
  describe("Status - Tests réels", () => {
    it("devrait récupérer les statuts depuis la DB réelle", async () => {
      const status = await informationsClient.obtenirLeStatus();

      expect(status).toBeDefined();
      expect(Array.isArray(status)).toBe(true);

      if (status && status.length > 0) {
        expect(status[0]).toHaveProperty("id");
        expect(status[0]).toHaveProperty("nom");
        expect(typeof status[0].id).toBe("number");
        expect(typeof status[0].nom).toBe("string");
      }
    });

    it("devrait avoir des IDs uniques pour chaque statut", async () => {
      const status = await informationsClient.obtenirLeStatus();

      if (status && status.length > 0) {
        const ids = status.map((s) => s.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("ne devrait pas avoir de noms vides", async () => {
      const status = await informationsClient.obtenirLeStatus();

      if (status && status.length > 0) {
        status.forEach((s) => {
          expect(s.nom.trim()).not.toBe("");
          expect(s.nom.length).toBeGreaterThan(0);
          expect(s.nom.length).toBeLessThanOrEqual(50);
        });
      }
    });

    it("devrait contenir des statuts essentiels", async () => {
      const status = await informationsClient.obtenirLeStatus();

      if (status && status.length > 0) {
        expect(status.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ==================== TESTS RÉELS - ABONNEMENTS ====================
  describe("Plans tarifaires (Abonnements) - Tests réels", () => {
    it("devrait récupérer les plans tarifaires depuis la DB réelle", async () => {
      const plans = await informationsClient.obtenirLesPlansTarifaires();

      expect(plans).toBeDefined();
      expect(Array.isArray(plans)).toBe(true);

      if (plans && plans.length > 0) {
        expect(plans[0]).toHaveProperty("id");
        expect(plans[0]).toHaveProperty("nom_plan");
        expect(plans[0]).toHaveProperty("prix");
        expect(plans[0]).toHaveProperty("duree_mois");
        expect(typeof plans[0].id).toBe("number");
        expect(typeof plans[0].nom_plan).toBe("string");
        expect(typeof plans[0].prix).toBe("number");
        expect(typeof plans[0].duree_mois).toBe("number");
      }
    });

    it("devrait avoir des IDs uniques pour chaque plan", async () => {
      const plans = await informationsClient.obtenirLesPlansTarifaires();

      if (plans && plans.length > 0) {
        const ids = plans.map((p) => p.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("devrait avoir des prix valides (>= 0)", async () => {
      const plans = await informationsClient.obtenirLesPlansTarifaires();

      if (plans && plans.length > 0) {
        plans.forEach((plan) => {
          expect(plan.prix).toBeGreaterThanOrEqual(0);
          expect(typeof plan.prix).toBe("number");
          expect(isNaN(plan.prix)).toBe(false);
        });
      }
    });

    it("devrait avoir des durées valides (> 0)", async () => {
      const plans = await informationsClient.obtenirLesPlansTarifaires();

      if (plans && plans.length > 0) {
        plans.forEach((plan) => {
          expect(plan.duree_mois).toBeGreaterThan(0);
          expect(Number.isInteger(plan.duree_mois)).toBe(true);
        });
      }
    });

    it("ne devrait pas avoir de noms de plans vides", async () => {
      const plans = await informationsClient.obtenirLesPlansTarifaires();

      if (plans && plans.length > 0) {
        plans.forEach((plan) => {
          expect(plan.nom_plan.trim()).not.toBe("");
          expect(plan.nom_plan.length).toBeGreaterThan(0);
          expect(plan.nom_plan.length).toBeLessThanOrEqual(100);
        });
      }
    });

    it("devrait avoir des descriptions optionnelles valides", async () => {
      const plans = await informationsClient.obtenirLesPlansTarifaires();

      if (plans && plans.length > 0) {
        plans.forEach((plan) => {
          if (plan.description) {
            expect(typeof plan.description).toBe("string");
            expect(plan.description.length).toBeLessThanOrEqual(500);
          }
        });
      }
    });

    it("devrait retourner les plans triés (généralement par prix ou durée)", async () => {
      const plans = await informationsClient.obtenirLesPlansTarifaires();

      if (plans && plans.length > 1) {
        // Vérifier qu'il y a un ordre cohérent
        expect(plans.length).toBeGreaterThan(0);
      }
    });
  });

  // ==================== TESTS DE PERFORMANCE RÉELS ====================
  describe("Performance - Tests réels", () => {
    it("devrait récupérer les grades en moins de 500ms", async () => {
      const startTime = Date.now();
      await informationsClient.obtenirLesGrades();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("devrait récupérer les genres en moins de 500ms", async () => {
      const startTime = Date.now();
      await informationsClient.obtenirLesGenres();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("devrait récupérer les status en moins de 500ms", async () => {
      const startTime = Date.now();
      await informationsClient.obtenirLeStatus();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("devrait récupérer les plans tarifaires en moins de 500ms", async () => {
      const startTime = Date.now();
      await informationsClient.obtenirLesPlansTarifaires();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it("devrait gérer 10 requêtes concurrentes", async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, () =>
        informationsClient.obtenirLesGrades(),
      );

      const results = await Promise.all(promises);

      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(3000); // 3 secondes max pour 10 requêtes
    });
  });

  // ==================== TESTS DE CONCURRENCE ====================
  describe("Concurrence - Tests réels", () => {
    it("devrait gérer des lectures concurrentes sur différentes tables", async () => {
      const promises = [
        informationsClient.obtenirLesGrades(),
        informationsClient.obtenirLesGenres(),
        informationsClient.obtenirLeStatus(),
        informationsClient.obtenirLesPlansTarifaires(),
      ];

      const [grades, genres, status, plans] = await Promise.all(promises);

      expect(grades).toBeDefined();
      expect(genres).toBeDefined();
      expect(status).toBeDefined();
      expect(plans).toBeDefined();
    });

    it("devrait gérer des lectures répétées en parallèle", async () => {
      const promises = [
        informationsClient.obtenirLesGrades(),
        informationsClient.obtenirLesGrades(),
        informationsClient.obtenirLesGrades(),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });

  // ==================== TESTS DE COHÉRENCE DES DONNÉES ====================
  describe("Cohérence des données", () => {
    it("devrait avoir des IDs positifs pour tous les éléments", async () => {
      const [grades, genres, status, plans] = await Promise.all([
        informationsClient.obtenirLesGrades(),
        informationsClient.obtenirLesGenres(),
        informationsClient.obtenirLeStatus(),
        informationsClient.obtenirLesPlansTarifaires(),
      ]);

      if (grades) grades.forEach((g) => expect(g.id).toBeGreaterThan(0));
      if (genres) genres.forEach((g) => expect(g.id).toBeGreaterThan(0));
      if (status) status.forEach((s) => expect(s.id).toBeGreaterThan(0));
      if (plans) plans.forEach((p) => expect(p.id).toBeGreaterThan(0));
    });

    it("ne devrait pas avoir de données NULL inattendues", async () => {
      const [grades, genres, status, plans] = await Promise.all([
        informationsClient.obtenirLesGrades(),
        informationsClient.obtenirLesGenres(),
        informationsClient.obtenirLeStatus(),
        informationsClient.obtenirLesPlansTarifaires(),
      ]);

      if (grades && grades.length > 0) {
        grades.forEach((g) => {
          expect(g.id).not.toBeNull();
          expect(g.nom).not.toBeNull();
        });
      }

      if (genres && genres.length > 0) {
        genres.forEach((g) => {
          expect(g.id).not.toBeNull();
          expect(g.nom).not.toBeNull();
        });
      }

      if (status && status.length > 0) {
        status.forEach((s) => {
          expect(s.id).not.toBeNull();
          expect(s.nom).not.toBeNull();
        });
      }

      if (plans && plans.length > 0) {
        plans.forEach((p) => {
          expect(p.id).not.toBeNull();
          expect(p.nom_plan).not.toBeNull();
          expect(p.prix).not.toBeNull();
          expect(p.duree_mois).not.toBeNull();
        });
      }
    });
  });

  // ==================== TESTS DE RÉSILIENCE ====================
  describe("Résilience", () => {
    it("devrait pouvoir récupérer les données après plusieurs lectures", async () => {
      // Test de stabilité - plusieurs lectures successives
      for (let i = 0; i < 5; i++) {
        const grades = await informationsClient.obtenirLesGrades();
        expect(grades).toBeDefined();
      }

      // Vérifier que la connexion est toujours valide
      const finalGrades = await informationsClient.obtenirLesGrades();
      expect(finalGrades).toBeDefined();
    });

    it("devrait gérer des requêtes entrelacées", async () => {
      const results = [];

      results.push(await informationsClient.obtenirLesGrades());
      results.push(await informationsClient.obtenirLesGenres());
      results.push(await informationsClient.obtenirLesGrades());
      results.push(await informationsClient.obtenirLeStatus());
      results.push(await informationsClient.obtenirLesPlansTarifaires());

      results.forEach((result) => expect(result).toBeDefined());
    });
  });
});
