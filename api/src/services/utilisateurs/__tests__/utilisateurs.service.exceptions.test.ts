/**
 * Tests des exceptions pour le service Utilisateurs
 * Test des cas d'erreur et de la gestion des exceptions
 */

import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { UtilisateursService } from "../utilisateurs.service.js";
import { UtilisateursError, UtilisateursErrorCode } from "@clubmanager/types";
import bcrypt from "bcrypt";
import {
  createMockPrisma,
  mockUtilisateur1,
  mockUtilisateurInactif,
  mockUtilisateurSuspendu,
  mockUtilisateur1AvecRelations,
} from "./utilisateurs.mock.js";

describe("UtilisateursService - Tests des exceptions", () => {
  let mockPrisma: any;
  let service: UtilisateursService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new UtilisateursService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("Erreurs USER_NOT_FOUND", () => {
    it("devrait lancer USER_NOT_FOUND pour obtenirUtilisateurParId", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await service.obtenirUtilisateurParId(999);

      expect(result).toBeNull();
    });

    it("devrait lancer USER_NOT_FOUND pour modifierUtilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        service.modifierUtilisateur({ id: 999, first_name: "Test" }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.modifierUtilisateur({ id: 999, first_name: "Test" }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_NOT_FOUND,
        message: expect.stringContaining("non trouvé"),
      });
    });

    it("devrait lancer USER_NOT_FOUND pour desactiverUtilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(service.desactiverUtilisateur({ id: 999 })).rejects.toThrow(
        UtilisateursError,
      );

      await expect(
        service.desactiverUtilisateur({ id: 999 }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_NOT_FOUND,
      });
    });

    it("devrait lancer USER_NOT_FOUND pour reactiverUtilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(service.reactiverUtilisateur({ id: 999 })).rejects.toThrow(
        UtilisateursError,
      );

      await expect(
        service.reactiverUtilisateur({ id: 999 }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_NOT_FOUND,
      });
    });

    it("devrait lancer USER_NOT_FOUND pour statistiquesUtilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(service.statistiquesUtilisateur(999)).rejects.toThrow(
        UtilisateursError,
      );

      await expect(service.statistiquesUtilisateur(999)).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_NOT_FOUND,
      });
    });
  });

  describe("Erreurs EMAIL_ALREADY_EXISTS", () => {
    it("devrait lancer EMAIL_ALREADY_EXISTS lors de la création", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

      await expect(
        service.creerUtilisateur({
          first_name: "Test",
          last_name: "User",
          email: "jean.dupont@example.com",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.creerUtilisateur({
          first_name: "Test",
          last_name: "User",
          email: "jean.dupont@example.com",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.EMAIL_ALREADY_EXISTS,
        message: expect.stringContaining("email"),
      });
    });

    it("devrait lancer EMAIL_ALREADY_EXISTS lors de la modification", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        id: 2,
        email: "autre@example.com",
      });

      await expect(
        service.modifierUtilisateur({
          id: 1,
          email: "autre@example.com",
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.modifierUtilisateur({
          id: 1,
          email: "autre@example.com",
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.EMAIL_ALREADY_EXISTS,
      });
    });
  });

  describe("Erreurs INVALID_AGE", () => {
    it("devrait lancer INVALID_AGE pour un âge trop jeune", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const dateNaissanceTropJeune = new Date();
      dateNaissanceTropJeune.setFullYear(
        dateNaissanceTropJeune.getFullYear() - 3,
      );

      await expect(
        service.creerUtilisateur({
          first_name: "Trop",
          last_name: "Jeune",
          email: "jeune@example.com",
          date_of_birth: dateNaissanceTropJeune,
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.creerUtilisateur({
          first_name: "Trop",
          last_name: "Jeune",
          email: "jeune@example.com",
          date_of_birth: dateNaissanceTropJeune,
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_AGE,
        message: expect.stringContaining("âge"),
      });
    });

    it("devrait lancer INVALID_AGE pour un âge trop vieux", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const dateNaissanceTropVieux = new Date();
      dateNaissanceTropVieux.setFullYear(
        dateNaissanceTropVieux.getFullYear() - 125,
      );

      await expect(
        service.creerUtilisateur({
          first_name: "Trop",
          last_name: "Vieux",
          email: "vieux@example.com",
          date_of_birth: dateNaissanceTropVieux,
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.creerUtilisateur({
          first_name: "Trop",
          last_name: "Vieux",
          email: "vieux@example.com",
          date_of_birth: dateNaissanceTropVieux,
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_AGE,
      });
    });

    it("devrait lancer INVALID_AGE lors de modification avec âge invalide", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      const dateInvalide = new Date();
      dateInvalide.setFullYear(dateInvalide.getFullYear() - 2);

      await expect(
        service.modifierUtilisateur({
          id: 1,
          date_of_birth: dateInvalide,
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.modifierUtilisateur({
          id: 1,
          date_of_birth: dateInvalide,
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_AGE,
      });
    });
  });

  describe("Erreurs INVALID_INPUT", () => {
    it("devrait lancer INVALID_INPUT pour un ID négatif", async () => {
      await expect(service.obtenirUtilisateurParId(-1)).rejects.toThrow(
        UtilisateursError,
      );

      await expect(service.obtenirUtilisateurParId(-1)).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_INPUT,
      });
    });

    it("devrait lancer INVALID_INPUT pour un ID zéro", async () => {
      await expect(service.obtenirUtilisateurParId(0)).rejects.toThrow(
        UtilisateursError,
      );

      await expect(service.obtenirUtilisateurParId(0)).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_INPUT,
      });
    });

    it("devrait lancer INVALID_INPUT pour modification sans données", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      await expect(service.modifierUtilisateur({ id: 1 })).rejects.toThrow(
        UtilisateursError,
      );

      await expect(
        service.modifierUtilisateur({ id: 1 }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_INPUT,
        message: expect.stringContaining("Aucune donnée"),
      });
    });

    it("devrait lancer INVALID_INPUT pour email vide", async () => {
      await expect(service.rechercherUtilisateursParEmail("")).rejects.toThrow(
        UtilisateursError,
      );

      await expect(
        service.rechercherUtilisateursParEmail(""),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_INPUT,
      });
    });
  });

  describe("Erreurs INVALID_EMAIL", () => {
    it("devrait lancer INVALID_EMAIL pour obtenirUtilisateurParEmail avec email vide", async () => {
      await expect(service.obtenirUtilisateurParEmail("")).rejects.toThrow(
        UtilisateursError,
      );

      await expect(
        service.obtenirUtilisateurParEmail(""),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_EMAIL,
      });
    });

    it("devrait lancer INVALID_EMAIL pour email avec espaces seulement", async () => {
      await expect(service.obtenirUtilisateurParEmail("   ")).rejects.toThrow(
        UtilisateursError,
      );

      await expect(
        service.obtenirUtilisateurParEmail("   "),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_EMAIL,
      });
    });
  });

  describe("Erreurs USER_INACTIVE", () => {
    it("devrait lancer USER_INACTIVE lors de la connexion", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateurInactif,
      );

      await expect(
        service.validerConnexion({
          email: "pierre.durand@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.validerConnexion({
          email: "pierre.durand@example.com",
          password: "password123",
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_INACTIVE,
        message: expect.stringContaining("désactivé"),
      });
    });

    it("devrait lancer USER_INACTIVE pour connexion par userId", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateurInactif,
      );

      await expect(
        service.validerConnexionParUserId({
          userId: "pierre.durand.851204",
          password: "password123",
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.validerConnexionParUserId({
          userId: "pierre.durand.851204",
          password: "password123",
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_INACTIVE,
      });
    });
  });

  describe("Erreurs USER_SUSPENDED", () => {
    it("devrait lancer USER_SUSPENDED lors de la connexion", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateurSuspendu,
      );

      await expect(
        service.validerConnexion({
          email: "lucas.petit@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.validerConnexion({
          email: "lucas.petit@example.com",
          password: "password123",
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_SUSPENDED,
        message: expect.stringContaining("suspendu"),
      });
    });

    it("devrait lancer USER_SUSPENDED lors de la réactivation", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurSuspendu,
      );

      await expect(service.reactiverUtilisateur({ id: 5 })).rejects.toThrow(
        UtilisateursError,
      );

      await expect(
        service.reactiverUtilisateur({ id: 5 }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_SUSPENDED,
        message: expect.stringContaining("suspendu"),
      });
    });
  });

  describe("Erreurs OPERATION_FAILED", () => {
    it("devrait lancer OPERATION_FAILED en cas d'erreur Prisma", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.obtenirUtilisateurs({})).rejects.toThrow(
        UtilisateursError,
      );

      await expect(service.obtenirUtilisateurs({})).rejects.toMatchObject({
        code: UtilisateursErrorCode.OPERATION_FAILED,
      });
    });

    it("devrait lancer OPERATION_FAILED pour erreur lors de la création", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Transaction failed"),
      );

      await expect(
        service.creerUtilisateur({
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toThrow(UtilisateursError);
    });

    it("devrait logger l'erreur originale", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Original error"),
      );

      await expect(service.obtenirUtilisateurs({})).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erreur"),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Erreurs de validation Zod", () => {
    it("devrait rejeter un email invalide lors de la création", async () => {
      await expect(
        service.creerUtilisateur({
          first_name: "Test",
          last_name: "User",
          email: "email-invalide",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toThrow();
    });

    it("devrait rejeter un prénom vide", async () => {
      await expect(
        service.creerUtilisateur({
          first_name: "",
          last_name: "User",
          email: "test@example.com",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toThrow();
    });

    it("devrait rejeter un nom vide", async () => {
      await expect(
        service.creerUtilisateur({
          first_name: "Test",
          last_name: "",
          email: "test@example.com",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toThrow();
    });

    it("devrait rejeter un email invalide lors de la connexion", async () => {
      await expect(
        service.validerConnexion({
          email: "email-invalide",
          password: "password",
        }),
      ).rejects.toThrow();
    });

    it("devrait rejeter un mot de passe vide lors de la connexion", async () => {
      await expect(
        service.validerConnexion({
          email: "test@example.com",
          password: "",
        }),
      ).rejects.toThrow();
    });
  });

  describe("Erreurs de transaction", () => {
    it("devrait rollback la transaction en cas d'erreur lors de la création", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockRejectedValue(new Error("Create failed")),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      await expect(
        service.creerUtilisateur({
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toThrow();
    });

    it("devrait rollback la transaction en cas d'erreur lors de la modification", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            update: jest.fn().mockRejectedValue(new Error("Update failed")),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      await expect(
        service.modifierUtilisateur({
          id: 1,
          first_name: "Nouveau Nom",
        }),
      ).rejects.toThrow();
    });
  });

  describe("Erreurs de connexion invalides", () => {
    it("devrait retourner success: false pour email inexistant", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await service.validerConnexion({
        email: "inexistant@example.com",
        password: "password",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });

    it("devrait retourner success: false pour mot de passe incorrect", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

      const result = await service.validerConnexion({
        email: "jean.dupont@example.com",
        password: "mauvais_password",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });

    it("devrait retourner success: false pour userId inexistant", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await service.validerConnexionParUserId({
        userId: "inexistant.user.000000",
        password: "password",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });
  });

  // Tests de gestion des erreurs bcrypt supprimés car bcrypt est utilisé réellement

  describe("Codes d'erreur personnalisés", () => {
    it("devrait avoir le bon nom d'erreur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      try {
        await service.modifierUtilisateur({ id: 999, first_name: "Test" });
      } catch (error) {
        expect(error).toBeInstanceOf(UtilisateursError);
        expect((error as UtilisateursError).name).toBe("UtilisateursError");
      }
    });

    it("devrait avoir le bon code d'erreur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      try {
        await service.modifierUtilisateur({ id: 999, first_name: "Test" });
      } catch (error) {
        expect((error as UtilisateursError).code).toBe(
          UtilisateursErrorCode.USER_NOT_FOUND,
        );
      }
    });

    it("devrait avoir un message d'erreur descriptif", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      try {
        await service.modifierUtilisateur({ id: 999, first_name: "Test" });
      } catch (error) {
        expect((error as Error).message).toBeTruthy();
        expect((error as Error).message.length).toBeGreaterThan(0);
      }
    });
  });
});
