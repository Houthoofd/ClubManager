import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - Singleton instance of PrismaClient
 *
 * This service provides a single, reusable instance of PrismaClient
 * across the application to avoid connection pool exhaustion.
 *
 * Features:
 * - Connection pooling optimization
 * - Tenant isolation helpers
 * - Query logging in development
 * - Graceful shutdown handling
 */

class PrismaService {
  private static instance: PrismaClient | null = null;
  private static isShuttingDown = false;

  /**
   * Get the singleton PrismaClient instance
   */
  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
        errorFormat: 'pretty',
      });

      // Handle graceful shutdown
      this.setupShutdownHandlers();
    }

    return PrismaService.instance;
  }

  /**
   * Disconnect PrismaClient (use only during shutdown)
   */
  static async disconnect(): Promise<void> {
    if (PrismaService.instance && !PrismaService.isShuttingDown) {
      PrismaService.isShuttingDown = true;
      await PrismaService.instance.$disconnect();
      PrismaService.instance = null;
      console.log('✅ Prisma disconnected gracefully');
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private static setupShutdownHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n📡 Received ${signal}, closing Prisma connection...`);
        await PrismaService.disconnect();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('❌ Uncaught Exception:', error);
      await PrismaService.disconnect();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      await PrismaService.disconnect();
      process.exit(1);
    });
  }

  /**
   * Helper: Check if tenant exists and is active
   */
  static async validateTenant(tenantId: string): Promise<boolean> {
    const prisma = PrismaService.getInstance();

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, status: true }
      });

      return tenant !== null && tenant.status === 'ACTIVE';
    } catch (error) {
      console.error('Error validating tenant:', error);
      return false;
    }
  }

  /**
   * Helper: Get tenant by slug (subdomain)
   */
  static async getTenantBySlug(slug: string): Promise<{ id: string; name: string; status: string } | null> {
    const prisma = PrismaService.getInstance();

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true
        }
      });

      return tenant;
    } catch (error) {
      console.error('Error fetching tenant by slug:', error);
      return null;
    }
  }

  /**
   * Helper: Execute query with tenant isolation
   * Ensures all queries include tenantId for multi-tenant safety
   */
  static withTenant(tenantId: string) {
    const prisma = PrismaService.getInstance();

    return {
      prisma,
      tenantId,

      // Add tenant filter to any model query
      async findMany<T>(model: any, args: any = {}): Promise<T[]> {
        return model.findMany({
          ...args,
          where: {
            ...args.where,
            tenantId
          }
        });
      },

      async findUnique<T>(model: any, args: any): Promise<T | null> {
        return model.findUnique({
          ...args,
          where: {
            ...args.where,
            tenantId
          }
        });
      },

      async create<T>(model: any, args: any): Promise<T> {
        return model.create({
          ...args,
          data: {
            ...args.data,
            tenantId
          }
        });
      },

      async update<T>(model: any, args: any): Promise<T> {
        return model.update({
          ...args,
          where: {
            ...args.where,
            tenantId
          }
        });
      },

      async delete<T>(model: any, args: any): Promise<T> {
        return model.delete({
          ...args,
          where: {
            ...args.where,
            tenantId
          }
        });
      }
    };
  }

  /**
   * Health check - verify database connection
   */
  static async healthCheck(): Promise<{ connected: boolean; latency?: number }> {
    const prisma = PrismaService.getInstance();
    const start = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return { connected: true, latency };
    } catch (error) {
      console.error('Prisma health check failed:', error);
      return { connected: false };
    }
  }
}

// Export singleton instance
export const prisma = PrismaService.getInstance();

// Export service class for advanced usage
export default PrismaService;
