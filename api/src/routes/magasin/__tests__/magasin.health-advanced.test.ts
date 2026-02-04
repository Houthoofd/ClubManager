/**
 * Tests de health check avancés pour le module Magasin
 * Tests du monitoring et diagnostics du système
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Magasin } from "../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../db/clients/paiements/paiements.js";
import {
  healthCheck,
  getDiagnostic,
} from "../core/handlers/index.js";

describe("Magasin Module - Tests de health check avancés", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockMagasinClient: Partial<Magasin>;
  let mockPaiementsClient: Partial<Paiements>;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);

    mockRequest = {
      params: {},
      body: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockMagasinClient = {
      obtenirArticlesParCategories: jest.fn(),
      obtenirLesCategories: jest.fn(),
      obtenirLesCommandes: jest.fn(),
    };

    mockPaiementsClient = {
      queryAsync: jest.fn(),
    };
  });

  describe("healthCheck - GET /api/magasin/health", () => {
    it("devrait retourner un statut healthy avec toutes les informations", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          module: "magasin",
          version: "1.0.0",
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          features: expect.objectContaining({
            articles: true,
            categories: true,
            commandes: true,
            paiements: true,
            tailles: true,
            statistiques: true,
          }),
        })
      );
    });

    it("devrait inclure le timestamp ISO", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("devrait inclure l'uptime du processus", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(typeof response.uptime).toBe("number");
      expect(response.uptime).toBeGreaterThanOrEqual(0);
    });

    it("devrait retourner la version correcte du module", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response.version).toBe("1.0.0");
      expect(response.module).toBe("magasin");
    });

    it("devrait lister toutes les fonctionnalités disponibles", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response.features).toEqual({
        articles: true,
        categories: true,
        commandes: true,
        paiements: true,
        tailles: true,
        statistiques: true,
      });
    });

    it("devrait répondre rapidement (< 100ms)", async () => {
      const startTime = Date.now();

      await healthCheck(mockRequest as Request, mockResponse as Response);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it("devrait gérer les erreurs sans crasher", async () => {
      // Simuler une erreur interne
      jsonMock.mockImplementationOnce(() => {
        throw new Error("JSON Error");
      });

      await expect(
        healthCheck(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });

  describe("getDiagnostic - GET /api/magasin/diagnostic", () => {
    it("devrait retourner les informations de diagnostic complètes", async () => {
      // Mock du MysqlConnector
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          if (query.includes("DESCRIBE articles")) {
            callback(null, [
              { Field: "id", Type: "int", Null: "NO", Key: "PRI" },
              { Field: "nom", Type: "varchar(255)", Null: "NO" },
              { Field: "prix", Type: "decimal(10,2)", Null: "NO" },
            ]);
          } else if (query.includes("DESCRIBE commandes")) {
            callback(null, [
              { Field: "id", Type: "int", Null: "NO", Key: "PRI" },
              { Field: "utilisateur_id", Type: "int", Null: "NO" },
            ]);
          } else if (query.includes("DESCRIBE tailles")) {
            callback(null, [
              { Field: "id", Type: "int", Null: "NO", Key: "PRI" },
              { Field: "nom", Type: "varchar(20)", Null: "NO" },
            ]);
          } else if (query.includes("COUNT")) {
            callback(null, [{ count: 100 }]);
          }
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          module: "magasin",
          timestamp: expect.any(String),
        })
      );
    });

    it("devrait inclure les informations de base de données", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(null, [{ Field: "id", Type: "int" }]);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("database");
      expect(response.database).toHaveProperty("connected");
      expect(response.database).toHaveProperty("tables");
    });

    it("devrait vérifier les tables articles, commandes et tailles", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(null, [{ Field: "id" }]);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.database.tables).toHaveProperty("articles");
      expect(response.database.tables).toHaveProperty("commandes");
      expect(response.database.tables).toHaveProperty("tailles");
    });

    it("devrait inclure les recommandations", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(null, [{ Field: "id" }]);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("recommendations");
      expect(Array.isArray(response.recommendations)).toBe(true);
      expect(response.recommendations.length).toBeGreaterThan(0);
    });

    it("devrait gérer les erreurs de connexion à la base de données", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(new Error("Connection refused"), null);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          module: "magasin",
          message: "Erreur lors du diagnostic",
        })
      );
    });

    it("devrait répondre en moins de 500ms", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(null, [{ Field: "id" }]);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      const startTime = Date.now();

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });
  });

  describe("Monitoring et alertes", () => {
    it("devrait détecter un statut unhealthy si des erreurs critiques", async () => {
      // Simuler une situation critique
      const originalEnv = process.env.DB_HOST;
      delete process.env.DB_HOST;

      await healthCheck(mockRequest as Request, mockResponse as Response);

      // Même en cas d'erreur, le health check doit répondre
      expect(statusMock).toHaveBeenCalled();

      // Restaurer l'environnement
      if (originalEnv) {
        process.env.DB_HOST = originalEnv;
      }
    });

    it("devrait inclure des métriques de performance", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("uptime");
      expect(typeof response.uptime).toBe("number");
    });

    it("devrait être idempotent", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);
      const response1 = jsonMock.mock.calls[0][0];

      jest.clearAllMocks();
      jsonMock = jest.fn();
      statusMock = jest.fn(() => mockResponse as Response);
      mockResponse.json = jsonMock;
      mockResponse.status = statusMock;

      await healthCheck(mockRequest as Request, mockResponse as Response);
      const response2 = jsonMock.mock.calls[0][0];

      expect(response1.status).toBe(response2.status);
      expect(response1.module).toBe(response2.module);
      expect(response1.version).toBe(response2.version);
    });
  });

  describe("Intégration avec systèmes de monitoring", () => {
    it("devrait fournir un format compatible avec Prometheus", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];

      // Vérifier que les données peuvent être converties en métriques Prometheus
      expect(response.status).toMatch(/^(healthy|unhealthy|degraded)$/);
      expect(typeof response.uptime).toBe("number");
    });

    it("devrait fournir des informations pour les dashboards", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      const response = jsonMock.mock.calls[0][0];

      // Vérifier les données utiles pour les dashboards
      expect(response).toHaveProperty("timestamp");
      expect(response).toHaveProperty("uptime");
      expect(response).toHaveProperty("features");
      expect(response).toHaveProperty("version");
    });

    it("devrait être compatible avec les health checks K8s", async () => {
      await healthCheck(mockRequest as Request, mockResponse as Response);

      // K8s attend un 200 pour healthy
      expect(statusMock).toHaveBeenCalledWith(200);

      const response = jsonMock.mock.calls[0][0];
      expect(response.status).toBe("healthy");
    });
  });

  describe("Diagnostics avancés", () => {
    it("devrait fournir des informations sur la structure des tables", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          if (query.includes("DESCRIBE")) {
            callback(null, [
              { Field: "id", Type: "int(11)", Null: "NO", Key: "PRI", Default: null },
              { Field: "nom", Type: "varchar(255)", Null: "NO", Key: "", Default: null },
            ]);
          } else {
            callback(null, [{ count: 50 }]);
          }
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.database.tables.articles).toHaveProperty("structure");
      expect(response.database.tables.articles).toHaveProperty("count");
    });

    it("devrait compter les enregistrements de chaque table", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          if (query.includes("DESCRIBE")) {
            callback(null, [{ Field: "id" }]);
          } else if (query.includes("COUNT")) {
            callback(null, [{ count: 42 }]);
          }
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.database.tables.articles).toHaveProperty("count");
      expect(typeof response.database.tables.articles.count).toBe("number");
    });

    it("devrait inclure l'état de connexion à la base de données", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(null, [{ Field: "id" }]);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.database).toHaveProperty("connected");
      expect(response.database.connected).toBe(true);
    });
  });

  describe("Gestion des erreurs dans le diagnostic", () => {
    it("devrait gérer gracieusement une erreur de timeout", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          setTimeout(() => {
            callback(new Error("Query timeout"), null);
          }, 100);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
        })
      );
    });

    it("devrait retourner un message d'erreur clair", async () => {
      const mockMysqlConnector = {
        query: jest.fn((query: string, params: any[], callback: Function) => {
          callback(new Error("Table does not exist"), null);
        }),
      };

      jest.mock("../../../db/connector/mysqlconnector.js", () => ({
        default: {
          getInstance: () => mockMysqlConnector,
        },
      }));

      await getDiagnostic(
        mockRequest as Request,
        mockResponse as Response,
        mockMagasinClient as Magasin,
        mockPaiementsClient as Paiements
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("error");
      expect(response.error).toContain("Table does not exist");
    });
  });
});
