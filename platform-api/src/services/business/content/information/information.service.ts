/**
 * Information Service
 * Service for managing system information and configurations
 * Replaces the old Informations client
 */

import { prisma } from "../../../../db/prisma.client.js";
import { z } from "zod";

// Validation schemas
export const informationSchema = z.object({
  key: z.string().min(1, "La clé est requise"),
  value: z.string(),
  type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  description: z.string().optional(),
  category: z.string().default("general"),
  isPublic: z.boolean().default(false),
});

export type InformationData = z.infer<typeof informationSchema>;

// Since we don't have an Information model in Prisma, we'll use a generic approach
// This service will handle system configurations and settings

export class InformationService {
  /**
   * Get system information - placeholder for now
   * In a real implementation, this would fetch from a settings table
   */
  async getSystemInfo() {
    return {
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get application configuration
   */
  async getAppConfig() {
    return {
      appName: "ClubManager",
      maxUsers: parseInt(process.env.MAX_USERS || "100"),
      maxStorage: parseInt(process.env.MAX_STORAGE || "1000"),
      emailEnabled: process.env.EMAIL_ENABLED === "true",
      stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
      jwtExpiration: process.env.JWT_EXPIRES_IN || "24h",
    };
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const [userCount, tenantCount, messageCount, orderCount, articleCount] =
        await Promise.all([
          prisma.user.count(),
          prisma.tenant.count(),
          prisma.message.count(),
          prisma.commande.count(),
          prisma.article.count(),
        ]);

      return {
        users: userCount,
        tenants: tenantCount,
        messages: messageCount,
        orders: orderCount,
        articles: articleCount,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching database stats:", error);
      return {
        error: "Unable to fetch database statistics",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get tenant-specific information
   */
  async getTenantInfo(tenantId: string) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { actif: true },
            select: { id: true },
          },
          subscriptions: {
            where: { status: "ACTIVE" },
            include: {
              plan: {
                select: { nom: true, prix: true },
              },
            },
          },
        },
      });

      if (!tenant) {
        throw new Error("Tenant not found");
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
        maxUsers: tenant.maxUsers,
        maxStorage: tenant.maxStorage,
        currentUsers: tenant.users.length,
        subscriptions: tenant.subscriptions,
        settings: tenant.settings,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error("Error fetching tenant info:", error);
      throw error;
    }
  }

  /**
   * Get health check information
   */
  async getHealthCheck() {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get feature flags and configurations
   */
  async getFeatureFlags() {
    return {
      multiTenant: true,
      emailIntegration: !!process.env.SMTP_HOST,
      stripeIntegration: !!process.env.STRIPE_SECRET_KEY,
      auditLogging: true,
      rateLimiting: true,
      fileUpload: true,
      messaging: true,
      shop: true,
      courses: true,
    };
  }

  /**
   * Get API endpoints information
   */
  async getApiInfo() {
    return {
      version: "v1",
      baseUrl: process.env.API_BASE_URL || "http://localhost:3000",
      endpoints: {
        auth: "/api/auth",
        users: "/api/users",
        tenants: "/api/tenants",
        messages: "/api/messages",
        shop: "/api/shop",
        orders: "/api/orders",
        courses: "/api/courses",
        payments: "/api/payments",
      },
      documentation: "/api/docs",
      healthCheck: "/api/health",
    };
  }

  /**
   * Get environment information (filtered for security)
   */
  async getEnvironmentInfo() {
    const safeEnvVars = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      API_BASE_URL: process.env.API_BASE_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      MAX_USERS: process.env.MAX_USERS,
      MAX_STORAGE: process.env.MAX_STORAGE,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      EMAIL_ENABLED: process.env.EMAIL_ENABLED,
      // Never expose sensitive data like secrets, passwords, etc.
    };

    return {
      environment: safeEnvVars,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get grades list
   */
  async getGrades() {
    try {
      // For now, return static data. In a real app, this would come from a database table
      return [
        { id: 1, nom: "Débutant", ordre: 1 },
        { id: 2, nom: "Intermédiaire", ordre: 2 },
        { id: 3, nom: "Avancé", ordre: 3 },
        { id: 4, nom: "Expert", ordre: 4 },
      ];
    } catch (error) {
      console.error("Error fetching grades:", error);
      return [];
    }
  }

  /**
   * Get genres list
   */
  async getGenres() {
    try {
      // For now, return static data. In a real app, this would come from a database table
      return [
        { id: 1, nom: "Masculin" },
        { id: 2, nom: "Féminin" },
        { id: 3, nom: "Autre" },
      ];
    } catch (error) {
      console.error("Error fetching genres:", error);
      return [];
    }
  }

  /**
   * Get status list
   */
  async getStatus() {
    try {
      // For now, return static data. In a real app, this would come from a database table
      return [
        { id: 1, nom: "Actif", couleur: "green" },
        { id: 2, nom: "Inactif", couleur: "red" },
        { id: 3, nom: "Suspendu", couleur: "orange" },
      ];
    } catch (error) {
      console.error("Error fetching status:", error);
      return [];
    }
  }

  /**
   * Get pricing plans
   */
  async getPlansTarifaires() {
    try {
      // For now, return static data. In a real app, this would come from a database table
      return [
        {
          id: 1,
          nom: "Plan Basique",
          prix: 29.99,
          duree: "1 mois",
          description: "Accès basique aux cours",
        },
        {
          id: 2,
          nom: "Plan Premium",
          prix: 49.99,
          duree: "1 mois",
          description: "Accès complet + coaching",
        },
        {
          id: 3,
          nom: "Plan Annuel",
          prix: 299.99,
          duree: "12 mois",
          description: "Accès complet pour une année",
        },
      ];
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      return [];
    }
  }
}

// Export singleton instance
export const informationService = new InformationService();
