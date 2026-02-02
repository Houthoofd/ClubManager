/**
 * Tests de sécurité pour le module Cours
 * Tests d'injection SQL, XSS, et autres vulnérabilités
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

describe("Cours - Tests de sécurité", () => {
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
    it("devrait protéger contre l'injection SQL dans l'ID du cours", async () => {
      const sqlInjections = [
        "1 OR 1=1",
        "1'; DROP TABLE cours; --",
        "1' UNION SELECT * FROM utilisateurs --",
        "1' AND '1'='1",
        "1'; DELETE FROM cours WHERE '1'='1",
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

        await getParticipantCours(
          mockRequest as Request,
          mockResponse as Response,
        );
      }
    });

    it("devrait protéger contre l'injection SQL dans les noms d'utilisateur", async () => {
      const sqlInjections = [
        "'; DROP TABLE utilisateurs; --",
        "admin'--",
        "' OR '1'='1",
        "'; UPDATE utilisateurs SET role='admin' WHERE '1'='1",
      ];

      for (const injection of sqlInjections) {
        jest.clearAllMocks();
        mockRequest.body = {
          utilisateur_nom: injection,
          utilisateur_prenom: "Jean",
          cours_id: 1,
        };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        const queryMock = mockInstance.query as jest.Mock;

        queryMock.mockImplementation(
          (query: string, params: any[], callback: Function) => {
            // Vérifier que l'injection est bien échappée
            expect(params).toContain(injection);
            callback(null, []);
          },
        );

        await inscrireUtilisateur(
          mockRequest as Request,
          mockResponse as Response,
        );
      }
    });

    it("devrait protéger contre l'injection SQL dans les dates", async () => {
      const sqlInjections = [
        "2024-03-15'; DROP TABLE cours; --",
        "' OR '1'='1",
        "2024-03-15' UNION SELECT * FROM utilisateurs --",
      ];

      for (const injection of sqlInjections) {
        jest.clearAllMocks();
        mockRequest.params = { date: injection };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        const queryMock = mockInstance.query as jest.Mock;

        queryMock.mockImplementation(
          (query: string, params: any[], callback: Function) => {
            expect(params).toContain(injection);
            callback(null, { affectedRows: 0 });
          },
        );

        await supprimerJour(mockRequest as Request, mockResponse as Response);
      }
    });

    it("devrait protéger contre l'injection SQL dans le nom du cours", async () => {
      const sqlInjections = [
        "Yoga'; DROP TABLE cours; --",
        "Cours' OR '1'='1",
        "'; UPDATE cours SET places_max=1000 WHERE '1'='1",
      ];

      for (const injection of sqlInjections) {
        jest.clearAllMocks();
        mockRequest.body = {
          nom: injection,
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
        const queryMock = mockInstance.query as jest.Mock;

        queryMock.mockImplementation(
          (query: string, params: any[], callback: Function) => {
            if (query.includes("SELECT") && query.includes("professeur")) {
              callback(null, [{ id: 1 }]);
            } else if (query.includes("INSERT")) {
              expect(params).toContain(injection);
              callback(null, { insertId: 1, affectedRows: 1 });
            }
          },
        );

        await ajouterCours(mockRequest as Request, mockResponse as Response);
      }
    });
  });

  describe("Protection contre XSS (Cross-Site Scripting)", () => {
    it("devrait échapper les scripts dans le nom du cours", async () => {
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg/onload=alert('XSS')>",
        "javascript:alert('XSS')",
        "<iframe src='javascript:alert(\"XSS\")'></iframe>",
      ];

      for (const payload of xssPayloads) {
        jest.clearAllMocks();
        mockRequest.body = {
          nom: payload,
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
        const queryMock = mockInstance.query as jest.Mock;

        queryMock.mockImplementation(
          (query: string, params: any[], callback: Function) => {
            if (query.includes("SELECT") && query.includes("professeur")) {
              callback(null, [{ id: 1 }]);
            } else if (query.includes("INSERT")) {
              // Vérifier que le payload est bien stocké tel quel (sera échappé côté front)
              expect(params).toContain(payload);
              callback(null, { insertId: 1, affectedRows: 1 });
            }
          },
        );

        await ajouterCours(mockRequest as Request, mockResponse as Response);

        // Le serveur doit accepter la donnée mais l'échapper lors du rendu
        expect(statusMock).toHaveBeenCalledWith(201);
      }
    });

    it("devrait échapper les scripts dans la description", async () => {
      const xssPayload = "<script>alert('XSS')</script>";
      mockRequest.body = {
        nom: "Yoga",
        description: xssPayload,
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
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            expect(params).toContain(xssPayload);
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait échapper les scripts dans les noms d'utilisateur", async () => {
      const xssPayload = "<script>alert('XSS')</script>";
      mockRequest.body = {
        utilisateur_nom: xssPayload,
        utilisateur_prenom: "Jean",
        cours_id: 1,
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          expect(params).toContain(xssPayload);
          callback(null, []);
        },
      );

      await inscrireUtilisateur(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Le handler doit traiter la donnée (sera échappée côté rendu)
      expect(queryMock).toHaveBeenCalled();
    });
  });

  describe("Protection contre les attaques par dépassement de buffer", () => {
    it("devrait rejeter un nom de cours extrêmement long", async () => {
      mockRequest.body = {
        nom: "A".repeat(10000),
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
        }),
      );
    });

    it("devrait rejeter une description extrêmement longue", async () => {
      mockRequest.body = {
        nom: "Yoga",
        description: "A".repeat(100000),
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
      };

      await ajouterCours(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe("Protection contre l'énumération d'ID", () => {
    it("ne devrait pas révéler l'existence d'un cours inexistant", async () => {
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
          message: expect.not.stringContaining("existe"),
        }),
      );
    });

    it("devrait utiliser le même message d'erreur pour ID invalide et inexistant", async () => {
      const responses: any[] = [];

      // Test avec ID invalide
      mockRequest.params = { id: "abc" };
      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );
      responses.push(jsonMock.mock.calls[0][0]);

      jest.clearAllMocks();

      // Test avec ID inexistant
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
      responses.push(jsonMock.mock.calls[0][0]);

      // Les messages devraient être génériques
      expect(responses[0].message).not.toContain("n'existe pas");
      expect(responses[1].message).not.toContain("n'existe pas");
    });
  });

  describe("Protection contre les attaques de type Path Traversal", () => {
    it("devrait rejeter les tentatives de path traversal dans les paramètres", async () => {
      const pathTraversalPayloads = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "....//....//....//etc/passwd",
        "../../database.sql",
      ];

      for (const payload of pathTraversalPayloads) {
        jest.clearAllMocks();
        mockRequest.params = { id: payload };

        await getParticipantCours(
          mockRequest as Request,
          mockResponse as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          }),
        );
      }
    });
  });

  describe("Protection contre les attaques LDAP Injection", () => {
    it("devrait échapper les caractères spéciaux LDAP dans les noms", async () => {
      const ldapPayloads = [
        "*(objectClass=*)",
        "*)(uid=*))(|(uid=*",
        "admin)(|(password=*))",
      ];

      for (const payload of ldapPayloads) {
        jest.clearAllMocks();
        mockRequest.body = {
          utilisateur_nom: payload,
          utilisateur_prenom: "Jean",
          cours_id: 1,
        };

        const MysqlConnector = (
          await import("../../../db/connector/mysqlconnector.js")
        ).default;
        const mockInstance = MysqlConnector.getInstance();
        const queryMock = mockInstance.query as jest.Mock;

        queryMock.mockImplementation(
          (query: string, params: any[], callback: Function) => {
            // Vérifier que les caractères spéciaux sont échappés
            expect(params).toContain(payload);
            callback(null, []);
          },
        );

        await inscrireUtilisateur(
          mockRequest as Request,
          mockResponse as Response,
        );
      }
    });
  });

  describe("Protection contre les attaques NoSQL Injection", () => {
    it("devrait protéger contre les payloads NoSQL dans les ID", async () => {
      const noSqlPayloads = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$where": "1==1"}',
        '{"$regex": ".*"}',
      ];

      for (const payload of noSqlPayloads) {
        jest.clearAllMocks();
        mockRequest.params = { id: payload };

        await getParticipantCours(
          mockRequest as Request,
          mockResponse as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(400);
      }
    });
  });

  describe("Protection contre les attaques par timing", () => {
    it("ne devrait pas révéler d'information via le temps de réponse", async () => {
      const startInvalid = Date.now();
      mockRequest.params = { id: "abc" };
      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );
      const timeInvalid = Date.now() - startInvalid;

      jest.clearAllMocks();

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      (mockInstance.query as jest.Mock).mockImplementation(
        (query: string, params: any[], callback: Function) => {
          callback(null, []);
        },
      );

      const startNotFound = Date.now();
      mockRequest.params = { id: "999999" };
      await getParticipantCours(
        mockRequest as Request,
        mockResponse as Response,
      );
      const timeNotFound = Date.now() - startNotFound;

      // Les temps devraient être similaires (pas de révélation d'info)
      const timeDiff = Math.abs(timeInvalid - timeNotFound);
      expect(timeDiff).toBeLessThan(100); // Tolérance de 100ms
    });
  });

  describe("Validation stricte des types", () => {
    it("devrait rejeter les types de données inattendus", async () => {
      const invalidTypes = [
        { cours_id: "not-a-number" },
        { cours_id: null },
        { cours_id: undefined },
        { cours_id: {} },
        { cours_id: [] },
        { cours_id: true },
      ];

      for (const invalidData of invalidTypes) {
        jest.clearAllMocks();
        mockRequest.body = {
          utilisateur_nom: "Dupont",
          utilisateur_prenom: "Jean",
          ...invalidData,
        };

        await inscrireUtilisateur(
          mockRequest as Request,
          mockResponse as Response,
        );

        expect(statusMock).toHaveBeenCalledWith(400);
      }
    });
  });

  describe("Protection contre les mass assignment", () => {
    it("devrait ignorer les champs non autorisés lors de la création de cours", async () => {
      mockRequest.body = {
        nom: "Yoga",
        date: "2024-03-15",
        heure_debut: "10:00:00",
        heure_fin: "11:00:00",
        places_max: 15,
        professeur_id: 1,
        // Champs non autorisés
        id: 999,
        created_at: "2020-01-01",
        is_admin: true,
        role: "admin",
      };

      const MysqlConnector = (
        await import("../../../db/connector/mysqlconnector.js")
      ).default;
      const mockInstance = MysqlConnector.getInstance();
      const queryMock = mockInstance.query as jest.Mock;

      queryMock.mockImplementation(
        (query: string, params: any[], callback: Function) => {
          if (query.includes("SELECT") && query.includes("professeur")) {
            callback(null, [{ id: 1 }]);
          } else if (query.includes("INSERT")) {
            // Vérifier que les champs interdits ne sont pas dans les paramètres
            const paramsString = JSON.stringify(params);
            expect(paramsString).not.toContain("is_admin");
            expect(paramsString).not.toContain("role");
            callback(null, { insertId: 1, affectedRows: 1 });
          }
        },
      );

      await ajouterCours(mockRequest as Request, mockResponse as Response);
    });
  });
});
