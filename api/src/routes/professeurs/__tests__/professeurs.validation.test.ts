/**
 * Tests de validation pour le module Professeurs
 * Tests des validations Zod et des contraintes de données
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Professeurs } from "../../../db/clients/professeurs/professeurs.js";
import {
  ajouterProfesseurHandler,
  modifierStatutProfesseurHandler,
  getProfesseurById,
  getPlanningProfesseur,
} from "../core/handlers/index.js";

describe("Professeurs Module - Tests de validation", () => {
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
      queryAsync: jest.fn(),
    };
  });

  describe("Validation des IDs professeur", () => {
    it("devrait rejeter un ID non numérique", async () => {
      mockRequest.params = { id: "abc" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait rejeter un ID négatif", async () => {
      mockRequest.params = { id: "-1" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait rejeter un ID égal à zéro", async () => {
      mockRequest.params = { id: "0" };

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait accepter un ID valide", async () => {
      mockRequest.params = { id: "1" };

      const mockProfesseur = {
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        role_id: 2,
        status_id: 1,
      };

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue(
        mockProfesseur,
      );

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfesseur,
        }),
      );
    });
  });

  describe("Validation de l'ajout de professeurs", () => {
    it("devrait rejeter si aucun utilisateur n'est fourni", async () => {
      mockRequest.body = {};

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait accepter un tableau d'IDs numériques", async () => {
      mockRequest.body = {
        utilisateurs: [1, 2, 3],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeurs promus avec succès",
        data: { promoted_users: [1, 2, 3] },
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait accepter un tableau d'IDs en string", async () => {
      mockRequest.body = {
        utilisateurs: ["1", "2", "3"],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeurs promus avec succès",
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait accepter un tableau d'objets avec id", async () => {
      mockRequest.body = {
        utilisateurs: [{ id: 1 }, { id: 2 }],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeurs promus avec succès",
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait accepter un seul utilisateur avec id", async () => {
      mockRequest.body = {
        id: 1,
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeur promu avec succès",
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait accepter un seul utilisateur avec userId", async () => {
      mockRequest.body = {
        userId: 1,
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeur promu avec succès",
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait accepter users au lieu de utilisateurs", async () => {
      mockRequest.body = {
        users: [1, 2],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeurs promus avec succès",
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });

  describe("Validation de la modification de statut", () => {
    it("devrait rejeter si l'ID est manquant", async () => {
      mockRequest.body = {
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID et status_id requis",
        }),
      );
    });

    it("devrait rejeter si le status_id est manquant", async () => {
      mockRequest.body = {
        id: 1,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID et status_id requis",
        }),
      );
    });

    it("devrait rejeter un status_id négatif", async () => {
      mockRequest.body = {
        id: 1,
        status_id: -1,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait rejeter un status_id égal à zéro", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 0,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait rejeter un status_id supérieur à 10", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 11,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait accepter un status_id valide (1-10)", async () => {
      const validStatuses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      for (const status_id of validStatuses) {
        jest.clearAllMocks();

        mockRequest.body = {
          id: 1,
          status_id,
        };

        const mockResult = {
        isConfirm: true,
          success: true,
          message: "Statut modifié avec succès",
          data: { id: 1, status_id },
        };

        (mockProfesseursClient.modifierStatutProfesseur as jest.Mock).mockResolvedValue(
          mockResult,
        );

        await modifierStatutProfesseurHandler(
          mockRequest as Request,
          mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
          }),
        );
      }
    });

    it("devrait rejeter un ID non numérique", async () => {
      mockRequest.body = {
        id: "abc",
        status_id: 2,
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait rejeter un status_id non numérique", async () => {
      mockRequest.body = {
        id: 1,
        status_id: "abc",
      };

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });
  });

  describe("Validation du planning", () => {
    it("devrait rejeter un ID de professeur non numérique", async () => {
      mockRequest.params = { id: "abc" };

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
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

    it("devrait rejeter un ID négatif", async () => {
      mockRequest.params = { id: "-5" };

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
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

    it("devrait rejeter un ID égal à zéro", async () => {
      mockRequest.params = { id: "0" };

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
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

    it("devrait accepter un ID valide", async () => {
      mockRequest.params = { id: "1" };

      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: [
          {
            id: 1,
            nom_cours: "Yoga",
            jour_semaine: "Lundi",
            heure_debut: "09:00",
            heure_fin: "10:00",
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
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isFind: true,
          data: mockPlanning.data,
        }),
      );
    });
  });

  describe("Validation des types de données", () => {
    it("devrait gérer des IDs en nombre", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 2,
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Statut modifié avec succès",
      };

      (mockProfesseursClient.modifierStatutProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait rejeter des objets imbriqués invalides", async () => {
      mockRequest.body = {
        utilisateurs: [{ wrongKey: 1 }, { wrongKey: 2 }],
      };

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait rejeter un tableau vide d'utilisateurs", async () => {
      mockRequest.body = {
        utilisateurs: [],
      };

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides",
        }),
      );
    });

    it("devrait accepter un mélange d'IDs et d'objets", async () => {
      mockRequest.body = {
        utilisateurs: [1, { id: 2 }, "3"],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeurs promus avec succès",
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue({
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });
});
