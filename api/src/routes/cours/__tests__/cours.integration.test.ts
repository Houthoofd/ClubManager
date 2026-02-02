/**
 * Tests d'intégration pour le module Cours
 * Tests avec mocks de base de données
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getAllCours,
  getParticipantCours,
  inscrireUtilisateur,
  ajouterCours,
  validerPresence,
  desinscrireUtilisateur,
} from "../core/handlers/index.js";

jest.mock("../../../db/connector/mysqlconnector.js", () => {
  return {
    default: {
      getInstance: jest.fn(() => ({
        query: jest.fn(),
      })),
    },
  };
});

describe("Cours - Tests d'intégration", () => {
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

  describe("Flux complet d'inscription", () => {
    it("devrait compléter le flux d'inscription à un cours", async () => {
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
        }),
      );
    });
  });

  describe("Flux complet de création et récupération", () => {
    it("devrait créer et récupérer un cours", async () => {
      // Créer le cours
      mockRequest.body = {
        nom: "Yoga Test",
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
          } else if (query.includes("SELECT")) {
            callback(null, [
              {
                id: 1,
                nom: "Yoga Test",
                date: "2024-03-15",
                heure_debut: "10:00:00",
                heure_fin: "11:00:00",
              },
            ]);
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(201);

      // Récupérer tous les cours
      jest.clearAllMocks();
      await getAllCours(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe("Flux complet de gestion de présence", () => {
    it("devrait inscrire, valider la présence et désinscrire", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      // Inscription
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

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

      // Validation de présence
      jest.clearAllMocks();
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

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

      // Désinscription
      jest.clearAllMocks();
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
    });
  });

  describe("Intégration avec participants", () => {
    it("devrait récupérer les participants après inscriptions", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      mockRequest.params = { id: "1" };

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [
            {
              utilisateur_id: 1,
              nom: "Dupont",
              prenom: "Jean",
              email: "jean@example.com",
            },
          ]);
        },
      );

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              utilisateur_id: 1,
              nom: "Dupont",
            }),
          ]),
        }),
      );
    });
  });
});
