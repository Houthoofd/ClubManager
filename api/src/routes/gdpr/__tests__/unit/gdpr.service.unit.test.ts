/**
 * 🧪 Tests Unitaires - Gdpr Service
 *
 * Tests unitaires pour le service gdpr
 */

import { GdprService } from "../../core/services/gdpr.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { ValidationError, NotFoundError } from "@/shared/errors";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    gdpr: {
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

describe("GdprService - Tests Unitaires", () => {
  let service: GdprService;

  beforeEach(() => {
    service = new GdprService();
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("devrait retourner tous les gdpr", async () => {
      const mockGdpr = [
        { id: 1, name: "Test 1" },
        { id: 2, name: "Test 2" },
      ];

      (prisma.gdpr.findMany as jest.Mock).mockResolvedValue(mockGdpr);

      const result = await service.findAll({});

      expect(result).toEqual(mockGdpr);
      expect(prisma.gdpr.findMany).toHaveBeenCalledWith({
        where: {},
        take: 50,
        skip: 0,
        orderBy: { id: 'desc' },
      });
    });

    it("devrait respecter la limite et l'offset", async () => {
      await service.findAll({ limit: 10, offset: 20 });

      expect(prisma.gdpr.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("findById", () => {
    it("devrait retourner un gdpr par ID", async () => {
      const mockGdpr = { id: 1, name: "Test" };
      (prisma.gdpr.findFirst as jest.Mock).mockResolvedValue(mockGdpr);

      const result = await service.findById(1);

      expect(result).toEqual(mockGdpr);
      expect(prisma.gdpr.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si non trouvé", async () => {
      (prisma.gdpr.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("devrait créer un nouveau gdpr", async () => {
      const input = { name: "Nouveau gdpr" };
      const created = { id: 1, ...input };

      (prisma.gdpr.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(prisma.gdpr.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it("devrait lancer une erreur si les données sont invalides", async () => {
      await expect(service.create(null)).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("devrait mettre à jour un gdpr existant", async () => {
      const existing = { id: 1, name: "Ancien" };
      const updated = { id: 1, name: "Nouveau" };

      (prisma.gdpr.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.gdpr.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(1, { name: "Nouveau" });

      expect(result).toEqual(updated);
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.gdpr.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("devrait supprimer un gdpr existant", async () => {
      const existing = { id: 1, name: "Test" };

      (prisma.gdpr.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.gdpr.delete as jest.Mock).mockResolvedValue(existing);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(prisma.gdpr.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.gdpr.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("count", () => {
    it("devrait compter les gdpr", async () => {
      (prisma.gdpr.count as jest.Mock).mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });
});
