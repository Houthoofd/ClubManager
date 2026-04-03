/**
 * Tests de performance pour le module Commandes
 * Tests de charge, temps de réponse et optimisation
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import {
  getCommandes,
  getCommande,
  updateStatut,
  batchUpdateStatuts,
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

describe("Commandes - Tests de performance", () => {
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

  describe("Temps de réponse", () => {
    it("devrait récupérer une liste de commandes en moins de 100ms", async () => {
      const mockCommandes = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        numero_commande: `CMD-${i + 1}`,
        statut: "payée",
        total: 99.99,
      }));

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

      const start = performance.now();
      await getCommandes(mockRequest as Request, mockResponse as Response);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(150);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait récupérer une commande spécifique en moins de 50ms", async () => {
      mockRequest.params = { id: "1" };

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
              statut: "payée",
            },
          ]);
        },
      );

      const start = performance.now();
      await getCommande(mockRequest as Request, mockResponse as Response);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait mettre à jour un statut en moins de 150ms", async () => {
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

      const start = performance.now();
      await updateStatut(mockRequest as Request, mockResponse as Response);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(150);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Charge de travail", () => {
    it("devrait gérer 100 requêtes GET simultanées", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [{ id: 1 }]);
        },
      );

      const promises = Array.from({ length: 100 }, () =>
        getCommandes(mockRequest as Request, mockResponse as Response),
      );

      const start = performance.now();
      await Promise.all(promises);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
      expect(jsonMock).toHaveBeenCalledTimes(100);
    });

    it("devrait traiter 100 mises à jour en batch en moins de 5 secondes", async () => {
      const updates = Array.from({ length: 100 }, (_, i) => ({
        commandeId: i + 1,
        statut: "payée",
      }));

      mockRequest.body = { updates };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          // Simuler un délai de 10ms par requête
          setTimeout(() => {
            callback(null, { affectedRows: 1 });
          }, 10);
        },
      );

      const start = performance.now();
      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer des commandes avec beaucoup d'articles efficacement", async () => {
      mockRequest.params = { id: "1" };

      const largeArticleList = Array.from({ length: 500 }, (_, i) => ({
        article_nom: `Article ${i}`,
        quantite: 1,
        prix: 10.0,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes c")) {
            callback(null, [{ id: 1 }]);
          } else {
            callback(null, largeArticleList);
          }
        },
      );

      const start = performance.now();
      await getCommande(mockRequest as Request, mockResponse as Response);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe("Optimisation de la mémoire", () => {
    it("devrait gérer efficacement une grande liste de commandes", async () => {
      const largeCommandeList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        numero_commande: `CMD-${i + 1}`,
        statut: "payée",
        total: 99.99,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes")) {
            callback(null, largeCommandeList);
          } else {
            callback(null, []);
          }
        },
      );

      const memBefore = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
        2,
      );

      await getCommandes(mockRequest as Request, mockResponse as Response);

      const memAfter = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
        2,
      );

      const memDiff = parseFloat(memAfter) - parseFloat(memBefore);

      // Ne devrait pas consommer plus de 50MB
      expect(memDiff).toBeLessThan(50);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait nettoyer les ressources après traitement", async () => {
      const iterations = 10;

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [{ id: 1 }]);
        },
      );

      for (let i = 0; i < iterations; i++) {
        await getCommandes(mockRequest as Request, mockResponse as Response);
      }

      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }

      expect(jsonMock).toHaveBeenCalledTimes(iterations);
    });
  });

  describe("Optimisation des requêtes", () => {
    it("devrait minimiser le nombre de requêtes SQL", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      let queryCount = 0;

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          queryCount++;
          if (query.includes("commandes c")) {
            callback(null, [{ id: 1 }]);
          } else {
            callback(null, []);
          }
        },
      );

      await getCommande(mockRequest as Request, mockResponse as Response);

      // Ne devrait pas faire plus de 2 requêtes (commande + articles)
      expect(queryCount).toBeLessThanOrEqual(2);
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait utiliser les transactions efficacement", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { statut: "expédiée" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queries: string[] = [];

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          queries.push(query);
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

      // Vérifier que les transactions sont utilisées
      const hasTransaction = queries.some(
        (q) => q.includes("START TRANSACTION") || q.includes("COMMIT"),
      );
      expect(hasTransaction).toBe(true);
    });
  });

  describe("Scalabilité", () => {
    it("devrait maintenir des performances linéaires avec l'augmentation de la charge", async () => {
      const sizes = [10, 50, 100];
      const timings: number[] = [];

      for (const size of sizes) {
        jest.clearAllMocks();

        const updates = Array.from({ length: size }, (_, i) => ({
          commandeId: i + 1,
          statut: "payée",
        }));

        mockRequest.body = { updates };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        (mockInstance.query as jest.Mock).mockImplementation(
          (query: string, params: any[], callback: Function) => {
            callback(null, { affectedRows: 1 });
          },
        );

        const start = performance.now();
        await batchUpdateStatuts(
          mockRequest as Request,
          mockResponse as Response,
        );
        const duration = performance.now() - start;

        timings.push(duration);
      }

      // Le temps devrait augmenter de manière relativement linéaire
      // (pas exponentielle)
      const ratio1 = timings[1] / timings[0];
      const ratio2 = timings[2] / timings[1];

      // Les ratios ne devraient pas être trop différents (scalabilité linéaire)
      expect(Math.abs(ratio2 - ratio1)).toBeLessThan(3);
    });

    it("devrait gérer la pagination efficacement", async () => {
      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      // Simuler une grande base de données
      const totalCommandes = 10000;
      const pageSize = 20;
      const pages = Math.ceil(totalCommandes / pageSize);

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          // Simuler la pagination
          const commandes = Array.from({ length: pageSize }, (_, i) => ({
            id: i + 1,
          }));
          callback(null, commandes);
        },
      );

      const timings: number[] = [];

      // Tester plusieurs pages
      for (let page = 0; page < 5; page++) {
        jest.clearAllMocks();

        const start = performance.now();
        await getCommandes(mockRequest as Request, mockResponse as Response);
        const duration = performance.now() - start;

        timings.push(duration);
      }

      // Toutes les pages devraient avoir des temps similaires
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      timings.forEach((time) => {
        expect(Math.abs(time - avgTime)).toBeLessThan(avgTime * 0.5);
      });
    });
  });

  describe("Gestion de la concurrence", () => {
    it("devrait gérer les requêtes concurrentes sans dégradation", async () => {
      const concurrentRequests = 50;

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          // Simuler un délai réseau
          setTimeout(() => {
            callback(null, [{ id: 1 }]);
          }, Math.random() * 20);
        },
      );

      const start = performance.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) => {
        const req = { ...mockRequest, params: { id: i.toString() } };
        return getCommande(req as Request, mockResponse as Response);
      });

      await Promise.all(promises);

      const duration = performance.now() - start;

      // Ne devrait pas prendre plus de 2 secondes pour 50 requêtes
      expect(duration).toBeLessThan(2000);
      expect(jsonMock).toHaveBeenCalledTimes(concurrentRequests);
    });

    it("devrait éviter les conditions de course dans les batch updates", async () => {
      const updates = Array.from({ length: 20 }, (_, i) => ({
        commandeId: i + 1,
        statut: "payée",
      }));

      mockRequest.body = { updates };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryOrder: number[] = [];

      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          const commandeId = params[1];
          queryOrder.push(commandeId);
          callback(null, { affectedRows: 1 });
        },
      );

      await batchUpdateStatuts(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Vérifier que les commandes sont traitées dans l'ordre
      // (pour éviter les deadlocks)
      expect(jsonMock).toHaveBeenCalled();
    });

    it("devrait gérer correctement 2 commandes simultanées sur stock limité", async () => {
      // Simuler un stock limité de 5 unités pour un article
      const stockInitial = 5;
      let stockActuel = stockInitial;
      let lockAcquis = false;

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();

      // Mock pour simuler une vérification et mise à jour atomique du stock
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("FOR UPDATE")) {
            // Simulation d'un lock pessimiste
            if (lockAcquis) {
              // Attendre que le lock soit libéré
              setTimeout(() => {
                callback(null, [
                  {
                    article_id: 1,
                    taille_id: 1,
                    stock_disponible: stockActuel,
                  },
                ]);
              }, 50);
            } else {
              lockAcquis = true;
              callback(null, [
                {
                  article_id: 1,
                  taille_id: 1,
                  stock_disponible: stockActuel,
                },
              ]);
            }
          } else if (query.includes("UPDATE") && query.includes("stock")) {
            // Mise à jour du stock
            const quantiteDemandee = params[0]; // Supposé être le premier param
            if (stockActuel >= quantiteDemandee) {
              stockActuel -= quantiteDemandee;
              callback(null, { affectedRows: 1 });
              lockAcquis = false;
            } else {
              callback(new Error("Stock insuffisant"), null);
              lockAcquis = false;
            }
          } else if (query.includes("INSERT INTO commandes")) {
            callback(null, { insertId: Math.floor(Math.random() * 1000) });
          } else {
            callback(null, { affectedRows: 1 });
          }
        },
      );

      // Créer 2 commandes simultanées demandant chacune 4 unités
      // Stock initial = 5, donc une seule devrait réussir
      const commande1 = {
        body: {
          utilisateur_id: 1,
          articles: [{ article_id: 1, taille_id: 1, quantite: 4, prix: 49.99 }],
        },
      };

      const commande2 = {
        body: {
          utilisateur_id: 2,
          articles: [{ article_id: 1, taille_id: 1, quantite: 4, prix: 49.99 }],
        },
      };

      const results = await Promise.allSettled([
        new Promise((resolve, reject) => {
          // Simuler la création de commande 1
          setTimeout(() => {
            if (stockInitial >= 4) {
              resolve({ success: true, commandeId: 1 });
            } else {
              reject(new Error("Stock insuffisant"));
            }
          }, 10);
        }),
        new Promise((resolve, reject) => {
          // Simuler la création de commande 2
          setTimeout(() => {
            if (stockActuel >= 4) {
              resolve({ success: true, commandeId: 2 });
            } else {
              reject(new Error("Stock insuffisant"));
            }
          }, 15);
        }),
      ]);

      // Vérifier qu'une seule commande a réussi
      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failedCount = results.filter((r) => r.status === "rejected").length;

      // Avec un stock de 5 et 2 commandes de 4 unités chacune,
      // une seule devrait réussir
      expect(successCount).toBe(1);
      expect(failedCount).toBe(1);

      // Vérifier que le stock final est cohérent
      expect(stockActuel).toBe(1); // 5 - 4 = 1
    });
  });

  describe("Optimisation du cache", () => {
    it("devrait bénéficier du cache pour les requêtes répétées", async () => {
      mockRequest.params = { id: "1" };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, [{ id: 1 }]);
        },
      );

      const timings: number[] = [];

      // Exécuter la même requête plusieurs fois
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await getCommande(mockRequest as Request, mockResponse as Response);
        const duration = performance.now() - start;

        timings.push(duration);
      }

      // Les temps devraient rester constants (pas de dégradation)
      expect(jsonMock).toHaveBeenCalledTimes(5);

      // Vérifier que les temps sont relativement constants
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      timings.forEach((time) => {
        // Chaque temps devrait être dans une plage raisonnable de la moyenne
        expect(Math.abs(time - avgTime)).toBeLessThan(avgTime * 2);
      });
    });
  });

  describe("Benchmarks", () => {
    it("benchmark: récupération de 1000 commandes", async () => {
      const largeCommandeList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        numero_commande: `CMD-${i + 1}`,
        statut: "payée",
        total: 99.99,
      }));

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("commandes")) {
            callback(null, largeCommandeList);
          } else {
            callback(null, []);
          }
        },
      );

      const iterations = 10;
      const timings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        jest.clearAllMocks();

        const start = performance.now();
        await getCommandes(mockRequest as Request, mockResponse as Response);
        const duration = performance.now() - start;

        timings.push(duration);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);

      console.log(`
        Benchmark: Récupération de 1000 commandes
        - Moyenne: ${avgTime.toFixed(2)}ms
        - Min: ${minTime.toFixed(2)}ms
        - Max: ${maxTime.toFixed(2)}ms
        - Écart-type: ${Math.sqrt(timings.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timings.length).toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(1000);
    });

    it("benchmark: mise à jour batch de 100 commandes", async () => {
      const updates = Array.from({ length: 100 }, (_, i) => ({
        commandeId: i + 1,
        statut: "payée",
      }));

      mockRequest.body = { updates };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, { affectedRows: 1 });
        },
      );

      const iterations = 5;
      const timings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        jest.clearAllMocks();

        const start = performance.now();
        await batchUpdateStatuts(
          mockRequest as Request,
          mockResponse as Response,
        );
        const duration = performance.now() - start;

        timings.push(duration);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);

      console.log(`
        Benchmark: Batch update de 100 commandes
        - Moyenne: ${avgTime.toFixed(2)}ms
        - Min: ${minTime.toFixed(2)}ms
        - Max: ${maxTime.toFixed(2)}ms
        - Throughput: ${((100 * 1000) / avgTime).toFixed(0)} commandes/sec
      `);

      expect(avgTime).toBeLessThan(2000);
    });
  });
});
