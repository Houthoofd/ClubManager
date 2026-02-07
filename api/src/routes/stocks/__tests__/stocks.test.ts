/**
 * Tests unitaires principaux pour le module Stocks
 * Tests des fonctionnalités de base (happy path + erreurs)
 * Pattern avec injection de dépendance
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
import * as stocksService from "../core/services/stocks.service.js";

describe("Stocks Module - Tests unitaires de base", () => {
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

    // Mock du client Stocks
    mockStocksClient = {
      obtenirTousLesStocks: jest.fn(),
      obtenirStockParArticle: jest.fn(),
      mettreAJourStock: jest.fn(),
      ajouterAuStock: jest.fn(),
      soustraireStock: jest.fn(),
      obtenirAlertesStock: jest.fn(),
    };
  });

  // ==================== GET STOCKS ====================
  describe("getStocks - GET /api/stocks", () => {
    it("devrait retourner la liste des stocks", async () => {
      const mockStocks = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "Kimono Judo",
          article_prix: 89.99,
        },
        {
          id: 2,
          article_id: 12,
          quantite: 10,
          article_nom: "Ceinture Noire",
          article_prix: 15.0,
        },
      ];

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        mockStocks,
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirTousLesStocks).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Stocks récupérés avec succès",
          data: mockStocks,
          count: 2,
        }),
      );
    });

    it("devrait retourner 404 si aucun stock trouvé", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        [],
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun stock trouvé",
          data: [],
        }),
      );
    });

    it("devrait retourner 404 si obtenirTousLesStocks retourne null", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        null,
      );

      await getStocks(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun stock trouvé",
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Erreur base de données"),
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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== GET STOCK BY ARTICLE ====================
  describe("getStockByArticle - GET /api/stocks/article/:articleId", () => {
    it("devrait retourner le stock d'un article", async () => {
      mockRequest.params = { articleId: "5" };

      const mockStock = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "Kimono Judo",
          article_prix: 89.99,
        },
      ];

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        mockStock,
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirStockParArticle).toHaveBeenCalledWith(5);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Stock récupéré avec succès",
          data: mockStock,
          count: 1,
        }),
      );
    });

    it("devrait retourner 400 si l'ID article est invalide", async () => {
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
      expect(mockStocksClient.obtenirStockParArticle).not.toHaveBeenCalled();
    });

    it("devrait retourner 404 si aucun stock trouvé pour l'article", async () => {
      mockRequest.params = { articleId: "999" };

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
          message: "Aucun stock trouvé pour l'article 999",
          data: [],
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      mockRequest.params = { articleId: "5" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockRejectedValue(
        new Error("Erreur de connexion"),
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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== UPDATE STOCK ====================
  describe("updateStock - PUT /api/stocks/update", () => {
    it("devrait mettre à jour un stock (opération set)", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(5, 30);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Stock mis à jour avec succès",
          data: {
            article_id: 5,
            quantite: 30,
            operation: "set",
          },
        }),
      );
    });

    it("devrait ajouter au stock (opération add)", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 10,
        operation: "add",
      };

      (mockStocksClient.ajouterAuStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.ajouterAuStock).toHaveBeenCalledWith(5, 10);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait soustraire du stock (opération subtract)", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 5,
        operation: "subtract",
      };

      (mockStocksClient.soustraireStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.soustraireStock).toHaveBeenCalledWith(5, 5);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait utiliser 'set' par défaut si operation non spécifiée", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 20,
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(5, 20);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait retourner 400 si article_id manquant", async () => {
      mockRequest.body = {
        quantite: 30,
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
          message: "article_id et quantite sont requis",
        }),
      );
    });

    it("devrait retourner 400 si quantite manquante", async () => {
      mockRequest.body = {
        article_id: 5,
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
          message: "article_id et quantite sont requis",
        }),
      );
    });

    it("devrait retourner 400 si operation invalide", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "invalid",
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
          message:
            "operation invalide. Opérations autorisées: set, add, subtract",
        }),
      );
    });

    it("devrait rejeter une quantité NaN", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: NaN,
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
          message: "La quantite doit être un nombre valide",
        }),
      );
    });

    it("devrait rejeter une quantité de type string", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: "invalid",
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
          message: "La quantite doit être un nombre valide",
        }),
      );
    });

    it("devrait retourner 404 si le stock n'existe pas", async () => {
      mockRequest.body = {
        article_id: 999,
        quantite: 30,
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
          message: "Stock non trouvé pour cet article",
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockRejectedValue(
        new Error("Database error"),
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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== GET ALERTES ====================
  describe("getAlertes - GET /api/stocks/alertes", () => {
    it("devrait retourner la liste des alertes de stock", async () => {
      const mockAlertes = [
        {
          id: 1,
          article_id: 12,
          quantite: 2,
          article_nom: "Ceinture Noire",
          article_prix: 15.0,
        },
        {
          id: 2,
          article_id: 8,
          quantite: 4,
          article_nom: "Protège-tibias",
          article_prix: 25.0,
        },
      ];

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes,
      );

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(5);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Alertes de stock récupérées avec succès",
          data: mockAlertes,
          count: 2,
          seuil: 5,
        }),
      );
    });

    it("devrait utiliser le seuil par défaut (5)", async () => {
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(5);
    });

    it("devrait utiliser le seuil personnalisé", async () => {
      mockRequest.query = { seuil: "10" };

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(10);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          seuil: 10,
        }),
      );
    });

    it("devrait retourner un tableau vide si aucune alerte", async () => {
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          count: 0,
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Connection timeout"),
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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== HEALTH CHECK ====================
  describe("healthCheck - GET /api/stocks/health", () => {
    it("devrait retourner un statut healthy si tous les services fonctionnent", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          checks: {
            stocks: true,
            alertes: true,
          },
          message: "Tous les services sont opérationnels",
        }),
      );
    });

    it("devrait retourner un statut degraded si un service échoue", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
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
          message: "1/2 services opérationnels",
        }),
      );
    });

    it("devrait retourner un statut unhealthy si tous les services échouent", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
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
          checks: {
            stocks: false,
            alertes: false,
          },
          message: "Services non opérationnels",
        }),
      );
    });
  });

  // ==================== TESTS DES SERVICES ====================
  describe("Services - Tests unitaires", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("obtenirStocks", () => {
      it("devrait appeler le client et retourner les stocks", async () => {
        const mockStocks = [
          { id: 1, article_id: 5, quantite: 25 },
          { id: 2, article_id: 12, quantite: 10 },
        ];

        (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
          mockStocks,
        );

        const result = await stocksService.obtenirStocks(
          mockStocksClient as Stocks,
        );

        expect(result).toEqual(mockStocks);
        expect(mockStocksClient.obtenirTousLesStocks).toHaveBeenCalled();
      });

      it("devrait retourner un tableau vide si aucun stock", async () => {
        (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
          [],
        );

        const result = await stocksService.obtenirStocks(
          mockStocksClient as Stocks,
        );

        expect(result).toEqual([]);
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
          new Error("DB Error"),
        );

        await expect(
          stocksService.obtenirStocks(mockStocksClient as Stocks),
        ).rejects.toThrow("DB Error");
      });
    });

    describe("obtenirStockParArticle", () => {
      it("devrait appeler le client avec l'article ID et retourner le stock", async () => {
        const mockStock = [{ id: 1, article_id: 5, quantite: 25 }];

        (
          mockStocksClient.obtenirStockParArticle as jest.Mock
        ).mockResolvedValue(mockStock);

        const result = await stocksService.obtenirStockParArticle(
          5,
          mockStocksClient as Stocks,
        );

        expect(result).toEqual(mockStock);
        expect(mockStocksClient.obtenirStockParArticle).toHaveBeenCalledWith(5);
      });

      it("devrait retourner un tableau vide si aucun stock pour cet article", async () => {
        (
          mockStocksClient.obtenirStockParArticle as jest.Mock
        ).mockResolvedValue([]);

        const result = await stocksService.obtenirStockParArticle(
          999,
          mockStocksClient as Stocks,
        );

        expect(result).toEqual([]);
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (
          mockStocksClient.obtenirStockParArticle as jest.Mock
        ).mockRejectedValue(new Error("DB Error"));

        await expect(
          stocksService.obtenirStockParArticle(5, mockStocksClient as Stocks),
        ).rejects.toThrow("DB Error");
      });
    });

    describe("mettreAJourStock", () => {
      it("devrait mettre à jour le stock avec operation=set", async () => {
        (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
          affectedRows: 1,
        });

        const result = await stocksService.mettreAJourStock(
          { article_id: 5, quantite: 30, operation: "set" },
          mockStocksClient as Stocks,
        );

        expect(result.success).toBe(true);
        expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(5, 30);
      });

      it("devrait ajouter au stock avec operation=add", async () => {
        (mockStocksClient.ajouterAuStock as jest.Mock).mockResolvedValue({
          affectedRows: 1,
        });

        const result = await stocksService.mettreAJourStock(
          { article_id: 5, quantite: 10, operation: "add" },
          mockStocksClient as Stocks,
        );

        expect(result.success).toBe(true);
        expect(mockStocksClient.ajouterAuStock).toHaveBeenCalledWith(5, 10);
      });

      it("devrait soustraire du stock avec operation=subtract", async () => {
        (mockStocksClient.soustraireStock as jest.Mock).mockResolvedValue({
          affectedRows: 1,
        });

        const result = await stocksService.mettreAJourStock(
          { article_id: 5, quantite: 5, operation: "subtract" },
          mockStocksClient as Stocks,
        );

        expect(result.success).toBe(true);
        expect(mockStocksClient.soustraireStock).toHaveBeenCalledWith(5, 5);
      });

      it("devrait retourner success=false si aucun stock trouvé", async () => {
        (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
          affectedRows: 0,
        });

        const result = await stocksService.mettreAJourStock(
          { article_id: 999, quantite: 30 },
          mockStocksClient as Stocks,
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe("Stock non trouvé pour cet article");
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (mockStocksClient.mettreAJourStock as jest.Mock).mockRejectedValue(
          new Error("DB Error"),
        );

        await expect(
          stocksService.mettreAJourStock(
            { article_id: 5, quantite: 30 },
            mockStocksClient as Stocks,
          ),
        ).rejects.toThrow("DB Error");
      });
    });

    describe("obtenirAlertesStock", () => {
      it("devrait retourner les alertes avec le seuil par défaut", async () => {
        const mockAlertes = [{ id: 1, article_id: 12, quantite: 2 }];

        (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
          mockAlertes,
        );

        const result = await stocksService.obtenirAlertesStock(
          5,
          mockStocksClient as Stocks,
        );

        expect(result).toEqual(mockAlertes);
        expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(5);
      });

      it("devrait retourner les alertes avec un seuil personnalisé", async () => {
        const mockAlertes = [{ id: 1, article_id: 12, quantite: 8 }];

        (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
          mockAlertes,
        );

        const result = await stocksService.obtenirAlertesStock(
          10,
          mockStocksClient as Stocks,
        );

        expect(result).toEqual(mockAlertes);
        expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(10);
      });

      it("devrait retourner un tableau vide si aucune alerte", async () => {
        (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
          [],
        );

        const result = await stocksService.obtenirAlertesStock(
          5,
          mockStocksClient as Stocks,
        );

        expect(result).toEqual([]);
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
          new Error("DB Error"),
        );

        await expect(
          stocksService.obtenirAlertesStock(5, mockStocksClient as Stocks),
        ).rejects.toThrow("DB Error");
      });
    });

    describe("verifierSanteService", () => {
      it("devrait retourner healthy si tous les checks passent", async () => {
        (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
          { id: 1, article_id: 1, quantite: 10 },
        ]);
        (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
          [],
        );

        const result = await stocksService.verifierSanteService(
          mockStocksClient as Stocks,
        );

        expect(result.status).toBe("healthy");
        expect(result.checks).toEqual({
          stocks: true,
          alertes: true,
        });
      });

      it("devrait retourner degraded si un check échoue", async () => {
        (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
          { id: 1, article_id: 1, quantite: 10 },
        ]);
        (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
          new Error("Error"),
        );

        const result = await stocksService.verifierSanteService(
          mockStocksClient as Stocks,
        );

        expect(result.status).toBe("degraded");
        expect(result.checks).toEqual({
          stocks: true,
          alertes: false,
        });
      });

      it("devrait retourner unhealthy si tous les checks échouent", async () => {
        (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
          new Error("Error"),
        );
        (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
          new Error("Error"),
        );

        const result = await stocksService.verifierSanteService(
          mockStocksClient as Stocks,
        );

        expect(result.status).toBe("unhealthy");
        expect(result.checks.stocks).toBe(false);
        expect(result.checks.alertes).toBe(false);
      });
    });
  });

  // ==================== TESTS HANDLER HEALTH CHECK - CATCH ====================
  describe("healthCheck - Gestion des exceptions", () => {
    it("devrait gérer une exception synchrone dans Promise.allSettled", async () => {
      // Forcer une erreur synchrone qui crashe avant Promise.allSettled
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockImplementation(
        () => {
          throw new Error("Sync crash in client");
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
          checks: {
            stocks: false,
            alertes: false,
          },
          message: "Erreur lors de la vérification de santé",
        }),
      );
    });
  });
});
