/**
 * Tests de gestion d'erreurs pour le module Cours
 * Tests des différents scénarios d'erreur et messages appropriés
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getAllCours,
  getParticipantCours,
  getCoursUtilisateurs,
  inscrireUtilisateur,
  annulerPresence,
  validerPresence,
  desinscrireUtilisateur,
  getPlanning,
  ajouterCours,
  modifierCours,
  getUtilisateurInscriptions,
  supprimerJour,
  retirerProfesseur,
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

describe("Cours - Tests de gestion d'erreurs", () => {
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

  describe("Erreurs de base de données", () => {
    it("devrait gérer les erreurs de connexion à la base de données", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Connection refused"), null);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur"),
        }),
      );
    });

    it("devrait gérer les timeouts de requête", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Query timeout"), null);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining("timeout"),
        }),
      );
    });

    it("devrait gérer les erreurs de contrainte d'intégrité", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        cours_id: 99999,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(
            new Error("ER_NO_REFERENCED_ROW_2: Foreign key constraint fails"),
            null,
          );
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait gérer les erreurs de clé dupliquée", async () => {
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
          if (query.includes("INSERT")) {
            callback(new Error("ER_DUP_ENTRY: Duplicate entry"), null);
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer les erreurs de dépassement de limite", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Too many connections"), null);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });

  describe("Erreurs de ressources introuvables", () => {
    it("devrait retourner 404 pour un cours inexistant", async () => {
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

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 404 pour un utilisateur inexistant", async () => {
      mockRequest.params = { utilisateurId: "999999" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getUtilisateurInscriptions(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("trouvé"),
      });
    });

    it("devrait retourner 404 pour une inscription inexistante", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 999 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 0 });
        },
      );

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("trouvée"),
      });
    });
  });

  describe("Erreurs de conflit", () => {
    it("devrait retourner 409 si l'utilisateur est déjà inscrit", async () => {
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
            callback(null, [{ id: 1, cours_id: 1, utilisateur_id: 1 }]);
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Utilisateur déjà inscrit au cours.",
      });
    });

    it("devrait gérer les conflits de disponibilité de professeur", async () => {
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
            // Professeur déjà occupé
            callback(null, [
              {
                id: 1,
                cours_concurrent: true,
                date: "2024-03-15",
                heure: "10:00:00",
              },
            ]);
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("occupé"),
        }),
      );
    });
  });

  describe("Erreurs de validation métier", () => {
    it("devrait rejeter l'inscription si le cours est complet", async () => {
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
          if (query.includes("SELECT") && query.includes("places")) {
            callback(null, [{ places_disponibles: 0, places_max: 10 }]);
          }
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("complet"),
        }),
      );
    });

    it("devrait rejeter la modification d'un cours déjà passé", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { nom: "Nouveau nom" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            const datePasse = new Date();
            datePasse.setDate(datePasse.getDate() - 1);
            callback(null, [
              {
                id: 1,
                date: datePasse.toISOString().split("T")[0],
              },
            ]);
          }
        },
      );

      await modifierCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("passé"),
        }),
      );
    });

    it("devrait rejeter la désinscription après la date limite", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("date")) {
            // Cours dans moins de 24h
            const demain = new Date();
            demain.setHours(demain.getHours() + 12);
            callback(null, [
              {
                id: 1,
                date: demain.toISOString().split("T")[0],
                heure_debut: demain.toTimeString().split(" ")[0],
              },
            ]);
          }
        },
      );

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("limite"),
        }),
      );
    });
  });

  describe("Erreurs de paramètres manquants", () => {
    it("devrait retourner 400 si l'ID du cours est manquant", async () => {
      mockRequest.params = {};

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "L'ID du cours est requis.",
      });
    });

    it("devrait retourner 400 si les paramètres de présence sont manquants", async () => {
      mockRequest.params = {};
      mockRequest.body = {};

      await validerPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("requis"),
      });
    });

    it("devrait retourner 400 si l'utilisateur_id est manquant pour la désinscription", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("requis"),
      });
    });
  });

  describe("Erreurs de validation Zod", () => {
    it("devrait retourner des erreurs de validation détaillées", async () => {
      mockRequest.body = {
        utilisateur_nom: "",
        utilisateur_prenom: "",
        cours_id: "invalid",
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Données invalides.",
          errors: expect.any(Array),
        }),
      );
    });

    it("devrait inclure le chemin du champ en erreur", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
        // cours_id manquant
      };

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.errors).toBeDefined();
      expect(errorResponse.errors[0]).toHaveProperty("path");
    });
  });

  describe("Erreurs inattendues", () => {
    it("devrait gérer les erreurs de type Error non prévues", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(() => {
        throw new Error("Erreur inattendue");
      });

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Erreur"),
        }),
      );
    });

    it("devrait gérer les erreurs non-Error", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(() => {
        throw "String error";
      });

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Erreur inconnue",
        }),
      );
    });

    it("devrait logger les erreurs serveur", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

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

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Messages d'erreur appropriés", () => {
    it("devrait retourner des messages d'erreur en français", async () => {
      mockRequest.params = {};

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      const errorMessage = jsonMock.mock.calls[0][0].message;
      expect(errorMessage).toMatch(/[àâäéèêëïîôùûüÿç]/i);
    });

    it("ne devrait pas exposer de détails sensibles dans les messages", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(
            new Error(
              "Access denied for user 'admin'@'localhost' (using password: YES)",
            ),
            null,
          );
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const errorMessage = jsonMock.mock.calls[0][0].message;
      expect(errorMessage).not.toContain("admin");
      expect(errorMessage).not.toContain("localhost");
      expect(errorMessage).not.toContain("password");
    });

    it("devrait retourner des messages génériques pour les erreurs serveur", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Internal server error with details"), null);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      const errorMessage = jsonMock.mock.calls[0][0].message;
      expect(errorMessage).toContain("Erreur serveur");
    });
  });
});
