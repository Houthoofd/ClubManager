/**
 * Tests de cohérence des schémas pour le module Commandes
 * Vérifie la structure et les types des données retournées
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

describe("Commandes - Tests de cohérence des schémas", () => {
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

  describe("Structure des réponses - getCommandes", () => {
    it("devrait retourner un tableau de commandes", async () => {
      const mockCommandes = [
        {
          id: 1,
          numero_commande: "CMD-001",
          statut: "payée",
          total: 99.99,
          articles: [],
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes")) {
            callback(null, mockCommandes);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(Array.isArray(response)).toBe(true);
    });

    it("chaque commande devrait avoir les champs requis", async () => {
      const mockCommandes = [
        {
          id: 1,
          numero_commande: "CMD-001",
          statut: "payée",
          total: 99.99,
          created_at: new Date(),
          utilisateur_id: 1,
          nom_utilisateur: "johntest",
          email: "john@test.com",
          articles: [],
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCommandes);
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const commande = response[0];

      expect(commande).toHaveProperty("id");
      expect(commande).toHaveProperty("numero_commande");
      expect(commande).toHaveProperty("statut");
      expect(commande).toHaveProperty("total");
      expect(commande).toHaveProperty("articles");
      expect(Array.isArray(commande.articles)).toBe(true);
    });

    it("les types des champs doivent être corrects", async () => {
      const mockCommandes = [
        {
          id: 1,
          numero_commande: "CMD-001",
          statut: "payée",
          total: 99.99,
          articles: [],
        },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCommandes);
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const commande = response[0];

      expect(typeof commande.id).toBe("number");
      expect(typeof commande.numero_commande).toBe("string");
      expect(typeof commande.statut).toBe("string");
      expect(typeof commande.total).toBe("number");
    });

    it("les articles doivent avoir la structure correcte", async () => {
      const mockCommandes = [
        {
          id: 1,
          numero_commande: "CMD-001",
          articles: [
            {
              article_id: 1,
              article_nom: "Maillot",
              taille: "M",
              quantite: 2,
              prix: 49.99,
              categorie_nom: "Maillots",
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
          if (query.includes("commandes")) {
            callback(null, mockCommandes);
          } else {
            callback(null, mockCommandes[0].articles);
          }
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const article = response[0].articles[0];

      expect(article).toHaveProperty("article_nom");
      expect(article).toHaveProperty("taille");
      expect(article).toHaveProperty("quantite");
      expect(article).toHaveProperty("prix");
      expect(typeof article.article_nom).toBe("string");
      expect(typeof article.quantite).toBe("number");
      expect(typeof article.prix).toBe("number");
    });
  });

  describe("Structure des réponses - getCommande", () => {
    it("devrait retourner un objet commande unique", async () => {
      mockRequest.params = { id: "1" };

      const mockCommande = {
        id: 1,
        numero_commande: "CMD-001",
        statut: "payée",
        total: 99.99,
        articles: [],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [mockCommande]);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(typeof response).toBe("object");
      expect(Array.isArray(response)).toBe(false);
    });

    it("devrait inclure les informations utilisateur", async () => {
      mockRequest.params = { id: "1" };

      const mockCommande = {
        id: 1,
        numero_commande: "CMD-001",
        utilisateur_id: 1,
        nom_utilisateur: "johntest",
        email: "john@test.com",
        first_name: "John",
        last_name: "Test",
        articles: [],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [mockCommande]);
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("nom_utilisateur");
      expect(response).toHaveProperty("email");
    });

    it("les articles doivent inclure les images", async () => {
      mockRequest.params = { id: "1" };

      const mockCommande = {
        id: 1,
        articles: [
          {
            article_nom: "Maillot",
            images_urls: "image1.jpg,image2.jpg",
            image_url: "main.jpg",
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
          } else {
            callback(null, mockCommande.articles);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const article = response.articles[0];
      expect(article).toHaveProperty("images");
      expect(Array.isArray(article.images)).toBe(true);
    });
  });

  describe("Structure des réponses - updateStatut", () => {
    it("devrait retourner un objet de confirmation", async () => {
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

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("commandeId");
      expect(response).toHaveProperty("ancienStatut");
      expect(response).toHaveProperty("nouveauStatut");
      expect(response).toHaveProperty("stocksAffectes");
    });

    it("les types de la réponse doivent être corrects", async () => {
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

      const response = jsonMock.mock.calls[0][0];
      expect(typeof response.message).toBe("string");
      expect(typeof response.commandeId).toBe("number");
      expect(typeof response.ancienStatut).toBe("string");
      expect(typeof response.nouveauStatut).toBe("string");
      expect(typeof response.stocksAffectes).toBe("boolean");
    });

    it("devrait inclure les statistiques de traitement", async () => {
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
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("articlesTraites");
      expect(response).toHaveProperty("optimized");
      expect(typeof response.articlesTraites).toBe("number");
      expect(typeof response.optimized).toBe("boolean");
    });
  });

  describe("Structure des réponses - batchUpdateStatuts", () => {
    it("devrait retourner un rapport de traitement", async () => {
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
          callback(null, { affectedRows: 1 });
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("results");
      expect(response).toHaveProperty("successCount");
      expect(response).toHaveProperty("errorCount");
    });

    it("results devrait être un tableau d'objets", async () => {
      mockRequest.body = {
        updates: [{ commandeId: 1, statut: "payée" }],
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

      const response = jsonMock.mock.calls[0][0];
      expect(Array.isArray(response.results)).toBe(true);
      expect(response.results[0]).toHaveProperty("commandeId");
      expect(response.results[0]).toHaveProperty("success");
    });

    it("les compteurs doivent être des nombres", async () => {
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
          callback(null, { affectedRows: 1 });
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      const response = jsonMock.mock.calls[0][0];
      expect(typeof response.successCount).toBe("number");
      expect(typeof response.errorCount).toBe("number");
      expect(response.successCount + response.errorCount).toBe(
        response.results.length,
      );
    });
  });

  describe("Structure des réponses - paymentConfirmation", () => {
    it("devrait retourner un objet de confirmation", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              paymentId: "pay_123",
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

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("data");
      expect(typeof response.message).toBe("string");
    });

    it("data devrait contenir les informations du paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              paymentId: "pay_123",
              amount: 99.99,
              currency: "EUR",
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

      const response = jsonMock.mock.calls[0][0];
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty("success");
    });
  });

  describe("Structure des erreurs", () => {
    it("les erreurs doivent avoir un format cohérent", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(new Error("Database error"));
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(typeof response.message).toBe("string");
      // En production, pas de champ error pour raisons de sécurité
      expect(response.error).toBeUndefined();
    });

    it("les erreurs 404 doivent avoir un format cohérent", async () => {
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
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(typeof response.message).toBe("string");
    });

    it("les erreurs 400 doivent avoir un format cohérent", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "invalid_status" };

      await updateStatut(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(typeof response.message).toBe("string");
    });
  });

  describe("Cohérence des données", () => {
    it("les statuts doivent être parmi les valeurs autorisées", async () => {
      const mockCommandes = [
        { id: 1, statut: "en attente" },
        { id: 2, statut: "payée" },
        { id: 3, statut: "expédiée" },
        { id: 4, statut: "annulée" },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCommandes);
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const validStatuts = ["en attente", "payée", "expédiée", "annulée"];

      response.forEach((commande: any) => {
        expect(validStatuts).toContain(commande.statut);
      });
    });

    it("les montants doivent être des nombres positifs ou zéro", async () => {
      const mockCommandes = [
        { id: 1, total: 0 },
        { id: 2, total: 99.99 },
        { id: 3, total: 1000.5 },
      ];

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, mockCommandes);
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      response.forEach((commande: any) => {
        expect(commande.total).toBeGreaterThanOrEqual(0);
        expect(typeof commande.total).toBe("number");
      });
    });

    it("les quantités doivent être des entiers positifs", async () => {
      mockRequest.params = { id: "1" };

      const mockCommande = {
        id: 1,
        articles: [
          { article_nom: "Article 1", quantite: 1 },
          { article_nom: "Article 2", quantite: 5 },
          { article_nom: "Article 3", quantite: 10 },
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
          } else {
            callback(null, mockCommande.articles);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      response.articles.forEach((article: any) => {
        expect(article.quantite).toBeGreaterThan(0);
        expect(Number.isInteger(article.quantite)).toBe(true);
      });
    });

    it("ne devrait jamais exposer d'informations sensibles", async () => {
      mockRequest.params = { id: "1" };

      const mockCommande = {
        id: 1,
        numero_commande: "CMD-001",
        utilisateur_id: 1,
        email: "john@test.com",
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [mockCommande]);
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      const responseStr = JSON.stringify(response);

      // Ne devrait pas contenir de mots de passe ou tokens
      expect(responseStr).not.toContain("password");
      expect(responseStr).not.toContain("token");
      expect(responseStr).not.toContain("secret");
      expect(responseStr).not.toContain("api_key");
    });
  });
});
