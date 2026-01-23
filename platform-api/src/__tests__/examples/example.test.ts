/**
 * Example Test File - Jest ESM with Mock Helpers
 *
 * This file demonstrates how to write tests using the new Jest ESM configuration
 * with mock helpers. Use this as a reference for migrating existing tests.
 *
 * This is a STANDALONE example that doesn't require external services.
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";

// Import mock helpers
import {
  createMockFunction,
  createMockPrismaClient,
  createMockRedisClient,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockUser,
  createMockTenant,
  mockResolvedValue,
  mockRejectedValue,
  mockReturnValue,
} from "../helpers/mock-helpers.js";

// ============================================================================
// Example 1: Basic Mock Function Usage
// ============================================================================

describe("Example 1: Basic Mock Functions", () => {
  it("should create and use a mock function", () => {
    // Arrange
    const mockFn = createMockFunction<(x: number) => number>();
    mockReturnValue(mockFn, 42);

    // Act
    const result = mockFn(10);

    // Assert
    expect(result).toBe(42);
    expect(mockFn).toHaveBeenCalledWith(10);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should create async mock function", async () => {
    // Arrange
    const mockAsyncFn = jest.fn();
    mockResolvedValue(mockAsyncFn, { success: true, data: "test" });

    // Act
    const result = await mockAsyncFn("param");

    // Assert
    expect(result).toEqual({ success: true, data: "test" });
    expect(mockAsyncFn).toHaveBeenCalledWith("param");
  });

  it("should handle rejected promises", async () => {
    // Arrange
    const mockAsyncFn = jest.fn();
    const error = new Error("Operation failed");
    mockRejectedValue(mockAsyncFn, error);

    // Act & Assert
    await expect(mockAsyncFn()).rejects.toThrow("Operation failed");
    expect(mockAsyncFn).toHaveBeenCalled();
  });

  it("should use mockImplementation", () => {
    // Arrange
    const mockFn = jest.fn();
    mockFn.mockImplementation((x: number, y: number) => x + y);

    // Act
    const result = mockFn(5, 10);

    // Assert
    expect(result).toBe(15);
    expect(mockFn).toHaveBeenCalledWith(5, 10);
  });

  it("should use multiple return values", () => {
    // Arrange
    const mockFn = jest.fn();
    mockFn
      .mockReturnValueOnce("first")
      .mockReturnValueOnce("second")
      .mockReturnValue("default");

    // Act & Assert
    expect(mockFn()).toBe("first");
    expect(mockFn()).toBe("second");
    expect(mockFn()).toBe("default");
    expect(mockFn()).toBe("default");
  });
});

// ============================================================================
// Example 2: Mock Prisma Client
// ============================================================================

describe("Example 2: Mock Prisma Client", () => {
  const mockPrisma = createMockPrismaClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mock user.findUnique", async () => {
    // Arrange
    const mockUser = createMockUser({ id: "123", email: "test@example.com" });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Act
    const result = await mockPrisma.user.findUnique({ where: { id: "123" } });

    // Assert
    expect(result).toEqual(mockUser);
    expect(result?.email).toBe("test@example.com");
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "123" },
    });
  });

  it("should mock user.findMany", async () => {
    // Arrange
    const mockUsers = [
      createMockUser({ id: "1", email: "user1@example.com" }),
      createMockUser({ id: "2", email: "user2@example.com" }),
    ];
    mockPrisma.user.findMany.mockResolvedValue(mockUsers);

    // Act
    const result = await mockPrisma.user.findMany({
      where: { tenantId: "tenant-123" },
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].email).toBe("user1@example.com");
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { tenantId: "tenant-123" },
    });
  });

  it("should mock user.create", async () => {
    // Arrange
    const userData = {
      email: "new@example.com",
      firstName: "New",
      lastName: "User",
    };
    const createdUser = createMockUser({ ...userData, id: "new-id" });
    mockPrisma.user.create.mockResolvedValue(createdUser);

    // Act
    const result = await mockPrisma.user.create({ data: userData });

    // Assert
    expect(result.id).toBe("new-id");
    expect(result.email).toBe("new@example.com");
    expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
  });

  it("should mock user.update", async () => {
    // Arrange
    const updates = { firstName: "Updated" };
    const updatedUser = createMockUser({ id: "123", firstName: "Updated" });
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    // Act
    const result = await mockPrisma.user.update({
      where: { id: "123" },
      data: updates,
    });

    // Assert
    expect(result.firstName).toBe("Updated");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: updates,
    });
  });

  it("should mock user.count", async () => {
    // Arrange
    mockPrisma.user.count.mockResolvedValue(42);

    // Act
    const result = await mockPrisma.user.count({ where: { isVerified: true } });

    // Assert
    expect(result).toBe(42);
    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: { isVerified: true },
    });
  });
});

// ============================================================================
// Example 3: Mock Redis Client
// ============================================================================

describe("Example 3: Mock Redis Client", () => {
  const mockRedis = createMockRedisClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mock redis.get", async () => {
    // Arrange
    const cachedData = JSON.stringify({ userId: "123", name: "Cached User" });
    mockRedis.get.mockResolvedValue(cachedData);

    // Act
    const result = await mockRedis.get("user:123");

    // Assert
    expect(result).toBe(cachedData);
    expect(mockRedis.get).toHaveBeenCalledWith("user:123");
  });

  it("should mock redis.set", async () => {
    // Arrange
    mockRedis.set.mockResolvedValue("OK");

    // Act
    const result = await mockRedis.set("key", "value", "EX", 3600);

    // Assert
    expect(result).toBe("OK");
    expect(mockRedis.set).toHaveBeenCalledWith("key", "value", "EX", 3600);
  });

  it("should mock redis.del", async () => {
    // Arrange
    mockRedis.del.mockResolvedValue(1);

    // Act
    const result = await mockRedis.del("key");

    // Assert
    expect(result).toBe(1);
    expect(mockRedis.del).toHaveBeenCalledWith("key");
  });

  it("should mock redis.ping", async () => {
    // Arrange (already mocked in createMockRedisClient)

    // Act
    const result = await mockRedis.ping();

    // Assert
    expect(result).toBe("PONG");
    expect(mockRedis.ping).toHaveBeenCalled();
  });
});

// ============================================================================
// Example 4: Mock Express Request/Response/Next
// ============================================================================

describe("Example 4: Express Request/Response/Next", () => {
  it("should create mock request with custom data", () => {
    // Arrange
    const req = createMockRequest({
      params: { id: "123" },
      query: { search: "test" },
      body: { name: "Test User" },
      headers: {
        authorization: "Bearer token",
        "content-type": "application/json",
      },
    });

    // Assert
    expect(req.params.id).toBe("123");
    expect(req.query.search).toBe("test");
    expect(req.body.name).toBe("Test User");
    expect(req.headers.authorization).toBe("Bearer token");
  });

  it("should create mock response with chainable methods", () => {
    // Arrange
    const res = createMockResponse();

    // Act
    res.status(200).json({ success: true });

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("should test middleware with mock req/res/next", () => {
    // Arrange
    const req = createMockRequest({
      headers: { authorization: "Bearer valid-token" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    // Example middleware
    const authMiddleware = (req: any, res: any, next: any) => {
      if (req.headers.authorization) {
        req.user = { id: "123", role: "admin" };
        next();
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    };

    // Act
    authMiddleware(req, res, next);

    // Assert
    expect(req.user).toEqual({ id: "123", role: "admin" });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should test error middleware", () => {
    // Arrange
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    // Example error middleware
    const errorMiddleware = (err: Error, req: any, res: any, next: any) => {
      res.status(500).json({ error: err.message });
    };

    const error = new Error("Something went wrong");

    // Act
    errorMiddleware(error, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Something went wrong" });
  });
});

// ============================================================================
// Example 5: Express Routes with Supertest
// ============================================================================

describe("Example 5: Express Routes with Supertest", () => {
  let app: Express;
  const mockFindUser = jest.fn();
  const mockCreateUser = jest.fn();

  beforeAll(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Define test routes
    app.get("/api/users/:id", async (req, res) => {
      try {
        const user = await mockFindUser(req.params.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/users", async (req, res) => {
      try {
        const user = await mockCreateUser(req.body);
        res.status(201).json(user);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.get("/api/health", (req, res) => {
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get user by id", async () => {
    // Arrange
    const mockUser = createMockUser({ id: "123", email: "test@example.com" });
    mockFindUser.mockResolvedValue(mockUser);

    // Act
    const response = await request(app).get("/api/users/123");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(response.body.email).toBe("test@example.com");
    expect(mockFindUser).toHaveBeenCalledWith("123");
  });

  it("should return 404 when user not found", async () => {
    // Arrange
    mockFindUser.mockResolvedValue(null);

    // Act
    const response = await request(app).get("/api/users/999");

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "User not found" });
  });

  it("should create new user", async () => {
    // Arrange
    const userData = {
      email: "new@example.com",
      firstName: "New",
      lastName: "User",
    };
    const createdUser = createMockUser({ ...userData, id: "new-id" });
    mockCreateUser.mockResolvedValue(createdUser);

    // Act
    const response = await request(app).post("/api/users").send(userData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.id).toBe("new-id");
    expect(response.body.email).toBe("new@example.com");
    expect(mockCreateUser).toHaveBeenCalledWith(userData);
  });

  it("should handle errors", async () => {
    // Arrange
    mockFindUser.mockRejectedValue(new Error("Database error"));

    // Act
    const response = await request(app).get("/api/users/123");

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database error" });
  });

  it("should check health endpoint", async () => {
    // Act
    const response = await request(app).get("/api/health");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.timestamp).toBeDefined();
  });
});

// ============================================================================
// Example 6: Custom Matchers
// ============================================================================

describe("Example 6: Custom Matchers", () => {
  it("should validate dates", () => {
    const validDate = new Date();
    const invalidDate = new Date("invalid");

    expect(validDate).toBeValidDate();
    expect(invalidDate).not.toBeValidDate();
  });

  it("should validate UUIDs", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";
    const anotherValidUUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const invalidUUID = "not-a-uuid";
    const shortString = "123-456";

    expect(validUUID).toBeValidUUID();
    expect(anotherValidUUID).toBeValidUUID();
    expect(invalidUUID).not.toBeValidUUID();
    expect(shortString).not.toBeValidUUID();
  });

  it("should validate JWTs", () => {
    const validJWT =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const invalidJWT = "not-a-jwt";
    const incompleteJWT = "header.payload";

    expect(validJWT).toBeValidJWT();
    expect(invalidJWT).not.toBeValidJWT();
    expect(incompleteJWT).not.toBeValidJWT();
  });

  it("should match partial call arguments", () => {
    const mockFn = jest.fn();
    mockFn({ userId: "123", name: "Test", extra: "data", more: "info" });
    mockFn({ userId: "456", name: "Other" });

    expect(mockFn).toHaveBeenCalledWithMatch({ userId: "123" });
    expect(mockFn).toHaveBeenCalledWithMatch({ name: "Test" });
    expect(mockFn).toHaveBeenCalledWithMatch({ userId: "456" });
  });
});

// ============================================================================
// Example 7: Mock Data Helpers
// ============================================================================

describe("Example 7: Mock Data Helpers", () => {
  it("should create mock user with defaults", () => {
    const user = createMockUser();

    expect(user.id).toBe("test-user-id");
    expect(user.email).toBe("test@example.com");
    expect(user.firstName).toBe("Test");
    expect(user.lastName).toBe("User");
    expect(user.isVerified).toBe(true);
    expect(user.createdAt).toBeValidDate();
  });

  it("should create mock user with overrides", () => {
    const user = createMockUser({
      id: "custom-id",
      email: "custom@example.com",
      firstName: "Custom",
      isVerified: false,
    });

    expect(user.id).toBe("custom-id");
    expect(user.email).toBe("custom@example.com");
    expect(user.firstName).toBe("Custom");
    expect(user.lastName).toBe("User"); // Default
    expect(user.isVerified).toBe(false);
  });

  it("should create mock tenant", () => {
    const tenant = createMockTenant({
      id: "tenant-123",
      name: "My Company",
      subdomain: "mycompany",
    });

    expect(tenant.id).toBe("tenant-123");
    expect(tenant.name).toBe("My Company");
    expect(tenant.subdomain).toBe("mycompany");
    expect(tenant.isActive).toBe(true);
    expect(tenant.createdAt).toBeValidDate();
  });
});

// ============================================================================
// Example 8: Concurrent Operations
// ============================================================================

describe("Example 8: Concurrent Operations", () => {
  it("should handle multiple simultaneous requests", async () => {
    // Arrange
    const mockFn = jest.fn();
    mockFn
      .mockResolvedValueOnce({ id: "1", value: "first" })
      .mockResolvedValueOnce({ id: "2", value: "second" })
      .mockResolvedValueOnce({ id: "3", value: "third" });

    // Act
    const results = await Promise.all([mockFn("1"), mockFn("2"), mockFn("3")]);

    // Assert
    expect(results).toHaveLength(3);
    expect(results[0].value).toBe("first");
    expect(results[1].value).toBe("second");
    expect(results[2].value).toBe("third");
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it("should handle partial failures with Promise.allSettled", async () => {
    // Arrange
    const mockFn = jest.fn();
    mockFn
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValueOnce({ success: true });

    // Act
    const results = await Promise.allSettled([
      mockFn("1"),
      mockFn("2"),
      mockFn("3"),
    ]);

    // Assert
    expect(results[0].status).toBe("fulfilled");
    expect(results[1].status).toBe("rejected");
    expect(results[2].status).toBe("fulfilled");

    if (results[1].status === "rejected") {
      expect(results[1].reason.message).toBe("Failed");
    }
  });
});

// ============================================================================
// Example 9: Complex Mock Scenarios
// ============================================================================

describe("Example 9: Complex Mock Scenarios", () => {
  it("should mock chained method calls", () => {
    const mockBuilder = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: "1" }]),
    };

    // Act
    const query = mockBuilder
      .where({ isActive: true })
      .select(["id", "name"])
      .orderBy("createdAt", "desc")
      .execute();

    // Assert
    expect(mockBuilder.where).toHaveBeenCalledWith({ isActive: true });
    expect(mockBuilder.select).toHaveBeenCalledWith(["id", "name"]);
    expect(mockBuilder.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(mockBuilder.execute).toHaveBeenCalled();
  });

  it("should mock different behaviors based on input", async () => {
    const mockFn = jest.fn();

    mockFn.mockImplementation((input: string) => {
      if (input === "admin") {
        return Promise.resolve({ role: "admin", permissions: ["all"] });
      } else if (input === "user") {
        return Promise.resolve({ role: "user", permissions: ["read"] });
      } else {
        return Promise.reject(new Error("Invalid role"));
      }
    });

    // Act & Assert
    const admin = await mockFn("admin");
    expect(admin.role).toBe("admin");
    expect(admin.permissions).toContain("all");

    const user = await mockFn("user");
    expect(user.role).toBe("user");
    expect(user.permissions).toContain("read");

    await expect(mockFn("guest")).rejects.toThrow("Invalid role");
  });

  it("should track call order and arguments", () => {
    const mockFn = jest.fn();

    // Act
    mockFn("first", 1);
    mockFn("second", 2);
    mockFn("third", 3);

    // Assert
    expect(mockFn).toHaveBeenNthCalledWith(1, "first", 1);
    expect(mockFn).toHaveBeenNthCalledWith(2, "second", 2);
    expect(mockFn).toHaveBeenNthCalledWith(3, "third", 3);

    expect(mockFn.mock.calls[0]).toEqual(["first", 1]);
    expect(mockFn.mock.calls[1]).toEqual(["second", 2]);
    expect(mockFn.mock.calls[2]).toEqual(["third", 3]);
  });
});
