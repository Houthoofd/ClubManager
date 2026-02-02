/**
 * Tests d'intégration GraphQL pour le module Cours
 * Tests des résolveurs GraphQL avec mocks
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getAllCours,
  getParticipantCours,
  inscrireUtilisateur,
  ajouterCours,
  modifierCours,
  validerPresence,
  annulerPresence,
  desinscrireUtilisateur,
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

describe("Cours - Tests d'intégration GraphQL", () => {
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

  describe("Query: cours", () => {
    it("devrait résoudre la query getAllCours", async () => {
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
      expect(response).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            nom: expect.any(String),
          }),
        ]),
      });
    });

    it("devrait résoudre la query getParticipantCours avec arguments", async () => {
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
      expect(response).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            utilisateur_id: expect.any(Number),
            nom: expect.any(String),
            prenom: expect.any(String),
          }),
        ]),
      });
    });

    it("devrait résoudre la query getPlanning", async () => {
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
    });

    it("devrait résoudre la query getUtilisateurInscriptions", async () => {
      mockRequest.params = { utilisateurId: "1" };

      const mockInscriptions = [
        {
          cours_id: 1,
          cours_nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          statut: "confirmé",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockInscriptions);
        },
      );

      await getUtilisateurInscriptions(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", true);
      expect(response.data).toEqual(mockInscriptions);
    });
  });

  describe("Mutation: inscrireUtilisateur", () => {
    it("devrait résoudre la mutation d'inscription", async () => {
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

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          userId: expect.anything(),
          coursId: 1,
        }),
      );
    });

    it("devrait valider les arguments de la mutation", async () => {
      mockRequest.body = {
        utilisateur_nom: "",
        utilisateur_prenom: "",
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
          errors: expect.any(Array),
        }),
      );
    });
  });

  describe("Mutation: ajouterCours", () => {
    it("devrait résoudre la mutation de création de cours", async () => {
      mockRequest.body = {
        nom: "Yoga Débutant",
        description: "Cours de yoga",
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

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("créé"),
        }),
      );
    });

    it("devrait valider les champs requis", async () => {
      mockRequest.body = {
        nom: "Yoga",
        // Champs manquants
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Mutation: modifierCours", () => {
    it("devrait résoudre la mutation de modification", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        nom: "Yoga Avancé",
        description: "Cours modifié",
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 1 });
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1, nom: "Yoga Débutant" }]);
          }
        },
      );

      await modifierCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });

  describe("Mutation: validerPresence", () => {
    it("devrait résoudre la mutation de validation de présence", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 1 });
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1, status_id: 1 }]);
          }
        },
      );

      await validerPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("validée"),
        }),
      );
    });
  });

  describe("Mutation: annulerPresence", () => {
    it("devrait résoudre la mutation d'annulation de présence", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await annulerPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Mutation: desinscrireUtilisateur", () => {
    it("devrait résoudre la mutation de désinscription", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("DELETE")) {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("désinscrit"),
        }),
      );
    });
  });

  describe("Gestion des erreurs GraphQL", () => {
    it("devrait retourner des erreurs GraphQL formatées", async () => {
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

      expect(statusMock).toHaveBeenCalledWith(500);
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("error");
    });

    it("devrait gérer les erreurs de validation avec détails", async () => {
      mockRequest.body = {
        utilisateur_nom: "",
        cours_id: "invalid",
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("errors");
      expect(Array.isArray(response.errors)).toBe(true);
    });
  });

  describe("Résolution de champs imbriqués", () => {
    it("devrait résoudre les relations cours -> participants", async () => {
      mockRequest.params = { id: "1" };

      const mockParticipants = [
        {
          utilisateur_id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
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

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data).toHaveLength(mockParticipants.length);
    });

    it("devrait résoudre les relations utilisateur -> inscriptions", async () => {
      mockRequest.params = { utilisateurId: "1" };

      const mockInscriptions = [
        {
          cours_id: 1,
          cours_nom: "Yoga",
          date: "2024-03-15",
        },
        {
          cours_id: 2,
          cours_nom: "Pilates",
          date: "2024-03-16",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockInscriptions);
        },
      );

      await getUtilisateurInscriptions(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data).toHaveLength(2);
    });
  });

  describe("Types nullables et optionnels", () => {
    it("devrait gérer les champs optionnels correctement", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga",
          description: null, // Champ optionnel null
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

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data[0]).toHaveProperty("nom");
      expect(response.data[0].description).toBeNull();
    });
  });

  describe("Pagination et filtres (si implémentés)", () => {
    it("devrait gérer les arguments de pagination", async () => {
      mockRequest.query = {
        limit: "10",
        offset: "0",
      };

      const mockCours = Array.from({ length: 10 }, (_, i) => ({
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

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data.length).toBeLessThanOrEqual(10);
    });
  });
});
