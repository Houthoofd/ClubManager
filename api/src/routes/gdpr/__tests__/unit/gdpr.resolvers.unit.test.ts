/**
 * 🧪 Tests Unitaires - Gdpr Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de gdpr
 */

import { gdprResolvers } from "../../core/resolvers/gdpr.resolvers";
import { GdprService } from "../../core/services/gdpr.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/gdpr.service");

describe("Gdpr Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<GdprService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new GdprService() as jest.Mocked<GdprService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:gdpr", "create:gdpr", "update:gdpr", "delete:gdpr"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.gdpr", () => {
    it("devrait retourner tous les gdpr", async () => {
      const mockGdpr = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockGdpr);

      const result = await gdprResolvers.Query.gdpr(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockGdpr);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        gdprResolvers.Query.gdpr({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        gdprResolvers.Query.gdpr({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createGdpr", () => {
    it("devrait créer un nouveau gdpr", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await gdprResolvers.Mutation.createGdpr(
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

  describe("Mutation.updateGdpr", () => {
    it("devrait mettre à jour un gdpr", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await gdprResolvers.Mutation.updateGdpr(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteGdpr", () => {
    it("devrait supprimer un gdpr", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await gdprResolvers.Mutation.deleteGdpr(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
