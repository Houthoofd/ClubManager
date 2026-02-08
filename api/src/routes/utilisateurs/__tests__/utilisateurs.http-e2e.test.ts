/**
 * Tests E2E GraphQL pour les Utilisateurs
 * Tests des queries et mutations GraphQL avec mocks
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

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

describe("Utilisateurs GraphQL E2E Tests", () => {
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
    it("devrait retourner le statut de santé de l'API", async () => {
      const query = `
        query {
          health
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.health).toBeDefined();
      expect(typeof result.data.health).toBe("string");
      expect(result.data.health).toContain("running");
    });
  });

  describe("Query: users", () => {
    it("devrait retourner tous les utilisateurs avec pagination", async () => {
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

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toBeDefined();
      expect(Array.isArray(result.data.users)).toBe(true);
      expect(result.data.users).toHaveLength(2);
      expect(result.data.users[0]).toMatchObject({
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
      });
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        include: {
          genres: true,
          grades: true,
        },
      });
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

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toEqual([]);
    });

    it("devrait gérer les erreurs de base de données", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const query = `
        query GetUsers {
          users {
            id
            nom
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Database connection failed");
    });

    it("devrait respecter les paramètres de pagination", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers($take: Int, $skip: Int) {
          users(take: $take, skip: $skip) {
            id
          }
        }
      `;

      await executeGraphQL(query, { take: 5, skip: 10 });

      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalledWith({
        take: 5,
        skip: 10,
        include: {
          genres: true,
          grades: true,
        },
      });
    });
  });

  describe("Query: user", () => {
    it("devrait retourner un utilisateur par son ID", async () => {
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

      expect(result.errors).toBeUndefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.user).toMatchObject({
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: "0612345678",
      });
      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          genres: true,
          grades: true,
          inscriptions: {
            include: {
              cours: true,
            },
          },
        },
      });
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

    it("devrait gérer les erreurs de base de données", async () => {
      mockPrisma.utilisateurs.findUnique.mockRejectedValue(
        new Error("Database error"),
      );

      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            nom
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 1 });

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Database error");
    });
  });

  describe("Relations GraphQL", () => {
    it("devrait charger les relations genre et grade", async () => {
      const mockUser = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: null,
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        genres: {
          id: 1,
          genre_name: "Homme",
        },
        grades: {
          id: 1,
          grade_id: "ceinture_blanche",
        },
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUser);

      const query = `
        query GetUserWithRelations($id: Int!) {
          user(id: $id) {
            id
            nom
            prenom
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

      expect(result.errors).toBeUndefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.user.genre).toEqual({
        id: 1,
        genre_name: "Homme",
      });
      expect(result.data.user.grade).toEqual({
        id: 1,
        grade_id: "ceinture_blanche",
      });
    });

    it("devrait charger les inscriptions d'un utilisateur", async () => {
      const mockUser = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: null,
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        inscriptions: [
          {
            id: 1,
            utilisateur_id: 1,
            cours_id: 10,
            date_inscription: new Date("2024-01-01"),
            status_id: true,
          },
          {
            id: 2,
            utilisateur_id: 1,
            cours_id: 20,
            date_inscription: new Date("2024-01-02"),
            status_id: true,
          },
        ],
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUser);

      const query = `
        query GetUserWithInscriptions($id: Int!) {
          user(id: $id) {
            id
            nom
            inscriptions {
              id
              cours_id
              date_inscription
            }
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 1 });

      expect(result.errors).toBeUndefined();
      expect(result.data.user.inscriptions).toHaveLength(2);
      expect(result.data.user.inscriptions[0]).toMatchObject({
        id: 1,
        cours_id: 10,
      });
    });
  });

  describe("Validation des types GraphQL", () => {
    it("devrait rejeter un ID non numérique", async () => {
      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            nom
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
            nom
          }
        }
      `;

      const result = await executeGraphQL(query, {});

      expect(result.errors).toBeDefined();
    });

    it("devrait accepter des champs optionnels", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers($take: Int, $skip: Int) {
          users(take: $take, skip: $skip) {
            id
          }
        }
      `;

      // Sans fournir take et skip
      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toEqual([]);
    });
  });

  describe("Performance GraphQL", () => {
    it("devrait répondre rapidement aux queries simples", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query GetUsers {
          users(take: 10) {
            id
            nom
          }
        }
      `;

      const startTime = Date.now();
      await executeGraphQL(query);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms
    });

    it("devrait gérer les queries complexes avec relations", async () => {
      const mockUsers = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        nom: `User${i + 1}`,
        prenom: `Prenom${i + 1}`,
        email: `user${i + 1}@example.com`,
        telephone: null,
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        genres: { id: 1, genre_name: "Homme" },
        grades: { id: 1, grade_id: "ceinture_blanche" },
        inscriptions: [],
      }));

      mockPrisma.utilisateurs.findMany.mockResolvedValue(mockUsers);

      const query = `
        query GetUsersWithRelations {
          users(take: 5) {
            id
            nom
            prenom
            genre {
              genre_name
            }
            grade {
              grade_id
            }
            inscriptions {
              id
            }
          }
        }
      `;

      const startTime = Date.now();
      const result = await executeGraphQL(query);
      const endTime = Date.now();

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe("Gestion des erreurs GraphQL", () => {
    it("devrait retourner une erreur pour une query invalide", async () => {
      const query = `
        query {
          invalidField
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain("Cannot query field");
    });

    it("devrait retourner une erreur pour une syntaxe invalide", async () => {
      const query = `
        query {
          users {
            id
            nom
          }
        }
        this is invalid
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeDefined();
    });

    it("devrait gérer les erreurs de timeout", async () => {
      mockPrisma.utilisateurs.findMany.mockRejectedValue(
        new Error("Query timeout"),
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
      expect(result.errors[0].message).toContain("Query timeout");
    });
  });

  describe("Sélection de champs GraphQL", () => {
    it("devrait permettre de sélectionner uniquement certains champs", async () => {
      const mockUsers = [
        {
          id: 1,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean@example.com",
          telephone: "0612345678",
          genre_id: 1,
          grade_id: 1,
          created_at: new Date(),
          genres: { id: 1, genre_name: "Homme" },
          grades: { id: 1, grade_id: "ceinture_blanche" },
          inscriptions: [],
        },
      ];

      mockPrisma.utilisateurs.findMany.mockResolvedValue(mockUsers);

      const query = `
        query GetUsersIdOnly {
          users {
            id
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.users[0]).toHaveProperty("id");
      expect(result.data.users[0]).not.toHaveProperty("nom");
      expect(result.data.users[0]).not.toHaveProperty("prenom");
    });

    it("devrait permettre d'utiliser des alias", async () => {
      const mockUsers = [
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
      ];

      mockPrisma.utilisateurs.findMany.mockResolvedValue(mockUsers);

      const query = `
        query GetUsersWithAlias {
          allUsers: users {
            userId: id
            lastName: nom
            firstName: prenom
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.allUsers).toBeDefined();
      expect(result.data.allUsers[0]).toHaveProperty("userId");
      expect(result.data.allUsers[0]).toHaveProperty("lastName");
      expect(result.data.allUsers[0]).toHaveProperty("firstName");
    });
  });

  describe("Fragments GraphQL", () => {
    it("devrait supporter les fragments", async () => {
      const mockUser = {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
        telephone: "0612345678",
        genre_id: 1,
        grade_id: 1,
        created_at: new Date(),
        genres: { id: 1, genre_name: "Homme" },
        grades: { id: 1, grade_id: "ceinture_blanche" },
        inscriptions: [],
      };

      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUser);

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

      expect(result.errors).toBeUndefined();
      expect(result.data.user).toMatchObject({
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@example.com",
      });
    });
  });

  describe("Queries multiples", () => {
    it("devrait permettre d'exécuter plusieurs queries en une seule requête", async () => {
      const mockUsers = [
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
      ];
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

      mockPrisma.utilisateurs.findMany.mockResolvedValue(mockUsers);
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUser);

      const query = `
        query MultipleQueries {
          allUsers: users(take: 10) {
            id
            nom
          }
          specificUser: user(id: 1) {
            id
            nom
            prenom
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.allUsers).toBeDefined();
      expect(result.data.specificUser).toBeDefined();
      expect(mockPrisma.utilisateurs.findMany).toHaveBeenCalled();
      expect(mockPrisma.utilisateurs.findUnique).toHaveBeenCalled();
    });
  });

  describe("Content-Type et Headers", () => {
    it("devrait accepter application/json", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query {
          users { id }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.errors).toBeUndefined();
    });

    it("devrait retourner du JSON", async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);

      const query = `
        query {
          users { id }
        }
      `;

      const response = await yoga.fetch("http://localhost/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });
  });
});
