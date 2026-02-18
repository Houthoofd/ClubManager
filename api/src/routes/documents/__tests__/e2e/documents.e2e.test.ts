/**
 * 🌐 Tests E2E - Documents
 *
 * Tests end-to-end pour documents via GraphQL
 */

import { graphqlRequest, authenticateUser } from "@/tests/helpers/graphql";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";
import { prisma } from "@/infrastructure/database/prisma-client";

describe("Documents - Tests E2E", () => {
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
    await prisma.documents.deleteMany({});
  });

  describe("Query documents", () => {
    it("devrait récupérer tous les documents", async () => {
      // Créer des données de test
      await prisma.documents.createMany({
        data: [
          { name: "Test 1" },
          { name: "Test 2" },
        ],
      });

      const query = `
        query {
          documents(limit: 10, offset: 0) {
            id
            name
          }
        }
      `;

      const response = await graphqlRequest(query, {}, authToken);

      expect(response.data.documents).toHaveLength(2);
      expect(response.errors).toBeUndefined();
    });

    it("devrait paginer les résultats", async () => {
      // Créer 25 éléments
      await prisma.documents.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Test ${i + 1}`,
        })),
      });

      const query = `
        query GetPaginated($limit: Int!, $offset: Int!) {
          documents(limit: $limit, offset: $offset) {
            id
            name
          }
        }
      `;

      const page1 = await graphqlRequest(query, { limit: 10, offset: 0 }, authToken);
      const page2 = await graphqlRequest(query, { limit: 10, offset: 10 }, authToken);

      expect(page1.data.documents).toHaveLength(10);
      expect(page2.data.documents).toHaveLength(10);
      expect(page1.data.documents[0].id).not.toBe(page2.data.documents[0].id);
    });
  });

  describe("Mutation createDocuments", () => {
    it("devrait créer un nouveau documents", async () => {
      const mutation = `
        mutation Create($input: CreateDocumentsInput!) {
          createDocuments(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: "Nouveau Documents",
        },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.createDocuments).toBeDefined();
      expect(response.data.createDocuments.name).toBe("Nouveau Documents");
      expect(response.errors).toBeUndefined();

      // Vérifier en base de données
      const created = await prisma.documents.findUnique({
        where: { id: response.data.createDocuments.id },
      });
      expect(created).toBeDefined();
    });

    it("devrait valider les données d'entrée", async () => {
      const mutation = `
        mutation Create($input: CreateDocumentsInput!) {
          createDocuments(input: $input) {
            id
          }
        }
      `;

      const response = await graphqlRequest(mutation, { input: {} }, authToken);

      expect(response.errors).toBeDefined();
    });
  });

  describe("Mutation updateDocuments", () => {
    it("devrait mettre à jour un documents existant", async () => {
      const existing = await prisma.documents.create({
        data: { name: "Original" },
      });

      const mutation = `
        mutation Update($id: Int!, $input: UpdateDocumentsInput!) {
          updateDocuments(id: $id, input: $input) {
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

      expect(response.data.updateDocuments.name).toBe("Modifié");
      expect(response.errors).toBeUndefined();
    });
  });

  describe("Mutation deleteDocuments", () => {
    it("devrait supprimer un documents", async () => {
      const existing = await prisma.documents.create({
        data: { name: "À supprimer" },
      });

      const mutation = `
        mutation Delete($id: Int!) {
          deleteDocuments(id: $id) {
            success
            message
          }
        }
      `;

      const response = await graphqlRequest(mutation, { id: existing.id }, authToken);

      expect(response.data.deleteDocuments.success).toBe(true);
      expect(response.errors).toBeUndefined();

      // Vérifier que c'est bien supprimé
      const deleted = await prisma.documents.findUnique({
        where: { id: existing.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Scénarios complets", () => {
    it("devrait gérer un workflow complet CRUD", async () => {
      // CREATE
      const createMutation = `
        mutation Create($input: CreateDocumentsInput!) {
          createDocuments(input: $input) {
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
      const createdId = createResponse.data.createDocuments.id;

      // READ
      const readQuery = `
        query Get($id: Int!) {
          document(id: $id) {
            id
            name
          }
        }
      `;

      const readResponse = await graphqlRequest(readQuery, { id: createdId }, authToken);
      expect(readResponse.data.document.name).toBe("Workflow Test");

      // UPDATE
      const updateMutation = `
        mutation Update($id: Int!, $input: UpdateDocumentsInput!) {
          updateDocuments(id: $id, input: $input) {
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
      expect(updateResponse.data.updateDocuments.name).toBe("Updated Workflow");

      // DELETE
      const deleteMutation = `
        mutation Delete($id: Int!) {
          deleteDocuments(id: $id) {
            success
          }
        }
      `;

      const deleteResponse = await graphqlRequest(
        deleteMutation,
        { id: createdId },
        authToken
      );
      expect(deleteResponse.data.deleteDocuments.success).toBe(true);
    });
  });
});
