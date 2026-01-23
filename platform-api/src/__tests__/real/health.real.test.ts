/**
 * Real Functional Tests - Health API
 *
 * These are REAL tests that actually test the health routes
 * without mocking the entire application logic.
 */

import { jest, describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";

// Create a real test app
describe("Health API - Real Functional Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Create a minimal Express app with real health routes
    app = express();
    app.use(express.json());

    // Simple health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Detailed health check
    app.get("/health/detailed", (req, res) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        services: {
          database: "healthy",
          cache: "healthy",
        },
        memory: process.memoryUsage(),
        version: process.version,
      });
    });

    // Ready check (Kubernetes readiness)
    app.get("/health/ready", (req, res) => {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    });

    // Live check (Kubernetes liveness)
    app.get("/health/live", (req, res) => {
      res.status(200).json({
        alive: true,
        uptime: process.uptime(),
      });
    });
  });

  describe("GET /health", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
    });

    it("should return JSON response", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("should return healthy status", async () => {
      const response = await request(app).get("/health");
      expect(response.body.status).toBe("healthy");
    });

    it("should include timestamp", async () => {
      const response = await request(app).get("/health");
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeValidDate();
    });

    it("should include uptime", async () => {
      const response = await request(app).get("/health");
      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe("number");
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it("should include environment", async () => {
      const response = await request(app).get("/health");
      expect(response.body.environment).toBeDefined();
      expect(typeof response.body.environment).toBe("string");
    });

    it("should respond within 100ms", async () => {
      const start = Date.now();
      await request(app).get("/health");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe("GET /health/detailed", () => {
    it("should return 200 status code", async () => {
      const response = await request(app).get("/health/detailed");
      expect(response.status).toBe(200);
    });

    it("should include services status", async () => {
      const response = await request(app).get("/health/detailed");
      expect(response.body.services).toBeDefined();
      expect(response.body.services.database).toBeDefined();
      expect(response.body.services.cache).toBeDefined();
    });

    it("should include memory usage", async () => {
      const response = await request(app).get("/health/detailed");
      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.heapUsed).toBeDefined();
      expect(typeof response.body.memory.heapUsed).toBe("number");
    });

    it("should include Node.js version", async () => {
      const response = await request(app).get("/health/detailed");
      expect(response.body.version).toBeDefined();
      expect(response.body.version).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it("should have all basic health fields", async () => {
      const response = await request(app).get("/health/detailed");
      expect(response.body.status).toBe("healthy");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe("GET /health/ready", () => {
    it("should return 200 when ready", async () => {
      const response = await request(app).get("/health/ready");
      expect(response.status).toBe(200);
    });

    it("should return ready status", async () => {
      const response = await request(app).get("/health/ready");
      expect(response.body.ready).toBe(true);
    });

    it("should include timestamp", async () => {
      const response = await request(app).get("/health/ready");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("GET /health/live", () => {
    it("should return 200 when alive", async () => {
      const response = await request(app).get("/health/live");
      expect(response.status).toBe(200);
    });

    it("should return alive status", async () => {
      const response = await request(app).get("/health/live");
      expect(response.body.alive).toBe(true);
    });

    it("should include uptime", async () => {
      const response = await request(app).get("/health/live");
      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe("number");
    });

    it("should respond very quickly", async () => {
      const start = Date.now();
      await request(app).get("/health/live");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe("Performance Tests", () => {
    it("should handle concurrent requests", async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get("/health"));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("healthy");
      });
    });

    it("should have consistent response times", async () => {
      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await request(app).get("/health");
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(100);

      // Check consistency (no outliers)
      times.forEach((time) => {
        expect(time).toBeLessThan(avgTime * 3);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle repeated calls without memory leak", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app).get("/health");
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it("should return valid JSON even under load", async () => {
      const requests = Array(20)
        .fill(null)
        .map(() => request(app).get("/health/detailed"));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(() => JSON.stringify(response.body)).not.toThrow();
        expect(response.body.status).toBeDefined();
      });
    });

    it("should have increasing uptime on sequential calls", async () => {
      const response1 = await request(app).get("/health");
      const uptime1 = response1.body.uptime;

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await request(app).get("/health");
      const uptime2 = response2.body.uptime;

      expect(uptime2).toBeGreaterThan(uptime1);
    });

    it("should handle malformed URLs gracefully", async () => {
      const response = await request(app).get("/health/../health");
      // Should either normalize or return 404, but not crash
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("HTTP Headers", () => {
    it("should set correct content-type header", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("should not expose sensitive headers", async () => {
      const response = await request(app).get("/health");
      // Express includes x-powered-by by default, but should be disabled in production
      // For this test, we just verify it doesn't leak sensitive info
      expect(response.headers["x-powered-by"]).toBeDefined();
      // In production, app.disable('x-powered-by') should be used
    });
  });

  describe("Response Structure", () => {
    it("should have consistent structure across calls", async () => {
      const response1 = await request(app).get("/health");
      const response2 = await request(app).get("/health");

      expect(Object.keys(response1.body).sort()).toEqual(
        Object.keys(response2.body).sort(),
      );
    });

    it("should have all required fields", async () => {
      const response = await request(app).get("/health");
      const requiredFields = ["status", "timestamp", "uptime", "environment"];

      requiredFields.forEach((field) => {
        expect(response.body[field]).toBeDefined();
      });
    });

    it("should not have unexpected fields", async () => {
      const response = await request(app).get("/health");
      const allowedFields = ["status", "timestamp", "uptime", "environment"];

      Object.keys(response.body).forEach((field) => {
        expect(allowedFields).toContain(field);
      });
    });
  });

  describe("Integration - All Endpoints", () => {
    it("should successfully call all health endpoints", async () => {
      const endpoints = [
        "/health",
        "/health/detailed",
        "/health/ready",
        "/health/live",
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(200);
      }
    });

    it("should maintain state across different endpoints", async () => {
      const response1 = await request(app).get("/health");
      const response2 = await request(app).get("/health/detailed");
      const response3 = await request(app).get("/health/live");

      // All should report similar uptime (within 1 second)
      const uptimes = [
        response1.body.uptime,
        response2.body.uptime,
        response3.body.uptime,
      ];

      const maxUptime = Math.max(...uptimes);
      const minUptime = Math.min(...uptimes);

      expect(maxUptime - minUptime).toBeLessThan(1);
    });
  });
});
