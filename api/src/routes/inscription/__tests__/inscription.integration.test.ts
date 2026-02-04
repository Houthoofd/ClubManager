/**
 * Tests d'intégration (mockés) pour le module Inscription
 * Tests avec dépendances mockées pour isolation complète
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { Request, Response } from "express";

// Mock du connector MySQL - DOIT être avant les imports des handlers
jest.mock("../../../db/connector/mysqlconnector.js", () => {
  return {
    default: {
      getInstance: jest.fn(() => ({
        query: jest.fn(),
      })),
    },
  };
});

// Mock du client Utilisateurs
jest.mock("../../../db/clients/utilisateurs/utilisateurs.js");

import { inscription, verificationEmail } from "../core/handlers/index.js";
import { InscriptionService } from "../core/services/inscription.service.js";
import { Utilisateurs } from "../../../db/clients/utilisateurs/utilisateurs.js";

describe("Inscription Module - Tests d'intégration (mockés)", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockUtilisateursClient: jest.Mocked<Utilisateurs>;
  let inscriptionService: InscriptionService;

  beforeEach(() => {
    // Setup des mocks de réponse
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

    // Mock du client utilisateurs
    mockUtilisateursClient = {
      checkUtilisateurByEmail: jest.fn(),
      inscriptionUtilisateurSimple: jest.fn(),
      getUtilisateurByEmail: jest.fn(),
    } as any;

    // Service d'inscription avec client mocké
    inscriptionService = new InscriptionService(mockUtilisateursClient);

    jest.clearAllMocks();
  });

  // ==================== VÉRIFICATION EMAIL ====================
  describe("Vérification d'email - Intégration", () => {
    it("devrait vérifier avec succès un email disponible", async () => {
      mockRequest.body = {
        email: "available@test.com",
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledWith("available@test.com");
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          exists: false,
          message: "Email disponible",
        }),
      );
    });

    it("devrait détecter un email déjà utilisé", async () => {
      mockRequest.body = {
        email: "existing@test.com",
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: true,
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledWith("existing@test.com");
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          exists: true,
          message: expect.stringContaining("déjà utilisé"),
        }),
      );
    });

    it("devrait normaliser l'email avant vérification", async () => {
      mockRequest.body = {
        email: "  TEST@EXAMPLE.COM  ",
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledWith("test@example.com");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait gérer les erreurs de validation d'email", async () => {
      mockRequest.body = {
        email: "invalid-email",
      };

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });

    it("devrait gérer les erreurs de base de données", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockRejectedValue(
        new Error("Database error"),
      );

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/erreur/i),
        }),
      );
    });
  });

  // ==================== INSCRIPTION COMPLÈTE ====================
  describe("Inscription complète - Intégration", () => {
    it("devrait inscrire un utilisateur avec succès", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      // Email disponible
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      // Inscription réussie
      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 42,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledWith("jean.dupont@test.com");
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@test.com",
          password: expect.any(String), // Mot de passe hashé
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        }),
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          userId: 42,
        }),
      );
    });

    it("devrait rejeter l'inscription avec un email existant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "existing@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      // Email déjà utilisé
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: true,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(mockUtilisateursClient.checkUtilisateurByEmail).toHaveBeenCalled();
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("existe déjà"),
        }),
      );
    });

    it("devrait hasher le mot de passe avant insertion", async () => {
      const plainPassword = "SecureP@ss123";

      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: plainPassword,
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        message: "OK",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      // Vérifier que le mot de passe passé à la DB est hashé
      const callArgs =
        mockUtilisateursClient.inscriptionUtilisateurSimple.mock.calls[0][0];
      expect(callArgs.password).not.toBe(plainPassword);
      expect(callArgs.password).toMatch(/^\$2[aby]\$/); // Format bcrypt
    });

    it("devrait normaliser les données avant insertion", async () => {
      mockRequest.body = {
        nom: "  Dupont  ",
        prenom: "  Jean  ",
        email: "  TEST@EXAMPLE.COM  ",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        message: "OK",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      const callArgs =
        mockUtilisateursClient.inscriptionUtilisateurSimple.mock.calls[0][0];
      expect(callArgs.nom).toBe("Dupont");
      expect(callArgs.prenom).toBe("Jean");
      expect(callArgs.email).toBe("test@example.com");
    });

    it("devrait valider l'âge avant inscription", async () => {
      const today = new Date();
      const twoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate(),
      );

      mockRequest.body = {
        nom: "Dupont",
        prenom: "Bébé",
        email: "baby@test.com",
        password: "SecureP@ss123",
        date: twoYearsAgo.toISOString().split("T")[0],
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/âge/i),
        }),
      );
    });

    it("devrait valider le mot de passe avant inscription", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "weak",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer les erreurs d'insertion en base", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockRejectedValue(
        new Error("Database error"),
      );

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/erreur/i),
        }),
      );
    });

    it("devrait gérer le cas où isConfirm est false", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: false,
        message: "Erreur lors de l'insertion",
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        }),
      );
    });
  });

  // ==================== VALIDATION DES DONNÉES ====================
  describe("Validation des données - Intégration", () => {
    it("devrait rejeter les données incomplètes", async () => {
      mockRequest.body = {
        nom: "Dupont",
        // Manque prenom, email, etc.
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait valider le format de l'email", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "not-an-email",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait valider le format de la date", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "15/01/1990", // Format invalide
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait valider que l'abonnement est un entier positif", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: -1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait valider que le genre est un entier positif", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 0,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== SÉCURITÉ ====================
  describe("Sécurité - Intégration", () => {
    it("ne devrait pas exposer le mot de passe en cas d'erreur", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "MySecretP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockRejectedValue(
        new Error("Database error"),
      );

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      const responseData = JSON.stringify(jsonMock.mock.calls);
      expect(responseData).not.toContain("MySecretP@ss123");
    });

    it("devrait sanitizer les erreurs de base de données", async () => {
      mockRequest.body = {
        email: "test@example.com",
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockRejectedValue(
        new Error("SELECT * FROM users WHERE password = 'secret'"),
      );

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.message).not.toContain("SELECT");
      expect(callArgs.message).not.toContain("password");
    });

    it("devrait rejeter les tentatives d'injection SQL", async () => {
      mockRequest.body = {
        nom: "'; DROP TABLE users; --",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter les scripts XSS", async () => {
      mockRequest.body = {
        nom: "<script>alert('xss')</script>",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== FLUX D'INTÉGRATION COMPLET ====================
  describe("Flux complet - Intégration", () => {
    it("devrait suivre le flux complet d'inscription", async () => {
      const email = "complete@test.com";

      // 1. Vérification email
      mockRequest.body = { email };
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exists: false,
        }),
      );

      jest.clearAllMocks();

      // 2. Inscription
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: email,
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          userId: 1,
        }),
      );
    });

    it("devrait empêcher la double inscription", async () => {
      const email = "duplicate@test.com";

      // 1. Première inscription
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: email,
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(201);

      jest.clearAllMocks();

      // 2. Deuxième tentative
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: true, // Email existe maintenant
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
    });
  });

  // ==================== PERFORMANCE ====================
  describe("Performance - Intégration", () => {
    it("devrait limiter les appels à la base de données", async () => {
      mockRequest.body = {
        email: "invalid-email",
      };

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      // Ne devrait pas appeler la DB si la validation échoue
      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).not.toHaveBeenCalled();
    });

    it("devrait ne pas appeler la DB pour un mot de passe invalide", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "weak",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).not.toHaveBeenCalled();
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
    });

    it("devrait arrêter le traitement après détection d'email existant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "existing@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: true,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        inscriptionService,
      );

      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
    });
  });
});
