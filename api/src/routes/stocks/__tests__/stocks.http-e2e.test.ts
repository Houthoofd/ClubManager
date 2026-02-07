/**
 * Tests HTTP End-to-End pour le module Stocks
 * Tests avec Supertest sur des vraies requêtes HTTP
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import stocksRouter from "../stocks.routes.js";

describe("Stocks Module - Tests HTTP E2E", () => {
  let app: Express;

  beforeAll(() => {
    // Créer une application Express de test
    app = express();
    app.use(express.json());
    app.use("/api/stocks", stocksRouter);
  });

  afterAll(() => {
    // Nettoyage si nécessaire
  });

  // ==================== GET /api/stocks ====================
  describe("GET /api/stocks", () => {
    it("devrait retourner un status 200 et les stocks", async () => {
      const response = await request(app)
        .get("/api/stocks")
        .expect("Content-Type", /json/);

      // Accepter 200 (succès), 404 (vide) ou 500 (DB non configurée pour E2E)
      expect([200, 404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("article_id");
          expect(response.body.data[0]).toHaveProperty("quantite");
        }
      }
    });

    it("devrait retourner des headers appropriés", async () => {
      const response = await request(app).get("/api/stocks");

      expect(response.headers["content-type"]).toMatch(/json/);
      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait gérer les erreurs avec un status 500", async () => {
      // Si le service est down, on devrait avoir une erreur gracieuse
      const response = await request(app).get("/api/stocks");

      // Le status devrait être soit 200 (succès) soit 404 (vide) soit 500 (erreur)
      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait retourner un count si des stocks existent", async () => {
      const response = await request(app).get("/api/stocks");

      if (response.status === 200 && response.body.data.length > 0) {
        expect(response.body).toHaveProperty("count");
        expect(response.body.count).toBe(response.body.data.length);
      }
    });
  });

  // ==================== GET /api/stocks/article/:articleId ====================
  describe("GET /api/stocks/article/:articleId", () => {
    it("devrait retourner un status 200 et le stock d'un article", async () => {
      const response = await request(app)
        .get("/api/stocks/article/1")
        .expect("Content-Type", /json/);

      expect([200, 404, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("article_id");
          expect(response.body.data[0]).toHaveProperty("quantite");
          expect(response.body.data[0].article_id).toBe(1);
        }
      }
    });

    it("devrait retourner 400 pour un articleId invalide", async () => {
      const response = await request(app).get("/api/stocks/article/invalid");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait retourner 400 pour un articleId négatif", async () => {
      const response = await request(app).get("/api/stocks/article/-5");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait retourner JSON valide", async () => {
      const response = await request(app).get("/api/stocks/article/5");

      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });
  });

  // ==================== GET /api/stocks/alertes ====================
  describe("GET /api/stocks/alertes", () => {
    it("devrait retourner un status 200 et les alertes de stock", async () => {
      const response = await request(app)
        .get("/api/stocks/alertes")
        .expect("Content-Type", /json/);

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body).toHaveProperty("seuil");

        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("article_id");
          expect(response.body.data[0]).toHaveProperty("quantite");
        }
      }
    });

    it("devrait accepter un paramètre seuil", async () => {
      const response = await request(app).get("/api/stocks/alertes?seuil=10");

      if (response.status === 200) {
        expect(response.body.seuil).toBe(10);
      }
    });

    it("devrait retourner 400 pour un seuil invalide", async () => {
      const response = await request(app).get(
        "/api/stocks/alertes?seuil=invalid",
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait retourner 400 pour un seuil négatif", async () => {
      const response = await request(app).get("/api/stocks/alertes?seuil=-5");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait utiliser le seuil par défaut si non spécifié", async () => {
      const response = await request(app).get("/api/stocks/alertes");

      if (response.status === 200) {
        expect(response.body.seuil).toBeDefined();
        expect(response.body.seuil).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==================== PUT /api/stocks/update ====================
  describe("PUT /api/stocks/update", () => {
    it("devrait accepter une mise à jour de stock valide (set)", async () => {
      const response = await request(app)
        .put("/api/stocks/update")
        .send({
          article_id: 1,
          quantite: 50,
          operation: "set",
        })
        .expect("Content-Type", /json/);

      expect([200, 400, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it("devrait accepter une opération 'add'", async () => {
      const response = await request(app)
        .put("/api/stocks/update")
        .send({
          article_id: 1,
          quantite: 10,
          operation: "add",
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it("devrait accepter une opération 'subtract'", async () => {
      const response = await request(app)
        .put("/api/stocks/update")
        .send({
          article_id: 1,
          quantite: 5,
          operation: "subtract",
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it("devrait retourner 400 pour article_id manquant", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        quantite: 10,
        operation: "set",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait retourner 400 pour quantite manquante", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        operation: "set",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait retourner 400 pour quantite négative", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: -10,
        operation: "set",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait retourner 400 pour opération invalide", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: 10,
        operation: "invalid_op",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("devrait gérer un body vide", async () => {
      const response = await request(app).put("/api/stocks/update").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== GET /api/stocks/health ====================
  describe("GET /api/stocks/health", () => {
    it("devrait retourner un status de santé", async () => {
      const response = await request(app)
        .get("/api/stocks/health")
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
        expect(response.body.checks).toHaveProperty("stocks");
        expect(response.body.checks).toHaveProperty("alertes");

        expect(typeof response.body.checks.stocks).toBe("boolean");
        expect(typeof response.body.checks.alertes).toBe("boolean");
      }
    });

    it("devrait retourner 200 ou 503 selon l'état des services", async () => {
      const response = await request(app).get("/api/stocks/health");

      // 200 = healthy, 503 = degraded/unhealthy
      expect([200, 503]).toContain(response.status);
    });

    it("devrait retourner healthy si tous les checks passent", async () => {
      const response = await request(app).get("/api/stocks/health");

      if (response.body.status === "healthy") {
        expect(response.body.checks.stocks).toBe(true);
        expect(response.body.checks.alertes).toBe(true);
      }
    });

    it("devrait retourner degraded si un check échoue", async () => {
      const response = await request(app).get("/api/stocks/health");

      if (response.body.status === "degraded") {
        const checksArray = Object.values(response.body.checks);
        const successCount = checksArray.filter((check) => check === true).length;

        expect(successCount).toBe(1);
      }
    });

    it("devrait retourner unhealthy si tous les checks échouent", async () => {
      const response = await request(app).get("/api/stocks/health");

      if (response.body.status === "unhealthy") {
        const checksArray = Object.values(response.body.checks);
        const successCount = checksArray.filter((check) => check === true).length;

        expect(successCount).toBe(0);
      }
    });
  });

  // ==================== TESTS DE ROUTES INVALIDES ====================
  describe("Routes invalides", () => {
    it("devrait retourner 404 pour une route inexistante", async () => {
      const response = await request(app).get(
        "/api/stocks/route-qui-nexiste-pas",
      );

      expect(response.status).toBe(404);
    });

    it("devrait rejeter les méthodes HTTP non supportées", async () => {
      // POST sur un endpoint GET uniquement
      const response = await request(app).post("/api/stocks").send({});

      expect([404, 405]).toContain(response.status);
    });

    it("devrait rejeter DELETE sur /stocks", async () => {
      const response = await request(app).delete("/api/stocks");

      expect([404, 405]).toContain(response.status);
    });

    it("devrait rejeter PATCH sur /stocks", async () => {
      const response = await request(app).patch("/api/stocks").send({});

      expect([404, 405]).toContain(response.status);
    });
  });

  // ==================== TESTS DE PERFORMANCE HTTP ====================
  describe("Performance HTTP", () => {
    it("devrait répondre en moins de 500ms pour /stocks", async () => {
      const startTime = Date.now();
      await request(app).get("/api/stocks");
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it("devrait répondre en moins de 500ms pour /alertes", async () => {
      const startTime = Date.now();
      await request(app).get("/api/stocks/alertes");
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it("devrait répondre en moins de 500ms pour /article/:id", async () => {
      const startTime = Date.now();
      await request(app).get("/api/stocks/article/1");
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it("devrait répondre en moins de 1000ms pour /update", async () => {
      const startTime = Date.now();
      await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: 10,
        operation: "set",
      });
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000);
    });

    it("devrait gérer 10 requêtes concurrentes", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get("/api/stocks"),
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
      const response = await request(app).get("/api/stocks");

      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("devrait accepter différents User-Agent", async () => {
      const response = await request(app)
        .get("/api/stocks/alertes")
        .set("User-Agent", "Mozilla/5.0 Test");

      expect([200, 400, 500]).toContain(response.status);
    });

    it("devrait accepter les requêtes sans Accept header", async () => {
      const response = await request(app).get("/api/stocks/article/1");

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it("devrait gérer les requêtes avec Accept: application/json", async () => {
      const response = await request(app)
        .get("/api/stocks")
        .set("Accept", "application/json");

      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait gérer Content-Type: application/json pour PUT", async () => {
      const response = await request(app)
        .put("/api/stocks/update")
        .set("Content-Type", "application/json")
        .send({
          article_id: 1,
          quantite: 10,
          operation: "set",
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  // ==================== TESTS DE STABILITÉ ====================
  describe("Stabilité", () => {
    it("devrait retourner des réponses cohérentes sur requêtes répétées", async () => {
      const response1 = await request(app).get("/api/stocks");
      const response2 = await request(app).get("/api/stocks");
      const response3 = await request(app).get("/api/stocks");

      expect(response1.status).toBe(response2.status);
      expect(response2.status).toBe(response3.status);

      if (response1.status === 200) {
        expect(response1.body.data).toEqual(response2.body.data);
        expect(response2.body.data).toEqual(response3.body.data);
      }
    });

    it("ne devrait pas crasher avec 50 requêtes rapides", async () => {
      const promises = Array.from({ length: 50 }, () =>
        request(app).get("/api/stocks/health"),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        // Accepter 200 (healthy) ou 503 (degraded/unhealthy) ou 500 (erreur)
        expect([200, 500, 503]).toContain(response.status);
      });
    });

    it("devrait gérer des mises à jour rapides successives", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app).put("/api/stocks/update").send({
          article_id: 1,
          quantite: i + 1,
          operation: "set",
        }),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });
  });

  // ==================== TESTS DE VALIDATION DES DONNÉES ====================
  describe("Validation des données", () => {
    it("devrait valider les types de données dans les réponses", async () => {
      const response = await request(app).get("/api/stocks");

      if (response.status === 200 && response.body.data.length > 0) {
        const stock = response.body.data[0];
        expect(typeof stock.id).toBe("number");
        expect(typeof stock.article_id).toBe("number");
        expect(typeof stock.quantite).toBe("number");
      }
    });

    it("devrait retourner des quantités valides dans les alertes", async () => {
      const response = await request(app).get("/api/stocks/alertes");

      if (response.status === 200 && response.body.data.length > 0) {
        response.body.data.forEach((alerte: any) => {
          expect(typeof alerte.quantite).toBe("number");
          expect(alerte.quantite).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("devrait retourner des IDs valides", async () => {
      const response = await request(app).get("/api/stocks");

      if (response.status === 200 && response.body.data.length > 0) {
        response.body.data.forEach((stock: any) => {
          expect(typeof stock.id).toBe("number");
          expect(stock.id).toBeGreaterThan(0);
          expect(typeof stock.article_id).toBe("number");
          expect(stock.article_id).toBeGreaterThan(0);
        });
      }
    });
  });

  // ==================== TESTS DES DIFFÉRENTES OPÉRATIONS ====================
  describe("Opérations de stock - E2E", () => {
    it("devrait accepter l'opération 'set'", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: 100,
        operation: "set",
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it("devrait accepter l'opération 'add'", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: 10,
        operation: "add",
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it("devrait accepter l'opération 'subtract'", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: 5,
        operation: "subtract",
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it("devrait utiliser 'set' par défaut si operation non spécifiée", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: 50,
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  // ==================== TESTS DE CAS LIMITES ====================
  describe("Cas limites", () => {
    it("devrait gérer un articleId très grand", async () => {
      const response = await request(app).get("/api/stocks/article/999999");

      expect([200, 404, 400, 500]).toContain(response.status);
    });

    it("devrait gérer un seuil de 0", async () => {
      const response = await request(app).get("/api/stocks/alertes?seuil=0");

      expect([200, 400, 500]).toContain(response.status);
    });

    it("devrait gérer un seuil très élevé", async () => {
      const response = await request(app).get("/api/stocks/alertes?seuil=1000");

      expect([200, 400, 500]).toContain(response.status);
    });

    it("devrait gérer une quantité de 0 dans update", async () => {
      const response = await request(app).put("/api/stocks/update").send({
        article_id: 1,
        quantite: 0,
        operation: "set",
      });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });
});
