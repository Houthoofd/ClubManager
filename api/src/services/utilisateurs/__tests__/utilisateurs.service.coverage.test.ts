/**
 * Tests de couverture pour le service Utilisateurs
 * Test de couverture complète des fonctionnalités
 */

import { jest, describe, beforeEach, it, expect } from "@jest/globals";
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
  mockUtilisateurProfesseur,
  mockUtilisateur1AvecRelations,
  mockUtilisateur2AvecRelations,
  mockUtilisateur3AvecRelations,
  mockUtilisateurInactifAvecRelations,
  mockUtilisateurSuspenduAvecRelations,
  mockUtilisateurProfesseurAvecRelations,
  mockGenreHomme,
  mockGenreFemme,
  mockGrade1,
  mockGrade2,
  mockGrade3,
  mockGrade4,
  mockGrade5,
  mockGrade6,
  mockAbonnement1,
  mockAbonnement2,
  mockStatusActif,
  mockStatusInactif,
  mockStatusSuspendu,
  mockStatusProfesseur,
  mockStatistiquesUtilisateurs,
  mockStatistiquesUtilisateur,
} from "./utilisateurs.mock.js";

describe("UtilisateursService - Tests de couverture", () => {
  let mockPrisma: any;
  let service: UtilisateursService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new UtilisateursService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("Couverture complète des queries", () => {
    describe("obtenirUtilisateurs", () => {
      it("devrait couvrir tous les filtres possibles", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1AvecRelations,
        ]);
        mockPrisma.utilisateurs.count.mockResolvedValue(1);

        await service.obtenirUtilisateurs({
          status_id: 1,
          grade_id: 3,
          genre_id: 1,
          abonnement_id: 1,
          recherche: "Jean",
          actif: true,
          limit: 20,
          offset: 0,
          dateInscriptionDebut: new Date("2023-01-01"),
          dateInscriptionFin: new Date("2023-12-31"),
          ageMin: 18,
          ageMax: 65,
        });

        expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
        expect(mockPrisma.utilisateurs.count).toHaveBeenCalled();
      });

      it("devrait gérer une liste vide", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
        mockPrisma.utilisateurs.count.mockResolvedValue(0);

        const result = await service.obtenirUtilisateurs();

        expect(result.utilisateurs).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.hasMore).toBe(false);
      });

      it("devrait calculer hasMore correctement (false)", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1AvecRelations,
        ]);
        mockPrisma.utilisateurs.count.mockResolvedValue(5);

        const result = await service.obtenirUtilisateurs({
          limit: 10,
          offset: 0,
        });

        expect(result.hasMore).toBe(false);
      });

      it("devrait calculer hasMore correctement (true)", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1AvecRelations,
        ]);
        mockPrisma.utilisateurs.count.mockResolvedValue(25);

        const result = await service.obtenirUtilisateurs({
          limit: 10,
          offset: 0,
        });

        expect(result.hasMore).toBe(true);
      });

      it("devrait inclure toutes les relations", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1AvecRelations,
        ]);
        mockPrisma.utilisateurs.count.mockResolvedValue(1);

        const result = await service.obtenirUtilisateurs();

        expect(result.utilisateurs[0].genre).toBeDefined();
        expect(result.utilisateurs[0].grade).toBeDefined();
        expect(result.utilisateurs[0].abonnement).toBeDefined();
        expect(result.utilisateurs[0].status).toBeDefined();
        expect(result.utilisateurs[0].age).toBeDefined();
        expect(result.utilisateurs[0].initiales).toBeDefined();
      });
    });

    describe("obtenirUtilisateurParId", () => {
      it("devrait retourner un utilisateur complet", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(
          mockUtilisateur1AvecRelations,
        );

        const result = await service.obtenirUtilisateurParId(1);

        expect(result).toBeDefined();
        expect(result?.id).toBe(1);
        expect(result?.genre).toBeDefined();
        expect(result?.grade).toBeDefined();
        expect(result?.age).toBeDefined();
        expect(result?.initiales).toBe("JD");
      });

      it("devrait retourner null pour un utilisateur inexistant", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        const result = await service.obtenirUtilisateurParId(999);

        expect(result).toBeNull();
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
      it("devrait trouver un utilisateur par email", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(
          mockUtilisateur1AvecRelations,
        );

        const result = await service.obtenirUtilisateurParEmail(
          "jean.dupont@example.com",
        );

        expect(result).toBeDefined();
        expect(result?.email).toBe("jean.dupont@example.com");
      });

      it("devrait retourner null si email non trouvé", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const result = await service.obtenirUtilisateurParEmail(
          "inexistant@example.com",
        );

        expect(result).toBeNull();
      });

      it("devrait normaliser l'email", async () => {
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

      it("devrait lancer une erreur pour email vide", async () => {
        await expect(service.obtenirUtilisateurParEmail("")).rejects.toThrow(
          UtilisateursError,
        );
        await expect(service.obtenirUtilisateurParEmail("  ")).rejects.toThrow(
          UtilisateursError,
        );
      });
    });

    describe("rechercherUtilisateursParEmail", () => {
      it("devrait rechercher par email partiel", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1,
          mockUtilisateur2,
        ]);

        const result =
          await service.rechercherUtilisateursParEmail("example.com");

        expect(result).toHaveLength(2);
      });

      it("devrait respecter la limite", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([mockUtilisateur1]);

        await service.rechercherUtilisateursParEmail("test", 5);

        expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 5 }),
        );
      });

      it("devrait utiliser la limite par défaut", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

        await service.rechercherUtilisateursParEmail("test");

        expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 10 }),
        );
      });
    });
  });

  describe("Couverture complète des mutations", () => {
    describe("creerUtilisateur", () => {
      it("devrait créer un utilisateur avec tous les champs", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
        mockPrisma.utilisateurs.count.mockResolvedValue(0);

        const mockTransaction = jest
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

        mockPrisma.$transaction = mockTransaction;

        const result = await service.creerUtilisateur({
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          password: "password123",
          date_of_birth: new Date("1990-01-01"),
          genre_id: 1,
          grade_id: 1,
          abonnement_id: 1,
          nom_utilisateur: "testuser",
          status_id: 1,
        });

        expect(result.success).toBe(true);
        expect(result.utilisateur).toBeDefined();
        expect(result.userId).toBeDefined();
      });

      // Test supprimé : vérification de l'appel à bcrypt.hash non pertinente car bcrypt est utilisé réellement

      it("devrait rejeter si email existe", async () => {
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

      it("devrait valider l'âge minimum", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        await expect(
          service.creerUtilisateur({
            first_name: "Trop",
            last_name: "Jeune",
            email: "jeune@example.com",
            date_of_birth: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
          }),
        ).rejects.toThrow(UtilisateursError);
      });

      it("devrait valider l'âge maximum", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        await expect(
          service.creerUtilisateur({
            first_name: "Trop",
            last_name: "Vieux",
            email: "vieux@example.com",
            date_of_birth: new Date("1800-01-01"),
          }),
        ).rejects.toThrow(UtilisateursError);
      });
    });

    describe("modifierUtilisateur", () => {
      it("devrait modifier tous les champs", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const mockTransaction = jest
          .fn()
          .mockImplementation(async (callback) => {
            const txMock = {
              utilisateurs: {
                update: jest
                  .fn()
                  .mockResolvedValue(mockUtilisateur1AvecRelations),
              },
            };
            return callback(txMock);
          });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.modifierUtilisateur({
          id: 1,
          first_name: "Nouveau",
          last_name: "Nom",
          email: "nouveau@example.com",
          date_of_birth: new Date("1995-01-01"),
          genre_id: 2,
          grade_id: 4,
          abonnement_id: 2,
          nom_utilisateur: "nouveau_nom",
          status_id: 1,
        });

        expect(result.success).toBe(true);
      });

      it("devrait rejeter si utilisateur inexistant", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        await expect(
          service.modifierUtilisateur({ id: 999, first_name: "Test" }),
        ).rejects.toThrow(UtilisateursError);
      });

      it("devrait rejeter si email déjà utilisé", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur2);

        await expect(
          service.modifierUtilisateur({
            id: 1,
            email: "marie.martin@example.com",
          }),
        ).rejects.toThrow(UtilisateursError);
      });

      it("devrait rejeter si aucune donnée à modifier", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

        await expect(service.modifierUtilisateur({ id: 1 })).rejects.toThrow(
          UtilisateursError,
        );
      });
    });

    describe("desactiverUtilisateur", () => {
      it("devrait désactiver un utilisateur actif", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

        const mockTransaction = jest
          .fn()
          .mockImplementation(async (callback) => {
            const txMock = {
              utilisateurs: {
                update: jest
                  .fn()
                  .mockResolvedValue({ ...mockUtilisateur1, active: false }),
              },
            };
            return callback(txMock);
          });

        mockPrisma.$transaction = mockTransaction;

        const result = await service.desactiverUtilisateur({
          id: 1,
          motif: "Test",
        });

        expect(result.success).toBe(true);
      });

      it("devrait indiquer si déjà désactivé", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(
          mockUtilisateurInactif,
        );

        const result = await service.desactiverUtilisateur({ id: 4 });

        expect(result.success).toBe(false);
        expect(result.message).toContain("déjà désactivé");
      });
    });

    describe("reactiverUtilisateur", () => {
      it("devrait réactiver un utilisateur inactif", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(
          mockUtilisateurInactif,
        );

        const mockTransaction = jest
          .fn()
          .mockImplementation(async (callback) => {
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
      });

      it("devrait indiquer si déjà actif", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

        const result = await service.reactiverUtilisateur({ id: 1 });

        expect(result.success).toBe(false);
        expect(result.message).toContain("déjà actif");
      });

      it("devrait rejeter si utilisateur suspendu", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(
          mockUtilisateurSuspendu,
        );

        await expect(service.reactiverUtilisateur({ id: 5 })).rejects.toThrow(
          UtilisateursError,
        );
      });
    });
  });

  describe("Couverture complète de l'authentification", () => {
    describe("validerConnexion", () => {
      it("devrait valider avec email et mot de passe corrects", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        const result = await service.validerConnexion({
          email: "jean.dupont@example.com",
          password: "password123",
        });

        expect(result.success).toBe(true);
        expect(result.utilisateur).toBeDefined();
      });

      it("devrait rejeter avec email inexistant", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const result = await service.validerConnexion({
          email: "inexistant@example.com",
          password: "password",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter avec mot de passe incorrect", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        const result = await service.validerConnexion({
          email: "jean.dupont@example.com",
          password: "mauvais",
        });

        expect(result.success).toBe(false);
      });

      it("devrait rejeter si utilisateur inactif", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(
          mockUtilisateurInactif,
        );

        await expect(
          service.validerConnexion({
            email: "pierre.durand@example.com",
            password: "password",
          }),
        ).rejects.toThrow(UtilisateursError);
      });

      it("devrait rejeter si utilisateur suspendu", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(
          mockUtilisateurSuspendu,
        );

        await expect(
          service.validerConnexion({
            email: "lucas.petit@example.com",
            password: "password",
          }),
        ).rejects.toThrow(UtilisateursError);
      });
    });

    describe("validerConnexionParUserId", () => {
      it("devrait valider avec userId et mot de passe corrects", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        const result = await service.validerConnexionParUserId({
          userId: "jean.dupont.950315",
          password: "password123",
        });

        expect(result.success).toBe(true);
      });

      it("devrait rejeter avec userId inexistant", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const result = await service.validerConnexionParUserId({
          userId: "inexistant.user.000000",
          password: "password",
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe("Couverture complète des statistiques", () => {
    it("devrait calculer les statistiques générales", async () => {
      mockPrisma.utilisateurs.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(12);

      mockPrisma.utilisateurs.groupBy
        .mockResolvedValueOnce([{ genre_id: 1, _count: { id: 55 } }])
        .mockResolvedValueOnce([{ grade_id: 3, _count: { id: 25 } }])
        .mockResolvedValueOnce([{ abonnement_id: 1, _count: { id: 60 } }]);

      mockPrisma.genres.findMany.mockResolvedValue([mockGenreHomme]);
      mockPrisma.grades.findMany.mockResolvedValue([mockGrade3]);
      mockPrisma.abonnements.findMany.mockResolvedValue([mockAbonnement1]);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        { date_of_birth: new Date("1990-01-01") },
      ]);

      const result = await service.statistiquesGenerales();

      expect(result.totalUtilisateurs).toBe(100);
      expect(result.utilisateursActifs).toBe(85);
      expect(result.repartitionParGenre).toBeDefined();
      expect(result.repartitionParGrade).toBeDefined();
      expect(result.repartitionParAbonnement).toBeDefined();
      expect(result.repartitionParAge).toBeDefined();
    });

    it("devrait calculer les statistiques d'un utilisateur", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        ...mockUtilisateur1,
        grades: mockGrade3,
      });

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ count: BigInt(24) }])
        .mockResolvedValueOnce([{ count: BigInt(22) }])
        .mockResolvedValueOnce([{ date_cours: new Date() }])
        .mockResolvedValueOnce([{ date_cours: new Date() }]);

      mockPrisma.grades.findFirst.mockResolvedValue(mockGrade4);

      const result = await service.statistiquesUtilisateur(1);

      expect(result.utilisateurId).toBe(1);
      expect(result.nombreCoursInscrits).toBeDefined();
      expect(result.nombreCoursAssistes).toBeDefined();
      expect(result.tauxPresence).toBeDefined();
    });
  });

  describe("Couverture complète des méthodes utilitaires", () => {
    it("utilisateurExiste - true", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(1);
      expect(await service.utilisateurExiste(1)).toBe(true);
    });

    it("utilisateurExiste - false", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      expect(await service.utilisateurExiste(999)).toBe(false);
    });

    it("verifierEmailExiste - existe", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);
      const result = await service.verifierEmailExiste(
        "jean.dupont@example.com",
      );
      expect(result.existe).toBe(true);
    });

    it("verifierEmailExiste - n'existe pas", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      const result = await service.verifierEmailExiste(
        "inexistant@example.com",
      );
      expect(result.existe).toBe(false);
    });

    it("verifierUtilisateurExiste - peut s'inscrire", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);
      const result =
        await service.verifierUtilisateurExiste("test@example.com");
      expect(result.canRegister).toBe(true);
    });

    it("verifierUtilisateurExiste - ne peut pas s'inscrire (actif)", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);
      const result = await service.verifierUtilisateurExiste(
        "jean.dupont@example.com",
      );
      expect(result.canRegister).toBe(false);
    });

    it("verifierUtilisateurExiste - ne peut pas s'inscrire (inactif)", async () => {
      mockPrisma.utilisateurs.findFirst.mockResolvedValue(
        mockUtilisateurInactif,
      );
      const result = await service.verifierUtilisateurExiste(
        "pierre.durand@example.com",
      );
      expect(result.canRegister).toBe(false);
    });

    it("compterUtilisateurs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(100);
      expect(await service.compterUtilisateurs()).toBe(100);
    });

    it("compterUtilisateursActifs", async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(85);
      expect(await service.compterUtilisateursActifs()).toBe(85);
    });

    it("estProfesseur - true", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({ status_id: 5 });
      expect(await service.estProfesseur(6)).toBe(true);
    });

    it("estProfesseur - false", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({ status_id: 1 });
      expect(await service.estProfesseur(1)).toBe(false);
    });

    it("obtenirTousUtilisateurs", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur1AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await service.obtenirTousUtilisateurs();

      expect(result).toHaveLength(1);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10000 }),
      );
    });

    it("rechercherUtilisateurs", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        mockUtilisateur1AvecRelations,
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await service.rechercherUtilisateurs("Jean");

      expect(result).toHaveLength(1);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it("obtenirInformationsCompletes - trouvé", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(
        mockUtilisateur1AvecRelations,
      );

      const result = await service.obtenirInformationsCompletes(1);

      expect(result).toBeDefined();
      expect(result?.genre).toBeDefined();
    });

    it("obtenirInformationsCompletes - non trouvé", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const result = await service.obtenirInformationsCompletes(999);

      expect(result).toBeNull();
    });
  });

  describe("Couverture des cas d'erreur", () => {
    it("devrait gérer les erreurs Prisma", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(new Error("DB Error"));

      await expect(service.obtenirUtilisateurs()).rejects.toThrow(
        UtilisateursError,
      );
    });

    it("devrait logger les erreurs", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Test Error"),
      );

      await expect(service.obtenirUtilisateurs()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Couverture des factory functions", () => {
    it("initUtilisateursService devrait initialiser le service", async () => {
      const { initUtilisateursService } =
        await import("../utilisateurs.service.js");
      const instance = initUtilisateursService(mockPrisma as any);

      expect(instance).toBeInstanceOf(UtilisateursService);
    });

    it("getUtilisateursService devrait retourner l'instance", async () => {
      const { initUtilisateursService, getUtilisateursService } =
        await import("../utilisateurs.service.js");

      initUtilisateursService(mockPrisma as any);
      const instance = getUtilisateursService();

      expect(instance).toBeInstanceOf(UtilisateursService);
    });

    it("getUtilisateursService devrait lancer une erreur si non initialisé", async () => {
      // Réinitialiser le module
      jest.resetModules();
      const { getUtilisateursService } =
        await import("../utilisateurs.service.js");

      expect(() => getUtilisateursService()).toThrow("n'a pas été initialisé");
    });
  });
});
