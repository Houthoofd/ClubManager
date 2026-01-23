/**
 * Mock Helpers for Jest ESM
 *
 * Provides utility functions to create and manage mocks in Jest ESM environment.
 * These helpers work around ESM hoisting issues and provide type-safe mocks.
 */

import { jest } from "@jest/globals";

/**
 * Create a mock function that can be used with Jest
 */
export function createMockFunction<
  T extends (...args: any[]) => any,
>(): jest.MockedFunction<T> {
  return jest.fn() as jest.MockedFunction<T>;
}

/**
 * Create a mock object with specified methods
 */
export function createMockObject<T extends Record<string, any>>(
  methods: (keyof T)[],
): { [K in keyof T]: jest.MockedFunction<any> } {
  const mock = {} as { [K in keyof T]: jest.MockedFunction<any> };
  for (const method of methods) {
    mock[method] = jest.fn() as jest.MockedFunction<any>;
  }
  return mock;
}

/**
 * Create a mock with resolved value (for async functions)
 */
export function mockResolvedValue<T>(
  fn: jest.MockedFunction<any>,
  value: T,
): jest.MockedFunction<any> {
  return fn.mockResolvedValue(value);
}

/**
 * Create a mock with rejected value (for async functions)
 */
export function mockRejectedValue(
  fn: jest.MockedFunction<any>,
  error: Error,
): jest.MockedFunction<any> {
  return fn.mockRejectedValue(error);
}

/**
 * Create a mock with return value (for sync functions)
 */
export function mockReturnValue<T>(
  fn: jest.MockedFunction<any>,
  value: T,
): jest.MockedFunction<any> {
  return fn.mockReturnValue(value);
}

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
  jest.resetAllMocks();
}

/**
 * Create a mock module with default export
 */
export function createMockModule<T>(defaultExport: T): { default: T } {
  return { default: defaultExport };
}

/**
 * Create a mock Prisma client
 */
export function createMockPrismaClient() {
  return {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Add more models as needed
  };
}

/**
 * Export a singleton mock Prisma client for consistency
 */
export const mockPrismaClient = createMockPrismaClient();

/**
 * Create a mock Redis client
 */
export function createMockRedisClient() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    flushall: jest.fn(),
    ping: jest.fn().mockResolvedValue("PONG"),
    quit: jest.fn().mockResolvedValue("OK"),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Export a singleton mock Redis client for consistency
 */
export const mockRedisClient = createMockRedisClient();

/**
 * Create a mock Express Request
 */
export function createMockRequest(overrides: Partial<any> = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    get: jest.fn(),
    header: jest.fn(),
    ...overrides,
  };
}

/**
 * Create a mock Express Response
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create a mock Express Next function
 */
export function createMockNext(): jest.MockedFunction<any> {
  return jest.fn();
}

/**
 * Create a mock JWT payload
 */
export function createMockJWTPayload(overrides: Partial<any> = {}): any {
  return {
    userId: "test-user-id",
    email: "test@example.com",
    tenantId: "test-tenant-id",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

/**
 * Create a mock User object
 */
export function createMockUser(overrides: Partial<any> = {}): any {
  return {
    id: "test-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    tenantId: "test-tenant-id",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock Tenant object
 */
export function createMockTenant(overrides: Partial<any> = {}): any {
  return {
    id: "test-tenant-id",
    name: "Test Tenant",
    subdomain: "test",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Wait for a specific amount of time (useful for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a spy on a method
 */
export function createSpy<T extends Record<string, any>, K extends keyof T>(
  object: T,
  method: K,
): jest.SpiedFunction<T[K] extends (...args: any[]) => any ? T[K] : never> {
  return jest.spyOn(object, method as any) as any;
}

/**
 * Mock implementation helper
 */
export function mockImplementation<T extends (...args: any[]) => any>(
  fn: jest.MockedFunction<T>,
  implementation: T,
): jest.MockedFunction<T> {
  return fn.mockImplementation(implementation);
}

/**
 * Mock implementation once helper
 */
export function mockImplementationOnce<T extends (...args: any[]) => any>(
  fn: jest.MockedFunction<T>,
  implementation: T,
): jest.MockedFunction<T> {
  return fn.mockImplementationOnce(implementation);
}

/**
 * Create a mock auth middleware for testing
 * This middleware will attach a mock user to the request object
 */
export function createMockAuthMiddleware() {
  return (req: any, res: any, next: any) => {
    // Check for mock user headers (used in tests)
    const mockUserId = req.headers["x-mock-user-id"];
    const mockTenantId = req.headers["x-mock-tenant-id"];

    if (mockUserId) {
      req.user = {
        id: parseInt(mockUserId),
        tenantId: mockTenantId ? parseInt(mockTenantId) : 1,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };
    }

    next();
  };
}
