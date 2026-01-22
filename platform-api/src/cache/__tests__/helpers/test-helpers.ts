/**
 * Test Helpers
 * Utility functions and helpers for Redis cache tests
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Create mock Express Request
 */
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => {
  return {
    ip: '127.0.0.1',
    headers: {},
    method: 'GET',
    path: '/api/test',
    originalUrl: '/api/test',
    query: {},
    body: {},
    params: {},
    ...overrides,
  };
};

/**
 * Create mock Express Response with jest mocks
 */
export const createMockResponse = (): Partial<Response> & {
  _body?: any;
  _statusCode?: number;
  _headers?: Record<string, string>;
} => {
  const res: any = {
    _body: undefined,
    _statusCode: 200,
    _headers: {},

    status: function(code: number) {
      this._statusCode = code;
      return this;
    },

    json: function(body: any) {
      this._body = body;
      return this;
    },

    send: function(body: any) {
      this._body = body;
      return this;
    },

    set: function(field: string | Record<string, string>, value?: string) {
      if (typeof field === 'string' && value !== undefined) {
        this._headers[field] = value;
      } else if (typeof field === 'object') {
        Object.assign(this._headers, field);
      }
      return this;
    },

    setHeader: function(name: string, value: string) {
      this._headers[name] = value;
      return this;
    },

    getHeader: function(name: string) {
      return this._headers[name];
    },

    locals: {},
  };

  return res;
};

/**
 * Create mock Next function
 */
export const createMockNext = (): NextFunction => {
  const next: any = () => {};
  next.callCount = 0;

  const wrappedNext: NextFunction = (err?: any) => {
    next.callCount++;
    if (err) {
      next.error = err;
    }
  };

  (wrappedNext as any).callCount = () => next.callCount;
  (wrappedNext as any).error = () => next.error;

  return wrappedNext;
};

/**
 * Generate unique test key
 */
export const generateTestKey = (prefix: string = 'test'): string => {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).substring(7)}`;
};

/**
 * Generate unique email for testing
 */
export const generateTestEmail = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}@example.com`;
};

/**
 * Generate unique slug for testing
 */
export const generateTestSlug = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

/**
 * Wait for a specific condition to be true
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await Promise.resolve(condition());
    if (result) {
      return;
    }
    await sleep(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Measure execution time of a function
 */
export const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;

  return { result, duration };
};

/**
 * Run function multiple times in parallel
 */
export const runConcurrently = async <T>(
  fn: () => Promise<T>,
  times: number
): Promise<T[]> => {
  const promises = Array.from({ length: times }, () => fn());
  return Promise.all(promises);
};

/**
 * Run function multiple times sequentially
 */
export const runSequentially = async <T>(
  fn: (index: number) => Promise<T>,
  times: number
): Promise<T[]> => {
  const results: T[] = [];

  for (let i = 0; i < times; i++) {
    results.push(await fn(i));
  }

  return results;
};

/**
 * Create test data structure
 */
export const createTestData = (size: number = 100): any => {
  return {
    id: generateTestKey(),
    timestamp: Date.now(),
    items: Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random(),
    })),
  };
};

/**
 * Create large test object
 */
export const createLargeTestObject = (depth: number = 5, breadth: number = 10): any => {
  if (depth === 0) {
    return {
      value: Math.random(),
      text: 'leaf node',
      timestamp: Date.now(),
    };
  }

  const obj: any = {
    depth,
    id: generateTestKey(),
    children: [],
  };

  for (let i = 0; i < breadth; i++) {
    obj.children.push(createLargeTestObject(depth - 1, breadth));
  }

  return obj;
};

/**
 * Calculate percentile
 */
export const calculatePercentile = (values: number[], percentile: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length * percentile) / 100);
  return sorted[index] || 0;
};

/**
 * Calculate average
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Calculate standard deviation
 */
export const calculateStdDev = (values: number[]): number => {
  if (values.length === 0) return 0;

  const avg = calculateAverage(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);

  return Math.sqrt(avgSquareDiff);
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Format duration to human readable
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts - 1) {
        await sleep(delayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
};

/**
 * Create mock tenant data
 */
export const createMockTenant = () => {
  return {
    id: generateTestKey('tenant'),
    name: `Test Tenant ${Date.now()}`,
    slug: generateTestSlug('tenant'),
    email: generateTestEmail('tenant'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Create mock user data
 */
export const createMockUser = (tenantId: string) => {
  return {
    id: generateTestKey('user'),
    email: generateTestEmail('user'),
    firstName: 'Test',
    lastName: 'User',
    tenantId,
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Assert async throws
 */
export const assertAsyncThrows = async (
  fn: () => Promise<any>,
  errorMatcher?: RegExp | string
): Promise<void> => {
  let error: any = null;

  try {
    await fn();
  } catch (e) {
    error = e;
  }

  if (!error) {
    throw new Error('Expected function to throw, but it did not');
  }

  if (errorMatcher) {
    const message = error.message || String(error);
    const matches = typeof errorMatcher === 'string'
      ? message.includes(errorMatcher)
      : errorMatcher.test(message);

    if (!matches) {
      throw new Error(
        `Expected error message to match ${errorMatcher}, but got: ${message}`
      );
    }
  }
};

/**
 * Clean up test keys from Redis
 */
export const cleanupTestKeys = async (
  cacheService: any,
  patterns: string[]
): Promise<number> => {
  let totalDeleted = 0;

  for (const pattern of patterns) {
    const deleted = await cacheService.deletePattern(pattern);
    totalDeleted += deleted;
  }

  return totalDeleted;
};

/**
 * Benchmark function execution
 */
export interface BenchmarkResult {
  iterations: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  opsPerSecond: number;
  p50: number;
  p95: number;
  p99: number;
}

export const benchmark = async (
  fn: () => Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult> => {
  const durations: number[] = [];
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const iterStart = Date.now();
    await fn();
    durations.push(Date.now() - iterStart);
  }

  const totalDuration = Date.now() - startTime;
  const sorted = [...durations].sort((a, b) => a - b);

  return {
    iterations,
    totalDuration,
    averageDuration: calculateAverage(durations),
    minDuration: sorted[0] || 0,
    maxDuration: sorted[sorted.length - 1] || 0,
    opsPerSecond: (iterations / totalDuration) * 1000,
    p50: calculatePercentile(durations, 50),
    p95: calculatePercentile(durations, 95),
    p99: calculatePercentile(durations, 99),
  };
};

/**
 * Print benchmark results
 */
export const printBenchmark = (name: string, result: BenchmarkResult): void => {
  console.log(`\n📊 Benchmark: ${name}`);
  console.log(`  Iterations:  ${result.iterations}`);
  console.log(`  Total:       ${formatDuration(result.totalDuration)}`);
  console.log(`  Average:     ${formatDuration(result.averageDuration)}`);
  console.log(`  Min:         ${formatDuration(result.minDuration)}`);
  console.log(`  Max:         ${formatDuration(result.maxDuration)}`);
  console.log(`  Throughput:  ${result.opsPerSecond.toFixed(0)} ops/sec`);
  console.log(`  p50:         ${formatDuration(result.p50)}`);
  console.log(`  p95:         ${formatDuration(result.p95)}`);
  console.log(`  p99:         ${formatDuration(result.p99)}`);
};
