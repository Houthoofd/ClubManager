/**
 * Tests GraphQL pour le module Vérification
 * Teste les resolvers GraphQL avec mocks
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { verificationResolvers } from "../core/resolvers/verification.resolvers.js";

// Mock Prisma
const mockPrisma = {
  utilisateurs: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
    count: jest.fn() as jest.MockedFunction<any>,
  },
  cours_recurrent: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
  },
  articles: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
  },
  professeurs: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
  },
} as unknown as PrismaClient;

describe("Vérification Module - Tests GraphQL", () => {
  let resolvers: ReturnType<typeof verificationResolvers>;

  beforeEach(() => {
    jest.clearAllMocks();
    resolvers = verificationResolvers(mockPrisma);
  });

  describe("Query: verificationHealth", () => {
    it("devrait retourner le statut de santé", async () => {
      (mockPrisma.utilisateurs.count as jest.Mock).mockResolvedValue(10);

      const result = await resolvers.Query.verificationHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe("healthy");
      expect(result.checks).toHaveProperty("database");
      expect(result.checks).toHaveProperty("verification");
      expect(result.checks.database).toBe(true);
      expect(result.checks.verification).toBe(true);
    });

    it("devrait retourner unhealthy si la base de données est inaccessible", async () => {
      (mockPrisma.utilisateurs.count as jest.Mock).mockRejectedValue(
        new Error("Connection failed"),
      );

      const result = await resolvers.Query.verificationHealth();

      expect(result.status).toBe("unhealthy");
      expect(result.checks.database).toBe(false);
    });
  });

  describe("Query: verifierEmail", () => {
    it("devrait vérifier qu'un email existe", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        active: true,
      });

      const result = await resolvers.Query.verifierEmail(null, {
        email: "test@example.com",
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Email déjà utilisé.");
    });

    it("devrait indiquer qu'un email est disponible", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await resolvers.Query.verifierEmail(null, {
        email: "nouveau@example.com",
      });

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Email disponible.");
    });

    it("devrait lancer une erreur si l'email est manquant", async () => {
      await expect(
        resolvers.Query.verifierEmail(null, { email: "" }),
      ).rejects.toThrow("Email requis");
    });
  });

  describe("Query: verifierNomUtilisateur", () => {
    it("devrait vérifier qu'un nom d'utilisateur existe", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierNomUtilisateur(null, {
        nom_utilisateur: "john.doe",
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Nom d'utilisateur déjà utilisé.");
    });

    it("devrait indiquer qu'un nom d'utilisateur est disponible", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await resolvers.Query.verifierNomUtilisateur(null, {
        nom_utilisateur: "nouveau.user",
      });

      expect(result.exists).toBe(false);
    });
  });

  describe("Query: verifierPrenom", () => {
    it("devrait trouver un utilisateur par prénom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierPrenom(null, {
        prenom: "Jean",
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Prénom trouvé.");
    });
  });

  describe("Query: verifierNom", () => {
    it("devrait trouver un utilisateur par nom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierNom(null, { nom: "Dupont" });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Nom trouvé.");
    });
  });

  describe("Query: verifierPrenomNom", () => {
    it("devrait vérifier un utilisateur par prénom et nom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierPrenomNom(null, {
        input: {
          prenom: "Jean",
          nom: "Dupont",
        },
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Utilisateur avec ce prénom et nom trouvé.");
    });

    it("devrait lancer une erreur si prénom ou nom manquant", async () => {
      await expect(
        resolvers.Query.verifierPrenomNom(null, {
          input: { prenom: "", nom: "Dupont" },
        }),
      ).rejects.toThrow("Prénom et nom requis");
    });
  });

  describe("Query: verifierEmailPrenomNom", () => {
    it("devrait vérifier un utilisateur par email, prénom et nom", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierEmailPrenomNom(null, {
        input: {
          email: "jean.dupont@example.com",
          prenom: "Jean",
          nom: "Dupont",
        },
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Utilisateur avec ces informations trouvé.");
    });

    it("devrait lancer une erreur si un paramètre manque", async () => {
      await expect(
        resolvers.Query.verifierEmailPrenomNom(null, {
          input: { email: "test@example.com", prenom: "Jean", nom: "" },
        }),
      ).rejects.toThrow("Email, prénom et nom requis");
    });
  });

  describe("Query: verifierPlanning", () => {
    it("devrait vérifier un cours dans le planning", async () => {
      (mockPrisma.cours_recurrent.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierPlanning(null, {
        input: {
          jour: "1",
          heure_debut: "10:00",
          heure_fin: "11:00",
          type_cours: "Karaté",
        },
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Un cours existe déjà à ce créneau.");
    });

    it("devrait indiquer que le créneau est disponible", async () => {
      (mockPrisma.cours_recurrent.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await resolvers.Query.verifierPlanning(null, {
        input: {
          jour: "2",
          heure_debut: "14:00",
          heure_fin: "15:00",
          type_cours: "Judo",
        },
      });

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Créneau disponible dans le planning.");
    });

    it("devrait lancer une erreur si un paramètre manque", async () => {
      await expect(
        resolvers.Query.verifierPlanning(null, {
          input: {
            jour: "1",
            heure_debut: "10:00",
            heure_fin: "",
            type_cours: "Karaté",
          },
        }),
      ).rejects.toThrow("Jour, heure_debut, heure_fin et type_cours requis");
    });
  });

  describe("Query: verifierArticle", () => {
    it("devrait vérifier qu'un article existe", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierArticle(null, {
        nom: "Kimono",
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Article trouvé dans le magasin.");
    });

    it("devrait indiquer qu'un article n'existe pas", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await resolvers.Query.verifierArticle(null, {
        nom: "Article Inexistant",
      });

      expect(result.exists).toBe(false);
      expect(result.message).toBe("Article non trouvé.");
    });

    it("devrait lancer une erreur si le nom est manquant", async () => {
      await expect(
        resolvers.Query.verifierArticle(null, { nom: "" }),
      ).rejects.toThrow("Nom de l'article requis");
    });
  });

  describe("Query: verifierArticleCategorie", () => {
    it("devrait vérifier un article par nom et catégorie", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await resolvers.Query.verifierArticleCategorie(null, {
        input: {
          nom: "Kimono",
          categorie_id: 1,
        },
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Article trouvé dans cette catégorie.");
    });

    it("devrait lancer une erreur si un paramètre manque", async () => {
      await expect(
        resolvers.Query.verifierArticleCategorie(null, {
          input: { nom: "Kimono", categorie_id: 0 },
        }),
      ).rejects.toThrow("Nom et catégorie_id requis");
    });
  });

  describe("Query: verifierProfesseurs", () => {
    it("devrait vérifier quels utilisateurs sont professeurs", async () => {
      (mockPrisma.professeurs.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null);

      const result = await resolvers.Query.verifierProfesseurs(null, {
        input: {
          utilisateurs: [
            { nom: "Martin", prenom: "Pierre" },
            { nom: "Durand", prenom: "Sophie" },
          ],
        },
      });

      expect(result.professeurs).toHaveLength(2);
      expect(result.professeurs[0].isProf).toBe(true);
      expect(result.professeurs[1].isProf).toBe(false);
      expect(result.message).toContain("1 professeur(s)");
    });

    it("devrait lancer une erreur si la liste est vide", async () => {
      await expect(
        resolvers.Query.verifierProfesseurs(null, {
          input: { utilisateurs: [] },
        }),
      ).rejects.toThrow("Liste d'utilisateurs requise");
    });
  });

  describe("Mutation: verifierEmailMutation", () => {
    it("devrait vérifier un email via mutation", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        active: true,
      });

      const result = await resolvers.Mutation.verifierEmailMutation(null, {
        email: "test@example.com",
      });

      expect(result.exists).toBe(true);
      expect(result.message).toBe("Email déjà utilisé.");
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait gérer les erreurs de base de données", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(
        resolvers.Query.verifierEmail(null, { email: "test@example.com" }),
      ).rejects.toThrow();
    });

    it("devrait gérer les erreurs lors de la vérification des professeurs", async () => {
      (mockPrisma.professeurs.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        resolvers.Query.verifierProfesseurs(null, {
          input: { utilisateurs: [{ nom: "Test", prenom: "User" }] },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Validation des entrées", () => {
    it("devrait valider l'email", async () => {
      await expect(
        resolvers.Query.verifierEmail(null, { email: "" }),
      ).rejects.toThrow("Email requis");
    });

    it("devrait valider le nom d'utilisateur", async () => {
      await expect(
        resolvers.Query.verifierNomUtilisateur(null, { nom_utilisateur: "" }),
      ).rejects.toThrow("Nom d'utilisateur requis");
    });

    it("devrait valider le prénom", async () => {
      await expect(
        resolvers.Query.verifierPrenom(null, { prenom: "" }),
      ).rejects.toThrow("Prénom requis");
    });

    it("devrait valider le nom", async () => {
      await expect(
        resolvers.Query.verifierNom(null, { nom: "" }),
      ).rejects.toThrow("Nom requis");
    });
  });

  describe("Cas limites", () => {
    it("devrait gérer les emails avec espaces", async () => {
      (mockPrisma.utilisateurs.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await resolvers.Query.verifierEmail(null, {
        email: "  test@example.com  ",
      });

      expect(result.exists).toBe(false);
    });

    it("devrait gérer les noms d'articles avec caractères spéciaux", async () => {
      (mockPrisma.articles.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await resolvers.Query.verifierArticle(null, {
        nom: "Kimono d'été",
      });

      expect(result.exists).toBe(false);
    });

    it("devrait gérer une liste vide dans verifierProfesseurs", async () => {
      await expect(
        resolvers.Query.verifierProfesseurs(null, {
          input: { utilisateurs: [] },
        }),
      ).rejects.toThrow();
    });
  });
});
