/**
 * Tests unitaires pour le service Utilisateurs
 * Test des méthodes principales avec mocks Prisma
 */

import { jest } from "@jest/globals";
import { UtilisateursService } from "../utilisateurs.service.js";
import { UtilisateursError, UtilisateursErrorCode } from "@clubmanager/types";
import bcrypt from "bcrypt";
import {
  createMockPrisma,
  mockUtilisateur1,
  mockUtilisateur2,
  mockUtilisateur3,
  mockUtilisateurInactif,
  mockUtilisateurSuspendu,
  mockUtilisateur1AvecRelations,
  mockUtilisateur2AvecRelations,
  mockUtilisateur3AvecRelations,
  formatUtilisateurAvecDetails,
  formatUtilisateurRecherche,
} from "./utilisateurs.mock.js";

describe("UtilisateursService - Tests unitaires", () => {
  let mockPrisma: any;
  let service: UtilisateursService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new UtilisateursService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("obtenirUtilisateurs", () => {
    it("devrait récupérer tous les utilisateurs avec pagination", async () => {
      const utilisateurs = [
        mockUtilisateur1AvecRelations,
        mockUtilisateur2AvecRelations,
        mockUtilisateur3AvecRelations,
      ];

      mockPrisma.utilisateurs.findMany.mockResolvedValue(utilisateurs);
      mockPrisma.utilisateurs.count.mockResolvedValue(3);

      const result = await service.obtenirUtilisateurs({
        limit: 10,
        offset: 0,
      });

      expect(result.utilisateurs).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(false);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it("devrait filtrer par statut actif", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur1AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await service.obtenirUtilisateurs({ actif: true });

      expect(result.utilisateurs).toHaveLength(1);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        }),
      );
    });

    it("devrait filtrer par recherche", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur1AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      await service.obtenirUtilisateurs({ recherche: "Jean" });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("devrait filtrer par genre_id", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur2AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      await service.obtenirUtilisateurs({ genre_id: 2 });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ genre_id: 2 }),
        }),
      );
    });

    it("devrait indiquer hasMore correctement", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur1AvecRelations,
        mockUtilisateur2AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(25);

      const result = await service.obtenirUtilisateurs({
        limit: 10,
        offset: 0,
      });

      expect(result.hasMore).toBe(true);
    });
  });

  describe("obtenirUtilisateurParId", () => {
    it("devrait récupérer un utilisateur par son ID", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      const result = await service.obtenirUtilisateurParId(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.first_name).toBe("Jean");
      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it("devrait retourner null si utilisateur non trouvé", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await service.obtenirUtilisateurParId(999);

      expect(result).toBeNull();
    });

    it("devrait calculer l'âge correctement", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.age).toBeDefined();
      expect(typeof result?.age).toBe("number");
    });

    it("devrait calculer les initiales correctement", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.initiales).toBe("JD");
    });

    it("devrait lancer une erreur pour un ID invalide", async () => {
      await expect(service.obtenirUtilisateurParId(0)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.obtenirUtilisateurParId(-1)).rejects.toThrow(
        UtilisateursError,
      );
    });
  });

  describe("obtenirUtilisateurParEmail", () => {
    it("devrait récupérer un utilisateur par son email", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      const result = await service.obtenirUtilisateurParEmail(
        "jean.dupont@example.com",
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe("jean.dupont@example.com");
    });

    it("devrait normaliser l'email (minuscules et trim)", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      await service.obtenirUtilisateurParEmail("  JEAN.DUPONT@EXAMPLE.COM  ");

      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "jean.dupont@example.com" },
        }),
      );
    });

    it("devrait retourner null si email non trouvé", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await service.obtenirUtilisateurParEmail(
        "inexistant@example.com",
      );

      expect(result).toBeNull();
    });

    it("devrait lancer une erreur pour un email vide", async () => {
      await expect(service.obtenirUtilisateurParEmail("")).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.obtenirUtilisateurParEmail("   ")).rejects.toThrow(
        UtilisateursError,
      );
    });
  });

  describe("rechercherUtilisateursParEmail", () => {
    it("devrait rechercher des utilisateurs par email partiel", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur1,
        mockUtilisateur2,
      ]);

      const result =
        await service.rechercherUtilisateursParEmail("example.com");

      expect(result).toHaveLength(2);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: expect.objectContaining({
              contains: "example.com",
              mode: "insensitive",
            }),
          }),
        }),
      );
    });

    it("devrait limiter le nombre de résultats", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([mockUtilisateur1]);

      await service.rechercherUtilisateursParEmail("jean", 5);

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it("devrait lancer une erreur pour une recherche vide", async () => {
      await expect(service.rechercherUtilisateursParEmail("")).rejects.toThrow(
        UtilisateursError,
      );
    });
  });

  describe("creerUtilisateur", () => {
    it("devrait créer un nouvel utilisateur", async () => {
      const input = {
        first_name: "Nouveau",
        last_name: "Utilisateur",
        email: "nouveau@example.com",
        password: "password123",
        date_of_birth: new Date("1990-01-01"),
        genre_id: 1,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockResolvedValue({
              ...mockUtilisateur1AvecRelations,
              id: 999,
              first_name: input.first_name,
              last_name: input.last_name,
              email: input.email,
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.creerUtilisateur(input);

      expect(result.success).toBe(true);
      expect(result.utilisateur).toBeDefined();
      expect(result.userId).toBeDefined();
    });

    it("devrait rejeter si l'email existe déjà", async () => {
      const input = {
        first_name: "Test",
        last_name: "User",
        email: "jean.dupont@example.com",
        date_of_birth: new Date("1990-01-01"),
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

      await expect(service.creerUtilisateur(input)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.creerUtilisateur(input)).rejects.toMatchObject({
        code: UtilisateursErrorCode.EMAIL_ALREADY_EXISTS,
      });
    });

    it("devrait valider l'âge minimum (5 ans)", async () => {
      const input = {
        first_name: "Trop",
        last_name: "Jeune",
        email: "trop.jeune@example.com",
        date_of_birth: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), // 3 ans
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      await expect(service.creerUtilisateur(input)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.creerUtilisateur(input)).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_AGE,
      });
    });

    it("devrait valider l'âge maximum (120 ans)", async () => {
      const input = {
        first_name: "Trop",
        last_name: "Vieux",
        email: "trop.vieux@example.com",
        date_of_birth: new Date(Date.now() - 125 * 365 * 24 * 60 * 60 * 1000), // 125 ans
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

  describe("modifierUtilisateur", () => {
    it("devrait modifier un utilisateur existant", async () => {
      const input = {
        id: 1,
        first_name: "Jean-Modifié",
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            update: jest.fn().mockResolvedValue({
              ...mockUtilisateur1AvecRelations,
              first_name: "Jean-Modifié",
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.modifierUtilisateur(input);

      expect(result.success).toBe(true);
      expect(result.utilisateur?.first_name).toBe("Jean-Modifié");
    });

    it("devrait rejeter si l'utilisateur n'existe pas", async () => {
      const input = {
        id: 999,
        first_name: "Test",
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(service.modifierUtilisateur(input)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.modifierUtilisateur(input)).rejects.toMatchObject({
        code: UtilisateursErrorCode.USER_NOT_FOUND,
      });
    });

    it("devrait vérifier l'unicité de l'email lors de la modification", async () => {
      const input = {
        id: 1,
        email: "marie.martin@example.com", // Email de l'utilisateur 2
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur2);

      await expect(service.modifierUtilisateur(input)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.modifierUtilisateur(input)).rejects.toMatchObject({
        code: UtilisateursErrorCode.EMAIL_ALREADY_EXISTS,
      });
    });

    it("devrait rejeter si aucune donnée à modifier", async () => {
      const input = {
        id: 1,
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      await expect(service.modifierUtilisateur(input)).rejects.toThrow(
        UtilisateursError,
      );
      await expect(service.modifierUtilisateur(input)).rejects.toMatchObject({
        code: UtilisateursErrorCode.INVALID_INPUT,
      });
    });
  });

  describe("desactiverUtilisateur", () => {
    it("devrait désactiver un utilisateur actif", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            update: jest.fn().mockResolvedValue({
              ...mockUtilisateur1,
              active: false,
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.desactiverUtilisateur({ id: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toContain("désactivé");
    });

    it("devrait indiquer si l'utilisateur est déjà désactivé", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurInactif,
      );

      const result = await service.desactiverUtilisateur({ id: 4 });

      expect(result.success).toBe(false);
      expect(result.message).toContain("déjà désactivé");
    });

    it("devrait rejeter si l'utilisateur n'existe pas", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(service.desactiverUtilisateur({ id: 999 })).rejects.toThrow(
        UtilisateursError,
      );
    });
  });

  describe("reactiverUtilisateur", () => {
    it("devrait réactiver un utilisateur inactif", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateurInactif,
      );

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            update: jest.fn().mockResolvedValue({
              ...mockUtilisateurInactif,
              active: true,
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.reactiverUtilisateur({ id: 4 });

      expect(result.success).toBe(true);
      expect(result.message).toContain("réactivé");
    });

    it("devrait indiquer si l'utilisateur est déjà actif", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      const result = await service.reactiverUtilisateur({ id: 1 });

      expect(result.success).toBe(false);
      expect(result.message).toContain("déjà actif");
    });

    it("devrait rejeter si l'utilisateur est suspendu", async () => {
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

  describe("validerConnexion", () => {
    it("devrait valider une connexion avec des identifiants corrects", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateur1,
        password: hashedPassword,
      });

      const result = await service.validerConnexion({
        email: "jean.dupont@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.utilisateur).toBeDefined();
      expect(result.message).toBe("Connexion réussie");
    });

    it("devrait rejeter une connexion avec un mot de passe incorrect", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateur1,
        password: hashedPassword,
      });

      const result = await service.validerConnexion({
        email: "jean.dupont@example.com",
        password: "mauvais_password",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });

    it("devrait rejeter une connexion avec un email inexistant", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await service.validerConnexion({
        email: "inexistant@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });

    it("devrait rejeter si l'utilisateur est inactif", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateurInactif,
      );

      await expect(
        service.validerConnexion({
          email: "pierre.durand@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UtilisateursError);
    });

    it("devrait rejeter si l'utilisateur est suspendu", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateurSuspendu,
      );

      await expect(
        service.validerConnexion({
          email: "lucas.petit@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UtilisateursError);
    });
  });

  describe("validerConnexionParUserId", () => {
    it("devrait valider une connexion avec userId et mot de passe corrects", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateur1,
        password: hashedPassword,
      });

      const result = await service.validerConnexionParUserId({
        userId: "jean.dupont.950315",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.utilisateur).toBeDefined();
    });

    it("devrait rejeter avec un userId inexistant", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const result = await service.validerConnexionParUserId({
        userId: "inexistant.user.000000",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("incorrect");
    });
  });

  describe("Méthodes utilitaires", () => {
    it("compterUtilisateurs - devrait compter tous les utilisateurs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const result = await service.compterUtilisateurs();

      expect(result).toBe(100);
    });

    it("compterUtilisateursActifs - devrait compter les utilisateurs actifs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(85);

      const result = await service.compterUtilisateursActifs();

      expect(result).toBe(85);
      expect(mockPrisma.utilisateurs.count).toHaveBeenCalledWith({
        where: { active: true, status_id: 1 },
      });
    });
  });

  describe("Vérifications - utilisateurExiste", () => {
    it("devrait vérifier l'existence d'un utilisateur", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await service.utilisateurExiste(1);

      expect(result).toBe(true);
      expect(mockPrisma.utilisateurs.count).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner false si inexistant", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const result = await service.utilisateurExiste(999);

      expect(result).toBe(false);
    });

    it("devrait lever une erreur pour un ID négatif", async () => {
      await expect(service.utilisateurExiste(-1)).rejects.toThrow(
        UtilisateursError,
      );
    });

    it("devrait lever une erreur pour un ID zéro", async () => {
      await expect(service.utilisateurExiste(0)).rejects.toThrow(
        UtilisateursError,
      );
    });

    it("devrait lever une erreur pour un ID non entier", async () => {
      await expect(service.utilisateurExiste(1.5)).rejects.toThrow(
        UtilisateursError,
      );
    });
  });

  describe("Vérifications - verifierEmailExiste", () => {
    it("devrait vérifier si un email existe", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        active: true,
      });

      const result = await service.verifierEmailExiste(
        "jean.dupont@example.com",
      );

      expect(result.existe).toBe(true);
      expect(result.message).toContain("déjà utilisé");
      expect(result.utilisateurId).toBe(1);
      expect(result.actif).toBe(true);
    });

    it("devrait retourner false si email inexistant", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await service.verifierEmailExiste(
        "inexistant@example.com",
      );

      expect(result.existe).toBe(false);
      expect(result.message).toContain("disponible");
    });

    it("devrait normaliser l'email en minuscules", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        active: true,
      });

      await service.verifierEmailExiste("JEAN.DUPONT@EXAMPLE.COM");

      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "jean.dupont@example.com" },
        }),
      );
    });

    it("devrait lever une erreur pour un email invalide", async () => {
      await expect(service.verifierEmailExiste("not-an-email")).rejects.toThrow(
        UtilisateursError,
      );
    });

    it("devrait lever une erreur pour un email vide", async () => {
      await expect(service.verifierEmailExiste("")).rejects.toThrow(
        UtilisateursError,
      );
    });

    it("devrait retourner actif=false pour un utilisateur désactivé", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateurInactif,
        active: false,
      });

      const result = await service.verifierEmailExiste(
        "inactif@example.com",
      );

      expect(result.existe).toBe(true);
      expect(result.actif).toBe(false);
    });
  });

  describe("Vérifications - verifierUtilisateurExiste", () => {
    it("devrait retourner existe=true et canRegister=false pour un utilisateur actif", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        active: true,
        status_id: 1,
      });

      const result = await service.verifierUtilisateurExiste(
        "jean.dupont@example.com",
      );

      expect(result.existe).toBe(true);
      expect(result.canRegister).toBe(false);
      expect(result.message).toContain("actif");
      expect(result.utilisateur).toBeDefined();
      expect(result.utilisateur?.email).toBe("jean.dupont@example.com");
    });

    it("devrait retourner existe=false et canRegister=true pour un email inexistant", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await service.verifierUtilisateurExiste(
        "inexistant@example.com",
      );

      expect(result.existe).toBe(false);
      expect(result.canRegister).toBe(true);
      expect(result.message).toContain("disponible");
      expect(result.utilisateur).toBeUndefined();
    });

    it("devrait retourner canRegister=true pour un utilisateur inactif", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateurInactif,
        active: false,
        status_id: 2,
      });

      const result = await service.verifierUtilisateurExiste(
        "inactif@example.com",
      );

      expect(result.existe).toBe(true);
      expect(result.canRegister).toBe(true);
      expect(result.message).toContain("inactif");
    });

    it("devrait retourner les détails complets de l'utilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      const result = await service.verifierUtilisateurExiste(
        "jean.dupont@example.com",
      );

      expect(result.utilisateur).toBeDefined();
      expect(result.utilisateur?.nom).toBe("Dupont");
      expect(result.utilisateur?.prenom).toBe("Jean");
    });

    it("devrait lever une erreur pour un email invalide", async () => {
      await expect(
        service.verifierUtilisateurExiste("invalid"),
      ).rejects.toThrow(UtilisateursError);
    });

    it("devrait normaliser l'email", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      await service.verifierUtilisateurExiste("JEAN.DUPONT@EXAMPLE.COM");

      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "jean.dupont@example.com" },
        }),
      );
    });
  });
});
