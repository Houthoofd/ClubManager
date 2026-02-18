/**
 * 🧪 Tests Unitaires - Communications Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de communications
 */

import { communicationsResolvers } from "../../core/resolvers/communications.resolvers";
import { CommunicationsService } from "../../core/services/communications.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/communications.service");

describe("Communications Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<CommunicationsService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new CommunicationsService() as jest.Mocked<CommunicationsService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:communications", "create:communications", "update:communications", "delete:communications"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.communications", () => {
    it("devrait retourner tous les communications", async () => {
      const mockCommunications = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockCommunications);

      const result = await communicationsResolvers.Query.communications(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockCommunications);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        communicationsResolvers.Query.communications({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        communicationsResolvers.Query.communications({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createCommunications", () => {
    it("devrait créer un nouveau communications", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await communicationsResolvers.Mutation.createCommunications(
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

  describe("Mutation.updateCommunications", () => {
    it("devrait mettre à jour un communications", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await communicationsResolvers.Mutation.updateCommunications(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteCommunications", () => {
    it("devrait supprimer un communications", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await communicationsResolvers.Mutation.deleteCommunications(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
