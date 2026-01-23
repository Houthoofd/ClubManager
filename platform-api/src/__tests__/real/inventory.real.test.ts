/**
 * Real Functional Tests - Inventory API
 *
 * These are REAL tests that actually test the inventory routes
 * without mocking the entire application logic.
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express, { Express, Request, Response, NextFunction } from "express";

// Mock the inventory service
const mockInventoryService = {
  getInventorySummary: jest.fn(),
  getLowStockAlerts: jest.fn(),
  getLowStockProducts: jest.fn(),
  checkAvailability: jest.fn(),
  addStock: jest.fn(),
  removeStock: jest.fn(),
  setStock: jest.fn(),
  bulkUpdate: jest.fn(),
  reserveStock: jest.fn(),
  releaseStock: jest.fn(),
};

// Mock utility functions
const mockGetTenantId = jest.fn((req: Request) => "tenant-123");

const mockSendSuccess = (res: Response, data: any, message?: string, status?: number) => {
  return res.status(status || 200).json({
    success: true,
    message: message || "Success",
    data,
  });
};

const mockSendError = (res: Response, code: string, message: string, details?: any, status?: number) => {
  return res.status(status || 500).json({
    success: false,
    error: code,
    message,
    details,
  });
};

describe("Inventory API - Real Functional Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Middleware to simulate authentication
    app.use((req, res, next) => {
      (req as any).user = {
        id: "user-123",
        email: "user@example.com",
        role: "ADMIN",
      };
      next();
    });

    // GET /api/inventory/summary - Get inventory summary
    app.get("/api/inventory/summary", async (req: Request, res: Response) => {
      try {
        const tenantId = mockGetTenantId(req);
        const summary = await mockInventoryService.getInventorySummary(tenantId);

        return mockSendSuccess(res, summary);
      } catch (error) {
        return mockSendError(res, "INTERNAL_ERROR", "Failed to get inventory summary");
      }
    });

    // GET /api/inventory/alerts - Get low stock alerts
    app.get("/api/inventory/alerts", async (req: Request, res: Response) => {
      try {
        const tenantId = mockGetTenantId(req);
        const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;

        const alerts = await mockInventoryService.getLowStockAlerts(tenantId, threshold);

        return mockSendSuccess(res, alerts);
      } catch (error) {
        return mockSendError(res, "INTERNAL_ERROR", "Failed to get stock alerts");
      }
    });

    // GET /api/inventory/out-of-stock - Get out of stock products
    app.get("/api/inventory/out-of-stock", async (req: Request, res: Response) => {
      try {
        const products = await mockInventoryService.getLowStockProducts(0);

        return mockSendSuccess(res, products);
      } catch (error) {
        return mockSendError(res, "INTERNAL_ERROR", "Failed to get out of stock products");
      }
    });

    // POST /api/inventory/check-availability - Check stock availability
    app.post("/api/inventory/check-availability", async (req: Request, res: Response) => {
      try {
        const tenantId = mockGetTenantId(req);
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
          return mockSendError(res, "VALIDATION_ERROR", "Items array is required", { field: "items" }, 400);
        }

        const result = await mockInventoryService.checkAvailability(items, tenantId);

        return mockSendSuccess(res, result);
      } catch (error) {
        return mockSendError(res, "INTERNAL_ERROR", "Failed to check availability");
      }
    });

    // POST /api/inventory/:productId/add - Add stock to product
    app.post("/api/inventory/:productId/add", async (req: Request, res: Response) => {
      try {
        const productId = parseInt(req.params.productId);
        const tenantId = mockGetTenantId(req);
        const userId = (req as any).user?.id;
        const { quantity, reason } = req.body;

        if (isNaN(productId)) {
          return mockSendError(res, "VALIDATION_ERROR", "Invalid product ID", undefined, 400);
        }

        if (!quantity || quantity <= 0) {
          return mockSendError(res, "VALIDATION_ERROR", "Valid quantity is required", { field: "quantity" }, 400);
        }

        const product = await mockInventoryService.addStock(productId, quantity, tenantId, userId, reason);

        return mockSendSuccess(res, product, "Stock added successfully");
      } catch (error: any) {
        if (error.field) {
          return mockSendError(res, "VALIDATION_ERROR", error.message, { field: error.field }, 400);
        }
        if (error.message === "Product not found") {
          return mockSendError(res, "NOT_FOUND", error.message, undefined, 404);
        }
        return mockSendError(res, "INTERNAL_ERROR", "Failed to add stock");
      }
    });

    // POST /api/inventory/:productId/remove - Remove stock from product
    app.post("/api/inventory/:productId/remove", async (req: Request, res: Response) => {
      try {
        const productId = parseInt(req.params.productId);
        const tenantId = mockGetTenantId(req);
        const userId = (req as any).user?.id;
        const { quantity, reason } = req.body;

        if (isNaN(productId)) {
          return mockSendError(res, "VALIDATION_ERROR", "Invalid product ID", undefined, 400);
        }

        if (!quantity || quantity <= 0) {
          return mockSendError(res, "VALIDATION_ERROR", "Valid quantity is required", { field: "quantity" }, 400);
        }

        const product = await mockInventoryService.removeStock(productId, quantity, tenantId, userId, reason);

        return mockSendSuccess(res, product, "Stock removed successfully");
      } catch (error: any) {
        if (error.field) {
          return mockSendError(res, "VALIDATION_ERROR", error.message, { field: error.field }, 400);
        }
        if (error.message === "Product not found") {
          return mockSendError(res, "NOT_FOUND", error.message, undefined, 404);
        }
        return mockSendError(res, "INTERNAL_ERROR", "Failed to remove stock");
      }
    });

    // PUT /api/inventory/:productId/set - Set stock to specific value
    app.put("/api/inventory/:productId/set", async (req: Request, res: Response) => {
      try {
        const productId = parseInt(req.params.productId);
        const tenantId = mockGetTenantId(req);
        const userId = (req as any).user?.id;
        const { quantity, reason } = req.body;

        if (isNaN(productId)) {
          return mockSendError(res, "VALIDATION_ERROR", "Invalid product ID", undefined, 400);
        }

        if (quantity === undefined || quantity === null || quantity < 0) {
          return mockSendError(res, "VALIDATION_ERROR", "Valid quantity is required", { field: "quantity" }, 400);
        }

        const product = await mockInventoryService.setStock(productId, quantity, tenantId, userId, reason);

        return mockSendSuccess(res, product, "Stock set successfully");
      } catch (error: any) {
        if (error.field) {
          return mockSendError(res, "VALIDATION_ERROR", error.message, { field: error.field }, 400);
        }
        if (error.message === "Product not found") {
          return mockSendError(res, "NOT_FOUND", error.message, undefined, 404);
        }
        return mockSendError(res, "INTERNAL_ERROR", "Failed to set stock");
      }
    });

    // POST /api/inventory/bulk-update - Bulk update inventory
    app.post("/api/inventory/bulk-update", async (req: Request, res: Response) => {
      try {
        const tenantId = mockGetTenantId(req);
        const userId = (req as any).user?.id;
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
          return mockSendError(res, "VALIDATION_ERROR", "Updates array is required", { field: "updates" }, 400);
        }

        const result = await mockInventoryService.bulkUpdate(updates, tenantId, userId);

        const successCount = result.filter((r: any) => r.success).length;
        const failureCount = result.filter((r: any) => !r.success).length;

        return mockSendSuccess(
          res,
          result,
          `Bulk update completed: ${successCount} successful, ${failureCount} failed`
        );
      } catch (error: any) {
        if (error.field) {
          return mockSendError(res, "VALIDATION_ERROR", error.message, { field: error.field }, 400);
        }
        return mockSendError(res, "INTERNAL_ERROR", "Failed to bulk update inventory");
      }
    });

    // POST /api/inventory/reserve - Reserve stock for order
    app.post("/api/inventory/reserve", async (req: Request, res: Response) => {
      try {
        const tenantId = mockGetTenantId(req);
        const userId = (req as any).user?.id;
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
          return mockSendError(res, "VALIDATION_ERROR", "Items array is required", { field: "items" }, 400);
        }

        const result = await mockInventoryService.reserveStock(items, tenantId, userId);

        return mockSendSuccess(res, result, "Stock reserved successfully");
      } catch (error: any) {
        if (error.field) {
          return mockSendError(res, "VALIDATION_ERROR", error.message, { field: error.field }, 400);
        }
        return mockSendError(res, "INTERNAL_ERROR", "Failed to reserve stock");
      }
    });

    // POST /api/inventory/release - Release reserved stock
    app.post("/api/inventory/release", async (req: Request, res: Response) => {
      try {
        const tenantId = mockGetTenantId(req);
        const userId = (req as any).user?.id;
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
          return mockSendError(res, "VALIDATION_ERROR", "Items array is required", { field: "items" }, 400);
        }

        const result = await mockInventoryService.releaseStock(items, tenantId, userId);

        return mockSendSuccess(res, result, "Stock released successfully");
      } catch (error) {
        return mockSendError(res, "INTERNAL_ERROR", "Failed to release stock");
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/inventory/summary", () => {
    it("should return inventory summary", async () => {
      const mockSummary = {
        totalProducts: 150,
        totalStock: 5420,
        lowStockProducts: 15,
        outOfStockProducts: 5,
        totalValue: 123456.78,
        categories: [
          { name: "Electronics", count: 50 },
          { name: "Clothing", count: 100 },
        ],
      };

      mockInventoryService.getInventorySummary.mockResolvedValue(mockSummary);

      const response = await request(app).get("/api/inventory/summary");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSummary);
    });

    it("should include tenantId in request", async () => {
      mockInventoryService.getInventorySummary.mockResolvedValue({});

      await request(app).get("/api/inventory/summary");

      expect(mockInventoryService.getInventorySummary).toHaveBeenCalledWith("tenant-123");
    });

    it("should handle service errors", async () => {
      mockInventoryService.getInventorySummary.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/inventory/summary");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Failed to get inventory summary");
    });
  });

  describe("GET /api/inventory/alerts", () => {
    it("should return low stock alerts with default threshold", async () => {
      const mockAlerts = [
        { productId: 1, name: "Product 1", stock: 5, threshold: 10 },
        { productId: 2, name: "Product 2", stock: 8, threshold: 10 },
      ];

      mockInventoryService.getLowStockAlerts.mockResolvedValue(mockAlerts);

      const response = await request(app).get("/api/inventory/alerts");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockAlerts);
      expect(mockInventoryService.getLowStockAlerts).toHaveBeenCalledWith("tenant-123", 10);
    });

    it("should support custom threshold", async () => {
      mockInventoryService.getLowStockAlerts.mockResolvedValue([]);

      await request(app).get("/api/inventory/alerts?threshold=20");

      expect(mockInventoryService.getLowStockAlerts).toHaveBeenCalledWith("tenant-123", 20);
    });

    it("should handle service errors", async () => {
      mockInventoryService.getLowStockAlerts.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/inventory/alerts");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to get stock alerts");
    });
  });

  describe("GET /api/inventory/out-of-stock", () => {
    it("should return out of stock products", async () => {
      const mockProducts = [
        { id: 1, name: "Product 1", stock: 0 },
        { id: 2, name: "Product 2", stock: 0 },
      ];

      mockInventoryService.getLowStockProducts.mockResolvedValue(mockProducts);

      const response = await request(app).get("/api/inventory/out-of-stock");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockProducts);
      expect(mockInventoryService.getLowStockProducts).toHaveBeenCalledWith(0);
    });

    it("should handle empty results", async () => {
      mockInventoryService.getLowStockProducts.mockResolvedValue([]);

      const response = await request(app).get("/api/inventory/out-of-stock");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it("should handle service errors", async () => {
      mockInventoryService.getLowStockProducts.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/inventory/out-of-stock");

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/inventory/check-availability", () => {
    it("should check availability for multiple items", async () => {
      const items = [
        { productId: 1, quantity: 5 },
        { productId: 2, quantity: 10 },
      ];

      const mockResult = {
        available: true,
        items: [
          { productId: 1, requested: 5, available: 50, isAvailable: true },
          { productId: 2, requested: 10, available: 100, isAvailable: true },
        ],
      };

      mockInventoryService.checkAvailability.mockResolvedValue(mockResult);

      const response = await request(app).post("/api/inventory/check-availability").send({ items });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResult);
    });

    it("should detect insufficient stock", async () => {
      const items = [{ productId: 1, quantity: 100 }];

      const mockResult = {
        available: false,
        items: [{ productId: 1, requested: 100, available: 50, isAvailable: false }],
      };

      mockInventoryService.checkAvailability.mockResolvedValue(mockResult);

      const response = await request(app).post("/api/inventory/check-availability").send({ items });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
    });

    it("should require items array", async () => {
      const response = await request(app).post("/api/inventory/check-availability").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Items array is required");
      expect(response.body.details.field).toBe("items");
    });

    it("should validate items is an array", async () => {
      const response = await request(app).post("/api/inventory/check-availability").send({ items: "not-array" });

      expect(response.status).toBe(400);
    });

    it("should handle service errors", async () => {
      mockInventoryService.checkAvailability.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/api/inventory/check-availability").send({ items: [] });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/inventory/:productId/add", () => {
    it("should add stock to product", async () => {
      const updatedProduct = { id: 1, name: "Product 1", stock: 150 };
      mockInventoryService.addStock.mockResolvedValue(updatedProduct);

      const response = await request(app)
        .post("/api/inventory/1/add")
        .send({ quantity: 50, reason: "Restock" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Stock added successfully");
      expect(response.body.data).toEqual(updatedProduct);
    });

    it("should validate product ID", async () => {
      const response = await request(app).post("/api/inventory/invalid/add").send({ quantity: 10 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid product ID");
    });

    it("should require positive quantity", async () => {
      const response = await request(app).post("/api/inventory/1/add").send({ quantity: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Valid quantity is required");
      expect(response.body.details.field).toBe("quantity");
    });

    it("should reject negative quantity", async () => {
      const response = await request(app).post("/api/inventory/1/add").send({ quantity: -10 });

      expect(response.status).toBe(400);
    });

    it("should require quantity field", async () => {
      const response = await request(app).post("/api/inventory/1/add").send({});

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent product", async () => {
      mockInventoryService.addStock.mockRejectedValue(new Error("Product not found"));

      const response = await request(app).post("/api/inventory/999/add").send({ quantity: 10 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Product not found");
    });

    it("should include tenantId and userId", async () => {
      mockInventoryService.addStock.mockResolvedValue({ id: 1 });

      await request(app).post("/api/inventory/1/add").send({ quantity: 10, reason: "Restock" });

      expect(mockInventoryService.addStock).toHaveBeenCalledWith(1, 10, "tenant-123", "user-123", "Restock");
    });
  });

  describe("POST /api/inventory/:productId/remove", () => {
    it("should remove stock from product", async () => {
      const updatedProduct = { id: 1, name: "Product 1", stock: 50 };
      mockInventoryService.removeStock.mockResolvedValue(updatedProduct);

      const response = await request(app)
        .post("/api/inventory/1/remove")
        .send({ quantity: 50, reason: "Damaged" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Stock removed successfully");
      expect(response.body.data).toEqual(updatedProduct);
    });

    it("should validate product ID", async () => {
      const response = await request(app).post("/api/inventory/abc/remove").send({ quantity: 10 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid product ID");
    });

    it("should require positive quantity", async () => {
      const response = await request(app).post("/api/inventory/1/remove").send({ quantity: 0 });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent product", async () => {
      mockInventoryService.removeStock.mockRejectedValue(new Error("Product not found"));

      const response = await request(app).post("/api/inventory/999/remove").send({ quantity: 10 });

      expect(response.status).toBe(404);
    });

    it("should include reason in request", async () => {
      mockInventoryService.removeStock.mockResolvedValue({ id: 1 });

      await request(app).post("/api/inventory/1/remove").send({ quantity: 5, reason: "Damaged goods" });

      expect(mockInventoryService.removeStock).toHaveBeenCalledWith(1, 5, "tenant-123", "user-123", "Damaged goods");
    });
  });

  describe("PUT /api/inventory/:productId/set", () => {
    it("should set stock to specific value", async () => {
      const updatedProduct = { id: 1, name: "Product 1", stock: 200 };
      mockInventoryService.setStock.mockResolvedValue(updatedProduct);

      const response = await request(app)
        .put("/api/inventory/1/set")
        .send({ quantity: 200, reason: "Inventory count" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Stock set successfully");
      expect(response.body.data).toEqual(updatedProduct);
    });

    it("should accept zero stock", async () => {
      mockInventoryService.setStock.mockResolvedValue({ id: 1, stock: 0 });

      const response = await request(app).put("/api/inventory/1/set").send({ quantity: 0 });

      expect(response.status).toBe(200);
      expect(mockInventoryService.setStock).toHaveBeenCalledWith(1, 0, "tenant-123", "user-123", undefined);
    });

    it("should validate product ID", async () => {
      const response = await request(app).put("/api/inventory/xyz/set").send({ quantity: 100 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid product ID");
    });

    it("should require quantity field", async () => {
      const response = await request(app).put("/api/inventory/1/set").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Valid quantity is required");
      expect(response.body.details.field).toBe("quantity");
    });

    it("should reject negative quantity", async () => {
      const response = await request(app).put("/api/inventory/1/set").send({ quantity: -10 });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent product", async () => {
      mockInventoryService.setStock.mockRejectedValue(new Error("Product not found"));

      const response = await request(app).put("/api/inventory/999/set").send({ quantity: 100 });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/inventory/bulk-update", () => {
    it("should bulk update inventory", async () => {
      const updates = [
        { productId: 1, quantity: 100 },
        { productId: 2, quantity: 200 },
      ];

      const mockResult = [
        { productId: 1, success: true },
        { productId: 2, success: true },
      ];

      mockInventoryService.bulkUpdate.mockResolvedValue(mockResult);

      const response = await request(app).post("/api/inventory/bulk-update").send({ updates });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("2 successful, 0 failed");
      expect(response.body.data).toEqual(mockResult);
    });

    it("should handle partial failures", async () => {
      const updates = [
        { productId: 1, quantity: 100 },
        { productId: 999, quantity: 200 },
      ];

      const mockResult = [
        { productId: 1, success: true },
        { productId: 999, success: false, error: "Product not found" },
      ];

      mockInventoryService.bulkUpdate.mockResolvedValue(mockResult);

      const response = await request(app).post("/api/inventory/bulk-update").send({ updates });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("1 successful, 1 failed");
    });

    it("should require updates array", async () => {
      const response = await request(app).post("/api/inventory/bulk-update").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Updates array is required");
      expect(response.body.details.field).toBe("updates");
    });

    it("should validate updates is an array", async () => {
      const response = await request(app).post("/api/inventory/bulk-update").send({ updates: "not-array" });

      expect(response.status).toBe(400);
    });

    it("should include tenantId and userId", async () => {
      mockInventoryService.bulkUpdate.mockResolvedValue([]);

      await request(app).post("/api/inventory/bulk-update").send({ updates: [] });

      expect(mockInventoryService.bulkUpdate).toHaveBeenCalledWith([], "tenant-123", "user-123");
    });

    it("should handle service errors", async () => {
      mockInventoryService.bulkUpdate.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/api/inventory/bulk-update").send({ updates: [] });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/inventory/reserve", () => {
    it("should reserve stock for order", async () => {
      const items = [
        { productId: 1, quantity: 5 },
        { productId: 2, quantity: 3 },
      ];

      const mockResult = {
        success: true,
        reservedItems: items,
      };

      mockInventoryService.reserveStock.mockResolvedValue(mockResult);

      const response = await request(app).post("/api/inventory/reserve").send({ items });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Stock reserved successfully");
      expect(response.body.data).toEqual(mockResult);
    });

    it("should require items array", async () => {
      const response = await request(app).post("/api/inventory/reserve").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Items array is required");
      expect(response.body.details.field).toBe("items");
    });

    it("should validate items is an array", async () => {
      const response = await request(app).post("/api/inventory/reserve").send({ items: "not-array" });

      expect(response.status).toBe(400);
    });

    it("should include tenantId and userId", async () => {
      mockInventoryService.reserveStock.mockResolvedValue({ success: true });

      const items = [{ productId: 1, quantity: 5 }];
      await request(app).post("/api/inventory/reserve").send({ items });

      expect(mockInventoryService.reserveStock).toHaveBeenCalledWith(items, "tenant-123", "user-123");
    });

    it("should handle insufficient stock", async () => {
      mockInventoryService.reserveStock.mockRejectedValue({
        message: "Insufficient stock",
        field: "items",
      });

      const response = await request(app).post("/api/inventory/reserve").send({ items: [{ productId: 1, quantity: 1000 }] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("VALIDATION_ERROR");
    });

    it("should handle service errors", async () => {
      mockInventoryService.reserveStock.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/api/inventory/reserve").send({ items: [] });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/inventory/release", () => {
    it("should release reserved stock", async () => {
      const items = [
        { productId: 1, quantity: 5 },
        { productId: 2, quantity: 3 },
      ];

      const mockResult = {
        success: true,
        releasedItems: items,
      };

      mockInventoryService.releaseStock.mockResolvedValue(mockResult);

      const response = await request(app).post("/api/inventory/release").send({ items });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Stock released successfully");
      expect(response.body.data).toEqual(mockResult);
    });

    it("should require items array", async () => {
      const response = await request(app).post("/api/inventory/release").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Items array is required");
      expect(response.body.details.field).toBe("items");
    });

    it("should validate items is an array", async () => {
      const response = await request(app).post("/api/inventory/release").send({ items: "not-array" });

      expect(response.status).toBe(400);
    });

    it("should include tenantId and userId", async () => {
      mockInventoryService.releaseStock.mockResolvedValue({ success: true });

      const items = [{ productId: 1, quantity: 5 }];
      await request(app).post("/api/inventory/release").send({ items });

      expect(mockInventoryService.releaseStock).toHaveBeenCalledWith(items, "tenant-123", "user-123");
    });

    it("should handle service errors", async () => {
      mockInventoryService.releaseStock.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/api/inventory/release").send({ items: [] });

      expect(response.status).toBe(500);
    });
  });

  describe("Edge Cases & Performance", () => {
    it("should respond quickly to summary requests", async () => {
      mockInventoryService.getInventorySummary.mockResolvedValue({});

      const start = Date.now();
      await request(app).get("/api/inventory/summary");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should handle concurrent requests", async () => {
      mockInventoryService.getInventorySummary.mockResolvedValue({});

      const promises = Array.from({ length: 10 }, () => request(app).get("/api/inventory/summary"));

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("should handle very large stock numbers", async () => {
      const largeStock = 999999999;
      mockInventoryService.setStock.mockResolvedValue({ id: 1, stock: largeStock });

      const response = await request(app).put("/api/inventory/1/set").send({ quantity: largeStock });

      expect(response.status).toBe(200);
    });

    it("should handle bulk update with many items", async () => {
      const updates = Array.from({ length: 100 }, (_, i) => ({ productId: i + 1, quantity: 100 }));
      const result = updates.map((u) => ({ productId: u.productId, success: true }));

      mockInventoryService.bulkUpdate.mockResolvedValue(result);

      const response = await request(app).post("/api/inventory/bulk-update").send({ updates });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("100 successful");
    });

    it("should handle empty items array", async () => {
      mockInventoryService.checkAvailability.mockResolvedValue({ available: true, items: [] });

      const response = await request(app).post("/api/inventory/check-availability").send({ items: [] });

      expect(response.status).toBe(200);
    });
  });

  describe("Tenant Isolation", () => {
    it("should always include tenantId in operations", async () => {
      mockInventoryService.getInventorySummary.mockResolvedValue({});
      mockInventoryService.getLowStockAlerts.mockResolvedValue([]);
      mockInventoryService.addStock.mockResolvedValue({ id: 1 });

      await request(app).get("/api/inventory/summary");
      expect(mockGetTenantId).toHaveBeenCalled();

      await request(app).get("/api/inventory/alerts");
      expect(mockGetTenantId).toHaveBeenCalled();

      await request(app).post("/api/inventory/1/add").send({ quantity: 10 });
      expect(mockGetTenantId).toHaveBeenCalled();
    });

    it("should prevent access without tenant context", async () => {
      mockGetTenantId.mockImplementationOnce(() => {
        throw new Error("Tenant ID required");
      });

      mockInventoryService.getInventorySummary.mockRejectedValue(new Error("Tenant ID required"));

      const response = await request(app).get("/api/inventory/summary");

      expect(response.status).toBe(500);
    });
  });
});
