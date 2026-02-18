/**
 * 🧪 Tests Unitaires - Communications Service
 *
 * Tests unitaires pour le service communications
 */

import { CommunicationsService } from "../../core/services/communications.service";
import { prisma } from "@/infrastructure/database/prisma-client";
import { ValidationError, NotFoundError } from "@/shared/errors";

// Mock Prisma
jest.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    communications: {
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

describe("CommunicationsService - Tests Unitaires", () => {
  let service: CommunicationsService;

  beforeEach(() => {
    service = new CommunicationsService();
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("devrait retourner tous les communications", async () => {
      const mockCommunications = [
        { id: 1, name: "Test 1" },
        { id: 2, name: "Test 2" },
      ];

      (prisma.communications.findMany as jest.Mock).mockResolvedValue(mockCommunications);

      const result = await service.findAll({});

      expect(result).toEqual(mockCommunications);
      expect(prisma.communications.findMany).toHaveBeenCalledWith({
        where: {},
        take: 50,
        skip: 0,
        orderBy: { id: 'desc' },
      });
    });

    it("devrait respecter la limite et l'offset", async () => {
      await service.findAll({ limit: 10, offset: 20 });

      expect(prisma.communications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe("findById", () => {
    it("devrait retourner un communication par ID", async () => {
      const mockCommunications = { id: 1, name: "Test" };
      (prisma.communications.findFirst as jest.Mock).mockResolvedValue(mockCommunications);

      const result = await service.findById(1);

      expect(result).toEqual(mockCommunications);
      expect(prisma.communications.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait retourner null si non trouvé", async () => {
      (prisma.communications.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("devrait créer un nouveau communication", async () => {
      const input = { name: "Nouveau communication" };
      const created = { id: 1, ...input };

      (prisma.communications.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(prisma.communications.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it("devrait lancer une erreur si les données sont invalides", async () => {
      await expect(service.create(null)).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("devrait mettre à jour un communication existant", async () => {
      const existing = { id: 1, name: "Ancien" };
      const updated = { id: 1, name: "Nouveau" };

      (prisma.communications.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.communications.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(1, { name: "Nouveau" });

      expect(result).toEqual(updated);
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.communications.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("devrait supprimer un communication existant", async () => {
      const existing = { id: 1, name: "Test" };

      (prisma.communications.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.communications.delete as jest.Mock).mockResolvedValue(existing);

      const result = await service.delete(1);

      expect(result).toBe(true);
      expect(prisma.communications.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer une erreur si non trouvé", async () => {
      (prisma.communications.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("count", () => {
    it("devrait compter les communications", async () => {
      (prisma.communications.count as jest.Mock).mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
    });
  });
});
