/**
 * Tests de performance pour le module Professeurs
 * Teste les temps de réponse et la gestion de charge
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

describe("Professeurs Module - Performance Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockProfesseursClient: Partial<Professeurs>;

  beforeEach(async () => {
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

  describe("Temps de réponse", () => {
    it("devrait récupérer tous les professeurs en moins de 300ms", async () => {
      const mockProfesseurs = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        first_name: `Professeur${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: 1,
      }));

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: mockProfesseurs,
      });

      const startTime = Date.now();

      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(300);
    });

    it("devrait récupérer un professeur par ID en moins de 200ms", async () => {
      const mockProfesseur = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@test.com",
        role_id: 2,
        status_id: 1,
      };

      mockRequest.params = { id: "1" };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      const startTime = Date.now();

      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(200);
    });

    it("devrait promouvoir un professeur en moins de 500ms", async () => {
      const mockData = {
        utilisateurs: [1, 2, 3],
      };

      mockRequest.body = mockData;

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Professeurs promus avec succès",
        data: { promoted: [1, 2, 3] },
      });

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@test.com",
        role_id: 2,
      });

      const startTime = Date.now();

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(500);
    });

    it("devrait modifier le statut d'un professeur en moins de 400ms", async () => {
      mockRequest.body = {
        id: 1,
        status_id: 2,
      };

      (
        mockProfesseursClient.modifierStatutProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Statut modifié",
        data: { id: 1, status_id: 2 },
      });

      const startTime = Date.now();

      await modifierStatutProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(400);
    });

    it("devrait récupérer le planning d'un professeur en moins de 250ms", async () => {
      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          nom_cours: `Cours ${i + 1}`,
          jour_semaine: "Lundi",
          heure_debut: "09:00",
          heure_fin: "10:00",
          professeur_id: 1,
        })),
      };

      mockRequest.params = { id: "1" };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanning);

      const startTime = Date.now();

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(250);
    });
  });

  describe("Gestion de charge", () => {
    it("devrait gérer 100 requêtes simultanées de récupération", async () => {
      const mockProfesseurs = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        first_name: `Prof${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: 1,
      }));

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: mockProfesseurs,
      });

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, () => {
        const req = { ...mockRequest } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        return getProfesseurs(req, res, mockProfesseursClient as Professeurs);
      });

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

    it("devrait gérer 50 promotions simultanées", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Professeur promu",
        data: { promoted: [1] },
      });

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@test.com",
        role_id: 2,
      });

      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, () => {
        const req = {
          ...mockRequest,
          body: { utilisateurs: [1] },
        } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        return ajouterProfesseurHandler(
          req,
          res,
          mockProfesseursClient as Professeurs,
        );
      });

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it("devrait gérer 200 requêtes de consultation d'un professeur simultanées", async () => {
      const mockProfesseur = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@test.com",
        role_id: 2,
        status_id: 1,
      };

      mockRequest.params = { id: "1" };

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue(mockProfesseur);

      const startTime = Date.now();

      const promises = Array.from({ length: 200 }, () => {
        const req = { params: { id: "1" } } as unknown as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        return getProfesseurById(
          req,
          res,
          mockProfesseursClient as Professeurs,
        );
      });

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });
  });

  describe("Performance avec gros volumes de données", () => {
    it("devrait gérer efficacement 500 professeurs", async () => {
      const mockProfesseurs = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        first_name: `Professeur${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: 1,
      }));

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: mockProfesseurs,
      });

      const startTime = Date.now();

      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 500,
        }),
      );
      expect(duration).toBeLessThan(500);
    });

    it("devrait gérer efficacement un planning avec 100 cours", async () => {
      const mockPlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          nom_cours: `Cours ${i + 1}`,
          description: `Description du cours ${i + 1}`,
          jour_semaine: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"][
            i % 5
          ],
          heure_debut: "18:00",
          heure_fin: "19:00",
          salle: `Salle ${(i % 10) + 1}`,
          niveau: ["Débutant", "Intermédiaire", "Avancé"][i % 3],
          capacite_max: 15,
          professeur_id: 1,
          nombre_inscrits: Math.floor(Math.random() * 15),
        })),
      };

      mockRequest.params = { id: "1" };

      (
        mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock
      ).mockResolvedValue(mockPlanning);

      const startTime = Date.now();

      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          isFind: true,
          count: 100,
        }),
      );
    });

    it("devrait gérer efficacement la promotion de 50 utilisateurs", async () => {
      const userIds = Array.from({ length: 50 }, (_, i) => i + 1);

      mockRequest.body = {
        utilisateurs: userIds,
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "50 professeurs promus",
        data: { promoted: userIds },
      });

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@test.com",
        role_id: 2,
      });

      const startTime = Date.now();

      await ajouterProfesseurHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Benchmarks moyens", () => {
    it("devrait maintenir une moyenne < 100ms pour getProfesseurs sur 100 appels", async () => {
      const mockProfesseurs = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        first_name: `Prof${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: 1,
      }));

      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockResolvedValue({
        isFind: true,
        data: mockProfesseurs,
      });

      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();
        const req = { ...mockRequest } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;

        await getProfesseurs(req, res, mockProfesseursClient as Professeurs);

        durations.push(Date.now() - startTime);
      }

      const average =
        durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length;

      expect(average).toBeLessThan(100);
    });

    it("devrait maintenir une moyenne < 150ms pour ajouterProfesseur sur 50 appels", async () => {
      mockRequest.body = {
        utilisateurs: [1],
      };

      (
        mockProfesseursClient.ajouterUnProfesseur as jest.Mock
      ).mockResolvedValue({
        isConfirm: true,
        message: "Professeur promu",
        data: { promoted: [1] },
      });

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockResolvedValue({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@test.com",
        role_id: 2,
      });

      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        const req = {
          ...mockRequest,
          body: { utilisateurs: [1] },
        } as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;

        await ajouterProfesseurHandler(
          req,
          res,
          mockProfesseursClient as Professeurs,
        );

        durations.push(Date.now() - startTime);
      }

      const average =
        durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length;

      expect(average).toBeLessThan(150);
    });
  });

  describe("Gestion des timeouts", () => {
    it("devrait gérer un client DB lent sans crash", async () => {
      (
        mockProfesseursClient.obtenirLesProfesseurs as jest.Mock
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                isFind: true,
                data: [
                  {
                    id: 1,
                    first_name: "John",
                    last_name: "Doe",
                    email: "john.doe@test.com",
                    role_id: 2,
                    status_id: 1,
                  },
                ],
              });
            }, 200);
          }),
      );

      const startTime = Date.now();

      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs,
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeGreaterThanOrEqual(200);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Performance en environnement multi-utilisateurs", () => {
    it("devrait gérer des requêtes de différents professeurs simultanément", async () => {
      const professeurIds = [1, 2, 3, 4, 5];

      (
        mockProfesseursClient.obtenirUtilisateurParId as jest.Mock
      ).mockImplementation((id: number) =>
        Promise.resolve({
          id,
          first_name: "Professor",
          last_name: `${id}`,
          email: `prof${id}@test.com`,
          role_id: 2,
          status_id: 1,
        }),
      );

      const startTime = Date.now();

      const promises = professeurIds.map((id) => {
        const req = { params: { id: id.toString() } } as unknown as Request;
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res),
        } as unknown as Response;
        return getProfesseurById(
          req,
          res,
          mockProfesseursClient as Professeurs,
        );
      });

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe("Performance de filtrage et tri", () => {
    it("devrait trier rapidement 200 professeurs par nom", async () => {
      const mockProfesseurs = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        first_name: `Professeur${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
      }));

      const startTime = Date.now();

      const sortedProfs = [...mockProfesseurs].sort((a, b) =>
        a.last_name.localeCompare(b.last_name),
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(sortedProfs).toHaveLength(200);
    });

    it("devrait filtrer rapidement 300 professeurs par statut", async () => {
      const mockProfesseurs = Array.from({ length: 300 }, (_, i) => ({
        id: i + 1,
        first_name: `Professeur${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: (i % 3) + 1,
      }));

      const startTime = Date.now();

      const filteredProfs = mockProfesseurs.filter((p) => p.status_id === 1);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(filteredProfs.length).toBeGreaterThan(0);
    });
  });
});
