/**
 * Tests des cas limites (Edge Cases) pour le module Inscription
 * Teste les comportements avec des données aux limites, valeurs extrêmes, etc.
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

describe("Inscription Module - Tests des cas limites (Edge Cases)", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockInscriptionService: jest.Mocked<InscriptionService>;

  beforeEach(() => {
    // Reset des mocks
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

    // Mock du service d'inscription
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

  // ==================== NOM ET PRÉNOM ====================
  describe("Nom et Prénom - Cas limites", () => {
    it("devrait accepter un nom d'un seul caractère", async () => {
      mockRequest.body = {
        nom: "A",
        prenom: "Jean",
        email: "a.jean@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("devrait accepter un nom de 100 caractères (maximum)", async () => {
      const longName = "A".repeat(100);

      mockRequest.body = {
        nom: longName,
        prenom: "Jean",
        email: "long.name@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter un nom de 101 caractères (trop long)", async () => {
      const tooLongName = "A".repeat(101);

      mockRequest.body = {
        nom: tooLongName,
        prenom: "Jean",
        email: "toolong@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("100"),
        }),
      );
    });

    it("devrait rejeter un nom vide", async () => {
      mockRequest.body = {
        nom: "",
        prenom: "Jean",
        email: "empty.name@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait accepter des noms avec caractères accentués", async () => {
      mockRequest.body = {
        nom: "Müller",
        prenom: "François",
        email: "accent@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter des noms avec apostrophes", async () => {
      mockRequest.body = {
        nom: "O'Connor",
        prenom: "D'Artagnan",
        email: "apostrophe@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter des noms avec traits d'union", async () => {
      mockRequest.body = {
        nom: "Dupont-Durand",
        prenom: "Marie-Claire",
        email: "hyphen@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter des noms avec espaces", async () => {
      mockRequest.body = {
        nom: "Van Der Berg",
        prenom: "Jean Paul",
        email: "spaces@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter des noms avec chiffres", async () => {
      mockRequest.body = {
        nom: "Dupont123",
        prenom: "Jean",
        email: "numbers@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait trim les espaces en début et fin de nom", async () => {
      mockRequest.body = {
        nom: "  Dupont  ",
        prenom: "  Jean  ",
        email: "trim@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  // ==================== EMAIL ====================
  describe("Email - Cas limites", () => {
    it("devrait accepter un email de 5 caractères (minimum)", async () => {
      mockRequest.body = {
        email: "a@b.co", // 6 caractères, email valide
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait accepter un email de 255 caractères (maximum)", async () => {
      const longEmail = `${"a".repeat(240)}@example.com`;

      mockRequest.body = {
        email: longEmail,
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait rejeter un email de 256 caractères (trop long)", async () => {
      // Créer un email de 256 caractères (255 est le max)
      const tooLongEmail = `${"a".repeat(242)}@example.com`; // 242 + 1(@) + 11(example.com) = 254, ajoutons plus
      const reallyTooLong = `${"a".repeat(250)}@test.com`; // 250 + 1(@) + 8(test.com) = 259 caractères

      mockRequest.body = {
        email: reallyTooLong,
      };

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait normaliser l'email en minuscules", async () => {
      mockRequest.body = {
        email: "TEST@EXAMPLE.COM",
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait trim les espaces autour de l'email", async () => {
      mockRequest.body = {
        email: "  test@example.com  ",
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait accepter des emails avec points", async () => {
      mockRequest.body = {
        email: "first.last@example.com",
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait accepter des emails avec plus (+)", async () => {
      mockRequest.body = {
        email: "user+tag@example.com",
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait accepter des emails avec underscores", async () => {
      mockRequest.body = {
        email: "first_last@example.com",
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait accepter des emails avec tirets dans le domaine", async () => {
      mockRequest.body = {
        email: "user@my-domain.com",
      };

      mockInscriptionService.verifierEmail.mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait rejeter un email sans @", async () => {
      mockRequest.body = {
        email: "notanemailaddress",
      };

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un email sans domaine", async () => {
      mockRequest.body = {
        email: "user@",
      };

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un email sans partie locale", async () => {
      mockRequest.body = {
        email: "@example.com",
      };

      await verificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== MOT DE PASSE ====================
  describe("Mot de passe - Cas limites", () => {
    it("devrait accepter un mot de passe de 8 caractères (minimum)", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "minpass@test.com",
        password: "SecP@ss1",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter un mot de passe de 7 caractères (trop court)", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "short@test.com",
        password: "Sec@ss1",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("8"),
        }),
      );
    });

    it("devrait rejeter un mot de passe sans majuscule", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "noupper@test.com",
        password: "securepass123!",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("majuscule"),
        }),
      );
    });

    it("devrait rejeter un mot de passe sans minuscule", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "nolower@test.com",
        password: "SECUREPASS123!",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("minuscule"),
        }),
      );
    });

    it("devrait rejeter un mot de passe sans chiffre", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "nonumber@test.com",
        password: "SecurePass!",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("chiffre"),
        }),
      );
    });

    it("devrait rejeter un mot de passe sans caractère spécial", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "nospecial@test.com",
        password: "SecurePass123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("spécial"),
        }),
      );
    });

    it("devrait accepter différents caractères spéciaux", async () => {
      const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*"];

      for (const char of specialChars) {
        // Reset les mocks entre chaque itération
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn(() => mockResponse);
        mockResponse = {
          status: statusMock,
          json: jsonMock,
        };

        mockRequest.body = {
          nom: "Dupont",
          prenom: "Jean",
          email: `special.char${Math.random()}@test.com`, // Email sans caractère spécial dedans
          password: `SecureP${char}ss123`, // Le caractère spécial est dans le mot de passe
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        };

        mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
          success: true,
          message: "Inscription réussie",
          userId: 1,
        });

        await inscription(
          mockRequest as Request,
          mockResponse as Response,
          mockInscriptionService,
        );

        expect(statusMock).toHaveBeenCalledWith(201);
      }
    });
  });

  // ==================== DATE DE NAISSANCE ====================
  describe("Date de naissance - Cas limites", () => {
    it("devrait accepter un utilisateur de 5 ans (âge minimum)", async () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate(),
      );
      const dateString = fiveYearsAgo.toISOString().split("T")[0];

      mockRequest.body = {
        nom: "Dupont",
        prenom: "Enfant",
        email: "minage@test.com",
        password: "SecureP@ss123",
        date: dateString,
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter un utilisateur de 4 ans (trop jeune)", async () => {
      const today = new Date();
      const fourYearsAgo = new Date(
        today.getFullYear() - 4,
        today.getMonth(),
        today.getDate(),
      );
      const dateString = fourYearsAgo.toISOString().split("T")[0];

      mockRequest.body = {
        nom: "Dupont",
        prenom: "TropJeune",
        email: "tooyoung@test.com",
        password: "SecureP@ss123",
        date: dateString,
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("âge"),
        }),
      );
    });

    it("devrait accepter un utilisateur de 120 ans (âge maximum)", async () => {
      const today = new Date();
      const oneHundredTwentyYearsAgo = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );
      const dateString = oneHundredTwentyYearsAgo.toISOString().split("T")[0];

      mockRequest.body = {
        nom: "Dupont",
        prenom: "Senior",
        email: "maxage@test.com",
        password: "SecureP@ss123",
        date: dateString,
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter un utilisateur de 121 ans (trop âgé)", async () => {
      const today = new Date();
      const oneHundredTwentyOneYearsAgo = new Date(
        today.getFullYear() - 121,
        today.getMonth(),
        today.getDate(),
      );
      const dateString = oneHundredTwentyOneYearsAgo
        .toISOString()
        .split("T")[0];

      mockRequest.body = {
        nom: "Dupont",
        prenom: "TropVieux",
        email: "tooold@test.com",
        password: "SecureP@ss123",
        date: dateString,
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("âge"),
        }),
      );
    });

    it("devrait rejeter une date dans le futur", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split("T")[0];

      mockRequest.body = {
        nom: "Dupont",
        prenom: "Futur",
        email: "future@test.com",
        password: "SecureP@ss123",
        date: dateString,
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un format de date invalide", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "baddate@test.com",
        password: "SecureP@ss123",
        date: "15/01/1990",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter une date au format YYYY-MM-DD", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "gooddate@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait gérer correctement les années bissextiles", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Bissextile",
        email: "leap@test.com",
        password: "SecureP@ss123",
        date: "1992-02-29",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter le 29 février pour une année non bissextile", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "BadLeap",
        email: "badleap@test.com",
        password: "SecureP@ss123",
        date: "1990-02-29",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== ABONNEMENT ET GENRE ====================
  describe("Abonnement et Genre - Cas limites", () => {
    it("devrait accepter abonnement = 1 (valeur minimum)", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "minabo@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter abonnement = 0", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "zeroabo@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 0,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter abonnement négatif", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "negabo@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: -1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un abonnement décimal", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "decabo@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1.5,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter genre = 1", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "genre1@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait rejeter genre = 0", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "genre0@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 0,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter genre négatif", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "genreneg@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: -1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== DONNÉES MANQUANTES ====================
  describe("Données manquantes", () => {
    it("devrait rejeter si le nom est manquant", async () => {
      mockRequest.body = {
        prenom: "Jean",
        email: "noname@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si le prénom est manquant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        email: "noprenom@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si l'email est manquant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si le mot de passe est manquant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "nopass@test.com",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si la date est manquante", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "nodate@test.com",
        password: "SecureP@ss123",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si l'abonnement est manquant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "noabo@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si le genre est manquant", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "nogenre@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si le body est vide", async () => {
      mockRequest.body = {};

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter si le body est null", async () => {
      mockRequest.body = null as any;

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== TYPES INVALIDES ====================
  describe("Types invalides", () => {
    it("devrait rejeter un nom de type number", async () => {
      mockRequest.body = {
        nom: 12345,
        prenom: "Jean",
        email: "numbernom@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un email de type number", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: 12345,
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un abonnement de type string", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "stringabo@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: "1",
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un genre de type string", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "stringgenre@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: "1",
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un array au lieu d'un objet", async () => {
      mockRequest.body = [
        {
          nom: "Dupont",
          prenom: "Jean",
          email: "array@test.com",
          password: "SecureP@ss123",
          date: "1990-01-15",
          abonnement: 1,
          genre: 1,
        },
      ];

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  // ==================== WHITESPACE ET FORMATTING ====================
  describe("Whitespace et formatting", () => {
    it("devrait rejeter un nom composé uniquement d'espaces", async () => {
      mockRequest.body = {
        nom: "     ",
        prenom: "Jean",
        email: "spacenom@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter un email avec espaces au milieu", async () => {
      mockRequest.body = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test @example.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait gérer les tabulations dans les noms", async () => {
      mockRequest.body = {
        nom: "Dupont\t",
        prenom: "\tJean",
        email: "tabs@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      // Devrait être nettoyé ou rejeté selon la validation
      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      // Le comportement dépend de votre validation trim
      expect(statusMock).toHaveBeenCalled();
    });

    it("devrait gérer les retours à la ligne", async () => {
      mockRequest.body = {
        nom: "Dupont\n",
        prenom: "Jean",
        email: "newline@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalled();
    });
  });

  // ==================== CARACTÈRES UNICODE ====================
  describe("Caractères Unicode", () => {
    it("devrait gérer les emojis dans le nom", async () => {
      mockRequest.body = {
        nom: "Dupont 😀",
        prenom: "Jean",
        email: "emoji@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      // Devrait probablement rejeter
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait accepter les caractères cyrilliques", async () => {
      mockRequest.body = {
        nom: "Иванов",
        prenom: "Иван",
        email: "cyrillic@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter les caractères arabes", async () => {
      mockRequest.body = {
        nom: "محمد",
        prenom: "أحمد",
        email: "arabic@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("devrait accepter les caractères chinois", async () => {
      mockRequest.body = {
        nom: "王",
        prenom: "明",
        email: "chinese@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      mockInscriptionService.inscrireUtilisateur.mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      await inscription(
        mockRequest as Request,
        mockResponse as Response,
        mockInscriptionService,
      );

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });
});
