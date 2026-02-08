/**
 * Tests unitaires de base pour le module Utilisateurs
 * Tests GraphQL avec mocks
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock Prisma AVANT tout autre import
const mockPrisma = {
  utilisateurs: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  genres: {
    findUnique: jest.fn(),
  },
  grades: {
    findUnique: jest.fn(),
  },
};

jest.mock("../../../infrastructure/database/prisma-client.js", () => ({
  prisma: mockPrisma,
}));

// Importer après les mocks
import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema.js";

describe("Utilisateurs Module - Tests unitaires GraphQL de base", () => {
  let yoga: ReturnType<typeof createYoga>;

  beforeEach(() => {
    jest.clearAllMocks();
    yoga = createYoga({
      schema,
      logging: false,
    });
  });

  /**
   * Helper pour exécuter une query/mutation GraphQL
   */
  async function executeGraphQL(query: string, variables?: any) {
    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    return await response.json();
  }

  describe("Query: health", () => {
    it("devrait retourner le statut de santé", async () => {
      const query = `
        query {
          health
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.health).toBeDefined();
      expect(typeof result.data.health).toBe("string");
    });
  });

  describe("Query: users", () => {
    it("devrait retourner une liste d'utilisateurs", async () => {
      const mockUsers = [
        {
          id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          telephone: null,
          genre_id: 1,
          grade_id: 1,
          created_at: new Date("2024-01-01"),
          genres: { id: 1, genre_name: "Homme" },
          grades: { id: 1, grade_id: "ceinture_blanche" },
          inscriptions: [],
        },
        {
          id: 2,
          nom: "Martin",
          prenom: "Marie",
          email: "marie.martin@example.com",
          telephone: null,
          genre_id: 2,
          grade_id: 2,
          created_at: new Date("2024-01-02"),
          genres: { id: 2, genre_name: "Femme" },
          grades: { id: 2, grade_id: "ceinture_jaune" },
          inscriptions: [],
        },
      ];

      mockPrisma.utilisateurs.findMany.mockResolvedValue(mockUsers);

      const query = `
        query GetUsers($take: Int, $skip: Int) {
          users(take: $take, skip: $skip) {
            id
            nom
            prenom
            email
          }
        }
      `;

      const result = await executeGraphQL(query, { take: 10, skip: 0 });

      expect(result.data).toBeDefined();
      expect(result.data.users).toBeDefined();
      expect(Array.isArray(result.data.users)).toBe(true);
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
    });

    it("devrait retourner une liste vide si aucun utilisateur", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers {
          users {
            id
            nom
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.data).toBeDefined();
      expect(result.data.users).toEqual([]);
    });

    it("devrait appliquer la pagination correctement", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers($take: Int, $skip: Int) {
          users(take: $take, skip: $skip) {
            id
          }
        }
      `;

      await executeGraphQL(query, { take: 5, skip: 10 });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        }),
      );
    });
  });

  describe("Query: user", () => {
    it("devrait retourner un utilisateur par ID", async () => {
      const mockUser = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: "0612345678",
        genre_id: 1,
        grade_id: 1,
        created_at: new Date("2024-01-01"),
        genres: { id: 1, genre_name: "Homme" },
        grades: { id: 1, grade_id: "ceinture_blanche" },
        inscriptions: [],
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUser);

      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            nom
            prenom
            email
            telephone
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 1 });

      expect(result.data).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });

    it("devrait retourner null pour un utilisateur inexistant", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            nom
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 999 });

      expect(result.errors).toBeUndefined();
      expect(result.data.user).toBeNull();
    });
  });

  describe("Validation des paramètres", () => {
    it("devrait rejeter un ID non numérique", async () => {
      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
          }
        }
      `;

      const result = await executeGraphQL(query, { id: "invalid" });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Int");
    });

    it("devrait rejeter une query sans paramètre requis", async () => {
      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
          }
        }
      `;

      const result = await executeGraphQL(query, {});

      expect(result.errors).toBeDefined();
    });

    it("devrait accepter des paramètres de pagination valides", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers($take: Int, $skip: Int) {
          users(take: $take, skip: $skip) {
            id
          }
        }
      `;

      const result = await executeGraphQL(query, { take: 20, skip: 0 });

      expect(result.errors).toBeUndefined();
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });
  });

  describe("Gestion des erreurs", () => {
    it("devrait gérer les erreurs de base de données", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const query = `
        query GetUsers {
          users {
            id
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Database connection failed");
    });

    it("devrait gérer les erreurs de syntaxe GraphQL", async () => {
      const query = `
        query {
          invalidField
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeDefined();
    });

    it("devrait gérer les requêtes malformées", async () => {
      const query = `
        this is not valid GraphQL
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeDefined();
    });
  });

  describe("Relations GraphQL", () => {
    it("devrait charger les relations genre et grade", async () => {
      const mockUser = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
        telephone: null,
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        genres: { id: 1, genre_name: "Homme" },
        grades: { id: 1, grade_id: "ceinture_blanche" },
        inscriptions: [],
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUser);

      const query = `
        query GetUserWithRelations($id: Int!) {
          user(id: $id) {
            id
            nom
            genre {
              id
              genre_name
            }
            grade {
              id
              grade_id
            }
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 1 });

      expect(result.data).toBeDefined();
      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expect.objectContaining({
            genres: true,
            grades: true,
          }),
        }),
      );
    });

    it("devrait charger les inscriptions d'un utilisateur", async () => {
      const mockUser = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
        telephone: null,
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        genres: { id: 1, genre_name: "Homme" },
        grades: { id: 1, grade_id: "ceinture_blanche" },
        inscriptions: [
          {
            id: 1,
            utilisateur_id: 1,
            cours_id: 10,
            date_inscription: new Date(),
            status_id: true,
          },
        ],
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUser);

      const query = `
        query GetUserWithInscriptions($id: Int!) {
          user(id: $id) {
            id
            inscriptions {
              id
              cours_id
            }
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 1 });

      expect(result.data).toBeDefined();
      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            inscriptions: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe("Performance et optimisation", () => {
    it("devrait limiter le nombre de résultats par défaut", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers {
          users {
            id
          }
        }
      `;

      await executeGraphQL(query);

      // Vérifier que findMany est appelé avec une limite par défaut
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10, // Limite par défaut
        }),
      );
    });

    it("devrait permettre de spécifier une limite personnalisée", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers($take: Int) {
          users(take: $take) {
            id
          }
        }
      `;

      await executeGraphQL(query, { take: 50 });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe("Sélection de champs", () => {
    it("devrait permettre de sélectionner uniquement certains champs", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        {
          id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          telephone: null,
          genre_id: 1,
          grade_id: 1,
          created_at: new Date(),
          genres: { id: 1, genre_name: "Homme" },
          grades: { id: 1, grade_id: "ceinture_blanche" },
          inscriptions: [],
        },
      ]);

      const query = `
        query GetUsersIdOnly {
          users {
            id
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.data).toBeDefined();
      expect(result.data.users).toBeDefined();
      expect(result.data.users[0]).toHaveProperty("id");
      // Les autres champs ne devraient pas être dans la réponse
      expect(result.data.users[0]).not.toHaveProperty("email");
    });

    it("devrait permettre d'utiliser des alias", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        {
          id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          telephone: null,
          genre_id: 1,
          grade_id: 1,
          created_at: new Date(),
          genres: { id: 1, genre_name: "Homme" },
          grades: { id: 1, grade_id: "ceinture_blanche" },
          inscriptions: [],
        },
      ]);

      const query = `
        query GetUsersWithAlias {
          allUsers: users {
            userId: id
            fullName: nom
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.data).toBeDefined();
      expect(result.data.allUsers).toBeDefined();
      expect(result.data.allUsers[0]).toHaveProperty("userId");
      expect(result.data.allUsers[0]).toHaveProperty("fullName");
    });
  });

  describe("Fragments GraphQL", () => {
    it("devrait supporter les fragments", async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
        telephone: null,
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        genres: { id: 1, genre_name: "Homme" },
        grades: { id: 1, grade_id: "ceinture_blanche" },
        inscriptions: [],
      });

      const query = `
        fragment UserFields on User {
          id
          nom
          prenom
          email
        }

        query GetUser($id: Int!) {
          user(id: $id) {
            ...UserFields
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 1 });

      expect(result.data).toBeDefined();
      expect(result.data.user).toHaveProperty("id");
      expect(result.data.user).toHaveProperty("nom");
      expect(result.data.user).toHaveProperty("prenom");
      expect(result.data.user).toHaveProperty("email");
    });
  });

  describe("Queries multiples", () => {
    it("devrait permettre d'exécuter plusieurs queries en une seule requête", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        {
          id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          telephone: null,
          genre_id: 1,
          grade_id: 1,
          created_at: new Date(),
          genres: { id: 1, genre_name: "Homme" },
          grades: { id: 1, grade_id: "ceinture_blanche" },
          inscriptions: [],
        },
      ]);

      mockPrisma.utilisateurs.findUnique.mockResolvedValue({
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
        telephone: null,
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        genres: { id: 1, genre_name: "Homme" },
        grades: { id: 1, grade_id: "ceinture_blanche" },
        inscriptions: [],
      });

      const query = `
        query MultipleQueries {
          allUsers: users(take: 10) {
            id
          }
          specificUser: user(id: 1) {
            id
            nom
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.data).toBeDefined();
      expect(result.data.allUsers).toBeDefined();
      expect(result.data.specificUser).toBeDefined();
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalled();
    });
  });
});
