/**
 * 🌐 Tests E2E - Activities
 *
 * Tests end-to-end pour activities via GraphQL
 */

import { graphqlRequest, authenticateUser } from "@/tests/helpers/graphql";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";
import { prisma } from "@/infrastructure/database/prisma-client";

describe("Activities - Tests E2E", () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    const auth = await authenticateUser("admin@example.com", "password");
    authToken = auth.token;
    userId = auth.userId;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await prisma.activities.deleteMany({});
  });

  describe("Query activities", () => {
    it("devrait récupérer tous les activities", async () => {
      // Créer des données de test
      await prisma.activities.createMany({
        data: [
          { name: "Test 1" },
          { name: "Test 2" },
        ],
      });

      const query = `
        query {
          activities(limit: 10, offset: 0) {
            id
            name
          }
        }
      `;

      const response = await graphqlRequest(query, {}, authToken);

      expect(response.data.activities).toHaveLength(2);
      expect(response.errors).toBeUndefined();
    });

    it("devrait paginer les résultats", async () => {
      // Créer 25 éléments
      await prisma.activities.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Test ${i + 1}`,
        })),
      });

      const query = `
        query GetPaginated($limit: Int!, $offset: Int!) {
          activities(limit: $limit, offset: $offset) {
            id
            name
          }
        }
      `;

      const page1 = await graphqlRequest(query, { limit: 10, offset: 0 }, authToken);
      const page2 = await graphqlRequest(query, { limit: 10, offset: 10 }, authToken);

      expect(page1.data.activities).toHaveLength(10);
      expect(page2.data.activities).toHaveLength(10);
      expect(page1.data.activities[0].id).not.toBe(page2.data.activities[0].id);
    });
  });

  describe("Mutation createActivities", () => {
    it("devrait créer un nouveau activities", async () => {
      const mutation = `
        mutation Create($input: CreateActivitiesInput!) {
          createActivities(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: "Nouveau Activities",
        },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.createActivities).toBeDefined();
      expect(response.data.createActivities.name).toBe("Nouveau Activities");
      expect(response.errors).toBeUndefined();

      // Vérifier en base de données
      const created = await prisma.activities.findUnique({
        where: { id: response.data.createActivities.id },
      });
      expect(created).toBeDefined();
    });

    it("devrait valider les données d'entrée", async () => {
      const mutation = `
        mutation Create($input: CreateActivitiesInput!) {
          createActivities(input: $input) {
            id
          }
        }
      `;

      const response = await graphqlRequest(mutation, { input: {} }, authToken);

      expect(response.errors).toBeDefined();
    });
  });

  describe("Mutation updateActivities", () => {
    it("devrait mettre à jour un activities existant", async () => {
      const existing = await prisma.activities.create({
        data: { name: "Original" },
      });

      const mutation = `
        mutation Update($id: Int!, $input: UpdateActivitiesInput!) {
          updateActivities(id: $id, input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        id: existing.id,
        input: { name: "Modifié" },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.updateActivities.name).toBe("Modifié");
      expect(response.errors).toBeUndefined();
    });
  });

  describe("Mutation deleteActivities", () => {
    it("devrait supprimer un activities", async () => {
      const existing = await prisma.activities.create({
        data: { name: "À supprimer" },
      });

      const mutation = `
        mutation Delete($id: Int!) {
          deleteActivities(id: $id) {
            success
            message
          }
        }
      `;

      const response = await graphqlRequest(mutation, { id: existing.id }, authToken);

      expect(response.data.deleteActivities.success).toBe(true);
      expect(response.errors).toBeUndefined();

      // Vérifier que c'est bien supprimé
      const deleted = await prisma.activities.findUnique({
        where: { id: existing.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Scénarios complets", () => {
    it("devrait gérer un workflow complet CRUD", async () => {
      // CREATE
      const createMutation = `
        mutation Create($input: CreateActivitiesInput!) {
          createActivities(input: $input) {
            id
            name
          }
        }
      `;

      const createResponse = await graphqlRequest(
        createMutation,
        { input: { name: "Workflow Test" } },
        authToken
      );
      const createdId = createResponse.data.createActivities.id;

      // READ
      const readQuery = `
        query Get($id: Int!) {
          activitie(id: $id) {
            id
            name
          }
        }
      `;

      const readResponse = await graphqlRequest(readQuery, { id: createdId }, authToken);
      expect(readResponse.data.activitie.name).toBe("Workflow Test");

      // UPDATE
      const updateMutation = `
        mutation Update($id: Int!, $input: UpdateActivitiesInput!) {
          updateActivities(id: $id, input: $input) {
            id
            name
          }
        }
      `;

      const updateResponse = await graphqlRequest(
        updateMutation,
        { id: createdId, input: { name: "Updated Workflow" } },
        authToken
      );
      expect(updateResponse.data.updateActivities.name).toBe("Updated Workflow");

      // DELETE
      const deleteMutation = `
        mutation Delete($id: Int!) {
          deleteActivities(id: $id) {
            success
          }
        }
      `;

      const deleteResponse = await graphqlRequest(
        deleteMutation,
        { id: createdId },
        authToken
      );
      expect(deleteResponse.data.deleteActivities.success).toBe(true);
    });
  });
});
