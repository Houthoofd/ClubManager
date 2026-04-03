/**
 * Tests de base pour le module Commandes
 * Tests des fonctionnalités principales (happy path)
 * Pattern identique aux tests auth et alertes
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getCommandes,
  getCommande,
  updateStatut,
  batchUpdateStatuts,
  paymentConfirmation,
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

describe("Commandes Module - Tests de base", () => {
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

  describe("getCommandes - GET /api/commandes", () => {
    it("devrait retourner la liste de toutes les commandes", async () => {
      const mockCommandes = [
        {
          id: 1,
          numero_commande: "CMD-001",
          statut: "payée",
          total: 99.99,
          articles: [
            { article_nom: "Maillot", taille: "M", quantite: 1, prix: 49.99 },
          ],
        },
        {
          id: 2,
          numero_commande: "CMD-002",
          statut: "en attente",
          total: 149.99,
          articles: [
            { article_nom: "Short", taille: "L", quantite: 2, prix: 74.99 },
          ],
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("commandes")) {
            callback(null, mockCommandes);
          } else if (query.includes("commande_articles")) {
            callback(null, mockCommandes[0].articles);
          }
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("devrait gérer les erreurs de base de données", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Erreur de connexion à la base de données"));
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Erreur"),
        }),
      );
    });
  });

  describe("getCommande - GET /api/commandes/:id", () => {
    it("devrait retourner une commande spécifique avec ses détails", async () => {
      mockRequest.params = { id: "1" };

      const mockCommande = {
        id: 1,
        numero_commande: "CMD-001",
        statut: "payée",
        total: 99.99,
        utilisateur_email: "test@example.com",
        articles: [
          {
            article_nom: "Maillot",
            taille: "M",
            quantite: 1,
            prix: 49.99,
            images_urls: "image1.jpg,image2.jpg",
          },
        ],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [mockCommande]);
          } else if (query.includes("commande_articles")) {
            callback(null, mockCommande.articles);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          numero_commande: "CMD-001",
          articles: expect.any(Array),
        }),
      );
    });

    it("devrait retourner 404 si la commande n'existe pas", async () => {
      mockRequest.params = { id: "999" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Commande non trouvée",
        }),
      );
    });
  });

  describe("updateStatut - PUT /api/commandes/:id/statut", () => {
    it("devrait mettre à jour le statut d'une commande", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const mockCommandeData = [
        {
          commande_id: 1,
          ancien_statut: "payée",
          article_id: 1,
          taille_id: 1,
          quantite_commandee: 2,
          stock_actuel: 10,
          article_nom: "Maillot",
          taille_nom: "M",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, mockCommandeData);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Statut mis à jour avec succès",
          commandeId: 1,
          ancienStatut: "payée",
          nouveauStatut: "expédiée",
        }),
      );
    });

    it("devrait valider les statuts autorisés", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "statut_invalide" };

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Statut invalide"),
        }),
      );
    });

    it('devrait décrémenter le stock lors du passage à "expédiée"', async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const mockCommandeData = [
        {
          commande_id: 1,
          ancien_statut: "payée",
          article_id: 1,
          taille_id: 1,
          quantite_commandee: 2,
          stock_actuel: 10,
          article_nom: "Maillot",
          taille_nom: "M",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, mockCommandeData);
          } else if (query.includes("START TRANSACTION")) {
            callback(null, true);
          } else if (query.includes("UPDATE stocks")) {
            // Vérifier que le stock a été décrémenté
            expect(params[0]).toBe(8); // 10 - 2 = 8
            callback(null, { affectedRows: 1 });
          } else if (query.includes("COMMIT")) {
            callback(null, true);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          stocksAffectes: true,
          articlesTraites: 1,
        }),
      );
    });

    it("devrait incrémenter le stock lors de l'annulation d'une commande expédiée", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "annulée" };

      const mockCommandeData = [
        {
          commande_id: 1,
          ancien_statut: "expédiée",
          article_id: 1,
          taille_id: 1,
          quantite_commandee: 2,
          stock_actuel: 8,
          article_nom: "Maillot",
          taille_nom: "M",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, mockCommandeData);
          } else if (query.includes("START TRANSACTION")) {
            callback(null, true);
          } else if (query.includes("UPDATE stocks")) {
            // Vérifier que le stock a été incrémenté
            expect(params[0]).toBe(10); // 8 + 2 = 10
            callback(null, { affectedRows: 1 });
          } else if (query.includes("COMMIT")) {
            callback(null, true);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          stocksAffectes: true,
        }),
      );
    });

    it("devrait effectuer un rollback en cas d'erreur", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const mockCommandeData = [
        {
          commande_id: 1,
          ancien_statut: "payée",
          article_id: 1,
          taille_id: 1,
          quantite_commandee: 2,
          stock_actuel: 10,
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, mockCommandeData);
          } else if (query.includes("START TRANSACTION")) {
            callback(null, true);
          } else if (query.includes("UPDATE stocks")) {
            callback(new Error("Erreur de mise à jour du stock"));
          } else if (query.includes("ROLLBACK")) {
            callback(null, true);
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("batchUpdateStatuts - PUT /api/commandes/batch/statuts-safe", () => {
    it("devrait mettre à jour plusieurs commandes en lot", async () => {
      mockRequest.body = {
        updates: [
          { commandeId: 1, statut: "expédiée" },
          { commandeId: 2, statut: "payée" },
        ],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 1 });
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 2,
          errorCount: 0,
        }),
      );
    });

    it("devrait gérer les erreurs individuelles sans bloquer le lot", async () => {
      mockRequest.body = {
        updates: [
          { commandeId: 1, statut: "expédiée" },
          { commandeId: 2, statut: "payée" },
          { commandeId: 3, statut: "annulée" },
        ],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      let callCount = 0;
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callCount++;
          if (callCount === 2) {
            callback(new Error("Erreur pour la commande 2"));
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 2,
          errorCount: 1,
        }),
      );
    });

    it("devrait valider que le tableau updates est fourni", async () => {
      mockRequest.body = {};

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("requis"),
        }),
      );
    });
  });

  describe("paymentConfirmation - POST /api/commandes/paiement/confirmation", () => {
    it("devrait confirmer un paiement avec succès", async () => {
      mockRequest.body = { commandeId: 1 };

      // Mock de fetch global
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: "Paiement confirmé",
            }),
          status: 200,
          statusText: "OK",
          url: "http://localhost:3000/paiements/confirmation/confirm-payment-commande",
        } as Response),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Paiement confirmé",
        }),
      );
    });

    it("devrait valider que commandeId est présent", async () => {
      mockRequest.body = {};

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "ID de commande requis",
        }),
      );
    });

    it("devrait gérer les erreurs du service de paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve("Erreur de paiement"),
          status: 400,
          statusText: "Bad Request",
          url: "http://localhost:3000/paiements/confirmation/confirm-payment-commande",
        } as Response),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Erreur"),
        }),
      );
    });
  });

  describe("Gestion des stocks", () => {
    it("devrait ne pas modifier les stocks pour les statuts en attente -> payée", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "payée" };

      const mockCommandeData = [
        {
          commande_id: 1,
          ancien_statut: "en attente",
          article_id: 1,
          taille_id: 1,
          quantite_commandee: 2,
          stock_actuel: 10,
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, mockCommandeData);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          stocksAffectes: false,
        }),
      );
    });

    it("devrait gérer correctement les stocks à 0", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const mockCommandeData = [
        {
          commande_id: 1,
          ancien_statut: "payée",
          article_id: 1,
          taille_id: 1,
          quantite_commandee: 15,
          stock_actuel: 10,
          article_nom: "Maillot",
          taille_nom: "M",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, mockCommandeData);
          } else if (query.includes("UPDATE stocks")) {
            // Vérifier que le stock ne peut pas être négatif (Math.max(0, ...))
            expect(params[0]).toBe(0); // Math.max(0, 10 - 15) = 0
            callback(null, { affectedRows: 1 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });
  });
});
