import { EventEmitter } from "events";
import type {
  ABTest,
  ABTestVariant,
  ABTestConfig,
  ABTestResult,
  ABTestDistribution,
  ABTestStatus,
  ABTestMetrics,
  ABTestWinner,
} from "@clubmanager/types";

/**
 * A/B Test Manager
 *
 * Manages email A/B testing:
 * - Create and configure tests
 * - Distribute variants (random, weighted, etc.)
 * - Track opens, clicks, conversions
 * - Calculate statistical significance
 * - Select winners automatically
 *
 * @example
 * ```typescript
 * const manager = ABTestManager.getInstance();
 *
 * // Create test
 * const test = await manager.createTest({
 *   name: 'Subject Line Test',
 *   description: 'Testing short vs long subject lines',
 *   variants: [
 *     { name: 'Short', subject: 'Welcome!', weight: 50 },
 *     { name: 'Long', subject: 'Welcome to our amazing platform!', weight: 50 }
 *   ],
 *   minSampleSize: 1000,
 *   confidenceLevel: 0.95
 * });
 *
 * // Get variant for user
 * const variant = manager.getVariant(test.id, 'user123');
 *
 * // Track event
 * await manager.trackOpen(test.id, variant.id, 'user123');
 * await manager.trackClick(test.id, variant.id, 'user123');
 * await manager.trackConversion(test.id, variant.id, 'user123', 99.99);
 *
 * // Check results
 * const result = await manager.getTestResult(test.id);
 * if (result.hasWinner) {
 *   console.log('Winner:', result.winner.variant.name);
 * }
 * ```
 */
export class ABTestManager extends EventEmitter {
  private static instance: ABTestManager;
  private tests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // testId -> userId -> variantId
  private metrics: Map<string, ABTestMetrics> = new Map(); // testId -> metrics

  private readonly MIN_SAMPLE_SIZE = 100;
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.95;
  private readonly MAX_DURATION_DAYS = 30;

  private constructor() {
    super();
  }

  public static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  /**
   * Create a new A/B test
   */
  public async createTest(config: ABTestConfig): Promise<ABTest> {
    this.validateConfig(config);

    const testId = this.generateTestId();
    const now = new Date();

    // Normalize variant weights
    const totalWeight = config.variants.reduce(
      (sum: number, v: any) => sum + (v.weight || 50),
      0,
    );
    const normalizedVariants: ABTestVariant[] = config.variants.map(
      (v: any, index: number) => ({
        id: `${testId}_variant_${index}`,
        testId,
        name: v.name,
        description: v.description,
        subject: v.subject,
        html: v.html,
        text: v.text,
        weight: ((v.weight || 50) / totalWeight) * 100,
        metadata: v.metadata || {},
        createdAt: now.toISOString(),
      }),
    );

    const test: ABTest = {
      id: testId,
      name: config.name,
      description: config.description,
      status: "draft",
      variants: normalizedVariants,
      distribution: config.distribution || "random",
      minSampleSize: Math.max(
        config.minSampleSize || this.MIN_SAMPLE_SIZE,
        this.MIN_SAMPLE_SIZE,
      ),
      confidenceLevel: config.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL,
      primaryMetric: config.primaryMetric || "conversion_rate",
      secondaryMetrics: config.secondaryMetrics || ["open_rate", "click_rate"],
      startDate: config.startDate,
      endDate: config.endDate,
      autoSelectWinner: config.autoSelectWinner ?? true,
      winnerCriteria: config.winnerCriteria || {
        metric: "conversion_rate",
        minimumImprovement: 0.05, // 5% improvement
        confidenceLevel: 0.95,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      metadata: config.metadata || {},
    };

    this.tests.set(testId, test);
    this.metrics.set(testId, this.initializeMetrics(normalizedVariants));

    this.emit("test:created", test);
    return test;
  }

  /**
   * Start a test
   */
  public async startTest(testId: string): Promise<ABTest> {
    const test = this.getTest(testId);

    if (test.status !== "draft") {
      throw new Error(`Cannot start test in ${test.status} status`);
    }

    test.status = "running";
    test.startDate = new Date().toISOString();
    test.updatedAt = new Date().toISOString();

    this.emit("test:started", test);
    return test;
  }

  /**
   * Pause a test
   */
  public async pauseTest(testId: string): Promise<ABTest> {
    const test = this.getTest(testId);

    if (test.status !== "running") {
      throw new Error(`Cannot pause test in ${test.status} status`);
    }

    test.status = "paused";
    test.updatedAt = new Date().toISOString();

    this.emit("test:paused", test);
    return test;
  }

  /**
   * Complete a test
   */
  public async completeTest(
    testId: string,
    winnerId?: string,
  ): Promise<ABTest> {
    const test = this.getTest(testId);

    if (test.status === "completed") {
      throw new Error("Test is already completed");
    }

    test.status = "completed";
    test.endDate = new Date().toISOString();
    test.updatedAt = new Date().toISOString();

    if (winnerId) {
      test.winnerId = winnerId;
    } else if (test.autoSelectWinner) {
      const result = await this.getTestResult(testId);
      if (result.hasWinner) {
        test.winnerId = result.winner!.variant.id;
      }
    }

    this.emit("test:completed", test);
    return test;
  }

  /**
   * Get variant for a user
   */
  public getVariant(testId: string, userId: string): ABTestVariant {
    const test = this.getTest(testId);

    if (test.status !== "running") {
      throw new Error(`Test is not running (status: ${test.status})`);
    }

    // Check if user already assigned
    const testAssignments = this.userAssignments.get(testId) || new Map();
    let assignedVariantId = testAssignments.get(userId);

    if (!assignedVariantId) {
      // Assign variant based on distribution strategy
      assignedVariantId = this.assignVariant(test, userId);
      testAssignments.set(userId, assignedVariantId);
      this.userAssignments.set(testId, testAssignments);

      this.emit("user:assigned", {
        testId,
        userId,
        variantId: assignedVariantId,
      });
    }

    const variant = test.variants.find((v) => v.id === assignedVariantId);
    if (!variant) {
      throw new Error(`Variant ${assignedVariantId} not found`);
    }

    return variant;
  }

  /**
   * Track email sent
   */
  public async trackSent(
    testId: string,
    variantId: string,
    userId: string,
  ): Promise<void> {
    const metrics = this.getMetrics(testId);
    const variantMetrics = metrics.variants[variantId];

    if (!variantMetrics) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    variantMetrics.sent++;
    variantMetrics.users.add(userId);

    this.emit("event:sent", { testId, variantId, userId });
  }

  /**
   * Track email open
   */
  public async trackOpen(
    testId: string,
    variantId: string,
    userId: string,
  ): Promise<void> {
    const metrics = this.getMetrics(testId);
    const variantMetrics = metrics.variants[variantId];

    if (!variantMetrics) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    if (!variantMetrics.opens.has(userId)) {
      variantMetrics.opens.add(userId);
      variantMetrics.openCount++;
      this.emit("event:open", { testId, variantId, userId });
    }
  }

  /**
   * Track link click
   */
  public async trackClick(
    testId: string,
    variantId: string,
    userId: string,
    url?: string,
  ): Promise<void> {
    const metrics = this.getMetrics(testId);
    const variantMetrics = metrics.variants[variantId];

    if (!variantMetrics) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    if (!variantMetrics.clicks.has(userId)) {
      variantMetrics.clicks.add(userId);
      variantMetrics.clickCount++;
    }

    if (url) {
      variantMetrics.clickedUrls.set(
        url,
        (variantMetrics.clickedUrls.get(url) || 0) + 1,
      );
    }

    this.emit("event:click", { testId, variantId, userId, url });
  }

  /**
   * Track conversion
   */
  public async trackConversion(
    testId: string,
    variantId: string,
    userId: string,
    value?: number,
  ): Promise<void> {
    const metrics = this.getMetrics(testId);
    const variantMetrics = metrics.variants[variantId];

    if (!variantMetrics) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    if (!variantMetrics.conversions.has(userId)) {
      variantMetrics.conversions.add(userId);
      variantMetrics.conversionCount++;

      if (value !== undefined) {
        variantMetrics.revenue += value;
      }

      this.emit("event:conversion", { testId, variantId, userId, value });
    }
  }

  /**
   * Track bounce
   */
  public async trackBounce(
    testId: string,
    variantId: string,
    userId: string,
    type: "soft" | "hard",
  ): Promise<void> {
    const metrics = this.getMetrics(testId);
    const variantMetrics = metrics.variants[variantId];

    if (!variantMetrics) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    if (!variantMetrics.bounces.has(userId)) {
      variantMetrics.bounces.add(userId);
      variantMetrics.bounceCount++;
    }

    this.emit("event:bounce", { testId, variantId, userId, type });
  }

  /**
   * Track unsubscribe
   */
  public async trackUnsubscribe(
    testId: string,
    variantId: string,
    userId: string,
  ): Promise<void> {
    const metrics = this.getMetrics(testId);
    const variantMetrics = metrics.variants[variantId];

    if (!variantMetrics) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    if (!variantMetrics.unsubscribes.has(userId)) {
      variantMetrics.unsubscribes.add(userId);
      variantMetrics.unsubscribeCount++;
    }

    this.emit("event:unsubscribe", { testId, variantId, userId });
  }

  /**
   * Get test result with statistical analysis
   */
  public async getTestResult(testId: string): Promise<ABTestResult> {
    const test = this.getTest(testId);
    const metrics = this.getMetrics(testId);

    const variantResults = test.variants.map((variant: ABTestVariant) => {
      const variantMetrics = metrics.variants[variant.id];
      return this.calculateVariantMetrics(variant, variantMetrics);
    });

    // Calculate statistical significance
    const winner = this.calculateWinner(test, variantResults);

    // Check if test has reached minimum sample size
    const totalSent = variantResults.reduce(
      (sum: number, v: any) => sum + v.sent,
      0,
    );
    const hasMinSampleSize = totalSent >= test.minSampleSize;

    return {
      testId: test.id,
      testName: test.name,
      status: test.status,
      startDate: test.startDate,
      endDate: test.endDate,
      duration: this.calculateDuration(test),
      variants: variantResults,
      winner: winner.winner,
      hasWinner: winner.hasWinner,
      confidence: winner.confidence,
      hasMinSampleSize,
      primaryMetric: test.primaryMetric,
      recommendations: this.generateRecommendations(
        test,
        variantResults,
        winner,
      ),
    };
  }

  /**
   * Get all tests
   */
  public async listTests(filter?: {
    status?: ABTestStatus;
    search?: string;
  }): Promise<ABTest[]> {
    let tests = Array.from(this.tests.values());

    if (filter?.status) {
      tests = tests.filter((t) => t.status === filter.status);
    }

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      tests = tests.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          (t.description && t.description.toLowerCase().includes(search)),
      );
    }

    return tests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Delete a test
   */
  public async deleteTest(testId: string): Promise<void> {
    const test = this.getTest(testId);

    if (test.status === "running") {
      throw new Error(
        "Cannot delete a running test. Pause or complete it first.",
      );
    }

    this.tests.delete(testId);
    this.metrics.delete(testId);
    this.userAssignments.delete(testId);

    this.emit("test:deleted", { testId });
  }

  // === Private Helper Methods ===

  private getTest(testId: string): ABTest {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }
    return test;
  }

  private getMetrics(testId: string): ABTestMetrics {
    const metrics = this.metrics.get(testId);
    if (!metrics) {
      throw new Error(`Metrics for test ${testId} not found`);
    }
    return metrics;
  }

  private validateConfig(config: ABTestConfig): void {
    if (!config.name) {
      throw new Error("Test name is required");
    }

    if (!config.variants || config.variants.length < 2) {
      throw new Error("At least 2 variants are required");
    }

    if (config.variants.length > 10) {
      throw new Error("Maximum 10 variants allowed");
    }

    const totalWeight = config.variants.reduce(
      (sum: number, v: any) => sum + (v.weight || 50),
      0,
    );
    if (totalWeight <= 0) {
      throw new Error("Total variant weight must be greater than 0");
    }
  }

  private generateTestId(): string {
    return `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(variants: ABTestVariant[]): ABTestMetrics {
    const variantMetrics: Record<string, any> = {};

    for (const variant of variants) {
      variantMetrics[variant.id] = {
        sent: 0,
        openCount: 0,
        clickCount: 0,
        conversionCount: 0,
        bounceCount: 0,
        unsubscribeCount: 0,
        revenue: 0,
        users: new Set<string>(),
        opens: new Set<string>(),
        clicks: new Set<string>(),
        conversions: new Set<string>(),
        bounces: new Set<string>(),
        unsubscribes: new Set<string>(),
        clickedUrls: new Map<string, number>(),
      };
    }

    return { variants: variantMetrics };
  }

  private assignVariant(test: ABTest, userId: string): string {
    switch (test.distribution) {
      case "random":
        return this.assignRandomVariant(test.variants);
      case "weighted":
        return this.assignWeightedVariant(test.variants);
      case "sequential":
        return this.assignSequentialVariant(test);
      case "sticky":
        return this.assignStickyVariant(test.variants, userId);
      default:
        return this.assignRandomVariant(test.variants);
    }
  }

  private assignRandomVariant(variants: ABTestVariant[]): string {
    const index = Math.floor(Math.random() * variants.length);
    return variants[index].id;
  }

  private assignWeightedVariant(variants: ABTestVariant[]): string {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant.id;
      }
    }

    return variants[0].id;
  }

  private assignSequentialVariant(test: ABTest): string {
    const metrics = this.getMetrics(test.id);
    const counts = test.variants.map((v) => metrics.variants[v.id].sent);
    const minCount = Math.min(...counts);
    const variantIndex = counts.indexOf(minCount);
    return test.variants[variantIndex].id;
  }

  private assignStickyVariant(
    variants: ABTestVariant[],
    userId: string,
  ): string {
    // Hash userId to consistently assign same variant
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % variants.length;
    return variants[index].id;
  }

  private calculateVariantMetrics(variant: ABTestVariant, metrics: any) {
    const sent = metrics.sent;
    const opens = metrics.opens.size;
    const clicks = metrics.clicks.size;
    const conversions = metrics.conversions.size;
    const bounces = metrics.bounces.size;
    const unsubscribes = metrics.unsubscribes.size;

    return {
      variant,
      sent,
      opens,
      clicks,
      conversions,
      bounces,
      unsubscribes,
      revenue: metrics.revenue,
      openRate: sent > 0 ? (opens / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicks / sent) * 100 : 0,
      conversionRate: sent > 0 ? (conversions / sent) * 100 : 0,
      bounceRate: sent > 0 ? (bounces / sent) * 100 : 0,
      unsubscribeRate: sent > 0 ? (unsubscribes / sent) * 100 : 0,
      clickToOpenRate: opens > 0 ? (clicks / opens) * 100 : 0,
      revenuePerEmail: sent > 0 ? metrics.revenue / sent : 0,
    };
  }

  private calculateWinner(
    test: ABTest,
    variantResults: any[],
  ): {
    hasWinner: boolean;
    winner: ABTestWinner | null;
    confidence: number;
  } {
    if (variantResults.length < 2) {
      return { hasWinner: false, winner: null, confidence: 0 };
    }

    const metric = test.primaryMetric;
    const metricKey = metric.replace("_rate", "Rate");

    // Find best performing variant
    const sorted = [...variantResults].sort(
      (a: any, b: any) => b[metricKey] - a[metricKey],
    );
    const best = sorted[0];
    const second = sorted[1];

    // Calculate z-score for statistical significance
    const { zScore, pValue } = this.calculateZScore(best, second, metricKey);
    const confidence = 1 - pValue;

    const hasWinner =
      confidence >= test.confidenceLevel &&
      best.sent >= test.minSampleSize / variantResults.length;

    if (!hasWinner) {
      return { hasWinner: false, winner: null, confidence };
    }

    const improvement =
      ((best[metricKey] - second[metricKey]) / second[metricKey]) * 100;

    return {
      hasWinner: true,
      winner: {
        variant: best.variant,
        metric: metricKey,
        value: best[metricKey],
        improvement,
        confidence,
        sampleSize: best.sent,
      },
      confidence,
    };
  }

  private calculateZScore(
    variant1: any,
    variant2: any,
    metric: string,
  ): { zScore: number; pValue: number } {
    const p1 = variant1[metric] / 100;
    const n1 = variant1.sent;
    const p2 = variant2[metric] / 100;
    const n2 = variant2.sent;

    if (n1 === 0 || n2 === 0) {
      return { zScore: 0, pValue: 1 };
    }

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const standardError = Math.sqrt(
      pooledP * (1 - pooledP) * (1 / n1 + 1 / n2),
    );

    if (standardError === 0) {
      return { zScore: 0, pValue: 1 };
    }

    const zScore = (p1 - p2) / standardError;
    const pValue = this.zScoreToPValue(Math.abs(zScore));

    return { zScore, pValue };
  }

  private zScoreToPValue(zScore: number): number {
    // Approximation of standard normal CDF
    const t = 1 / (1 + 0.2316419 * zScore);
    const d = 0.3989423 * Math.exp((-zScore * zScore) / 2);
    const p =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return 2 * p; // Two-tailed test
  }

  private calculateDuration(test: ABTest): number | null {
    if (!test.startDate) return null;
    const end = test.endDate ? new Date(test.endDate) : new Date();
    const start = new Date(test.startDate);
    return Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  private generateRecommendations(
    test: ABTest,
    variantResults: any[],
    winner: any,
  ): string[] {
    const recommendations: string[] = [];
    const totalSent = variantResults.reduce((sum, v) => sum + v.sent, 0);

    if (totalSent < test.minSampleSize) {
      const remaining = test.minSampleSize - totalSent;
      recommendations.push(
        `⏳ Need ${remaining} more emails to reach minimum sample size (${test.minSampleSize})`,
      );
    }

    if (!winner.hasWinner) {
      if (totalSent >= test.minSampleSize) {
        recommendations.push(
          "📊 Sample size reached but no clear winner. Results are too close or confidence level not met.",
        );
      }
    } else {
      recommendations.push(
        `🏆 Winner identified with ${(winner.confidence * 100).toFixed(1)}% confidence!`,
        `💡 Deploy variant "${winner.winner.variant.name}" for ${winner.winner.improvement.toFixed(1)}% improvement`,
      );
    }

    // Check for poor performing variants
    const avgConversionRate =
      variantResults.reduce((sum, v) => sum + v.conversionRate, 0) /
      variantResults.length;
    const poorVariants = variantResults.filter(
      (v) => v.conversionRate < avgConversionRate * 0.7,
    );

    if (poorVariants.length > 0) {
      recommendations.push(
        `⚠️ ${poorVariants.length} variant(s) performing significantly below average`,
      );
    }

    return recommendations;
  }

  /**
   * Export test data for external analysis
   */
  public async exportTestData(testId: string): Promise<{
    test: ABTest;
    result: ABTestResult;
    rawMetrics: ABTestMetrics;
  }> {
    const test = this.getTest(testId);
    const result = await this.getTestResult(testId);
    const rawMetrics = this.getMetrics(testId);

    return {
      test,
      result,
      rawMetrics,
    };
  }
}
