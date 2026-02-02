/**
 * Tests de cohérence des schémas pour le module Cours
 * Vérifie la structure et les types des données retournées
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getAllCours,
  getParticipantCours,
  getCoursUtilisateurs,
  inscrireUtilisateur,
  getPlanning,
  ajouterCours,
  modifierCours,
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

describe("Cours - Tests de cohérence des schémas", () => {
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

  describe("Structure des réponses - getAllCours", () => {
    it("devrait retourner un objet avec success et data", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga Débutant",
          description: "Cours de yoga pour débutants",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
          places_disponibles: 10,
          places_max: 15,
          professeur_id: 1,
          professeur_nom: "Dupont",
          professeur_prenom: "Jean",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("chaque cours devrait avoir les champs requis", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours).toHaveProperty("id");
      expect(cours).toHaveProperty("nom");
      expect(cours).toHaveProperty("date");
      expect(cours).toHaveProperty("heure_debut");
      expect(cours).toHaveProperty("heure_fin");
    });

    it("les types des champs devraient être corrects", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          description: "Description",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
          places_disponibles: 10,
          places_max: 15,
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(typeof cours.id).toBe("number");
      expect(typeof cours.nom).toBe("string");
      expect(typeof cours.description).toBe("string");
      expect(typeof cours.date).toBe("string");
      expect(typeof cours.heure_debut).toBe("string");
      expect(typeof cours.heure_fin).toBe("string");
      expect(typeof cours.places_disponibles).toBe("number");
      expect(typeof cours.places_max).toBe("number");
    });
  });

  describe("Structure des réponses - getParticipantCours", () => {
    it("devrait retourner un tableau de participants", async () => {
      mockRequest.params = { id: "1" };

      const mockParticipants = [
        {
          utilisateur_id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          statut: "confirmé",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockParticipants);
        },
      );

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("chaque participant devrait avoir les champs requis", async () => {
      mockRequest.params = { id: "1" };

      const mockParticipants = [
        {
          utilisateur_id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          statut: "confirmé",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockParticipants);
        },
      );

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      const participant = response.data[0];

      expect(participant).toHaveProperty("utilisateur_id");
      expect(participant).toHaveProperty("nom");
      expect(participant).toHaveProperty("prenom");
      expect(typeof participant.utilisateur_id).toBe("number");
      expect(typeof participant.nom).toBe("string");
      expect(typeof participant.prenom).toBe("string");
    });
  });

  describe("Structure des réponses - inscrireUtilisateur", () => {
    it("devrait retourner un objet de confirmation avec les IDs", async () => {
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

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("userId");
      expect(response).toHaveProperty("coursId");
    });

    it("les types des IDs retournés devraient être corrects", async () => {
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

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(typeof response.userId).toBe("object");
      expect(typeof response.coursId).toBe("number");
    });
  });

  describe("Structure des réponses - ajouterCours", () => {
    it("devrait retourner un objet de confirmation avec l'ID du cours", async () => {
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

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("message");
      expect(typeof response.success).toBe("boolean");
      expect(typeof response.message).toBe("string");
    });
  });

  describe("Structure des réponses - getPlanning", () => {
    it("devrait retourner un objet structuré par date", async () => {
      const mockPlanning = [
        {
          date: "2024-03-15",
          cours: [
            {
              id: 1,
              nom: "Yoga",
              heure_debut: "10:00:00",
              heure_fin: "11:00:00",
            },
          ],
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockPlanning);
        },
      );

      await getPlanning(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe("Structure des erreurs", () => {
    it("les erreurs devraient avoir un format cohérent", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Database error"), null);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("message");
      expect(typeof response.success).toBe("boolean");
      expect(typeof response.message).toBe("string");
    });

    it("les erreurs de validation devraient inclure un tableau d'erreurs", async () => {
      mockRequest.body = {
        utilisateur_nom: "",
        utilisateur_prenom: "",
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("errors");
      expect(Array.isArray(response.errors)).toBe(true);
    });
  });

  describe("Cohérence des formats de date et heure", () => {
    it("les dates devraient être au format YYYY-MM-DD", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("les heures devraient être au format HH:MM:SS", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours.heure_debut).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(cours.heure_fin).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe("Cohérence des valeurs numériques", () => {
    it("les IDs devraient être des nombres positifs", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
          places_disponibles: 10,
          places_max: 15,
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours.id).toBeGreaterThan(0);
      expect(Number.isInteger(cours.id)).toBe(true);
    });

    it("places_disponibles ne devrait pas être négatif", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
          places_disponibles: 10,
          places_max: 15,
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCours);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const cours = response.data[0];

      expect(cours.places_disponibles).toBeGreaterThanOrEqual(0);
      expect(cours.places_max).toBeGreaterThan(0);
      expect(cours.places_disponibles).toBeLessThanOrEqual(cours.places_max);
    });
  });
});
