/**
 * Tests unitaires du service Inscription
 * Teste la logique métier d'inscription
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

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

// Mock du client Utilisateurs
jest.mock("../../../db/clients/utilisateurs/utilisateurs.js");

import { InscriptionService } from "../core/services/inscription.service.js";
import { Utilisateurs } from "../../../db/clients/utilisateurs/utilisateurs.js";
import type { InscriptionData } from "@clubmanager/types/validators";
import bcrypt from "bcrypt";

// Mock de bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("InscriptionService - Tests unitaires", () => {
  let service: InscriptionService;
  let mockUtilisateursClient: jest.Mocked<Utilisateurs>;

  const validInscriptionData: InscriptionData = {
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@example.com",
    password: "SecureP@ss123",
    date: "1990-01-15",
    abonnement: 1,
    genre: 1,
  };

  beforeEach(() => {
    // Créer un mock du client Utilisateurs avec toutes les méthodes nécessaires
    mockUtilisateursClient = {
      checkUtilisateurByEmail: jest.fn(),
      inscriptionUtilisateurSimple: jest.fn(),
      query: jest.fn(),
    } as any as jest.Mocked<Utilisateurs>;

    service = new InscriptionService(mockUtilisateursClient);

    // Réinitialiser tous les mocks
    jest.clearAllMocks();

    // Configurer le mock bcrypt par défaut
    (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$mockedHash");
  });

  // ==================== VERIFICATION EMAIL ====================
  describe("verifierEmail", () => {
    it("devrait retourner exists=false si l'email n'existe pas", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });

      // Act
      const result = await service.verifierEmail("test@example.com");

      // Assert
      expect(result.exists).toBe(false);
      expect(result.message).toBe("Email disponible");
      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledWith("test@example.com");
    });

    it("devrait retourner exists=true si l'email existe déjà", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: true });

      // Act
      const result = await service.verifierEmail("existing@example.com");

      // Assert
      expect(result.exists).toBe(true);
      expect(result.message).toBe("Cet email est déjà utilisé");
    });

    it("devrait lancer une erreur si la vérification échoue", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(service.verifierEmail("test@example.com")).rejects.toThrow(
        "Erreur lors de la vérification de l'email",
      );
    });

    it("devrait appeler le client avec le bon email", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });

      // Act
      await service.verifierEmail("specific@example.com");

      // Assert
      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledWith("specific@example.com");
      expect(
        mockUtilisateursClient.checkUtilisateurByEmail,
      ).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== HASH PASSWORD ====================
  describe("hashPassword", () => {
    it("devrait hasher le mot de passe avec bcrypt", async () => {
      // Arrange
      const password = "SecurePassword123!";
      const hashedPassword = "$2b$10$hashedPassword";
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Act
      const result = await service.hashPassword(password);

      // Assert
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it("devrait utiliser 10 rounds de salt", async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      // Act
      await service.hashPassword("password");

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
    });

    it("devrait lancer une erreur si le hashage échoue", async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Bcrypt error"));

      // Act & Assert
      await expect(service.hashPassword("password")).rejects.toThrow(
        "Erreur lors du traitement du mot de passe",
      );
    });

    it("devrait hasher des mots de passe différents différemment", async () => {
      // Arrange
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce("hash1")
        .mockResolvedValueOnce("hash2");

      // Act
      const hash1 = await service.hashPassword("password1");
      const hash2 = await service.hashPassword("password2");

      // Assert
      expect(hash1).not.toBe(hash2);
    });
  });

  // ==================== VALIDER AGE ====================
  describe("validerAge", () => {
    it("devrait accepter un âge valide (18 ans)", () => {
      // Arrange
      const date18YearsAgo = new Date();
      date18YearsAgo.setFullYear(date18YearsAgo.getFullYear() - 18);
      const dateStr = date18YearsAgo.toISOString().split("T")[0];

      // Act
      const result = service.validerAge(dateStr);

      // Assert
      expect(result).toBe(true);
    });

    it("devrait accepter un âge minimum (5 ans)", () => {
      // Arrange
      const date5YearsAgo = new Date();
      date5YearsAgo.setFullYear(date5YearsAgo.getFullYear() - 5);
      date5YearsAgo.setDate(date5YearsAgo.getDate() - 1);
      const dateStr = date5YearsAgo.toISOString().split("T")[0];

      // Act
      const result = service.validerAge(dateStr);

      // Assert
      expect(result).toBe(true);
    });

    it("devrait accepter un âge maximum (120 ans)", () => {
      // Arrange
      const date120YearsAgo = new Date();
      date120YearsAgo.setFullYear(date120YearsAgo.getFullYear() - 120);
      date120YearsAgo.setDate(date120YearsAgo.getDate() + 1);
      const dateStr = date120YearsAgo.toISOString().split("T")[0];

      // Act
      const result = service.validerAge(dateStr);

      // Assert
      expect(result).toBe(true);
    });

    it("devrait rejeter un âge trop jeune (< 5 ans)", () => {
      // Arrange
      const date3YearsAgo = new Date();
      date3YearsAgo.setFullYear(date3YearsAgo.getFullYear() - 3);
      const dateStr = date3YearsAgo.toISOString().split("T")[0];

      // Act
      const result = service.validerAge(dateStr);

      // Assert
      expect(result).toBe(false);
    });

    it("devrait rejeter un âge trop vieux (> 120 ans)", () => {
      // Arrange
      const date121YearsAgo = new Date();
      date121YearsAgo.setFullYear(date121YearsAgo.getFullYear() - 121);
      const dateStr = date121YearsAgo.toISOString().split("T")[0];

      // Act
      const result = service.validerAge(dateStr);

      // Assert
      expect(result).toBe(false);
    });

    it("devrait retourner false pour une date invalide", () => {
      // Act
      const result = service.validerAge("invalid-date");

      // Assert
      expect(result).toBe(false);
    });

    it("devrait gérer correctement les anniversaires pas encore passés", () => {
      // Arrange
      const today = new Date();
      const birthDate = new Date();
      birthDate.setFullYear(today.getFullYear() - 10);
      birthDate.setMonth(today.getMonth() + 1); // Anniversaire dans 1 mois
      const dateStr = birthDate.toISOString().split("T")[0];

      // Act
      const result = service.validerAge(dateStr);

      // Assert
      expect(result).toBe(true); // Devrait avoir 9 ans actuellement
    });
  });

  // ==================== INSCRIRE UTILISATEUR ====================
  describe("inscrireUtilisateur", () => {
    it("devrait inscrire un utilisateur avec succès", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });
      mockUtilisateursClient.inscriptionUtilisateurSimple = jest
        .fn()
        .mockResolvedValue({
          isConfirm: true,
          message: "Inscription réussie",
          userId: 42,
        });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

      // Act
      const result = await service.inscrireUtilisateur(validInscriptionData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Inscription réussie");
      expect(result.userId).toBe(42);
    });

    it("devrait refuser si l'email existe déjà", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: true });

      // Act
      const result = await service.inscrireUtilisateur(validInscriptionData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("existe déjà");
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
    });

    it("devrait refuser si l'âge est invalide", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });

      const dataTooYoung = {
        ...validInscriptionData,
        date: new Date().toISOString().split("T")[0],
      };

      // Act
      const result = await service.inscrireUtilisateur(dataTooYoung);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("âge");
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).not.toHaveBeenCalled();
    });

    it("devrait hasher le mot de passe avant l'insertion", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });
      mockUtilisateursClient.inscriptionUtilisateurSimple = jest
        .fn()
        .mockResolvedValue({ isConfirm: true, message: "OK" });
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$hashedPassword");

      // Act
      await service.inscrireUtilisateur(validInscriptionData);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(
        validInscriptionData.password,
        10,
      );
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "$2b$10$hashedPassword",
        }),
      );
    });

    it("devrait passer toutes les données au client DB", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });
      mockUtilisateursClient.inscriptionUtilisateurSimple = jest
        .fn()
        .mockResolvedValue({ isConfirm: true, message: "OK" });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      // Act
      await service.inscrireUtilisateur(validInscriptionData);

      // Assert
      expect(
        mockUtilisateursClient.inscriptionUtilisateurSimple,
      ).toHaveBeenCalledWith({
        nom: validInscriptionData.nom,
        prenom: validInscriptionData.prenom,
        email: validInscriptionData.email,
        password: "hashed",
        date: validInscriptionData.date,
        abonnement: validInscriptionData.abonnement,
        genre: validInscriptionData.genre,
      });
    });

    it("devrait gérer les erreurs du client DB gracieusement", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });
      mockUtilisateursClient.inscriptionUtilisateurSimple = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      // Act
      const result = await service.inscrireUtilisateur(validInscriptionData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).not.toContain("Database");
      expect(result.message).toContain("erreur");
    });

    it("devrait retourner false si le client retourne isConfirm=false", async () => {
      // Arrange
      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockResolvedValue({ isFind: false });
      mockUtilisateursClient.inscriptionUtilisateurSimple = jest
        .fn()
        .mockResolvedValue({
          isConfirm: false,
          message: "Erreur insertion",
        });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      // Act
      const result = await service.inscrireUtilisateur(validInscriptionData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Erreur insertion");
    });
  });

  // ==================== EVALUER FORCE MOT DE PASSE ====================
  describe("evaluerForceMotDePasse", () => {
    it("devrait donner un score de 0 pour un mot de passe très faible", () => {
      const result = service.evaluerForceMotDePasse("weak");
      expect(result).toBe(0);
    });

    it("devrait donner un score de 1 pour un mot de passe avec 8+ caractères", () => {
      const result = service.evaluerForceMotDePasse("weakpass");
      expect(result).toBe(1);
    });

    it("devrait augmenter le score avec la complexité", () => {
      const score1 = service.evaluerForceMotDePasse("password");
      const score2 = service.evaluerForceMotDePasse("Password1");
      const score3 = service.evaluerForceMotDePasse("Password1!");

      expect(score2).toBeGreaterThan(score1);
      expect(score3).toBeGreaterThan(score2);
    });

    it("devrait donner un score maximum de 4", () => {
      const result = service.evaluerForceMotDePasse(
        "V3ry$tr0ng!P@ssw0rdW1thM@nyChar@ct3rs",
      );
      expect(result).toBe(4);
    });

    it("devrait donner un score élevé pour un mot de passe fort", () => {
      const result = service.evaluerForceMotDePasse("SecureP@ss123");
      expect(result).toBeGreaterThanOrEqual(3);
    });

    it("devrait récompenser la longueur (12+ caractères)", () => {
      const short = service.evaluerForceMotDePasse("Pass1!");
      const long = service.evaluerForceMotDePasse("Password123!");

      expect(long).toBeGreaterThanOrEqual(short);
    });
  });

  // ==================== SANITIZE USER DATA ====================
  describe("sanitizeUserData", () => {
    it("devrait retirer le mot de passe", () => {
      const user = {
        id: 1,
        nom: "Dupont",
        email: "test@example.com",
        password: "hashedPassword",
      };

      const result = service.sanitizeUserData(user);

      expect(result).not.toHaveProperty("password");
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("nom");
      expect(result).toHaveProperty("email");
    });

    it("devrait conserver toutes les autres propriétés", () => {
      const user = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "test@example.com",
        password: "hashedPassword",
        role: "user",
        createdAt: new Date(),
      };

      const result = service.sanitizeUserData(user);

      expect(result.id).toBe(1);
      expect(result.nom).toBe("Dupont");
      expect(result.prenom).toBe("Jean");
      expect(result.email).toBe("test@example.com");
      expect(result.role).toBe("user");
      expect(result.createdAt).toBeDefined();
    });

    it("devrait gérer un objet sans mot de passe", () => {
      const user = {
        id: 1,
        nom: "Dupont",
        email: "test@example.com",
      };

      const result = service.sanitizeUserData(user);

      expect(result).toEqual(user);
    });

    it("devrait gérer un objet vide", () => {
      const user = {};

      const result = service.sanitizeUserData(user);

      expect(result).toEqual({});
    });
  });

  // ==================== INTEGRATION ====================
  describe("Flux complet d'inscription", () => {
    it("devrait exécuter toutes les étapes dans l'ordre", async () => {
      // Arrange
      const steps: string[] = [];

      mockUtilisateursClient.checkUtilisateurByEmail = jest
        .fn()
        .mockImplementation(async () => {
          steps.push("check-email");
          return { isFind: false };
        });

      (bcrypt.hash as jest.Mock).mockImplementation(async () => {
        steps.push("hash-password");
        return "hashed";
      });

      mockUtilisateursClient.inscriptionUtilisateurSimple = jest
        .fn()
        .mockImplementation(async () => {
          steps.push("insert-user");
          return { isConfirm: true, message: "OK" };
        });

      // Act
      await service.inscrireUtilisateur(validInscriptionData);

      // Assert
      expect(steps).toEqual(["check-email", "hash-password", "insert-user"]);
    });
  });
});
