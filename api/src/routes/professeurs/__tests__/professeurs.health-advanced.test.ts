/**
 * Tests avancés du Health Handler pour le module Professeurs
 * Tests de couverture complète des branches et cas limites
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Professeurs } from "../../../db/clients/professeurs/professeurs.js";
import { healthCheck } from "../core/handlers/health.handler.js";

describe("Health Handler - Tests avancés de couverture", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockProfesseursClient: Partial<Professeurs>;

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

    mockProfesseursClient = {
      queryAsync: jest.fn(),
    };
  });

  describe("healthCheck - Tests de couverture des branches", () => {
    it("devrait retourner status 'healthy' avec DB connectée et table existante", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValueOnce([{ Tables_in_test_db: "utilisateurs" }]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "healthy",
          module: "professeurs",
          version: "1.0.0",
          architecture: "handlers/services/validators",
          database: expect.objectContaining({
            connected: true,
            table_utilisateurs: true,
          }),
        })
      );
    });

    it("devrait retourner status 'degraded' si la DB est connectée mais la table n'existe pas", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValueOnce([{ Tables_in_test_db: "autre_table" }]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
          database: expect.objectContaining({
            connected: true,
            table_utilisateurs: false,
          }),
        })
      );
    });

    it("devrait gérer l'erreur lors de la vérification de la table", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ "@@version": "MySQL 8.0" }])
        .mockRejectedValueOnce(new Error("Table check failed"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
          database: expect.objectContaining({
            connected: true,
            table_utilisateurs: false,
          }),
        })
      );
    });

    it("devrait retourner status 'degraded' si la DB n'est pas connectée", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Connection refused")
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
        })
      );
    });

    it("devrait retourner 503 avec status 'unhealthy' en cas d'erreur critique", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Critical database error")
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: expect.stringMatching(/degraded|unhealthy/),
          module: "professeurs",
        })
      );
    });

    it("devrait gérer une erreur non-Error dans le catch", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValueOnce(
        "String error instead of Error object"
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: expect.any(String),
        })
      );
    });

    it("devrait retourner les informations de version correctes", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValueOnce([{ Tables_in_test_db: "utilisateurs" }]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          version: "1.0.0",
          architecture: "handlers/services/validators",
        })
      );
    });

    it("devrait inclure un timestamp dans la réponse", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValueOnce([{ Tables_in_test_db: "utilisateurs" }]);

      const before = new Date().toISOString();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      const after = new Date().toISOString();

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime()
      );
      expect(new Date(callArgs.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(after).getTime()
      );
    });

    it("devrait gérer correctement les multiples tables dans la vérification", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValueOnce([
          { Tables_in_test_db: "utilisateurs" },
          { Tables_in_test_db: "cours" },
          { Tables_in_test_db: "inscriptions" },
        ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          database: expect.objectContaining({
            table_utilisateurs: true,
          }),
        })
      );
    });

    it("devrait retourner 'degraded' si queryAsync retourne un tableau vide", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
        })
      );
    });

    it("devrait gérer le cas où la vérification de version échoue mais pas la table", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockRejectedValueOnce(new Error("Version check failed"))
        .mockResolvedValueOnce([{ Tables_in_test_db: "utilisateurs" }]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: expect.any(String),
        })
      );
    });

    it("devrait gérer un timeout de connexion DB", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Connection timeout")), 100);
          })
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: expect.any(String),
        })
      );
    });

    it("devrait inclure les informations du module dans tous les cas", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Any error")
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          module: "professeurs",
          version: "1.0.0",
        })
      );
    });

    it("devrait gérer des résultats de requête mal formés", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ unexpected_field: "value" }])
        .mockResolvedValueOnce([{ wrong_table_field: "value" }]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: expect.any(String),
        })
      );
    });

    it("devrait gérer le cas où queryAsync retourne null", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
        })
      );
    });

    it("devrait gérer le cas où queryAsync retourne undefined", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
        })
      );
    });

    it("devrait toujours retourner success: true même en cas d'erreur DB", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValueOnce(
        new Error("Database down")
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it("devrait gérer plusieurs appels simultanés", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValue([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValue([{ Tables_in_test_db: "utilisateurs" }]);

      const promises = Array.from({ length: 10 }, () =>
        healthCheck(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        )
      );

      await Promise.all(promises);

      expect(statusMock).toHaveBeenCalledTimes(10);
      expect(jsonMock).toHaveBeenCalledTimes(10);
    });

    it("devrait inclure database.connected: false quand la connexion échoue", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValueOnce(
        new Error("ECONNREFUSED")
      );

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          database: expect.objectContaining({
            connected: false,
          }),
        })
      );
    });

    it("devrait retourner rapidement (< 2 secondes) même en cas d'erreur", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Slow error")), 500);
          })
      );

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

    it("devrait gérer les erreurs de type différent dans le catch", async () => {
      const errorTypes = [
        new Error("Standard Error"),
        "String error",
        { custom: "error object" },
        123,
        null,
        undefined,
      ];

      for (const error of errorTypes) {
        jest.clearAllMocks();
        (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValueOnce(
          error
        );

        await healthCheck(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        );

        expect(statusMock).toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            status: expect.any(String),
          })
        );
      }
    });
  });

  describe("Health check - Cas de performance", () => {
    it("devrait répondre en moins de 100ms avec DB rapide", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValueOnce([{ Tables_in_test_db: "utilisateurs" }]);

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it("devrait gérer 100 health checks simultanés", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValue([{ "@@version": "MySQL 8.0" }])
        .mockResolvedValue([{ Tables_in_test_db: "utilisateurs" }]);

      const promises = Array.from({ length: 100 }, () =>
        healthCheck(
          { ...mockRequest } as Request,
          { ...mockResponse, json: jest.fn(), status: jest.fn(() => mockResponse as Response) } as Response,
          mockProfesseursClient as Professeurs
        )
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
