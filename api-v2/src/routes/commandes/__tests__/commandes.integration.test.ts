/**
 * Tests d'intégration pour le module Commandes
 * Tests avec des interactions réelles entre les composants
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

describe("Commandes - Tests d'intégration", () => {
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

  describe("Flux complet de commande", () => {
    it("devrait gérer le flux complet: création -> paiement -> expédition", async () => {
      const commandeId = "1";

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      // ÉTAPE 1: Vérifier que la commande existe (en attente)
      mockRequest.params = { id: commandeId };

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [
              {
                id: 1,
                numero_commande: "CMD-001",
                statut: "en attente",
                total: 99.99,
              },
            ]);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          statut: "en attente",
        }),
      );

      jest.clearAllMocks();

      // ÉTAPE 2: Paiement de la commande
      mockRequest.body = { commandeId: 1 };

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
          url: "http://localhost:3000/paiements",
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

      jest.clearAllMocks();

      // ÉTAPE 3: Mise à jour du statut à "payée"
      mockRequest.params = { id: commandeId };
      mockRequest.body = { statut: "payée" };

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "en attente",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 10,
              },
            ]);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          nouveauStatut: "payée",
        }),
      );

      jest.clearAllMocks();

      // ÉTAPE 4: Expédition (avec mise à jour du stock)
      mockRequest.body = { statut: "expédiée" };

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 10,
              },
            ]);
          } else if (query.includes("UPDATE stocks")) {
            expect(params[0]).toBe(8); // 10 - 2
            callback(null, { affectedRows: 1 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          nouveauStatut: "expédiée",
          stocksAffectes: true,
        }),
      );
    });

    it("devrait gérer l'annulation d'une commande avec restauration du stock", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "annulée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "expédiée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 8,
              },
            ]);
          } else if (query.includes("UPDATE stocks")) {
            expect(params[0]).toBe(10); // 8 + 2 (restauration)
            callback(null, { affectedRows: 1 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          nouveauStatut: "annulée",
          stocksAffectes: true,
        }),
      );
    });
  });

  describe("Intégration avec le module de paiement", () => {
    it("devrait communiquer correctement avec le service de paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      let healthCheckCalled = false;
      let paymentConfirmCalled = false;

      global.fetch = jest.fn((url: string) => {
        if (url.includes("/health")) {
          healthCheckCalled = true;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: "healthy" }),
            status: 200,
            statusText: "OK",
            url,
          } as Response);
        } else if (url.includes("/confirm-payment-commande")) {
          paymentConfirmCalled = true;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                paymentId: "pay_123",
                commandeId: 1,
              }),
            status: 200,
            statusText: "OK",
            url,
          } as Response);
        }
        return Promise.reject(new Error("Unknown endpoint"));
      }) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(healthCheckCalled).toBe(true);
      expect(paymentConfirmCalled).toBe(true);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Paiement confirmé",
        }),
      );
    });

    it("devrait gérer la résilience si le service de paiement est indisponible", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn((url: string) => {
        if (url.includes("/health")) {
          return Promise.reject(new Error("Service unavailable"));
        }
        return Promise.reject(new Error("Connection refused"));
      }) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Intégration entre commandes et articles/stocks", () => {
    it("devrait récupérer les commandes avec leurs articles et catégories", async () => {
      const mockCommandesCompletes = [
        {
          id: 1,
          numero_commande: "CMD-001",
          statut: "payée",
          total: 99.99,
          nom_utilisateur: "johntest",
          email: "john@test.com",
        },
      ];

      const mockArticles = [
        {
          commande_article_id: 1,
          article_id: 1,
          article_nom: "Maillot Domicile",
          taille: "M",
          quantite: 1,
          prix: 49.99,
          categorie_nom: "Maillots",
        },
        {
          commande_article_id: 2,
          article_id: 2,
          article_nom: "Short",
          taille: "L",
          quantite: 1,
          prix: 29.99,
          categorie_nom: "Shorts",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, mockCommandesCompletes);
          } else if (query.includes("commande_articles")) {
            callback(null, mockArticles);
          }
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            articles: expect.arrayContaining([
              expect.objectContaining({
                article_nom: "Maillot Domicile",
                categorie_nom: "Maillots",
              }),
              expect.objectContaining({
                article_nom: "Short",
                categorie_nom: "Shorts",
              }),
            ]),
          }),
        ]),
      );
    });

    it("devrait mettre à jour plusieurs stocks lors d'une expédition multi-articles", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const stockUpdates: Array<{ article_id: number; new_stock: number }> =
        [];

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 10,
                article_nom: "Maillot",
              },
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 2,
                taille_id: 2,
                quantite_commandee: 1,
                stock_actuel: 5,
                article_nom: "Short",
              },
            ]);
          } else if (query.includes("UPDATE stocks")) {
            stockUpdates.push({
              article_id: params[1],
              new_stock: params[0],
            });
            callback(null, { affectedRows: 1 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(stockUpdates).toHaveLength(2);
      expect(stockUpdates[0].new_stock).toBe(8); // 10 - 2
      expect(stockUpdates[1].new_stock).toBe(4); // 5 - 1
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          articlesTraites: 2,
        }),
      );
    });
  });

  describe("Intégration avec les utilisateurs", () => {
    it("devrait récupérer les commandes avec les informations utilisateur", async () => {
      const mockCommandesAvecUtilisateurs = [
        {
          id: 1,
          numero_commande: "CMD-001",
          utilisateur_id: 1,
          nom_utilisateur: "johntest",
          email: "john@test.com",
          first_name: "John",
          last_name: "Test",
        },
        {
          id: 2,
          numero_commande: "CMD-002",
          utilisateur_id: 2,
          nom_utilisateur: "janetest",
          email: "jane@test.com",
          first_name: "Jane",
          last_name: "Doe",
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, mockCommandesAvecUtilisateurs);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            nom_utilisateur: "johntest",
            email: "john@test.com",
          }),
          expect.objectContaining({
            nom_utilisateur: "janetest",
            email: "jane@test.com",
          }),
        ]),
      );
    });
  });

  describe("Transactions et cohérence des données", () => {
    it("devrait assurer la cohérence entre commande et stock en transaction", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const operations: string[] = [];

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          operations.push(query);

          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 10,
              },
            ]);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      // Vérifier l'ordre des opérations
      expect(operations).toContain("START TRANSACTION");
      expect(operations.some((op) => op.includes("UPDATE stocks"))).toBe(true);
      expect(operations.some((op) => op.includes("UPDATE commandes"))).toBe(
        true,
      );
      expect(operations).toContain("COMMIT");
    });

    it("devrait faire un rollback si une mise à jour échoue en transaction", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const operations: string[] = [];

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          operations.push(query);

          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 10,
              },
            ]);
          } else if (query.includes("UPDATE stocks")) {
            callback(new Error("Stock update failed"));
          } else if (query.includes("ROLLBACK")) {
            callback(null, true);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(operations).toContain("ROLLBACK");
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Batch processing et performance", () => {
    it("devrait traiter les batch updates séquentiellement pour éviter les deadlocks", async () => {
      const updates = [
        { commandeId: 1, statut: "payée" },
        { commandeId: 2, statut: "expédiée" },
        { commandeId: 3, statut: "annulée" },
      ];

      mockRequest.body = { updates };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const processedCommandes: number[] = [];

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("UPDATE commandes")) {
            processedCommandes.push(params[1]); // commandeId
            // Ajouter un délai pour simuler le traitement
            setTimeout(() => {
              callback(null, { affectedRows: 1 });
            }, 10);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Vérifier que les commandes ont été traitées dans l'ordre
      expect(processedCommandes).toEqual([1, 2, 3]);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          successCount: 3,
        }),
      );
    });

    it("devrait continuer le batch même si certaines commandes échouent", async () => {
      const updates = [
        { commandeId: 1, statut: "payée" },
        { commandeId: 2, statut: "expédiée" },
        { commandeId: 3, statut: "annulée" },
      ];

      mockRequest.body = { updates };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      let callCount = 0;

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callCount++;
          if (callCount === 2) {
            // La deuxième commande échoue
            callback(new Error("Update failed"));
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
  });

  describe("Gestion des cas limites en intégration", () => {
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
                total: 0,
              },
            ]);
          } else {
            callback(null, []); // Pas d'articles
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          articles: [],
        }),
      );
    });

    it("devrait gérer une mise à jour de statut sans modification de stock", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "payée" };

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
                ancien_statut: "en attente",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 10,
              },
            ]);
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          stocksAffectes: false, // Pas de changement de stock pour en attente -> payée
        }),
      );
    });
  });

  describe("Intégration multi-modules", () => {
    it("devrait gérer le workflow complet: commande -> paiement -> stock -> notification", async () => {
      const commandeId = "1";
      const workflow: string[] = [];

      // 1. Récupération de la commande
      mockRequest.params = { id: commandeId };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          workflow.push("DB_QUERY");
          if (query.includes("commandes c")) {
            callback(null, [
              { id: 1, statut: "en attente", total: 99.99 },
            ]);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);
      workflow.push("COMMANDE_RETRIEVED");

      jest.clearAllMocks();

      // 2. Paiement
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() => {
        workflow.push("PAYMENT_API_CALLED");
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
          status: 200,
          statusText: "OK",
          url: "http://localhost:3000/paiements",
        } as Response);
      }) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );
      workflow.push("PAYMENT_CONFIRMED");

      jest.clearAllMocks();

      // 3. Mise à jour statut et stock
      mockRequest.params = { id: commandeId };
      mockRequest.body = { statut: "expédiée" };

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            callback(null, [
              {
                commande_id: 1,
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 2,
                stock_actuel: 10,
              },
            ]);
          } else if (query.includes("UPDATE stocks")) {
            workflow.push("STOCK_UPDATED");
            callback(null, { affectedRows: 1 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);
      workflow.push("STATUS_UPDATED");

      // Vérifier le workflow complet
      expect(workflow).toContain("DB_QUERY");
      expect(workflow).toContain("COMMANDE_RETRIEVED");
      expect(workflow).toContain("PAYMENT_API_CALLED");
      expect(workflow).toContain("PAYMENT_CONFIRMED");
      expect(workflow).toContain("STOCK_UPDATED");
      expect(workflow).toContain("STATUS_UPDATED");

      // Vérifier l'ordre
      const paymentIndex = workflow.indexOf("PAYMENT_CONFIRMED");
      const stockIndex = workflow.indexOf("STOCK_UPDATED");
      expect(stockIndex).toBeGreaterThan(paymentIndex);
    });
  });
});
