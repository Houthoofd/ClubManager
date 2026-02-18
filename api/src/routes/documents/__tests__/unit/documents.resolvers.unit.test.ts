/**
 * 🧪 Tests Unitaires - Documents Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de documents
 */

import { documentsResolvers } from "../../core/resolvers/documents.resolvers";
import { DocumentsService } from "../../core/services/documents.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/documents.service");

describe("Documents Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<DocumentsService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new DocumentsService() as jest.Mocked<DocumentsService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:documents", "create:documents", "update:documents", "delete:documents"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.documents", () => {
    it("devrait retourner tous les documents", async () => {
      const mockDocuments = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockDocuments);

      const result = await documentsResolvers.Query.documents(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockDocuments);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        documentsResolvers.Query.documents({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        documentsResolvers.Query.documents({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createDocuments", () => {
    it("devrait créer un nouveau documents", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await documentsResolvers.Mutation.createDocuments(
        {},
        { input },
        mockContext
      );

      expect(result).toEqual(created);
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining(input)
      );
    });
  });

  describe("Mutation.updateDocuments", () => {
    it("devrait mettre à jour un documents", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await documentsResolvers.Mutation.updateDocuments(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteDocuments", () => {
    it("devrait supprimer un documents", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await documentsResolvers.Mutation.deleteDocuments(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
