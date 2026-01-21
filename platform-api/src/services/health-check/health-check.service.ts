import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const startTime = Date.now();

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckStatus;
    memory: CheckStatus;
    disk?: CheckStatus;
  };
  version?: string;
}

export interface CheckStatus {
  status: "ok" | "warning" | "error";
  message?: string;
  responseTime?: number;
  details?: any;
}

class HealthCheckService {
  /**
   * Vérifie la santé globale du système
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    const dbCheck =
      checks[0].status === "fulfilled"
        ? checks[0].value
        : this.errorCheck("Database check failed");
    const memCheck =
      checks[1].status === "fulfilled"
        ? checks[1].value
        : this.errorCheck("Memory check failed");

    const allHealthy = dbCheck.status === "ok" && memCheck.status === "ok";
    const anyError = dbCheck.status === "error" || memCheck.status === "error";

    return {
      status: anyError ? "unhealthy" : allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        database: dbCheck,
        memory: memCheck,
      },
      version: process.env.APP_VERSION || "1.0.0",
    };
  }

  /**
   * Check Database Connection
   */
  async checkDatabase(): Promise<CheckStatus> {
    const startTime = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 100 ? "ok" : "warning",
        message: `Database responsive in ${responseTime}ms`,
        responseTime,
      };
    } catch (error: any) {
      return {
        status: "error",
        message: "Database connection failed",
        details: error.message,
      };
    }
  }

  /**
   * Check Memory Usage
   */
  async checkMemory(): Promise<CheckStatus> {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const percentUsed = (heapUsedMB / heapTotalMB) * 100;

    let status: "ok" | "warning" | "error" = "ok";
    if (percentUsed > 90) status = "error";
    else if (percentUsed > 75) status = "warning";

    return {
      status,
      message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed.toFixed(1)}%)`,
      details: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        percentUsed: percentUsed.toFixed(1),
      },
    };
  }

  /**
   * Readiness check - Est-ce que le service peut accepter du trafic ?
   */
  async isReady(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Liveness check - Est-ce que le service est vivant ?
   */
  async isAlive(): Promise<boolean> {
    return true; // Si ce code s'exécute, le service est vivant
  }

  /**
   * Helper pour créer un check d'erreur
   */
  private errorCheck(message: string): CheckStatus {
    return {
      status: "error",
      message,
    };
  }

  /**
   * Nettoyer les connexions
   */
  async cleanup() {
    await prisma.$disconnect();
  }
}

const healthCheckServiceInstance = new HealthCheckService();
export const healthCheckService = healthCheckServiceInstance;
export default healthCheckServiceInstance;
