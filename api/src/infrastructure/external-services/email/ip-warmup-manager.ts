import { EventEmitter } from 'events';
import type {
  IPWarmupConfig,
  IPWarmupSchedule,
  IPWarmupStatus,
  IPWarmupProgress,
  IPReputationMetrics,
} from '@club-manager/types';

/**
 * IP Warmup Manager
 *
 * Manages IP address warmup for email sending reputation:
 * - Gradual volume increases
 * - Reputation monitoring
 * - Automatic schedule adjustments
 * - Integration with SendGrid/email providers
 * - Warmup strategy recommendations
 *
 * Best practices for IP warmup:
 * - Start with highly engaged users
 * - Gradually increase volume over 4-6 weeks
 * - Monitor bounce rates, complaints, and engagement
 * - Pause if reputation issues detected
 * - Maintain consistent sending patterns
 *
 * @example
 * ```typescript
 * const manager = IPWarmupManager.getInstance();
 *
 * // Start warmup
 * const warmup = await manager.startWarmup({
 *   ipAddress: '192.168.1.1',
 *   startVolume: 50,
 *   targetVolume: 50000,
 *   durationDays: 30,
 *   strategy: 'conservative'
 * });
 *
 * // Get daily quota
 * const quota = manager.getDailyQuota(warmup.id);
 * console.log(`Can send ${quota.remaining} more emails today`);
 *
 * // Record sends and monitor
 * await manager.recordSend(warmup.id, {
 *   success: true,
 *   bounced: false,
 *   opened: true
 * });
 *
 * // Check status
 * const status = manager.getStatus(warmup.id);
 * if (status.recommendation === 'pause') {
 *   console.warn('Reputation issues detected, pausing warmup');
 * }
 * ```
 */
export class IPWarmupManager extends EventEmitter {
  private static instance: IPWarmupManager;

  private warmups: Map<string, IPWarmupStatus> = new Map();
  private schedules: Map<string, IPWarmupSchedule[]> = new Map();
  private dailyMetrics: Map<string, DailyMetrics> = new Map();

  // Warmup strategies (volume increase patterns)
  private readonly STRATEGIES = {
    aggressive: {
      name: 'Aggressive',
      description: 'Fast warmup (2 weeks) - for experienced senders',
      durationDays: 14,
      multiplier: 2.5,
      maxDailyIncrease: 5000,
    },
    standard: {
      name: 'Standard',
      description: 'Standard warmup (4 weeks) - recommended',
      durationDays: 28,
      multiplier: 2.0,
      maxDailyIncrease: 3000,
    },
    conservative: {
      name: 'Conservative',
      description: 'Slow warmup (6 weeks) - safest option',
      durationDays: 42,
      multiplier: 1.5,
      maxDailyIncrease: 2000,
    },
  };

  // Reputation thresholds
  private readonly REPUTATION_THRESHOLDS = {
    excellent: {
      bounceRate: 0.01, // < 1%
      complaintRate: 0.001, // < 0.1%
      openRate: 0.25, // > 25%
      clickRate: 0.05, // > 5%
    },
    good: {
      bounceRate: 0.02, // < 2%
      complaintRate: 0.002, // < 0.2%
      openRate: 0.20, // > 20%
      clickRate: 0.03, // > 3%
    },
    warning: {
      bounceRate: 0.05, // < 5%
      complaintRate: 0.005, // < 0.5%
      openRate: 0.15, // > 15%
      clickRate: 0.02, // > 2%
    },
    critical: {
      bounceRate: 0.10, // 10%+
      complaintRate: 0.01, // 1%+
      openRate: 0.10, // < 10%
      clickRate: 0.01, // < 1%
    },
  };

  private constructor() {
    super();
    this.startMonitoring();
  }

  public static getInstance(): IPWarmupManager {
    if (!IPWarmupManager.instance) {
      IPWarmupManager.instance = new IPWarmupManager();
    }
    return IPWarmupManager.instance;
  }

  /**
   * Start IP warmup process
   */
  public async startWarmup(config: IPWarmupConfig): Promise<IPWarmupStatus> {
    this.validateConfig(config);

    const warmupId = this.generateWarmupId();
    const now = new Date();
    const strategy = this.STRATEGIES[config.strategy || 'standard'];

    // Generate warmup schedule
    const schedule = this.generateSchedule(
      config.startVolume,
      config.targetVolume,
      config.durationDays || strategy.durationDays,
      strategy
    );

    const status: IPWarmupStatus = {
      id: warmupId,
      ipAddress: config.ipAddress,
      status: 'active',
      startDate: now.toISOString(),
      endDate: new Date(now.getTime() + (config.durationDays || strategy.durationDays) * 86400000).toISOString(),
      currentDay: 0,
      totalDays: config.durationDays || strategy.durationDays,
      strategy: config.strategy || 'standard',
      startVolume: config.startVolume,
      targetVolume: config.targetVolume,
      currentVolume: 0,
      todayQuota: schedule[0].volume,
      todayUsed: 0,
      reputation: {
        score: 100,
        level: 'excellent',
        bounceRate: 0,
        complaintRate: 0,
        openRate: 0,
        clickRate: 0,
      },
      progress: 0,
      recommendation: 'continue',
      lastUpdated: now.toISOString(),
      metadata: config.metadata || {},
    };

    this.warmups.set(warmupId, status);
    this.schedules.set(warmupId, schedule);
    this.initializeDailyMetrics(warmupId);

    this.emit('warmup:started', status);
    return status;
  }

  /**
   * Pause warmup
   */
  public async pauseWarmup(warmupId: string, reason?: string): Promise<IPWarmupStatus> {
    const status = this.getWarmup(warmupId);

    if (status.status !== 'active') {
      throw new Error(`Cannot pause warmup in ${status.status} status`);
    }

    status.status = 'paused';
    status.pausedAt = new Date().toISOString();
    status.pausedReason = reason;
    status.lastUpdated = new Date().toISOString();

    this.emit('warmup:paused', { warmupId, reason });
    return status;
  }

  /**
   * Resume warmup
   */
  public async resumeWarmup(warmupId: string): Promise<IPWarmupStatus> {
    const status = this.getWarmup(warmupId);

    if (status.status !== 'paused') {
      throw new Error(`Cannot resume warmup in ${status.status} status`);
    }

    // Extend end date by pause duration
    if (status.pausedAt) {
      const pauseDuration = Date.now() - new Date(status.pausedAt).getTime();
      const newEndDate = new Date(new Date(status.endDate).getTime() + pauseDuration);
      status.endDate = newEndDate.toISOString();
    }

    status.status = 'active';
    delete status.pausedAt;
    delete status.pausedReason;
    status.lastUpdated = new Date().toISOString();

    this.emit('warmup:resumed', { warmupId });
    return status;
  }

  /**
   * Complete warmup
   */
  public async completeWarmup(warmupId: string): Promise<IPWarmupStatus> {
    const status = this.getWarmup(warmupId);

    status.status = 'completed';
    status.completedAt = new Date().toISOString();
    status.lastUpdated = new Date().toISOString();

    this.emit('warmup:completed', status);
    return status;
  }

  /**
   * Record email send
   */
  public async recordSend(
    warmupId: string,
    result: {
      success: boolean;
      bounced?: boolean;
      bounceType?: 'soft' | 'hard';
      complaint?: boolean;
      opened?: boolean;
      clicked?: boolean;
      unsubscribed?: boolean;
    }
  ): Promise<void> {
    const status = this.getWarmup(warmupId);
    const metrics = this.getDailyMetricsForToday(warmupId);

    if (result.success) {
      metrics.sent++;
      status.currentVolume++;
      status.todayUsed++;
    }

    if (result.bounced) {
      metrics.bounced++;
      if (result.bounceType === 'hard') {
        metrics.hardBounces++;
      } else {
        metrics.softBounces++;
      }
    }

    if (result.complaint) {
      metrics.complaints++;
    }

    if (result.opened) {
      metrics.opens++;
    }

    if (result.clicked) {
      metrics.clicks++;
    }

    if (result.unsubscribed) {
      metrics.unsubscribes++;
    }

    // Update reputation
    this.updateReputation(status, metrics);

    // Check for issues
    this.checkReputationIssues(status);

    this.emit('send:recorded', { warmupId, result });
  }

  /**
   * Get daily quota
   */
  public getDailyQuota(warmupId: string): {
    total: number;
    used: number;
    remaining: number;
    percentUsed: number;
  } {
    const status = this.getWarmup(warmupId);

    return {
      total: status.todayQuota,
      used: status.todayUsed,
      remaining: Math.max(0, status.todayQuota - status.todayUsed),
      percentUsed: status.todayQuota > 0 ? (status.todayUsed / status.todayQuota) * 100 : 0,
    };
  }

  /**
   * Get warmup status
   */
  public getStatus(warmupId: string): IPWarmupStatus {
    return this.getWarmup(warmupId);
  }

  /**
   * Get warmup progress
   */
  public getProgress(warmupId: string): IPWarmupProgress {
    const status = this.getWarmup(warmupId);
    const schedule = this.schedules.get(warmupId) || [];

    const daysCompleted = status.currentDay;
    const daysRemaining = status.totalDays - daysCompleted;
    const volumeProgress = (status.currentVolume / status.targetVolume) * 100;
    const timeProgress = (daysCompleted / status.totalDays) * 100;

    return {
      warmupId,
      daysCompleted,
      daysRemaining,
      totalDays: status.totalDays,
      currentVolume: status.currentVolume,
      targetVolume: status.targetVolume,
      volumeProgress,
      timeProgress,
      onSchedule: volumeProgress >= timeProgress - 10, // Within 10% tolerance
      schedule: schedule.slice(daysCompleted, daysCompleted + 7), // Next 7 days
      reputation: status.reputation,
      recommendation: status.recommendation,
    };
  }

  /**
   * Get all active warmups
   */
  public getActiveWarmups(): IPWarmupStatus[] {
    return Array.from(this.warmups.values()).filter((w) => w.status === 'active');
  }

  /**
   * Get reputation metrics
   */
  public getReputationMetrics(warmupId: string, days: number = 7): IPReputationMetrics[] {
    const metrics: IPReputationMetrics[] = [];
    const dailyMetrics = this.dailyMetrics.get(warmupId);

    if (!dailyMetrics) return metrics;

    const today = new Date().toISOString().split('T')[0];
    const dates = this.getLastNDays(today, days);

    for (const date of dates) {
      const dayMetrics = dailyMetrics.days.get(date);
      if (dayMetrics) {
        metrics.push({
          date,
          sent: dayMetrics.sent,
          bounceRate: dayMetrics.sent > 0 ? (dayMetrics.bounced / dayMetrics.sent) * 100 : 0,
          complaintRate: dayMetrics.sent > 0 ? (dayMetrics.complaints / dayMetrics.sent) * 100 : 0,
          openRate: dayMetrics.sent > 0 ? (dayMetrics.opens / dayMetrics.sent) * 100 : 0,
          clickRate: dayMetrics.sent > 0 ? (dayMetrics.clicks / dayMetrics.sent) * 100 : 0,
          unsubscribeRate: dayMetrics.sent > 0 ? (dayMetrics.unsubscribes / dayMetrics.sent) * 100 : 0,
          reputationScore: this.calculateReputationScore(dayMetrics),
        });
      }
    }

    return metrics;
  }

  // === Private Helper Methods ===

  private getWarmup(warmupId: string): IPWarmupStatus {
    const warmup = this.warmups.get(warmupId);
    if (!warmup) {
      throw new Error(`Warmup ${warmupId} not found`);
    }
    return warmup;
  }

  private validateConfig(config: IPWarmupConfig): void {
    if (!config.ipAddress) {
      throw new Error('IP address is required');
    }

    if (config.startVolume <= 0) {
      throw new Error('Start volume must be greater than 0');
    }

    if (config.targetVolume <= config.startVolume) {
      throw new Error('Target volume must be greater than start volume');
    }

    if (config.durationDays && (config.durationDays < 7 || config.durationDays > 60)) {
      throw new Error('Duration must be between 7 and 60 days');
    }
  }

  private generateWarmupId(): string {
    return `warmup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSchedule(
    startVolume: number,
    targetVolume: number,
    durationDays: number,
    strategy: any
  ): IPWarmupSchedule[] {
    const schedule: IPWarmupSchedule[] = [];
    let currentVolume = startVolume;

    for (let day = 0; day < durationDays; day++) {
      const progress = day / durationDays;

      // Calculate volume increase
      let dayVolume: number;
      if (day === 0) {
        dayVolume = startVolume;
      } else {
        const increment = Math.min(
          currentVolume * (strategy.multiplier - 1) / 7, // Weekly doubling spread over 7 days
          strategy.maxDailyIncrease,
          targetVolume - currentVolume
        );
        dayVolume = Math.floor(currentVolume + increment);
      }

      // Cap at target volume
      dayVolume = Math.min(dayVolume, targetVolume);

      schedule.push({
        day: day + 1,
        volume: dayVolume,
        cumulativeVolume: schedule.reduce((sum, s) => sum + s.volume, 0) + dayVolume,
        recommendations: this.getScheduleRecommendations(day, progress),
      });

      currentVolume = dayVolume;

      // If we've reached target, maintain it
      if (currentVolume >= targetVolume) {
        for (let remainingDay = day + 1; remainingDay < durationDays; remainingDay++) {
          schedule.push({
            day: remainingDay + 1,
            volume: targetVolume,
            cumulativeVolume: schedule.reduce((sum, s) => sum + s.volume, 0) + targetVolume,
            recommendations: ['Maintain target volume', 'Monitor reputation closely'],
          });
        }
        break;
      }
    }

    return schedule;
  }

  private getScheduleRecommendations(day: number, progress: number): string[] {
    const recommendations: string[] = [];

    if (day === 0) {
      recommendations.push('Start with most engaged users');
      recommendations.push('Monitor metrics closely');
    } else if (progress < 0.25) {
      recommendations.push('Focus on highly engaged segments');
      recommendations.push('Watch bounce rates carefully');
    } else if (progress < 0.5) {
      recommendations.push('Expand to moderately engaged users');
      recommendations.push('Maintain consistent sending times');
    } else if (progress < 0.75) {
      recommendations.push('Include broader audience segments');
      recommendations.push('Monitor complaint rates');
    } else {
      recommendations.push('Near target volume');
      recommendations.push('Prepare for normal sending');
    }

    return recommendations;
  }

  private initializeDailyMetrics(warmupId: string): void {
    this.dailyMetrics.set(warmupId, {
      warmupId,
      days: new Map(),
    });
  }

  private getDailyMetricsForToday(warmupId: string): DayMetrics {
    const metrics = this.dailyMetrics.get(warmupId);
    if (!metrics) {
      throw new Error(`Metrics not found for warmup ${warmupId}`);
    }

    const today = new Date().toISOString().split('T')[0];
    if (!metrics.days.has(today)) {
      metrics.days.set(today, {
        date: today,
        sent: 0,
        bounced: 0,
        hardBounces: 0,
        softBounces: 0,
        complaints: 0,
        opens: 0,
        clicks: 0,
        unsubscribes: 0,
      });
    }

    return metrics.days.get(today)!;
  }

  private updateReputation(status: IPWarmupStatus, metrics: DayMetrics): void {
    const sent = metrics.sent;
    if (sent === 0) return;

    status.reputation.bounceRate = (metrics.bounced / sent) * 100;
    status.reputation.complaintRate = (metrics.complaints / sent) * 100;
    status.reputation.openRate = (metrics.opens / sent) * 100;
    status.reputation.clickRate = (metrics.clicks / sent) * 100;

    // Calculate reputation score (0-100)
    status.reputation.score = this.calculateReputationScore(metrics);

    // Determine reputation level
    if (status.reputation.score >= 90) {
      status.reputation.level = 'excellent';
    } else if (status.reputation.score >= 75) {
      status.reputation.level = 'good';
    } else if (status.reputation.score >= 60) {
      status.reputation.level = 'fair';
    } else {
      status.reputation.level = 'poor';
    }

    status.lastUpdated = new Date().toISOString();
  }

  private calculateReputationScore(metrics: DayMetrics): number {
    if (metrics.sent === 0) return 100;

    const bounceRate = metrics.bounced / metrics.sent;
    const complaintRate = metrics.complaints / metrics.sent;
    const openRate = metrics.opens / metrics.sent;

    let score = 100;

    // Penalize bounces (weight: 40%)
    score -= Math.min(40, bounceRate * 4000);

    // Penalize complaints (weight: 40%)
    score -= Math.min(40, complaintRate * 4000);

    // Reward opens (weight: 20%)
    score += Math.min(20, openRate * 80) - 20;

    return Math.max(0, Math.min(100, score));
  }

  private checkReputationIssues(status: IPWarmupStatus): void {
    const { reputation } = status;
    const thresholds = this.REPUTATION_THRESHOLDS;

    // Critical issues - pause immediately
    if (
      reputation.bounceRate / 100 > thresholds.critical.bounceRate ||
      reputation.complaintRate / 100 > thresholds.critical.complaintRate
    ) {
      status.recommendation = 'pause';
      this.emit('reputation:critical', {
        warmupId: status.id,
        reputation,
        reason: 'Critical bounce or complaint rate',
      });
      return;
    }

    // Warning issues - slow down
    if (
      reputation.bounceRate / 100 > thresholds.warning.bounceRate ||
      reputation.complaintRate / 100 > thresholds.warning.complaintRate ||
      reputation.openRate / 100 < thresholds.warning.openRate
    ) {
      status.recommendation = 'slow_down';
      this.emit('reputation:warning', {
        warmupId: status.id,
        reputation,
        reason: 'Reputation metrics in warning range',
      });
      return;
    }

    // Good metrics - continue or speed up
    if (
      reputation.bounceRate / 100 < thresholds.excellent.bounceRate &&
      reputation.complaintRate / 100 < thresholds.excellent.complaintRate &&
      reputation.openRate / 100 > thresholds.excellent.openRate
    ) {
      status.recommendation = 'speed_up';
    } else if (
      reputation.bounceRate / 100 < thresholds.good.bounceRate &&
      reputation.complaintRate / 100 < thresholds.good.complaintRate
    ) {
      status.recommendation = 'continue';
    }
  }

  private startMonitoring(): void {
    // Check daily metrics and update warmup status
    setInterval(() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      for (const [warmupId, status] of this.warmups.entries()) {
        if (status.status !== 'active') continue;

        // Check if new day
        const lastUpdate = new Date(status.lastUpdated).toISOString().split('T')[0];
        if (today !== lastUpdate) {
          // New day - update schedule
          status.currentDay++;
          status.todayUsed = 0;

          const schedule = this.schedules.get(warmupId);
          if (schedule && schedule[status.currentDay]) {
            status.todayQuota = schedule[status.currentDay].volume;
          }

          // Check if warmup completed
          if (status.currentDay >= status.totalDays) {
            this.completeWarmup(warmupId);
          }

          // Update progress
          status.progress = (status.currentDay / status.totalDays) * 100;

          this.emit('warmup:day_changed', { warmupId, day: status.currentDay });
        }
      }
    }, 3600000); // Check every hour
  }

  private getLastNDays(endDate: string, days: number): string[] {
    const dates: string[] = [];
    const end = new Date(endDate);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }
}

/**
 * Daily metrics tracking
 */
interface DailyMetrics {
  warmupId: string;
  days: Map<string, DayMetrics>;
}

interface DayMetrics {
  date: string;
  sent: number;
  bounced: number;
  hardBounces: number;
  softBounces: number;
  complaints: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
}
