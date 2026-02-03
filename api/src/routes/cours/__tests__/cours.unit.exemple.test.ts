/**
 * Exemple de tests unitaires pour le module Cours
 * Utilise l'injection de dépendance (pattern identique aux tests commandes)
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Cours } from "../../../db/clients/cours/cours.js";
import {
  getAllCours,
  inscrireUtilisateur,
  getPlanning,
} from "../core/handlers/index.js";

describe("Cours Module - Exemple avec injection de dépendance", () => {
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

    // Mock du client Cours - on peut facilement mocker les méthodes
    mockCoursClient = {
      obtenirTousLesCours: jest.fn(),
      verifierInscriptionUtilisateur: jest.fn(),
      inscrireUtilisateurAuCours: jest.fn(),
      obtenirLesJoursDeCours: jest.fn(),
    };
  });

  describe("getAllCours - GET /api/cours", () => {
    it("devrait retourner tous les cours disponibles", async () => {
      // Arrange - Préparer les données mockées
      const mockCours = [
        {
          id: 1,
          date_cours: "2024-03-15",
          type_cours: "Yoga",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        },
        {
          id: 2,
          date_cours: "2024-03-16",
          type_cours: "Pilates",
          heure_debut: "14:00:00",
          heure_fin: "15:00:00",
        },
      ];

      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue(
        mockCours,
      );

      // Act - Appeler le handler avec le mock injecté
      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert - Vérifier le comportement
      expect(mockCoursClient.obtenirTousLesCours).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockCours,
      });
    });

    it("devrait retourner 404 si aucun cours n'est trouvé", async () => {
      // Arrange
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockResolvedValue([]);

      // Act
      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert
      expect(mockCoursClient.obtenirTousLesCours).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Aucun cours à venir trouvé.",
      });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      // Arrange
      const errorMessage = "Erreur de connexion à la base de données";
      (mockCoursClient.obtenirTousLesCours as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      // Act
      await getAllCours(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert
      expect(mockCoursClient.obtenirTousLesCours).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Erreur serveur lors de la récupération des cours.",
        error: errorMessage,
      });
    });
  });

  describe("inscrireUtilisateur - POST /api/cours/inscription", () => {
    it("devrait inscrire un utilisateur avec succès", async () => {
      // Arrange
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isBooked: false,
        isFind: true,
        message: "L'utilisateur n'est pas encore inscrit au cours.",
        data: { userId: 123, inscriptionId: null },
      });

      (
        mockCoursClient.inscrireUtilisateurAuCours as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
      });

      // Act
      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert
      expect(
        mockCoursClient.verifierInscriptionUtilisateur,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCoursClient.verifierInscriptionUtilisateur,
      ).toHaveBeenCalledWith({
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      });

      expect(mockCoursClient.inscrireUtilisateurAuCours).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCoursClient.inscrireUtilisateurAuCours).toHaveBeenCalledWith({
        cours_id: 1,
        utilisateur_id: 123,
        status_id: 1,
      });

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Utilisateur inscrit avec succès.",
        }),
      );
    });

    it("devrait retourner 409 si l'utilisateur est déjà inscrit", async () => {
      // Arrange
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      (
        mockCoursClient.verifierInscriptionUtilisateur as jest.Mock
      ).mockResolvedValue({
        isBooked: true,
        data: { userId: 123 },
      });

      // Act
      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert
      expect(
        mockCoursClient.verifierInscriptionUtilisateur,
      ).toHaveBeenCalledTimes(1);
      expect(mockCoursClient.inscrireUtilisateurAuCours).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Utilisateur déjà inscrit au cours.",
      });
    });

    it("devrait retourner 400 si cours_id est manquant", async () => {
      // Arrange - cours_id manquant intentionnellement
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: null, // Explicitement null pour déclencher la validation
      };

      // Act
      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert - Le handler vérifie cours_id et retourne 400
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "cours_id est requis",
        }),
      );
    });
  });

  describe("getPlanning - GET /api/cours/planning", () => {
    it("devrait retourner le planning des cours", async () => {
      // Arrange
      const mockPlanning = [
        {
          cours_recurrent_id: 1,
          jour: "Lundi",
          type_cours: "Yoga",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        },
        {
          cours_recurrent_id: 2,
          jour: "Mercredi",
          type_cours: "Pilates",
          heure_debut: "14:00:00",
          heure_fin: "15:00:00",
        },
      ];

      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockResolvedValue(
        mockPlanning,
      );

      // Act
      await getPlanning(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert
      expect(mockCoursClient.obtenirLesJoursDeCours).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockPlanning,
      });
    });

    it("devrait gérer les erreurs lors de la récupération du planning", async () => {
      // Arrange
      const errorMessage = "Erreur lors de la récupération du planning";
      (mockCoursClient.obtenirLesJoursDeCours as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      // Act
      await getPlanning(
        mockRequest as Request,
        mockResponse as Response,
        mockCoursClient as Cours,
      );

      // Assert
      expect(mockCoursClient.obtenirLesJoursDeCours).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Erreur serveur lors de la récupération du planning.",
        error: errorMessage,
      });
    });
  });
});
