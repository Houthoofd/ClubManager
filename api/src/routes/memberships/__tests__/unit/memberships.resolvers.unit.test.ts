/**
 * 🧪 Tests Unitaires - Memberships Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de memberships
 */

import { membershipsResolvers } from "../../core/resolvers/memberships.resolvers";
import { MembershipsService } from "../../core/services/memberships.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/memberships.service");

describe("Memberships Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<MembershipsService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new MembershipsService() as jest.Mocked<MembershipsService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:memberships", "create:memberships", "update:memberships", "delete:memberships"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.memberships", () => {
    it("devrait retourner tous les memberships", async () => {
      const mockMemberships = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockMemberships);

      const result = await membershipsResolvers.Query.memberships(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockMemberships);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        membershipsResolvers.Query.memberships({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        membershipsResolvers.Query.memberships({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createMemberships", () => {
    it("devrait créer un nouveau memberships", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await membershipsResolvers.Mutation.createMemberships(
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

  describe("Mutation.updateMemberships", () => {
    it("devrait mettre à jour un memberships", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await membershipsResolvers.Mutation.updateMemberships(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteMemberships", () => {
    it("devrait supprimer un memberships", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await membershipsResolvers.Mutation.deleteMemberships(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
