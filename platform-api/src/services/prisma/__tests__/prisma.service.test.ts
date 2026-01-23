/**
 * Unit tests for PrismaService
 * Tests singleton pattern, instance management, and basic functionality
 */

import { describe, it, expect } from "@jest/globals";

describe("PrismaService", () => {
  describe("Module exports", () => {
    it("should export default PrismaService class", async () => {
      const module = await import("../prisma.service.js");
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe("function");
    });

    it("should export prisma singleton instance", async () => {
      const module = await import("../prisma.service.js");
      expect(module.prisma).toBeDefined();
      expect(typeof module.prisma).toBe("object");
    });

    it("should have expected exports", async () => {
      const module = await import("../prisma.service.js");
      const exports = Object.keys(module);
      expect(exports).toContain("default");
      expect(exports).toContain("prisma");
    });
  });

  describe("PrismaService class", () => {
    it("should have getInstance static method", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      expect(typeof PrismaService.getInstance).toBe("function");
    });

    it("should have disconnect static method", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      expect(typeof PrismaService.disconnect).toBe("function");
    });

    it("should have validateTenant static method", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      expect(typeof PrismaService.validateTenant).toBe("function");
    });

    it("should have getTenantBySlug static method", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      expect(typeof PrismaService.getTenantBySlug).toBe("function");
    });

    it("should have withTenant static method", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      expect(typeof PrismaService.withTenant).toBe("function");
    });

    it("should have healthCheck static method", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      expect(typeof PrismaService.healthCheck).toBe("function");
    });
  });

  describe("Singleton pattern", () => {
    it("should return the same instance on multiple calls", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const instance1 = PrismaService.getInstance();
      const instance2 = PrismaService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should return a valid PrismaClient instance", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      const instance = PrismaService.getInstance();

      expect(instance).toBeDefined();
      expect(instance).toHaveProperty("$connect");
      expect(instance).toHaveProperty("$disconnect");
      expect(instance).toHaveProperty("$queryRaw");
      expect(instance).toHaveProperty("$executeRaw");
    });

    it("should export prisma as singleton instance", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe("object");
      expect(prisma).toHaveProperty("$connect");
    });

    it("should maintain singleton across multiple imports", async () => {
      const module1 = await import("../prisma.service.js");
      const module2 = await import("../prisma.service.js");

      expect(module1.prisma).toBe(module2.prisma);
    });
  });

  describe("Prisma instance properties", () => {
    it("should have required PrismaClient methods", async () => {
      const { prisma } = await import("../prisma.service.js");

      // Core methods
      expect(typeof prisma.$connect).toBe("function");
      expect(typeof prisma.$disconnect).toBe("function");
      expect(typeof prisma.$queryRaw).toBe("function");
      expect(typeof prisma.$executeRaw).toBe("function");
      expect(typeof prisma.$transaction).toBe("function");
    });

    it("should not be null or undefined", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(prisma).not.toBeNull();
      expect(prisma).not.toBeUndefined();
    });

    it("should have transaction support", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(prisma.$transaction).toBeDefined();
      expect(typeof prisma.$transaction).toBe("function");
    });

    it("should have raw query support", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(prisma.$queryRaw).toBeDefined();
      expect(prisma.$executeRaw).toBeDefined();
    });

    it("should have middleware support", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(prisma.$use).toBeDefined();
      expect(typeof prisma.$use).toBe("function");
    });

    it("should have connection methods", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(prisma.$connect).toBeDefined();
      expect(prisma.$disconnect).toBeDefined();
    });
  });

  describe("withTenant helper", () => {
    it("should return tenant isolation wrapper", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      const tenantId = "test-tenant-123";

      const wrapper = PrismaService.withTenant(tenantId);

      expect(wrapper).toBeDefined();
      expect(wrapper.tenantId).toBe(tenantId);
      expect(wrapper.prisma).toBeDefined();
    });

    it("should have tenant-aware query methods", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      const wrapper = PrismaService.withTenant("tenant-123");

      expect(typeof wrapper.findMany).toBe("function");
      expect(typeof wrapper.findUnique).toBe("function");
      expect(typeof wrapper.create).toBe("function");
      expect(typeof wrapper.update).toBe("function");
      expect(typeof wrapper.delete).toBe("function");
    });

    it("should store tenantId in wrapper", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;
      const tenantId = "test-tenant-456";

      const wrapper = PrismaService.withTenant(tenantId);

      expect(wrapper.tenantId).toBe(tenantId);
    });
  });

  describe("Error handling", () => {
    it("should not throw when getting instance", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      expect(() => {
        PrismaService.getInstance();
      }).not.toThrow();
    });

    it("should handle multiple getInstance calls without errors", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      expect(() => {
        for (let i = 0; i < 10; i++) {
          PrismaService.getInstance();
        }
      }).not.toThrow();
    });
  });

  describe("Concurrent access", () => {
    it("should handle concurrent getInstance calls", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(PrismaService.getInstance()),
      );

      const instances = await Promise.all(promises);

      // All instances should be the same
      const firstInstance = instances[0];
      instances.forEach((instance) => {
        expect(instance).toBe(firstInstance);
      });
    });

    it("should maintain singleton pattern under load", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const instanceSet = new Set();

      for (let i = 0; i < 100; i++) {
        instanceSet.add(PrismaService.getInstance());
      }

      // Should only have one unique instance
      expect(instanceSet.size).toBe(1);
    });
  });

  describe("Memory management", () => {
    it("should reuse the same instance to avoid memory leaks", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const instances: any[] = [];

      for (let i = 0; i < 50; i++) {
        instances.push(PrismaService.getInstance());
      }

      // All should reference the same object
      const firstInstance = instances[0];
      expect(instances.every((inst) => inst === firstInstance)).toBe(true);
    });

    it("should use exported prisma instance consistently", async () => {
      const { prisma } = await import("../prisma.service.js");
      const PrismaService = (await import("../prisma.service.js")).default;

      const instance = PrismaService.getInstance();

      expect(prisma).toBe(instance);
    });
  });

  describe("Performance", () => {
    it("should return getInstance immediately", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const start = Date.now();
      PrismaService.getInstance();
      const duration = Date.now() - start;

      // Should be synchronous and fast
      expect(duration).toBeLessThan(100);
    });

    it("should not return a Promise from getInstance", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const instance = PrismaService.getInstance();
      expect(instance).not.toBeInstanceOf(Promise);
    });

    it("should return consistent results on rapid calls", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(PrismaService.getInstance());
      }

      // All results should be identical
      expect(new Set(results).size).toBe(1);
    });
  });

  describe("Service stability", () => {
    it("should maintain instance after time delay", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const instance1 = PrismaService.getInstance();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const instance2 = PrismaService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should be resilient to rapid repeated calls", async () => {
      const PrismaService = (await import("../prisma.service.js")).default;

      const instances = [];
      for (let i = 0; i < 1000; i++) {
        instances.push(PrismaService.getInstance());
      }

      expect(new Set(instances).size).toBe(1);
    });
  });

  describe("Type checks", () => {
    it("should be an object instance", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(typeof prisma).toBe("object");
      expect(prisma).not.toBeNull();
    });

    it("should have expected object structure", async () => {
      const { prisma } = await import("../prisma.service.js");

      expect(prisma).toHaveProperty("$connect");
      expect(prisma).toHaveProperty("$disconnect");
      expect(prisma.constructor).toBeDefined();
    });
  });
});
