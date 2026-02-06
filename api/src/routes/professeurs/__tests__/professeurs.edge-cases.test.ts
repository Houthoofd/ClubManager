/**
 * Tests des cas limites (edge cases) pour le module Professeurs
 * Tests des situations inhabituelles et des limites du système
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
} from "../core/handlers/index.js";

describe("Professeurs Module - Tests des cas limites", () => {
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

  describe("Cas limites des IDs", () => {
    it("devrait gérer l'ID 1 (premier ID)", async () => {
      mockRequest.params = { id: "1" };

      const mockProfesseur = {
        id: 1,
        first_name: "Premier",
        last_name: "Professeur",
        email: "premier@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      await getProfesseurById(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfesseur,
        }),
      );
    });

    it("devrait gérer un ID très grand mais valide", async () => {
      mockRequest.params = { id: "2147483647" }; // MAX_INT32

      const mockProfesseur = {
        id: 2147483647,
        first_name: "Grand",
        last_name: "ID",
        email: "grand@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      await getProfesseurById(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: 2147483647 }),
        }),
      );
    });

    it("devrait gérer un ID avec des zéros en préfixe", async () => {
      mockRequest.params = { id: "00001" };

      const mockProfesseur = {
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      await getProfesseurById(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait rejeter un ID avec des espaces", async () => {
      mockRequest.params = { id: " 1 " };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(null);

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Professeur non trouvé",
        }),
      );
    });
  });

  describe("Cas limites des listes", () => {
    it("devrait gérer une liste avec un seul élément", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
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

    it("devrait gérer une liste avec des doublons", async () => {
      mockRequest.body = {
        utilisateurs: [1, 1, 1],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
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

    it("devrait gérer une liste d'utilisateurs vide", async () => {
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

    it("devrait gérer un professeur sans aucun cours", async () => {
      mockRequest.params = { id: "1" };

      const mockPlanning = {
        isFind: false,
        message: "Aucun cours assigné",
        data: [],
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
          success: false,
          isFind: false,
          data: [],
          count: 0,
        }),
      );
    });

    it("devrait gérer un professeur avec un très grand nombre de cours", async () => {
      mockRequest.params = { id: "1" };

      const manyCourses = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        nom_cours: `Cours ${i + 1}`,
        jour_semaine: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"][
          i % 5
        ],
        heure_debut: `${8 + (i % 10)}:00`,
        heure_fin: `${9 + (i % 10)}:00`,
        professeur_id: 1,
      }));

      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: manyCourses,
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
          count: 100,
        }),
      );
    });
  });

  describe("Cas limites des statuts", () => {
    it("devrait gérer le statut minimum (1)", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 1,
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Statut modifié avec succès",
        data: { id: 1, status_id: 1 },
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

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

    it("devrait gérer le statut maximum (10)", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 10,
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Statut modifié avec succès",
        data: { id: 1, status_id: 10 },
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

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

    it("devrait rejeter un statut juste au-dessus de la limite (11)", async () => {
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

    it("devrait modifier le statut du même professeur plusieurs fois de suite", async () => {
      const professeurId = 1;
      const statuses = [1, 2, 3, 2, 1];

      for (const status_id of statuses) {
        jest.clearAllMocks();
        mockRequest.body = {
          id: professeurId,
          status_id,
        };

        const mockResult = {
          isConfirm: true,
          success: true,
          message: "Statut modifié avec succès",
          data: { id: professeurId, status_id },
        };

        (
          mockProfesseursClient.modifierStatutProfesseur as jest.Mock
        ).mockResolvedValue(mockResult);

        await modifierStatutProfesseurHandler(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs,
        );

        expect(statusMock).toHaveBeenCalledWith(200);
      }
    });
  });

  describe("Cas limites des formats de données", () => {
    it("devrait gérer des IDs en string numérique", async () => {
      mockRequest.body = {
        utilisateurs: ["1", "2", "3"],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeurs promus avec succès",
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
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait gérer un mélange de formats d'IDs", async () => {
      mockRequest.body = {
        utilisateurs: [1, "2", { id: 3 }, { userId: 4 }],
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Professeurs promus avec succès",
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
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait gérer différentes propriétés pour l'ID utilisateur", async () => {
      const variations = [{ id: 1 }, { userId: 2 }, { user_id: 3 }];

      for (const variation of variations) {
        jest.clearAllMocks();
        mockRequest.body = variation;

        const mockResult = {
          isConfirm: true,
          success: true,
          message: "Professeur promu avec succès",
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
          mockProfesseursClient as Professeurs,
        );

        expect(statusMock).toHaveBeenCalledWith(200);
      }
    });
  });

  describe("Cas limites de la base de données", () => {
    it("devrait gérer une liste vide de professeurs", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({isFind: true, data: []});

      await getProfesseurs(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 0,
          data: [],
        }),
      );
    });

    it("devrait gérer un seul professeur dans la base", async () => {
      const mockProfesseurs = [
        {
          id: 1,
          first_name: "Unique",
          last_name: "Professeur",
          email: "unique@example.com",
          role_id: 2,
          status_id: 1,
        },
      ];

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({isFind: true, data: mockProfesseurs});

      await getProfesseurs(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          data: mockProfesseurs,
        }),
      );
    });

    it("devrait gérer un très grand nombre de professeurs", async () => {
      const largeProfesseursList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        first_name: `Professeur${i + 1}`,
        last_name: `Nom${i + 1}`,
        email: `prof${i + 1}@example.com`,
        role_id: 2,
        status_id: 1,
      }));

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({isFind: true, data: largeProfesseursList});

      await getProfesseurs(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1000,
          data: largeProfesseursList,
        }),
      );
    });
  });

  describe("Cas limites des requêtes concurrentes", () => {
    it("devrait gérer plusieurs requêtes de récupération simultanées", async () => {
      const mockProfesseur = {
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      mockRequest.params = { id: "1" };

      // Simuler plusieurs requêtes concurrentes
      const requests = Array(10)
        .fill(null)
        .map(() =>
          getProfesseurById(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs),
        );

      await Promise.all(requests);

      expect(statusMock).toHaveBeenCalledTimes(10);
      expect(
        mockProfesseursClient.obtenirUtilisateurParId,
      ).toHaveBeenCalledTimes(10);
    });

    it("devrait gérer des modifications de statut concurrentes", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 2,
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Statut modifié avec succès",
        data: { id: 1, status_id: 2 },
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

      // Simuler plusieurs modifications concurrentes
      const requests = Array(5)
        .fill(null)
        .map(() =>
          modifierStatutProfesseurHandler(
            mockRequest as Request,
            mockResponse as Response, mockProfesseursClient as Professeurs,
          ),
        );

      await Promise.all(requests);

      expect(statusMock).toHaveBeenCalledTimes(5);
      expect(
        mockProfesseursClient.modifierStatutProfesseur,
      ).toHaveBeenCalledTimes(5);
    });
  });

  describe("Cas limites des valeurs limites", () => {
    it("devrait gérer un planning avec tous les jours de la semaine", async () => {
      mockRequest.params = { id: "1" };

      const fullWeekSchedule = [
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
        "Dimanche",
      ].map((jour, index) => ({
        id: index + 1,
        nom_cours: `Cours ${jour}`,
        jour_semaine: jour,
        heure_debut: "09:00",
        heure_fin: "10:00",
        professeur_id: 1,
      }));

      const mockPlanning = {
        isFind: true,
        message: "Planning complet trouvé",
        data: fullWeekSchedule,
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
          count: 7,
        }),
      );
    });

    it("devrait gérer des cours qui se chevauchent dans le temps", async () => {
      mockRequest.params = { id: "1" };

      const overlappingCourses = [
        {
          id: 1,
          nom_cours: "Cours A",
          jour_semaine: "Lundi",
          heure_debut: "09:00",
          heure_fin: "11:00",
          professeur_id: 1,
        },
        {
          id: 2,
          nom_cours: "Cours B",
          jour_semaine: "Lundi",
          heure_debut: "10:00",
          heure_fin: "12:00",
          professeur_id: 1,
        },
      ];

      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: overlappingCourses,
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
          data: overlappingCourses,
        }),
      );
    });
  });

  describe("Cas limites des transitions d'état", () => {
    it("devrait gérer un changement de statut vers le même statut", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 1,
      };

      const mockResult = {
        isConfirm: true,
        success: true,
        message: "Statut inchangé",
        data: { id: 1, status_id: 1 },
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue(mockResult);

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

    it("devrait gérer une promotion immédiatement suivie d'une récupération", async () => {
      // Promotion
      mockRequest.body = {
        utilisateurs: [50],
      };

      const mockPromotionResult = {
        isConfirm: true,
        success: true,
        message: "Professeur promu avec succès",
        data: { promoted_users: [50] },
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue(mockPromotionResult);

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 50,
        first_name: "Nouveau",
        last_name: "Prof",
        email: "nouveau@example.com",
      });

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      expect(statusMock).toHaveBeenCalledWith(200);

      // Récupération immédiate
      jest.clearAllMocks();
      mockRequest.params = { id: "50" };

      const mockProfesseur = {
        id: 50,
        first_name: "Nouveau",
        last_name: "Prof",
        email: "nouveau@example.com",
        role_id: 2,
        status_id: 1,
      };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      await getProfesseurById(mockRequest as Request, mockResponse as Response, mockProfesseursClient as Professeurs);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: 50, role_id: 2 }),
        }),
      );
    });
  });
});
