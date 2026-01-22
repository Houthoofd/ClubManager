// Jest setup file for improved testing environment
import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Mock global console methods for cleaner test output
global.console = {
  ...console,
  // Keep log, warn, error for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  createMockPrismaClient: () => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    article: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    }
  }),

  createMockUser: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createMockProduct: (overrides = {}) => ({
    id: 1,
    nom: 'Test Product',
    description: 'A test product',
    prix: 29.99,
    tenantId: 'tenant-1',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    stock: [],
    ...overrides
  }),

  createMockMessage: (overrides = {}) => ({
    id: 1,
    subject: 'Test Message',
    body: 'This is a test message',
    senderId: 1,
    recipientId: 2,
    tenantId: 'tenant-1',
    status: 'SENT',
    priority: 'NORMAL',
    type: 'private',
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })
};

// Environment setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});