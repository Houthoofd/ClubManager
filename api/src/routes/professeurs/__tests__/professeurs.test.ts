/**
 * Tests de base pour le module Professeurs
 * Tests des fonctionnalités principales (happy path)
 * Pattern avec injection de dépendance
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Professeurs } from "../../../db/clients/professeurs/professeurs.js";
import {
  getProfesseurs,
  getProfesseurById,
  ajouterProfesseurHandler,
  modifierStatutProfesseurHandler,
  getPlanningProfesseur,
  healthCheck,
} from "../core/handlers/index.js";

describe("Professeurs Module - Tests de base", () => {
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

    // Mock du client Professeurs
    mockProfesseursClient = {
      obtenirLesProfesseurs: jest.fn(),
      obtenirUtilisateurParId: jest.fn(),
      ajouterUnProfesseur: jest.fn(),
      modifierStatutProfesseur: jest.fn(),
      obtenirPlanningCoursProfesseur: jest.fn(),
      queryAsync: jest.fn() as any,
    };
  });

  describe("getProfesseurs - GET /api/professeurs", () => {
    it("devrait retourner la liste de tous les professeurs", async () => {
      const mockProfesseurs = [
        {
          id: 1,
          first_name: "Jean",
          last_name: "Dupont",
          email: "jean.dupont@example.com",
          role_id: 2,
          status_id: 1,
        },
        {
          id: 2,
          first_name: "Marie",
          last_name: "Martin",
          email: "marie.martin@example.com",
          role_id: 2,
          status_id: 1,
        },
      ];

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        message: "Professeurs trouvés",
        data: mockProfesseurs,
      });

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          data: mockProfesseurs,
        }),
      );
    });

    it("devrait retourner un tableau vide si aucun professeur", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: false,
        message: "Aucun professeur trouvé",
        data: [],
      });

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 0,
          data: [],
        }),
      );
    });

    it("devrait gérer les erreurs de base de données", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Erreur DB"));

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });
  });

  describe("getProfesseurById - GET /api/professeurs/:id", () => {
    it("devrait retourner les informations d'un professeur", async () => {
      mockRequest.params = { id: "1" };

      const mockProfesseur = {
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        role_id: 2,
        status_id: 1,
        telephone: "0612345678",
        adresse: "123 rue de Paris",
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfesseur,
        }),
      );
    });

    it("devrait retourner 404 si le professeur n'existe pas", async () => {
      mockRequest.params = { id: "999" };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(null);

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Professeur non trouvé",
        }),
      );
    });

    it("devrait retourner 400 si l'ID est invalide", async () => {
      mockRequest.params = { id: "abc" };

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });
  });

  describe("ajouterProfesseurHandler - POST /api/professeurs/ajouter", () => {
    it("devrait promouvoir un utilisateur comme professeur", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      const mockResult = {
        isConfirm: true,
        message: "Professeur promu avec succès",
        data: { promoted_users: [1] },
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("succès"),
        }),
      );
    });

    it("devrait promouvoir plusieurs utilisateurs", async () => {
      mockRequest.body = {
        utilisateurs: [1, 2, 3],
      };

      const mockResult = {
        isConfirm: true,
        message: "3 professeurs promus avec succès",
        data: { promoted_users: [1, 2, 3] },
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait retourner 400 si aucun utilisateur fourni", async () => {
      mockRequest.body = {};

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait gérer les erreurs de promotion", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockRejectedValue(new Error("Erreur promotion"));

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });
  });

  describe("modifierStatutProfesseurHandler - POST /api/professeurs/modifier", () => {
    it("devrait modifier le statut d'un professeur", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 2,
      };

      const mockResult = {
        isConfirm: true,
        message: "Statut modifié avec succès",
        data: { id: 1, status_id: 2 },
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("succès"),
        }),
      );
    });

    it("devrait retourner 400 si l'ID est manquant", async () => {
      mockRequest.body = {
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID et status_id requis",
        }),
      );
    });

    it("devrait retourner 400 si le status_id est manquant", async () => {
      mockRequest.body = {
        id: 1,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID et status_id requis",
        }),
      );
    });

    it("devrait retourner 400 si le status_id est invalide", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 0,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait gérer les erreurs de modification", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 2,
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockRejectedValue(new Error("Erreur modification"));

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });
  });

  describe("getPlanningProfesseur - GET /api/professeurs/:id/planning", () => {
    it("devrait retourner le planning d'un professeur", async () => {
      mockRequest.params = { id: "1" };

      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: [
          {
            id: 1,
            nom_cours: "Yoga débutant",
            jour_semaine: "Lundi",
            heure_debut: "09:00",
            heure_fin: "10:00",
            salle: "Salle A",
            niveau: "Débutant",
            capacite_max: 15,
            professeur_id: 1,
          },
          {
            id: 2,
            nom_cours: "Yoga avancé",
            jour_semaine: "Mercredi",
            heure_debut: "18:00",
            heure_fin: "19:30",
            salle: "Salle B",
            niveau: "Avancé",
            capacite_max: 10,
            professeur_id: 1,
          },
        ],
      };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanning);

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isFind: true,
          data: mockPlanning.data,
          count: 2,
          professeur_id: 1,
        }),
      );
    });

    it("devrait retourner un tableau vide si le professeur n'a pas de cours", async () => {
      mockRequest.params = { id: "1" };

      const mockPlanning = {
        isFind: false,
        message: "Aucun cours trouvé",
        data: [],
      };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanning);

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          isFind: false,
          data: [],
          count: 0,
        }),
      );
    });

    it("devrait retourner 400 si l'ID est invalide", async () => {
      mockRequest.params = { id: "abc" };

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          isFind: false,
          message: "ID du professeur invalide",
        }),
      );
    });

    it("devrait gérer les erreurs de récupération du planning", async () => {
      mockRequest.params = { id: "1" };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockRejectedValue(new Error("Erreur DB"));

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          isFind: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });
  });

  describe("healthCheck - GET /api/professeurs/health", () => {
    it("devrait retourner le statut de santé du module", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        message: "Professeurs trouvés",
        data: Array(5).fill({ id: 1, first_name: "Test" }),
      });

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "healthy",
          module: "professeurs",
          database: expect.objectContaining({
            connected: true,
          }),
        }),
      );
    });

    it("devrait retourner un statut dégradé si la DB n'est pas accessible", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockRejectedValue(new Error("Erreur connexion DB"));

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "degraded",
          module: "professeurs",
        }),
      );
    });
  });
});
