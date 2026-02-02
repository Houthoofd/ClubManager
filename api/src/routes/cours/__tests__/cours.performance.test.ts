/**
 * Tests de performance pour le module Cours
 * Vérifie les temps de réponse et l'optimisation des requêtes
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getAllCours,
  getParticipantCours,
  inscrireUtilisateur,
  ajouterCours,
  getPlanning,
  getUtilisateurInscriptions,
} from "../core/handlers/index.js";

// Mock du connector MySQL
jest.mock("../../../db/connector/mysqlconnector.js", () => {
  return {
    default: {
      getInstance: jest.fn(() => ({
        query: jest.fn(),
      })),
    },
  };
});

describe("Cours - Tests de performance", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

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
  });

  describe("Temps de réponse", () => {
    it("devrait récupérer tous les cours en moins de 100ms", async () => {
      const mockCours = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_disponibles: 10,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      const start = Date.now();
      await getAllCours(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait récupérer les participants en moins de 50ms", async () => {
      mockRequest.params = { id: "1" };

      const mockParticipants = Array.from({ length: 20 }, (_, i) => ({
        utilisateur_id: i + 1,
        nom: `Participant ${i + 1}`,
        prenom: "Test",
        email: `test${i + 1}@example.com`,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockParticipants);
        },
      );

      const start = Date.now();
      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait créer une inscription en moins de 200ms", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("inscription")) {
            callback(null, []);
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      const start = Date.now();
      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait créer un cours en moins de 150ms", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      const start = Date.now();
      await ajouterCours(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(150);
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("Performance avec grands volumes de données", () => {
    it("devrait gérer 1000 cours sans dégradation", async () => {
      const largeMockCours = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        nom: `Cours ${i + 1}`,
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_disponibles: 10,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, largeMockCours);
        },
      );

      const start = Date.now();
      await getAllCours(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer 500 participants sans dégradation", async () => {
      mockRequest.params = { id: "1" };

      const largeMockParticipants = Array.from({ length: 500 }, (_, i) => ({
        utilisateur_id: i + 1,
        nom: `Participant ${i + 1}`,
        prenom: "Test",
        email: `test${i + 1}@example.com`,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, largeMockParticipants);
        },
      );

      const start = Date.now();
      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer un planning de 30 jours avec de nombreux cours", async () => {
      const largePlanning = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-03-${String(i + 1).padStart(2, "0")}`,
        cours: Array.from({ length: 10 }, (_, j) => ({
          id: i * 10 + j + 1,
          nom: `Cours ${j + 1}`,
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        })),
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, largePlanning);
        },
      );

      const start = Date.now();
      await getPlanning(mockRequest as Request, mockResponse as Response);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(400);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Optimisation des requêtes", () => {
    it("ne devrait faire qu'une seule requête pour getAllCours", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("ne devrait faire qu'une seule requête pour getParticipantCours", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("devrait minimiser les requêtes pour l'inscription", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("inscription")) {
            callback(null, []);
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Devrait faire au maximum 3 requêtes (vérif, récup user, insert)
      expect(queryMock.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Performance des opérations multiples", () => {
    it("devrait gérer 100 inscriptions consécutives", async () => {
      const inscriptions = Array.from({ length: 100 }, (_, i) => ({
        utilisateur_nom: `User${i}`,
        utilisateur_prenom: "Test",
        cours_id: 1,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("inscription")) {
            callback(null, []);
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      const start = Date.now();

      for (const inscription of inscriptions) {
        mockRequest.body = inscription;
        await inscrireUtilisateur(
          mockRequest as Request,
          mockResponse as Response,
        );
      }

      const duration = Date.now() - start;

      // 100 inscriptions en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
    });

    it("devrait gérer 50 créations de cours consécutives", async () => {
      const cours = Array.from({ length: 50 }, (_, i) => ({
        nom: `Cours ${i}`,
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      const start = Date.now();

      for (const c of cours) {
        mockRequest.body = c;
        await ajouterCours(mockRequest as Request, mockResponse as Response);
      }

      const duration = Date.now() - start;

      // 50 créations en moins de 3 secondes
      expect(duration).toBeLessThan(3000);
    });
  });

  describe("Gestion de la mémoire", () => {
    it("ne devrait pas avoir de fuite mémoire avec de grandes listes", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 10; i++) {
        const largeMockCours = Array.from({ length: 1000 }, (_, j) => ({
          id: j + 1,
          nom: `Cours ${j + 1}`,
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        }));

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, largeMockCours);
          },
        );

        await getAllCours(mockRequest as Request, mockResponse as Response);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // L'augmentation de mémoire ne devrait pas être excessive (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe("Performance en cas d'erreur", () => {
    it("devrait gérer rapidement les erreurs de validation", async () => {
      mockRequest.body = {
        utilisateur_nom: "",
        utilisateur_prenom: "",
      };

      const start = Date.now();
      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer rapidement les ressources introuvables", async () => {
      mockRequest.params = { id: "999999" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      const start = Date.now();
      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe("Scalabilité", () => {
    it("le temps de réponse devrait croître linéairement", async () => {
      const sizes = [10, 50, 100, 200];
      const durations: number[] = [];

      for (const size of sizes) {
        const mockCours = Array.from({ length: size }, (_, i) => ({
          id: i + 1,
          nom: `Cours ${i + 1}`,
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        }));

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, mockCours);
          },
        );

        const start = Date.now();
        await getAllCours(mockRequest as Request, mockResponse as Response);
        durations.push(Date.now() - start);
      }

      // Le temps pour 200 éléments ne devrait pas être plus de 3x le temps pour 100
      expect(durations[3]).toBeLessThan(durations[2] * 3);
    });
  });
});
