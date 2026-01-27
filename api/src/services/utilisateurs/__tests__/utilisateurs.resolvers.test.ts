/**
 * Tests des resolvers GraphQL pour le service Utilisateurs
 */

import {
  jest,
  describe,
  beforeEach,
  beforeAll,
  it,
  expect,
} from "@jest/globals";
import { utilisateursResolvers } from "../utilisateurs.resolvers.js";
import { UtilisateursError } from "@clubmanager/types";
import { GraphQLError } from "graphql";
import bcrypt from "bcrypt";
import {
  createMockPrisma,
  mockUtilisateur1,
  mockUtilisateur2,
  mockUtilisateur1AvecRelations,
  mockUtilisateur2AvecRelations,
  mockUtilisateurInactif,
  mockStatistiquesUtilisateurs,
  mockStatistiquesUtilisateur,
  initializePasswordHashes,
} from "./utilisateurs.mock.js";

describe("UtilisateursResolvers - Tests", () => {
  let mockPrisma: any;
  let resolvers: any;

  beforeAll(async () => {
    // Attendre que les hash de mots de passe soient initialisés
    await initializePasswordHashes();
  });

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    resolvers = utilisateursResolvers(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe("Query Resolvers", () => {
    describe("obtenirUtilisateurs", () => {
      it("devrait retourner la liste des utilisateurs", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1AvecRelations,
          mockUtilisateur2AvecRelations,
        ]);
        mockPrisma.utilisateurs.count.mockResolvedValue(2);

        const result = await resolvers.Query.obtenirUtilisateurs(null, {
          limit: 10,
          offset: 0,
        });

        expect(result.utilisateurs).toHaveLength(2);
        expect(result.total).toBe(2);
      });

      it("devrait passer les filtres correctement", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1AvecRelations,
        ]);
        mockPrisma.utilisateurs.count.mockResolvedValue(1);

        await resolvers.Query.obtenirUtilisateurs(null, {
          status_id: 1,
          genre_id: 1,
          grade_id: 3,
          recherche: "Jean",
          actif: true,
        });

        expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
      });

      it("devrait gérer les erreurs UtilisateursError", async () => {
        mockPrisma.utilisateurs.findMany.mockRejectedValue(
          new UtilisateursError("Erreur test", "TEST_ERROR"),
        );

        await expect(
          resolvers.Query.obtenirUtilisateurs(null, {}),
        ).rejects.toThrow(GraphQLError);
      });

      it("devrait propager les autres erreurs", async () => {
        mockPrisma.utilisateurs.findMany.mockRejectedValue(
          new Error("Erreur générique"),
        );

        await expect(
          resolvers.Query.obtenirUtilisateurs(null, {}),
        ).rejects.toThrow(Error);
      });
    });

    describe("obtenirUtilisateurParId", () => {
      it("devrait retourner un utilisateur par son ID", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(
          mockUtilisateur1AvecRelations,
        );

        const result = await resolvers.Query.obtenirUtilisateurParId(null, {
          id: 1,
        });

        expect(result.id).toBe(1);
        expect(result.first_name).toBe("Jean");
      });

      it("devrait lancer une erreur si utilisateur non trouvé", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        await expect(
          resolvers.Query.obtenirUtilisateurParId(null, { id: 999 }),
        ).rejects.toThrow(GraphQLError);
      });

      it("devrait gérer les erreurs UtilisateursError", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        await expect(
          resolvers.Query.obtenirUtilisateurParId(null, { id: 999 }),
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe("obtenirUtilisateurParEmail", () => {
      it("devrait retourner un utilisateur par son email", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(
          mockUtilisateur1AvecRelations,
        );

        const result = await resolvers.Query.obtenirUtilisateurParEmail(null, {
          email: "jean.dupont@example.com",
        });

        expect(result.email).toBe("jean.dupont@example.com");
      });

      it("devrait lancer une erreur si utilisateur non trouvé", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        await expect(
          resolvers.Query.obtenirUtilisateurParEmail(null, {
            email: "inexistant@example.com",
          }),
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe("rechercherUtilisateursParEmail", () => {
      it("devrait rechercher des utilisateurs par email", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1,
          mockUtilisateur2,
        ]);

        const result = await resolvers.Query.rechercherUtilisateursParEmail(
          null,
          {
            email: "example.com",
            limit: 10,
          },
        );

        expect(result).toHaveLength(2);
      });

      it("devrait utiliser la limite par défaut", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

        await resolvers.Query.rechercherUtilisateursParEmail(null, {
          email: "test",
        });

        expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
      });
    });

    describe("utilisateurExiste", () => {
      it("devrait retourner true si utilisateur existe", async () => {
        mockPrisma.utilisateurs.count.mockResolvedValue(1);

        const result = await resolvers.Query.utilisateurExiste(null, { id: 1 });

        expect(result).toBe(true);
      });

      it("devrait retourner false si utilisateur n'existe pas", async () => {
        mockPrisma.utilisateurs.count.mockResolvedValue(0);

        const result = await resolvers.Query.utilisateurExiste(null, {
          id: 999,
        });

        expect(result).toBe(false);
      });
    });

    describe("verifierEmailExiste", () => {
      it("devrait vérifier si un email existe", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        const result = await resolvers.Query.verifierEmailExiste(null, {
          email: "jean.dupont@example.com",
        });

        expect(result.existe).toBe(true);
        expect(result.utilisateurId).toBe(1);
      });

      it("devrait retourner false si email n'existe pas", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const result = await resolvers.Query.verifierEmailExiste(null, {
          email: "inexistant@example.com",
        });

        expect(result.existe).toBe(false);
      });
    });

    describe("verifierUtilisateurExiste", () => {
      it("devrait vérifier si un utilisateur peut s'inscrire", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const result = await resolvers.Query.verifierUtilisateurExiste(null, {
          email: "nouveau@example.com",
        });

        expect(result.existe).toBe(false);
        expect(result.canRegister).toBe(true);
      });

      it("devrait indiquer qu'un utilisateur ne peut pas s'inscrire", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        const result = await resolvers.Query.verifierUtilisateurExiste(null, {
          email: "jean.dupont@example.com",
        });

        expect(result.existe).toBe(true);
        expect(result.canRegister).toBe(false);
      });
    });

    describe("estProfesseur", () => {
      it("devrait vérifier si un utilisateur est professeur", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({ status_id: 5 });

        const result = await resolvers.Query.estProfesseur(null, {
          utilisateurId: 6,
        });

        expect(result).toBe(true);
      });

      it("devrait retourner false si non professeur", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue({ status_id: 1 });

        const result = await resolvers.Query.estProfesseur(null, {
          utilisateurId: 1,
        });

        expect(result).toBe(false);
      });
    });

    describe("compterUtilisateurs", () => {
      it("devrait compter tous les utilisateurs", async () => {
        mockPrisma.utilisateurs.count.mockResolvedValue(100);

        const result = await resolvers.Query.compterUtilisateurs();

        expect(result).toBe(100);
      });
    });

    describe("compterUtilisateursActifs", () => {
      it("devrait compter les utilisateurs actifs", async () => {
        mockPrisma.utilisateurs.count.mockResolvedValue(85);

        const result = await resolvers.Query.compterUtilisateursActifs();

        expect(result).toBe(85);
      });
    });

    describe("statistiquesUtilisateurs", () => {
      it("devrait retourner les statistiques générales", async () => {
        mockPrisma.utilisateurs.count.mockResolvedValue(100);
        mockPrisma.utilisateurs.groupBy.mockResolvedValue([]);
        mockPrisma.genres.findMany.mockResolvedValue([]);
        mockPrisma.grades.findMany.mockResolvedValue([]);
        mockPrisma.abonnements.findMany.mockResolvedValue([]);
        mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

        const result = await resolvers.Query.statistiquesUtilisateurs();

        expect(result.totalUtilisateurs).toBeDefined();
      });

      it("devrait gérer les erreurs", async () => {
        mockPrisma.utilisateurs.count.mockRejectedValue(new Error("DB Error"));

        await expect(
          resolvers.Query.statistiquesUtilisateurs(),
        ).rejects.toThrow();
      });
    });

    describe("statistiquesUtilisateur", () => {
      it("devrait retourner les statistiques d'un utilisateur", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);
        mockPrisma.$queryRaw
          .mockResolvedValueOnce([{ count: BigInt(24) }])
          .mockResolvedValueOnce([{ count: BigInt(22) }])
          .mockResolvedValueOnce([{ date_cours: new Date() }])
          .mockResolvedValueOnce([{ date_cours: new Date() }]);

        const result = await resolvers.Query.statistiquesUtilisateur(null, {
          utilisateurId: 1,
        });

        expect(result.utilisateurId).toBe(1);
      });
    });

    describe("rechercherUtilisateurs", () => {
      it("devrait rechercher des utilisateurs", async () => {
        mockPrisma.utilisateurs.findMany.mockResolvedValue([
          mockUtilisateur1AvecRelations,
        ]);
        mockPrisma.utilisateurs.count.mockResolvedValue(1);

        const result = await resolvers.Query.rechercherUtilisateurs(null, {
          recherche: "Jean",
        });

        expect(result).toHaveLength(1);
      });
    });

    describe("obtenirInformationsCompletes", () => {
      it("devrait retourner les informations complètes", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(
          mockUtilisateur1AvecRelations,
        );

        const result = await resolvers.Query.obtenirInformationsCompletes(
          null,
          {
            utilisateurId: 1,
          },
        );

        expect(result.id).toBe(1);
      });

      it("devrait lancer une erreur si utilisateur non trouvé", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        await expect(
          resolvers.Query.obtenirInformationsCompletes(null, {
            utilisateurId: 999,
          }),
        ).rejects.toThrow(GraphQLError);
      });
    });
  });

  describe("Mutation Resolvers", () => {
    describe("creerUtilisateur", () => {
      it("devrait créer un nouvel utilisateur", async () => {
        const input = {
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          date_of_birth: new Date("1990-01-01"),
        };

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

        const result = await resolvers.Mutation.creerUtilisateur(null, {
          input,
        });

        expect(result.success).toBe(true);
      });

      it("devrait gérer les erreurs UtilisateursError", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        await expect(
          resolvers.Mutation.creerUtilisateur(null, {
            input: {
              first_name: "Test",
              last_name: "User",
              email: "jean.dupont@example.com",
              date_of_birth: new Date("1990-01-01"),
            },
          }),
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe("modifierUtilisateur", () => {
      it("devrait modifier un utilisateur", async () => {
        const input = {
          id: 1,
          first_name: "Jean-Modifié",
        };

        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

        const mockTransaction = jest
          .fn()
          .mockImplementation(async (callback) => {
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

        const result = await resolvers.Mutation.modifierUtilisateur(null, {
          input,
        });

        expect(result.success).toBe(true);
      });

      it("devrait gérer les erreurs", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        await expect(
          resolvers.Mutation.modifierUtilisateur(null, {
            input: { id: 999, first_name: "Test" },
          }),
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe("desactiverUtilisateur", () => {
      it("devrait désactiver un utilisateur", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur1);

        const mockTransaction = jest
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

        mockPrisma.$transaction = mockTransaction;

        const result = await resolvers.Mutation.desactiverUtilisateur(null, {
          id: 1,
          motif: "Test",
        });

        expect(result.success).toBe(true);
      });

      it("devrait gérer les erreurs", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        await expect(
          resolvers.Mutation.desactiverUtilisateur(null, { id: 999 }),
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe("reactiverUtilisateur", () => {
      it("devrait réactiver un utilisateur", async () => {
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

        const result = await resolvers.Mutation.reactiverUtilisateur(null, {
          id: 4,
        });

        expect(result.success).toBe(true);
      });

      it("devrait gérer les erreurs", async () => {
        mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

        await expect(
          resolvers.Mutation.reactiverUtilisateur(null, { id: 999 }),
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe("validerConnexion", () => {
      it("devrait valider une connexion correcte", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        const result = await resolvers.Mutation.validerConnexion(null, {
          email: "jean.dupont@example.com",
          password: "password123",
        });

        expect(result.success).toBe(true);
      });

      it("devrait rejeter une connexion incorrecte", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const result = await resolvers.Mutation.validerConnexion(null, {
          email: "inexistant@example.com",
          password: "password",
        });

        expect(result.success).toBe(false);
      });

      it("devrait gérer les erreurs", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(
          mockUtilisateurInactif,
        );

        await expect(
          resolvers.Mutation.validerConnexion(null, {
            email: "pierre.durand@example.com",
            password: "password",
          }),
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe("validerConnexionParUserId", () => {
      it("devrait valider une connexion par userId", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(mockUtilisateur1);

        const result = await resolvers.Mutation.validerConnexionParUserId(
          null,
          {
            userId: "jean.dupont.950315",
            password: "password123",
          },
        );

        expect(result.success).toBe(true);
      });

      it("devrait rejeter avec userId inexistant", async () => {
        mockPrisma.utilisateurs.findFirst.mockResolvedValue(null);

        const result = await resolvers.Mutation.validerConnexionParUserId(
          null,
          {
            userId: "inexistant.user.000000",
            password: "password",
          },
        );

        expect(result.success).toBe(false);
      });
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait convertir UtilisateursError en GraphQLError", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      try {
        await resolvers.Query.obtenirUtilisateurParId(null, { id: 999 });
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
      }
    });

    it("devrait propager les erreurs non-UtilisateursError", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Generic error"),
      );

      await expect(
        resolvers.Query.obtenirUtilisateurs(null, {}),
      ).rejects.toThrow(Error);
    });

    it("devrait gérer les erreurs dans les mutations", async () => {
      mockPrisma.utilisateurs.findUnique.mockRejectedValue(
        new Error("DB Error"),
      );

      await expect(
        resolvers.Mutation.modifierUtilisateur(null, {
          input: { id: 1, first_name: "Test" },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Resolvers par défaut", () => {
    it("devrait exporter des resolvers par défaut", async () => {
      const { utilisateursResolversDefault } =
        await import("../utilisateurs.resolvers.js");

      expect(utilisateursResolversDefault).toBeDefined();
      expect(utilisateursResolversDefault.Query).toBeDefined();
      expect(utilisateursResolversDefault.Mutation).toBeDefined();
    });
  });
});
