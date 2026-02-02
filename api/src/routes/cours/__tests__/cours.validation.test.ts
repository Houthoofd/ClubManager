/**
 * Tests de validation pour le module Cours
 * Validation des données entrantes et des règles métier
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  inscrireUtilisateur,
  ajouterCours,
  modifierCours,
  validerPresence,
  annulerPresence,
  desinscrireUtilisateur,
  getParticipantCours,
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

describe("Cours - Tests de validation", () => {
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

  describe("Validation des inscriptions", () => {
    it("devrait rejeter une inscription sans utilisateur_nom", async () => {
      mockRequest.body = {
        utilisateur_prenom: "Jean",
        cours_id: 1,
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
        }),
      );
    });

    it("devrait rejeter une inscription sans utilisateur_prenom", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        cours_id: 1,
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
        }),
      );
    });

    it("devrait rejeter une inscription sans cours_id", async () => {
      mockRequest.body = {
        utilisateur_nom: "Dupont",
        utilisateur_prenom: "Jean",
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
        }),
      );
    });

    it("devrait accepter des données d'inscription valides", async () => {
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
    });
  });

  describe("Validation de l'ajout de cours", () => {
    it("devrait rejeter un cours sans nom", async () => {
      mockRequest.body = {
        description: "Description",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait rejeter un cours avec une date invalide", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "invalid-date",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait rejeter un cours avec heure_fin avant heure_debut", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2024-03-15",
        heure_debut: "11:00:00",
        heure_fin: "10:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("fin doit être après"),
        }),
      );
    });

    it("devrait rejeter un cours avec un nombre de places invalide", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: -5,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait rejeter un cours avec places_max = 0", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 0,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });
  });

  describe("Validation des IDs", () => {
    it("devrait rejeter un ID de cours non numérique", async () => {
      mockRequest.params = { id: "abc" };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait rejeter un ID de cours négatif", async () => {
      mockRequest.params = { id: "-1" };

      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait accepter un ID valide", async () => {
      mockRequest.params = { id: "1" };

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

      expect(statusMock).not.toHaveBeenCalledWith(400);
    });
  });

  describe("Validation des dates", () => {
    it("devrait rejeter une date dans le passé", async () => {
      const datePasse = new Date();
      datePasse.setDate(datePasse.getDate() - 1);

      mockRequest.body = {
        nom: "Yoga",
        date: datePasse.toISOString().split("T")[0],
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("passé"),
        }),
      );
    });

    it("devrait accepter une date valide dans le futur", async () => {
      const dateFutur = new Date();
      dateFutur.setDate(dateFutur.getDate() + 7);

      mockRequest.body = {
        nom: "Yoga",
        date: dateFutur.toISOString().split("T")[0],
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
    });
  });

  describe("Validation de la présence", () => {
    it("devrait rejeter une validation de présence sans utilisateur_id", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await validerPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("requis"),
        }),
      );
    });

    it("devrait rejeter une validation de présence sans cours_id", async () => {
      mockRequest.params = {};
      mockRequest.body = { utilisateur_id: 1 };

      await validerPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("requis"),
        }),
      );
    });
  });

  describe("Validation de la désinscription", () => {
    it("devrait rejeter une désinscription sans utilisateur_id", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await desinscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("requis"),
        }),
      );
    });
  });

  describe("Validation de la suppression de jour", () => {
    it("devrait rejeter une date invalide", async () => {
      mockRequest.params = { date: "not-a-date" };

      await supprimerJour(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait accepter une date valide", async () => {
      mockRequest.params = { date: "2024-03-15" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 2 });
        },
      );

      await supprimerJour(mockRequest as Request, mockResponse as Response);

      expect(statusMock).not.toHaveBeenCalledWith(400);
    });
  });

  describe("Validation du retrait de professeur", () => {
    it("devrait rejeter un retrait sans professeur_id", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await retirerProfesseur(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("requis"),
        }),
      );
    });

    it("devrait rejeter un professeur_id non numérique", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { professeur_id: "abc" };

      await retirerProfesseur(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });
  });

  describe("Validation des limites de capacité", () => {
    it("devrait empêcher l'inscription si le cours est complet", async () => {
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
          if (query.includes("SELECT") && query.includes("COUNT")) {
            // Cours complet
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
  });

  describe("Validation des noms", () => {
    it("devrait rejeter un nom de cours trop court", async () => {
      mockRequest.body = {
        nom: "Y",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });

    it("devrait rejeter un nom de cours trop long", async () => {
      mockRequest.body = {
        nom: "Y".repeat(256),
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("invalide"),
        }),
      );
    });
  });
});
