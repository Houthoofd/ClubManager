/**
 * Tests d'intégration pour le service Utilisateurs
 * Test des scénarios complets et de l'intégration entre les différentes méthodes
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
  mockUtilisateur1AvecRelations,
  mockUtilisateur2AvecRelations,
  mockUtilisateur3AvecRelations,
  mockGenreHomme,
  mockGenreFemme,
  mockGrade1,
  mockGrade2,
  mockGrade3,
  mockGrade4,
  mockAbonnement1,
  mockAbonnement2,
  mockStatusActif,
  mockStatistiquesUtilisateurs,
  mockStatistiquesUtilisateur,
} from "./utilisateurs.mock.js";

describe("UtilisateursService - Tests d'intégration", () => {
  let mockPrisma: any;
  let service: UtilisateursService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new UtilisateursService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("Scénario complet: Inscription et première connexion", () => {
    it("devrait créer un utilisateur puis le connecter", async () => {
      // Étape 1: Vérifier que l'email n'existe pas
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce(null);

      // Étape 2: Créer l'utilisateur
      const input = {
        first_name: "Alexandre",
        last_name: "Dumas",
        email: "alexandre.dumas@example.com",
        password: "securePass123",
        date_of_birth: new Date("1995-05-20"),
        genre_id: 1,
        grade_id: 1,
      };

      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const txMock = {
          utilisateurs: {
            create: jest.fn().mockResolvedValue({
              id: 100,
              userId: "alexandre.dumas.950520",
              first_name: input.first_name,
              last_name: input.last_name,
              email: input.email,
              password: "$2b$10$hashedPassword",
              date_of_birth: input.date_of_birth,
              genre_id: input.genre_id,
              grade_id: input.grade_id,
              status_id: 1,
              active: true,
              date_inscription: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
              genres: mockGenreHomme,
              grades: mockGrade1,
              abonnements: null,
              status: mockStatusActif,
            }),
          },
        };
        return callback(txMock);
      });

      mockPrisma.$transaction = mockTransaction;

      const createResult = await service.creerUtilisateur(input);

      expect(createResult.success).toBe(true);
      expect(createResult.utilisateur).toBeDefined();
      expect(createResult.userId).toBe("alexandre.dumas.950520");

      // Étape 3: Se connecter avec les identifiants
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce({
        id: 100,
        userId: "alexandre.dumas.950520",
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        password: "$2b$10$hashedPassword",
        date_of_birth: input.date_of_birth,
        status_id: 1,
        grade_id: 1,
        abonnement_id: null,
        active: true,
        password: await bcrypt.hash("securePass123", 10),
      });

      const loginResult = await service.validerConnexion({
        email: input.email,
        password: input.password,
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.utilisateur?.email).toBe(input.email);
      expect(loginResult.message).toBe("Connexion réussie");
    });
  });

  describe("Scénario: Gestion du cycle de vie utilisateur", () => {
    it("devrait créer, modifier, désactiver et réactiver un utilisateur", async () => {
      // 1. Créer
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce(null);
      mockPrisma.utilisateurs.count.mockResolvedValue(0);

      const mockTransactionCreate = jest
        .fn()
        .mockImplementation(async (callback) => {
          const txMock = {
            utilisateurs: {
              create: jest
                .fn()
                .mockResolvedValue(mockUtilisateur1AvecRelations),
            },
          };
          return callback(txMock);
        });

      mockPrisma.$transaction = mockTransactionCreate;

      const createResult = await service.creerUtilisateur({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        password: "password123",
        date_of_birth: new Date("1995-03-15"),
        genre_id: 1,
      });

      expect(createResult.success).toBe(true);

      // 2. Modifier
      mockPrisma.utilisateurs.findUnique.mockResolvedValueOnce(
        mockUtilisateur1,
      );
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce(null);

      const mockTransactionUpdate = jest
        .fn()
        .mockImplementation(async (callback) => {
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

      mockPrisma.$transaction = mockTransactionUpdate;

      const updateResult = await service.modifierUtilisateur({
        id: 1,
        first_name: "Jean-Pierre",
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.utilisateur?.first_name).toBe("Jean-Pierre");

      // 3. Désactiver
      mockPrisma.utilisateurs.findUnique.mockResolvedValueOnce(
        mockUtilisateur1,
      );

      const mockTransactionDeactivate = jest
        .fn()
        .mockImplementation(async (callback) => {
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

      mockPrisma.$transaction = mockTransactionDeactivate;

      const deactivateResult = await service.desactiverUtilisateur({ id: 1 });

      expect(deactivateResult.success).toBe(true);

      // 4. Réactiver
      mockPrisma.utilisateurs.findUnique.mockResolvedValueOnce({
        ...mockUtilisateur1,
        active: false,
      });

      const mockTransactionReactivate = jest
        .fn()
        .mockImplementation(async (callback) => {
          const txMock = {
            utilisateurs: {
              update: jest.fn().mockResolvedValue({
                ...mockUtilisateur1,
                active: true,
              }),
            },
          };
          return callback(txMock);
        });

      mockPrisma.$transaction = mockTransactionReactivate;

      const reactivateResult = await service.reactiverUtilisateur({ id: 1 });

      expect(reactivateResult.success).toBe(true);
    });
  });

  describe("Scénario: Recherche et filtrage avancé", () => {
    it("devrait rechercher et filtrer les utilisateurs selon plusieurs critères", async () => {
      // Recherche par email partiel
      mockPrisma.utilisateurs.findMany.mockResolvedValueOnce([
        mockUtilisateur1,
        mockUtilisateur2,
      ]);

      const searchResult = await service.rechercherUtilisateursParEmail(
        "example.com",
        10,
      );

      expect(searchResult).toHaveLength(2);

      // Filtrage par genre et grade
      mockPrisma.utilisateurs.findMany.mockResolvedValueOnce([
        mockUtilisateur2AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(1);

      const filterResult = await service.obtenirUtilisateurs({
        genre_id: 2,
        grade_id: 4,
        actif: true,
      });

      expect(filterResult.utilisateurs).toHaveLength(1);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            genre_id: 2,
            grade_id: 4,
            active: true,
          }),
        }),
      );

      // Recherche par texte
      mockPrisma.utilisateurs.findMany.mockResolvedValueOnce([
        mockUtilisateur1AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(1);

      const textSearchResult = await service.rechercherUtilisateurs("Jean");

      expect(textSearchResult).toHaveLength(1);
    });
  });

  describe("Scénario: Statistiques complètes", () => {
    it("devrait récupérer les statistiques générales et individuelles", async () => {
      // Statistiques générales
      mockPrisma.utilisateurs.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(85) // actifs
        .mockResolvedValueOnce(10) // inactifs
        .mockResolvedValueOnce(5) // suspendus
        .mockResolvedValueOnce(12); // nouveaux 30 jours

      mockPrisma.utilisateurs.groupBy
        .mockResolvedValueOnce([
          { genre_id: 1, _count: { id: 55 } },
          { genre_id: 2, _count: { id: 45 } },
        ])
        .mockResolvedValueOnce([
          { grade_id: 1, _count: { id: 20 } },
          { grade_id: 3, _count: { id: 25 } },
        ])
        .mockResolvedValueOnce([
          { abonnement_id: 1, _count: { id: 60 } },
          { abonnement_id: 2, _count: { id: 40 } },
        ]);

      mockPrisma.genres.findMany.mockResolvedValue([
        mockGenreHomme,
        mockGenreFemme,
      ]);
      mockPrisma.grades.findMany.mockResolvedValue([mockGrade1, mockGrade3]);
      mockPrisma.abonnements.findMany.mockResolvedValue([
        mockAbonnement1,
        mockAbonnement2,
      ]);

      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        { date_of_birth: new Date("1995-01-01") },
        { date_of_birth: new Date("2000-01-01") },
        { date_of_birth: new Date("2010-01-01") },
      ]);

      const statsGenerales = await service.statistiquesGenerales();

      expect(statsGenerales.totalUtilisateurs).toBe(100);
      expect(statsGenerales.utilisateursActifs).toBe(85);
      expect(statsGenerales.repartitionParGenre).toHaveLength(2);
      expect(statsGenerales.repartitionParGrade).toHaveLength(2);
      expect(statsGenerales.repartitionParAbonnement).toHaveLength(2);

      // Statistiques individuelles
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        grades: mockGrade3,
      });

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ count: BigInt(24) }]) // cours inscrits
        .mockResolvedValueOnce([{ count: BigInt(22) }]) // cours assistés
        .mockResolvedValueOnce([{ date_cours: new Date("2024-03-01") }]) // dernier cours
        .mockResolvedValueOnce([{ date_cours: new Date("2024-03-15") }]); // prochain cours

      mockPrisma.grades.findFirst.mockResolvedValue(mockGrade4);

      const statsUtilisateur = await service.statistiquesUtilisateur(1);

      expect(statsUtilisateur.utilisateurId).toBe(1);
      expect(statsUtilisateur.nombreCoursInscrits).toBe(24);
      expect(statsUtilisateur.nombreCoursAssistes).toBe(22);
      expect(statsUtilisateur.tauxPresence).toBeGreaterThan(0);
      expect(statsUtilisateur.progression).toBeDefined();
    });
  });

  describe("Scénario: Gestion des erreurs en cascade", () => {
    it("devrait gérer les erreurs lors d'opérations multiples", async () => {
      // Tentative de connexion avec un utilisateur inexistant
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

      const loginResult = await service.validerConnexion({
        email: "inexistant@example.com",
        password: "password",
      });

      expect(loginResult.success).toBe(false);

      // Tentative de modification d'un utilisateur inexistant
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        service.modifierUtilisateur({ id: 999, first_name: "Test" }),
      ).rejects.toThrow(UtilisateursError);

      // Tentative de création avec email existant
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

      await expect(
        service.creerUtilisateur({
          first_name: "Test",
          last_name: "User",
          email: "jean.dupont@example.com",
          date_of_birth: new Date("1990-01-01"),
        }),
      ).rejects.toThrow(UtilisateursError);
    });
  });

  describe("Scénario: Pagination et performance", () => {
    it("devrait gérer la pagination efficacement", async () => {
      const mockUtilisateurs = Array.from({ length: 100 }, (_, i) => ({
        ...mockUtilisateur1AvecRelations,
        id: i + 1,
        email: `user${i + 1}@example.com`,
      }));

      // Page 1
      mockPrisma.utilisateurs.findMany.mockResolvedValueOnce(
        mockUtilisateurs.slice(0, 20),
      );
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(100);

      const page1 = await service.obtenirUtilisateurs({ limit: 20, offset: 0 });

      expect(page1.utilisateurs).toHaveLength(20);
      expect(page1.total).toBe(100);
      expect(page1.hasMore).toBe(true);

      // Page 2
      mockPrisma.utilisateurs.findMany.mockResolvedValueOnce(
        mockUtilisateurs.slice(20, 40),
      );
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(100);

      const page2 = await service.obtenirUtilisateurs({
        limit: 20,
        offset: 20,
      });

      expect(page2.utilisateurs).toHaveLength(20);
      expect(page2.hasMore).toBe(true);

      // Dernière page
      mockPrisma.utilisateurs.findMany.mockResolvedValueOnce(
        mockUtilisateurs.slice(80, 100),
      );
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(100);

      const lastPage = await service.obtenirUtilisateurs({
        limit: 20,
        offset: 80,
      });

      expect(lastPage.utilisateurs).toHaveLength(20);
      expect(lastPage.hasMore).toBe(false);
    });
  });

  describe("Scénario: Vérifications multiples", () => {
    it("devrait effectuer plusieurs vérifications en séquence", async () => {
      const email = "test@example.com";

      // Vérifier que l'email n'existe pas
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce(null);

      const checkEmail = await service.verifierEmailExiste(email);
      expect(checkEmail.existe).toBe(false);

      // Vérifier l'existence de l'utilisateur
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce(null);

      const checkUser = await service.verifierUtilisateurExiste(email);
      expect(checkUser.existe).toBe(false);
      expect(checkUser.canRegister).toBe(true);

      // Compter les utilisateurs
      mockPrisma.utilisateurs.count.mockResolvedValue(100);

      const count = await service.compterUtilisateurs();
      expect(count).toBe(100);

      // Compter les utilisateurs actifs
      mockPrisma.utilisateurs.count.mockResolvedValue(85);

      const activeCount = await service.compterUtilisateursActifs();
      expect(activeCount).toBe(85);
    });
  });

  describe("Scénario: Connexion par différentes méthodes", () => {
    it("devrait se connecter via email et userId", async () => {
      // Connexion par email
      const hashedPassword = await bcrypt.hash("password123", 10);
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce({
        ...mockUtilisateur1,
        password: hashedPassword,
      });

      const loginEmail = await service.validerConnexion({
        email: "jean.dupont@example.com",
        password: "password123",
      });

      expect(loginEmail.success).toBe(true);
      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "jean.dupont@example.com" },
        }),
      );

      // Connexion par userId
      mockPrisma.utilisateurs.findFirst.mockResolvedValueOnce({
        ...mockUtilisateur1,
        password: hashedPassword,
      });

      const loginUserId = await service.validerConnexionParUserId({
        userId: "jean.dupont.950315",
        password: "password123",
      });

      expect(loginUserId.success).toBe(true);
      expect(mockPrisma.utilisateurs.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "jean.dupont.950315" },
        }),
      );
    });
  });

  describe("Scénario: Obtenir informations complètes", () => {
    it("devrait récupérer toutes les informations d'un utilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      const result = await service.obtenirInformationsCompletes(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.genre).toBeDefined();
      expect(result?.grade).toBeDefined();
      expect(result?.abonnement).toBeDefined();
      expect(result?.status).toBeDefined();
      expect(result?.age).toBeDefined();
      expect(result?.initiales).toBeDefined();
    });

    it("devrait retourner null si utilisateur inexistant", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await service.obtenirInformationsCompletes(999);

      expect(result).toBeNull();
    });
  });
});
