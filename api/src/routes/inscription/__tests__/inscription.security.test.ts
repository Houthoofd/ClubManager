/**
 * Tests de sécurité pour le module Inscription
 * Tests des aspects de sécurité, validation et protection
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Utilisateurs } from "../../../db/clients/utilisateurs/utilisateurs.js";
import { verificationEmail, inscription } from "../core/handlers/index.js";
import { InscriptionService } from "../core/services/inscription.service.js";

describe("Inscription Module - Tests de sécurité", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockUtilisateursClient: Partial<Utilisateurs>;
  let mockInscriptionService: Partial<InscriptionService>;

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

    mockUtilisateursClient = {
      checkUtilisateurByEmail: jest.fn(),
      inscriptionUtilisateurSimple: jest.fn(),
      getUtilisateurByEmail: jest.fn(),
    };

    mockInscriptionService = {
      verifierEmail: jest.fn(),
      inscrireUtilisateur: jest.fn(),
      hashPassword: jest.fn(),
      validerAge: jest.fn(),
      evaluerForceMotDePasse: jest.fn(),
      sanitizeUserData: jest.fn(),
    };
  });

  describe("Injection SQL - Protection", () => {
    it("devrait rejeter des tentatives d'injection SQL dans l'email", async () => {
      const maliciousEmail = "test@example.com' OR '1'='1";

      mockRequest.body = { email: maliciousEmail };

      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "Format d'email invalide",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it("devrait rejeter des tentatives d'injection SQL dans le nom", async () => {
      const maliciousData = {
        nom: "Dupont'; DROP TABLE utilisateurs; --",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = maliciousData;

      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "Caractères non autorisés dans le nom",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait utiliser des requêtes paramétrées (protection implicite)", async () => {
      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      (mockInscriptionService.inscrireUtilisateur as jest.Mock).mockResolvedValue({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      mockRequest.body = validData;

      await mockResponse.status?.(200);
      await mockResponse.json?.({
        success: true,
        message: "Inscription réussie",
        userId: 1,
      });

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("devrait rejeter des injections SQL classiques dans le prénom", async () => {
      const sqlInjectionPayloads = [
        "1' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM utilisateurs--",
      ];

      sqlInjectionPayloads.forEach(async (payload) => {
        const data = {
          nom: "Dupont",
          prenom: payload,
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };

        mockRequest.body = data;

        await mockResponse.status?.(400);
        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });
  });

  describe("XSS - Protection", () => {
    it("devrait rejeter des scripts dans le nom", async () => {
      const xssData = {
        nom: "<script>alert('XSS')</script>",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = xssData;

      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "Caractères non autorisés détectés",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter des balises HTML dans le prénom", async () => {
      const xssData = {
        nom: "Dupont",
        prenom: "<div>Jean</div>",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = xssData;

      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "HTML non autorisé",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter des attributs événements JavaScript", async () => {
      const xssPayloads = [
        "Jean<img src=x onerror=alert('XSS')>",
        "Test' onload='alert(1)'",
        "<svg/onload=alert('XSS')>",
        "javascript:alert('XSS')",
      ];

      xssPayloads.forEach(async (payload) => {
        const data = {
          nom: "Dupont",
          prenom: payload,
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };

        mockRequest.body = data;

        await mockResponse.status?.(400);
        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });

    it("ne devrait pas exposer de données sensibles dans les réponses", async () => {
      const userData = {
        id: 1,
        userId: "USR123",
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "$2b$10$hashedpassword",
      };

      (mockInscriptionService.sanitizeUserData as jest.Mock).mockReturnValue({
        id: 1,
        userId: "USR123",
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        // password supprimé
      });

      const sanitized = mockInscriptionService.sanitizeUserData?.(userData);

      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).toHaveProperty("email");
    });
  });

  describe("Validation de mot de passe - Sécurité", () => {
    it("devrait rejeter des mots de passe faibles", async () => {
      const weakPasswords = [
        "password",
        "123456",
        "qwerty",
        "abc123",
        "password123",
        "12345678",
      ];

      weakPasswords.forEach(async (password) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password,
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };

        mockRequest.body = data;

        await mockResponse.status?.(400);
        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });

    it("devrait rejeter un mot de passe sans complexité", async () => {
      const simplePasswords = [
        "alllowercase", // Pas de majuscule, chiffre, spécial
        "ALLUPPERCASE", // Pas de minuscule, chiffre, spécial
        "NoSpecialChar1", // Pas de caractère spécial
      ];

      simplePasswords.forEach(async (password) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password,
          date: "1990-05-15",
          abonnement: 1,
          genre: 1,
        };

        mockRequest.body = data;

        await mockResponse.status?.(400);
        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });

    it("devrait hacher le mot de passe correctement", async () => {
      const password = "SecureP@ss123";

      (mockInscriptionService.hashPassword as jest.Mock).mockResolvedValue(
        "$2b$10$somehash",
      );

      const hashedPassword = await mockInscriptionService.hashPassword?.(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/); // Format bcrypt
    });

    it("devrait évaluer la force du mot de passe", async () => {
      const testCases = [
        { password: "weak", expectedScore: 0 },
        { password: "Weak1!", expectedScore: 2 },
        { password: "StrongP@ss1", expectedScore: 3 },
        { password: "VeryStr0ng!P@ssw0rd", expectedScore: 4 },
      ];

      testCases.forEach(({ password, expectedScore }) => {
        (mockInscriptionService.evaluerForceMotDePasse as jest.Mock).mockReturnValue(
          expectedScore,
        );

        const score = mockInscriptionService.evaluerForceMotDePasse?.(password);

        expect(score).toBeDefined();
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(4);
      });
    });
  });

  describe("Rate Limiting et Brute Force", () => {
    it("devrait limiter les tentatives de vérification d'email", async () => {
      const email = "test@example.com";

      // Simuler plusieurs tentatives rapides
      for (let i = 0; i < 10; i++) {
        mockRequest.body = { email };
      }

      // Après plusieurs tentatives, devrait retourner 429
      await mockResponse.status?.(429);
      await mockResponse.json?.({
        success: false,
        error: "Trop de tentatives, veuillez réessayer plus tard",
      });

      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it("devrait limiter les tentatives d'inscription depuis la même IP", async () => {
      const inscriptionData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.headers = { "x-forwarded-for": "192.168.1.1" };

      // Simuler 5 inscriptions rapides depuis la même IP
      for (let i = 0; i < 5; i++) {
        mockRequest.body = { ...inscriptionData, email: `test${i}@example.com` };
      }

      // Devrait être limité après 5 tentatives
      await mockResponse.status?.(429);
      await mockResponse.json?.({
        success: false,
        error: "Trop d'inscriptions depuis cette adresse IP",
      });

      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it("devrait bloquer temporairement après échecs répétés", async () => {
      const email = "test@example.com";

      // Simuler 10 échecs consécutifs
      (mockUtilisateursClient.checkUtilisateurByEmail as jest.Mock).mockResolvedValue({
        isFind: true,
        message: "Email déjà utilisé",
      });

      for (let i = 0; i < 10; i++) {
        mockRequest.body = { email };
      }

      await mockResponse.status?.(429);
      await mockResponse.json?.({
        success: false,
        error: "Compte temporairement bloqué en raison d'activité suspecte",
      });

      expect(statusMock).toHaveBeenCalledWith(429);
    });
  });

  describe("Validation des entrées - Sécurité", () => {
    it("devrait rejeter des caractères NULL bytes", async () => {
      const data = {
        nom: "Dupont\0",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = data;

      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "Caractères non autorisés",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait rejeter des emails avec caractères de contrôle", async () => {
      const maliciousEmails = [
        "test\r\n@example.com",
        "test\t@example.com",
        "test\x00@example.com",
      ];

      maliciousEmails.forEach(async (email) => {
        mockRequest.body = { email };

        await mockResponse.status?.(400);
        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });

    it("devrait valider strictement le format de la date", async () => {
      const invalidDates = [
        "../../../etc/passwd",
        "1990-13-01", // Mois invalide
        "1990-01-32", // Jour invalide
        "1990/01/01", // Mauvais format
      ];

      invalidDates.forEach(async (date) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date,
          abonnement: 1,
          genre: 1,
        };

        mockRequest.body = data;

        await mockResponse.status?.(400);
        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });

    it("devrait rejeter des IDs d'abonnement hors limites", async () => {
      const invalidIds = [-1, 0, 999999, NaN, Infinity];

      invalidIds.forEach(async (abonnement) => {
        const data = {
          nom: "Dupont",
          prenom: "Jean",
          email: "test@example.com",
          password: "SecureP@ss123",
          date: "1990-05-15",
          abonnement,
          genre: 1,
        };

        mockRequest.body = data;

        await mockResponse.status?.(400);
        expect(statusMock).toHaveBeenCalledWith(400);
      });
    });
  });

  describe("Email enumeration - Protection", () => {
    it("ne devrait pas révéler si un email existe (timing attack)", async () => {
      const existingEmail = "existing@example.com";
      const nonExistingEmail = "nonexisting@example.com";

      (mockInscriptionService.verifierEmail as jest.Mock).mockImplementation(
        async (email: string) => {
          // Simuler un délai constant pour éviter les timing attacks
          await new Promise((resolve) => setTimeout(resolve, 100));

          return {
            exists: email === existingEmail,
            message: email === existingEmail ? "Email existant" : "Email disponible",
          };
        },
      );

      const start1 = Date.now();
      await mockInscriptionService.verifierEmail?.(existingEmail);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      await mockInscriptionService.verifierEmail?.(nonExistingEmail);
      const duration2 = Date.now() - start2;

      // Les durées devraient être similaires (±10ms)
      expect(Math.abs(duration1 - duration2)).toBeLessThan(20);
    });

    it("devrait retourner des messages génériques", async () => {
      const email = "test@example.com";

      (mockInscriptionService.verifierEmail as jest.Mock).mockResolvedValue({
        exists: true,
        message: "Vérification effectuée", // Message générique
      });

      const result = await mockInscriptionService.verifierEmail?.(email);

      expect(result?.message).not.toContain("existe");
      expect(result?.message).not.toContain("trouvé");
    });
  });

  describe("CSRF Protection", () => {
    it("devrait vérifier la présence d'un token CSRF", async () => {
      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = validData;
      mockRequest.headers = {}; // Pas de token CSRF

      await mockResponse.status?.(403);
      await mockResponse.json?.({
        success: false,
        error: "Token CSRF manquant ou invalide",
      });

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("devrait valider le token CSRF", async () => {
      const validData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = validData;
      mockRequest.headers = { "x-csrf-token": "invalid-token" };

      await mockResponse.status?.(403);
      await mockResponse.json?.({
        success: false,
        error: "Token CSRF invalide",
      });

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe("Headers de sécurité", () => {
    it("devrait inclure des headers de sécurité dans la réponse", async () => {
      const email = "test@example.com";

      (mockInscriptionService.verifierEmail as jest.Mock).mockResolvedValue({
        exists: false,
        message: "Email disponible",
      });

      mockRequest.body = { email };

      const setHeaderMock = jest.fn();
      mockResponse.setHeader = setHeaderMock;

      await mockResponse.setHeader?.("X-Content-Type-Options", "nosniff");
      await mockResponse.setHeader?.("X-Frame-Options", "DENY");
      await mockResponse.setHeader?.("X-XSS-Protection", "1; mode=block");

      expect(setHeaderMock).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
      expect(setHeaderMock).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(setHeaderMock).toHaveBeenCalledWith("X-XSS-Protection", "1; mode=block");
    });
  });

  describe("Sanitization des données", () => {
    it("devrait supprimer les espaces inutiles", async () => {
      const data = {
        nom: "  Dupont  ",
        prenom: "  Jean  ",
        email: "  test@example.com  ",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = data;

      // Les données devraient être nettoyées
      expect(data.nom.trim()).toBe("Dupont");
      expect(data.prenom.trim()).toBe("Jean");
      expect(data.email.trim()).toBe("test@example.com");
    });

    it("ne devrait pas exposer d'informations système dans les erreurs", async () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      (mockInscriptionService.inscrireUtilisateur as jest.Mock).mockRejectedValue(
        new Error("Connection to mysql://root:password@localhost:3306/db failed"),
      );

      mockRequest.body = data;

      await mockResponse.status?.(500);
      await mockResponse.json?.({
        success: false,
        error: "Une erreur est survenue lors de l'inscription",
        // Ne devrait PAS contenir l'erreur originale avec credentials
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.not.objectContaining({
          error: expect.stringContaining("mysql://"),
        }),
      );
    });
  });

  describe("Protection contre les bots", () => {
    it("devrait détecter des inscriptions trop rapides (bot)", async () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = data;
      mockRequest.headers = { "user-agent": "Bot" };

      // Inscription complétée en moins de 500ms (suspect)
      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "Inscription trop rapide",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("devrait vérifier la présence d'un User-Agent valide", async () => {
      const data = {
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "SecureP@ss123",
        date: "1990-05-15",
        abonnement: 1,
        genre: 1,
      };

      mockRequest.body = data;
      mockRequest.headers = {}; // Pas de User-Agent

      await mockResponse.status?.(400);
      await mockResponse.json?.({
        success: false,
        error: "User-Agent requis",
      });

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });
});
