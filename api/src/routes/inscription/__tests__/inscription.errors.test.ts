/**
 * Tests de gestion d'erreurs pour le module Inscription
 * Teste les différents scénarios d'erreur et leur gestion appropriée
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { Request, Response } from "express";

// Mock du connector MySQL - DOIT être avant les imports des handlers/services
jest.mock("../../../db/connector/mysqlconnector.js", () => {
  return {
    default: {
      getInstance: jest.fn(() => ({
        query: jest.fn(),
      })),
    },
  };
});

import { inscription, verificationEmail } from "../core/handlers/index.js";
import { InscriptionService } from "../core/services/inscription.service.js";

describe("Inscription Module - Tests de gestion d'erreurs", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockInscriptionService: jest.Mocked<InscriptionService>;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockInscriptionService = {
      verifierEmail: jest.fn(),
      inscrireUtilisateur: jest.fn(),
      hashPassword: jest.fn(),
      validerAge: jest.fn(),
      evaluerForceMotDePasse: jest.fn(),
      sanitizeUserData: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  // ==================== ERREURS DE VALIDATION ====================
  describe("Erreurs de validation", () => {
    it("devrait retourner 400 pour un email invalide", async () => {
      mockRequest.body = {
        email: "not-an-email",
      };

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait retourner 400 pour un email vide", async () => {
      mockRequest.body = {
        email: "",
      };

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait retourner 400 pour un email manquant", async () => {
      mockRequest.body = {};

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait retourner 400 pour des données d'inscription invalides", async () => {
      mockRequest.body = {
        nom: "",
        prenom: "",
        email: "invalid",
        password: "weak",
        date: "invalid-date",
        abonnement: -1,
        genre: 0,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait fournir des détails sur les erreurs de validation", async () => {
      mockRequest.body = {
        nom: "",
        prenom: "",
        email: "invalid",
        password: "weak",
        date: "invalid-date",
        abonnement: -1,
        genre: 0,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.any(Array),
        }),
      );
    });

    it("devrait retourner le premier message d'erreur", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@test.com",
        password: "weak",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/mot de passe|password/i),
        }),
      );
    });
  });

  // ==================== ERREURS DE BASE DE DONNÉES ====================
  describe("Erreurs de base de données", () => {
    it("devrait gérer une erreur de connexion DB lors de la vérification", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockInscriptionService.verifierEmail.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/erreur/i),
        }),
      );
    });

    it("devrait gérer une erreur DB lors de l'inscription", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockRejectedValue(
        new Error("Database error"),
      );

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/erreur/i),
        }),
      );
    });

    it("devrait ne pas exposer les détails techniques de l'erreur DB", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockRejectedValue(
        new Error("SELECT * FROM users WHERE password = 'secret'"),
      );

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.message).not.toContain("SELECT");
      expect(callArgs.message).not.toContain("password");
      expect(callArgs.message).not.toContain("secret");
    });

    it("devrait gérer un timeout de base de données", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockInscriptionService.verifierEmail.mockRejectedValue(
        new Error("Connection timeout"),
      );

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une perte de connexion DB", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockRejectedValue(
        new Error("Lost connection to MySQL server"),
      );

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS DE DUPLICATION ====================
  describe("Erreurs de duplication", () => {
    it("devrait retourner 409 pour un email déjà existant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "existing@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: false,
        message: "Un compte avec cet email existe déjà",
      });

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("existe déjà"),
        }),
      );
    });

    it("devrait indiquer clairement que l'email existe", async () => {
      mockRequest.body = {
        email: "existing@example.com",
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: true,
        message: "Cet email est déjà utilisé",
      });

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          exists: true,
          message: expect.stringContaining("déjà utilisé"),
        }),
      );
    });
  });

  // ==================== ERREURS DE SÉCURITÉ ====================
  describe("Erreurs de sécurité", () => {
    it("devrait rejeter les tentatives d'injection SQL dans l'email", async () => {
      mockRequest.body = {
        email: "user@example.com'; DROP TABLE users; --",
      };

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter les tentatives d'injection SQL dans le nom", async () => {
      mockRequest.body = {
        nom: "'; DROP TABLE users; --",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter les scripts XSS dans le nom", async () => {
      mockRequest.body = {
        nom: "<script>alert('xss')</script>",
        prenom: "Jean",
        email: "xss@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter les balises HTML dans le prénom", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "<img src=x onerror=alert(1)>",
        email: "html@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait ne pas exposer le mot de passe en cas d'erreur", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "MySecretP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockRejectedValue(
        new Error("Some error"),
      );

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      const responseData = JSON.stringify(jsonMock.mock.calls);
      expect(responseData).not.toContain("MySecretP@ss123");
    });
  });

  // ==================== ERREURS DE HASHAGE ====================
  describe("Erreurs de hashage de mot de passe", () => {
    it("devrait gérer une erreur lors du hashage du mot de passe", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: false,
        message: "Erreur lors du traitement du mot de passe",
      });

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== ERREURS DE FORMAT DE DONNÉES ====================
  describe("Erreurs de format de données", () => {
    it("devrait rejeter un JSON malformé", async () => {
      mockRequest.body = "not a json object" as any;

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter null comme body", async () => {
      mockRequest.body = null as any;

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter undefined comme body", async () => {
      mockRequest.body = undefined as any;

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un array au lieu d'un objet", async () => {
      mockRequest.body = [] as any;

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter une string au lieu d'un objet", async () => {
      mockRequest.body = "string body" as any;

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un number au lieu d'un objet", async () => {
      mockRequest.body = 12345 as any;

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== ERREURS D'ÂGE ====================
  describe("Erreurs de validation d'âge", () => {
    it("devrait retourner 400 pour un âge inférieur à 5 ans", async () => {
      const today = new Date();
      const twoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate(),
      );

      mockRequest.body = {
        nom: "Dupont",
        prenom: "Bébé",
        email: "tooyoung@example.com",
        password: "SecureP@ss123",
        date: twoYearsAgo.toISOString().split("T")[0],
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/âge|ans/i),
        }),
      );
    });

    it("devrait retourner 400 pour un âge supérieur à 120 ans", async () => {
      const today = new Date();
      const oldDate = new Date(
        today.getFullYear() - 150,
        today.getMonth(),
        today.getDate(),
      );

      mockRequest.body = {
        nom: "Dupont",
        prenom: "TrèsVieux",
        email: "tooold@example.com",
        password: "SecureP@ss123",
        date: oldDate.toISOString().split("T")[0],
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/âge|ans/i),
        }),
      );
    });

    it("devrait rejeter une date de naissance dans le futur", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockRequest.body = {
        nom: "Dupont",
        prenom: "Futur",
        email: "future@example.com",
        password: "SecureP@ss123",
        date: tomorrow.toISOString().split("T")[0],
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter une date invalide", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "invaliddate@example.com",
        password: "SecureP@ss123",
        date: "2023-13-45",
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== ERREURS DE RÉSEAU ====================
  describe("Erreurs de réseau", () => {
    it("devrait gérer une erreur ETIMEDOUT", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      const error = new Error("ETIMEDOUT") as any;
      error.code = "ETIMEDOUT";
      mockInscriptionService.verifierEmail.mockRejectedValue(error);

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur ECONNREFUSED", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      const error = new Error("ECONNREFUSED") as any;
      error.code = "ECONNREFUSED";
      mockInscriptionService.verifierEmail.mockRejectedValue(error);

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== ERREURS MULTIPLES ====================
  describe("Erreurs multiples", () => {
    it("devrait lister toutes les erreurs de validation", async () => {
      mockRequest.body = {
        nom: "",
        prenom: "123",
        email: "invalid-email",
        password: "weak",
        date: "invalid",
        abonnement: -1,
        genre: 0,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
            }),
          ]),
        }),
      );
    });

    it("devrait fournir des messages d'erreur clairs pour chaque champ", async () => {
      mockRequest.body = {
        nom: "",
        prenom: "",
        email: "",
        password: "",
        date: "",
        abonnement: 0,
        genre: 0,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);

      const response = jsonMock.mock.calls[0][0];
      expect(response.errors).toBeDefined();
      expect(response.errors.length).toBeGreaterThan(0);
    });
  });

  // ==================== GESTION D'ERREURS INATTENDUES ====================
  describe("Erreurs inattendues", () => {
    it("devrait gérer une erreur TypeError", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockRejectedValue(
        new TypeError("Cannot read property of undefined"),
      );

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur ReferenceError", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockInscriptionService.verifierEmail.mockRejectedValue(
        new ReferenceError("Variable is not defined"),
      );

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer une erreur non-Error object", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockInscriptionService.verifierEmail.mockRejectedValue(
        "String error" as any,
      );

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("devrait gérer null comme erreur", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockInscriptionService.verifierEmail.mockRejectedValue(null as any);

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== CODES DE STATUT HTTP ====================
  describe("Codes de statut HTTP appropriés", () => {
    it("devrait retourner 400 pour une validation échouée", async () => {
      mockRequest.body = {
        nom: "",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait retourner 409 pour un conflit (email existant)", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "existing@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: false,
        message: "Un compte avec cet email existe déjà",
      });

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it("devrait retourner 500 pour une erreur serveur", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockRejectedValue(
        new Error("Internal server error"),
      );

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  // ==================== MESSAGES D'ERREUR ====================
  describe("Messages d'erreur", () => {
    it("devrait fournir des messages d'erreur en français", async () => {
      mockRequest.body = {
        nom: "",
        prenom: "Jean",
        email: "test@example.com",
        password: "weak",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      const response = jsonMock.mock.calls[0][0];
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe("string");
      expect(response.message.length).toBeGreaterThan(0);
    });

    it("devrait ne pas exposer de stack trace", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockInscriptionService.verifierEmail.mockRejectedValue(
        new Error("Database error"),
      );

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      const response = jsonMock.mock.calls[0][0];
      expect(response).not.toHaveProperty("stack");
    });

    it("devrait ne pas exposer de détails de configuration", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockInscriptionService.verifierEmail.mockRejectedValue(
        new Error("Connection failed to mysql://user:password@localhost:3306"),
      );

      await verificationEmail(mockRequest as Request, mockResponse as Response, mockInscriptionService);

      const responseData = JSON.stringify(jsonMock.mock.calls);
      expect(responseData).not.toContain("mysql://");
      expect(responseData).not.toContain("localhost:3306");
    });
  });
});
