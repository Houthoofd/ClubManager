import { EventEmitter } from 'events';
import type {
  RateLimitConfig,
  RateLimitResult,
  RateLimitStatus,
  DomainLimits,
  RateLimitWindow,
} from '@club-manager/types';

/**
 * Intelligent Rate Limiter
 *
 * Manages email sending rate limits:
 * - Per-domain rate limiting
 * - Provider-specific limits (Gmail, Yahoo, Outlook, etc.)
 * - Warmup mode with gradual increases
 * - Burst protection
 * - Automatic queue management
 *
 * @example
 * ```typescript
 * const limiter = RateLimiter.getInstance();
 *
 * // Configure domain limits
 * limiter.setDomainLimit('gmail.com', {
 *   perMinute: 20,
 *   perHour: 1000,
 *   perDay: 20000
 * });
 *
 * // Check if can send
 * const result = await limiter.checkLimit('user@gmail.com');
 * if (result.allowed) {
 *   await sendEmail(...);
 *   await limiter.recordSent('user@gmail.com');
 * } else {
 *   console.log(`Wait ${result.retryAfter}ms before retry`);
 * }
 *
 * // Enable warmup mode
 * limiter.enableWarmupMode('gmail.com', {
 *   startRate: 50,
 *   targetRate: 10000,
 *   incrementPerDay: 100,
 *   durationDays: 30
 * });
 * ```
 */
export class RateLimiter extends EventEmitter {
  private static instance: RateLimiter;

  // Domain-specific limits
  private domainLimits: Map<string, DomainLimits> = new Map();

  // Tracking windows
  private windows: Map<string, RateLimitWindow> = new Map();

  // Warmup configurations
  private warmupModes: Map<string, WarmupConfig> = new Map();

  // Default limits (conservative)
  private readonly DEFAULT_LIMITS: DomainLimits = {
    perMinute: 10,
    perHour: 500,
    perDay: 10000,
    burstSize: 20,
    burstWindow: 60000, // 1 minute
  };

  // Provider-specific limits (based on industry best practices)
  private readonly PROVIDER_LIMITS: Record<string, DomainLimits> = {
    'gmail.com': {
      perMinute: 20,
      perHour: 1200,
      perDay: 20000,
      burstSize: 50,
      burstWindow: 60000,
    },
    'yahoo.com': {
      perMinute: 15,
      perHour: 800,
      perDay: 15000,
      burstSize: 30,
      burstWindow: 60000,
    },
    'outlook.com': {
      perMinute: 20,
      perHour: 1000,
      perDay: 18000,
      burstSize: 40,
      burstWindow: 60000,
    },
    'hotmail.com': {
      perMinute: 20,
      perHour: 1000,
      perDay: 18000,
      burstSize: 40,
      burstWindow: 60000,
    },
    'icloud.com': {
      perMinute: 10,
      perHour: 500,
      perDay: 10000,
      burstSize: 20,
      burstWindow: 60000,
    },
    'aol.com': {
      perMinute: 10,
      perHour: 600,
      perDay: 12000,
      burstSize: 25,
      burstWindow: 60000,
    },
  };

  private constructor() {
    super();
    this.initializeProviderLimits();
    this.startCleanupTimer();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if sending is allowed for an email address
   */
  public async checkLimit(email: string): Promise<RateLimitResult> {
    const domain = this.extractDomain(email);
    const limits = this.getDomainLimits(domain);
    const window = this.getOrCreateWindow(domain);

    const now = Date.now();
    this.cleanupExpiredRecords(window, now);

    // Check warmup mode
    if (this.warmupModes.has(domain)) {
      const warmupLimits = this.getWarmupLimits(domain);
      if (warmupLimits) {
        Object.assign(limits, warmupLimits);
      }
    }

    // Check burst limit
    const recentSends = window.sends.filter(
      (time) => now - time < (limits.burstWindow || 60000)
    ).length;

    if (recentSends >= (limits.burstSize || 20)) {
      const oldestInBurst = window.sends[window.sends.length - (limits.burstSize || 20)];
      const retryAfter = oldestInBurst + (limits.burstWindow || 60000) - now;

      return {
        allowed: false,
        domain,
        reason: 'burst_limit',
        limits,
        current: {
          perMinute: this.countInWindow(window.sends, now, 60000),
          perHour: this.countInWindow(window.sends, now, 3600000),
          perDay: this.countInWindow(window.sends, now, 86400000),
          burst: recentSends,
        },
        retryAfter,
        nextAvailable: now + retryAfter,
      };
    }

    // Check per-minute limit
    const perMinuteCount = this.countInWindow(window.sends, now, 60000);
    if (perMinuteCount >= limits.perMinute) {
      const oldestInMinute = window.sends.find((time) => now - time < 60000);
      const retryAfter = oldestInMinute ? oldestInMinute + 60000 - now : 1000;

      return {
        allowed: false,
        domain,
        reason: 'per_minute_limit',
        limits,
        current: {
          perMinute: perMinuteCount,
          perHour: this.countInWindow(window.sends, now, 3600000),
          perDay: this.countInWindow(window.sends, now, 86400000),
          burst: recentSends,
        },
        retryAfter,
        nextAvailable: now + retryAfter,
      };
    }

    // Check per-hour limit
    const perHourCount = this.countInWindow(window.sends, now, 3600000);
    if (perHourCount >= limits.perHour) {
      const oldestInHour = window.sends.find((time) => now - time < 3600000);
      const retryAfter = oldestInHour ? oldestInHour + 3600000 - now : 60000;

      return {
        allowed: false,
        domain,
        reason: 'per_hour_limit',
        limits,
        current: {
          perMinute: perMinuteCount,
          perHour: perHourCount,
          perDay: this.countInWindow(window.sends, now, 86400000),
          burst: recentSends,
        },
        retryAfter,
        nextAvailable: now + retryAfter,
      };
    }

    // Check per-day limit
    const perDayCount = this.countInWindow(window.sends, now, 86400000);
    if (perDayCount >= limits.perDay) {
      const oldestInDay = window.sends.find((time) => now - time < 86400000);
      const retryAfter = oldestInDay ? oldestInDay + 86400000 - now : 3600000;

      return {
        allowed: false,
        domain,
        reason: 'per_day_limit',
        limits,
        current: {
          perMinute: perMinuteCount,
          perHour: perHourCount,
          perDay: perDayCount,
          burst: recentSends,
        },
        retryAfter,
        nextAvailable: now + retryAfter,
      };
    }

    // All checks passed
    return {
      allowed: true,
      domain,
      limits,
      current: {
        perMinute: perMinuteCount,
        perHour: perHourCount,
        perDay: perDayCount,
        burst: recentSends,
      },
      retryAfter: 0,
      nextAvailable: now,
    };
  }

  /**
   * Record a sent email
   */
  public async recordSent(email: string): Promise<void> {
    const domain = this.extractDomain(email);
    const window = this.getOrCreateWindow(domain);
    const now = Date.now();

    window.sends.push(now);
    window.lastSent = now;

    this.emit('email:sent', { email, domain, timestamp: now });
  }

  /**
   * Set custom limits for a domain
   */
  public setDomainLimit(domain: string, limits: Partial<DomainLimits>): void {
    const existing = this.domainLimits.get(domain) || this.DEFAULT_LIMITS;
    this.domainLimits.set(domain, { ...existing, ...limits });
    this.emit('limits:updated', { domain, limits });
  }

  /**
   * Enable warmup mode for a domain
   */
  public enableWarmupMode(domain: string, config: WarmupConfig): void {
    this.warmupModes.set(domain, {
      ...config,
      startDate: config.startDate || new Date().toISOString(),
    });
    this.emit('warmup:enabled', { domain, config });
  }

  /**
   * Disable warmup mode for a domain
   */
  public disableWarmupMode(domain: string): void {
    this.warmupModes.delete(domain);
    this.emit('warmup:disabled', { domain });
  }

  /**
   * Get current rate limit status for a domain
   */
  public getStatus(domain: string): RateLimitStatus {
    const limits = this.getDomainLimits(domain);
    const window = this.getOrCreateWindow(domain);
    const now = Date.now();

    this.cleanupExpiredRecords(window, now);

    const perMinute = this.countInWindow(window.sends, now, 60000);
    const perHour = this.countInWindow(window.sends, now, 3600000);
    const perDay = this.countInWindow(window.sends, now, 86400000);
    const burst = this.countInWindow(window.sends, now, limits.burstWindow || 60000);

    const warmupConfig = this.warmupModes.get(domain);

    return {
      domain,
      limits,
      current: {
        perMinute,
        perHour,
        perDay,
        burst,
      },
      utilization: {
        perMinute: (perMinute / limits.perMinute) * 100,
        perHour: (perHour / limits.perHour) * 100,
        perDay: (perDay / limits.perDay) * 100,
        burst: (burst / (limits.burstSize || 20)) * 100,
      },
      isWarmupMode: !!warmupConfig,
      warmupProgress: warmupConfig ? this.calculateWarmupProgress(warmupConfig) : undefined,
      lastSent: window.lastSent,
      totalSent: window.sends.length,
    };
  }

  /**
   * Get status for all domains
   */
  public getAllStatuses(): RateLimitStatus[] {
    const statuses: RateLimitStatus[] = [];
    const domains = new Set([
      ...this.domainLimits.keys(),
      ...this.windows.keys(),
      ...this.warmupModes.keys(),
    ]);

    for (const domain of domains) {
      statuses.push(this.getStatus(domain));
    }

    return statuses.sort((a, b) => b.totalSent - a.totalSent);
  }

  /**
   * Reset limits for a domain
   */
  public resetDomain(domain: string): void {
    this.windows.delete(domain);
    this.emit('domain:reset', { domain });
  }

  /**
   * Clear all rate limit data
   */
  public clearAll(): void {
    this.windows.clear();
    this.emit('limits:cleared');
  }

  // === Private Helper Methods ===

  private initializeProviderLimits(): void {
    for (const [domain, limits] of Object.entries(this.PROVIDER_LIMITS)) {
      this.domainLimits.set(domain, limits);
    }
  }

  private extractDomain(email: string): string {
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  private getDomainLimits(domain: string): DomainLimits {
    return this.domainLimits.get(domain) || this.DEFAULT_LIMITS;
  }

  private getOrCreateWindow(domain: string): RateLimitWindow {
    if (!this.windows.has(domain)) {
      this.windows.set(domain, {
        domain,
        sends: [],
        lastSent: null,
        createdAt: Date.now(),
      });
    }
    return this.windows.get(domain)!;
  }

  private countInWindow(sends: number[], now: number, windowMs: number): number {
    return sends.filter((time) => now - time < windowMs).length;
  }

  private cleanupExpiredRecords(window: RateLimitWindow, now: number): void {
    // Keep only records from the last 24 hours
    const oneDayAgo = now - 86400000;
    window.sends = window.sends.filter((time) => time > oneDayAgo);
  }

  private getWarmupLimits(domain: string): Partial<DomainLimits> | null {
    const config = this.warmupModes.get(domain);
    if (!config) return null;

    const startDate = new Date(config.startDate!).getTime();
    const now = Date.now();
    const daysElapsed = Math.floor((now - startDate) / 86400000);

    if (daysElapsed >= config.durationDays) {
      // Warmup complete
      this.disableWarmupMode(domain);
      return null;
    }

    // Calculate current rate
    const progress = daysElapsed / config.durationDays;
    const currentRate = Math.floor(
      config.startRate + (config.targetRate - config.startRate) * progress
    );

    return {
      perDay: currentRate,
      perHour: Math.floor(currentRate / 24),
      perMinute: Math.floor(currentRate / 1440),
    };
  }

  private calculateWarmupProgress(config: WarmupConfig): {
    daysElapsed: number;
    daysRemaining: number;
    currentRate: number;
    targetRate: number;
    progress: number;
  } {
    const startDate = new Date(config.startDate!).getTime();
    const now = Date.now();
    const daysElapsed = Math.floor((now - startDate) / 86400000);
    const daysRemaining = Math.max(0, config.durationDays - daysElapsed);
    const progress = Math.min(1, daysElapsed / config.durationDays);
    const currentRate = Math.floor(
      config.startRate + (config.targetRate - config.startRate) * progress
    );

    return {
      daysElapsed,
      daysRemaining,
      currentRate,
      targetRate: config.targetRate,
      progress: progress * 100,
    };
  }

  private startCleanupTimer(): void {
    // Clean up old records every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;

      for (const [domain, window] of this.windows.entries()) {
        window.sends = window.sends.filter((time) => time > oneDayAgo);

        // Remove empty windows older than 1 day
        if (window.sends.length === 0 && window.createdAt < oneDayAgo) {
          this.windows.delete(domain);
        }
      }

      this.emit('cleanup:completed', {
        timestamp: now,
        activeWindows: this.windows.size,
      });
    }, 300000); // 5 minutes
  }

  /**
   * Calculate optimal send rate based on current metrics
   */
  public calculateOptimalRate(domain: string): {
    recommended: DomainLimits;
    reasoning: string[];
  } {
    const status = this.getStatus(domain);
    const reasoning: string[] = [];

    // If utilization is high, maintain current limits
    if (status.utilization.perDay > 80) {
      reasoning.push('High utilization detected, maintaining current limits');
      return { recommended: status.limits, reasoning };
    }

    // If utilization is low and no issues, suggest increase
    if (status.utilization.perDay < 50 && !status.isWarmupMode) {
      const increased: DomainLimits = {
        perMinute: Math.floor(status.limits.perMinute * 1.2),
        perHour: Math.floor(status.limits.perHour * 1.2),
        perDay: Math.floor(status.limits.perDay * 1.2),
        burstSize: status.limits.burstSize,
        burstWindow: status.limits.burstWindow,
      };
      reasoning.push('Low utilization, safe to increase limits by 20%');
      return { recommended: increased, reasoning };
    }

    reasoning.push('Current limits are optimal');
    return { recommended: status.limits, reasoning };
  }

  /**
   * Get batch send recommendation
   */
  public async getBatchRecommendation(emails: string[]): Promise<{
    canSendNow: string[];
    shouldWait: Array<{ email: string; waitMs: number }>;
    groupedByDomain: Map<string, string[]>;
  }> {
    const canSendNow: string[] = [];
    const shouldWait: Array<{ email: string; waitMs: number }> = [];
    const groupedByDomain = new Map<string, string[]>();

    for (const email of emails) {
      const domain = this.extractDomain(email);
      if (!groupedByDomain.has(domain)) {
        groupedByDomain.set(domain, []);
      }
      groupedByDomain.get(domain)!.push(email);
    }

    for (const [domain, domainEmails] of groupedByDomain.entries()) {
      for (const email of domainEmails) {
        const result = await this.checkLimit(email);
        if (result.allowed) {
          canSendNow.push(email);
        } else {
          shouldWait.push({ email, waitMs: result.retryAfter });
        }
      }
    }

    return { canSendNow, shouldWait, groupedByDomain };
  }
}

/**
 * Warmup configuration
 */
interface WarmupConfig {
  startRate: number;
  targetRate: number;
  incrementPerDay?: number;
  durationDays: number;
  startDate?: string;
}
