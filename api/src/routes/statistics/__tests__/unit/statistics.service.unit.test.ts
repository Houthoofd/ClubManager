/**
 * 🧪 Tests Unitaires - Statistics Service
 *
 * Tests unitaires pour le service statistics
 */

import { StatisticsService } from "../../core/services/statistics.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { ValidationError, NotFoundError } from "@/shared/errors";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    statistics: {
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

describe("StatisticsService - Tests Unitaires", () => {
  let service: StatisticsService;

  beforeEach(() => {
    service = new StatisticsService();
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("devrait retourner tous les statistics", async () => {
      const mockStatistics = [
        { id: 1, name: "Test 1" },
        { id: 2, name: "Test 2" },
      ];

      (prisma.statistics.findMany as jest.Mock).mockResolvedValue(mockStatistics);

      const result = await service.findAll({});

      expect(result).toEqual(mockStatistics);
      expect(prisma.statistics.findMany).toHaveBeenCalledWith({
        where: {},
        take: 50,
        skip: 0,
        orderBy: { id: 'desc' },
      });
    });

    it("devrait respecter la limite et l'offset", async () => {
      await service.findAll({ limit: 10, offset: 20 });

      expect(prisma.statistics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("findById", () => {
    it("devrait retourner un statistic par ID", async () => {
      const mockStatistics = { id: 1, name: "Test" };
      (prisma.statistics.findFirst as jest.Mock).mockResolvedValue(mockStatistics);

      const result = await service.findById(1);

      expect(result).toEqual(mockStatistics);
      expect(prisma.statistics.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si non trouvé", async () => {
      (prisma.statistics.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("devrait créer un nouveau statistic", async () => {
      const input = { name: "Nouveau statistic" };
      const created = { id: 1, ...input };

      (prisma.statistics.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(prisma.statistics.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it("devrait lancer une erreur si les données sont invalides", async () => {
      await expect(service.create(null)).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("devrait mettre à jour un statistic existant", async () => {
      const existing = { id: 1, name: "Ancien" };
      const updated = { id: 1, name: "Nouveau" };

      (prisma.statistics.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.statistics.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(1, { name: "Nouveau" });

      expect(result).toEqual(updated);
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.statistics.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("devrait supprimer un statistic existant", async () => {
      const existing = { id: 1, name: "Test" };

      (prisma.statistics.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.statistics.delete as jest.Mock).mockResolvedValue(existing);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(prisma.statistics.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.statistics.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("count", () => {
    it("devrait compter les statistics", async () => {
      (prisma.statistics.count as jest.Mock).mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });
});
