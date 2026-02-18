/**
 * 🧪 Tests Unitaires - Statistics Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de statistics
 */

import { statisticsResolvers } from "../../core/resolvers/statistics.resolvers";
import { StatisticsService } from "../../core/services/statistics.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/statistics.service");

describe("Statistics Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<StatisticsService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new StatisticsService() as jest.Mocked<StatisticsService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:statistics", "create:statistics", "update:statistics", "delete:statistics"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.statistics", () => {
    it("devrait retourner tous les statistics", async () => {
      const mockStatistics = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockStatistics);

      const result = await statisticsResolvers.Query.statistics(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockStatistics);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        statisticsResolvers.Query.statistics({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        statisticsResolvers.Query.statistics({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createStatistics", () => {
    it("devrait créer un nouveau statistics", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await statisticsResolvers.Mutation.createStatistics(
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

  describe("Mutation.updateStatistics", () => {
    it("devrait mettre à jour un statistics", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await statisticsResolvers.Mutation.updateStatistics(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteStatistics", () => {
    it("devrait supprimer un statistics", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await statisticsResolvers.Mutation.deleteStatistics(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
