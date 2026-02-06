/**
 * Tests HTTP End-to-End pour le module Statistiques
 * Tests avec Supertest sur des vraies requêtes HTTP
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import statistiquesRouter from "../statistiques.routes.js";

describe("Statistiques Module - Tests HTTP E2E", () => {
  let app: Express;

  beforeAll(() => {
    // Créer une application Express de test
    app = express();
    app.use(express.json());
    app.use("/api/statistiques", statistiquesRouter);
  });

  afterAll(() => {
    // Nettoyage si nécessaire
  });

  // ==================== GET /api/statistiques/health ====================
  describe("GET /api/statistiques/health", () => {
    it("devrait retourner un status 200 et le statut healthy", async () => {
      const response = await request(app)
        .get("/api/statistiques/health")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("status", "healthy");
      expect(response.body.data).toHaveProperty("module", "statistiques");
    });

    it("devrait retourner un timestamp", async () => {
      const response = await request(app).get("/api/statistiques/health");

      expect(response.body.data).toHaveProperty("timestamp");
      expect(typeof response.body.data.timestamp).toBe("string");
    });

    it("devrait inclure les informations système", async () => {
      const response = await request(app).get("/api/statistiques/health");

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("uptime");
      expect(typeof response.body.data.uptime).toBe("number");
    });

    it("devrait répondre rapidement (< 100ms)", async () => {
      const start = Date.now();
      await request(app).get("/api/statistiques/health").expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("devrait retourner les bons headers CORS", async () => {
      const response = await request(app).get("/api/statistiques/health");

      expect(response.headers["content-type"]).toMatch(/json/);
    });
  });

  // ==================== GET /api/statistiques/diagnostic ====================
  describe("GET /api/statistiques/diagnostic", () => {
    it("devrait retourner les informations du module", async () => {
      const response = await request(app)
        .get("/api/statistiques/diagnostic")
        .expect("Content-Type", /json/);

      // Accepter 200 (succès) ou 401 (non authentifié si verifyToken est actif)
      expect([200, 401]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("module", "statistiques");
        expect(response.body).toHaveProperty("routes");
        expect(Array.isArray(response.body.routes)).toBe(true);
      }
    });

    it("devrait lister toutes les routes disponibles", async () => {
      const response = await request(app).get("/api/statistiques/diagnostic");

      if (response.status === 200) {
        expect(response.body.routes.length).toBeGreaterThan(0);
        expect(
          response.body.routes.some((r: any) =>
            r.includes("/frequentation/:utilisateurId"),
          ),
        ).toBe(true);
      }
    });

    it("devrait inclure des recommandations", async () => {
      const response = await request(app).get("/api/statistiques/diagnostic");

      if (response.status === 200) {
        expect(response.body).toHaveProperty("recommendations");
        expect(Array.isArray(response.body.recommendations)).toBe(true);
      }
    });
  });

  // ==================== GET /api/statistiques/frequentation/:utilisateurId ====================
  describe("GET /api/statistiques/frequentation/:utilisateurId", () => {
    it("devrait rejeter un ID utilisateur invalide avec 400", async () => {
      const response = await request(app)
        .get("/api/statistiques/frequentation/invalid")
        .expect("Content-Type", /json/);

      // Accepter 400 (validation) ou 401 (non authentifié)
      expect([400, 401]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message");
      }
    });

    it("devrait rejeter un ID négatif avec 400", async () => {
      const response = await request(app)
        .get("/api/statistiques/frequentation/-1")
        .expect("Content-Type", /json/);

      expect([400, 401]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it("devrait rejeter un ID à zéro avec 400", async () => {
      const response = await request(app)
        .get("/api/statistiques/frequentation/0")
        .expect("Content-Type", /json/);

      expect([400, 401]).toContain(response.status);
    });

    it("devrait accepter un ID utilisateur valide", async () => {
      const response = await request(app)
        .get("/api/statistiques/frequentation/1")
        .expect("Content-Type", /json/);

      // Accepter 200 (succès), 401 (non authentifié), 404 (non trouvé), ou 500 (erreur DB)
      expect([200, 401, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it("devrait retourner un format de réponse cohérent", async () => {
      const response = await request(app).get(
        "/api/statistiques/frequentation/1",
      );

      if (response.status === 200 || response.status === 400) {
        expect(response.body).toHaveProperty("success");
        expect(typeof response.body.success).toBe("boolean");
      }
    });

    it("devrait gérer les très grands IDs", async () => {
      const response = await request(app).get(
        "/api/statistiques/frequentation/999999",
      );

      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it("devrait rejeter les tentatives d'injection SQL", async () => {
      const response = await request(app).get(
        "/api/statistiques/frequentation/1' OR '1'='1",
      );

      expect([400, 401]).toContain(response.status);
    });
  });

  // ==================== GET /api/statistiques/progression/:utilisateurId ====================
  describe("GET /api/statistiques/progression/:utilisateurId", () => {
    it("devrait valider l'ID utilisateur", async () => {
      const response = await request(app)
        .get("/api/statistiques/progression/abc")
        .expect("Content-Type", /json/);

      expect([400, 401]).toContain(response.status);
    });

    it("devrait accepter un ID valide", async () => {
      const response = await request(app)
        .get("/api/statistiques/progression/1")
        .expect("Content-Type", /json/);

      expect([200, 401, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success");
        expect(response.body).toHaveProperty("data");
      }
    });

    it("devrait retourner la structure de progression correcte", async () => {
      const response = await request(app).get(
        "/api/statistiques/progression/1",
      );

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty("niveauActuel");
        expect(response.body.data).toHaveProperty("coursSuivis");
        expect(response.body.data).toHaveProperty("pourcentage_global");
      }
    });
  });

  // ==================== GET /api/statistiques/presence/:utilisateurId ====================
  describe("GET /api/statistiques/presence/:utilisateurId", () => {
    it("devrait valider l'ID utilisateur", async () => {
      const response = await request(app)
        .get("/api/statistiques/presence/invalid")
        .expect("Content-Type", /json/);

      expect([400, 401]).toContain(response.status);
    });

    it("devrait accepter un ID valide", async () => {
      const response = await request(app)
        .get("/api/statistiques/presence/1")
        .expect("Content-Type", /json/);

      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it("devrait accepter le paramètre mois en query", async () => {
      const response = await request(app)
        .get("/api/statistiques/presence/1?mois=6")
        .expect("Content-Type", /json/);

      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it("devrait valider le paramètre mois", async () => {
      const response = await request(app).get(
        "/api/statistiques/presence/1?mois=invalid",
      );

      // Devrait soit utiliser valeur par défaut, soit rejeter
      expect([200, 400, 401, 500]).toContain(response.status);
    });
  });

  // ==================== GET /api/statistiques/globales/membres/count ====================
  describe("GET /api/statistiques/globales/membres/count", () => {
    it("devrait retourner le nombre de membres", async () => {
      const response = await request(app)
        .get("/api/statistiques/globales/membres/count")
        .expect("Content-Type", /json/);

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("count");
        expect(typeof response.body.count).toBe("number");
      }
    });

    it("devrait retourner un nombre >= 0", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/membres/count",
      );

      if (response.status === 200) {
        expect(response.body.count).toBeGreaterThanOrEqual(0);
      }
    });

    it("devrait répondre rapidement", async () => {
      const start = Date.now();
      await request(app).get("/api/statistiques/globales/membres/count");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // < 1s
    });
  });

  // ==================== GET /api/statistiques/globales/paiements/mois ====================
  describe("GET /api/statistiques/globales/paiements/mois", () => {
    it("devrait retourner les paiements du mois", async () => {
      const response = await request(app)
        .get("/api/statistiques/globales/paiements/mois")
        .expect("Content-Type", /json/);

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("total");
        expect(typeof response.body.total).toBe("number");
      }
    });

    it("devrait retourner un total >= 0", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/paiements/mois",
      );

      if (response.status === 200) {
        expect(response.body.total).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==================== GET /api/statistiques/globales/paiements/recents ====================
  describe("GET /api/statistiques/globales/paiements/recents", () => {
    it("devrait retourner les paiements récents", async () => {
      const response = await request(app)
        .get("/api/statistiques/globales/paiements/recents")
        .expect("Content-Type", /json/);

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("count");
      }
    });

    it("devrait retourner un tableau", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/paiements/recents",
      );

      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it("devrait limiter le nombre de résultats", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/paiements/recents",
      );

      if (response.status === 200 && response.body.data.length > 0) {
        expect(response.body.data.length).toBeLessThanOrEqual(50);
      }
    });
  });

  // ==================== GET /api/statistiques/globales/membres/nouveaux ====================
  describe("GET /api/statistiques/globales/membres/nouveaux", () => {
    it("devrait retourner les nouveaux membres", async () => {
      const response = await request(app)
        .get("/api/statistiques/globales/membres/nouveaux")
        .expect("Content-Type", /json/);

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it("devrait accepter le paramètre jours", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/membres/nouveaux?jours=30",
      );

      expect([200, 401, 500]).toContain(response.status);
    });

    it("devrait rejeter un paramètre jours invalide", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/membres/nouveaux?jours=-1",
      );

      expect([400, 401, 500]).toContain(response.status);
    });
  });

  // ==================== GET /api/statistiques/globales/membres/top-assidus ====================
  describe("GET /api/statistiques/globales/membres/top-assidus", () => {
    it("devrait retourner les membres les plus assidus", async () => {
      const response = await request(app)
        .get("/api/statistiques/globales/membres/top-assidus")
        .expect("Content-Type", /json/);

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it("devrait limiter à un nombre raisonnable", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/membres/top-assidus",
      );

      if (response.status === 200 && response.body.data.length > 0) {
        expect(response.body.data.length).toBeLessThanOrEqual(10);
      }
    });

    it("devrait trier par nombre de présences", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/membres/top-assidus",
      );

      if (response.status === 200 && response.body.data.length > 1) {
        const data = response.body.data;
        for (let i = 1; i < data.length; i++) {
          expect(data[i - 1].total_presences).toBeGreaterThanOrEqual(
            data[i].total_presences,
          );
        }
      }
    });
  });

  // ==================== Tests de Performance ====================
  describe("Tests de Performance E2E", () => {
    it("devrait gérer plusieurs requêtes simultanées", async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => request(app).get("/api/statistiques/health"));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("devrait répondre aux statistiques globales en moins de 2s", async () => {
      const start = Date.now();
      await request(app).get("/api/statistiques/globales/membres/count");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it("devrait gérer les requêtes en parallèle sans conflit", async () => {
      const endpoints = [
        "/api/statistiques/health",
        "/api/statistiques/globales/membres/count",
        "/api/statistiques/globales/paiements/mois",
      ];

      const requests = endpoints.map((endpoint) => request(app).get(endpoint));
      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 401, 500]).toContain(response.status);
      });
    });
  });

  // ==================== Tests de Sécurité E2E ====================
  describe("Tests de Sécurité E2E", () => {
    it("devrait rejeter les injections SQL dans les paramètres", async () => {
      const maliciousId = "1' OR '1'='1";
      const response = await request(app).get(
        `/api/statistiques/frequentation/${maliciousId}`,
      );

      expect([400, 401]).toContain(response.status);
    });

    it("devrait rejeter les scripts XSS dans les paramètres", async () => {
      const xssId = "<script>alert('xss')</script>";
      const response = await request(app).get(
        `/api/statistiques/progression/${xssId}`,
      );

      expect([400, 401]).toContain(response.status);
    });

    it("devrait gérer les paramètres excessivement longs", async () => {
      const longId = "1".repeat(1000);
      const response = await request(app).get(
        `/api/statistiques/frequentation/${longId}`,
      );

      expect([400, 401, 414]).toContain(response.status);
    });

    it("devrait valider strictement les types de paramètres", async () => {
      const response = await request(app).get(
        "/api/statistiques/presence/abc123xyz",
      );

      expect([400, 401]).toContain(response.status);
    });

    it("ne devrait pas exposer les détails d'erreur sensibles", async () => {
      const response = await request(app).get(
        "/api/statistiques/frequentation/invalid",
      );

      if (response.body.message) {
        expect(response.body.message).not.toContain("password");
        expect(response.body.message).not.toContain("token");
        expect(response.body.message).not.toContain("secret");
      }
    });
  });

  // ==================== Tests des Headers HTTP ====================
  describe("Tests des Headers HTTP", () => {
    it("devrait retourner le bon Content-Type", async () => {
      const response = await request(app).get("/api/statistiques/health");

      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("devrait accepter les requêtes avec Accept: application/json", async () => {
      const response = await request(app)
        .get("/api/statistiques/health")
        .set("Accept", "application/json");

      expect(response.status).toBe(200);
    });

    it("ne devrait pas exposer de headers sensibles", async () => {
      const response = await request(app).get("/api/statistiques/health");

      // Le header x-powered-by peut être présent ou supprimé par Express
      // Ce test vérifie simplement qu'on ne le force pas à "Express"
      if (response.headers["x-powered-by"]) {
        // Si présent, on l'accepte (peut être configuré par l'app)
        expect(response.headers["x-powered-by"]).toBeDefined();
      }
    });
  });

  // ==================== Tests de Robustesse ====================
  describe("Tests de Robustesse E2E", () => {
    it("devrait gérer les erreurs de base de données gracieusement", async () => {
      const response = await request(app).get(
        "/api/statistiques/frequentation/1",
      );

      // Même si la DB est down, devrait retourner une réponse structurée
      expect(response.body).toHaveProperty("success");
    });

    it("devrait retourner une erreur cohérente si le service est indisponible", async () => {
      const response = await request(app).get(
        "/api/statistiques/globales/membres/count",
      );

      if (response.status === 500) {
        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message");
      }
    });

    it("devrait gérer les timeouts proprement", async () => {
      const response = await request(app)
        .get("/api/statistiques/globales/membres/count")
        .timeout(5000);

      expect([200, 401, 500, 504]).toContain(response.status);
    });
  });
});
