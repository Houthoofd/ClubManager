/**
 * Tests de base pour le module Cours
 * Tests des fonctionnalités principales (happy path)
 * Pattern identique aux tests commandes et auth
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

describe("Cours Module - Tests de base", () => {
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

  describe("getAllCours - GET /api/cours", () => {
    it("devrait retourner la liste de tous les cours", async () => {
      const mockCours = [
        {
          id: 1,
          nom: "Yoga Débutant",
          description: "Cours de yoga pour débutants",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          heure_fin: "11:00:00",
          places_disponibles: 10,
          professeur: "Jean Dupont",
        },
        {
          id: 2,
          nom: "Pilates Avancé",
          description: "Cours de pilates niveau avancé",
          date: "2024-03-16",
          heure_debut: "14:00:00",
          heure_fin: "15:00:00",
          places_disponibles: 5,
          professeur: "Marie Martin",
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
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockCours,
      });
    });

    it("devrait retourner 404 si aucun cours n'est trouvé", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getAllCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Aucun cours à venir trouvé.",
      });
    });

    it("devrait gérer les erreurs de base de données", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Erreur de connexion"), null);
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
  });

  describe("getParticipantCours - GET /api/cours/:id/participants", () => {
    it("devrait retourner les participants d'un cours", async () => {
      mockRequest.params = { id: "1" };

      const mockParticipants = [
        {
          utilisateur_id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          statut: "confirmé",
        },
        {
          utilisateur_id: 2,
          nom: "Martin",
          prenom: "Marie",
          email: "marie.martin@example.com",
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

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockParticipants,
      });
    });

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
  });

  describe("inscrireUtilisateur - POST /api/cours/inscription", () => {
    it("devrait inscrire un utilisateur à un cours", async () => {
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
          if (query.includes("SELECT") && query.includes("utilisateur")) {
            // Vérification utilisateur - pas encore inscrit
            callback(null, []);
          } else if (query.includes("SELECT") && query.includes("cours_id")) {
            // Récupération ID utilisateur
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            // Insertion inscription
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
          message: "Utilisateur inscrit avec succès.",
        }),
      );
    });

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
            // Utilisateur déjà inscrit
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

    it("devrait valider les données d'entrée", async () => {
      mockRequest.body = {
        // Données incomplètes
        utilisateur_nom: "Dupont",
        // utilisateur_prenom manquant
        // cours_id manquant
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
  });

  describe("validerPresence - PUT /api/cours/:id/presence/valider", () => {
    it("devrait valider la présence d'un utilisateur", async () => {
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

    it("devrait retourner 400 si les paramètres sont manquants", async () => {
      mockRequest.params = {};
      mockRequest.body = {};

      await validerPresence(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("requis"),
      });
    });
  });

  describe("annulerPresence - PUT /api/cours/:id/presence/annuler", () => {
    it("devrait annuler la présence d'un utilisateur", async () => {
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
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("annulée"),
        }),
      );
    });
  });

  describe("desinscrireUtilisateur - DELETE /api/cours/:id/inscription", () => {
    it("devrait désinscrire un utilisateur d'un cours", async () => {
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

    it("devrait retourner 404 si l'inscription n'existe pas", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { utilisateur_id: 1 };

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

  describe("getPlanning - GET /api/cours/planning", () => {
    it("devrait retourner le planning des cours", async () => {
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
            {
              id: 2,
              nom: "Pilates",
              heure_debut: "14:00:00",
              heure_fin: "15:00:00",
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

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockPlanning,
      });
    });
  });

  describe("ajouterCours - POST /api/cours", () => {
    it("devrait créer un nouveau cours", async () => {
      mockRequest.body = {
        nom: "Yoga Débutant",
        description: "Cours de yoga pour débutants",
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
          if (query.includes("INSERT")) {
            callback(null, { insertId: 1, affectedRows: 1 });
          } else if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1, nom: "Dupont" }]);
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

    it("devrait valider les données du cours", async () => {
      mockRequest.body = {
        nom: "Yoga",
        // Données incomplètes
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

  describe("modifierCours - PUT /api/cours/:id", () => {
    it("devrait modifier un cours existant", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        nom: "Yoga Avancé",
        description: "Cours de yoga niveau avancé",
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
          message: expect.stringContaining("modifié"),
        }),
      );
    });

    it("devrait retourner 404 si le cours n'existe pas", async () => {
      mockRequest.params = { id: "999" };
      mockRequest.body = { nom: "Yoga" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 0 });
        },
      );

      await modifierCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("trouvé"),
      });
    });
  });

  describe("getUtilisateurInscriptions - GET /api/cours/inscriptions/:utilisateurId", () => {
    it("devrait retourner les inscriptions d'un utilisateur", async () => {
      mockRequest.params = { utilisateurId: "1" };

      const mockInscriptions = [
        {
          cours_id: 1,
          cours_nom: "Yoga",
          date: "2024-03-15",
          heure_debut: "10:00:00",
          statut: "confirmé",
        },
        {
          cours_id: 2,
          cours_nom: "Pilates",
          date: "2024-03-16",
          heure_debut: "14:00:00",
          statut: "en attente",
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
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockInscriptions,
      });
    });
  });

  describe("supprimerJour - DELETE /api/cours/jour/:date", () => {
    it("devrait supprimer tous les cours d'une date", async () => {
      mockRequest.params = { date: "2024-03-15" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 3 });
        },
      );

      await supprimerJour(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("supprimés"),
        }),
      );
    });
  });

  describe("retirerProfesseur - DELETE /api/cours/:id/professeur", () => {
    it("devrait retirer un professeur d'un cours", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { professeur_id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("UPDATE")) {
            callback(null, { affectedRows: 1 });
          } else if (query.includes("SELECT")) {
            callback(null, [{ id: 1, professeur_id: 1 }]);
          }
        },
      );

      await retirerProfesseur(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("retiré"),
        }),
      );
    });

    it("devrait vérifier que le professeur est bien assigné au cours", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { professeur_id: 2 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            // Le professeur du cours est différent
            callback(null, [{ id: 1, professeur_id: 1 }]);
          }
        },
      );

      await retirerProfesseur(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining("n'est pas assigné"),
      });
    });
  });
});
