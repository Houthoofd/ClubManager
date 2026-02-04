/**
 * Tests E2E HTTP pour le module Inscription
 * Tests de bout en bout avec Supertest simulant de vraies requêtes HTTP
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import inscriptionRouter from "../inscription.routes.js";
import { InscriptionService } from "../core/services/inscription.service.js";

describe("Inscription Module - Tests E2E HTTP", () => {
  let app: Express;
  const testEmailPrefix = `e2e_${Date.now()}`;

  beforeAll(() => {
    // Créer une application Express pour les tests
    app = express();
    app.use(express.json());
    app.use("/api/inscription", inscriptionRouter);

    console.log("✅ Application Express configurée pour les tests E2E");
  });

  afterAll(() => {
    console.log("🔚 Tests E2E terminés");
  });

  // ==================== VÉRIFICATION EMAIL ====================
  describe("POST /api/inscription/verification - Tests E2E", () => {
    it("devrait retourner 200 pour un email valide", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: `${testEmailPrefix}_valid@test.com`,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("exists");
    });

    it("devrait retourner 400 pour un email invalide", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: "not-an-email",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty("message");
    });

    it("devrait retourner 400 pour un email manquant", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({})
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait accepter un email avec des caractères spéciaux", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: `${testEmailPrefix}+tag.test@example-domain.com`,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success");
    });

    it("devrait normaliser l'email en minuscules", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: "TEST@EXAMPLE.COM",
        })
        .expect(200);

      expect(response.body).toHaveProperty("success");
    });

    it("devrait trim les espaces autour de l'email", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: "  test@example.com  ",
        })
        .expect(200);

      expect(response.body).toHaveProperty("success");
    });

    it("devrait rejeter un email trop court", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: "a@b",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait rejeter un email trop long (> 255 caractères)", async () => {
      const longEmail = `${"a".repeat(250)}@example.com`;

      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: longEmail,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait gérer les requêtes sans Content-Type", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: `${testEmailPrefix}@test.com`,
        })
        .expect(200);

      expect(response.body).toHaveProperty("success");
    });
  });

  // ==================== INSCRIPTION COMPLÈTE ====================
  describe("POST /api/inscription/validation - Tests E2E", () => {
    it("devrait créer un nouvel utilisateur avec données valides", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: `${testEmailPrefix}_new@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("userId");
      expect(response.body.userId).toBeGreaterThan(0);
    });

    it("devrait retourner 400 pour des données invalides", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "",
          prenom: "",
          email: "invalid",
          password: "weak",
          date: "invalid",
          abonnement: -1,
          genre: 0,
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });

    it("devrait retourner 400 pour un nom manquant", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          prenom: "Jean",
          email: `${testEmailPrefix}_noname@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait retourner 400 pour un email invalide", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: "not-an-email",
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/email/i);
    });

    it("devrait retourner 400 pour un mot de passe faible", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: `${testEmailPrefix}_weak@test.com`,
          password: "weak",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/mot de passe|password/i);
    });

    it("devrait retourner 400 pour un âge inférieur à 5 ans", async () => {
      const today = new Date();
      const twoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate()
      );

      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Bébé",
          email: `${testEmailPrefix}_tooyoung@test.com`,
          password: "SecureP@ss123",
          date: twoYearsAgo.toISOString().split("T")[0],
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/âge|ans/i);
    });

    it("devrait accepter un utilisateur de 5 ans (âge minimum)", async () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate()
      );

      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Enfant",
          email: `${testEmailPrefix}_minage@test.com`,
          password: "SecureP@ss123",
          date: fiveYearsAgo.toISOString().split("T")[0],
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("devrait accepter différents genres", async () => {
      const genres = [1, 2];

      for (const genre of genres) {
        const response = await request(app)
          .post("/api/inscription/validation")
          .send({
            nom: "TestGenre",
            prenom: "User",
            email: `${testEmailPrefix}_genre_${genre}@test.com`,
            password: "SecureP@ss123",
            date: "1990-01-01",
            abonnement: 1,
            genre: genre,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it("devrait accepter différents abonnements", async () => {
      const abonnements = [1, 2, 3];

      for (const abonnement of abonnements) {
        const response = await request(app)
          .post("/api/inscription/validation")
          .send({
            nom: "TestAbo",
            prenom: "User",
            email: `${testEmailPrefix}_abo_${abonnement}@test.com`,
            password: "SecureP@ss123",
            date: "1990-01-01",
            abonnement: abonnement,
            genre: 1,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it("devrait normaliser le nom et prénom (trim)", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "  Dupont  ",
          prenom: "  Jean  ",
          email: `${testEmailPrefix}_trim@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("devrait normaliser l'email en minuscules", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: `${testEmailPrefix}_UPPERCASE@TEST.COM`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("devrait accepter des noms avec accents", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Müller",
          prenom: "François",
          email: `${testEmailPrefix}_accents@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("devrait accepter des noms avec apostrophes", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "O'Connor",
          prenom: "D'Artagnan",
          email: `${testEmailPrefix}_apostrophe@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("devrait accepter des noms avec traits d'union", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont-Durand",
          prenom: "Marie-Claire",
          email: `${testEmailPrefix}_hyphen@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it("devrait rejeter des noms avec chiffres", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont123",
          prenom: "Jean",
          email: `${testEmailPrefix}_numbers@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait rejeter une tentative d'injection SQL", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "'; DROP TABLE users; --",
          prenom: "Jean",
          email: `${testEmailPrefix}_sql@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait rejeter une tentative XSS", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "<script>alert('xss')</script>",
          prenom: "Jean",
          email: `${testEmailPrefix}_xss@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait gérer un body vide", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("devrait gérer un JSON malformé", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .set("Content-Type", "application/json")
        .send("{ invalid json")
        .expect(400);

      // Express middleware devrait gérer l'erreur de parsing
    });
  });

  // ==================== FLUX COMPLET ====================
  describe("Flux complet - Vérification puis inscription", () => {
    it("devrait suivre le flux complet: vérifier puis inscrire", async () => {
      const email = `${testEmailPrefix}_fullflow@test.com`;

      // 1. Vérifier que l'email n'existe pas
      const verificationResponse = await request(app)
        .post("/api/inscription/verification")
        .send({ email })
        .expect(200);

      expect(verificationResponse.body.exists).toBe(false);

      // 2. Inscrire l'utilisateur
      const inscriptionResponse = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: email,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      expect(inscriptionResponse.body.success).toBe(true);
      expect(inscriptionResponse.body.userId).toBeDefined();
    });

    it("devrait détecter un email existant après inscription", async () => {
      const email = `${testEmailPrefix}_exists@test.com`;

      // 1. Première inscription
      await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: email,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(201);

      // 2. Vérifier que l'email existe maintenant
      const verificationResponse = await request(app)
        .post("/api/inscription/verification")
        .send({ email })
        .expect(409);

      expect(verificationResponse.body.exists).toBe(true);

      // 3. Tenter une deuxième inscription avec le même email
      const duplicateResponse = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jacques",
          email: email,
          password: "SecureP@ss123",
          date: "1985-05-20",
          abonnement: 2,
          genre: 1,
        })
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.message).toMatch(/existe/i);
    });
  });

  // ==================== HEADERS ET CORS ====================
  describe("Headers HTTP", () => {
    it("devrait retourner le bon Content-Type", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .send({
          email: `${testEmailPrefix}@test.com`,
        })
        .expect(200);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("devrait accepter différents Content-Type pour le body", async () => {
      const response = await request(app)
        .post("/api/inscription/verification")
        .set("Content-Type", "application/json; charset=utf-8")
        .send({
          email: `${testEmailPrefix}@test.com`,
        })
        .expect(200);

      expect(response.body).toHaveProperty("success");
    });
  });

  // ==================== PERFORMANCE ====================
  describe("Performance HTTP", () => {
    it("devrait répondre en moins de 2 secondes", async () => {
      const startTime = Date.now();

      await request(app)
        .post("/api/inscription/verification")
        .send({
          email: `${testEmailPrefix}_perf@test.com`,
        })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it("devrait gérer plusieurs requêtes concurrentes", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post("/api/inscription/verification")
          .send({
            email: `${testEmailPrefix}_concurrent_${i}@test.com`,
          })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success");
      });
    });
  });

  // ==================== SÉCURITÉ ====================
  describe("Sécurité HTTP", () => {
    it("ne devrait pas exposer le mot de passe dans la réponse", async () => {
      const password = "MySecretP@ss123";

      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: `${testEmailPrefix}_nopassleak@test.com`,
          password: password,
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        });

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain(password);
    });

    it("ne devrait pas exposer de stack trace en production", async () => {
      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: "Dupont",
          prenom: "Jean",
          email: "invalid",
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        })
        .expect(400);

      expect(response.body).not.toHaveProperty("stack");
      expect(response.body).not.toHaveProperty("trace");
    });

    it("devrait rejeter les payloads trop volumineux", async () => {
      const largeString = "A".repeat(1000000); // 1MB

      const response = await request(app)
        .post("/api/inscription/validation")
        .send({
          nom: largeString,
          prenom: "Jean",
          email: `${testEmailPrefix}@test.com`,
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        });

      // Devrait rejeter ou tronquer
      expect([400, 413]).toContain(response.status);
    });
  });
});
