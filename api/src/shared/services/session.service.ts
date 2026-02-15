/**
 * Session Management Service
 *
 * Provides centralized session management with multi-device tracking,
 * session revocation, and security monitoring.
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export interface SessionData {
  id: string;
  userId: number;
  token: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceType?: "desktop" | "mobile" | "tablet" | "unknown";
    browser?: string;
    os?: string;
  };
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface CreateSessionOptions {
  userId: number;
  userAgent: string;
  ipAddress: string;
  expiresInDays?: number;
}

export interface SessionQueryOptions {
  userId?: number;
  isActive?: boolean;
  includeExpired?: boolean;
  activeOnly?: boolean;
  limit?: number;
}

export class SessionService {
  private prisma: PrismaClient;
  private defaultExpirationDays: number;
  private maxSessionsPerUser: number;

  constructor(
    prisma: PrismaClient,
    defaultExpirationDays: number = 30,
    maxSessionsPerUser: number = 10,
  ) {
    this.prisma = prisma;
    this.defaultExpirationDays = defaultExpirationDays;
    this.maxSessionsPerUser = maxSessionsPerUser;
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Parse user agent to extract device info
   */
  private parseUserAgent(userAgent: string) {
    const deviceInfo: any = {
      userAgent,
    };

    // Detect device type
    if (/mobile/i.test(userAgent)) {
      deviceInfo.deviceType = "mobile";
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceInfo.deviceType = "tablet";
    } else if (/desktop|windows|mac|linux/i.test(userAgent)) {
      deviceInfo.deviceType = "desktop";
    } else {
      deviceInfo.deviceType = "unknown";
    }

    // Detect browser
    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
      deviceInfo.browser = "Chrome";
    } else if (/firefox/i.test(userAgent)) {
      deviceInfo.browser = "Firefox";
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      deviceInfo.browser = "Safari";
    } else if (/edg/i.test(userAgent)) {
      deviceInfo.browser = "Edge";
    } else {
      deviceInfo.browser = "Unknown";
    }

    // Detect OS
    if (/windows/i.test(userAgent)) {
      deviceInfo.os = "Windows";
    } else if (/mac/i.test(userAgent)) {
      deviceInfo.os = "macOS";
    } else if (/linux/i.test(userAgent)) {
      deviceInfo.os = "Linux";
    } else if (/android/i.test(userAgent)) {
      deviceInfo.os = "Android";
    } else if (/ios|iphone|ipad/i.test(userAgent)) {
      deviceInfo.os = "iOS";
    } else {
      deviceInfo.os = "Unknown";
    }

    return deviceInfo;
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions): Promise<SessionData> {
    const token = this.generateSessionToken();
    const deviceInfo = this.parseUserAgent(options.userAgent);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        (options.expiresInDays || this.defaultExpirationDays),
    );

    // Check active sessions count and cleanup if needed
    const activeSessions = await this.getUserSessions(options.userId, {
      activeOnly: true,
    });
    if (activeSessions.length >= this.maxSessionsPerUser) {
      // Revoke oldest session
      const oldestSession = activeSessions[activeSessions.length - 1];
      await this.revokeSession(oldestSession.id);
    }

    const session = await this.prisma.session.create({
      data: {
        userId: options.userId,
        token,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        lastActivityAt: new Date(),
        expiresAt,
        isActive: true,
      },
    });

    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      deviceInfo,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    };
  }

  /**
   * Get session by token
   */
  async getSessionByToken(token: string): Promise<SessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.revokeSession(session.id);
      return null;
    }

    const deviceInfo = this.parseUserAgent(session.userAgent || "");
    return this.mapToSessionData(session, deviceInfo);
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<SessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    const deviceInfo = this.parseUserAgent(session.userAgent || "");
    return this.mapToSessionData(session, deviceInfo);
  }

  /**
   * Update session activity
   */
  async updateActivity(token: string): Promise<void> {
    try {
      await this.prisma.session.update({
        where: { token },
        data: { lastActivityAt: new Date() },
      });
    } catch (error) {
      // Session might not exist or be expired
      console.error("[SESSION] Failed to update activity:", error);
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(
    userId: number,
    options: SessionQueryOptions = {},
  ): Promise<SessionData[]> {
    const where: any = { userId };

    if (options.activeOnly) {
      where.isActive = true;
      where.expiresAt = { gte: new Date() };
    }

    const sessions = await this.prisma.session.findMany({
      where,
      orderBy: { lastActivityAt: "desc" },
      take: options.limit || 100,
    });

    return sessions.map((session) => {
      const deviceInfo = this.parseUserAgent(session.userAgent || "");
      return this.mapToSessionData(session, deviceInfo);
    });
  }

  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      console.error("[SESSION] Failed to revoke session:", error);
      return false;
    }
  }

  /**
   * Revoke session by token
   */
  async revokeSessionByToken(token: string): Promise<boolean> {
    try {
      await this.prisma.session.update({
        where: { token },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      console.error("[SESSION] Failed to revoke session:", error);
      return false;
    }
  }

  /**
   * Revoke all sessions for a user except one
   */
  async revokeAllUserSessions(
    userId: number,
    exceptSessionId?: string,
  ): Promise<number> {
    const where: any = { userId, isActive: true };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    const result = await this.prisma.session.updateMany({
      where,
      data: { isActive: false },
    });

    return result.count;
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isActive: false,
            updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          }, // Inactive for 30 days
        ],
      },
    });

    return result.count;
  }

  /**
   * Detect potential session hijacking
   */
  async detectSuspiciousActivity(
    sessionId: string,
    currentIp: string,
  ): Promise<boolean> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      return false;
    }

    // Check if IP changed significantly (basic check)
    if (session.deviceInfo.ip !== currentIp) {
      // Log suspicious activity
      console.warn("[SESSION] Suspicious activity detected:", {
        sessionId,
        originalIp: session.deviceInfo.ip,
        currentIp,
        userId: session.userId,
      });
      return true;
    }

    return false;
  }

  /**
   * Get session statistics for a user
   */
  async getUserSessionStats(userId: number) {
    const [activeSessions, totalSessions, recentSessions] = await Promise.all([
      this.prisma.session.count({
        where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      }),
      this.prisma.session.count({ where: { userId } }),
      this.prisma.session.findMany({
        where: { userId },
        orderBy: { lastActivityAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      activeSessions,
      totalSessions,
      recentSessions: recentSessions.map((session) => {
        const deviceInfo = this.parseUserAgent(session.userAgent || "");
        return this.mapToSessionData(session, deviceInfo);
      }),
    };
  }

  /**
   * Extend session expiration
   */
  async extendSession(
    sessionId: string,
    additionalHours: number = 24,
  ): Promise<boolean> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return false;
      }

      const newExpiresAt = new Date(session.expiresAt);
      newExpiresAt.setTime(
        newExpiresAt.getTime() + additionalHours * 60 * 60 * 1000,
      );

      await this.prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt: newExpiresAt },
      });

      return true;
    } catch (error) {
      console.error("[SESSION] Failed to extend session:", error);
      return false;
    }
  }

  /**
   * Map database session to SessionData
   */
  private mapToSessionData(session: any, deviceInfo: any): SessionData {
    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      deviceInfo: {
        userAgent: session.userAgent,
        ip: session.ipAddress,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
      },
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    };
  }
}

// Singleton instance
let sessionService: SessionService | null = null;

export function createSessionService(
  prisma: PrismaClient,
  defaultExpirationDays?: number,
  maxSessionsPerUser?: number,
): SessionService {
  if (!sessionService) {
    sessionService = new SessionService(
      prisma,
      defaultExpirationDays,
      maxSessionsPerUser,
    );
  }
  return sessionService;
}

export function getSessionService(): SessionService {
  if (!sessionService) {
    throw new Error(
      "SessionService not initialized. Call createSessionService first.",
    );
  }
  return sessionService;
}
