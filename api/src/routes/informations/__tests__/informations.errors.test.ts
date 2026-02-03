/**
 * Tests de gestion d'erreurs pour le module Informations
 * Tests des scénarios d'erreur (DB, timeout, connexion, etc.)
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Informations } from "../../../db/clients/informations/informations.js";
import {
  getGrades,
  getGenres,
  getStatus,
  getAbonnements,
  getAllReferences,
  healthCheck,
} from "../core/handlers/index.js";

describe("Informations - Tests de gestion d'erreurs", () => {
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

  // ==================== ERREURS DE BASE DE DONNÉES ====================
  describe("Erreurs de base de données", () => {
    it("getGrades - devrait gérer une erreur de connexion DB", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("ECONNREFUSED: Connection refused"),
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des grades",
          error: "Impossible de récupérer les grades",
        }),
      );
    });

    it("getGenres - devrait gérer une erreur de timeout", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("ETIMEDOUT: Operation timed out"),
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des genres",
          error: "Impossible de récupérer les genres",
        }),
      );
    });

    it("getStatus - devrait gérer une erreur de table manquante", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Table 'clubmanager.status' doesn't exist"),
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des statuts",
          error: "Impossible de récupérer les statuts",
        }),
      );
    });

    it("getAbonnements - devrait gérer une erreur de contrainte FK", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Foreign key constraint fails"));

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message:
            "Erreur serveur lors de la récupération des plans tarifaires",
          error: "Impossible de récupérer les plans tarifaires",
        }),
      );
    });
  });

  // ==================== ERREURS DE CONNEXION ====================
  describe("Erreurs de connexion réseau", () => {
    it("devrait gérer une perte de connexion réseau", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("ENETUNREACH: Network is unreachable"),
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des grades",
          error: "Impossible de récupérer les grades",
        }),
      );
    });

    it("devrait gérer un refus de connexion", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("ECONNRESET: Connection reset by peer"),
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un DNS non résolu", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("ENOTFOUND: getaddrinfo ENOTFOUND"),
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS DE TIMEOUT ====================
  describe("Erreurs de timeout", () => {
    it("devrait gérer un timeout de requête SQL", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Query timeout exceeded"),
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des grades",
          error: "Impossible de récupérer les grades",
        }),
      );
    });

    it("devrait gérer un timeout de connexion", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Connection timeout"));

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS INATTENDUES ====================
  describe("Erreurs inattendues", () => {
    it("devrait gérer une erreur sans message", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des grades",
          error: "Impossible de récupérer les grades",
        }),
      );
    });

    it("devrait gérer un rejet avec un objet non-Error", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        "String error",
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un rejet avec null", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        null,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un rejet avec undefined", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(undefined);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur avec stack trace", async () => {
      const error = new Error("Detailed error");
      error.stack = "Error: Detailed error\n    at someFunction";

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        error,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des grades",
          error: "Impossible de récupérer les grades",
        }),
      );
    });
  });

  // ==================== ERREURS DANS getAllReferences ====================
  describe("getAllReferences - Gestion d'erreurs", () => {
    it("devrait retourner 500 si grades échoue", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
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

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait retourner 500 si genres échoue", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait retourner 500 si status échoue", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [],
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait retourner 500 si abonnements échoue", async () => {
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
      ).mockRejectedValue(new Error("DB Error"));

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait retourner 500 si plusieurs services échouent", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Error 1"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Error 2"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS DANS healthCheck ====================
  describe("healthCheck - Gestion d'erreurs gracieuse", () => {
    it("ne devrait jamais crasher même si tout échoue", async () => {
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

    it("devrait retourner degraded avec des erreurs partielles", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
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
        }),
      );
    });

    it("devrait gérer une erreur inattendue dans le catch global", async () => {
      // Mock qui lance une erreur avant même les checks
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockImplementation(
        () => {
          throw new Error("Unexpected sync error");
        },
      );

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

  // ==================== ERREURS DE POOL DE CONNEXIONS ====================
  describe("Erreurs de pool de connexions", () => {
    it("devrait gérer un pool de connexions plein", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Too many connections"),
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des grades",
          error: "Impossible de récupérer les grades",
        }),
      );
    });

    it("devrait gérer une connexion fermée", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Connection lost: The server closed the connection"),
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS D'AUTHENTIFICATION ====================
  describe("Erreurs d'authentification DB", () => {
    it("devrait gérer une erreur d'authentification", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Access denied for user"),
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des statuts",
          error: "Impossible de récupérer les statuts",
        }),
      );
    });

    it("devrait gérer un mot de passe incorrect", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("ER_ACCESS_DENIED_ERROR: Access denied"));

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
