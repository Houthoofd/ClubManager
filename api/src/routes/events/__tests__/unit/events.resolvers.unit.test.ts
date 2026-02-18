/**
 * 🧪 Tests Unitaires - Events Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de events
 */

import { eventsResolvers } from "../../core/resolvers/events.resolvers";
import { EventsService } from "../../core/services/events.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/events.service");

describe("Events Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<EventsService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new EventsService() as jest.Mocked<EventsService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:events", "create:events", "update:events", "delete:events"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.events", () => {
    it("devrait retourner tous les events", async () => {
      const mockEvents = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockEvents);

      const result = await eventsResolvers.Query.events(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockEvents);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        eventsResolvers.Query.events({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        eventsResolvers.Query.events({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createEvents", () => {
    it("devrait créer un nouveau events", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await eventsResolvers.Mutation.createEvents(
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

  describe("Mutation.updateEvents", () => {
    it("devrait mettre à jour un events", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await eventsResolvers.Mutation.updateEvents(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteEvents", () => {
    it("devrait supprimer un events", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await eventsResolvers.Mutation.deleteEvents(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
