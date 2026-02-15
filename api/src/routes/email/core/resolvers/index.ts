import { EmailValidator } from '../../../../infrastructure/external-services/email/email-validator';
import { SpamScoreChecker } from '../../../../infrastructure/external-services/email/spam-score-checker';
import { TemplateTester } from '../../../../infrastructure/external-services/email/template-tester';
import { ABTestManager } from '../../../../infrastructure/external-services/email/ab-test-manager';
import { RateLimiter } from '../../../../infrastructure/external-services/email/rate-limiter';
import { IPWarmupManager } from '../../../../infrastructure/external-services/email/ip-warmup-manager';
import { GraphQLError } from 'graphql';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Singleton instances
const emailValidator = EmailValidator.getInstance();
const spamChecker = SpamScoreChecker.getInstance();
const templateTester = TemplateTester.getInstance();
const abTestManager = ABTestManager.getInstance();
const rateLimiter = RateLimiter.getInstance();
const ipWarmupManager = IPWarmupManager.getInstance();

// Subscribe to events for real-time updates
abTestManager.on('test:started', (test) => {
  pubsub.publish(`AB_TEST_UPDATED_${test.id}`, { abTestUpdated: test });
});

abTestManager.on('test:completed', (test) => {
  pubsub.publish(`AB_TEST_UPDATED_${test.id}`, { abTestUpdated: test });
});

rateLimiter.on('email:sent', ({ domain }) => {
  const status = rateLimiter.getStatus(domain);
  if (status.utilization.perMinute > 80 || status.utilization.perHour > 80) {
    pubsub.publish(`RATE_LIMIT_ALERT_${domain}`, { rateLimitAlert: status });
    pubsub.publish('RATE_LIMIT_ALERT', { rateLimitAlert: status });
  }
});

ipWarmupManager.on('warmup:started', (status) => {
  pubsub.publish(`IP_WARMUP_UPDATED_${status.id}`, { ipWarmupUpdated: status });
});

ipWarmupManager.on('reputation:warning', ({ warmupId, reputation }) => {
  pubsub.publish(`IP_REPUTATION_ALERT_${warmupId}`, { ipReputationAlert: reputation });
});

ipWarmupManager.on('reputation:critical', ({ warmupId, reputation }) => {
  pubsub.publish(`IP_REPUTATION_ALERT_${warmupId}`, { ipReputationAlert: reputation });
});

export const emailPhase3Resolvers = {
  Query: {
    // ============================================
    // EMAIL VALIDATION
    // ============================================

    validateEmail: async (_: any, { email }: { email: string }) => {
      try {
        return await emailValidator.validateEmail(email);
      } catch (error) {
        throw new GraphQLError(`Email validation failed: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'EMAIL_VALIDATION_ERROR' },
        });
      }
    },

    validateEmailBatch: async (_: any, { input }: { input: { emails: string[] } }) => {
      try {
        const results = await emailValidator.validateEmailBatch(input.emails);
        const summary = {
          total: results.length,
          valid: results.filter((r) => r.isValid).length,
          invalid: results.filter((r) => !r.isValid).length,
          warnings: results.filter((r) => r.warnings.length > 0).length,
        };
        return { results, summary };
      } catch (error) {
        throw new GraphQLError(`Batch validation failed: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'BATCH_VALIDATION_ERROR' },
        });
      }
    },

    // ============================================
    // SPAM CHECKING
    // ============================================

    checkSpamScore: async (_: any, { input }: { input: any }) => {
      try {
        return await spamChecker.checkSpamScore(input);
      } catch (error) {
        throw new GraphQLError(`Spam check failed: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'SPAM_CHECK_ERROR' },
        });
      }
    },

    // ============================================
    // TEMPLATE TESTING
    // ============================================

    testTemplate: async (_: any, { input }: { input: any }) => {
      try {
        return await templateTester.testTemplate(input);
      } catch (error) {
        throw new GraphQLError(`Template test failed: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'TEMPLATE_TEST_ERROR' },
        });
      }
    },

    testTemplates: async (_: any, { inputs }: { inputs: any[] }) => {
      try {
        const reports = await templateTester.testTemplates(inputs);
        const statistics = templateTester.getTestStatistics(reports);
        return { reports, statistics };
      } catch (error) {
        throw new GraphQLError(`Batch template test failed: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'BATCH_TEMPLATE_TEST_ERROR' },
        });
      }
    },

    // ============================================
    // A/B TESTING
    // ============================================

    getABTest: async (_: any, { id }: { id: string }) => {
      try {
        const tests = await abTestManager.listTests();
        return tests.find((t) => t.id === id) || null;
      } catch (error) {
        throw new GraphQLError(`Failed to get A/B test: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_GET_ERROR' },
        });
      }
    },

    listABTests: async (_: any, { filter }: { filter?: any }) => {
      try {
        return await abTestManager.listTests(filter);
      } catch (error) {
        throw new GraphQLError(`Failed to list A/B tests: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_LIST_ERROR' },
        });
      }
    },

    getABTestResult: async (_: any, { testId }: { testId: string }) => {
      try {
        return await abTestManager.getTestResult(testId);
      } catch (error) {
        throw new GraphQLError(`Failed to get A/B test result: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_RESULT_ERROR' },
        });
      }
    },

    getABTestVariant: async (_: any, { testId, userId }: { testId: string; userId: string }) => {
      try {
        return abTestManager.getVariant(testId, userId);
      } catch (error) {
        throw new GraphQLError(`Failed to get A/B test variant: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_VARIANT_ERROR' },
        });
      }
    },

    // ============================================
    // RATE LIMITING
    // ============================================

    checkRateLimit: async (_: any, { email }: { email: string }) => {
      try {
        return await rateLimiter.checkLimit(email);
      } catch (error) {
        throw new GraphQLError(`Rate limit check failed: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_CHECK_ERROR' },
        });
      }
    },

    getRateLimitStatus: async (_: any, { domain }: { domain: string }) => {
      try {
        return rateLimiter.getStatus(domain);
      } catch (error) {
        throw new GraphQLError(`Failed to get rate limit status: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_STATUS_ERROR' },
        });
      }
    },

    getAllRateLimitStatuses: async () => {
      try {
        return rateLimiter.getAllStatuses();
      } catch (error) {
        throw new GraphQLError(`Failed to get all rate limit statuses: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_ALL_STATUS_ERROR' },
        });
      }
    },

    getBatchSendRecommendation: async (_: any, { emails }: { emails: string[] }) => {
      try {
        const recommendation = await rateLimiter.getBatchRecommendation(emails);
        return {
          canSendNow: recommendation.canSendNow,
          shouldWait: recommendation.shouldWait,
          groupedByDomain: Object.fromEntries(recommendation.groupedByDomain),
        };
      } catch (error) {
        throw new GraphQLError(`Failed to get batch recommendation: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'BATCH_RECOMMENDATION_ERROR' },
        });
      }
    },

    // ============================================
    // IP WARMUP
    // ============================================

    getIPWarmupStatus: async (_: any, { warmupId }: { warmupId: string }) => {
      try {
        return ipWarmupManager.getStatus(warmupId);
      } catch (error) {
        return null;
      }
    },

    getActiveIPWarmups: async () => {
      try {
        return ipWarmupManager.getActiveWarmups();
      } catch (error) {
        throw new GraphQLError(`Failed to get active IP warmups: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_LIST_ERROR' },
        });
      }
    },

    getIPWarmupProgress: async (_: any, { warmupId }: { warmupId: string }) => {
      try {
        return ipWarmupManager.getProgress(warmupId);
      } catch (error) {
        throw new GraphQLError(`Failed to get IP warmup progress: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_PROGRESS_ERROR' },
        });
      }
    },

    getIPWarmupQuota: async (_: any, { warmupId }: { warmupId: string }) => {
      try {
        return ipWarmupManager.getDailyQuota(warmupId);
      } catch (error) {
        throw new GraphQLError(`Failed to get IP warmup quota: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_QUOTA_ERROR' },
        });
      }
    },

    getIPReputationMetrics: async (_: any, { warmupId, days }: { warmupId: string; days?: number }) => {
      try {
        return ipWarmupManager.getReputationMetrics(warmupId, days || 7);
      } catch (error) {
        throw new GraphQLError(`Failed to get IP reputation metrics: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_REPUTATION_METRICS_ERROR' },
        });
      }
    },
  },

  Mutation: {
    // ============================================
    // A/B TESTING
    // ============================================

    createABTest: async (_: any, { input }: { input: any }) => {
      try {
        return await abTestManager.createTest(input);
      } catch (error) {
        throw new GraphQLError(`Failed to create A/B test: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_CREATE_ERROR' },
        });
      }
    },

    startABTest: async (_: any, { testId }: { testId: string }) => {
      try {
        return await abTestManager.startTest(testId);
      } catch (error) {
        throw new GraphQLError(`Failed to start A/B test: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_START_ERROR' },
        });
      }
    },

    pauseABTest: async (_: any, { testId }: { testId: string }) => {
      try {
        return await abTestManager.pauseTest(testId);
      } catch (error) {
        throw new GraphQLError(`Failed to pause A/B test: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_PAUSE_ERROR' },
        });
      }
    },

    completeABTest: async (_: any, { testId, winnerId }: { testId: string; winnerId?: string }) => {
      try {
        return await abTestManager.completeTest(testId, winnerId);
      } catch (error) {
        throw new GraphQLError(`Failed to complete A/B test: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_COMPLETE_ERROR' },
        });
      }
    },

    deleteABTest: async (_: any, { testId }: { testId: string }) => {
      try {
        await abTestManager.deleteTest(testId);
        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to delete A/B test: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_DELETE_ERROR' },
        });
      }
    },

    trackABTestEvent: async (_: any, { input }: { input: any }) => {
      try {
        const { testId, variantId, userId, eventType, value, url } = input;

        switch (eventType) {
          case 'sent':
            await abTestManager.trackSent(testId, variantId, userId);
            break;
          case 'open':
            await abTestManager.trackOpen(testId, variantId, userId);
            break;
          case 'click':
            await abTestManager.trackClick(testId, variantId, userId, url);
            break;
          case 'conversion':
            await abTestManager.trackConversion(testId, variantId, userId, value);
            break;
          case 'bounce':
            await abTestManager.trackBounce(testId, variantId, userId, 'hard');
            break;
          case 'unsubscribe':
            await abTestManager.trackUnsubscribe(testId, variantId, userId);
            break;
        }

        // Publish updated result
        const result = await abTestManager.getTestResult(testId);
        pubsub.publish(`AB_TEST_RESULT_UPDATED_${testId}`, { abTestResultUpdated: result });

        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to track A/B test event: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'AB_TEST_TRACK_ERROR' },
        });
      }
    },

    // ============================================
    // RATE LIMITING
    // ============================================

    recordEmailSent: async (_: any, { email }: { email: string }) => {
      try {
        await rateLimiter.recordSent(email);
        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to record email sent: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_RECORD_ERROR' },
        });
      }
    },

    setDomainLimit: async (_: any, { input }: { input: any }) => {
      try {
        const { domain, ...limits } = input;
        rateLimiter.setDomainLimit(domain, limits);
        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to set domain limit: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_SET_ERROR' },
        });
      }
    },

    enableRateLimitWarmup: async (_: any, { input }: { input: any }) => {
      try {
        rateLimiter.enableWarmupMode(input.domain, {
          startRate: input.startRate,
          targetRate: input.targetRate,
          incrementPerDay: input.incrementPerDay,
          durationDays: input.durationDays,
          startDate: input.startDate,
        });
        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to enable warmup mode: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_WARMUP_ENABLE_ERROR' },
        });
      }
    },

    disableRateLimitWarmup: async (_: any, { domain }: { domain: string }) => {
      try {
        rateLimiter.disableWarmupMode(domain);
        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to disable warmup mode: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_WARMUP_DISABLE_ERROR' },
        });
      }
    },

    resetDomainRateLimit: async (_: any, { domain }: { domain: string }) => {
      try {
        rateLimiter.resetDomain(domain);
        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to reset domain rate limit: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_RESET_ERROR' },
        });
      }
    },

    clearAllRateLimits: async () => {
      try {
        rateLimiter.clearAll();
        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to clear all rate limits: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'RATE_LIMIT_CLEAR_ERROR' },
        });
      }
    },

    // ============================================
    // IP WARMUP
    // ============================================

    startIPWarmup: async (_: any, { input }: { input: any }) => {
      try {
        return await ipWarmupManager.startWarmup(input);
      } catch (error) {
        throw new GraphQLError(`Failed to start IP warmup: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_START_ERROR' },
        });
      }
    },

    pauseIPWarmup: async (_: any, { warmupId, reason }: { warmupId: string; reason?: string }) => {
      try {
        return await ipWarmupManager.pauseWarmup(warmupId, reason);
      } catch (error) {
        throw new GraphQLError(`Failed to pause IP warmup: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_PAUSE_ERROR' },
        });
      }
    },

    resumeIPWarmup: async (_: any, { warmupId }: { warmupId: string }) => {
      try {
        return await ipWarmupManager.resumeWarmup(warmupId);
      } catch (error) {
        throw new GraphQLError(`Failed to resume IP warmup: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_RESUME_ERROR' },
        });
      }
    },

    completeIPWarmup: async (_: any, { warmupId }: { warmupId: string }) => {
      try {
        return await ipWarmupManager.completeWarmup(warmupId);
      } catch (error) {
        throw new GraphQLError(`Failed to complete IP warmup: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_COMPLETE_ERROR' },
        });
      }
    },

    recordIPSend: async (_: any, { input }: { input: any }) => {
      try {
        await ipWarmupManager.recordSend(input.warmupId, {
          success: input.success,
          bounced: input.bounced,
          bounceType: input.bounceType,
          complaint: input.complaint,
          opened: input.opened,
          clicked: input.clicked,
          unsubscribed: input.unsubscribed,
        });

        // Publish updated status
        const status = ipWarmupManager.getStatus(input.warmupId);
        pubsub.publish(`IP_WARMUP_UPDATED_${input.warmupId}`, { ipWarmupUpdated: status });

        return true;
      } catch (error) {
        throw new GraphQLError(`Failed to record IP send: ${error instanceof Error ? error.message : String(error)}`, {
          extensions: { code: 'IP_WARMUP_RECORD_ERROR' },
        });
      }
    },
  },

  Subscription: {
    // ============================================
    // A/B TEST SUBSCRIPTIONS
    // ============================================

    abTestUpdated: {
      subscribe: (_: any, { testId }: { testId: string }) => {
        return pubsub.asyncIterator([`AB_TEST_UPDATED_${testId}`]);
      },
    },

    abTestResultUpdated: {
      subscribe: (_: any, { testId }: { testId: string }) => {
        return pubsub.asyncIterator([`AB_TEST_RESULT_UPDATED_${testId}`]);
      },
    },

    // ============================================
    // RATE LIMIT SUBSCRIPTIONS
    // ============================================

    rateLimitAlert: {
      subscribe: (_: any, { domain }: { domain?: string }) => {
        if (domain) {
          return pubsub.asyncIterator([`RATE_LIMIT_ALERT_${domain}`]);
        }
        return pubsub.asyncIterator(['RATE_LIMIT_ALERT']);
      },
    },

    // ============================================
    // IP WARMUP SUBSCRIPTIONS
    // ============================================

    ipWarmupUpdated: {
      subscribe: (_: any, { warmupId }: { warmupId: string }) => {
        return pubsub.asyncIterator([`IP_WARMUP_UPDATED_${warmupId}`]);
      },
    },

    ipReputationAlert: {
      subscribe: (_: any, { warmupId }: { warmupId: string }) => {
        return pubsub.asyncIterator([`IP_REPUTATION_ALERT_${warmupId}`]);
      },
    },
  },
};
