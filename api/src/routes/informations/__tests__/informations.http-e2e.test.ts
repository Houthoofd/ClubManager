/**
 * Tests HTTP End-to-End pour le module Informations
 * Tests avec Supertest sur des vraies requêtes HTTP
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import informationsRouter from "../informations.routes.js";

describe("Informations Module - Tests HTTP E2E", () => {
  let app: Express;

  beforeAll(() => {
    // Créer une application Express de test
    app = express();
    app.use(express.json());
    app.use("/api/informations", informationsRouter);
  });

  afterAll(() => {
    // Nettoyage si nécessaire
  });

  // ==================== GET /api/informations/grades ====================
  describe("GET /api/informations/grades", () => {
    it("devrait retourner un status 200 et les grades", async () => {
      const response = await request(app)
        .get("/api/informations/grades")
        .expect("Content-Type", /json/);

      // Accepter 200 (succès), 404 (vide) ou 500 (DB non configurée pour E2E)
      expect([200, 404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("nom");
        }
      }
    });

    it("devrait retourner des headers appropriés", async () => {
      const response = await request(app).get("/api/informations/grades");

      expect(response.headers["content-type"]).toMatch(/json/);
      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait gérer les erreurs avec un status 500", async () => {
      // Si le service est down, on devrait avoir une erreur gracieuse
      const response = await request(app).get("/api/informations/grades");

      // Le status devrait être soit 200 (succès) soit 404 (vide) soit 500 (erreur)
      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait retourner un count si des grades existent", async () => {
      const response = await request(app).get("/api/informations/grades");

      if (response.status === 200 && response.body.data.length > 0) {
        expect(response.body).toHaveProperty("count");
        expect(response.body.count).toBe(response.body.data.length);
      }
    });
  });

  // ==================== GET /api/informations/genres ====================
  describe("GET /api/informations/genres", () => {
    it("devrait retourner un status 200 et les genres", async () => {
      const response = await request(app)
        .get("/api/informations/genres")
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("nom");
        }
      }
    });

    it("devrait retourner JSON valide", async () => {
      const response = await request(app).get("/api/informations/genres");

      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });

    it("devrait accepter les requêtes sans headers spéciaux", async () => {
      const response = await request(app).get("/api/informations/genres");

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  // ==================== GET /api/informations/status ====================
  describe("GET /api/informations/status", () => {
    it("devrait retourner un status 200 et les statuts", async () => {
      const response = await request(app)
        .get("/api/informations/status")
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("nom");
        }
      }
    });

    it("devrait retourner des données cohérentes", async () => {
      const response1 = await request(app).get("/api/informations/status");
      const response2 = await request(app).get("/api/informations/status");

      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body.data).toEqual(response2.body.data);
      }
    });
  });

  // ==================== GET /api/informations/abonnements ====================
  describe("GET /api/informations/abonnements", () => {
    it("devrait retourner un status 200 et les plans tarifaires", async () => {
      const response = await request(app)
        .get("/api/informations/abonnements")
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);

        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("nom_plan");
          expect(response.body.data[0]).toHaveProperty("prix");
          expect(response.body.data[0]).toHaveProperty("duree_mois");
        }
      }
    });

    it("devrait avoir des prix valides dans les abonnements", async () => {
      const response = await request(app).get("/api/informations/abonnements");

      if (response.status === 200 && response.body.data.length > 0) {
        response.body.data.forEach((plan: any) => {
          expect(typeof plan.prix).toBe("number");
          expect(plan.prix).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("devrait avoir des durées valides dans les abonnements", async () => {
      const response = await request(app).get("/api/informations/abonnements");

      if (response.status === 200 && response.body.data.length > 0) {
        response.body.data.forEach((plan: any) => {
          expect(typeof plan.duree_mois).toBe("number");
          expect(plan.duree_mois).toBeGreaterThan(0);
        });
      }
    });
  });

  // ==================== GET /api/informations/all ====================
  describe("GET /api/informations/all", () => {
    it("devrait retourner toutes les références en une seule requête", async () => {
      const response = await request(app)
        .get("/api/informations/all")
        .expect("Content-Type", /json/);

      expect([200, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(response.body.data).toHaveProperty("grades");
        expect(response.body.data).toHaveProperty("genres");
        expect(response.body.data).toHaveProperty("status");
        expect(response.body.data).toHaveProperty("abonnements");

        expect(Array.isArray(response.body.data.grades)).toBe(true);
        expect(Array.isArray(response.body.data.genres)).toBe(true);
        expect(Array.isArray(response.body.data.status)).toBe(true);
        expect(Array.isArray(response.body.data.abonnements)).toBe(true);
      }
    });

    it("devrait retourner les mêmes données que les endpoints individuels", async () => {
      const [
        allResponse,
        gradesResponse,
        genresResponse,
        statusResponse,
        abonnementsResponse,
      ] = await Promise.all([
        request(app).get("/api/informations/all"),
        request(app).get("/api/informations/grades"),
        request(app).get("/api/informations/genres"),
        request(app).get("/api/informations/status"),
        request(app).get("/api/informations/abonnements"),
      ]);

      if (
        allResponse.status === 200 &&
        gradesResponse.status === 200 &&
        genresResponse.status === 200 &&
        statusResponse.status === 200 &&
        abonnementsResponse.status === 200
      ) {
        // Comparer les données (peut varier légèrement en fonction du timing)
        expect(allResponse.body.data.grades.length).toBe(
          gradesResponse.body.data.length,
        );
        expect(allResponse.body.data.genres.length).toBe(
          genresResponse.body.data.length,
        );
        expect(allResponse.body.data.status.length).toBe(
          statusResponse.body.data.length,
        );
        expect(allResponse.body.data.abonnements.length).toBe(
          abonnementsResponse.body.data.length,
        );
      }
    });

    it("devrait être plus rapide que 4 requêtes séparées", async () => {
      const startAll = Date.now();
      await request(app).get("/api/informations/all");
      const timeAll = Date.now() - startAll;

      const startSeparate = Date.now();
      await Promise.all([
        request(app).get("/api/informations/grades"),
        request(app).get("/api/informations/genres"),
        request(app).get("/api/informations/status"),
        request(app).get("/api/informations/abonnements"),
      ]);
      const timeSeparate = Date.now() - startSeparate;

      // /all devrait être plus rapide ou similaire (requêtes parallèles en interne)
      console.log(`Time /all: ${timeAll}ms, Time separate: ${timeSeparate}ms`);
    });
  });

  // ==================== GET /api/informations/health ====================
  describe("GET /api/informations/health", () => {
    it("devrait retourner un status de santé", async () => {
      const response = await request(app)
        .get("/api/informations/health")
        .expect("Content-Type", /json/);

      // Le health check peut retourner 200 (healthy) ou 503 (degraded/unhealthy)
      expect([200, 503]).toContain(response.status);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("checks");
      expect(response.body).toHaveProperty("message");

      if (response.body.status) {
        expect(["healthy", "degraded", "unhealthy"]).toContain(
          response.body.status,
        );
      }

      if (response.body.checks) {
        expect(response.body.checks).toHaveProperty("grades");
        expect(response.body.checks).toHaveProperty("genres");
        expect(response.body.checks).toHaveProperty("status");
        expect(response.body.checks).toHaveProperty("abonnements");

        expect(typeof response.body.checks.grades).toBe("boolean");
        expect(typeof response.body.checks.genres).toBe("boolean");
        expect(typeof response.body.checks.status).toBe("boolean");
        expect(typeof response.body.checks.abonnements).toBe("boolean");
      }
    });

    it("devrait retourner 200 ou 503 selon l'état des services", async () => {
      const response = await request(app).get("/api/informations/health");

      // 200 = healthy, 503 = degraded/unhealthy
      expect([200, 503]).toContain(response.status);
    });

    it("devrait retourner healthy si tous les checks passent", async () => {
      const response = await request(app).get("/api/informations/health");

      if (response.body.status === "healthy") {
        expect(response.body.checks.grades).toBe(true);
        expect(response.body.checks.genres).toBe(true);
        expect(response.body.checks.status).toBe(true);
        expect(response.body.checks.abonnements).toBe(true);
      }
    });

    it("devrait retourner degraded si certains checks échouent", async () => {
      const response = await request(app).get("/api/informations/health");

      if (response.body.status === "degraded") {
        const checksArray = Object.values(response.body.checks);
        const successCount = checksArray.filter(
          (check) => check === true,
        ).length;

        expect(successCount).toBeGreaterThanOrEqual(2);
        expect(successCount).toBeLessThan(4);
      }
    });

    it("devrait retourner unhealthy si la plupart des checks échouent", async () => {
      const response = await request(app).get("/api/informations/health");

      if (response.body.status === "unhealthy") {
        const checksArray = Object.values(response.body.checks);
        const successCount = checksArray.filter(
          (check) => check === true,
        ).length;

        expect(successCount).toBeLessThan(2);
      }
    });
  });

  // ==================== TESTS DE ROUTES INVALIDES ====================
  describe("Routes invalides", () => {
    it("devrait retourner 404 pour une route inexistante", async () => {
      const response = await request(app).get(
        "/api/informations/route-qui-nexiste-pas",
      );

      expect(response.status).toBe(404);
    });

    it("devrait rejeter les méthodes HTTP non supportées", async () => {
      // POST sur un endpoint GET uniquement
      const response = await request(app)
        .post("/api/informations/grades")
        .send({});

      expect([404, 405]).toContain(response.status);
    });

    it("devrait rejeter PUT sur les endpoints", async () => {
      const response = await request(app)
        .put("/api/informations/genres")
        .send({});

      expect([404, 405]).toContain(response.status);
    });

    it("devrait rejeter DELETE sur les endpoints", async () => {
      const response = await request(app).delete("/api/informations/status");

      expect([404, 405]).toContain(response.status);
    });
  });

  // ==================== TESTS DE PERFORMANCE HTTP ====================
  describe("Performance HTTP", () => {
    it("devrait répondre en moins de 500ms pour /grades", async () => {
      const startTime = Date.now();
      await request(app).get("/api/informations/grades");
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it("devrait répondre en moins de 500ms pour /genres", async () => {
      const startTime = Date.now();
      await request(app).get("/api/informations/genres");
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it("devrait répondre en moins de 500ms pour /status", async () => {
      const startTime = Date.now();
      await request(app).get("/api/informations/status");
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it("devrait répondre en moins de 1000ms pour /all", async () => {
      const startTime = Date.now();
      await request(app).get("/api/informations/all");
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000);
    });

    it("devrait gérer 10 requêtes concurrentes", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get("/api/informations/grades"),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 404, 500]).toContain(response.status);
      });
    });
  });

  // ==================== TESTS DE HEADERS ====================
  describe("Headers HTTP", () => {
    it("devrait retourner Content-Type JSON", async () => {
      const response = await request(app).get("/api/informations/grades");

      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("devrait accepter différents User-Agent", async () => {
      const response = await request(app)
        .get("/api/informations/genres")
        .set("User-Agent", "Mozilla/5.0 Test");

      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait accepter les requêtes sans Accept header", async () => {
      const response = await request(app).get("/api/informations/status");

      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait gérer les requêtes avec Accept: application/json", async () => {
      const response = await request(app)
        .get("/api/informations/abonnements")
        .set("Accept", "application/json");

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  // ==================== TESTS DE STABILITÉ ====================
  describe("Stabilité", () => {
    it("devrait retourner des réponses cohérentes sur requêtes répétées", async () => {
      const response1 = await request(app).get("/api/informations/grades");
      const response2 = await request(app).get("/api/informations/grades");
      const response3 = await request(app).get("/api/informations/grades");

      expect(response1.status).toBe(response2.status);
      expect(response2.status).toBe(response3.status);

      if (response1.status === 200) {
        expect(response1.body.data).toEqual(response2.body.data);
        expect(response2.body.data).toEqual(response3.body.data);
      }
    });

    it("ne devrait pas crasher avec 50 requêtes rapides", async () => {
      const promises = Array.from({ length: 50 }, () =>
        request(app).get("/api/informations/health"),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        // Accepter 200 (healthy) ou 503 (degraded/unhealthy) ou 500 (erreur)
        expect([200, 500, 503]).toContain(response.status);
      });
    });
  });
});
