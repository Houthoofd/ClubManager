/**
 * Tests d'intégration mockés pour le module Stocks
 * Tests des flux complets handlers → services → client (mocké)
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

describe("Stocks Module - Tests d'intégration mockés", () => {
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

  // ==================== FLUX COMPLET STOCKS ====================
  describe("Flux complet - Récupération des stocks", () => {
    it("devrait récupérer les stocks via handler → service → client", async () => {
      const mockStocks = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "Kimono Judo Blanc",
          article_prix: 89.99,
          article_description: "Kimono blanc en coton pour débutants",
        },
        {
          id: 2,
          article_id: 12,
          quantite: 10,
          article_nom: "Ceinture Noire",
          article_prix: 15.0,
          article_description: "Ceinture noire 280cm",
        },
        {
          id: 3,
          article_id: 8,
          quantite: 50,
          article_nom: "Protège-tibias",
          article_prix: 25.0,
          article_description: "Protection pour les compétitions",
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

      expect(mockStocksClient.obtenirTousLesStocks).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Stocks récupérés avec succès",
          data: mockStocks,
          count: 3,
        }),
      );
    });

    it("devrait gérer le cas où aucun stock n'existe", async () => {
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
  });

  // ==================== FLUX COMPLET STOCK PAR ARTICLE ====================
  describe("Flux complet - Récupération du stock d'un article", () => {
    it("devrait récupérer le stock d'un article via handler → service → client", async () => {
      mockRequest.params = { articleId: "5" };

      const mockStock = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "Kimono Judo Blanc",
          article_prix: 89.99,
          article_description: "Kimono blanc en coton",
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

    it("devrait valider l'ID de l'article", async () => {
      mockRequest.params = { articleId: "invalid" };

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirStockParArticle).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID d'article invalide",
        }),
      );
    });
  });

  // ==================== FLUX COMPLET MISE À JOUR STOCK ====================
  describe("Flux complet - Mise à jour du stock", () => {
    it("devrait mettre à jour un stock (operation=set) via handler → service → client", async () => {
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

    it("devrait ajouter au stock (operation=add) via handler → service → client", async () => {
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

    it("devrait soustraire du stock (operation=subtract) via handler → service → client", async () => {
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

    it("devrait valider les données d'entrée", async () => {
      mockRequest.body = {
        quantite: 30,
        // article_id manquant
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.mettreAJourStock).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "article_id et quantite sont requis",
        }),
      );
    });
  });

  // ==================== FLUX COMPLET ALERTES ====================
  describe("Flux complet - Récupération des alertes", () => {
    it("devrait récupérer les alertes via handler → service → client", async () => {
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
  });

  // ==================== FLUX COMPLET HEALTH CHECK ====================
  describe("Flux complet - Health check", () => {
    it("devrait vérifier la santé via handler → service → client", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirTousLesStocks).toHaveBeenCalled();
      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalled();
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

    it("devrait détecter un service dégradé", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10 },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Service error"),
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
  });

  // ==================== SCÉNARIOS COMPLEXES ====================
  describe("Scénarios d'intégration complexes", () => {
    it("devrait gérer une séquence de mises à jour de stock", async () => {
      // 1. Définir le stock initial
      mockRequest.body = {
        article_id: 5,
        quantite: 100,
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

      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(5, 100);

      // 2. Ajouter au stock
      mockRequest.body = {
        article_id: 5,
        quantite: 20,
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

      expect(mockStocksClient.ajouterAuStock).toHaveBeenCalledWith(5, 20);

      // 3. Soustraire du stock
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
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

      expect(mockStocksClient.soustraireStock).toHaveBeenCalledWith(5, 30);

      // Vérifier que chaque opération a réussi
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledTimes(3);
    });

    it("devrait gérer l'échec d'une mise à jour après succès", async () => {
      // 1. Première mise à jour réussie
      mockRequest.body = {
        article_id: 5,
        quantite: 50,
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

      expect(statusMock).toHaveBeenCalledWith(200);

      // 2. Deuxième mise à jour échoue (stock non trouvé)
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
          message: "Stock non trouvé pour cet article",
        }),
      );
    });
  });

  // ==================== TESTS DE RÉSILIENCE ====================
  describe("Tests de résilience", () => {
    it("devrait gérer les erreurs de connexion à la base de données", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Connection timeout"),
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
          error: expect.stringContaining("Connection timeout"),
        }),
      );
    });

    it("devrait gérer les erreurs réseau pendant la mise à jour", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "set",
      };

      (mockStocksClient.mettreAJourStock as jest.Mock).mockRejectedValue(
        new Error("Network error"),
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
          error: expect.stringContaining("Network error"),
        }),
      );
    });
  });
});
