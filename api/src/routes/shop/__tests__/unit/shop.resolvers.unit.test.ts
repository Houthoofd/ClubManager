/**
 * 🧪 Tests Unitaires - Shop Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de shop
 */

import { shopResolvers } from "../../core/resolvers/shop.resolvers";
import { ShopService } from "../../core/services/shop.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/shop.service");

describe("Shop Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<ShopService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new ShopService() as jest.Mocked<ShopService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:shop", "create:shop", "update:shop", "delete:shop"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.shop", () => {
    it("devrait retourner tous les shop", async () => {
      const mockShop = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockShop);

      const result = await shopResolvers.Query.shop(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockShop);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        shopResolvers.Query.shop({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        shopResolvers.Query.shop({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createShop", () => {
    it("devrait créer un nouveau shop", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await shopResolvers.Mutation.createShop(
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

  describe("Mutation.updateShop", () => {
    it("devrait mettre à jour un shop", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await shopResolvers.Mutation.updateShop(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteShop", () => {
    it("devrait supprimer un shop", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await shopResolvers.Mutation.deleteShop(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
