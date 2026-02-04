/**
 * Tests de performance pour le module Magasin
 * Tests de temps de réponse et de charge
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  getArticles,
  createArticle,
  createCommande,
  getCommandes,
  getStatistiquesMagasin,
} from "../core/handlers/index.js";
import * as MagasinService from "../core/services/magasin.service.js";

describe("Magasin Module - Tests de performance", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMagasinClient: Partial<Magasin>;
  let mockPaiementsClient: Partial<Paiements>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockMagasinClient = {
      obtenirArticlesParCategories: jest.fn(),
      ajouterArticle: jest.fn(),
      ajouterCommande: jest.fn(),
      obtenirLesCommandes: jest.fn(),
    };

    mockPaiementsClient = {
      queryAsync: jest.fn(),
    };
  });

  describe("Temps de réponse des handlers", () => {
    it("devrait récupérer les articles en moins de 100ms", async () => {
      const mockArticles = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: i,
          nom: `Article ${i}`,
          prix: 25.99,
        }));

      (mockMagasinClient.obtenirArticlesParCategories as jest.Mock).mockResolvedValue(
        [{ categorie: "Test", articles: mockArticles }]
      );

      const startTime = Date.now();

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(100);
    });

    it("devrait créer un article en moins de 200ms", async () => {
      mockRequest.body = {
        nom: "Test Article",
        prix: 25.99,
        stock: 10,
        categorie_id: 1,
      };

      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Article ajouté",
      });

      const startTime = Date.now();

      await createArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(duration).toBeLessThan(200);
    });

    it("devrait créer une commande en moins de 300ms", async () => {
      mockRequest.body = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 45.99,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        { numero_commande: "CMD-000000" },
      ]);

      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      const startTime = Date.now();

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(duration).toBeLessThan(300);
    });
  });

  describe("Gestion de volumes importants", () => {
    it("devrait gérer la récupération de 1000 articles", async () => {
      const largeDataset = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: i,
          nom: `Article ${i}`,
          prix: 25.99 + i,
          stock: 10,
        }));

      (mockMagasinClient.obtenirArticlesParCategories as jest.Mock).mockResolvedValue(
        [{ categorie: "Test", articles: largeDataset }]
      );

      const startTime = Date.now();

      await getArticles(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            articles: expect.arrayContaining([expect.any(Object)]),
          }),
        ])
      );
    });

    it("devrait gérer la récupération de 500 commandes", async () => {
      const largeCommandeSet = Array(500)
        .fill(null)
        .map((_, i) => ({
          id: i,
          utilisateur_id: 1,
          total: 100 + i,
          statut: "en attente",
        }));

      (mockMagasinClient.obtenirLesCommandes as jest.Mock).mockResolvedValue(
        largeCommandeSet
      );

      const startTime = Date.now();

      await getCommandes(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(400);
    });

    it("devrait gérer une commande avec 50 articles (maximum)", async () => {
      const maxArticles = Array(50)
        .fill(null)
        .map((_, i) => ({
          article_id: i + 1,
          quantite: 1,
          taille: "M",
        }));

      mockRequest.body = {
        utilisateur_id: 1,
        articles: maxArticles,
        total: 2000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        { numero_commande: "CMD-000000" },
      ]);

      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      const startTime = Date.now();

      await createCommande(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(duration).toBeLessThan(500);
    });
  });

  describe("Performance de validation", () => {
    it("devrait valider rapidement des données complexes", () => {
      const complexArticle = {
        nom: "Article Complexe avec un nom très long pour tester la validation",
        description: "Description très détaillée ".repeat(20),
        prix: 9999.99,
        stock: 999,
        categorie_id: 1,
        image_url: "https://example.com/very/long/path/to/image.jpg",
        actif: true,
        tailles_disponibles: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
      };

      const startTime = Date.now();

      // La validation Zod devrait être très rapide
      const { createArticleSchema } = require("../core/validators/magasin.schema.js");
      const result = createArticleSchema.safeParse(complexArticle);

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10);
    });

    it("devrait valider rapidement une commande complexe", () => {
      const complexCommande = {
        utilisateur_id: 1,
        articles: Array(30)
          .fill(null)
          .map((_, i) => ({
            article_id: i + 1,
            nom: `Article ${i}`,
            quantite: Math.floor(Math.random() * 10) + 1,
            taille: ["XS", "S", "M", "L", "XL"][Math.floor(Math.random() * 5)],
            prix: Math.random() * 100,
          })),
        total: 1500.0,
        statut: "en attente",
        date: new Date().toISOString(),
      };

      const startTime = Date.now();

      const { createCommandeSchema } = require("../core/validators/magasin.schema.js");
      const result = createCommandeSchema.safeParse(complexCommande);

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(20);
    });
  });

  describe("Performance de génération d'IDs", () => {
    it("devrait générer rapidement 1000 unique_ids uniques", () => {
      const startTime = Date.now();

      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        const id = MagasinService.generateUniqueCommandeId(i % 100);
        ids.add(id);
      }

      const duration = Date.now() - startTime;

      expect(ids.size).toBe(1000); // Tous uniques
      expect(duration).toBeLessThan(100);
    });

    it("devrait générer 100 unique_ids en moins de 10ms", () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        MagasinService.generateUniqueCommandeId(1);
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10);
    });
  });

  describe("Performance du cache de doublons", () => {
    it("devrait nettoyer le cache rapidement", () => {
      const startTime = Date.now();

      MagasinService.nettoyerCacheCommandes();

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5);
    });
  });

  describe("Performance des statistiques", () => {
    it("devrait calculer les statistiques en moins de 200ms", async () => {
      mockRequest.query = {};

      const mockStats = {
        total_commandes: 1000,
        commandes_en_attente: 150,
        commandes_validees: 600,
        commandes_livrees: 200,
        commandes_annulees: 50,
        chiffre_affaires_total: 50000.0,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([mockStats]);

      const startTime = Date.now();

      await getStatistiquesMagasin(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(200);
    });
  });

  describe("Performance sous charge", () => {
    it("devrait gérer 100 créations d'articles successives", async () => {
      (mockMagasinClient.ajouterArticle as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "OK",
      });

      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 100; i++) {
        mockRequest.body = {
          nom: `Article ${i}`,
          prix: 25.99,
          stock: 10,
          categorie_id: 1,
        };

        promises.push(
          createArticle(
            mockRequest as Request,
            mockResponse as Response,
            mockMagasinClient as Magasin
          )
        );
      }

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // 2 secondes pour 100 créations
      expect(statusMock).toHaveBeenCalledTimes(100);
    });

    it("devrait gérer 50 récupérations d'articles en parallèle", async () => {
      (mockMagasinClient.obtenirArticlesParCategories as jest.Mock).mockResolvedValue([
        { categorie: "Test", articles: [{ id: 1, nom: "Test" }] },
      ]);

      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          getArticles(
            mockRequest as Request,
            mockResponse as Response,
            mockMagasinClient as Magasin
          )
        );
      }

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(statusMock).toHaveBeenCalledTimes(50);
    });
  });

  describe("Benchmarks de référence", () => {
    it("devrait tracer les temps de réponse moyens", async () => {
      const iterations = 10;
      const durations: number[] = [];

      (mockMagasinClient.obtenirArticlesParCategories as jest.Mock).mockResolvedValue([
        { categorie: "Test", articles: [{ id: 1, nom: "Test" }] },
      ]);

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await getArticles(
          mockRequest as Request,
          mockResponse as Response,
          mockMagasinClient as Magasin
        );

        durations.push(Date.now() - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      console.log(`Performance getArticles - Avg: ${avgDuration}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms`);

      expect(avgDuration).toBeLessThan(50);
      expect(maxDuration).toBeLessThan(100);
    });
  });

  describe("Métriques de performance", () => {
    it("devrait avoir un temps de réponse p95 < 300ms pour createCommande", async () => {
      const iterations = 100;
      const durations: number[] = [];

      mockRequest.body = {
        utilisateur_id: 1,
        articles: [{ article_id: 1, quantite: 1, taille: "M" }],
        total: 45.99,
      };

      (mockPaiementsClient.queryAsync as jest.Mock).mockResolvedValue([
        { numero_commande: "CMD-000000" },
      ]);

      (mockMagasinClient.ajouterCommande as jest.Mock).mockResolvedValue({
        isConfirm: true,
        id: 1,
      });

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await createCommande(
          mockRequest as Request,
          mockResponse as Response,
          mockMagasinClient as Magasin,
          mockPaiementsClient as Paiements
        );

        durations.push(Date.now() - startTime);
      }

      durations.sort((a, b) => a - b);
      const p95Index = Math.floor(iterations * 0.95);
      const p95Duration = durations[p95Index];

      console.log(`Performance createCommande - p95: ${p95Duration}ms`);

      expect(p95Duration).toBeLessThan(300);
    });
  });
});
