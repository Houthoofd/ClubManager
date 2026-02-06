/**
 * Tests de performance pour le module Professeurs
 * Teste les temps de réponse et la gestion de charge
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Professeurs } from "../../../db/clients/professeurs/professeurs.js";

describe("Professeurs Module - Performance Tests", () => {
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

      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockResolvedValue({
        isFind: true,
        data: mockProfesseurs,
      });

      const startTime = Date.now();

      const { getProfesseurs } = await import(
        "../core/handlers/get-professeurs.handler.js"
      );
      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
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

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue(
        mockProfesseur
      );

      const startTime = Date.now();

      const { getProfesseurById } = await import(
        "../core/handlers/get-professeurs.handler.js"
      );
      await getProfesseurById(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
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

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Professeurs promus avec succès",
        data: { promoted: [1, 2, 3] },
      });

      const startTime = Date.now();

      const { ajouterProfesseur } = await import(
        "../core/handlers/ajouter-professeur.handler.js"
      );
      await ajouterProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
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

      (mockProfesseursClient.modifierStatutProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Statut modifié",
        data: { id: 1, status_id: 2 },
      });

      const startTime = Date.now();

      const { modifierStatut } = await import(
        "../core/handlers/modifier-statut.handler.js"
      );
      await modifierStatut(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
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
          heure_debut: "18:00",
          heure_fin: "19:00",
          professeur_id: 1,
        })),
      };

      mockRequest.params = { id: "1" };

      (mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock).mockResolvedValue(
        mockPlanning
      );

      const startTime = Date.now();

      const { getPlanningProfesseur } = await import(
        "../core/handlers/get-planning.handler.js"
      );
      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
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
      }));

      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockResolvedValue({
        isFind: true,
        data: mockProfesseurs,
      });

      const startTime = Date.now();

      const promises = Array.from({ length: 100 }, async () => {
        const { getProfesseurs } = await import(
          "../core/handlers/get-professeurs.handler.js"
        );
        return getProfesseurs(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        );
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 secondes pour 100 requêtes
    });

    it("devrait gérer 50 promotions simultanées", async () => {
      mockRequest.body = {
        utilisateurs: [1, 2, 3],
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Promotion réussie",
        data: {},
      });

      const startTime = Date.now();

      const promises = Array.from({ length: 50 }, async () => {
        const { ajouterProfesseur } = await import(
          "../core/handlers/ajouter-professeur.handler.js"
        );
        return ajouterProfesseur(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        );
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // 10 secondes pour 50 promotions
    });

    it("devrait gérer 200 requêtes de consultation d'un professeur simultanées", async () => {
      const mockProfesseur = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        role_id: 2,
      };

      mockRequest.params = { id: "1" };

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockResolvedValue(
        mockProfesseur
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 200 }, async () => {
        const { getProfesseurById } = await import(
          "../core/handlers/get-professeurs.handler.js"
        );
        return getProfesseurById(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        );
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000); // 3 secondes pour 200 requêtes
    });
  });

  describe("Performance avec gros volumes de données", () => {
    it("devrait gérer efficacement 500 professeurs", async () => {
      const largeProfesseurs = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        first_name: `Professeur${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: 1,
      }));

      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockResolvedValue({
        isFind: true,
        data: largeProfesseurs,
      });

      const startTime = Date.now();

      const { getProfesseurs } = await import(
        "../core/handlers/get-professeurs.handler.js"
      );
      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.any(Object)]),
          count: 500,
        })
      );
    });

    it("devrait gérer efficacement un planning avec 100 cours", async () => {
      const largePlanning = {
        isFind: true,
        message: "Planning trouvé",
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          nom_cours: `Cours ${i + 1}`,
          jour_semaine: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"][i % 5],
          heure_debut: `${8 + (i % 12)}:00`,
          heure_fin: `${9 + (i % 12)}:00`,
          professeur_id: 1,
          salle: `Dojo ${(i % 3) + 1}`,
          niveau: ["Débutant", "Intermédiaire", "Avancé"][i % 3],
          capacite_max: 20,
        })),
      };

      mockRequest.params = { id: "1" };

      (mockProfesseursClient.obtenirPlanningCoursProfesseur as jest.Mock).mockResolvedValue(
        largePlanning
      );

      const startTime = Date.now();

      const { getPlanningProfesseur } = await import(
        "../core/handlers/get-planning.handler.js"
      );
      await getPlanningProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.any(Object)]),
        })
      );
    });

    it("devrait gérer efficacement la promotion de 50 utilisateurs", async () => {
      const largeUserList = Array.from({ length: 50 }, (_, i) => i + 1);

      mockRequest.body = {
        utilisateurs: largeUserList,
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "50 professeurs promus",
        data: { promoted: largeUserList },
      });

      const startTime = Date.now();

      const { ajouterProfesseur } = await import(
        "../core/handlers/ajouter-professeur.handler.js"
      );
      await ajouterProfesseur(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeLessThan(800);
    });
  });

  describe("Benchmarks moyens", () => {
    it("devrait maintenir une moyenne < 100ms pour getProfesseurs sur 100 appels", async () => {
      const mockProfesseurs = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        first_name: `Prof${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
      }));

      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockResolvedValue({
        isFind: true,
        data: mockProfesseurs,
      });

      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();

        const { getProfesseurs } = await import(
          "../core/handlers/get-professeurs.handler.js"
        );
        await getProfesseurs(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        );

        durations.push(Date.now() - startTime);
      }

      const average = durations.reduce((a, b) => a + b, 0) / durations.length;

      expect(average).toBeLessThan(100);
    });

    it("devrait maintenir une moyenne < 150ms pour ajouterProfesseur sur 50 appels", async () => {
      mockRequest.body = {
        utilisateurs: [1, 2],
      };

      (mockProfesseursClient.ajouterUnProfesseur as jest.Mock).mockResolvedValue({
        isConfirm: true,
        message: "Promotion réussie",
        data: {},
      });

      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();

        const { ajouterProfesseur } = await import(
          "../core/handlers/ajouter-professeur.handler.js"
        );
        await ajouterProfesseur(
          mockRequest as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        );

        durations.push(Date.now() - startTime);
      }

      const average = durations.reduce((a, b) => a + b, 0) / durations.length;

      expect(average).toBeLessThan(150);
    });
  });

  describe("Gestion des timeouts", () => {
    it("devrait gérer un client DB lent sans crash", async () => {
      (mockProfesseursClient.obtenirLesProfesseurs as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                isFind: true,
                data: [
                  {
                    id: 1,
                    first_name: "Slow",
                    last_name: "Response",
                    email: "slow@test.com",
                  },
                ],
              });
            }, 2000); // 2 secondes de délai
          })
      );

      const startTime = Date.now();

      const { getProfesseurs } = await import(
        "../core/handlers/get-professeurs.handler.js"
      );
      await getProfesseurs(
        mockRequest as Request,
        mockResponse as Response,
        mockProfesseursClient as Professeurs
      );

      const duration = Date.now() - startTime;

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(duration).toBeGreaterThanOrEqual(2000);
    });
  });

  describe("Performance en environnement multi-utilisateurs", () => {
    it("devrait gérer des requêtes de différents professeurs simultanément", async () => {
      const professeurIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      (mockProfesseursClient.obtenirUtilisateurParId as jest.Mock).mockImplementation(
        (id: number) =>
          Promise.resolve({
            id,
            first_name: `Professeur${id}`,
            last_name: `Test${id}`,
            email: `prof${id}@test.com`,
            role_id: 2,
          })
      );

      const startTime = Date.now();

      const promises = professeurIds.map(async (id) => {
        const req = { ...mockRequest, params: { id: id.toString() } };
        const { getProfesseurById } = await import(
          "../core/handlers/get-professeurs.handler.js"
        );
        return getProfesseurById(
          req as Request,
          mockResponse as Response,
          mockProfesseursClient as Professeurs
        );
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Performance de filtrage et tri", () => {
    it("devrait trier rapidement 200 professeurs par nom", async () => {
      const mockProfesseurs = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        first_name: `Professeur${Math.random().toString(36).substring(7)}`,
        last_name: `Test${Math.random().toString(36).substring(7)}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
      }));

      const startTime = Date.now();

      const sortedProfs = [...mockProfesseurs].sort((a, b) =>
        a.last_name.localeCompare(b.last_name)
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(sortedProfs.length).toBe(200);
    });

    it("devrait filtrer rapidement 300 professeurs par statut", async () => {
      const mockProfesseurs = Array.from({ length: 300 }, (_, i) => ({
        id: i + 1,
        first_name: `Prof${i + 1}`,
        last_name: `Test${i + 1}`,
        email: `prof${i + 1}@test.com`,
        role_id: 2,
        status_id: (i % 3) + 1, // Statuts 1, 2, 3
      }));

      const startTime = Date.now();

      const filteredProfs = mockProfesseurs.filter((prof) => prof.status_id === 1);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30);
      expect(filteredProfs.length).toBeGreaterThan(0);
    });
  });
});
