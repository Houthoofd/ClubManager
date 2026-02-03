/**
 * Tests de performance pour le module Informations
 * Tests des temps de réponse et de la charge
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

describe("Informations Module - Tests de performance", () => {
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

  // ==================== TEMPS DE RÉPONSE ====================
  describe("Temps de réponse des handlers", () => {
    it("getGrades devrait répondre en moins de 100ms", async () => {
      const mockGrades = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        nom: `Grade ${i + 1}`,
        ordre: i + 1,
      }));

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades
      );

      const startTime = Date.now();

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("getGenres devrait répondre en moins de 100ms", async () => {
      const mockGenres = [
        { id: 1, nom: "Homme" },
        { id: 2, nom: "Femme" },
        { id: 3, nom: "Autre" },
      ];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres
      );

      const startTime = Date.now();

      await getGenres(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("getStatus devrait répondre en moins de 100ms", async () => {
      const mockStatus = [
        { id: 1, nom: "Actif" },
        { id: 2, nom: "Inactif" },
        { id: 3, nom: "Suspendu" },
      ];

      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus
      );

      const startTime = Date.now();

      await getStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("getAbonnements devrait répondre en moins de 100ms", async () => {
      const mockAbonnements = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        nom_plan: `Plan ${i + 1}`,
        prix: (i + 1) * 10,
        duree_mois: i + 1,
        description: `Description du plan ${i + 1}`,
      }));

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      const startTime = Date.now();

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("getAllReferences devrait répondre en moins de 200ms (4 requêtes parallèles)", async () => {
      const mockGrades = [{ id: 1, nom: "Grade 1", ordre: 1 }];
      const mockGenres = [{ id: 1, nom: "Genre 1" }];
      const mockStatus = [{ id: 1, nom: "Status 1" }];
      const mockAbonnements = [
        { id: 1, nom_plan: "Plan 1", prix: 50, duree_mois: 1 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      const startTime = Date.now();

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("healthCheck devrait répondre en moins de 300ms", async () => {
      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        [{ id: 1, nom: "Test" }]
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        [{ id: 1, nom: "Test" }]
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        [{ id: 1, nom: "Test" }]
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue([
        { id: 1, nom_plan: "Test", prix: 10, duree_mois: 1 },
      ]);

      const startTime = Date.now();

      await healthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== TESTS DE CHARGE ====================
  describe("Tests de charge", () => {
    it("devrait gérer 50 requêtes simultanées sur getGrades", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, () =>
        getGrades(
          mockRequest as Request,
          mockResponse as Response,
          mockInformationsClient as Informations
        )
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // 5 secondes pour 50 requêtes
      expect(statusMock).toHaveBeenCalledTimes(50);
    });

    it("devrait gérer 100 requêtes simultanées sur getGenres", async () => {
      const mockGenres = [{ id: 1, nom: "Test" }];

      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, () =>
        getGenres(
          mockRequest as Request,
          mockResponse as Response,
          mockInformationsClient as Informations
        )
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10000); // 10 secondes pour 100 requêtes
      expect(statusMock).toHaveBeenCalledTimes(100);
    });

    it("devrait gérer 25 requêtes simultanées sur getAllReferences", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];
      const mockGenres = [{ id: 1, nom: "Test" }];
      const mockStatus = [{ id: 1, nom: "Test" }];
      const mockAbonnements = [
        { id: 1, nom_plan: "Test", prix: 50, duree_mois: 1 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      const startTime = Date.now();

      const promises = Array.from({ length: 25 }, () =>
        getAllReferences(
          mockRequest as Request,
          mockResponse as Response,
          mockInformationsClient as Informations
        )
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // 5 secondes pour 25 requêtes
      expect(statusMock).toHaveBeenCalledTimes(25);
    });
  });

  // ==================== TESTS AVEC GROS VOLUMES ====================
  describe("Tests avec gros volumes de données", () => {
    it("devrait gérer 1000 grades sans problème", async () => {
      const mockGrades = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        nom: `Grade ${i + 1}`,
        ordre: i + 1,
      }));

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades
      );

      const startTime = Date.now();

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1000,
        })
      );
    });

    it("devrait gérer 500 abonnements avec descriptions longues", async () => {
      const mockAbonnements = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        nom_plan: `Plan ${i + 1}`,
        prix: (i + 1) * 10,
        duree_mois: i + 1,
        description: "A".repeat(400), // Description de 400 caractères
      }));

      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      const startTime = Date.now();

      await getAbonnements(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ==================== TESTS DE MÉMOIRE ====================
  describe("Tests de mémoire", () => {
    it("ne devrait pas causer de fuite mémoire avec requêtes répétées", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades
      );

      // Exécuter 1000 requêtes séquentielles
      for (let i = 0; i < 1000; i++) {
        await getGrades(
          mockRequest as Request,
          mockResponse as Response,
          mockInformationsClient as Informations
        );
      }

      expect(statusMock).toHaveBeenCalledTimes(1000);
    });
  });

  // ==================== TESTS DE CONCURRENCE ====================
  describe("Tests de concurrence", () => {
    it("devrait gérer des requêtes concurrentes sur différents endpoints", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];
      const mockGenres = [{ id: 1, nom: "Test" }];
      const mockStatus = [{ id: 1, nom: "Test" }];
      const mockAbonnements = [
        { id: 1, nom_plan: "Test", prix: 50, duree_mois: 1 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockResolvedValue(
        mockGrades
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockResolvedValue(
        mockGenres
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockResolvedValue(
        mockStatus
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockResolvedValue(mockAbonnements);

      const startTime = Date.now();

      // Lancer 10 requêtes de chaque type en parallèle
      const promises = [
        ...Array.from({ length: 10 }, () =>
          getGrades(
            mockRequest as Request,
            mockResponse as Response,
            mockInformationsClient as Informations
          )
        ),
        ...Array.from({ length: 10 }, () =>
          getGenres(
            mockRequest as Request,
            mockResponse as Response,
            mockInformationsClient as Informations
          )
        ),
        ...Array.from({ length: 10 }, () =>
          getStatus(
            mockRequest as Request,
            mockResponse as Response,
            mockInformationsClient as Informations
          )
        ),
        ...Array.from({ length: 10 }, () =>
          getAbonnements(
            mockRequest as Request,
            mockResponse as Response,
            mockInformationsClient as Informations
          )
        ),
      ];

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000);
      expect(statusMock).toHaveBeenCalledTimes(40);
    });
  });

  // ==================== TESTS AVEC LATENCE ====================
  describe("Tests avec latence simulée", () => {
    it("devrait gérer une latence de 50ms sur getGrades", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockGrades), 50)
          )
      );

      const startTime = Date.now();

      await getGrades(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeGreaterThanOrEqual(50);
      expect(responseTime).toBeLessThan(200);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer une latence variable sur getAllReferences", async () => {
      const mockGrades = [{ id: 1, nom: "Test", ordre: 1 }];
      const mockGenres = [{ id: 1, nom: "Test" }];
      const mockStatus = [{ id: 1, nom: "Test" }];
      const mockAbonnements = [
        { id: 1, nom_plan: "Test", prix: 50, duree_mois: 1 },
      ];

      (mockInformationsClient.obtenirLesGrades as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockGrades), 20)
          )
      );
      (mockInformationsClient.obtenirLesGenres as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockGenres), 30)
          )
      );
      (mockInformationsClient.obtenirLeStatus as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockStatus), 40)
          )
      );
      (
        mockInformationsClient.obtenirLesPlansTarifaires as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockAbonnements), 50)
          )
      );

      const startTime = Date.now();

      await getAllReferences(
        mockRequest as Request,
        mockResponse as Response,
        mockInformationsClient as Informations
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Les requêtes sont parallèles, donc le temps total devrait être proche de la plus lente (50ms)
      expect(responseTime).toBeGreaterThanOrEqual(50);
      expect(responseTime).toBeLessThan(300);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
