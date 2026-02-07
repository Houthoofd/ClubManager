/**
 * Tests des cas limites (edge cases) pour le module Stocks
 * Tests des situations extrêmes et cas particuliers
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Stocks } from "../../../db/clients/stocks/stocks.js";
import {
  getStocks,
  getStockByArticle,
  updateStock,
  getAlertes,
} from "../core/handlers/index.js";

describe("Stocks Module - Tests des cas limites", () => {
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

  // ==================== VALEURS LIMITES ====================
  describe("Valeurs limites", () => {
    it("devrait gérer un stock avec quantité à 0", async () => {
      const mockStocks = [
        {
          id: 1,
          article_id: 5,
          quantite: 0,
          article_nom: "Article épuisé",
          article_prix: 50.0,
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

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockStocks,
        }),
      );
    });

    it("devrait gérer un article ID à 0", async () => {
      mockRequest.params = { articleId: "0" };

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      // Le handler valide et rejette les IDs <= 0
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockStocksClient.obtenirStockParArticle).not.toHaveBeenCalled();
    });

    it("devrait gérer une quantité mise à 0 (opération set)", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 0,
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

      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(5, 0);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une addition de 0", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 0,
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

      expect(mockStocksClient.ajouterAuStock).toHaveBeenCalledWith(5, 0);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un seuil d'alerte à 0", async () => {
      mockRequest.query = { seuil: "0" };

      const mockAlertes = [
        {
          id: 1,
          article_id: 5,
          quantite: 0,
          article_nom: "Article épuisé",
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

      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(0);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== VALEURS EXTRÊMES ====================
  describe("Valeurs extrêmes", () => {
    it("devrait gérer un très grand ID d'article", async () => {
      mockRequest.params = { articleId: "2147483647" }; // MAX_INT en 32 bits

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        [],
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirStockParArticle).toHaveBeenCalledWith(
        2147483647,
      );
    });

    it("devrait gérer une très grande quantité", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 999999999,
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

      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledWith(
        5,
        999999999,
      );
    });

    it("devrait gérer un très grand seuil d'alerte", async () => {
      mockRequest.query = { seuil: "999999" };

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(999999);
    });
  });

  // ==================== TYPES DE DONNÉES INVALIDES ====================
  describe("Types de données invalides", () => {
    it("devrait rejeter un ID d'article vide", async () => {
      mockRequest.params = { articleId: "" };

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockStocksClient.obtenirStockParArticle).not.toHaveBeenCalled();
    });

    it("devrait gérer un ID d'article avec espaces", async () => {
      mockRequest.params = { articleId: "  5  " };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        [],
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      // parseInt('  5  ') = 5
      expect(mockStocksClient.obtenirStockParArticle).toHaveBeenCalledWith(5);
    });

    it("devrait gérer un seuil avec valeur décimale", async () => {
      mockRequest.query = { seuil: "5.7" };

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      // parseInt('5.7') = 5
      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(5);
    });

    it("devrait gérer des valeurs null/undefined dans le body", async () => {
      mockRequest.body = {
        article_id: null,
        quantite: undefined,
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "article_id et quantite sont requis",
        }),
      );
    });
  });

  // ==================== DONNÉES MANQUANTES ====================
  describe("Données manquantes", () => {
    it("devrait gérer une requête sans paramètres", async () => {
      mockRequest.params = {};

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      // articleId est undefined → parseInt(undefined) = NaN
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer une mise à jour sans article_id", async () => {
      mockRequest.body = {
        quantite: 30,
        operation: "set",
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer une mise à jour sans quantite", async () => {
      mockRequest.body = {
        article_id: 5,
        operation: "set",
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer une requête d'alertes sans paramètre seuil", async () => {
      mockRequest.query = {};

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      // Utilise la valeur par défaut (5)
      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(5);
    });
  });

  // ==================== ARTICLES SANS INFORMATIONS ====================
  describe("Articles sans informations complètes", () => {
    it("devrait gérer un stock sans informations d'article (JOIN retourne null)", async () => {
      const mockStocks = [
        {
          id: 1,
          article_id: 999,
          quantite: 50,
          article_nom: null,
          article_prix: null,
          article_description: null,
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

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockStocks,
        }),
      );
    });

    it("devrait gérer un stock avec nom d'article vide", async () => {
      const mockStock = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "",
          article_prix: 0,
        },
      ];

      mockRequest.params = { articleId: "5" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        mockStock,
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== OPÉRATIONS SPÉCIALES ====================
  describe("Opérations spéciales", () => {
    it("devrait empêcher la soustraction en dessous de 0", async () => {
      // La requête SQL utilise GREATEST(0, quantite - ?)
      mockRequest.body = {
        article_id: 5,
        quantite: 1000, // Soustraire plus que le stock disponible
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

      // La BDD garantit que le résultat sera >= 0
      expect(mockStocksClient.soustraireStock).toHaveBeenCalledWith(5, 1000);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer l'opération avec une chaîne pour operation", async () => {
      mockRequest.body = {
        article_id: 5,
        quantite: 30,
        operation: "SET", // Majuscules
      };

      await updateStock(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      // La validation est sensible à la casse
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== ALERTES SPÉCIALES ====================
  describe("Alertes - Cas spéciaux", () => {
    it("devrait retourner tous les stocks si le seuil est très élevé", async () => {
      mockRequest.query = { seuil: "10000" };

      const mockAlertes = [
        { id: 1, article_id: 5, quantite: 50 },
        { id: 2, article_id: 12, quantite: 100 },
        { id: 3, article_id: 8, quantite: 200 },
      ];

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue(
        mockAlertes,
      );

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(mockStocksClient.obtenirAlertesStock).toHaveBeenCalledWith(10000);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 3,
        }),
      );
    });

    it("devrait ne retourner aucune alerte si le seuil est 0 et tous les stocks > 0", async () => {
      mockRequest.query = { seuil: "0" };

      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await getAlertes(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 0,
          data: [],
        }),
      );
    });
  });

  // ==================== CARACTÈRES SPÉCIAUX ====================
  describe("Caractères spéciaux", () => {
    it("devrait gérer des noms d'articles avec caractères spéciaux", async () => {
      const mockStocks = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "Kimono (judogi) - 100% coton",
          article_description:
            "Description avec \"guillemets\" et 'apostrophes'",
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

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockStocks,
        }),
      );
    });

    it("devrait gérer des noms avec émojis", async () => {
      const mockStock = [
        {
          id: 1,
          article_id: 5,
          quantite: 25,
          article_nom: "Kimono 🥋",
          article_description: "Super article! 😊",
        },
      ];

      mockRequest.params = { articleId: "5" };

      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue(
        mockStock,
      );

      await getStockByArticle(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockStock,
        }),
      );
    });
  });

  // ==================== CONCURRENCE ====================
  describe("Tests de concurrence", () => {
    it("devrait gérer plusieurs requêtes simultanées pour différents articles", async () => {
      (mockStocksClient.obtenirStockParArticle as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 5, quantite: 25 },
      ]);

      const requests = [1, 2, 3, 4, 5].map((id) => {
        const req = { ...mockRequest, params: { articleId: id.toString() } };
        return getStockByArticle(
          req as Request,
          mockResponse as Response,
          mockStocksClient as Stocks,
        );
      });

      await Promise.all(requests);

      expect(mockStocksClient.obtenirStockParArticle).toHaveBeenCalledTimes(5);
    });

    it("devrait gérer plusieurs mises à jour simultanées", async () => {
      (mockStocksClient.mettreAJourStock as jest.Mock).mockResolvedValue({
        affectedRows: 1,
      });

      const updates = [10, 20, 30].map((quantite) => {
        const req = {
          ...mockRequest,
          body: { article_id: 5, quantite, operation: "set" },
        };
        return updateStock(
          req as Request,
          mockResponse as Response,
          mockStocksClient as Stocks,
        );
      });

      await Promise.all(updates);

      expect(mockStocksClient.mettreAJourStock).toHaveBeenCalledTimes(3);
    });
  });
});
