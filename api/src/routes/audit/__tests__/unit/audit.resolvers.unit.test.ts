/**
 * 🧪 Tests Unitaires - Audit Resolvers
 *
 * Tests unitaires pour les resolvers GraphQL de audit
 */

import { auditResolvers } from "../../core/resolvers/audit.resolvers";
import { AuditService } from "../../core/services/audit.service";
import { AuthenticationError, NotFoundError } from "@/shared/errors";
import type { GraphQLContext } from "@/types/graphql";

// Mock du service
jest.mock("../../core/services/audit.service");

describe("Audit Resolvers - Tests Unitaires", () => {
  let mockService: jest.Mocked<AuditService>;
  let mockContext: GraphQLContext;

  beforeEach(() => {
    mockService = new AuditService() as jest.Mocked<AuditService>;
    mockContext = {
      user: { id: 1, email: "test@example.com", role: "admin" },
      permissions: ["read:audit", "create:audit", "update:audit", "delete:audit"],
    } as any;

    jest.clearAllMocks();
  });

  describe("Query.audit", () => {
    it("devrait retourner tous les audit", async () => {
      const mockAudit = [{ id: 1 }, { id: 2 }];
      mockService.findAll = jest.fn().mockResolvedValue(mockAudit);

      const result = await auditResolvers.Query.audit(
        {},
        { limit: 10, offset: 0 },
        mockContext
      );

      expect(result).toEqual(mockAudit);
    });

    it("devrait lancer une erreur si non authentifié", async () => {
      const unauthContext = { ...mockContext, user: null };

      await expect(
        auditResolvers.Query.audit({}, {}, unauthContext)
      ).rejects.toThrow(AuthenticationError);
    });

    it("devrait lancer une erreur si permission manquante", async () => {
      const noPermContext = { ...mockContext, permissions: [] };

      await expect(
        auditResolvers.Query.audit({}, {}, noPermContext)
      ).rejects.toThrow();
    });
  });

  describe("Mutation.createAudit", () => {
    it("devrait créer un nouveau audit", async () => {
      const input = { name: "Test" };
      const created = { id: 1, ...input };
      mockService.create = jest.fn().mockResolvedValue(created);

      const result = await auditResolvers.Mutation.createAudit(
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

  describe("Mutation.updateAudit", () => {
    it("devrait mettre à jour un audit", async () => {
      const input = { name: "Updated" };
      const updated = { id: 1, ...input };
      mockService.update = jest.fn().mockResolvedValue(updated);

      const result = await auditResolvers.Mutation.updateAudit(
        {},
        { id: 1, input },
        mockContext
      );

      expect(result).toEqual(updated);
    });
  });

  describe("Mutation.deleteAudit", () => {
    it("devrait supprimer un audit", async () => {
      mockService.delete = jest.fn().mockResolvedValue(true);

      const result = await auditResolvers.Mutation.deleteAudit(
        {},
        { id: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });
});
