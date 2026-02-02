/**
 * Tests de gestion d'erreurs pour le module Commandes
 * Tests des cas d'erreur et de la robustesse
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

describe("Commandes - Tests de gestion d'erreurs", () => {
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
    it("devrait gérer une erreur de connexion à la base de données", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("ECONNREFUSED: Connection refused"));
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Erreur"),
        }),
      );
      // En production, pas de champ error pour des raisons de sécurité
      const response = jsonMock.mock.calls[0][0];
      expect(response.error).toBeUndefined();
    });

    it("devrait gérer un timeout de base de données", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Query timeout exceeded"));
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur de syntaxe SQL", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(
            new Error("ER_PARSE_ERROR: You have an error in your SQL syntax"),
          );
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une violation de contrainte de clé étrangère", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 999,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          } else {
            callback(
              new Error(
                "ER_NO_REFERENCED_ROW: Cannot add or update a child row",
              ),
            );
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer un deadlock", async () => {
      mockRequest.body = {
        updates: [
          { commandeId: 1, statut: "payée" },
          { commandeId: 2, statut: "expédiée" },
        ],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("ER_LOCK_DEADLOCK: Deadlock found"));
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCount: 2,
        }),
      );
    });
  });

  describe("Erreurs de transaction", () => {
    it("devrait rollback si START TRANSACTION échoue", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          } else if (query.includes("START TRANSACTION")) {
            callback(new Error("Cannot start transaction"));
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait rollback si une mise à jour échoue", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      let rollbackCalled = false;

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          } else if (query.includes("START TRANSACTION")) {
            callback(null, true);
          } else if (query.includes("UPDATE stocks")) {
            callback(new Error("Stock update failed"));
          } else if (query.includes("ROLLBACK")) {
            rollbackCalled = true;
            callback(null, true);
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(rollbackCalled).toBe(true);
      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer l'échec du COMMIT", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          } else if (query.includes("COMMIT")) {
            callback(new Error("Cannot commit transaction"));
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Erreurs réseau et API externes", () => {
    it("devrait gérer une erreur de connexion au service de paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.reject(new Error("ECONNREFUSED: Connection refused")),
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

    it("devrait gérer un timeout du service de paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Request timeout")),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une réponse HTTP 500 du service de paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve("Internal Server Error"),
          status: 500,
          statusText: "Internal Server Error",
          url: "http://localhost:3000/paiements",
        } as Response),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une réponse HTTP 503 (service indisponible)", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve("Service Unavailable"),
          status: 503,
          statusText: "Service Unavailable",
          url: "http://localhost:3000/paiements",
        } as Response),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une réponse JSON malformée", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error("Invalid JSON")),
          status: 200,
          statusText: "OK",
          url: "http://localhost:3000/paiements",
        } as Response),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Erreurs de données manquantes", () => {
    it("devrait gérer une commande sans articles", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [
              {
                id: 1,
                numero_commande: "CMD-001",
                statut: "en attente",
              },
            ]);
          } else if (query.includes("commande_articles")) {
            callback(null, []); // Pas d'articles
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          articles: expect.any(Array),
        }),
      );
    });

    it("devrait gérer des articles sans stock correspondant", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: null, // Stock inexistant
              },
            ]);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer des données utilisateur manquantes", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [
            {
              id: 1,
              numero_commande: "CMD-001",
              utilisateur_id: 999, // Utilisateur n'existe pas
              nom_utilisateur: null,
              email: null,
            },
          ]);
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Erreurs de données corrompues", () => {
    it("devrait gérer des IDs articles négatifs", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: -1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer des quantités commandées négatives", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: -5,
                stock_actuel: 10,
              },
            ]);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer des prix négatifs", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [
              {
                id: 1,
                total: -99.99, // Prix négatif
              },
            ]);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Erreurs de concurrence", () => {
    it("devrait gérer une commande modifiée pendant le traitement", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      let callCount = 0;

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callCount++;
            if (callCount === 1) {
              callback(null, [
                {
                  commande_id: 1,
                  ancien_statut: "payée",
                  article_id: 1,
                  taille_id: 1,
                  quantite_commandee: 1,
                  stock_actuel: 10,
                },
              ]);
            } else {
              // La deuxième fois, la commande a un statut différent
              callback(null, [
                {
                  commande_id: 1,
                  ancien_statut: "expédiée",
                  article_id: 1,
                  taille_id: 1,
                  quantite_commandee: 1,
                  stock_actuel: 9,
                },
              ]);
            }
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer plusieurs mises à jour simultanées du même stock", async () => {
      mockRequest.body = {
        updates: [
          { commandeId: 1, statut: "expédiée" },
          { commandeId: 2, statut: "expédiée" },
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

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Gestion des exceptions inattendues", () => {
    it("devrait gérer une erreur TypeError", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(() => {
        throw new TypeError("Cannot read property of undefined");
      });

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur ReferenceError", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(() => {
        throw new ReferenceError("Variable is not defined");
      });

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur null/undefined", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, null);
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Erreurs de format", () => {
    it("devrait gérer des dates invalides", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [
              {
                id: 1,
                created_at: "invalid-date",
                updated_at: "not-a-date",
              },
            ]);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer des URLs d'images invalides", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("commande_articles")) {
            callback(null, [
              {
                article_nom: "Test",
                images_urls: "invalid-url",
                image_url: null,
              },
            ]);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalled();
    });
  });
});
