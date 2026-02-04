/**
 * Tests des schémas Zod pour le module Magasin
 * Tests de validation des structures de données
 */

import { describe, it, expect } from "@jest/globals";
import {
  getArticlesSchema,
  getArticleByIdSchema,
  createArticleSchema,
  updateArticleSchema,
  deleteArticleSchema,
  articleCommandeSchema,
  createCommandeSchema,
  getCommandesUtilisateurSchema,
  getCommandeByUniqueIdSchema,
  getCommandeByNumeroSchema,
  getPaymentIntentSchema,
  getTaillesSchema,
  getStatistiquesMagasinSchema,
} from "../core/validators/magasin.schema.js";

describe("Magasin Module - Tests des schémas", () => {
  describe("createArticleSchema", () => {
    it("devrait valider un article complet et valide", () => {
      const validArticle = {
        nom: "Kimono Premium",
        description: "Kimono de haute qualité",
        prix: 89.99,
        stock: 15,
        categorie_id: 1,
        image_url: "https://example.com/kimono.jpg",
        actif: true,
        tailles_disponibles: ["S", "M", "L", "XL"],
      };

      const result = createArticleSchema.safeParse(validArticle);
      expect(result.success).toBe(true);
    });

    it("devrait valider un article avec champs minimaux requis", () => {
      const minimalArticle = {
        nom: "Article Minimal",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(minimalArticle);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un article sans nom", () => {
      const invalidArticle = {
        prix: 25.99,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un prix négatif", () => {
      const invalidArticle = {
        nom: "Test",
        prix: 0,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un prix supérieur au maximum", () => {
      const invalidArticle = {
        nom: "Test",
        prix: 10000,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait accepter le prix minimum (0.01)", () => {
      const article = {
        nom: "Test",
        prix: 0.01,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait accepter le prix maximum (9999.99)", () => {
      const article = {
        nom: "Test",
        prix: 9999.99,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un stock négatif", () => {
      const invalidArticle = {
        nom: "Test",
        prix: 25.99,
        categorie_id: 1,
        stocks: [{ taille: "M", quantite: -5 }],
      };

      const result = createArticleSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un stock décimal", () => {
      const invalidArticle = {
        nom: "Test",
        prix: 25.99,
        categorie_id: 1,
        stocks: [{ taille: "M", quantite: 5.5 }],
      };

      const result = createArticleSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait accepter un stock de 0", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        categorie_id: 1,
        stocks: [{ taille: "M", quantite: 0 }],
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une URL d'image invalide", () => {
      const invalidArticle = {
        nom: "Test",
        prix: 25.99,
        categorie_id: 1,
        images: ["not-a-url"],
      };

      const result = createArticleSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait valider une URL d'image valide", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        categorie_id: 1,
        images: ["https://example.com/image.jpg"],
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait utiliser actif=true par défaut", () => {
      const article = {
        nom: "Test",
        prix: 25.99,
        categorie_id: 1,
      };

      const result = createArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actif).toBe(true);
      }
    });
  });

  describe("updateArticleSchema", () => {
    it("devrait valider une mise à jour avec tous les champs", () => {
      const validUpdate = {
        id: 1,
        nom: "Nouveau nom",
        description: "Nouvelle description",
        prix: 49.99,
        stock: 20,
        categorie_id: 2,
        image_url: "https://example.com/new.jpg",
        actif: false,
        tailles_disponibles: ["M", "L"],
      };

      const result = updateArticleSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait valider une mise à jour partielle", () => {
      const partialUpdate = {
        id: 1,
        nom: "Nouveau nom seulement",
      };

      const result = updateArticleSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une mise à jour sans ID", () => {
      const invalidUpdate = {
        nom: "Nouveau nom",
        prix: 49.99,
      };

      const result = updateArticleSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un ID négatif", () => {
      const invalidUpdate = {
        id: -1,
        nom: "Test",
      };

      const result = updateArticleSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("createCommandeSchema", () => {
    it("devrait valider une commande complète", () => {
      const validCommande = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            nom: "Kimono",
            quantite: 2,
            taille: "M",
            prix: 45.99,
          },
          {
            article_id: 2,
            nom: "Ceinture",
            quantite: 1,
            taille: "L",
            prix: 15.99,
          },
        ],
        total: 107.97,
        statut: "en attente",
        date: new Date().toISOString(),
      };

      const result = createCommandeSchema.safeParse(validCommande);
      expect(result.success).toBe(true);
    });

    it("devrait appliquer le statut par défaut 'en attente'", () => {
      const commande = {
        utilisateur_id: 1,
        articles: [
          {
            article_id: 1,
            quantite: 1,
            taille: "M",
          },
        ],
        total: 45.99,
      };

      const result = createCommandeSchema.safeParse(commande);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statut).toBe("en attente");
      }
    });

    it("devrait valider tous les statuts possibles", () => {
      const statuts = ["en attente", "validé", "préparé", "livré", "annulé"];

      statuts.forEach((statut) => {
        const commande = {
          utilisateur_id: 1,
          articles: [{ article_id: 1, quantite: 1, taille: "M" }],
          total: 50.0,
          statut: statut,
        };

        const result = createCommandeSchema.safeParse(commande);
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un statut invalide", () => {
      const invalidCommande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 50.0,
        statut: "statut_inexistant",
      };

      const result = createCommandeSchema.safeParse(invalidCommande);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une commande sans articles", () => {
      const invalidCommande = {
        utilisateur_id: 1,
        articles: [],
        total: 0,
      };

      const result = createCommandeSchema.safeParse(invalidCommande);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une commande avec plus de 50 articles", () => {
      const tooManyArticles = Array(51).fill({
        article_id: 1,
        quantite: 1,
        taille: "M",
      });

      const invalidCommande = {
        utilisateur_id: 1,
        articles: tooManyArticles,
        total: 1000.0,
      };

      const result = createCommandeSchema.safeParse(invalidCommande);
      expect(result.success).toBe(false);
    });

    it("devrait accepter exactement 50 articles", () => {
      const maxArticles = Array(50).fill({
        article_id: 1,
        quantite: 1,
        taille: "M",
      });

      const commande = {
        utilisateur_id: 1,
        articles: maxArticles,
        total: 1000.0,
      };

      const result = createCommandeSchema.safeParse(commande);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un total négatif", () => {
      const invalidCommande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: -50.0,
      };

      const result = createCommandeSchema.safeParse(invalidCommande);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un total trop élevé", () => {
      const invalidCommande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 100000.0,
      };

      const result = createCommandeSchema.safeParse(invalidCommande);
      expect(result.success).toBe(false);
    });

    it("devrait accepter le total minimum (0.01)", () => {
      const commande = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 0.01,
      };

      const result = createCommandeSchema.safeParse(commande);
      expect(result.success).toBe(true);
    });
  });

  describe("articleCommandeSchema", () => {
    it("devrait valider un article complet", () => {
      const validArticle = {
        article_id: 1,
        nom: "Kimono",
        quantite: 2,
        taille: "L",
        prix: 45.99,
      };

      const result = articleCommandeSchema.safeParse(validArticle);
      expect(result.success).toBe(true);
    });

    it("devrait valider un article minimal (sans nom et prix)", () => {
      const minimalArticle = {
        article_id: 1,
        quantite: 1,
        taille: "M",
      };

      const result = articleCommandeSchema.safeParse(minimalArticle);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter une quantité de 0", () => {
      const invalidArticle = {
        article_id: 1,
        quantite: 0,
        taille: "M",
      };

      const result = articleCommandeSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantité négative", () => {
      const invalidArticle = {
        article_id: 1,
        quantite: -2,
        taille: "M",
      };

      const result = articleCommandeSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une quantité supérieure à 100", () => {
      const invalidArticle = {
        article_id: 1,
        quantite: 101,
        taille: "M",
      };

      const result = articleCommandeSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait accepter une quantité de 100", () => {
      const article = {
        article_id: 1,
        quantite: 100,
        taille: "M",
      };

      const result = articleCommandeSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un article sans taille", () => {
      const invalidArticle = {
        article_id: 1,
        quantite: 1,
      };

      const result = articleCommandeSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une taille vide", () => {
      const invalidArticle = {
        article_id: 1,
        quantite: 1,
        taille: "",
      };

      const result = articleCommandeSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter une taille trop longue", () => {
      const invalidArticle = {
        article_id: 1,
        quantite: 1,
        taille: "A".repeat(21),
      };

      const result = articleCommandeSchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);
    });
  });

  describe("getCommandeByUniqueIdSchema", () => {
    it("devrait valider un unique_id au bon format", () => {
      const validParams = {
        uniqueId: "CMD-001-1704123456789-ABCD1234",
      };

      const result = getCommandeByUniqueIdSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un format invalide", () => {
      const invalidParams = {
        uniqueId: "INVALID-FORMAT",
      };

      const result = getCommandeByUniqueIdSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter des minuscules dans la partie hexadécimale", () => {
      const invalidParams = {
        uniqueId: "CMD-001-1704123456789-abcd1234",
      };

      const result = getCommandeByUniqueIdSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("getCommandeByNumeroSchema", () => {
    it("devrait valider un numéro de commande valide", () => {
      const validParams = {
        numeroCommande: "CMD-000001",
      };

      const result = getCommandeByNumeroSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("devrait valider différents numéros", () => {
      const numeros = ["CMD-000001", "CMD-999999", "CMD-123456"];

      numeros.forEach((numero) => {
        const result = getCommandeByNumeroSchema.safeParse({
          numeroCommande: numero,
        });
        expect(result.success).toBe(true);
      });
    });

    it("devrait rejeter un format invalide", () => {
      const invalidParams = {
        numeroCommande: "CMD-1",
      };

      const result = getCommandeByNumeroSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("getArticleByIdSchema", () => {
    it("devrait transformer une chaîne en nombre", () => {
      const params = { articleId: "42" };

      const result = getArticleByIdSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe(42);
        expect(typeof result.data.articleId).toBe("number");
      }
    });

    it("devrait rejeter un ID non numérique", () => {
      const params = { articleId: "abc" };

      const result = getArticleByIdSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });

  describe("getStatistiquesMagasinSchema", () => {
    it("devrait valider des dates valides", () => {
      const params = {
        dateDebut: "2024-01-01",
        dateFin: "2024-12-31",
      };

      const result = getStatistiquesMagasinSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("devrait accepter des paramètres vides", () => {
      const params = {};

      const result = getStatistiquesMagasinSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter des dates invalides", () => {
      const params = {
        dateDebut: "not-a-date",
      };

      const result = getStatistiquesMagasinSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });
});
