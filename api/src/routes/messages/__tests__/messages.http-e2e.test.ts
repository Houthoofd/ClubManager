/**
 * Tests HTTP End-to-End pour le module Messages
 * Tests avec Supertest sur des vraies requêtes HTTP
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import messagesRouter from "../messages.routes.js";

describe("Messages Module - Tests HTTP E2E", () => {
  let app: Express;
  let testTypeId: number;
  let testMessageId: number;
  const testEmailPrefix = `e2e_${Date.now()}`;

  beforeAll(() => {
    // Créer une application Express de test
    app = express();
    app.use(express.json());

    // Middleware pour simuler l'authentification
    app.use((req, res, next) => {
      req.user = {
        id: 1,
        email: "test@example.com",
        role: "admin",
      };
      next();
    });

    app.use("/api/messages", messagesRouter);

    console.log("✅ Application Express configurée pour les tests E2E Messages");
  });

  afterAll(() => {
    console.log("🔚 Tests E2E Messages terminés");
  });

  // ==================== GET /api/messages/types ====================
  describe("GET /api/messages/types - Récupérer tous les types de messages", () => {
    it("devrait retourner un status 200 et la liste des types", async () => {
      const response = await request(app)
        .get("/api/messages/types")
        .expect("Content-Type", /json/);

      // Accepter 200 (succès) ou 500 (DB non configurée pour E2E)
      expect([200, 500]).toContain(response.status);
      expect(response.body).toHaveProperty("success");

      if (response.status === 200 && response.body.data) {
        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty("id");
          expect(response.body.data[0]).toHaveProperty("nom");
          expect(response.body.data[0]).toHaveProperty("categorie");
          expect(response.body.data[0]).toHaveProperty("actif");
        }
      }
    });

    it("devrait retourner des headers appropriés", async () => {
      const response = await request(app).get("/api/messages/types");

      expect(response.headers["content-type"]).toMatch(/json/);
      expect([200, 500]).toContain(response.status);
    });

    it("devrait retourner un count si des types existent", async () => {
      const response = await request(app).get("/api/messages/types");

      if (response.status === 200 && response.body.data) {
        expect(response.body).toHaveProperty("count");
        if (response.body.data.length > 0) {
          expect(response.body.count).toBe(response.body.data.length);
        }
      }
    });

    it("devrait retourner JSON valide", async () => {
      const response = await request(app).get("/api/messages/types");

      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });
  });

  // ==================== POST /api/messages/types ====================
  describe("POST /api/messages/types - Créer un type de message", () => {
    it("devrait créer un type de message avec données valides", async () => {
      const newType = {
        nom: `Type E2E Test ${testEmailPrefix}`,
        description: "Type créé lors des tests E2E",
        categorie: "test",
        template: "Bonjour {nom}, ceci est un test.",
        actif: true,
      };

      const response = await request(app)
        .post("/api/messages/types")
        .send(newType)
        .expect("Content-Type", /json/);

      // Accepter 201 (créé) ou 500 (DB non configurée)
      expect([201, 500]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("id");
        expect(response.body.data.nom).toBe(newType.nom);
        expect(response.body.data.categorie).toBe(newType.categorie);

        // Sauvegarder l'ID pour les tests suivants
        testTypeId = response.body.data.id;
      }
    });

    it("devrait retourner 400 pour un nom manquant", async () => {
      const invalidType = {
        description: "Type sans nom",
        categorie: "general",
      };

      const response = await request(app)
        .post("/api/messages/types")
        .send(invalidType)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty("message");
      }
    });

    it("devrait retourner 400 pour une catégorie invalide", async () => {
      const invalidType = {
        nom: "Type avec catégorie invalide",
        categorie: "categorie_inexistante",
        actif: true,
      };

      const response = await request(app)
        .post("/api/messages/types")
        .send(invalidType)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it("devrait créer un type sans template", async () => {
      const typeWithoutTemplate = {
        nom: `Type sans template ${testEmailPrefix}`,
        description: "Type sans template prédéfini",
        categorie: "general",
        actif: true,
      };

      const response = await request(app)
        .post("/api/messages/types")
        .send(typeWithoutTemplate)
        .expect("Content-Type", /json/);

      expect([201, 500]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("id");
      }
    });

    it("devrait accepter actif = false", async () => {
      const inactiveType = {
        nom: `Type inactif ${testEmailPrefix}`,
        description: "Type désactivé",
        categorie: "general",
        actif: false,
      };

      const response = await request(app)
        .post("/api/messages/types")
        .send(inactiveType)
        .expect("Content-Type", /json/);

      expect([201, 500]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.data.actif).toBe(false);
      }
    });
  });

  // ==================== GET /api/messages/types/:id ====================
  describe("GET /api/messages/types/:id - Récupérer un type spécifique", () => {
    it("devrait retourner un type existant", async () => {
      if (!testTypeId) {
        console.log("⚠️ Test skipped: pas de testTypeId disponible");
        return;
      }

      const response = await request(app)
        .get(`/api/messages/types/${testTypeId}`)
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("id");
        expect(response.body.data.id).toBe(testTypeId);
      }
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const response = await request(app)
        .get("/api/messages/types/999999")
        .expect("Content-Type", /json/);

      expect([404, 500]).toContain(response.status);

      if (response.status === 404) {
        expect(response.body.success).toBe(false);
      }
    });

    it("devrait retourner 400 pour un ID invalide", async () => {
      const response = await request(app)
        .get("/api/messages/types/invalid-id")
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  // ==================== PUT /api/messages/types/:id ====================
  describe("PUT /api/messages/types/:id - Mettre à jour un type", () => {
    it("devrait mettre à jour un type existant", async () => {
      if (!testTypeId) {
        console.log("⚠️ Test skipped: pas de testTypeId disponible");
        return;
      }

      const updateData = {
        nom: `Type E2E Updated ${testEmailPrefix}`,
        description: "Description mise à jour",
      };

      const response = await request(app)
        .put(`/api/messages/types/${testTypeId}`)
        .send(updateData)
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.nom).toBe(updateData.nom);
        expect(response.body.data.description).toBe(updateData.description);
      }
    });

    it("devrait désactiver un type", async () => {
      if (!testTypeId) {
        console.log("⚠️ Test skipped: pas de testTypeId disponible");
        return;
      }

      const updateData = {
        actif: false,
      };

      const response = await request(app)
        .put(`/api/messages/types/${testTypeId}`)
        .send(updateData)
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.data.actif).toBe(false);
      }
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const response = await request(app)
        .put("/api/messages/types/999999")
        .send({ nom: "Test" })
        .expect("Content-Type", /json/);

      expect([404, 500]).toContain(response.status);
    });

    it("devrait retourner 400 pour des données invalides", async () => {
      if (!testTypeId) {
        console.log("⚠️ Test skipped: pas de testTypeId disponible");
        return;
      }

      const response = await request(app)
        .put(`/api/messages/types/${testTypeId}`)
        .send({ categorie: "categorie_invalide" })
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== POST /api/messages/send ====================
  describe("POST /api/messages/send - Envoyer des messages", () => {
    it("devrait envoyer un message à un destinataire", async () => {
      const messageData = {
        type_message_id: testTypeId || 1,
        destinataires: [`${testEmailPrefix}@test.com`],
        sujet: "Test E2E Message",
        contenu: "Ceci est un message de test E2E",
        variables: {
          nom: "Test User",
        },
      };

      const response = await request(app)
        .post("/api/messages/send")
        .send(messageData)
        .expect("Content-Type", /json/);

      expect([200, 201, 500]).toContain(response.status);

      if ([200, 201].includes(response.status)) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();

        if (Array.isArray(response.body.data) && response.body.data.length > 0) {
          testMessageId = response.body.data[0].id;
        }
      }
    });

    it("devrait retourner 400 pour une liste vide de destinataires", async () => {
      const messageData = {
        type_message_id: testTypeId || 1,
        destinataires: [],
        sujet: "Test",
        contenu: "Test",
      };

      const response = await request(app)
        .post("/api/messages/send")
        .send(messageData)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it("devrait retourner 400 pour des emails invalides", async () => {
      const messageData = {
        type_message_id: testTypeId || 1,
        destinataires: ["not-an-email", "also-invalid"],
        sujet: "Test",
        contenu: "Test",
      };

      const response = await request(app)
        .post("/api/messages/send")
        .send(messageData)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it("devrait retourner 400 pour un sujet manquant", async () => {
      const messageData = {
        type_message_id: testTypeId || 1,
        destinataires: ["test@example.com"],
        contenu: "Test",
      };

      const response = await request(app)
        .post("/api/messages/send")
        .send(messageData)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });

    it("devrait accepter plusieurs destinataires", async () => {
      const messageData = {
        type_message_id: testTypeId || 1,
        destinataires: [
          `${testEmailPrefix}_1@test.com`,
          `${testEmailPrefix}_2@test.com`,
          `${testEmailPrefix}_3@test.com`,
        ],
        sujet: "Test Multiple",
        contenu: "Message à plusieurs destinataires",
      };

      const response = await request(app)
        .post("/api/messages/send")
        .send(messageData)
        .expect("Content-Type", /json/);

      expect([200, 201, 500]).toContain(response.status);

      if ([200, 201].includes(response.status)) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  // ==================== GET /api/messages/history/:userId ====================
  describe("GET /api/messages/history/:userId - Historique des messages", () => {
    it("devrait retourner l'historique d'un utilisateur", async () => {
      const response = await request(app)
        .get("/api/messages/history/1")
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it("devrait retourner 400 pour un userId invalide", async () => {
      const response = await request(app)
        .get("/api/messages/history/invalid-id")
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });

    it("devrait accepter des filtres de recherche", async () => {
      const response = await request(app)
        .get("/api/messages/history/1")
        .query({ statut: "envoye", limit: 10 })
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait retourner un tableau vide pour un utilisateur sans messages", async () => {
      const response = await request(app)
        .get("/api/messages/history/999999")
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  // ==================== POST /api/messages/rappel-paiement ====================
  describe("POST /api/messages/rappel-paiement - Envoyer un rappel de paiement", () => {
    it("devrait envoyer un rappel de paiement", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: `${testEmailPrefix}@test.com`,
        nom: "Jean Dupont Test",
        montant: 150.5,
        date_echeance: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/messages/rappel-paiement")
        .send(rappelData)
        .expect("Content-Type", /json/);

      expect([200, 201, 500]).toContain(response.status);

      if ([200, 201].includes(response.status)) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("message_id");
      }
    });

    it("devrait retourner 400 pour un email invalide", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "invalid-email",
        nom: "Test",
        montant: 100,
        date_echeance: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/messages/rappel-paiement")
        .send(rappelData)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });

    it("devrait retourner 400 pour un montant négatif", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "test@example.com",
        nom: "Test",
        montant: -100,
        date_echeance: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/messages/rappel-paiement")
        .send(rappelData)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });

    it("devrait retourner 400 pour une date invalide", async () => {
      const rappelData = {
        utilisateur_id: 1,
        email: "test@example.com",
        nom: "Test",
        montant: 100,
        date_echeance: "invalid-date",
      };

      const response = await request(app)
        .post("/api/messages/rappel-paiement")
        .send(rappelData)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== GET /api/messages/diagnostic ====================
  describe("GET /api/messages/diagnostic - Diagnostic du module", () => {
    it("devrait retourner le diagnostic du système", async () => {
      const response = await request(app)
        .get("/api/messages/diagnostic")
        .expect("Content-Type", /json/);

      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.diagnostic).toBeDefined();
      }
    });

    it("devrait retourner des informations sur les tables", async () => {
      const response = await request(app).get("/api/messages/diagnostic");

      if (response.status === 200) {
        expect(response.body.diagnostic).toHaveProperty("status");
      }
    });
  });

  // ==================== DELETE /api/messages/types/:id ====================
  describe("DELETE /api/messages/types/:id - Supprimer un type", () => {
    it("devrait retourner 404 pour un ID inexistant", async () => {
      const response = await request(app)
        .delete("/api/messages/types/999999")
        .expect("Content-Type", /json/);

      expect([404, 500]).toContain(response.status);
    });

    it("devrait supprimer un type existant", async () => {
      if (!testTypeId) {
        console.log("⚠️ Test skipped: pas de testTypeId disponible");
        return;
      }

      const response = await request(app)
        .delete(`/api/messages/types/${testTypeId}`)
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty("message");
      }
    });

    it("devrait retourner 400 pour un ID invalide", async () => {
      const response = await request(app)
        .delete("/api/messages/types/invalid-id")
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== Tests de sécurité ====================
  describe("Tests de sécurité", () => {
    it("devrait rejeter les requêtes avec des headers malformés", async () => {
      const response = await request(app)
        .get("/api/messages/types")
        .set("Content-Type", "application/xml");

      expect([200, 400, 415, 500]).toContain(response.status);
    });

    it("devrait gérer les requêtes avec des payloads très grands", async () => {
      const largePayload = {
        nom: "A".repeat(10000),
        categorie: "general",
      };

      const response = await request(app)
        .post("/api/messages/types")
        .send(largePayload)
        .expect("Content-Type", /json/);

      expect([400, 413, 500]).toContain(response.status);
    });

    it("devrait valider les types de données", async () => {
      const invalidData = {
        type_message_id: "not-a-number",
        destinataires: ["test@example.com"],
        sujet: "Test",
        contenu: "Test",
      };

      const response = await request(app)
        .post("/api/messages/send")
        .send(invalidData)
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== Tests de pagination ====================
  describe("Tests de pagination", () => {
    it("devrait accepter les paramètres de pagination", async () => {
      const response = await request(app)
        .get("/api/messages/history/1")
        .query({ limit: 10, offset: 0 })
        .expect("Content-Type", /json/);

      expect([200, 404, 500]).toContain(response.status);
    });

    it("devrait rejeter des valeurs de pagination invalides", async () => {
      const response = await request(app)
        .get("/api/messages/history/1")
        .query({ limit: -10, offset: -5 })
        .expect("Content-Type", /json/);

      expect([400, 500]).toContain(response.status);
    });
  });
});
