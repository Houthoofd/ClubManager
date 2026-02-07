/**
 * Tests de gestion d'erreurs pour le module Stocks
 * Tests des scénarios d'erreur (DB, timeout, connexion, etc.)
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

describe("Stocks - Tests de gestion d'erreurs", () => {
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

  // ==================== ERREURS DE BASE DE DONNÉES ====================
  describe("Erreurs de base de données", () => {
    it("getStocks - devrait gérer une erreur de connexion DB", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("ECONNREFUSED: Connection refused"),
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des stocks",
          error: "ECONNREFUSED: Connection refused",
        }),
      );
    });

    it("getStockByArticle - devrait gérer une erreur de timeout", async () => {
      mockRequest.params = { articleId: "5" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockRejectedValue(
        new Error("ETIMEDOUT: Operation timed out"),
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération du stock",
        }),
      );
    });

    it("updateStock - devrait gérer une erreur de table manquante", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockRejectedValue(
        new Error("Table 'clubmanager.stocks' doesn't exist"),
      );

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la mise à jour du stock",
        }),
      );
    });

    it("getAlertes - devrait gérer une erreur de contrainte FK", async () => {
      mockRequest.query = { seuil: "5" };

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Foreign key constraint fails"),
      );

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des alertes",
        }),
      );
    });
  });

  // ==================== ERREURS DE CONNEXION ====================
  describe("Erreurs de connexion réseau", () => {
    it("devrait gérer une perte de connexion réseau", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("ENETUNREACH: Network is unreachable"),
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des stocks",
        }),
      );
    });

    it("devrait gérer un refus de connexion", async () => {
      mockRequest.params = { articleId: "10" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockRejectedValue(
        new Error("ECONNRESET: Connection reset by peer"),
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un DNS non résolu", async () => {
      mockRequest.query = { seuil: "10" };

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("ENOTFOUND: getaddrinfo ENOTFOUND"),
      );

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS DE TIMEOUT ====================
  describe("Erreurs de timeout", () => {
    it("devrait gérer un timeout de requête SQL", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Query timeout exceeded"),
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des stocks",
        }),
      );
    });

    it("devrait gérer un timeout de connexion", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 20,
        operation: "add",
      };

      (mockStocksClient.ajouterAuStock as jest.Mock).mockRejectedValue(
        new Error("Connection timeout"),
      );

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS INATTENDUES ====================
  describe("Erreurs inattendues", () => {
    it("devrait gérer une erreur sans message", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des stocks",
        }),
      );
    });

    it("devrait gérer un rejet avec un objet non-Error", async () => {
      mockRequest.params = { articleId: "5" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockRejectedValue(
        "String error",
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un rejet avec null", async () => {
      mockRequest.query = { seuil: "5" };

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        null,
      );

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un rejet avec undefined", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 10,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockRejectedValue(
        undefined,
      );

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur avec stack trace", async () => {
      const error = new Error("Detailed error");
      error.stack = "Error: Detailed error\n    at someFunction";

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        error,
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des stocks",
        }),
      );
    });
  });

  // ==================== ERREURS DE VALIDATION ====================
  describe("Erreurs de validation", () => {
    it("getStockByArticle - devrait gérer un articleId invalide", async () => {
      mockRequest.params = { articleId: "invalid" };

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID d'article invalide",
        }),
      );
    });

    it("getStockByArticle - devrait gérer un articleId négatif", async () => {
      mockRequest.params = { articleId: "-5" };

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID d'article invalide",
        }),
      );
    });

    it("updateStock - devrait gérer des données de mise à jour invalides", async () => {
      mockRequest.body = {
        // article_id manquant
        quantite: 10,
        operation: "set",
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("article_id"),
        }),
      );
    });

    it("updateStock - devrait gérer une quantité manquante", async () => {
      mockRequest.body = {
        article_id: 5,
        // quantite manquant
        operation: "set",
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("quantite"),
        }),
      );
    });

    it("updateStock - devrait gérer une quantité négative", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: -10,
        operation: "set",
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("quantite"),
        }),
      );
    });

    it("updateStock - devrait gérer une opération invalide", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 10,
        operation: "invalid_operation",
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("operation"),
        }),
      );
    });

    it("getAlertes - devrait gérer un seuil invalide", async () => {
      mockRequest.query = { seuil: "invalid" };

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("seuil"),
        }),
      );
    });

    it("getAlertes - devrait gérer un seuil négatif", async () => {
      mockRequest.query = { seuil: "-5" };

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("seuil"),
        }),
      );
    });
  });

  // ==================== ERREURS DANS healthCheck ====================
  describe("healthCheck - Gestion d'erreurs gracieuse", () => {
    it("ne devrait jamais crasher même si tout échoue", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
        }),
      );
    });

    it("devrait retourner degraded avec des erreurs partielles", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          checks: {
            stocks: true,
            alertes: false,
          },
        }),
      );
    });

    it("devrait gérer une erreur inattendue dans le catch global", async () => {
      // Mock qui lance une erreur avant même les checks
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockImplementation(
        () => {
          throw new Error("Unexpected sync error");
        },
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
        }),
      );
    });
  });

  // ==================== ERREURS DE POOL DE CONNEXIONS ====================
  describe("Erreurs de pool de connexions", () => {
    it("devrait gérer un pool de connexions plein", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Too many connections"),
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des stocks",
        }),
      );
    });

    it("devrait gérer une connexion fermée", async () => {
      mockRequest.params = { articleId: "5" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockRejectedValue(
        new Error("Connection lost: The server closed the connection"),
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS D'AUTHENTIFICATION ====================
  describe("Erreurs d'authentification DB", () => {
    it("devrait gérer une erreur d'authentification", async () => {
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Access denied for user"),
      );

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des alertes",
        }),
      );
    });

    it("devrait gérer un mot de passe incorrect", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 10,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockRejectedValue(
        new Error("ER_ACCESS_DENIED_ERROR: Access denied"),
      );

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS MÉTIER ====================
  describe("Erreurs métier", () => {
    it("updateStock - devrait gérer un article inexistant", async () => {
      mockRequest.body = {
        article_id: 999,
        quantite: 10,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 0,
      });

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("non trouvé"),
        }),
      );
    });

    it("getStockByArticle - devrait gérer un article sans stock", async () => {
      mockRequest.params = { articleId: "100" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        [],
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Aucun stock trouvé"),
        }),
      );
    });

    it("updateStock - devrait gérer une quantité insuffisante pour 'subtract'", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 1000,
        operation: "subtract",
      };

      (mockStocksClient.soustraireStock as jest.Mock).mockRejectedValue(
        new Error("Quantité insuffisante en stock"),
      );

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la mise à jour du stock",
        }),
      );
    });
  });

  // ==================== ERREURS DE CONCURRENCE ====================
  describe("Erreurs de concurrence", () => {
    it("devrait gérer des mises à jour concurrentes", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 10,
        operation: "add",
      };

      (mockStocksClient.ajouterAuStock as jest.Mock).mockRejectedValue(
        new Error("Deadlock found when trying to get lock"),
      );

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un lock timeout", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 5,
        operation: "subtract",
      };

      (mockStocksClient.soustraireStock as jest.Mock).mockRejectedValue(
        new Error("Lock wait timeout exceeded"),
      );

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS DE DONNÉES CORROMPUES ====================
  describe("Erreurs de données corrompues", () => {
    it("devrait gérer des données de stock corrompues", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Data truncated for column 'quantite'"),
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une conversion de type échouée", async () => {
      mockRequest.params = { articleId: "5" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockRejectedValue(
        new Error("Invalid number value"),
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
