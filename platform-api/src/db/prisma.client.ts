import { PrismaClient } from '@prisma/client';
import { tenantIsolationMiddleware } from '../middleware/prisma/tenant-isolation.middleware.js';

/**
 * Enhanced Prisma Client with tenant isolation
 * This client automatically enforces tenant isolation on all queries
 */
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  /**
   * Get or create Prisma client instance with middleware
   */
  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
      });

      // Apply tenant isolation middleware
      client.$use(tenantIsolationMiddleware());

      // Log middleware applied
      console.log('✅ Prisma tenant isolation middleware applied');

      PrismaClientSingleton.instance = client;

      // Handle graceful shutdown
      process.on('beforeExit', async () => {
        await PrismaClientSingleton.disconnect();
      });
    }

    return PrismaClientSingleton.instance;
  }

  /**
   * Disconnect Prisma client
   */
  static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      console.log('✅ Prisma client disconnected');
      PrismaClientSingleton.instance = null;
    }
  }

  /**
   * Check database connection
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const client = PrismaClientSingleton.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const prisma = PrismaClientSingleton.getInstance();

// Export utility functions
export const disconnectPrisma = () => PrismaClientSingleton.disconnect();
export const checkDatabaseConnection = () => PrismaClientSingleton.checkConnection();
