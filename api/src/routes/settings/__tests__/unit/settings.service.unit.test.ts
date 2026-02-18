/**
 * 🧪 Tests Unitaires - Settings Service
 *
 * Tests unitaires pour le service settings
 */

import { SettingsService } from "../../core/services/settings.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { ValidationError, NotFoundError } from "@/shared/errors";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    settings: {
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

describe("SettingsService - Tests Unitaires", () => {
  let service: SettingsService;

  beforeEach(() => {
    service = new SettingsService();
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("devrait retourner tous les settings", async () => {
      const mockSettings = [
        { id: 1, name: "Test 1" },
        { id: 2, name: "Test 2" },
      ];

      (prisma.settings.findMany as jest.Mock).mockResolvedValue(mockSettings);

      const result = await service.findAll({});

      expect(result).toEqual(mockSettings);
      expect(prisma.settings.findMany).toHaveBeenCalledWith({
        where: {},
        take: 50,
        skip: 0,
        orderBy: { id: 'desc' },
      });
    });

    it("devrait respecter la limite et l'offset", async () => {
      await service.findAll({ limit: 10, offset: 20 });

      expect(prisma.settings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("findById", () => {
    it("devrait retourner un setting par ID", async () => {
      const mockSettings = { id: 1, name: "Test" };
      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(mockSettings);

      const result = await service.findById(1);

      expect(result).toEqual(mockSettings);
      expect(prisma.settings.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si non trouvé", async () => {
      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("devrait créer un nouveau setting", async () => {
      const input = { name: "Nouveau setting" };
      const created = { id: 1, ...input };

      (prisma.settings.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(prisma.settings.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it("devrait lancer une erreur si les données sont invalides", async () => {
      await expect(service.create(null)).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("devrait mettre à jour un setting existant", async () => {
      const existing = { id: 1, name: "Ancien" };
      const updated = { id: 1, name: "Nouveau" };

      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.settings.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(1, { name: "Nouveau" });

      expect(result).toEqual(updated);
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("devrait supprimer un setting existant", async () => {
      const existing = { id: 1, name: "Test" };

      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.settings.delete as jest.Mock).mockResolvedValue(existing);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(prisma.settings.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.settings.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("count", () => {
    it("devrait compter les settings", async () => {
      (prisma.settings.count as jest.Mock).mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });
});
