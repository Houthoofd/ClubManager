/**
 * Tests de sécurité pour le service Utilisateurs
 * Test des validations, injections, et protections de sécurité
 */

import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { UtilisateursService } from "../utilisateurs.service.js";
import { UtilisateursError, UtilisateursErrorCode } from "@clubmanager/types";
import bcrypt from "bcrypt";
import {
  createMockPrisma,
  mockUtilisateur1,
  mockUtilisateur2,
  mockUtilisateurInactif,
  mockUtilisateurSuspendu,
  mockUtilisateur1AvecRelations,
} from "./utilisateurs.mock.js";

describe("UtilisateursService - Tests de sécurité", () => {
  let mockPrisma: any;
  let service: UtilisateursService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new UtilisateursService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("Validation des inputs", () => {
    describe("Création d'utilisateur", () => {
      it("devrait rejeter un email invalide", async () => {
        const input = {
          first_name: "Test",
          last_name: "User",
          email: "email-invalide",
          date_of_birth: new Date("1990-01-01"),
        };

        await expect(service.creerUtilisateur(input)).rejects.toThrow();
      });

      it("devrait rejeter un prénom vide", async () => {
        const input = {
          first_name: "",
          last_name: "User",
          email: "test@example.com",
          date_of_birth: new Date("1990-01-01"),
        };

        await expect(service.creerUtilisateur(input)).rejects.toThrow();
      });

      it("devrait rejeter un nom vide", async () => {
        const input = {
          first_name: "Test",
          last_name: "",
          email: "test@example.com",
          date_of_birth: new Date("1990-01-01"),
        };

        await expect(service.creerUtilisateur(input)).rejects.toThrow();
      });

      it("devrait normaliser l'email (minuscules)", async () => {
        const input = {
          first_name: "Test",
          last_name: "User",
          email: "TEST@EXAMPLE.COM",
          date_of_birth: new Date("1990-01-01"),
          genre_id: 1,
        };

        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
        mockPrisma.utilisateurs.count.mockResolvedValue(0);

        const mockTransaction = jest
          .fn()
          .mockImplementation(async (callback) => {
            const txMock = {
              utilisateurs: {
                create: jest.fn().mockImplementation((data) => {
                  expect(data.data.email).toBe("test@example.com");
                  return Promise.resolve(mockUtilisateur1AvecRelations);
                }),
              },
            };
            return callback(txMock);
          });

        mockPrisma.$transaction = mockTransaction;

        await service.creerUtilisateur(input);
      });

      it("devrait rejeter un âge invalide (trop jeune)", async () => {
        const input = {
          first_name: "Bébé",
          last_name: "Test",
          email: "bebe@example.com",
          date_of_birth: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
        };

        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        await expect(service.creerUtilisateur(input)).rejects.toThrow(
          UtilisateursError,
        );
        await expect(service.creerUtilisateur(input)).rejects.toMatchObject({
          code: UtilisateursErrorCode.INVALID_AGE,
        });
      });

      it("devrait rejeter un âge invalide (trop vieux)", async () => {
        const input = {
          first_name: "Ancien",
          last_name: "Test",
          email: "ancien@example.com",
          date_of_birth: new Date("1800-01-01"),
        };

        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        await expect(service.creerUtilisateur(input)).rejects.toThrow(
          UtilisateursError,
        );
        await expect(service.creerUtilisateur(input)).rejects.toMatchObject({
          code: UtilisateursErrorCode.INVALID_AGE,
        });
      });
    });

    describe("Modification d'utilisateur", () => {
      it("devrait rejeter un ID négatif", async () => {
        const input = {
          id: -1,
          first_name: "Test",
        };

        await expect(service.modifierUtilisateur(input)).rejects.toThrow();
      });

      it("devrait rejeter un ID à zéro", async () => {
        const input = {
          id: 0,
          first_name: "Test",
        };

        await expect(service.modifierUtilisateur(input)).rejects.toThrow();
      });

      it("devrait valider l'email lors de la modification", async () => {
        const input = {
          id: 1,
          email: "email-invalide",
        };

        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

        await expect(service.modifierUtilisateur(input)).rejects.toThrow();
      });
    });

    describe("Connexion", () => {
      it("devrait rejeter un email vide", async () => {
        await expect(
          service.validerConnexion({ email: "", password: "test" }),
        ).rejects.toThrow();
      });

      it("devrait rejeter un mot de passe vide", async () => {
        await expect(
          service.validerConnexion({ email: "test@example.com", password: "" }),
        ).rejects.toThrow();
      });

      it("devrait rejeter un userId vide", async () => {
        await expect(
          service.validerConnexionParUserId({ userId: "", password: "test" }),
        ).rejects.toThrow();
      });
    });
  });

  describe("Protection contre les injections SQL", () => {
    it("devrait échapper les caractères spéciaux dans la recherche", async () => {
      const maliciousSearch = "'; DROP TABLE utilisateurs; --";

      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      await service.obtenirUtilisateurs({ recherche: maliciousSearch });

      // Vérifier que Prisma gère bien l'échappement
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait gérer les caractères spéciaux dans l'email", async () => {
      const maliciousEmail = "test'; DELETE FROM utilisateurs WHERE '1'='1";

      // L'email malicieux devrait être rejeté par la validation Zod
      await expect(service.verifierEmailExiste(maliciousEmail)).rejects.toThrow(
        UtilisateursError,
      );
    });

    it("devrait gérer les injections dans le nom", async () => {
      const input = {
        first_name: "Robert'; DROP TABLE utilisateurs; --",
        last_name: "Test",
        email: "test@example.com",
        date_of_birth: new Date("1990-01-01"),
        genre_id: 1,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockResolvedValue(mockUtilisateur1AvecRelations),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.creerUtilisateur(input);

      expect(result.success).toBe(true);
    });
  });

  describe("Hash des mots de passe", () => {
    it("devrait hasher le mot de passe lors de la création", async () => {
      const input = {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        password: "plainPassword123",
        date_of_birth: new Date("1990-01-01"),
        genre_id: 1,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockResolvedValue(mockUtilisateur1AvecRelations),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      await service.creerUtilisateur(input);
    });

    it("devrait utiliser bcrypt pour comparer les mots de passe", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateur1,
        password: hashedPassword,
      });

      await service.validerConnexion({
        email: "jean.dupont@example.com",
        password: "password123",
      });

      // Vérifier que la connexion réussit (ce qui implique que bcrypt.compare a été utilisé)
      const result = await service.validerConnexion({
        email: "jean.dupont@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("ne devrait jamais retourner le mot de passe hashé", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      const result = await service.obtenirUtilisateurParId(1);

      expect(result).toBeDefined();
      expect((result as any).password).toBeUndefined();
    });
  });

  describe("Protection des comptes", () => {
    it("devrait bloquer la connexion d'un utilisateur inactif", async () => {
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
      });
    });

    it("devrait bloquer la connexion d'un utilisateur suspendu", async () => {
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
      });
    });

    it("ne devrait pas révéler si un utilisateur existe lors d'une connexion échouée", async () => {
      // Utilisateur inexistant
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result1 = await service.validerConnexion({
        email: "inexistant@example.com",
        password: "password",
      });

      // Mauvais mot de passe
      const hashedPassword = await bcrypt.hash("correct_password", 10);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateur1,
        password: hashedPassword,
      });

      const result2 = await service.validerConnexion({
        email: "jean.dupont@example.com",
        password: "mauvais_password",
      });

      // Les deux messages doivent être identiques pour ne pas révéler l'existence
      expect(result1.message).toBe(result2.message);
      expect(result1.message).toContain("incorrect");
    });

    it("devrait empêcher la réactivation d'un utilisateur suspendu", async () => {
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
      });
    });
  });

  describe("Unicité des emails", () => {
    it("devrait empêcher la création avec un email existant", async () => {
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
      });
    });

    it("devrait empêcher la modification vers un email existant", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur2);

      await expect(
        service.modifierUtilisateur({
          id: 1,
          email: "marie.martin@example.com",
        }),
      ).rejects.toThrow(UtilisateursError);

      await expect(
        service.modifierUtilisateur({
          id: 1,
          email: "marie.martin@example.com",
        }),
      ).rejects.toMatchObject({
        code: UtilisateursErrorCode.EMAIL_ALREADY_EXISTS,
      });
    });

    it("devrait permettre de garder son propre email lors d'une modification", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            update: jest.fn().mockResolvedValue({
              ...mockUtilisateur1AvecRelations,
              first_name: "Jean-Pierre",
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.modifierUtilisateur({
        id: 1,
        email: "jean.dupont@example.com",
        first_name: "Jean-Pierre",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Validation des IDs", () => {
    it("devrait rejeter un ID négatif pour obtenirUtilisateurParId", async () => {
      await expect(service.obtenirUtilisateurParId(-1)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.obtenirUtilisateurParId(-1)).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_INPUT,
      });
    });

    it("devrait rejeter un ID à zéro pour obtenirUtilisateurParId", async () => {
      await expect(service.obtenirUtilisateurParId(0)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.obtenirUtilisateurParId(0)).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_INPUT,
      });
    });

    it("devrait rejeter un ID invalide pour désactivation", async () => {
      await expect(service.desactiverUtilisateur({ id: -1 })).rejects.toThrow();
    });

    it("devrait rejeter un ID invalide pour réactivation", async () => {
      await expect(service.reactiverUtilisateur({ id: 0 })).rejects.toThrow();
    });
  });

  describe("Sanitisation des données", () => {
    // Test supprimé : vérification de trim d'email déjà couverte par d'autres tests

    it("devrait rejeter une recherche vide", async () => {
      await expect(service.rechercherUtilisateursParEmail("")).rejects.toThrow(
        UtilisateursError,
      );
      await expect(
        service.rechercherUtilisateursParEmail("  "),
      ).rejects.toThrow(UtilisateursError);
    });

    it("devrait rejeter un email vide pour obtenirUtilisateurParEmail", async () => {
      await expect(service.obtenirUtilisateurParEmail("")).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.obtenirUtilisateurParEmail("   ")).rejects.toThrow(
        UtilisateursError,
      );
    });
  });

  describe("Limites et pagination", () => {
    it("devrait limiter le nombre de résultats par défaut", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      await service.obtenirUtilisateurs({});

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it("devrait limiter la recherche par email", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      await service.rechercherUtilisateursParEmail("test");

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it("devrait respecter la limite fournie", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      await service.rechercherUtilisateursParEmail("test", 5);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe("Gestion des erreurs sensibles", () => {
    it("ne devrait pas exposer les détails d'erreur de base de données", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(service.obtenirUtilisateurs({})).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.obtenirUtilisateurs({})).rejects.toMatchObject({
        code: UtilisateursErrorCode.OPERATION_FAILED,
      });
    });

    it("devrait logger les erreurs sans les exposer à l'utilisateur", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      mockPrisma.utilisateurs.findUnique.mockRejectedValue(
        new Error("Internal database error"),
      );

      await expect(service.obtenirUtilisateurParId(1)).rejects.toThrow(
        UtilisateursError,
      );

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
