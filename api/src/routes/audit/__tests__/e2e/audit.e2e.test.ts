/**
 * 🌐 Tests E2E - Audit
 *
 * Tests end-to-end pour audit via GraphQL
 */

import { graphqlRequest, authenticateUser } from "@/tests/helpers/graphql";
import { setupTestDatabase, cleanupTestDatabase } from "@/tests/helpers/database";
import { prisma } from "@/infrastructure/database/prisma-client";

describe("Audit - Tests E2E", () => {
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
    await prisma.audit.deleteMany({});
  });

  describe("Query audit", () => {
    it("devrait récupérer tous les audit", async () => {
      // Créer des données de test
      await prisma.audit.createMany({
        data: [
          { name: "Test 1" },
          { name: "Test 2" },
        ],
      });

      const query = `
        query {
          audit(limit: 10, offset: 0) {
            id
            name
          }
        }
      `;

      const response = await graphqlRequest(query, {}, authToken);

      expect(response.data.audit).toHaveLength(2);
      expect(response.errors).toBeUndefined();
    });

    it("devrait paginer les résultats", async () => {
      // Créer 25 éléments
      await prisma.audit.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Test ${i + 1}`,
        })),
      });

      const query = `
        query GetPaginated($limit: Int!, $offset: Int!) {
          audit(limit: $limit, offset: $offset) {
            id
            name
          }
        }
      `;

      const page1 = await graphqlRequest(query, { limit: 10, offset: 0 }, authToken);
      const page2 = await graphqlRequest(query, { limit: 10, offset: 10 }, authToken);

      expect(page1.data.audit).toHaveLength(10);
      expect(page2.data.audit).toHaveLength(10);
      expect(page1.data.audit[0].id).not.toBe(page2.data.audit[0].id);
    });
  });

  describe("Mutation createAudit", () => {
    it("devrait créer un nouveau audit", async () => {
      const mutation = `
        mutation Create($input: CreateAuditInput!) {
          createAudit(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: "Nouveau Audit",
        },
      };

      const response = await graphqlRequest(mutation, variables, authToken);

      expect(response.data.createAudit).toBeDefined();
      expect(response.data.createAudit.name).toBe("Nouveau Audit");
      expect(response.errors).toBeUndefined();

      // Vérifier en base de données
      const created = await prisma.audit.findUnique({
        where: { id: response.data.createAudit.id },
      });
      expect(created).toBeDefined();
    });

    it("devrait valider les données d'entrée", async () => {
      const mutation = `
        mutation Create($input: CreateAuditInput!) {
          createAudit(input: $input) {
            id
          }
        }
      `;

      const response = await graphqlRequest(mutation, { input: {} }, authToken);

      expect(response.errors).toBeDefined();
    });
  });

  describe("Mutation updateAudit", () => {
    it("devrait mettre à jour un audit existant", async () => {
      const existing = await prisma.audit.create({
        data: { name: "Original" },
      });

      const mutation = `
        mutation Update($id: Int!, $input: UpdateAuditInput!) {
          updateAudit(id: $id, input: $input) {
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

      expect(response.data.updateAudit.name).toBe("Modifié");
      expect(response.errors).toBeUndefined();
    });
  });

  describe("Mutation deleteAudit", () => {
    it("devrait supprimer un audit", async () => {
      const existing = await prisma.audit.create({
        data: { name: "À supprimer" },
      });

      const mutation = `
        mutation Delete($id: Int!) {
          deleteAudit(id: $id) {
            success
            message
          }
        }
      `;

      const response = await graphqlRequest(mutation, { id: existing.id }, authToken);

      expect(response.data.deleteAudit.success).toBe(true);
      expect(response.errors).toBeUndefined();

      // Vérifier que c'est bien supprimé
      const deleted = await prisma.audit.findUnique({
        where: { id: existing.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Scénarios complets", () => {
    it("devrait gérer un workflow complet CRUD", async () => {
      // CREATE
      const createMutation = `
        mutation Create($input: CreateAuditInput!) {
          createAudit(input: $input) {
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
      const createdId = createResponse.data.createAudit.id;

      // READ
      const readQuery = `
        query Get($id: Int!) {
          audit(id: $id) {
            id
            name
          }
        }
      `;

      const readResponse = await graphqlRequest(readQuery, { id: createdId }, authToken);
      expect(readResponse.data.audit.name).toBe("Workflow Test");

      // UPDATE
      const updateMutation = `
        mutation Update($id: Int!, $input: UpdateAuditInput!) {
          updateAudit(id: $id, input: $input) {
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
      expect(updateResponse.data.updateAudit.name).toBe("Updated Workflow");

      // DELETE
      const deleteMutation = `
        mutation Delete($id: Int!) {
          deleteAudit(id: $id) {
            success
          }
        }
      `;

      const deleteResponse = await graphqlRequest(
        deleteMutation,
        { id: createdId },
        authToken
      );
      expect(deleteResponse.data.deleteAudit.success).toBe(true);
    });
  });
});
