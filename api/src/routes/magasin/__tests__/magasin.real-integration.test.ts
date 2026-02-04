/**
 * Tests d'intégration réels pour le module Magasin
 * Tests contre une vraie base de données de test
 *
 * Ces tests nécessitent:
 * - Une base de données MySQL de test configurée
 * - Les variables d'environnement DB_TEST_* définies
 * - npm run setup:test:db exécuté avant les tests
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import magasinRouter from "../index.js";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";

// Configuration de l'application Express pour les tests
const app = express();
app.use(express.json());

// Mock du middleware d'authentification pour les tests
app.use((req, res, next) => {
  req.user = { id: 1, email: "test@example.com" };
  next();
});

app.use("/api/magasin", magasinRouter);

describe("Magasin Module - Tests d'intégration réels", () => {
  let testArticleId: number;
  let testCommandeId: number;
  let testUniqueId: string;
  let testNumeroCommande: string;
  let magasinClient: Magasin;
  let paiementsClient: Paiements;

  beforeAll(async () => {
    // Initialiser les clients
    magasinClient = new Magasin();
    paiementsClient = new Paiements();

    console.log("🔧 [Tests Réels] Préparation de la base de données de test...");

    // Nettoyer les données de test précédentes
    try {
      await paiementsClient.queryAsync(
        "DELETE FROM commandes WHERE utilisateur_id = 9999",
        []
      );
      await paiementsClient.queryAsync(
        "DELETE FROM articles WHERE nom LIKE '%TEST_%'",
        []
      );
    } catch (error) {
      console.warn("⚠️ Nettoyage préliminaire échoué (normal si première exécution)");
    }

    console.log("✅ [Tests Réels] Base de données prête");
  });

  afterAll(async () => {
    // Nettoyer les données de test après l'exécution
    console.log("🧹 [Tests Réels] Nettoyage des données de test...");

    try {
      if (testCommandeId) {
        await paiementsClient.queryAsync(
          "DELETE FROM commandes WHERE id = ?",
          [testCommandeId]
        );
      }
      if (testArticleId) {
        await paiementsClient.queryAsync(
          "DELETE FROM articles WHERE id = ?",
          [testArticleId]
        );
      }
      await paiementsClient.queryAsync(
        "DELETE FROM articles WHERE nom LIKE '%TEST_%'",
        []
      );
      await paiementsClient.queryAsync(
        "DELETE FROM commandes WHERE unique_id LIKE '%TEST%'",
        []
      );
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage:", error);
    }

    console.log("✅ [Tests Réels] Nettoyage terminé");
  });

  describe("Health Check", () => {
    it("devrait retourner le statut de santé du module", async () => {
      const response = await request(app).get("/api/magasin/health");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: "healthy",
        module: "magasin",
        version: "1.0.0",
        features: {
          articles: true,
          categories: true,
          commandes: true,
          paiements: true,
          tailles: true,
          statistiques: true,
        },
      });
    });
  });

  describe("Gestion des catégories", () => {
    it("devrait récupérer toutes les catégories", async () => {
      const response = await request(app).get("/api/magasin/articles/categories");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("nom");
      }
    });
  });

  describe("Gestion des articles", () => {
    it("devrait récupérer tous les articles par catégories", async () => {
      const response = await request(app).get("/api/magasin/articles");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("devrait créer un nouvel article", async () => {
      const nouvelArticle = {
        nom: "TEST_Kimono_Integration",
        description: "Article de test pour les tests d'intégration",
        prix: 45.99,
        stock: 10,
        categorie_id: 1,
        actif: true,
      };

      const response = await request(app)
        .post("/api/magasin/articles/ajouter")
        .send(nouvelArticle);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("succès");

      // Vérifier que l'article a été créé dans la DB
      const articles = await paiementsClient.queryAsync(
        "SELECT * FROM articles WHERE nom = ?",
        [nouvelArticle.nom]
      );

      expect(articles.length).toBeGreaterThan(0);
      testArticleId = articles[0].id;
    });

    it("devrait modifier un article existant", async () => {
      // D'abord créer un article de test
      const result = await paiementsClient.queryAsync(
        "INSERT INTO articles (nom, prix, stock, categorie_id, actif) VALUES (?, ?, ?, ?, ?)",
        ["TEST_Article_Update", 25.99, 5, 1, true]
      );

      const articleId = result.insertId;

      const modification = {
        nom: "TEST_Article_Updated",
        prix: 29.99,
      };

      const response = await request(app)
        .put(`/api/magasin/articles/${articleId}`)
        .send(modification);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");

      // Vérifier la modification dans la DB
      const articles = await paiementsClient.queryAsync(
        "SELECT * FROM articles WHERE id = ?",
        [articleId]
      );

      expect(articles[0].nom).toBe("TEST_Article_Updated");
      expect(parseFloat(articles[0].prix)).toBe(29.99);

      // Nettoyer
      await paiementsClient.queryAsync("DELETE FROM articles WHERE id = ?", [
        articleId,
      ]);
    });

    it("devrait supprimer un article", async () => {
      // Créer un article de test
      const result = await paiementsClient.queryAsync(
        "INSERT INTO articles (nom, prix, stock, categorie_id, actif) VALUES (?, ?, ?, ?, ?)",
        ["TEST_Article_Delete", 19.99, 3, 1, true]
      );

      const articleId = result.insertId;

      const response = await request(app).delete(
        `/api/magasin/articles/${articleId}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");

      // Vérifier que l'article a été supprimé
      const articles = await paiementsClient.queryAsync(
        "SELECT * FROM articles WHERE id = ?",
        [articleId]
      );

      expect(articles.length).toBe(0);
    });

    it("devrait retourner 400 pour un ID invalide", async () => {
      const response = await request(app).get("/api/magasin/articles/invalid");

      expect(response.status).toBe(400);
    });
  });

  describe("Gestion des tailles", () => {
    it("devrait récupérer toutes les tailles", async () => {
      const response = await request(app).get("/api/magasin/tailles");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("nom");
      }
    });
  });

  describe("Gestion des commandes", () => {
    it("devrait créer une nouvelle commande", async () => {
      // S'assurer qu'il existe un article pour la commande
      const articles = await paiementsClient.queryAsync(
        "SELECT id, nom, prix FROM articles WHERE actif = 1 LIMIT 1",
        []
      );

      expect(articles.length).toBeGreaterThan(0);

      const nouvelleCommande = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: articles[0].id,
            nom: articles[0].nom,
            quantite: 1,
            taille: "M",
            prix: parseFloat(articles[0].prix),
          },
        ],
        total: parseFloat(articles[0].prix),
        statut: "en attente",
        date: new Date().toISOString(),
      };

      const response = await request(app)
        .post("/api/magasin/commandes/ajouter")
        .send(nouvelleCommande);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("commande");
      expect(response.body.commande).toHaveProperty("unique_id");
      expect(response.body.commande).toHaveProperty("numero_commande");
      expect(response.body.commande.unique_id).toMatch(
        /^CMD-\d{3}-\d+-[A-F0-9]{8}$/
      );
      expect(response.body.commande.numero_commande).toMatch(/^CMD-\d{6}$/);

      testUniqueId = response.body.commande.unique_id;
      testNumeroCommande = response.body.commande.numero_commande;

      // Vérifier dans la DB
      const commandes = await paiementsClient.queryAsync(
        "SELECT * FROM commandes WHERE unique_id = ?",
        [testUniqueId]
      );

      expect(commandes.length).toBe(1);
      testCommandeId = commandes[0].id;
    });

    it("devrait récupérer toutes les commandes", async () => {
      const response = await request(app).get("/api/magasin/commandes");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("commandes");
      expect(Array.isArray(response.body.commandes)).toBe(true);
    });

    it("devrait vérifier l'unicité d'une commande existante", async () => {
      if (!testUniqueId) {
        // Créer une commande de test si nécessaire
        const articles = await paiementsClient.queryAsync(
          "SELECT id FROM articles WHERE actif = 1 LIMIT 1",
          []
        );

        const result = await paiementsClient.queryAsync(
          "INSERT INTO commandes (utilisateur_id, unique_id, numero_commande, total, statut, date) VALUES (?, ?, ?, ?, ?, NOW())",
          [1, "CMD-001-1234567890-TEST1234", "CMD-999999", 50.0, "en attente"]
        );

        testUniqueId = "CMD-001-1234567890-TEST1234";
        testCommandeId = result.insertId;
      }

      const response = await request(app).get(
        `/api/magasin/commande/${testUniqueId}/verify`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("exists", true);
      expect(response.body).toHaveProperty("commande");
      expect(response.body.commande.unique_id).toBe(testUniqueId);
    });

    it("devrait retourner 404 pour une commande inexistante", async () => {
      const fakeUniqueId = "CMD-999-9999999999-FAKE9999";

      const response = await request(app).get(
        `/api/magasin/commande/${fakeUniqueId}/verify`
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("exists", false);
    });

    it("devrait retourner 400 pour un format d'unique_id invalide", async () => {
      const response = await request(app).get(
        "/api/magasin/commande/INVALID-FORMAT/verify"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("validation");
    });
  });

  describe("Statistiques du magasin", () => {
    it("devrait récupérer les statistiques globales", async () => {
      const response = await request(app).get("/api/magasin/statistiques");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("total_commandes");
      expect(response.body.data).toHaveProperty("commandes_en_attente");
      expect(response.body.data).toHaveProperty("commandes_validees");
      expect(response.body.data).toHaveProperty("commandes_livrees");
      expect(response.body.data).toHaveProperty("commandes_annulees");
      expect(response.body.data).toHaveProperty("chiffre_affaires_total");
    });

    it("devrait accepter des paramètres de période", async () => {
      const response = await request(app)
        .get("/api/magasin/statistiques")
        .query({
          dateDebut: "2024-01-01",
          dateFin: "2024-12-31",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("periode");
      expect(response.body.periode.debut).toBe("2024-01-01");
      expect(response.body.periode.fin).toBe("2024-12-31");
    });
  });

  describe("Diagnostic du module", () => {
    it("devrait retourner les informations de diagnostic", async () => {
      const response = await request(app).get("/api/magasin/diagnostic");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "success");
      expect(response.body).toHaveProperty("module", "magasin");
      expect(response.body).toHaveProperty("database");
      expect(response.body.database).toHaveProperty("connected", true);
      expect(response.body.database).toHaveProperty("tables");
      expect(response.body.database.tables).toHaveProperty("articles");
      expect(response.body.database.tables).toHaveProperty("commandes");
      expect(response.body.database.tables).toHaveProperty("tailles");
    });
  });

  describe("Validation des données", () => {
    it("devrait rejeter un article avec un prix négatif", async () => {
      const articleInvalide = {
        nom: "Article Invalide",
        prix: -10.0,
        stock: 5,
        categorie_id: 1,
      };

      const response = await request(app)
        .post("/api/magasin/articles/ajouter")
        .send(articleInvalide);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });

    it("devrait rejeter une commande avec un total négatif", async () => {
      const commandeInvalide = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
          },
        ],
        total: -50.0,
      };

      const response = await request(app)
        .post("/api/magasin/commandes/ajouter")
        .send(commandeInvalide);

      expect(response.status).toBe(400);
    });

    it("devrait rejeter une commande sans articles", async () => {
      const commandeInvalide = {
        utilisateur_id: 1,
        articles: [],
        total: 50.0,
      };

      const response = await request(app)
        .post("/api/magasin/commandes/ajouter")
        .send(commandeInvalide);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    it("devrait rejeter un article avec un stock négatif", async () => {
      const articleInvalide = {
        nom: "Article Stock Négatif",
        prix: 25.0,
        stock: -5,
        categorie_id: 1,
      };

      const response = await request(app)
        .post("/api/magasin/articles/ajouter")
        .send(articleInvalide);

      expect(response.status).toBe(400);
    });
  });

  describe("Routes d'information", () => {
    it("devrait retourner les informations du module", async () => {
      const response = await request(app).get("/api/magasin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "active");
      expect(response.body).toHaveProperty("module", "magasin");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("architecture");
      expect(response.body).toHaveProperty("features");
      expect(response.body).toHaveProperty("routes");
    });
  });
});
