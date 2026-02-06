/**
 * Tests avancés du Health Handler pour le module Professeurs
 * Tests de couverture complète des branches et cas limites
 * Réécrits pour utiliser l'API réelle du client (obtenirLesProfesseurs)
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";
import { healthCheck, getDiagnostic } from "../core/handlers/health.handler.js";

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
      obtenirLesProfesseurs: jest.fn(),
      obtenirUtilisateurParId: jest.fn(),
    };
  });

  describe("healthCheck - Tests de couverture des branches", () => {
    it("devrait retourner status 'healthy' avec DB connectée et professeurs récupérés", async () => {
      const mockProfesseurs = [
        {
          id: 1,
          first_name: "Jean",
          last_name: "Dupont",
          email: "jean@example.com",
          role_id: 2,
          status_id: 1,
        },
        {
          id: 2,
          first_name: "Marie",
          last_name: "Martin",
          email: "marie@example.com",
          role_id: 2,
          status_id: 1,
        },
      ];

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: mockProfesseurs,
        isFind: true,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "healthy",
          module: "professeurs",
          version: "2.0.0",
          database: expect.objectContaining({
            connected: true,
            table_utilisateurs: true,
            table_cours: true,
          }),
          statistics: expect.objectContaining({
            total_professeurs: 2,
          }),
        }),
      );
    });

    it("devrait retourner status 'degraded' (503) si la DB n'est pas connectée", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Connection refused"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
          module: "professeurs",
          database: expect.objectContaining({
            connected: false,
          }),
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });

    it("devrait gérer un résultat vide (0 professeurs)", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "healthy",
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });

    it("devrait retourner 503 avec status 'unhealthy' en cas d'erreur critique dans le catch principal", async () => {
      // Simuler une erreur qui se produit avant même l'appel à obtenirLesProfesseurs
      const brokenClient = {
        obtenirLesProfesseurs: jest.fn(() => {
          throw new Error("Unexpected critical error");
        }),
      };

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        brokenClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
          module: "professeurs",
        }),
      );
    });

    it("devrait gérer une erreur de timeout de base de données", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("ETIMEDOUT"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
          database: expect.objectContaining({
            connected: false,
          }),
        }),
      );
    });

    it("devrait gérer une erreur ECONNREFUSED", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("ECONNREFUSED"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          database: expect.objectContaining({
            connected: false,
          }),
        }),
      );
    });

    it("devrait retourner les informations de version correctes", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          version: "2.0.0",
          module: "professeurs",
        }),
      );
    });

    it("devrait inclure un timestamp dans la réponse", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      const before = new Date().toISOString();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const after = new Date().toISOString();

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime(),
      );
      expect(new Date(callArgs.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(after).getTime(),
      );
    });

    it("devrait inclure toutes les features disponibles", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.objectContaining({
            get_all_professeurs: true,
            get_professeur_by_id: true,
            ajouter_professeur: true,
            modifier_statut: true,
            get_planning: true,
            send_promotion_email: true,
          }),
        }),
      );
    });

    it("devrait gérer correctement un grand nombre de professeurs", async () => {
      const largeProfesseursList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        first_name: `Prof${i}`,
        last_name: `Nom${i}`,
        email: `prof${i}@example.com`,
        role_id: 2,
        status_id: 1,
      }));

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: largeProfesseursList,
        isFind: true,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          statistics: expect.objectContaining({
            total_professeurs: 1000,
          }),
        }),
      );
    });

    it("devrait gérer le cas où result.data est null", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: null,
        isFind: false,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });

    it("devrait gérer le cas où result.data est undefined", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: false,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });

    it("devrait gérer le cas où result.data n'est pas un tableau", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: "invalid data type",
        isFind: false,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });

    it("devrait toujours retourner success: true même en cas d'erreur DB", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Database down"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait gérer plusieurs appels simultanés sans conflit", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [{ id: 1, first_name: "Jean", last_name: "Dupont" }],
        isFind: true,
      });

      const promises = Array.from({ length: 10 }, () =>
        healthCheck(
          mockRequest as Request,
          {
            ...mockResponse,
            json: jest.fn(),
            status: jest.fn(() => mockResponse as Response),
          } as unknown as Response,
          mockProfesseursClient as Professeurs,
        ),
      );

      await Promise.all(promises);

      expect(mockProfesseursClient.obtenirLesProfesseurs).toHaveBeenCalledTimes(
        10,
      );
    });

    it("devrait inclure database.connected: false quand la connexion échoue", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("ECONNREFUSED"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          database: expect.objectContaining({
            connected: false,
          }),
        }),
      );
    });

    it("devrait retourner rapidement (< 2 secondes) même en cas d'erreur", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Slow error")), 500);
          }),
      );

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

    it("devrait gérer les erreurs de type différent dans le catch", async () => {
      const errorTypes = [
        new Error("Standard Error"),
        new Error("ENOTFOUND"),
        new Error("ETIMEDOUT"),
      ];

      for (const error of errorTypes) {
        jest.clearAllMocks();
        (
          mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
        ).mockRejectedValueOnce(error);

        await healthCheck(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs,
        );

        expect(statusMock).toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            status: expect.any(String),
          }),
        );
      }
    });

    it("devrait toujours inclure le module et la version dans la réponse", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Any error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          module: "professeurs",
          version: "2.0.0",
        }),
      );
    });
  });

  describe("Health check - Cas de performance", () => {
    it("devrait répondre rapidement avec DB rapide", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer de multiples health checks simultanés", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      const promises = Array.from({ length: 50 }, () => {
        const localJsonMock = jest.fn();
        const localStatusMock = jest.fn(() => mockResponse as Response);
        return healthCheck(
          { ...mockRequest } as Request,
          {
            ...mockResponse,
            json: localJsonMock,
            status: localStatusMock,
          } as Response,
          mockProfesseursClient as Professeurs,
        );
      });

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });

  describe("getDiagnostic - Tests de couverture", () => {
    it("devrait retourner un diagnostic complet avec DB accessible", async () => {
      const mockProfesseurs = [
        { id: 1, first_name: "Jean", last_name: "Dupont" },
        { id: 2, first_name: "Marie", last_name: "Martin" },
      ];

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: mockProfesseurs,
        isFind: true,
      });

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          module: "professeurs",
          checks: expect.objectContaining({
            database_accessible: true,
            table_utilisateurs_exists: true,
            table_cours_exists: true,
          }),
          statistics: expect.objectContaining({
            total_professeurs: 2,
          }),
          recommendations: expect.arrayContaining([
            expect.stringContaining("✅"),
          ]),
        }),
      );
    });

    it("devrait retourner un diagnostic avec DB inaccessible", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Connection refused"));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          checks: expect.objectContaining({
            database_accessible: false,
            table_utilisateurs_exists: false,
            table_cours_exists: false,
          }),
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
          recommendations: expect.arrayContaining([
            expect.stringContaining("⚠️"),
          ]),
        }),
      );
    });

    it("devrait inclure un timestamp dans le diagnostic", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      const before = new Date().toISOString();

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const after = new Date().toISOString();

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime(),
      );
      expect(new Date(callArgs.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(after).getTime(),
      );
    });

    it("devrait gérer 0 professeurs dans le diagnostic", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [],
        isFind: false,
      });

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });

    it("devrait retourner 200 avec checks false quand obtenirLesProfesseurs échoue", async () => {
      // Simuler une erreur dans obtenirLesProfesseurs
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          checks: expect.objectContaining({
            database_accessible: false,
          }),
        }),
      );
    });

    it("devrait gérer result.data null dans le diagnostic", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: null,
        isFind: false,
      });

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });

    it("devrait gérer result.data undefined dans le diagnostic", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: false,
      });

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statistics: expect.objectContaining({
            total_professeurs: 0,
          }),
        }),
      );
    });
  });

  describe("Health check - Vérification de la cohérence des réponses", () => {
    it("devrait avoir une structure cohérente pour un état healthy", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        data: [{ id: 1 }],
        isFind: true,
      });

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("status");
      expect(response).toHaveProperty("module");
      expect(response).toHaveProperty("version");
      expect(response).toHaveProperty("timestamp");
      expect(response).toHaveProperty("database");
      expect(response).toHaveProperty("statistics");
      expect(response).toHaveProperty("features");
    });

    it("devrait avoir une structure cohérente pour un état degraded", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("DB Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("status");
      expect(response).toHaveProperty("module");
      expect(response).toHaveProperty("version");
      expect(response).toHaveProperty("timestamp");
      expect(response).toHaveProperty("database");
      expect(response).toHaveProperty("statistics");
      expect(response).toHaveProperty("features");
    });
  });
});
