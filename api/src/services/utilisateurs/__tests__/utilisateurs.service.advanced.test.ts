/**
 * Tests avancés pour le service Utilisateurs
 * Test des cas complexes, concurrence, et scénarios edge cases
 */

import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { UtilisateursService } from "../utilisateurs.service.js";
import { UtilisateursError } from "@clubmanager/types";
import bcrypt from "bcrypt";
import {
  createMockPrisma,
  mockUtilisateur1,
  mockUtilisateur2,
  mockUtilisateur3,
  mockUtilisateur1AvecRelations,
  mockUtilisateur2AvecRelations,
  mockUtilisateur3AvecRelations,
  mockGenreHomme,
  mockGenreFemme,
  mockGrade1,
  mockGrade2,
  mockGrade3,
  mockAbonnement1,
} from "./utilisateurs.mock.js";

describe("UtilisateursService - Tests avancés", () => {
  let mockPrisma: any;
  let service: UtilisateursService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new UtilisateursService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("Génération de userId unique", () => {
    it("devrait générer un userId basé sur nom, prénom et date", async () => {
      const input = {
        first_name: "Alice",
        last_name: "Wonderland",
        email: "alice@example.com",
        date_of_birth: new Date("1995-06-15"),
        genre_id: 2,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockImplementation((data) => {
              // Vérifier le format du userId: prenom.nom.AAMMJJ
              expect(data.data.userId).toMatch(/^alice\.wonderland\.\d{6}$/);
              return Promise.resolve({
                ...mockUtilisateur1AvecRelations,
                userId: data.data.userId,
              });
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.creerUtilisateur(input);

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });

    it("devrait gérer les collisions de userId avec suffixe numérique", async () => {
      const input = {
        first_name: "Bob",
        last_name: "Builder",
        email: "bob@example.com",
        date_of_birth: new Date("1990-01-01"),
        genre_id: 1,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      // Premier userId existe, deuxième existe aussi, troisième libre
      mockPrisma.utilisateurs.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockResolvedValue({
              ...mockUtilisateur1AvecRelations,
              userId: "bob.builder.900101.2",
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.creerUtilisateur(input);

      expect(result.success).toBe(true);
      expect(mockPrisma.utilisateurs.count).toHaveBeenCalledTimes(3);
    });

    it("devrait gérer les noms avec espaces et caractères spéciaux", async () => {
      const input = {
        first_name: "Jean-Pierre",
        last_name: "De La Fontaine",
        email: "jp@example.com",
        date_of_birth: new Date("1988-12-25"),
        genre_id: 1,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockImplementation((data) => {
              // Vérifier que les espaces sont supprimés
              expect(data.data.userId).not.toContain(" ");
              // Note: les tirets dans les prénoms composés sont conservés
              return Promise.resolve(mockUtilisateur1AvecRelations);
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      await service.creerUtilisateur(input);
    });

    it("devrait générer un userId avec timestamp si trop de collisions", async () => {
      const input = {
        first_name: "Common",
        last_name: "Name",
        email: "common@example.com",
        date_of_birth: new Date("2000-01-01"),
        genre_id: 1,
      };

      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      // Toujours des collisions pour forcer l'utilisation du timestamp
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

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

  describe("Calcul d'âge et date de naissance", () => {
    it("devrait calculer l'âge correctement pour une date anniversaire passée", async () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 25,
        today.getMonth() - 1,
        today.getDate(),
      );

      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1AvecRelations,
        date_of_birth: birthDate,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.age).toBe(25);
    });

    it("devrait calculer l'âge correctement pour une date anniversaire non passée", async () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 25,
        today.getMonth() + 1,
        today.getDate(),
      );

      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1AvecRelations,
        date_of_birth: birthDate,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.age).toBe(24);
    });

    it("devrait gérer les dates de naissance au 29 février", async () => {
      const birthDate = new Date("2000-02-29"); // Année bissextile

      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1AvecRelations,
        date_of_birth: birthDate,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.age).toBeGreaterThanOrEqual(23);
    });

    it("devrait gérer une date de naissance nulle", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1AvecRelations,
        date_of_birth: null,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.age).toBeUndefined();
    });
  });

  describe("Filtres combinés avancés", () => {
    it("devrait combiner plusieurs filtres correctement", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur2AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      await service.obtenirUtilisateurs({
        status_id: 1,
        genre_id: 2,
        grade_id: 4,
        actif: true,
        recherche: "Marie",
      });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status_id: 1,
            genre_id: 2,
            grade_id: 4,
            active: true,
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("devrait filtrer par tranche d'âge correctement", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      await service.obtenirUtilisateurs({
        ageMin: 18,
        ageMax: 30,
      });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date_of_birth: expect.any(Object),
          }),
        }),
      );
    });

    it("devrait filtrer par période d'inscription", async () => {
      const dateDebut = new Date("2023-01-01");
      const dateFin = new Date("2023-12-31");

      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      await service.obtenirUtilisateurs({
        dateInscriptionDebut: dateDebut,
        dateInscriptionFin: dateFin,
      });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date_inscription: {
              gte: dateDebut,
              lte: dateFin,
            },
          }),
        }),
      );
    });
  });

  describe("Recherche insensible à la casse", () => {
    it("devrait rechercher sans tenir compte de la casse dans le prénom", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur1AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      await service.obtenirUtilisateurs({ recherche: "JEAN" });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                first_name: expect.objectContaining({ mode: "insensitive" }),
              }),
            ]),
          }),
        }),
      );
    });

    it("devrait rechercher dans plusieurs champs simultanément", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      await service.obtenirUtilisateurs({ recherche: "test" });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ first_name: expect.any(Object) }),
              expect.objectContaining({ last_name: expect.any(Object) }),
              expect.objectContaining({ email: expect.any(Object) }),
              expect.objectContaining({ nom_utilisateur: expect.any(Object) }),
              expect.objectContaining({ userId: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });
  });

  describe("Gestion des relations nulles", () => {
    it("devrait gérer un genre_id null", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        genre_id: null,
        genres: null,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.genre_id).toBeUndefined();
      expect(result?.genre).toBeUndefined();
    });

    it("devrait gérer un grade_id null", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        grade_id: null,
        grades: null,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.grade_id).toBeNull();
      expect(result?.grade).toBeUndefined();
    });

    it("devrait gérer un abonnement_id null", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        abonnement_id: null,
        abonnements: null,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result?.abonnement_id).toBeNull();
      expect(result?.abonnement).toBeUndefined();
    });

    it("devrait gérer toutes les relations nulles simultanément", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        userId: "test.user.123456",
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        password: "hashed",
        date_of_birth: new Date("1990-01-01"),
        genre_id: null,
        grade_id: null,
        abonnement_id: null,
        status_id: 1,
        active: true,
        nom_utilisateur: null,
        date_inscription: null,
        created_at: null,
        updated_at: null,
        genres: null,
        grades: null,
        abonnements: null,
        status: null,
      });

      const result = await service.obtenirUtilisateurParId(1);

      expect(result).toBeDefined();
      expect(result?.genre).toBeUndefined();
      expect(result?.grade).toBeUndefined();
      expect(result?.abonnement).toBeUndefined();
      expect(result?.age).toBeDefined();
    });
  });

  describe("Pagination avec grands volumes", () => {
    it("devrait gérer la pagination avec un grand offset", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.count.mockResolvedValue(10000);

      const result = await service.obtenirUtilisateurs({
        limit: 50,
        offset: 9950,
      });

      expect(result.hasMore).toBe(false);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 9950,
          take: 50,
        }),
      );
    });

    it("devrait gérer une limite très grande", async () => {
      const mockUsers = Array.from({ length: 1000 }, (_, i) => ({
        ...mockUtilisateur1AvecRelations,
        id: i + 1,
      }));

      mockPrisma.utilisateurs.findMany.mockResolvedValue(mockUsers);
      mockPrisma.utilisateurs.count.mockResolvedValue(1000);

      const result = await service.obtenirUtilisateurs({ limit: 1000 });

      expect(result.utilisateurs).toHaveLength(1000);
    });
  });

  describe("Statistiques avancées", () => {
    it("devrait calculer la moyenne d'âge correctement", async () => {
      const users = [
        { date_of_birth: new Date("1990-01-01") }, // ~34 ans
        { date_of_birth: new Date("2000-01-01") }, // ~24 ans
        { date_of_birth: new Date("2010-01-01") }, // ~14 ans
      ];

      mockPrisma.utilisateurs.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(12);

      mockPrisma.utilisateurs.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockPrisma.genres.findMany.mockResolvedValue([]);
      mockPrisma.grades.findMany.mockResolvedValue([]);
      mockPrisma.abonnements.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.findMany.mockResolvedValue(users);

      const stats = await service.statistiquesGenerales();

      expect(stats.moyenneAge).toBeDefined();
      expect(typeof stats.moyenneAge).toBe("number");
    });

    it("devrait gérer les statistiques sans utilisateurs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      mockPrisma.utilisateurs.groupBy.mockResolvedValue([]);
      mockPrisma.genres.findMany.mockResolvedValue([]);
      mockPrisma.grades.findMany.mockResolvedValue([]);
      mockPrisma.abonnements.findMany.mockResolvedValue([]);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const stats = await service.statistiquesGenerales();

      expect(stats.totalUtilisateurs).toBe(0);
      expect(stats.moyenneAge).toBeUndefined();
    });
  });

  describe("Modification partielle", () => {
    it("devrait modifier uniquement les champs fournis", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            update: jest.fn().mockImplementation((args) => {
              // Vérifier que seuls les champs spécifiés sont dans updateData
              expect(Object.keys(args.data)).toContain("first_name");
              expect(Object.keys(args.data)).not.toContain("last_name");
              expect(Object.keys(args.data)).not.toContain("email");
              return Promise.resolve({
                ...mockUtilisateur1AvecRelations,
                first_name: "Nouveau",
              });
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      await service.modifierUtilisateur({
        id: 1,
        first_name: "Nouveau",
      });
    });

    it("devrait permettre de modifier plusieurs champs à la fois", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            update: jest.fn().mockResolvedValue({
              ...mockUtilisateur1AvecRelations,
              first_name: "Nouveau Prenom",
              last_name: "Nouveau Nom",
              genre_id: 2,
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const result = await service.modifierUtilisateur({
        id: 1,
        first_name: "Nouveau Prenom",
        last_name: "Nouveau Nom",
        genre_id: 2,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Normalisation des données", () => {
    it("devrait normaliser l'email en minuscules", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue({
        ...mockUtilisateur1,
        email: "TEST@EXAMPLE.COM",
      });

      await service.validerConnexion({
        email: "TEST@EXAMPLE.COM",
        password: "password",
      });

      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: "test@example.com",
          }),
        }),
      );
    });

    it("devrait trim les espaces des emails", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await service.verifierEmailExiste("  test@example.com  ");

      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: "test@example.com",
          }),
        }),
      );
    });
  });

  describe("Cas limites de dates", () => {
    it("devrait accepter un âge exactement à 5 ans", async () => {
      const today = new Date();
      const fiveYearsAgo = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate(),
      );

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

      const result = await service.creerUtilisateur({
        first_name: "Enfant",
        last_name: "Test",
        email: "enfant@example.com",
        date_of_birth: fiveYearsAgo,
        genre_id: 1,
      });

      expect(result.success).toBe(true);
    });

    it("devrait accepter un âge exactement à 120 ans", async () => {
      const today = new Date();
      const oneHundredTwentyYearsAgo = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );

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

      const result = await service.creerUtilisateur({
        first_name: "Senior",
        last_name: "Test",
        email: "senior@example.com",
        date_of_birth: oneHundredTwentyYearsAgo,
        genre_id: 1,
      });

      expect(result.success).toBe(true);
    });
  });
});
