/**
 * Tests de gestion des erreurs pour le module Professeurs
 * Tests des cas d'erreur, exceptions et récupération
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
  getDiagnostic,
} from "../core/handlers/index.js";

describe("Professeurs Module - Tests de gestion des erreurs", () => {
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
      ajouterUnProfesseur: jest.fn(),
      modifierStatutProfesseur: jest.fn(),
      obtenirPlanningCoursProfesseur: jest.fn(),
      queryAsync: jest.fn(),
    };
  });

  describe("Erreurs de base de données", () => {
    it("devrait gérer une erreur de connexion à la base de données", async () => {
      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockRejectedValue(
        new Error("ECONNREFUSED: Connection refused"),
      );

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
          error: expect.any(String),
        }),
      );
    });

    it("devrait gérer un timeout de base de données", async () => {
      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockRejectedValue(
        new Error("ETIMEDOUT: Connection timeout"),
      );

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });

    it("devrait gérer une erreur de requête SQL", async () => {
      mockRequest.params = { id: "1" };

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockRejectedValue(
        new Error("ER_BAD_FIELD_ERROR: Unknown column 'invalid_column' in 'field list'"),
      );

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });

    it("devrait gérer une table manquante", async () => {
      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockRejectedValue(
        new Error("ER_NO_SUCH_TABLE: Table 'db.utilisateurs' doesn't exist"),
      );

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur serveur"),
        }),
      );
    });

    it("devrait gérer une erreur de contrainte de clé étrangère", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 2,
      };

      (mockProfesseursClient.modifierStatutProfesseur as jest.Mock).mockRejectedValue(
        new Error("ER_NO_REFERENCED_ROW: Cannot add or update a child row"),
      );

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

  describe("Erreurs de validation des données", () => {
    it("devrait rejeter des données malformées pour l'ajout", async () => {
      mockRequest.body = {
        utilisateurs: "not-an-array",
      };

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

    it("devrait rejeter des IDs d'utilisateurs invalides", async () => {
      mockRequest.body = {
        utilisateurs: [-1, 0, "abc"],
      };

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

    it("devrait rejeter un objet vide pour modification de statut", async () => {
      mockRequest.body = {};

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

    it("devrait rejeter des données avec des types incorrects", async () => {
      mockRequest.body = {
        id: "abc",
        status_id: "def",
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

    it("devrait rejeter des valeurs null ou undefined", async () => {
      mockRequest.body = {
        id: null,
        status_id: undefined,
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
  });

  describe("Erreurs de ressources non trouvées", () => {
    it("devrait gérer un professeur inexistant", async () => {
      mockRequest.params = { id: "99999" };

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue(
        null,
      );

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Professeur non trouvé",
          error: expect.stringContaining("99999"),
        }),
      );
    });

    it("devrait gérer un planning inexistant", async () => {
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
        }),
      );
    });

    it("devrait gérer une tentative de modification d'un professeur inexistant", async () => {
      mockRequest.body = {
        id: 99999,
        status_id: 2,
      };

      const mockErrorResult = {
        success: false,
        message: "Professeur non trouvé",
        error: "Aucun professeur avec l'ID 99999",
      };

      (mockProfesseursClient.modifierStatutProfesseur as jest.Mock).mockResolvedValue(
        mockErrorResult,
      );

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("non trouvé"),
        }),
      );
    });
  });

  describe("Erreurs de promotion", () => {
    it("devrait gérer l'échec de promotion d'un utilisateur", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockRejectedValue(
        new Error("Erreur lors de la promotion"),
      );

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

    it("devrait gérer un utilisateur déjà professeur", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      const mockResult = {
        isConfirm: false,
        success: false,
        message: "L'utilisateur est déjà professeur",
        error: "Rôle déjà attribué",
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait gérer une erreur d'envoi d'email sans faire échouer la promotion", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeur promu avec succès",
        data: { promoted_users: [1] },
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue(
        mockResult,
      );

      // L'utilisateur n'existe pas pour l'email, mais la promotion devrait réussir
      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue(
        null,
      );

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
  });

  describe("Erreurs de health check", () => {
    it("devrait gérer une base de données inaccessible", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Cannot connect to database"),
      );

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

    it("devrait gérer une erreur complète du health check", async () => {
      // Simuler une erreur catastrophique
      (mockProfesseursClient.queryAsync as jest.Mock).mockImplementation(() => {
        throw new Error("Critical error");
      });

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });

  describe("Erreurs de diagnostic", () => {
    it("devrait gérer une erreur lors du diagnostic", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock).mockRejectedValue(
        new Error("Erreur lors du diagnostic"),
      );

      await getDiagnostic(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur lors du diagnostic",
        }),
      );
    });

    it("devrait gérer un diagnostic partiel en cas d'erreur", async () => {
      (mockProfesseursClient.queryAsync as jest.Mock)
        .mockResolvedValueOnce([
          {
            Field: "id",
            Type: "int(11)",
            Null: "NO",
            Key: "PRI",
            Default: null,
          },
        ])
        .mockRejectedValueOnce(new Error("Erreur sur la table cours"));

      await getDiagnostic(mockRequest as Request, mockResponse as Response);

      // Le diagnostic devrait quand même retourner des informations partielles
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Gestion des cas limites", () => {
    it("devrait gérer un ID très grand", async () => {
      mockRequest.params = { id: "999999999999999" };

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue(
        null,
      );

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Professeur non trouvé",
        }),
      );
    });

    it("devrait gérer des caractères spéciaux dans les paramètres", async () => {
      mockRequest.params = { id: "1'; DROP TABLE utilisateurs; --" };

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID professeur invalide",
        }),
      );
    });

    it("devrait gérer un tableau vide pour la promotion", async () => {
      mockRequest.body = {
        utilisateurs: [],
      };

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

    it("devrait gérer un body null", async () => {
      mockRequest.body = null;

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

    it("devrait gérer des params manquants", async () => {
      mockRequest.params = {};

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

  describe("Récupération après erreur", () => {
    it("devrait récupérer après une erreur de connexion temporaire", async () => {
      // Première tentative : erreur
      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockRejectedValueOnce(
        new Error("Connection timeout"),
      );

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);

      // Deuxième tentative : succès
      jest.clearAllMocks();

      const mockProfesseurs = [
        {
          id: 1,
          first_name: "Jean",
          last_name: "Dupont",
          email: "jean@example.com",
          role_id: 2,
          status_id: 1,
        },
      ];

      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockResolvedValue(
        mockProfesseurs,
      );

      await getProfesseurs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfesseurs,
        }),
      );
    });

    it("devrait maintenir la cohérence après une erreur de mise à jour", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 2,
      };

      // Première tentative : erreur
      (mockProfesseursClient.modifierStatutProfesseur as jest.Mock).mockRejectedValueOnce(
        new Error("Deadlock detected"),
      );

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);

      // Vérifier que l'état n'a pas changé
      jest.clearAllMocks();
      mockRequest.params = { id: "1" };

      const mockProfesseur = {
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        role_id: 2,
        status_id: 1, // Statut inchangé
      };

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue(
        mockProfesseur,
      );

      await getProfesseurById(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ status_id: 1 }),
        }),
      );
    });
  });
});
