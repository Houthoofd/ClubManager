/**
 * Tests d'intégration réels pour le module Utilisateurs
 * Tests GraphQL avec base de données réelle
 *
 * IMPORTANT: Ces tests nécessitent une base de données de test configurée
 * Configuration via .env.test avec DATABASE_URL
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema.js";
import { prisma } from "../../../infrastructure/database/prisma-client.js";
import {
  setupTestDatabase,
  cleanupTestDatabase,
} from "../../../tests/setup/testDatabase.js";

// Ces tests sont désactivés par défaut (skip if no DB)
const SKIP_REAL_DB_TESTS =
  !process.env.DATABASE_URL || process.env.SKIP_REAL_DB_TESTS === "true";

describe("Utilisateurs Module - Tests d'intégration réels GraphQL (DB)", () => {
  let yoga: ReturnType<typeof createYoga>;

  beforeAll(async () => {
    if (SKIP_REAL_DB_TESTS) {
      console.log(
        "⚠️ Tests d'intégration réels ignorés (pas de DB configurée)",
      );
      return;
    }

    // Setup de la base de données de test
    await setupTestDatabase();

    // Créer une instance Yoga pour les tests
    yoga = createYoga({
      schema,
      logging: false,
    });

    console.log(
      "✅ Connexion à la base de données de test établie (Utilisateurs GraphQL)",
    );
  });

  afterAll(async () => {
    if (!SKIP_REAL_DB_TESTS) {
      await cleanupTestDatabase();
      console.log("🔚 Nettoyage des connexions DB Utilisateurs terminé");
    }
  });

  /**
   * Helper pour exécuter une query GraphQL
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

    const result = await response.json();
    return result;
  }

  // ==================== TESTS RÉELS - UTILISATEURS ====================
  describe("Query: users - Tests réels", () => {
    it("devrait récupérer les utilisateurs depuis la DB réelle", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

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
      expect(result.data).toBeDefined();
      expect(result.data.users).toBeDefined();
      expect(Array.isArray(result.data.users)).toBe(true);

      if (result.data.users.length > 0) {
        expect(result.data.users[0]).toHaveProperty("id");
        expect(result.data.users[0]).toHaveProperty("nom");
        expect(result.data.users[0]).toHaveProperty("prenom");
        expect(result.data.users[0]).toHaveProperty("email");
        expect(typeof result.data.users[0].id).toBe("number");
        expect(typeof result.data.users[0].nom).toBe("string");
        expect(typeof result.data.users[0].prenom).toBe("string");
      }
    });

    it("devrait avoir des IDs uniques pour chaque utilisateur", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 100) {
            id
          }
        }
      `;

      const result = await executeGraphQL(query);

      if (result.data && result.data.users && result.data.users.length > 0) {
        const ids = result.data.users.map((u: any) => u.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("devrait gérer une lecture répétée (idempotence)", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 10) {
            id
            nom
            prenom
          }
        }
      `;

      const result1 = await executeGraphQL(query);
      const result2 = await executeGraphQL(query);

      expect(result1.data?.users?.length).toBe(result2.data?.users?.length);
    });

    it("devrait gérer la pagination", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers($take: Int, $skip: Int) {
          users(take: $take, skip: $skip) {
            id
            nom
          }
        }
      `;

      const page1 = await executeGraphQL(query, { take: 5, skip: 0 });
      const page2 = await executeGraphQL(query, { take: 5, skip: 5 });

      expect(page1.errors).toBeUndefined();
      expect(page2.errors).toBeUndefined();

      if (page1.data?.users?.length > 0 && page2.data?.users?.length > 0) {
        const ids1 = page1.data.users.map((u: any) => u.id);
        const ids2 = page2.data.users.map((u: any) => u.id);

        // Les IDs ne devraient pas se chevaucher
        const overlap = ids1.filter((id: number) => ids2.includes(id));
        expect(overlap.length).toBe(0);
      }
    });
  });

  describe("Query: user - Tests réels", () => {
    it("devrait récupérer un utilisateur par ID", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      // D'abord récupérer un utilisateur existant
      const allUsersQuery = `
        query GetUsers {
          users(take: 1) {
            id
          }
        }
      `;

      const allUsers = await executeGraphQL(allUsersQuery);

      if (
        allUsers.data &&
        allUsers.data.users &&
        allUsers.data.users.length > 0
      ) {
        const userId = allUsers.data.users[0].id;

        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
              nom
              prenom
              email
            }
          }
        `;

        const result = await executeGraphQL(query, { id: userId });

        expect(result.errors).toBeUndefined();
        expect(result.data.user).toBeDefined();
        expect(result.data.user.id).toBe(userId);
      }
    });

    it("devrait retourner null pour un ID inexistant", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            nom
            prenom
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 999999 });

      expect(result.errors).toBeUndefined();
      expect(result.data.user).toBeNull();
    });
  });

  // ==================== TESTS DE PERFORMANCE ====================
  describe("Performance - Tests réels GraphQL", () => {
    it("devrait récupérer tous les utilisateurs rapidement", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 50) {
            id
            nom
            prenom
          }
        }
      `;

      const startTime = Date.now();
      await executeGraphQL(query);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Moins d'1 seconde
    });

    it("devrait récupérer un utilisateur par ID rapidement", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const allUsersQuery = `
        query GetUsers {
          users(take: 1) {
            id
          }
        }
      `;

      const allUsers = await executeGraphQL(allUsersQuery);

      if (allUsers.data?.users?.length > 0) {
        const userId = allUsers.data.users[0].id;

        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
              nom
            }
          }
        `;

        const startTime = Date.now();
        await executeGraphQL(query, { id: userId });
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(500);
      }
    });

    it("devrait gérer plusieurs requêtes en parallèle", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const allUsersQuery = `
        query GetUsers {
          users(take: 5) {
            id
          }
        }
      `;

      const allUsers = await executeGraphQL(allUsersQuery);

      if (allUsers.data?.users?.length > 0) {
        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
              nom
            }
          }
        `;

        const startTime = Date.now();
        const promises = allUsers.data.users.map((u: any) =>
          executeGraphQL(query, { id: u.id }),
        );

        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(allUsers.data.users.length);
        results.forEach((result) => {
          expect(result.errors).toBeUndefined();
        });
        expect(endTime - startTime).toBeLessThan(2000);
      }
    });
  });

  // ==================== TESTS DE COHÉRENCE DES DONNÉES ====================
  describe("Cohérence des données - Tests réels GraphQL", () => {
    it("devrait avoir des emails valides", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 50) {
            email
          }
        }
      `;

      const result = await executeGraphQL(query);

      if (result.data?.users?.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        result.data.users.forEach((u: any) => {
          if (u.email) {
            expect(emailRegex.test(u.email)).toBe(true);
          }
        });
      }
    });

    it("devrait avoir des IDs positifs", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 50) {
            id
          }
        }
      `;

      const result = await executeGraphQL(query);

      if (result.data?.users?.length > 0) {
        result.data.users.forEach((u: any) => {
          expect(u.id).toBeGreaterThan(0);
        });
      }
    });

    it("devrait avoir des noms non vides", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 50) {
            nom
            prenom
          }
        }
      `;

      const result = await executeGraphQL(query);

      if (result.data?.users?.length > 0) {
        result.data.users.forEach((u: any) => {
          expect(u.nom).toBeTruthy();
          expect(u.nom.length).toBeGreaterThan(0);
          expect(u.prenom).toBeTruthy();
          expect(u.prenom.length).toBeGreaterThan(0);
        });
      }
    });

    it("devrait avoir des dates valides si présentes", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 50) {
            created_at
          }
        }
      `;

      const result = await executeGraphQL(query);

      if (result.data?.users?.length > 0) {
        result.data.users.forEach((u: any) => {
          if (u.created_at) {
            const date = new Date(u.created_at);
            expect(date.toString()).not.toBe("Invalid Date");
          }
        });
      }
    });
  });

  // ==================== TESTS DE RELATIONS ====================
  describe("Relations - Tests réels GraphQL", () => {
    it("devrait récupérer les utilisateurs avec leurs genres", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsersWithGenre {
          users(take: 10) {
            id
            nom
            prenom
            genre {
              id
              genre_name
            }
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toBeDefined();

      // Vérifier que le genre est chargé (peut être null)
      if (result.data.users.length > 0) {
        const usersWithGenre = result.data.users.filter(
          (u: any) => u.genre !== null,
        );
        if (usersWithGenre.length > 0) {
          expect(usersWithGenre[0].genre).toHaveProperty("id");
          expect(usersWithGenre[0].genre).toHaveProperty("genre_name");
        }
      }
    });

    it("devrait récupérer les utilisateurs avec leurs grades", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsersWithGrade {
          users(take: 10) {
            id
            nom
            prenom
            grade {
              id
              grade_id
            }
          }
        }
      `;

      const result = await executeGraphQL(query);

      expect(result.errors).toBeUndefined();
      expect(result.data.users).toBeDefined();

      // Vérifier que le grade est chargé (peut être null)
      if (result.data.users.length > 0) {
        const usersWithGrade = result.data.users.filter(
          (u: any) => u.grade !== null,
        );
        if (usersWithGrade.length > 0) {
          expect(usersWithGrade[0].grade).toHaveProperty("id");
          expect(usersWithGrade[0].grade).toHaveProperty("grade_id");
        }
      }
    });

    it("devrait récupérer un utilisateur avec ses inscriptions", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const allUsersQuery = `
        query GetUsers {
          users(take: 1) {
            id
          }
        }
      `;

      const allUsers = await executeGraphQL(allUsersQuery);

      if (allUsers.data?.users?.length > 0) {
        const userId = allUsers.data.users[0].id;

        const query = `
          query GetUserWithInscriptions($id: Int!) {
            user(id: $id) {
              id
              nom
              prenom
              inscriptions {
                id
                cours_id
                date_inscription
              }
            }
          }
        `;

        const result = await executeGraphQL(query, { id: userId });

        expect(result.errors).toBeUndefined();
        expect(result.data.user).toBeDefined();
        expect(result.data.user.inscriptions).toBeDefined();
        expect(Array.isArray(result.data.user.inscriptions)).toBe(true);
      }
    });
  });

  // ==================== TESTS DE GESTION DES ERREURS ====================
  describe("Gestion des erreurs - Tests réels GraphQL", () => {
    it("devrait gérer les IDs invalides gracieusement", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            nom
          }
        }
      `;

      const result = await executeGraphQL(query, { id: -1 });

      expect(result.errors).toBeUndefined();
      expect(result.data.user).toBeNull();
    });

    it("devrait gérer les IDs très grands", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            nom
          }
        }
      `;

      const result = await executeGraphQL(query, { id: 2147483647 });

      expect(result.errors).toBeUndefined();
      expect(result.data.user).toBeNull();
    });

    it("devrait gérer les paramètres de pagination invalides", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers($take: Int, $skip: Int) {
          users(take: $take, skip: $skip) {
            id
            nom
          }
        }
      `;

      // Take négatif devrait être géré
      const result = await executeGraphQL(query, { take: -1, skip: 0 });

      // GraphQL devrait retourner une liste vide ou gérer l'erreur gracieusement
      expect(result.data).toBeDefined();
    });
  });

  // ==================== TESTS DE SANTÉ ====================
  describe("Health Check - Tests réels GraphQL", () => {
    it("devrait vérifier que l'API GraphQL fonctionne", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

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

    it("devrait maintenir la connexion pendant plusieurs requêtes", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      const query = `
        query GetUsers {
          users(take: 5) {
            id
            nom
          }
        }
      `;

      // Effectuer plusieurs requêtes successives
      for (let i = 0; i < 5; i++) {
        const result = await executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data.users).toBeDefined();
      }
    });

    it("devrait récupérer après une requête en erreur", async () => {
      if (SKIP_REAL_DB_TESTS) {
        console.log("⚠️ Test skippé - DB non configurée");
        return;
      }

      // Tenter une requête invalide
      const invalidQuery = `
        query {
          invalidField
        }
      `;

      const errorResult = await executeGraphQL(invalidQuery);
      expect(errorResult.errors).toBeDefined();

      // La prochaine requête valide devrait fonctionner
      const validQuery = `
        query GetUsers {
          users(take: 1) {
            id
          }
        }
      `;

      const result = await executeGraphQL(validQuery);
      expect(result.errors).toBeUndefined();
      expect(result.data.users).toBeDefined();
    });
  });
});
