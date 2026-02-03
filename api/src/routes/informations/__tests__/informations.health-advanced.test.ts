/**
 * Tests avancés du Health Check pour le module Informations
 * Tests exhaustifs des diagnostics et états de santé
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Informations } from "../../../db/clients/informations/informations.js";
import { healthCheck } from "../core/handlers/index.js";
import * as informationsService from "../core/services/informations.service.js";

describe("Informations Module - Tests avancés du Health Check", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockInformationsClient: Partial<Informations>;

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

    mockInformationsClient = {
      obtenirLesGrades: jest.fn(),
      obtenirLesGenres: jest.fn(),
      obtenirLeStatus: jest.fn(),
      obtenirLesPlansTarifaires: jest.fn(),
    };
  });

  // ==================== ÉTATS DE SANTÉ COMPLETS ====================
  describe("États de santé - Tous les scénarios", () => {
    it("devrait retourner healthy avec tous les services OK", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          checks: {
            grades: true,
            genres: true,
            status: true,
            abonnements: true,
          },
          message: "Tous les services sont opérationnels",
        }),
      );
    });

    it("devrait retourner healthy même avec des listes vides", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          checks: {
            grades: true,
            genres: true,
            status: true,
            abonnements: true,
          },
        }),
      );
    });

    it("devrait retourner degraded avec 3 services OK", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Service down"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          checks: {
            grades: true,
            genres: true,
            status: true,
            abonnements: false,
          },
          message: "3/4 services opérationnels",
        }),
      );
    });

    it("devrait retourner degraded avec exactement 2 services OK", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          checks: {
            grades: true,
            genres: false,
            status: true,
            abonnements: false,
          },
          message: "2/4 services opérationnels",
        }),
      );
    });

    it("devrait retourner unhealthy avec seulement 1 service OK", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          checks: {
            grades: false,
            genres: false,
            status: false,
            abonnements: true,
          },
          message: "Seulement 1/4 services opérationnels",
        }),
      );
    });

    it("devrait retourner unhealthy avec 0 services OK", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          checks: {
            grades: false,
            genres: false,
            status: false,
            abonnements: false,
          },
          message: "Seulement 0/4 services opérationnels",
        }),
      );
    });
  });

  // ==================== TESTS DE PROMISE.ALLSETTLED ====================
  describe("Promise.allSettled - Comportement", () => {
    it("devrait utiliser Promise.allSettled pour ne pas crasher", async () => {
      // Un service qui lance une erreur ne devrait pas crasher le health check
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Async error"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
        }),
      );
    });

    it("devrait gérer des rejets avec différentes erreurs", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Timeout error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Connection error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Permission error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
        }),
      );
    });

    it("devrait gérer des rejets avec valeurs non-Error", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        "String error",
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue({
        custom: "error",
      });
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        123,
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(null);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
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
    it("devrait détecter une dégradation partielle (1 service down)", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          message: "3/4 services opérationnels",
        }),
      );
    });

    it("devrait détecter une dégradation sévère (2 services down)", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Down"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          message: "2/4 services opérationnels",
        }),
      );
    });

    it("devrait détecter une panne critique (3 services down)", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Down"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          message: "Seulement 1/4 services opérationnels",
        }),
      );
    });
  });

  // ==================== TESTS DE RÉCUPÉRATION ====================
  describe("Récupération du service", () => {
    it("devrait passer de unhealthy à degraded quand services récupèrent", async () => {
      // Premier appel - tout down
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
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

      // Deuxième appel - 2 services récupèrent
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
        }),
      );
    });

    it("devrait passer de degraded à healthy quand tous récupèrent", async () => {
      // Premier appel - degraded
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
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
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
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
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty("status");
      expect(response).toHaveProperty("checks");
      expect(response).toHaveProperty("message");
      expect(response.checks).toHaveProperty("grades");
      expect(response.checks).toHaveProperty("genres");
      expect(response.checks).toHaveProperty("status");
      expect(response.checks).toHaveProperty("abonnements");
    });

    it("devrait retourner des booléens pour tous les checks", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(typeof response.checks.grades).toBe("boolean");
      expect(typeof response.checks.genres).toBe("boolean");
      expect(typeof response.checks.status).toBe("boolean");
      expect(typeof response.checks.abonnements).toBe("boolean");
    });

    it("devrait retourner un message descriptif", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      const response = jsonMock.mock.calls[0][0];

      expect(typeof response.message).toBe("string");
      expect(response.message.length).toBeGreaterThan(0);
    });
  });

  // ==================== TESTS DE TIMEOUT ET LATENCE ====================
  describe("Timeout et latence", () => {
    it("devrait gérer des services lents mais fonctionnels", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ id: 1, nom: "Test", ordre: 1 }]), 100),
          ),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ id: 1, nom: "Test" }]), 100),
          ),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ id: 1, nom: "Test" }]), 100),
          ),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([{ id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 }]),
              100,
            ),
          ),
      );

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      const endTime = Date.now();

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
        }),
      );

      // Les requêtes sont parallèles, donc < 200ms au lieu de 400ms
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  // ==================== TESTS DE RÉPONSE HTTP ====================
  describe("Status HTTP du health check", () => {
    it("devrait retourner 503 si unhealthy", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
        }),
      );
    });

    it("devrait retourner 503 si degraded", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Error"));

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
        }),
      );
    });

    it("devrait retourner 200 si healthy", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
        }),
      );
    });
  });
});
