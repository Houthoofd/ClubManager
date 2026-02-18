/**
 * 🌐 Tests E2E - Memberships
 *
 * Tests end-to-end pour memberships via GraphQL
 */

import { graphqlRequest, authenticateUser } from "@/tests/helpers/graphql";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";
import { prisma } from "@/infrastructure/database/prisma-client";

describe("Memberships - Tests E2E", () => {
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
    await prisma.memberships.deleteMany({});
  });

  describe("Query memberships", () => {
    it("devrait récupérer tous les memberships", async () => {
      // Créer des données de test
      await prisma.memberships.createMany({
        data: [
          { name: "Test 1" },
          { name: "Test 2" },
        ],
      });

      const query = `
        query {
          memberships(limit: 10, offset: 0) {
            id
            name
          }
        }
      `;

      const response = await graphqlRequest(query, {}, authToken);

      expect(response.data.memberships).toHaveLength(2);
      expect(response.errors).toBeUndefined();
    });

    it("devrait paginer les résultats", async () => {
      // Créer 25 éléments
      await prisma.memberships.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Test ${i + 1}`,
        })),
      });

      const query = `
        query GetPaginated($limit: Int!, $offset: Int!) {
          memberships(limit: $limit, offset: $offset) {
            id
            name
          }
        }
      `;

      const page1 = await graphqlRequest(query, { limit: 10, offset: 0 }, authToken);
      const page2 = await graphqlRequest(query, { limit: 10, offset: 10 }, authToken);

      expect(page1.data.memberships).toHaveLength(10);
      expect(page2.data.memberships).toHaveLength(10);
      expect(page1.data.memberships[0].id).not.toBe(page2.data.memberships[0].id);
    });
  });

  describe("Mutation createMemberships", () => {
    it("devrait créer un nouveau memberships", async () => {
      const mutation = `
        mutation Create($input: CreateMembershipsInput!) {
          createMemberships(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: "Nouveau Memberships",
        },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.createMemberships).toBeDefined();
      expect(response.data.createMemberships.name).toBe("Nouveau Memberships");
      expect(response.errors).toBeUndefined();

      // Vérifier en base de données
      const created = await prisma.memberships.findUnique({
        where: { id: response.data.createMemberships.id },
      });
      expect(created).toBeDefined();
    });

    it("devrait valider les données d'entrée", async () => {
      const mutation = `
        mutation Create($input: CreateMembershipsInput!) {
          createMemberships(input: $input) {
            id
          }
        }
      `;

      const response = await graphqlRequest(mutation, { input: {} }, authToken);

      expect(response.errors).toBeDefined();
    });
  });

  describe("Mutation updateMemberships", () => {
    it("devrait mettre à jour un memberships existant", async () => {
      const existing = await prisma.memberships.create({
        data: { name: "Original" },
      });

      const mutation = `
        mutation Update($id: Int!, $input: UpdateMembershipsInput!) {
          updateMemberships(id: $id, input: $input) {
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

      expect(response.data.updateMemberships.name).toBe("Modifié");
      expect(response.errors).toBeUndefined();
    });
  });

  describe("Mutation deleteMemberships", () => {
    it("devrait supprimer un memberships", async () => {
      const existing = await prisma.memberships.create({
        data: { name: "À supprimer" },
      });

      const mutation = `
        mutation Delete($id: Int!) {
          deleteMemberships(id: $id) {
            success
            message
          }
        }
      `;

      const response = await graphqlRequest(mutation, { id: existing.id }, authToken);

      expect(response.data.deleteMemberships.success).toBe(true);
      expect(response.errors).toBeUndefined();

      // Vérifier que c'est bien supprimé
      const deleted = await prisma.memberships.findUnique({
        where: { id: existing.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Scénarios complets", () => {
    it("devrait gérer un workflow complet CRUD", async () => {
      // CREATE
      const createMutation = `
        mutation Create($input: CreateMembershipsInput!) {
          createMemberships(input: $input) {
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
      const createdId = createResponse.data.createMemberships.id;

      // READ
      const readQuery = `
        query Get($id: Int!) {
          membership(id: $id) {
            id
            name
          }
        }
      `;

      const readResponse = await graphqlRequest(readQuery, { id: createdId }, authToken);
      expect(readResponse.data.membership.name).toBe("Workflow Test");

      // UPDATE
      const updateMutation = `
        mutation Update($id: Int!, $input: UpdateMembershipsInput!) {
          updateMemberships(id: $id, input: $input) {
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
      expect(updateResponse.data.updateMemberships.name).toBe("Updated Workflow");

      // DELETE
      const deleteMutation = `
        mutation Delete($id: Int!) {
          deleteMemberships(id: $id) {
            success
          }
        }
      `;

      const deleteResponse = await graphqlRequest(
        deleteMutation,
        { id: createdId },
        authToken
      );
      expect(deleteResponse.data.deleteMemberships.success).toBe(true);
    });
  });
});
