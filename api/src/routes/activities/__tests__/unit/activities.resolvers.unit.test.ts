/**
 * 🧪 Tests Unitaires - Activities Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de activities
 */

import { activitiesResolvers } from "../../core/resolvers/activities.resolvers";
import { ActivitiesService } from "../../core/services/activities.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/activities.service");

describe("Activities Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<ActivitiesService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new ActivitiesService() as jest.Mocked<ActivitiesService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:activities", "create:activities", "update:activities", "delete:activities"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.activities", () => {
    it("devrait retourner tous les activities", async () => {
      const mockActivities = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockActivities);

      const result = await activitiesResolvers.Query.activities(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockActivities);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        activitiesResolvers.Query.activities({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        activitiesResolvers.Query.activities({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createActivities", () => {
    it("devrait créer un nouveau activities", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await activitiesResolvers.Mutation.createActivities(
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

  describe("Mutation.updateActivities", () => {
    it("devrait mettre à jour un activities", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await activitiesResolvers.Mutation.updateActivities(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteActivities", () => {
    it("devrait supprimer un activities", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await activitiesResolvers.Mutation.deleteActivities(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
