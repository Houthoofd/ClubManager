/**
 * Tests de performance pour le module Stocks
 * Tests des temps de réponse et de la charge
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Stocks } from "../../../db/clients/stocks/stocks.js";
import {
  getStocks,
  getStockByArticle,
  updateStock,
  getAlertes,
  healthCheck,
} from "../core/handlers/index.js";

describe("Stocks Module - Tests de performance", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockStocksClient: Partial<Stocks>;

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

    mockStocksClient = {
      obtenirTousLesStocks: jest.fn(),
      obtenirStockParArticle: jest.fn(),
      mettreAJourStock: jest.fn(),
      ajouterAuStock: jest.fn(),
      soustraireStock: jest.fn(),
      obtenirAlertesStock: jest.fn(),
    };
  });

  // ==================== TEMPS DE RÉPONSE ====================
  describe("Temps de réponse des handlers", () => {
    it("getStocks devrait répondre en moins de 100ms", async () => {
      const mockStocks = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        article_id: i + 1,
        quantite: (i + 1) * 10,
        article_nom: `Article ${i + 1}`,
        article_prix: (i + 1) * 15.99,
        article_description: `Description article ${i + 1}`,
      }));

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks
      );

      const startTime = Date.now();

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("getStockByArticle devrait répondre en moins de 100ms", async () => {
      mockRequest.params = { articleId: "5" };

      const mockStock = [
        {
          id: 1,
          article_id: 5,
          quantite: 50,
          article_nom: "Kimono Judo",
          article_prix: 89.99,
          article_description: "Kimono blanc taille M",
        },
      ];

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        mockStock
      );

      const startTime = Date.now();

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("updateStock devrait répondre en moins de 150ms", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const startTime = Date.now();

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(150);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("getAlertes devrait répondre en moins de 100ms", async () => {
      mockRequest.query = { seuil: "5" };

      const mockAlertes = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        article_id: i + 10,
        quantite: i + 1,
        article_nom: `Article alerte ${i + 1}`,
        article_prix: (i + 1) * 12.5,
      }));

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes
      );

      const startTime = Date.now();

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("healthCheck devrait répondre en moins de 250ms", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(250);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== TESTS DE CHARGE ====================
  describe("Tests de charge", () => {
    it("devrait gérer 50 requêtes simultanées sur getStocks", async () => {
      const mockStocks = [
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ];

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, () =>
        getStocks(
          mockRequest as Request,
          mockResponse as Response,
          mockStocksClient as Stocks
        )
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // 5 secondes pour 50 requêtes
      expect(statusMock).toHaveBeenCalledTimes(50);
    });

    it("devrait gérer 100 requêtes simultanées sur getAlertes", async () => {
      const mockAlertes = [
        { id: 1, article_id: 1, quantite: 2, article_nom: "Test" },
      ];

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, () =>
        getAlertes(
          mockRequest as Request,
          mockResponse as Response,
          mockStocksClient as Stocks
        )
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10000); // 10 secondes pour 100 requêtes
      expect(statusMock).toHaveBeenCalledTimes(100);
    });

    it("devrait gérer 30 requêtes simultanées de mise à jour", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 10,
        operation: "add",
      };

      (mockStocksClient.ajouterAuStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const startTime = Date.now();

      const promises = Array.from({ length: 30 }, () =>
        updateStock(
          mockRequest as Request,
          mockResponse as Response,
          mockStocksClient as Stocks
        )
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // 5 secondes pour 30 requêtes
      expect(statusMock).toHaveBeenCalledTimes(30);
    });

    it("devrait gérer 25 requêtes simultanées sur getStockByArticle", async () => {
      mockRequest.params = { articleId: "5" };

      const mockStock = [
        { id: 1, article_id: 5, quantite: 50, article_nom: "Test" },
      ];

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        mockStock
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 25 }, () =>
        getStockByArticle(
          mockRequest as Request,
          mockResponse as Response,
          mockStocksClient as Stocks
        )
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(3000); // 3 secondes pour 25 requêtes
      expect(statusMock).toHaveBeenCalledTimes(25);
    });
  });

  // ==================== TESTS AVEC GROS VOLUMES ====================
  describe("Tests avec gros volumes de données", () => {
    it("devrait gérer 1000 stocks sans problème", async () => {
      const mockStocks = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        article_id: i + 1,
        quantite: (i + 1) * 5,
        article_nom: `Article ${i + 1}`,
        article_prix: (i + 1) * 10.5,
      }));

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks
      );

      const startTime = Date.now();

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1000,
        })
      );
    });

    it("devrait gérer 500 alertes avec descriptions longues", async () => {
      const mockAlertes = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        article_id: i + 1,
        quantite: i % 5,
        article_nom: `Article ${i + 1}`,
        article_prix: (i + 1) * 8.99,
        article_description: "A".repeat(400), // Description de 400 caractères
      }));

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes
      );

      const startTime = Date.now();

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== TESTS DE MÉMOIRE ====================
  describe("Tests de mémoire", () => {
    it("ne devrait pas causer de fuite mémoire avec requêtes répétées", async () => {
      const mockStocks = [
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ];

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks
      );

      // Exécuter 1000 requêtes séquentielles
      for (let i = 0; i < 1000; i++) {
        await getStocks(
          mockRequest as Request,
          mockResponse as Response,
          mockStocksClient as Stocks
        );
      }

      expect(statusMock).toHaveBeenCalledTimes(1000);
    });
  });

  // ==================== TESTS DE CONCURRENCE ====================
  describe("Tests de concurrence", () => {
    it("devrait gérer des requêtes concurrentes sur différents endpoints", async () => {
      const mockStocks = [
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ];
      const mockStock = [
        { id: 1, article_id: 5, quantite: 50, article_nom: "Test" },
      ];
      const mockAlertes = [
        { id: 1, article_id: 1, quantite: 2, article_nom: "Test" },
      ];

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks
      );
      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        mockStock
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes
      );
      (mockStocksClient.ajouterAuStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      mockRequest.params = { articleId: "5" };
      mockRequest.body = { article_id: 5, quantite: 10, operation: "add" };

      const startTime = Date.now();

      // Lancer 10 requêtes de chaque type en parallèle
      const promises = [
        ...Array.from({ length: 10 }, () =>
          getStocks(
            mockRequest as Request,
            mockResponse as Response,
            mockStocksClient as Stocks
          )
        ),
        ...Array.from({ length: 10 }, () =>
          getStockByArticle(
            mockRequest as Request,
            mockResponse as Response,
            mockStocksClient as Stocks
          )
        ),
        ...Array.from({ length: 10 }, () =>
          getAlertes(
            mockRequest as Request,
            mockResponse as Response,
            mockStocksClient as Stocks
          )
        ),
        ...Array.from({ length: 10 }, () =>
          updateStock(
            mockRequest as Request,
            mockResponse as Response,
            mockStocksClient as Stocks
          )
        ),
      ];

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000);
      expect(statusMock).toHaveBeenCalledTimes(40);
    });
  });

  // ==================== TESTS AVEC LATENCE ====================
  describe("Tests avec latence simulée", () => {
    it("devrait gérer une latence de 50ms sur getStocks", async () => {
      const mockStocks = [
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ];

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockStocks), 50)
          )
      );

      const startTime = Date.now();

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeGreaterThanOrEqual(50);
      expect(responseTime).toBeLessThan(200);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une latence variable sur healthCheck", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve([{ id: 1, article_id: 1, quantite: 10 }]),
              30
            )
          )
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([]), 50)
          )
      );

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Les requêtes sont parallèles, donc le temps total devrait être proche de la plus lente (50ms)
      expect(responseTime).toBeGreaterThanOrEqual(50);
      expect(responseTime).toBeLessThan(300);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une latence importante sur updateStock", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 20,
        operation: "subtract",
      };

      (mockStocksClient.soustraireStock as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ affectedRows: 1 }), 100)
          )
      );

      const startTime = Date.now();

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeGreaterThanOrEqual(100);
      expect(responseTime).toBeLessThan(300);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== TESTS DE DIFFÉRENTES OPÉRATIONS ====================
  describe("Performance des différentes opérations de stock", () => {
    it("devrait gérer l'opération 'set' rapidement", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const startTime = Date.now();

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(150);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer l'opération 'add' rapidement", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 15,
        operation: "add",
      };

      (mockStocksClient.ajouterAuStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const startTime = Date.now();

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(150);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer l'opération 'subtract' rapidement", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 10,
        operation: "subtract",
      };

      (mockStocksClient.soustraireStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const startTime = Date.now();

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(150);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== TESTS AVEC DIFFÉRENTS SEUILS D'ALERTES ====================
  describe("Performance avec différents seuils d'alertes", () => {
    it("devrait gérer un seuil d'alerte bas (1)", async () => {
      mockRequest.query = { seuil: "1" };

      const mockAlertes = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        article_id: i + 1,
        quantite: 0,
        article_nom: `Article ${i + 1}`,
      }));

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes
      );

      const startTime = Date.now();

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(150);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un seuil d'alerte élevé (100)", async () => {
      mockRequest.query = { seuil: "100" };

      const mockAlertes = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        article_id: i + 1,
        quantite: (i % 100) + 1,
        article_nom: `Article ${i + 1}`,
      }));

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes
      );

      const startTime = Date.now();

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
