/**
 * 🧪 Tests Unitaires - Users Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de users
 */

import { usersResolvers } from "../../core/resolvers/users.resolvers";
import { UsersService } from "../../core/services/users.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/users.service");

describe("Users Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<UsersService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new UsersService() as jest.Mocked<UsersService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:users", "create:users", "update:users", "delete:users"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.users", () => {
    it("devrait retourner tous les users", async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockUsers);

      const result = await usersResolvers.Query.users(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockUsers);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        usersResolvers.Query.users({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        usersResolvers.Query.users({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createUsers", () => {
    it("devrait créer un nouveau users", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await usersResolvers.Mutation.createUsers(
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

  describe("Mutation.updateUsers", () => {
    it("devrait mettre à jour un users", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await usersResolvers.Mutation.updateUsers(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteUsers", () => {
    it("devrait supprimer un users", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await usersResolvers.Mutation.deleteUsers(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
