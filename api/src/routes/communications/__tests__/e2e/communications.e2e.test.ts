/**
 * 🌐 Tests E2E - Communications
 *
 * Tests end-to-end pour communications via GraphQL
 */

import { graphqlRequest, authenticateUser } from "@/tests/helpers/graphql";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";
import { prisma } from "@/infrastructure/database/prisma-client";

describe("Communications - Tests E2E", () => {
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
    await prisma.communications.deleteMany({});
  });

  describe("Query communications", () => {
    it("devrait récupérer tous les communications", async () => {
      // Créer des données de test
      await prisma.communications.createMany({
        data: [
          { name: "Test 1" },
          { name: "Test 2" },
        ],
      });

      const query = `
        query {
          communications(limit: 10, offset: 0) {
            id
            name
          }
        }
      `;

      const response = await graphqlRequest(query, {}, authToken);

      expect(response.data.communications).toHaveLength(2);
      expect(response.errors).toBeUndefined();
    });

    it("devrait paginer les résultats", async () => {
      // Créer 25 éléments
      await prisma.communications.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Test ${i + 1}`,
        })),
      });

      const query = `
        query GetPaginated($limit: Int!, $offset: Int!) {
          communications(limit: $limit, offset: $offset) {
            id
            name
          }
        }
      `;

      const page1 = await graphqlRequest(query, { limit: 10, offset: 0 }, authToken);
      const page2 = await graphqlRequest(query, { limit: 10, offset: 10 }, authToken);

      expect(page1.data.communications).toHaveLength(10);
      expect(page2.data.communications).toHaveLength(10);
      expect(page1.data.communications[0].id).not.toBe(page2.data.communications[0].id);
    });
  });

  describe("Mutation createCommunications", () => {
    it("devrait créer un nouveau communications", async () => {
      const mutation = `
        mutation Create($input: CreateCommunicationsInput!) {
          createCommunications(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: "Nouveau Communications",
        },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.createCommunications).toBeDefined();
      expect(response.data.createCommunications.name).toBe("Nouveau Communications");
      expect(response.errors).toBeUndefined();

      // Vérifier en base de données
      const created = await prisma.communications.findUnique({
        where: { id: response.data.createCommunications.id },
      });
      expect(created).toBeDefined();
    });

    it("devrait valider les données d'entrée", async () => {
      const mutation = `
        mutation Create($input: CreateCommunicationsInput!) {
          createCommunications(input: $input) {
            id
          }
        }
      `;

      const response = await graphqlRequest(mutation, { input: {} }, authToken);

      expect(response.errors).toBeDefined();
    });
  });

  describe("Mutation updateCommunications", () => {
    it("devrait mettre à jour un communications existant", async () => {
      const existing = await prisma.communications.create({
        data: { name: "Original" },
      });

      const mutation = `
        mutation Update($id: Int!, $input: UpdateCommunicationsInput!) {
          updateCommunications(id: $id, input: $input) {
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

      expect(response.data.updateCommunications.name).toBe("Modifié");
      expect(response.errors).toBeUndefined();
    });
  });

  describe("Mutation deleteCommunications", () => {
    it("devrait supprimer un communications", async () => {
      const existing = await prisma.communications.create({
        data: { name: "À supprimer" },
      });

      const mutation = `
        mutation Delete($id: Int!) {
          deleteCommunications(id: $id) {
            success
            message
          }
        }
      `;

      const response = await graphqlRequest(mutation, { id: existing.id }, authToken);

      expect(response.data.deleteCommunications.success).toBe(true);
      expect(response.errors).toBeUndefined();

      // Vérifier que c'est bien supprimé
      const deleted = await prisma.communications.findUnique({
        where: { id: existing.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Scénarios complets", () => {
    it("devrait gérer un workflow complet CRUD", async () => {
      // CREATE
      const createMutation = `
        mutation Create($input: CreateCommunicationsInput!) {
          createCommunications(input: $input) {
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
      const createdId = createResponse.data.createCommunications.id;

      // READ
      const readQuery = `
        query Get($id: Int!) {
          communication(id: $id) {
            id
            name
          }
        }
      `;

      const readResponse = await graphqlRequest(readQuery, { id: createdId }, authToken);
      expect(readResponse.data.communication.name).toBe("Workflow Test");

      // UPDATE
      const updateMutation = `
        mutation Update($id: Int!, $input: UpdateCommunicationsInput!) {
          updateCommunications(id: $id, input: $input) {
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
      expect(updateResponse.data.updateCommunications.name).toBe("Updated Workflow");

      // DELETE
      const deleteMutation = `
        mutation Delete($id: Int!) {
          deleteCommunications(id: $id) {
            success
          }
        }
      `;

      const deleteResponse = await graphqlRequest(
        deleteMutation,
        { id: createdId },
        authToken
      );
      expect(deleteResponse.data.deleteCommunications.success).toBe(true);
    });
  });
});
