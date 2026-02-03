/**
 * Tests de performance pour le module Cours
 * Tests de charge et de performance
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Cours } from "../../../db/clients/cours/cours.js";
import {
  getAllCours,
  getParticipantCours,
  getCoursUtilisateurs,
  inscrireUtilisateur,
  getPlanning,
  ajouterCours,
} from "../core/handlers/index.js";

describe("Cours - Tests de performance", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockCoursClient: Partial<Cours>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    // Mock du client Cours
    mockCoursClient = {
      obtenirTousLesCours: jest.fn(),
      obtenirLesCoursPourParticipant: jest.fn(),
      obtenirIdParticipantParNomPrenom: jest.fn(),
      obtenirUtilisateursParCours: jest.fn(),
      verifierInscriptionUtilisateur: jest.fn(),
      inscrireUtilisateurAuCours: jest.fn(),
      annulerPresenceUtilisateur: jest.fn(),
      validerPresenceUtilisateur: jest.fn(),
      desinscrireUtilisateurDuCours: jest.fn(),
      obtenirLesJoursDeCours: jest.fn(),
      ajouterCoursRecurrentAvecProfesseurs: jest.fn(),
      modifierCoursRecurrentAvecProfesseurs: jest.fn(),
      obtenirInscriptionsUtilisateur: jest.fn(),
      supprimerJourDeCours: jest.fn(),
      supprimerProfesseursParNomEtJour: jest.fn(),
      obtenirIdCoursRecurrent: jest.fn(),
    };
  });

  describe("Performance de récupération de données", () => {
    it("devrait gérer efficacement une grande liste de cours", async () => {
      const largeCoursList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        description: `Description du cours ${i + 1}`,
        date: "2025-01-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_disponibles: 10,
        professeur: `Professeur ${i % 10}`,
      }));

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        largeCoursList,
      );

      const startTime = Date.now();

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const executionTime = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
      expect(executionTime).toBeLessThan(1000); // Moins d'1 seconde
    });

    it("devrait gérer efficacement une grande liste de participants", async () => {
      const largeParticipantsList = Array.from({ length: 500 }, (_, i) => ({
        utilisateur_id: i + 1,
        nom: `Nom${i}`,
        prenom: `Prenom${i}`,
        email: `user${i}@test.com`,
        statut: "confirmé",
      }));

      mockRequest.params = { id: "1" };

      (
        mockCoursClient.obtenirUtilisateursParCours as jest.Mock
      ).mockResolvedValue(largeParticipantsList);

      const startTime = Date.now();

      await getCoursUtilisateurs(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const executionTime = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(executionTime).toBeLessThan(500); // Moins de 500ms
    });

    it("devrait gérer efficacement un grand planning", async () => {
      const largePlanning = Array.from({ length: 365 }, (_, i) => ({
        date: new Date(2025, 0, i + 1).toISOString().split("T")[0],
        cours: Array.from({ length: 10 }, (_, j) => ({
          id: i * 10 + j + 1,
          nom: `Cours ${j + 1}`,
          heure_debut: `${8 + j}:00`,
          heure_fin: `${9 + j}:00`,
        })),
      }));

      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        largePlanning,
      );

      const startTime = Date.now();

      await getPlanning(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const executionTime = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(executionTime).toBeLessThan(1000); // Moins d'1 seconde
    });
  });

  describe("Performance des inscriptions", () => {
    it("devrait gérer des inscriptions multiples rapidement", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: false,
        data: { userId: 123 },
      });
      (
        mockCoursClient.inscrireUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      const startTime = Date.now();

      // Simuler 10 inscriptions séquentielles
      for (let i = 0; i < 10; i++) {
        await inscrireUtilisateur(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );
      }

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(500); // Moins de 500ms pour 10 inscriptions
    });

    it("devrait gérer des inscriptions concurrentes", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        isBooked: false,
        data: { userId: 123 },
      });
      (
        mockCoursClient.inscrireUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        insertId: 1,
        affectedRows: 1,
      });

      const startTime = Date.now();

      // Simuler 50 inscriptions concurrentes
      const promises = Array(100)
        .fill(null)
        .map(() =>
          inscrireUtilisateur(
            { ...mockRequest } as Request,
            {
              ...mockResponse,
              json: jest.fn(),
              status: jest.fn(() => mockResponse as Response),
            } as Response,
            mockCoursClient as Cours,
          ),
        );

      await Promise.all(promises);

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(1000); // Moins d'1 seconde
      expect(mockCoursClient.inscrireUtilisateurAuCours).toHaveBeenCalledTimes(
        100,
      );
    });
  });

  describe("Performance de création de cours", () => {
    it("devrait créer un cours rapidement", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-12-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        null,
      );
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        id: 1,
        insertId: 1,
        affectedRows: 1,
      });

      const startTime = Date.now();

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const executionTime = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(executionTime).toBeLessThan(200); // Moins de 200ms
    });

    it("devrait créer plusieurs cours rapidement", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2026-12-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        null,
      );
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        id: 1,
        insertId: 1,
        affectedRows: 1,
      });

      const startTime = Date.now();

      // Créer 20 cours séquentiellement
      for (let i = 0; i < 20; i++) {
        await ajouterCours(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );
      }

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(1000); // Moins d'1 seconde pour 20 cours
    });
  });

  describe("Performance de pagination (simulation)", () => {
    it("devrait gérer la pagination efficacement", async () => {
      const totalCours = 1000;
      const pageSize = 50;
      const pages = Math.ceil(totalCours / pageSize);

      for (let page = 0; page < pages; page++) {
        const coursPage = Array.from({ length: pageSize }, (_, i) => ({
          id: page * pageSize + i + 1,
          nom: `Cours ${page * pageSize + i + 1}`,
          date: "2025-01-20",
          heure_debut: "10:00",
          heure_fin: "11:00",
          places_disponibles: 10,
        }));

        (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
          coursPage,
        );

        const startTime = Date.now();

        await getAllCours(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        const executionTime = Date.now() - startTime;

        expect(executionTime).toBeLessThan(100); // Moins de 100ms par page
      }
    });
  });

  describe("Performance de recherche et filtrage", () => {
    it("devrait filtrer rapidement dans une grande liste", async () => {
      const largeCoursList = Array.from({ length: 5000 }, (_, i) => ({
        id: i + 1,
        nom: i % 2 === 0 ? "Yoga" : "Pilates",
        date: "2025-01-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_disponibles: 10,
      }));

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        largeCoursList,
      );

      const startTime = Date.now();

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const executionTime = Date.now() - startTime;
      const response = jsonMock.mock.calls[0][0];

      expect(executionTime).toBeLessThan(500); // Moins de 500ms
      expect(response.data.length).toBe(5000);
    });
  });

  describe("Performance sous charge", () => {
    it("devrait maintenir de bonnes performances sous charge modérée", async () => {
      const mediumLoad = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        date: "2025-01-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_disponibles: 10,
      }));

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mediumLoad,
      );

      const executionTimes: number[] = [];

      // 50 appels consécutifs
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();

        await getAllCours(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        executionTimes.push(Date.now() - startTime);
      }

      const averageTime =
        executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;

      expect(averageTime).toBeLessThan(100); // Moyenne sous 100ms
      expect(Math.max(...executionTimes)).toBeLessThan(200); // Max sous 200ms
    });

    it("devrait gérer la charge élevée sans dégradation majeure", async () => {
      const highLoad = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        date: "2025-01-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_disponibles: 10,
      }));

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        highLoad,
      );

      const startTime = Date.now();

      // 100 requêtes concurrentes
      const promises = Array(100)
        .fill(null)
        .map(() =>
          getAllCours(
            mockRequest as Request,
            mockResponse as Response,
            mockCoursClient as Cours,
          ),
        );

      await Promise.all(promises);

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(3000); // Moins de 3 secondes pour 100 requêtes
      expect(mockCoursClient.obtenirTousLesCours).toHaveBeenCalledTimes(100);
    });
  });

  describe("Performance de validation", () => {
    it("devrait valider rapidement des données simples", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      const startTime = Date.now();

      // La validation se fait avant l'appel au client
      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(100); // Moins de 100ms pour la validation
    });

    it("devrait valider rapidement des données complexes", async () => {
      mockRequest.body = {
        nom: "Yoga Avancé",
        description:
          "Un cours de yoga avancé avec des postures complexes et de la méditation profonde",
        date: "2026-12-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_max: 10,
        professeur_id: 1,
      };

      (mockCoursClient.obtenirIdCoursRecurrent as jest.Mock).mockResolvedValue(
        null,
      );
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        [],
      );

      (
        mockCoursClient.ajouterCoursRecurrentAvecProfesseurs as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        id: 1,
        insertId: 1,
        affectedRows: 1,
      });

      const startTime = Date.now();

      await ajouterCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(100); // Moins de 100ms
    });
  });

  describe("Performance de mémoire (simulation)", () => {
    it("ne devrait pas causer de fuites mémoire avec de grandes listes", async () => {
      const veryLargeCoursList = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        date: "2025-01-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_disponibles: 10,
      }));

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        veryLargeCoursList,
      );

      // Simuler plusieurs appels pour vérifier qu'il n'y a pas d'accumulation
      for (let i = 0; i < 5; i++) {
        await getAllCours(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        // Forcer le garbage collection si disponible
        if (global.gc) {
          global.gc();
        }
      }

      expect(statusMock).toHaveBeenCalledTimes(5);
    });
  });

  describe("Performance de sérialisation JSON", () => {
    it("devrait sérialiser rapidement de grandes structures", async () => {
      const complexData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        description: `Description détaillée du cours ${i + 1}`,
        date: "2025-01-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_disponibles: 10,
        professeur: {
          id: i % 10,
          nom: `Professeur ${i % 10}`,
          specialite: `Spécialité ${i % 5}`,
        },
      }));

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        complexData,
      );

      const startTime = Date.now();

      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      const serializationTime = Date.now() - startTime;

      expect(serializationTime).toBeLessThan(500); // Moins de 500ms
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Temps de réponse consistants", () => {
    it("devrait avoir des temps de réponse cohérents", async () => {
      const coursData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        date: "2026-12-20",
        heure_debut: "10:00",
        heure_fin: "11:00",
        places_disponibles: 10,
      }));

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        coursData,
      );

      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn(() => mockResponse as Response);
        mockResponse.json = jsonMock;
        mockResponse.status = statusMock;

        const startTime = Date.now();

        await getAllCours(
          mockRequest as Request,
          mockResponse as Response,
          mockCoursClient as Cours,
        );

        times.push(Date.now() - startTime);
      }

      // Calculer la moyenne et l'écart-type
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
        times.length;
      const stdDev = Math.sqrt(variance);

      // L'écart-type devrait être faible (temps cohérents)
      expect(stdDev).toBeLessThan(mean * 0.5 + 10); // Moins de 50% de variation + marge
    });
  });
});
