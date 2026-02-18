/**
 * 🧪 Tests Unitaires - Settings Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de settings
 */

import { settingsResolvers } from "../../core/resolvers/settings.resolvers";
import { SettingsService } from "../../core/services/settings.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/settings.service");

describe("Settings Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<SettingsService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new SettingsService() as jest.Mocked<SettingsService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:settings", "create:settings", "update:settings", "delete:settings"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.settings", () => {
    it("devrait retourner tous les settings", async () => {
      const mockSettings = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockSettings);

      const result = await settingsResolvers.Query.settings(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockSettings);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        settingsResolvers.Query.settings({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        settingsResolvers.Query.settings({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createSettings", () => {
    it("devrait créer un nouveau settings", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await settingsResolvers.Mutation.createSettings(
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

  describe("Mutation.updateSettings", () => {
    it("devrait mettre à jour un settings", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await settingsResolvers.Mutation.updateSettings(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteSettings", () => {
    it("devrait supprimer un settings", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await settingsResolvers.Mutation.deleteSettings(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
