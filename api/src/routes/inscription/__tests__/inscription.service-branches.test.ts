/**
 * Tests de couverture des branches pour InscriptionService
 * Teste tous les chemins d'exécution et cas limites du service
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

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

import { InscriptionService } from "../core/services/inscription.service.js";
import { Utilisateurs } from "../../../db/clients/utilisateurs/utilisateurs.js";
import bcrypt from "bcrypt";

// Mock du client Utilisateurs
jest.mock("../../../db/clients/utilisateurs/utilisateurs.js");

describe("InscriptionService - Tests de couverture des branches", () => {
  let inscriptionService: InscriptionService;
  let mockUtilisateursClient: jest.Mocked<Utilisateurs>;

  beforeEach(() => {
    mockUtilisateursClient = {
      checkUtilisateurByEmail: jest.fn(),
      inscriptionUtilisateurSimple: jest.fn(),
      getUtilisateurByEmail: jest.fn(),
    } as any;

    inscriptionService = new InscriptionService(mockUtilisateursClient);

    jest.clearAllMocks();
  });

  // ==================== VÉRIFICATION EMAIL ====================
  describe("verifierEmail - Couverture des branches", () => {
    it("branche: email existe (isFind = true)", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: true,
      });

      const result =
        await inscriptionService.verifierEmail("existing@test.com");

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Cet email est déjà utilisé");
    });

    it("branche: email n'existe pas (isFind = false)", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      const result = await inscriptionService.verifierEmail("new@test.com");

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Email disponible");
    });

    it("branche: erreur lors de la vérification", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        inscriptionService.verifierEmail("test@test.com"),
      ).rejects.toThrow("Erreur lors de la vérification de l'email");
    });

    it("branche: erreur réseau (timeout)", async () => {
      const timeoutError = new Error("ETIMEDOUT") as any;
      timeoutError.code = "ETIMEDOUT";
      mockUtilisateursClient.checkUtilisateurByEmail.mockRejectedValue(
        timeoutError,
      );

      await expect(
        inscriptionService.verifierEmail("test@test.com"),
      ).rejects.toThrow();
    });

    it("branche: erreur de connexion", async () => {
      const connError = new Error("ECONNREFUSED") as any;
      connError.code = "ECONNREFUSED";
      mockUtilisateursClient.checkUtilisateurByEmail.mockRejectedValue(
        connError,
      );

      await expect(
        inscriptionService.verifierEmail("test@test.com"),
      ).rejects.toThrow();
    });
  });

  // ==================== HASHAGE MOT DE PASSE ====================
  describe("hashPassword - Couverture des branches", () => {
    it("branche: hashage réussi", async () => {
      const password = "SecureP@ss123";

      const hashed = await inscriptionService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toMatch(/^\$2[aby]\$/);
    });

    it("branche: mot de passe court", async () => {
      const password = "Short1!";

      const hashed = await inscriptionService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
    });

    it("branche: mot de passe long", async () => {
      const password = "A".repeat(100) + "Secur3P@ss123";

      const hashed = await inscriptionService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
    });

    it("branche: mot de passe avec caractères spéciaux", async () => {
      const password = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?";

      const hashed = await inscriptionService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
    });

    it("branche: mot de passe avec Unicode", async () => {
      const password = "Sécùré€Pàss123!";

      const hashed = await inscriptionService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
    });

    it("branche: erreur lors du hashage (bcrypt)", async () => {
      // Mock bcrypt pour simuler une erreur
      jest
        .spyOn(bcrypt, "hash")
        .mockRejectedValueOnce(new Error("Bcrypt error"));

      await expect(inscriptionService.hashPassword("test123")).rejects.toThrow(
        "Erreur lors du traitement du mot de passe",
      );
    });
  });

  // ==================== VALIDATION ÂGE ====================
  describe("validerAge - Couverture des branches", () => {
    it("branche: âge valide (entre 5 et 120 ans)", () => {
      const result = inscriptionService.validerAge("1990-01-15");

      expect(result).toBe(true);
    });

    it("branche: âge minimum exact (5 ans)", () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionService.validerAge(
        fiveYearsAgo.toISOString().split("T")[0],
      );

      expect(result).toBe(true);
    });

    it("branche: âge maximum exact (120 ans)", () => {
      const today = new Date();
      const oneHundredTwentyYearsAgo = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionService.validerAge(
        oneHundredTwentyYearsAgo.toISOString().split("T")[0],
      );

      expect(result).toBe(true);
    });

    it("branche: âge trop jeune (< 5 ans)", () => {
      const today = new Date();
      const threeYearsAgo = new Date(
        today.getFullYear() - 3,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionService.validerAge(
        threeYearsAgo.toISOString().split("T")[0],
      );

      expect(result).toBe(false);
    });

    it("branche: âge trop vieux (> 120 ans)", () => {
      const today = new Date();
      const tooOld = new Date(
        today.getFullYear() - 150,
        today.getMonth(),
        today.getDate(),
      );

      const result = inscriptionService.validerAge(
        tooOld.toISOString().split("T")[0],
      );

      expect(result).toBe(false);
    });

    it("branche: anniversaire pas encore passé cette année (ajustement -1)", () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 10,
        today.getMonth() + 1, // Mois suivant
        today.getDate(),
      );

      const result = inscriptionService.validerAge(
        birthDate.toISOString().split("T")[0],
      );

      expect(result).toBe(true);
    });

    it("branche: même mois mais jour futur (ajustement -1)", () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 10,
        today.getMonth(),
        today.getDate() + 1,
      );

      const result = inscriptionService.validerAge(
        birthDate.toISOString().split("T")[0],
      );

      expect(result).toBe(true);
    });

    it("branche: date invalide (exception)", () => {
      const result = inscriptionService.validerAge("invalid-date");

      expect(result).toBe(false);
    });

    it("branche: date vide", () => {
      const result = inscriptionService.validerAge("");

      expect(result).toBe(false);
    });

    it("branche: format de date incorrect", () => {
      const result = inscriptionService.validerAge("15/01/1990");

      expect(result).toBe(false);
    });

    it("branche: année bissextile (29 février)", () => {
      const result = inscriptionService.validerAge("1992-02-29");

      expect(result).toBe(true);
    });

    it("branche: 29 février année non bissextile", () => {
      const result = inscriptionService.validerAge("1990-02-29");

      expect(result).toBe(false);
    });
  });

  // ==================== INSCRIPTION UTILISATEUR ====================
  describe("inscrireUtilisateur - Couverture des branches", () => {
    const validData = {
      nom: "Dupont",
      prenom: "Jean",
      email: "test@example.com",
      password: "SecureP@ss123",
      date: "1990-01-15",
      abonnement: 1,
      genre: 1,
    };

    it("branche: inscription réussie (chemin complet)", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        message: "Inscription réussie",
        userId: 42,
      });

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Inscription réussie");
      expect(result.userId).toBe(42);
    });

    it("branche: email existe déjà (arrêt précoce)", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: true,
      });

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Un compte avec cet email existe déjà");
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
    });

    it("branche: âge invalide (< 5 ans)", async () => {
      const today = new Date();
      const twoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate(),
      );

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      const result = await inscriptionService.inscrireUtilisateur({
        ...validData,
        date: twoYearsAgo.toISOString().split("T")[0],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("L'âge doit être entre 5 et 120 ans");
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
    });

    it("branche: âge invalide (> 120 ans)", async () => {
      const today = new Date();
      const tooOld = new Date(
        today.getFullYear() - 150,
        today.getMonth(),
        today.getDate(),
      );

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      const result = await inscriptionService.inscrireUtilisateur({
        ...validData,
        date: tooOld.toISOString().split("T")[0],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("L'âge doit être entre 5 et 120 ans");
    });

    it("branche: isConfirm = false (échec insertion)", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: false,
        message: "Erreur d'insertion",
      });

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Erreur d'insertion");
    });

    it("branche: isConfirm = false sans message", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: false,
      });

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Erreur lors de l'inscription");
    });

    it("branche: isConfirm = true sans message personnalisé", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        userId: 1,
      });

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Inscription réussie");
    });

    it("branche: erreur lors de la vérification email", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Une erreur est survenue lors de l'inscription",
      );
    });

    it("branche: erreur lors du hashage", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      jest
        .spyOn(bcrypt, "hash")
        .mockRejectedValueOnce(new Error("Bcrypt error"));

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Une erreur est survenue lors de l'inscription",
      );
    });

    it("branche: erreur lors de l'insertion DB", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockRejectedValue(
        new Error("Insert failed"),
      );

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Une erreur est survenue lors de l'inscription",
      );
    });

    it("branche: exception générique (catch)", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockImplementation(() => {
        throw new TypeError("Unexpected error");
      });

      const result = await inscriptionService.inscrireUtilisateur(validData);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Une erreur est survenue lors de l'inscription",
      );
    });
  });

  // ==================== ÉVALUATION FORCE MOT DE PASSE ====================
  describe("evaluerForceMotDePasse - Couverture des branches", () => {
    it("branche: mot de passe très faible (score 0)", () => {
      const score = inscriptionService.evaluerForceMotDePasse("abc");

      expect(score).toBe(0);
    });

    it("branche: longueur >= 8 (score +1)", () => {
      const score = inscriptionService.evaluerForceMotDePasse("abcdefgh");

      expect(score).toBeGreaterThanOrEqual(1);
    });

    it("branche: longueur >= 12 (score +2)", () => {
      const score = inscriptionService.evaluerForceMotDePasse("abcdefghijkl");

      expect(score).toBeGreaterThanOrEqual(2);
    });

    it("branche: minuscules + majuscules (score +1)", () => {
      const score = inscriptionService.evaluerForceMotDePasse("AbcDefgh");

      expect(score).toBeGreaterThanOrEqual(2);
    });

    it("branche: contient chiffres (score +1)", () => {
      const score = inscriptionService.evaluerForceMotDePasse("Abcdefgh123");

      expect(score).toBeGreaterThanOrEqual(3);
    });

    it("branche: contient caractères spéciaux (score +1)", () => {
      const score = inscriptionService.evaluerForceMotDePasse("Abcdefgh123!");

      expect(score).toBeGreaterThanOrEqual(4);
    });

    it("branche: score maximum (4)", () => {
      const score = inscriptionService.evaluerForceMotDePasse(
        "SuperSecureP@ssw0rd123!",
      );

      expect(score).toBe(4);
    });

    it("branche: score plafonné à 4 (Math.min)", () => {
      // Un mot de passe qui pourrait dépasser 4
      const score = inscriptionService.evaluerForceMotDePasse(
        "SuperComplexP@ssw0rd123!WithManyCharacters",
      );

      expect(score).toBe(4);
      expect(score).toBeLessThanOrEqual(4);
    });

    it("branche: seulement minuscules", () => {
      const score = inscriptionService.evaluerForceMotDePasse("abcdefghij");

      expect(score).toBeLessThan(3);
    });

    it("branche: seulement majuscules", () => {
      const score = inscriptionService.evaluerForceMotDePasse("ABCDEFGHIJ");

      expect(score).toBeLessThan(3);
    });

    it("branche: seulement chiffres", () => {
      const score = inscriptionService.evaluerForceMotDePasse("1234567890");

      expect(score).toBeLessThan(3);
    });

    it("branche: mélange sans spéciaux", () => {
      const score = inscriptionService.evaluerForceMotDePasse("Abcd1234");

      expect(score).toBe(3);
    });
  });

  // ==================== SANITIZE USER DATA ====================
  describe("sanitizeUserData - Couverture des branches", () => {
    it("branche: objet avec password", () => {
      const user = {
        id: 1,
        nom: "Dupont",
        email: "test@test.com",
        password: "hashed_password",
      };

      const sanitized = inscriptionService.sanitizeUserData(user);

      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).toHaveProperty("id");
      expect(sanitized).toHaveProperty("nom");
      expect(sanitized).toHaveProperty("email");
    });

    it("branche: objet sans password", () => {
      const user = {
        id: 1,
        nom: "Dupont",
        email: "test@test.com",
      };

      const sanitized = inscriptionService.sanitizeUserData(user);

      expect(sanitized).toEqual(user);
    });

    it("branche: objet vide", () => {
      const user = {};

      const sanitized = inscriptionService.sanitizeUserData(user);

      expect(sanitized).toEqual({});
    });

    it("branche: objet avec plusieurs propriétés", () => {
      const user = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "test@test.com",
        password: "secret",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      };

      const sanitized = inscriptionService.sanitizeUserData(user);

      expect(sanitized).not.toHaveProperty("password");
      expect(Object.keys(sanitized).length).toBe(Object.keys(user).length - 1);
    });

    it("branche: objet null", () => {
      const sanitized = inscriptionService.sanitizeUserData(null);

      expect(sanitized).toBeDefined();
    });

    it("branche: objet undefined", () => {
      const sanitized = inscriptionService.sanitizeUserData(undefined);

      expect(sanitized).toBeDefined();
    });
  });

  // ==================== INTÉGRATION DES BRANCHES ====================
  describe("Flux complets - Couverture des chemins d'exécution", () => {
    it("chemin: vérification OK → inscription OK", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple.mockResolvedValue({
        isConfirm: true,
        message: "OK",
        userId: 1,
      });

      const verif = await inscriptionService.verifierEmail("new@test.com");
      expect(verif.exists).toBe(false);

      const inscription = await inscriptionService.inscrireUtilisateur({
        nom: "Test",
        prenom: "User",
        email: "new@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      });

      expect(inscription.success).toBe(true);
    });

    it("chemin: vérification KO → inscription bloquée", async () => {
      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: true,
      });

      const verif = await inscriptionService.verifierEmail("existing@test.com");
      expect(verif.exists).toBe(true);

      const inscription = await inscriptionService.inscrireUtilisateur({
        nom: "Test",
        prenom: "User",
        email: "existing@test.com",
        password: "SecureP@ss123",
        date: "1990-01-15",
        abonnement: 1,
        genre: 1,
      });

      expect(inscription.success).toBe(false);
    });

    it("chemin: âge invalide → arrêt avant hashage", async () => {
      const today = new Date();
      const invalidDate = new Date(
        today.getFullYear() - 3,
        today.getMonth(),
        today.getDate(),
      );

      mockUtilisateursClient.checkUtilisateurByEmail.mockResolvedValue({
        isFind: false,
      });

      const hashSpy = jest.spyOn(inscriptionService, "hashPassword");

      const result = await inscriptionService.inscrireUtilisateur({
        nom: "Test",
        prenom: "User",
        email: "young@test.com",
        password: "SecureP@ss123",
        date: invalidDate.toISOString().split("T")[0],
        abonnement: 1,
        genre: 1,
      });

      expect(result.success).toBe(false);
      expect(hashSpy).not.toHaveBeenCalled();
    });
  });
});
