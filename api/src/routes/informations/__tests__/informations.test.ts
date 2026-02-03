/**
 * Tests unitaires principaux pour le module Informations
 * Tests des fonctionnalités de base (happy path + erreurs)
 * Pattern avec injection de dépendance
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
import * as informationsService from "../core/services/informations.service.js";

describe("Informations Module - Tests unitaires de base", () => {
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

    // Mock du client Informations
    mockInformationsClient = {
      obtenirLesGrades: jest.fn(),
      obtenirLesGenres: jest.fn(),
      obtenirLeStatus: jest.fn(),
      obtenirLesPlansTarifaires: jest.fn(),
    };
  });

  // ==================== GET GRADES ====================
  describe("getGrades - GET /api/informations/grades", () => {
    it("devrait retourner la liste des grades", async () => {
      const mockGrades = [
        { id: 1, nom: "Ceinture Blanche", ordre: 1 },
        { id: 2, nom: "Ceinture Jaune", ordre: 2 },
        { id: 3, nom: "Ceinture Orange", ordre: 3 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(mockInformationsClient.obtenirLesGrades).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Grades récupérés avec succès",
          data: mockGrades,
          count: 3,
        }),
      );
    });

    it("devrait retourner 404 si aucun grade trouvé", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [],
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun grade trouvé",
          data: [],
        }),
      );
    });

    it("devrait retourner 404 si obtenirLesGrades retourne null", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        null,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun grade trouvé",
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Erreur base de données"),
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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== GET GENRES ====================
  describe("getGenres - GET /api/informations/genres", () => {
    it("devrait retourner la liste des genres", async () => {
      const mockGenres = [
        { id: 1, nom: "Homme" },
        { id: 2, nom: "Femme" },
        { id: 3, nom: "Autre" },
      ];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(mockInformationsClient.obtenirLesGenres).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Genres récupérés avec succès",
          data: mockGenres,
          count: 3,
        }),
      );
    });

    it("devrait retourner 404 si aucun genre trouvé", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [],
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun genre trouvé",
          data: [],
        }),
      );
    });

    it("devrait retourner 404 si obtenirLesGenres retourne null", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        null,
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun genre trouvé",
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Erreur de connexion"),
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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== GET STATUS ====================
  describe("getStatus - GET /api/informations/status", () => {
    it("devrait retourner la liste des statuts", async () => {
      const mockStatus = [
        { id: 1, nom: "Actif" },
        { id: 2, nom: "Inactif" },
        { id: 3, nom: "Suspendu" },
      ];

      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(mockInformationsClient.obtenirLeStatus).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Statuts récupérés avec succès",
          data: mockStatus,
          count: 3,
        }),
      );
    });

    it("devrait retourner 404 si aucun statut trouvé", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun statut trouvé",
          data: [],
        }),
      );
    });

    it("devrait retourner 404 si obtenirLeStatus retourne null", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        null,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun statut trouvé",
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Database timeout"),
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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== GET ABONNEMENTS ====================
  describe("getAbonnements - GET /api/informations/abonnements", () => {
    it("devrait retourner la liste des plans tarifaires", async () => {
      const mockAbonnements = [
        {
          id: 1,
          nom_plan: "Mensuel",
          prix: 50.0,
          duree_mois: 1,
          description: "Abonnement mensuel",
        },
        {
          id: 2,
          nom_plan: "Trimestriel",
          prix: 135.0,
          duree_mois: 3,
          description: "Abonnement trimestriel avec réduction",
        },
        {
          id: 3,
          nom_plan: "Annuel",
          prix: 480.0,
          duree_mois: 12,
          description: "Abonnement annuel - meilleur prix",
        },
      ];

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(
        mockInformationsClient.obtenirLesPlansTarifaires,
      ).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Plans tarifaires récupérés avec succès",
          data: mockAbonnements,
          count: 3,
        }),
      );
    });

    it("devrait retourner 404 si aucun abonnement trouvé", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun plan tarifaire trouvé",
          data: [],
        }),
      );
    });

    it("devrait retourner 404 si obtenirLesPlansTarifaires retourne null", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(null);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Aucun plan tarifaire trouvé",
        }),
      );
    });

    it("devrait retourner 500 en cas d'erreur serveur", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Connection lost"));

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
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== GET ALL REFERENCES ====================
  describe("getAllReferences - GET /api/informations/all", () => {
    it("devrait retourner toutes les données de référence", async () => {
      const mockGrades = [
        { id: 1, nom: "Ceinture Blanche", ordre: 1 },
        { id: 2, nom: "Ceinture Jaune", ordre: 2 },
      ];
      const mockGenres = [
        { id: 1, nom: "Homme" },
        { id: 2, nom: "Femme" },
      ];
      const mockStatus = [
        { id: 1, nom: "Actif" },
        { id: 2, nom: "Inactif" },
      ];
      const mockAbonnements = [
        { id: 1, nom_plan: "Mensuel", prix: 50.0, duree_mois: 1 },
        { id: 2, nom_plan: "Annuel", prix: 480.0, duree_mois: 12 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres,
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus,
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Toutes les références récupérées avec succès",
          data: {
            grades: mockGrades,
            genres: mockGenres,
            status: mockStatus,
            abonnements: mockAbonnements,
          },
        }),
      );
    });

    it("devrait retourner des tableaux vides si aucune donnée", async () => {
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

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            grades: [],
            genres: [],
            status: [],
            abonnements: [],
          },
        }),
      );
    });

    it("devrait retourner 500 si une des requêtes échoue", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("DB Error"),
      );

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur serveur lors de la récupération des références",
          error: expect.any(String),
        }),
      );
    });
  });

  // ==================== HEALTH CHECK ====================
  describe("healthCheck - GET /api/informations/health", () => {
    it("devrait retourner un statut healthy si tous les services fonctionnent", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
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

    it("devrait retourner un statut degraded si certains services échouent", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test" },
      ]);
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Erreur"));

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

    it("devrait retourner un statut unhealthy si la plupart des services échouent", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
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

    it("devrait retourner unhealthy si tous les services échouent", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Erreur"),
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Erreur"));

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

  // ==================== TESTS DES SERVICES ====================
  describe("Services - Tests unitaires", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("obtenirGrades", () => {
      it("devrait appeler le client et retourner les grades", async () => {
        const mockGrades = [
          { id: 1, nom: "Ceinture Blanche", ordre: 1 },
          { id: 2, nom: "Ceinture Jaune", ordre: 2 },
        ];

        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockResolvedValue(mockGrades);

        const result = await informationsService.obtenirGrades(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual(mockGrades);
        expect(mockInformationsClient.obtenirLesGrades).toHaveBeenCalled();
      });

      it("devrait retourner un tableau vide si aucun grade", async () => {
        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockResolvedValue([]);

        const result = await informationsService.obtenirGrades(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual([]);
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockRejectedValue(new Error("DB Error"));

        await expect(
          informationsService.obtenirGrades(
            mockInformationsClient as Informations,
          ),
        ).rejects.toThrow("Impossible de récupérer les grades");
      });
    });

    describe("obtenirGenres", () => {
      it("devrait appeler le client et retourner les genres", async () => {
        const mockGenres = [
          { id: 1, nom: "Homme" },
          { id: 2, nom: "Femme" },
        ];

        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockResolvedValue(mockGenres);

        const result = await informationsService.obtenirGenres(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual(mockGenres);
        expect(mockInformationsClient.obtenirLesGenres).toHaveBeenCalled();
      });

      it("devrait retourner un tableau vide si aucun genre", async () => {
        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockResolvedValue([]);

        const result = await informationsService.obtenirGenres(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual([]);
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockRejectedValue(new Error("DB Error"));

        await expect(
          informationsService.obtenirGenres(
            mockInformationsClient as Informations,
          ),
        ).rejects.toThrow("Impossible de récupérer les genres");
      });
    });

    describe("obtenirStatus", () => {
      it("devrait appeler le client et retourner les statuts", async () => {
        const mockStatus = [
          { id: 1, nom: "Actif" },
          { id: 2, nom: "Inactif" },
        ];

        (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
          mockStatus,
        );

        const result = await informationsService.obtenirStatus(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual(mockStatus);
        expect(mockInformationsClient.obtenirLeStatus).toHaveBeenCalled();
      });

      it("devrait retourner un tableau vide si aucun statut", async () => {
        (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
          [],
        );

        const result = await informationsService.obtenirStatus(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual([]);
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
          new Error("DB Error"),
        );

        await expect(
          informationsService.obtenirStatus(
            mockInformationsClient as Informations,
          ),
        ).rejects.toThrow("Impossible de récupérer les statuts");
      });
    });

    describe("obtenirAbonnements", () => {
      it("devrait appeler le client et retourner les plans tarifaires", async () => {
        const mockAbonnements = [
          { id: 1, nom_plan: "Mensuel", prix: 50.0, duree_mois: 1 },
          { id: 2, nom_plan: "Annuel", prix: 480.0, duree_mois: 12 },
        ];

        (
          mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
        ).mockResolvedValue(mockAbonnements);

        const result = await informationsService.obtenirAbonnements(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual(mockAbonnements);
        expect(
          mockInformationsClient.obtenirLesPlansTarifaires,
        ).toHaveBeenCalled();
      });

      it("devrait retourner un tableau vide si aucun abonnement", async () => {
        (
          mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
        ).mockResolvedValue([]);

        const result = await informationsService.obtenirAbonnements(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual([]);
      });

      it("devrait lancer une erreur en cas de problème", async () => {
        (
          mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
        ).mockRejectedValue(new Error("DB Error"));

        await expect(
          informationsService.obtenirAbonnements(
            mockInformationsClient as Informations,
          ),
        ).rejects.toThrow("Impossible de récupérer les plans tarifaires");
      });
    });

    describe("obtenirToutesLesReferences", () => {
      it("devrait retourner toutes les références en parallèle", async () => {
        const mockGrades = [{ id: 1, nom: "Ceinture Blanche", ordre: 1 }];
        const mockGenres = [{ id: 1, nom: "Homme" }];
        const mockStatus = [{ id: 1, nom: "Actif" }];
        const mockAbonnements = [
          { id: 1, nom_plan: "Mensuel", prix: 50.0, duree_mois: 1 },
        ];

        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockResolvedValue(mockGrades);
        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockResolvedValue(mockGenres);
        (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
          mockStatus,
        );
        (
          mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
        ).mockResolvedValue(mockAbonnements);

        const result = await informationsService.obtenirToutesLesReferences(
          mockInformationsClient as Informations,
        );

        expect(result).toEqual({
          grades: mockGrades,
          genres: mockGenres,
          status: mockStatus,
          abonnements: mockAbonnements,
        });
      });

      it("devrait lancer une erreur si une des requêtes échoue", async () => {
        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockResolvedValue([]);
        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockRejectedValue(new Error("DB Error"));

        await expect(
          informationsService.obtenirToutesLesReferences(
            mockInformationsClient as Informations,
          ),
        ).rejects.toThrow("Impossible de récupérer les données de référence");
      });
    });

    describe("verifierSanteService", () => {
      it("devrait retourner healthy si tous les checks passent", async () => {
        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockResolvedValue([{ id: 1, nom: "Test" }]);
        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockResolvedValue([{ id: 1, nom: "Test" }]);
        (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
          [{ id: 1, nom: "Test" }],
        );
        (
          mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
        ).mockResolvedValue([
          { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
        ]);

        const result = await informationsService.verifierSanteService(
          mockInformationsClient as Informations,
        );

        expect(result.status).toBe("healthy");
        expect(result.checks).toEqual({
          grades: true,
          genres: true,
          status: true,
          abonnements: true,
        });
      });

      it("devrait retourner degraded si 2-3 checks passent", async () => {
        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockResolvedValue([{ id: 1, nom: "Test" }]);
        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockRejectedValue(new Error("Error"));
        (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
          [{ id: 1, nom: "Test" }],
        );
        (
          mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
        ).mockRejectedValue(new Error("Error"));

        const result = await informationsService.verifierSanteService(
          mockInformationsClient as Informations,
        );

        expect(result.status).toBe("degraded");
        expect(result.checks).toEqual({
          grades: true,
          genres: false,
          status: true,
          abonnements: false,
        });
      });

      it("devrait retourner unhealthy si moins de 2 checks passent", async () => {
        (
          mockInformationsClient.obtenirLesGrades as jest.Mock
        ).mockRejectedValue(new Error("Error"));
        (
          mockInformationsClient.obtenirLesGenres as jest.Mock
        ).mockRejectedValue(new Error("Error"));
        (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
          new Error("Error"),
        );
        (
          mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
        ).mockResolvedValue([
          { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
        ]);

        const result = await informationsService.verifierSanteService(
          mockInformationsClient as Informations,
        );

        expect(result.status).toBe("unhealthy");
        expect(result.checks.grades).toBe(false);
        expect(result.checks.genres).toBe(false);
        expect(result.checks.status).toBe(false);
      });
    });
  });
});
