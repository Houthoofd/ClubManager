/**
 * Tests d'intégration mockés pour le module Informations
 * Tests des flux complets handlers → services → client (mocké)
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

describe("Informations Module - Tests d'intégration mockés", () => {
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

  // ==================== FLUX COMPLET GRADES ====================
  describe("Flux complet - Récupération des grades", () => {
    it("devrait récupérer les grades via handler → service → client", async () => {
      const mockGrades = [
        { id: 1, nom: "Ceinture Blanche", ordre: 1 },
        { id: 2, nom: "Ceinture Jaune", ordre: 2 },
        { id: 3, nom: "Ceinture Orange", ordre: 3 },
        { id: 4, nom: "Ceinture Verte", ordre: 4 },
        { id: 5, nom: "Ceinture Bleue", ordre: 5 },
        { id: 6, nom: "Ceinture Marron", ordre: 6 },
        { id: 7, nom: "Ceinture Noire", ordre: 7 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(mockInformationsClient.obtenirLesGrades).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Grades récupérés avec succès",
          data: mockGrades,
          count: 7,
        }),
      );
    });

    it("devrait gérer le cas où aucun grade n'existe", async () => {
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

    it("devrait propager les erreurs du client vers le handler", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockRejectedValue(
        new Error("Database connection failed"),
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
        }),
      );
    });
  });

  // ==================== FLUX COMPLET GENRES ====================
  describe("Flux complet - Récupération des genres", () => {
    it("devrait récupérer les genres via handler → service → client", async () => {
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

      expect(mockInformationsClient.obtenirLesGenres).toHaveBeenCalledTimes(1);
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

    it("devrait gérer le cas où aucun genre n'existe", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [],
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait propager les erreurs du client", async () => {
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Table not found"),
      );

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== FLUX COMPLET STATUS ====================
  describe("Flux complet - Récupération des statuts", () => {
    it("devrait récupérer les statuts via handler → service → client", async () => {
      const mockStatus = [
        { id: 1, nom: "Actif" },
        { id: 2, nom: "Inactif" },
        { id: 3, nom: "Suspendu" },
        { id: 4, nom: "En attente" },
      ];

      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus,
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(mockInformationsClient.obtenirLeStatus).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Statuts récupérés avec succès",
          data: mockStatus,
          count: 4,
        }),
      );
    });

    it("devrait gérer le cas où aucun statut n'existe", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [],
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait propager les erreurs du client", async () => {
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockRejectedValue(
        new Error("Query timeout"),
      );

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== FLUX COMPLET ABONNEMENTS ====================
  describe("Flux complet - Récupération des plans tarifaires", () => {
    it("devrait récupérer les abonnements via handler → service → client", async () => {
      const mockAbonnements = [
        {
          id: 1,
          nom_plan: "Mensuel",
          prix: 50.0,
          duree_mois: 1,
          description: "Abonnement mensuel standard",
        },
        {
          id: 2,
          nom_plan: "Trimestriel",
          prix: 135.0,
          duree_mois: 3,
          description: "Économisez 10% sur 3 mois",
        },
        {
          id: 3,
          nom_plan: "Annuel",
          prix: 480.0,
          duree_mois: 12,
          description: "Meilleur prix - Économisez 20%",
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
      ).toHaveBeenCalledTimes(1);
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

    it("devrait gérer le cas où aucun abonnement n'existe", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([]);

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("devrait propager les erreurs du client", async () => {
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockRejectedValue(new Error("Connection refused"));

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== FLUX COMPLET ALL REFERENCES ====================
  describe("Flux complet - Récupération de toutes les références", () => {
    it("devrait récupérer toutes les références en parallèle", async () => {
      const mockGrades = [
        { id: 1, nom: "Ceinture Blanche", ordre: 1 },
        { id: 2, nom: "Ceinture Noire", ordre: 2 },
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

      expect(mockInformationsClient.obtenirLesGrades).toHaveBeenCalledTimes(1);
      expect(mockInformationsClient.obtenirLesGenres).toHaveBeenCalledTimes(1);
      expect(mockInformationsClient.obtenirLeStatus).toHaveBeenCalledTimes(1);
      expect(
        mockInformationsClient.obtenirLesPlansTarifaires,
      ).toHaveBeenCalledTimes(1);

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

    it("devrait gérer le cas où toutes les listes sont vides", async () => {
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
          data: {
            grades: [],
            genres: [],
            status: [],
            abonnements: [],
          },
        }),
      );
    });

    it("devrait échouer si une des requêtes échoue", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Database error"),
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
        }),
      );
    });
  });

  // ==================== FLUX COMPLET HEALTH CHECK ====================
  describe("Flux complet - Health Check", () => {
    it("devrait vérifier la santé de tous les services", async () => {
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

    it("devrait détecter un service dégradé", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue([
        { id: 1, nom: "Test", ordre: 1 },
      ]);
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockRejectedValue(
        new Error("Service down"),
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

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          checks: {
            grades: true,
            genres: false,
            status: true,
            abonnements: true,
          },
        }),
      );
    });

    it("devrait détecter un système complètement down", async () => {
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
        }),
      );
    });
  });

  // ==================== DÉPENDANCES ET CHAÎNAGE ====================
  describe("Dépendances entre composants", () => {
    it("devrait passer le client injecté du handler au service", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      // Vérifie que le client injecté est bien utilisé
      expect(mockInformationsClient.obtenirLesGrades).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait réutiliser le même client pour toutes les requêtes", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades,
      );

      // Plusieurs appels avec le même client
      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations,
      );

      expect(mockInformationsClient.obtenirLesGrades).toHaveBeenCalledTimes(2);
    });
  });
});
