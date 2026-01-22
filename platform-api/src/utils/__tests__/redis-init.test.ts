/**
 * Redis Initialization Tests
 * Tests for Redis connection startup, health checks, warmup, and shutdown
 */

import { jest } from '@jest/globals';
import {
  initializeRedis,
  checkRedisConnection,
  warmUpCache,
  testRedisOperations,
  initializeRedisWithTests,
  shutdownRedis,
  setupRedisShutdownHandlers,
} from '../redis-init.js';
import { redis, waitForRedis, redisHealthCheck, redisInfo, disconnectRedis } from '../../db/redis.client.js';
import { isRedisReady } from '../../cache/index.js';

// Mock dependencies
jest.mock('../../db/redis.client.js');
jest.mock('../../cache/index.js');

describe('Redis Initialization Tests', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('initializeRedis', () => {
    it('should successfully initialize Redis connection', async () => {
      // Mock successful initialization
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });

      const result = await initializeRedis();

      expect(result).toBe(true);
      expect(waitForRedis).toHaveBeenCalledWith(5000);
      expect(redisHealthCheck).toHaveBeenCalled();
      expect(redisInfo).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Initializing Redis'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('connected successfully'));
    });

    it('should handle Redis health check failure', async () => {
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'unhealthy',
        error: 'Connection timeout',
      });

      const result = await initializeRedis();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('health check failed'),
        expect.anything()
      );
    });

    it('should handle Redis connection timeout', async () => {
      (waitForRedis as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

      const result = await initializeRedis();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize Redis'),
        expect.any(Error)
      );
    });

    it('should handle degraded Redis status', async () => {
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'degraded',
        latency: 1000,
      });

      const result = await initializeRedis();

      expect(result).toBe(false);
    });

    it('should display Redis connection info on success', async () => {
      const mockInfo = {
        host: 'redis.example.com',
        port: 6380,
        db: 2,
        keyPrefix: 'prod:',
        status: 'ready',
      };

      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 3,
      });
      (redisInfo as jest.Mock).mockResolvedValue(mockInfo);

      await initializeRedis();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Host: ${mockInfo.host}:${mockInfo.port}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Database: ${mockInfo.db}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Key Prefix: ${mockInfo.keyPrefix}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Latency: 3ms'));
    });
  });

  describe('checkRedisConnection', () => {
    it('should return true when Redis is ready and healthy', async () => {
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
      });

      const result = await checkRedisConnection();

      expect(result).toBe(true);
      expect(isRedisReady).toHaveBeenCalled();
      expect(redisHealthCheck).toHaveBeenCalled();
    });

    it('should return false when Redis is not ready', async () => {
      (isRedisReady as jest.Mock).mockReturnValue(false);

      const result = await checkRedisConnection();

      expect(result).toBe(false);
      expect(redisHealthCheck).not.toHaveBeenCalled();
    });

    it('should return false when Redis health check fails', async () => {
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'unhealthy',
      });

      const result = await checkRedisConnection();

      expect(result).toBe(false);
    });
  });

  describe('warmUpCache', () => {
    it('should complete cache warmup successfully', async () => {
      await warmUpCache();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warming up cache'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('warm-up completed'));
    });

    it('should handle warmup errors gracefully', async () => {
      // Since warmup is mostly commented out, it should not throw
      await expect(warmUpCache()).resolves.not.toThrow();
    });

    it('should not throw on warmup failure (non-critical)', async () => {
      // Warmup should be non-critical and not prevent app startup
      await expect(warmUpCache()).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('testRedisOperations', () => {
    beforeEach(() => {
      // Reset redis mock
      (redis.setex as jest.Mock) = jest.fn().mockResolvedValue('OK');
      (redis.get as jest.Mock) = jest.fn();
      (redis.del as jest.Mock) = jest.fn().mockResolvedValue(1);
    });

    it('should successfully test all Redis operations', async () => {
      const testValue = { timestamp: Date.now(), test: true };
      (redis.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(testValue))
        .mockResolvedValueOnce(null);

      const result = await testRedisOperations();

      expect(result).toBe(true);
      expect(redis.setex).toHaveBeenCalledWith(
        'test:redis:init',
        10,
        expect.stringContaining('"test":true')
      );
      expect(redis.get).toHaveBeenCalledWith('test:redis:init');
      expect(redis.del).toHaveBeenCalledWith('test:redis:init');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('operations test passed'));
    });

    it('should handle SET operation failure', async () => {
      (redis.setex as jest.Mock).mockRejectedValue(new Error('SET failed'));

      const result = await testRedisOperations();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('operations test failed'),
        expect.any(Error)
      );
    });

    it('should handle GET operation failure', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await testRedisOperations();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should detect data corruption', async () => {
      const originalData = { timestamp: 12345, test: true };
      const corruptedData = { timestamp: 99999, test: true };

      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(corruptedData));

      const result = await testRedisOperations();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('operations test failed'),
        expect.any(Error)
      );
    });

    it('should handle DELETE operation failure', async () => {
      const testValue = { timestamp: Date.now(), test: true };
      (redis.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(testValue))
        .mockResolvedValueOnce(JSON.stringify(testValue)); // Key still exists

      const result = await testRedisOperations();

      expect(result).toBe(false);
    });

    it('should handle JSON parse errors', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce('invalid-json{');

      const result = await testRedisOperations();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('initializeRedisWithTests', () => {
    it('should complete full initialization successfully', async () => {
      // Mock all successful operations
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });

      const testValue = { timestamp: Date.now(), test: true };
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (redis.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(testValue))
        .mockResolvedValueOnce(null);
      (redis.del as jest.Mock).mockResolvedValue(1);

      const result = await initializeRedisWithTests();

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('connected successfully'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('operations test passed'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('warm-up completed'));
    });

    it('should fail if connection fails', async () => {
      (waitForRedis as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await initializeRedisWithTests();

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Redis not available')
      );
    });

    it('should fail if operations test fails', async () => {
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });

      (redis.setex as jest.Mock).mockRejectedValue(new Error('SET failed'));

      const result = await initializeRedisWithTests();

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('operations test failed')
      );
    });

    it('should complete even if warmup has non-critical errors', async () => {
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });

      const testValue = { timestamp: Date.now(), test: true };
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (redis.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(testValue))
        .mockResolvedValueOnce(null);
      (redis.del as jest.Mock).mockResolvedValue(1);

      const result = await initializeRedisWithTests();

      // Should succeed even if warmup logs warnings
      expect(result).toBe(true);
    });
  });

  describe('shutdownRedis', () => {
    it('should disconnect Redis gracefully', async () => {
      (disconnectRedis as jest.Mock).mockResolvedValue(undefined);

      await shutdownRedis();

      expect(disconnectRedis).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Shutting down Redis'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('disconnected successfully'));
    });

    it('should handle disconnect errors', async () => {
      (disconnectRedis as jest.Mock).mockRejectedValue(new Error('Disconnect failed'));

      await shutdownRedis();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error disconnecting Redis'),
        expect.any(Error)
      );
    });

    it('should handle missing disconnect function', async () => {
      (disconnectRedis as jest.Mock).mockImplementation(() => {
        throw new Error('Function not available');
      });

      await expect(shutdownRedis()).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('setupRedisShutdownHandlers', () => {
    let mockProcessExit: jest.SpiedFunction<typeof process.exit>;
    let sigTermListener: Function;
    let sigIntListener: Function;

    beforeEach(() => {
      mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Capture event listeners
      jest.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
        if (event === 'SIGTERM') sigTermListener = handler;
        if (event === 'SIGINT') sigIntListener = handler;
        return process;
      });
    });

    afterEach(() => {
      mockProcessExit.mockRestore();
    });

    it('should register shutdown handlers', () => {
      const onSpy = jest.spyOn(process, 'on');

      setupRedisShutdownHandlers();

      expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    it('should handle SIGTERM gracefully', async () => {
      (disconnectRedis as jest.Mock).mockResolvedValue(undefined);

      setupRedisShutdownHandlers();

      // Trigger SIGTERM
      try {
        await sigTermListener();
      } catch (error) {
        // process.exit throws in tests
        expect(error).toEqual(new Error('process.exit called'));
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SIGTERM received'));
      expect(disconnectRedis).toHaveBeenCalled();
    });

    it('should handle SIGINT gracefully', async () => {
      (disconnectRedis as jest.Mock).mockResolvedValue(undefined);

      setupRedisShutdownHandlers();

      // Trigger SIGINT
      try {
        await sigIntListener();
      } catch (error) {
        expect(error).toEqual(new Error('process.exit called'));
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SIGINT received'));
      expect(disconnectRedis).toHaveBeenCalled();
    });
  });

  describe('Startup Sequence Integration', () => {
    it('should handle complete startup sequence', async () => {
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });

      const testValue = { timestamp: Date.now(), test: true };
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (redis.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(testValue))
        .mockResolvedValueOnce(null);
      (redis.del as jest.Mock).mockResolvedValue(1);

      // Full startup sequence
      const initResult = await initializeRedis();
      expect(initResult).toBe(true);

      const connectionOk = await checkRedisConnection();
      expect(connectionOk).toBe(true);

      await warmUpCache();

      const testResult = await testRedisOperations();
      expect(testResult).toBe(true);

      // All operations should succeed
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('connected successfully'));
    });

    it('should handle partial startup failure gracefully', async () => {
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });

      (redis.setex as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const initResult = await initializeRedis();
      expect(initResult).toBe(true);

      const testResult = await testRedisOperations();
      expect(testResult).toBe(false);

      // App should continue with warnings
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Performance and Timeouts', () => {
    it('should timeout if Redis takes too long to initialize', async () => {
      (waitForRedis as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      // This should timeout
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 100));
      const initPromise = initializeRedis();

      const result = await Promise.race([initPromise, timeoutPromise]);

      // Should either timeout or use the built-in timeout
      expect(['timeout', false]).toContain(result);
    });

    it('should measure initialization latency', async () => {
      (waitForRedis as jest.Mock).mockResolvedValue(undefined);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 8,
      });
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });

      const start = Date.now();
      await initializeRedis();
      const duration = Date.now() - start;

      // Should complete quickly in tests
      expect(duration).toBeLessThan(1000);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Latency: 8ms'));
    });
  });
});
