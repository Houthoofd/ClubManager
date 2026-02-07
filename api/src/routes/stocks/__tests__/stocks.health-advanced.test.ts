/**
 * Tests avancés du Health Check pour le module Stocks
 * Tests exhaustifs des diagnostics et états de santé
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Stocks } from "../../../db/clients/stocks/stocks.js";
import { healthCheck } from "../core/handlers/index.js";
import * as stocksService from "../core/services/stocks.service.js";

describe("Stocks Module - Tests avancés du Health Check", () => {
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
      obtenirAlertesStock: jest.fn(),
    };
  });

  // ==================== ÉTATS DE SANTÉ COMPLETS ====================
  describe("États de santé - Tous les scénarios", () => {
    it("devrait retourner healthy avec tous les services OK", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
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

    it("devrait retourner healthy même avec des listes vides", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue(
        [],
      );
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
        }),
      );
    });

    it("devrait retourner degraded avec 1 service OK (stocks KO)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Service down"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

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
            stocks: false,
            alertes: true,
          },
          message: "1/2 services opérationnels",
        }),
      );
    });

    it("devrait retourner degraded avec 1 service OK (alertes KO)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Service down"),
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

    it("devrait retourner unhealthy avec 0 services OK", async () => {
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
          checks: {
            stocks: false,
            alertes: false,
          },
          message: "Services non opérationnels",
        }),
      );
    });
  });

  // ==================== TESTS DE PROMISE.ALLSETTLED ====================
  describe("Promise.allSettled - Comportement", () => {
    it("devrait utiliser Promise.allSettled pour ne pas crasher", async () => {
      // Un service qui lance une erreur ne devrait pas crasher le health check
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Async error"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
        }),
      );
    });

    it("devrait gérer des rejets avec différentes erreurs", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Timeout error"),
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

    it("devrait gérer des rejets avec valeurs non-Error", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        "String error",
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue({
        custom: "error",
      });

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

  // ==================== TESTS DE DÉGRADATION ====================
  describe("Dégradation progressive du service", () => {
    it("devrait détecter une dégradation partielle (stocks down)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          message: "1/2 services opérationnels",
        }),
      );
    });

    it("devrait détecter une dégradation partielle (alertes down)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          message: "1/2 services opérationnels",
        }),
      );
    });

    it("devrait détecter une panne totale (all services down)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          message: "Services non opérationnels",
        }),
      );
    });
  });

  // ==================== TESTS DE RÉCUPÉRATION ====================
  describe("Récupération du service", () => {
    it("devrait passer de unhealthy à degraded quand un service récupère", async () => {
      // Premier appel - tout down
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

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
        }),
      );

      // Clear mocks pour le deuxième appel
      jest.clearAllMocks();
      jsonMock = jest.fn();
      statusMock = jest.fn(() => mockResponse as Response);
      mockResponse.json = jsonMock;
      mockResponse.status = statusMock;

      // Deuxième appel - un service récupère
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
        }),
      );
    });

    it("devrait passer de degraded à healthy quand tous récupèrent", async () => {
      // Premier appel - degraded
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
        }),
      );

      // Clear mocks
      jest.clearAllMocks();
      jsonMock = jest.fn();
      statusMock = jest.fn(() => mockResponse as Response);
      mockResponse.json = jsonMock;
      mockResponse.status = statusMock;

      // Deuxième appel - healthy
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
        }),
      );
    });
  });

  // ==================== TESTS DU FORMAT DE RÉPONSE ====================
  describe("Format de la réponse health", () => {
    it("devrait toujours retourner les propriétés requises", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty("status");
      expect(response).toHaveProperty("checks");
      expect(response).toHaveProperty("message");
      expect(response.checks).toHaveProperty("stocks");
      expect(response.checks).toHaveProperty("alertes");
    });

    it("devrait retourner des booléens pour tous les checks", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(typeof response.checks.stocks).toBe("boolean");
      expect(typeof response.checks.alertes).toBe("boolean");
    });

    it("devrait retourner un message descriptif", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(typeof response.message).toBe("string");
      expect(response.message.length).toBeGreaterThan(0);
    });
  });

  // ==================== TESTS DE TIMEOUT ET LATENCE ====================
  describe("Timeout et latence", () => {
    it("devrait gérer des services lents mais fonctionnels", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve([{ id: 1, article_id: 1, quantite: 10 }]),
              100
            )
          ),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([]), 100)
          ),
      );

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const endTime = Date.now();

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
        }),
      );

      // Les requêtes sont parallèles, donc < 150ms au lieu de 200ms
      expect(endTime - startTime).toBeLessThan(150);
    });

    it("devrait gérer des services avec latence variable", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve([{ id: 1, article_id: 1, quantite: 10 }]),
              50
            )
          ),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([]), 30)
          ),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
        }),
      );
    });
  });

  // ==================== TESTS DE RÉPONSE HTTP ====================
  describe("Status HTTP du health check", () => {
    it("devrait retourner 503 si unhealthy", async () => {
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

    it("devrait retourner 503 si degraded", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
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
        }),
      );
    });

    it("devrait retourner 200 si healthy", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
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
        }),
      );
    });
  });

  // ==================== TESTS DE DÉTAILS DES CHECKS ====================
  describe("Détails des checks", () => {
    it("devrait indiquer quel service est en échec", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Stocks service error"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response.checks.stocks).toBe(false);
      expect(response.checks.alertes).toBe(true);
    });

    it("devrait indiquer tous les services en échec", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        new Error("Stocks error"),
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Alertes error"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response.checks.stocks).toBe(false);
      expect(response.checks.alertes).toBe(false);
    });

    it("devrait indiquer tous les services en succès", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response.checks.stocks).toBe(true);
      expect(response.checks.alertes).toBe(true);
    });
  });

  // ==================== TESTS DE MESSAGES ====================
  describe("Messages de santé", () => {
    it("devrait avoir un message approprié pour healthy", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response.message).toBe("Tous les services sont opérationnels");
    });

    it("devrait avoir un message approprié pour degraded", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response.message).toBe("1/2 services opérationnels");
    });

    it("devrait avoir un message approprié pour unhealthy", async () => {
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

      const response = jsonMock.mock.calls[0][0];

      expect(response.message).toBe("Services non opérationnels");
    });
  });

  // ==================== TESTS D'ERREURS INATTENDUES ====================
  describe("Erreurs inattendues dans le health check", () => {
    it("devrait gérer une erreur synchrone avant les checks", async () => {
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

    it("devrait gérer une erreur dans le catch global", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue(
        null,
      );
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        undefined,
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });

  // ==================== TESTS DE STABILITÉ ====================
  describe("Stabilité du health check", () => {
    it("devrait être idempotent (résultats cohérents)", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response1 = jsonMock.mock.calls[0][0];

      // Clear et relancer
      jest.clearAllMocks();
      jsonMock = jest.fn();
      statusMock = jest.fn(() => mockResponse as Response);
      mockResponse.json = jsonMock;
      mockResponse.status = statusMock;

      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockResolvedValue([
        { id: 1, article_id: 1, quantite: 10, article_nom: "Test" },
      ]);
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockStocksClient as Stocks,
      );

      const response2 = jsonMock.mock.calls[0][0];

      expect(response1.status).toBe(response2.status);
      expect(response1.checks).toEqual(response2.checks);
    });

    it("ne devrait jamais crasher, même avec des erreurs étranges", async () => {
      (mockStocksClient.obtenirTousLesStocks as jest.Mock).mockRejectedValue({
        weird: "object",
      });
      (mockStocksClient.obtenirAlertesStock as jest.Mock).mockRejectedValue(
        123,
      );

      await expect(
        healthCheck(
          mockRequest as Request,
          mockResponse as Response,
          mockStocksClient as Stocks,
        ),
      ).resolves.not.toThrow();

      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });
});
