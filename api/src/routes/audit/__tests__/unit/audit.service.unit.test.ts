/**
 * 🧪 Tests Unitaires - Audit Service
 *
 * Tests unitaires pour le service audit
 */

import { AuditService } from "../../core/services/audit.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { ValidationError, NotFoundError } from "@/shared/errors";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    audit: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("AuditService - Tests Unitaires", () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService();
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("devrait retourner tous les audit", async () => {
      const mockAudit = [
        { id: 1, name: "Test 1" },
        { id: 2, name: "Test 2" },
      ];

      (prisma.audit.findMany as jest.Mock).mockResolvedValue(mockAudit);

      const result = await service.findAll({});

      expect(result).toEqual(mockAudit);
      expect(prisma.audit.findMany).toHaveBeenCalledWith({
        where: {},
        take: 50,
        skip: 0,
        orderBy: { id: 'desc' },
      });
    });

    it("devrait respecter la limite et l'offset", async () => {
      await service.findAll({ limit: 10, offset: 20 });

      expect(prisma.audit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("findById", () => {
    it("devrait retourner un audit par ID", async () => {
      const mockAudit = { id: 1, name: "Test" };
      (prisma.audit.findFirst as jest.Mock).mockResolvedValue(mockAudit);

      const result = await service.findById(1);

      expect(result).toEqual(mockAudit);
      expect(prisma.audit.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si non trouvé", async () => {
      (prisma.audit.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("devrait créer un nouveau audit", async () => {
      const input = { name: "Nouveau audit" };
      const created = { id: 1, ...input };

      (prisma.audit.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(prisma.audit.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it("devrait lancer une erreur si les données sont invalides", async () => {
      await expect(service.create(null)).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("devrait mettre à jour un audit existant", async () => {
      const existing = { id: 1, name: "Ancien" };
      const updated = { id: 1, name: "Nouveau" };

      (prisma.audit.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.audit.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(1, { name: "Nouveau" });

      expect(result).toEqual(updated);
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.audit.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("devrait supprimer un audit existant", async () => {
      const existing = { id: 1, name: "Test" };

      (prisma.audit.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.audit.delete as jest.Mock).mockResolvedValue(existing);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(prisma.audit.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.audit.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("count", () => {
    it("devrait compter les audit", async () => {
      (prisma.audit.count as jest.Mock).mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });
});
