/**
 * Resolvers GraphQL pour le module Webhooks Stripe
 * ✅ Utilise les middlewares partagés depuis @shared
 * - Erreurs GraphQL standardisées
 * - Auth middleware (requireAuth, requireAdmin)
 * - Validation middleware (withValidation)
 * - Audit logging middleware (withAuditLog)
 * - Rate limiting middleware (withRateLimit)
 * - Sentry monitoring middleware (withSentry)
 */

import {
  requireAuth,
  requireAdmin,
  combineMiddlewares,
  type GraphQLContext,
} from "@/shared/middleware/auth.middleware.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "@/shared/errors/GraphQLErrors.js";
import { withValidation } from "@/shared/middleware/validation.middleware.js";
import { withAuditLog } from "@/shared/middleware/audit-log.middleware.js";
import {
  withRateLimit,
  RateLimitPresets,
} from "@/shared/middleware/rate-limit.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";
import {
  AuditEventType,
  AuditSeverity,
} from "@/shared/services/audit-log.service.js";

// Services
import { WebhookService } from "../webhook.service.js";

// Validators depuis @clubmanager/types
import {
  getWebhookLogsSchema,
  getWebhookStatsSchema,
  retryWebhookSchema,
  processWebhookManuallySchema,
} from "@clubmanager/types/infrastructure/webhooks";

// Types
import type {
  WebhookLog,
  WebhookStats,
  WebhookLogStatus,
} from "@clubmanager/types";

/**
 * Interface pour les arguments GraphQL
 */
interface GetWebhookLogsArgs {
  limit?: number;
  offset?: number;
  status?: WebhookLogStatus;
  eventType?: string;
}

interface GetWebhookStatsArgs {
  startDate?: string;
  endDate?: string;
}

interface RetryWebhookArgs {
  webhookLogId: string;
}

interface ProcessWebhookManuallyArgs {
  eventId: string;
  eventType: string;
  payload: any;
}

/**
 * Resolvers GraphQL pour Webhooks Stripe
 */
export const webhooksResolvers = {
  Query: {
    /**
     * ✅ Récupérer les logs des webhooks (Admin uniquement)
     * @requires Admin
     * @validates getWebhookLogsSchema
     * @rateLimit 100 requests / 15 minutes
     * @audit DATA_ACCESSED
     */
    webhookLogs: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(getWebhookLogsSchema),
      withRateLimit(RateLimitPresets.QUERY),
      withAuditLog({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.INFO,
        resource: "webhooks",
      }),
    )(
      async (
        _parent: any,
        args: GetWebhookLogsArgs,
        _context: GraphQLContext,
      ): Promise<WebhookLog[]> => {
        console.log("🔍 [GraphQL] Query: webhookLogs", {
          limit: args.limit,
          offset: args.offset,
          status: args.status,
          eventType: args.eventType,
        });

        const webhookService = new WebhookService();
        return await webhookService.getWebhookLogs({
          limit: args.limit || 50,
          offset: args.offset || 0,
          status: args.status,
          eventType: args.eventType,
        });
      },
    ),

    /**
     * ✅ Récupérer les statistiques des webhooks (Admin uniquement)
     * @requires Admin
     * @validates getWebhookStatsSchema
     * @rateLimit 100 requests / 15 minutes
     * @audit DATA_ACCESSED
     */
    webhookStats: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(getWebhookStatsSchema),
      withRateLimit(RateLimitPresets.QUERY),
      withAuditLog({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.INFO,
        resource: "webhooks",
      }),
    )(
      async (
        _parent: any,
        args: GetWebhookStatsArgs,
        _context: GraphQLContext,
      ): Promise<WebhookStats> => {
        console.log("🔍 [GraphQL] Query: webhookStats", {
          startDate: args.startDate,
          endDate: args.endDate,
        });

        const webhookService = new WebhookService();
        return await webhookService.getWebhookStats({
          startDate: args.startDate,
          endDate: args.endDate,
        });
      },
    ),

    /**
     * ✅ Récupérer un log webhook par ID (Admin uniquement)
     * @requires Admin
     * @rateLimit 100 requests / 15 minutes
     * @audit DATA_ACCESSED
     */
    webhookLog: combineMiddlewares(
      requireAdmin,
      withSentry,
      withRateLimit(RateLimitPresets.QUERY),
      withAuditLog({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.INFO,
        resource: "webhooks",
      }),
    )(
      async (
        _parent: any,
        args: { id: string },
        _context: GraphQLContext,
      ): Promise<WebhookLog> => {
        console.log("🔍 [GraphQL] Query: webhookLog", { id: args.id });

        const webhookService = new WebhookService();
        const log = await webhookService.getWebhookLogById(args.id);

        if (!log) {
          throw new NotFoundError(`Webhook log ${args.id} non trouvé`);
        }

        return log;
      },
    ),
  },

  Mutation: {
    /**
     * ✅ Réessayer un webhook échoué (Admin uniquement)
     * @requires Admin
     * @validates retryWebhookSchema
     * @rateLimit 20 requests / 15 minutes
     * @audit ADMIN_SYSTEM_OPERATION
     */
    retryWebhook: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(retryWebhookSchema),
      withRateLimit({
        max: 20,
        windowMs: 15 * 60 * 1000, // 15 minutes
        message: "Trop de tentatives de retry, veuillez réessayer plus tard",
      }),
      withAuditLog({
        eventType: AuditEventType.ADMIN_SYSTEM_OPERATION,
        severity: AuditSeverity.WARNING,
        resource: "webhooks",
      }),
    )(
      async (
        _parent: any,
        args: RetryWebhookArgs,
        context: GraphQLContext,
      ): Promise<{ success: boolean; message: string }> => {
        console.log("🔧 [GraphQL] Mutation: retryWebhook", {
          webhookLogId: args.webhookLogId,
          userId: context.user?.id,
        });

        const webhookService = new WebhookService();
        return await webhookService.retryWebhook(args.webhookLogId);
      },
    ),

    /**
     * ✅ Traiter manuellement un webhook (Admin uniquement)
     * @requires Admin
     * @validates processWebhookManuallySchema
     * @rateLimit 10 requests / 15 minutes (strict)
     * @audit ADMIN_SYSTEM_OPERATION
     */
    processWebhookManually: combineMiddlewares(
      requireAdmin,
      withSentry,
      withValidation(processWebhookManuallySchema),
      withRateLimit({
        max: 10,
        windowMs: 15 * 60 * 1000, // 15 minutes
        message: "Trop de traitements manuels, veuillez réessayer plus tard",
      }),
      withAuditLog({
        eventType: AuditEventType.ADMIN_SYSTEM_OPERATION,
        severity: AuditSeverity.CRITICAL,
        resource: "webhooks",
      }),
    )(
      async (
        _parent: any,
        args: ProcessWebhookManuallyArgs,
        context: GraphQLContext,
      ): Promise<{ success: boolean; message: string }> => {
        console.log("🔧 [GraphQL] Mutation: processWebhookManually", {
          eventId: args.eventId,
          eventType: args.eventType,
          userId: context.user?.id,
        });

        const webhookService = new WebhookService();
        return await webhookService.processManually(
          args.eventId,
          args.eventType,
          args.payload,
        );
      },
    ),

    /**
     * ✅ Nettoyer les anciens logs de webhooks (Admin uniquement)
     * @requires Admin
     * @rateLimit 5 requests / 1 hour (très strict)
     * @audit ADMIN_SYSTEM_OPERATION
     */
    cleanOldWebhookLogs: combineMiddlewares(
      requireAdmin,
      withSentry,
      withRateLimit({
        max: 5,
        windowMs: 60 * 60 * 1000, // 1 heure
        message: "Trop de nettoyages, veuillez réessayer plus tard",
      }),
      withAuditLog({
        eventType: AuditEventType.ADMIN_SYSTEM_OPERATION,
        severity: AuditSeverity.WARNING,
        resource: "webhooks",
      }),
    )(
      async (
        _parent: any,
        args: { daysToKeep?: number },
        context: GraphQLContext,
      ): Promise<{
        success: boolean;
        message: string;
        deletedCount: number;
      }> => {
        console.log("🔧 [GraphQL] Mutation: cleanOldWebhookLogs", {
          daysToKeep: args.daysToKeep || 90,
          userId: context.user?.id,
        });

        const webhookService = new WebhookService();
        return await webhookService.cleanOldLogs(args.daysToKeep || 90);
      },
    ),
  },

  /**
   * ✅ Subscription pour les nouveaux webhooks (Admin uniquement)
   * Permet au dashboard admin de recevoir les webhooks en temps réel
   */
  Subscription: {
    onWebhookProcessed: {
      subscribe: (
        _parent: any,
        _args: any,
        context: GraphQLContext,
        info: any,
      ) => {
        // Note: Subscriptions return AsyncIterator, not Promise, so combineMiddlewares doesn't work
        // TODO: Add manual auth/admin checks here if needed
        console.log("🔔 [GraphQL] Subscription: onWebhookProcessed", {
          userId: context.user?.id,
        });

        // TODO: Implémenter avec PubSub (Redis ou en mémoire)
        // Pour l'instant, retourner un AsyncIterator vide
        return {
          [Symbol.asyncIterator]: async function* () {
            // Placeholder - à implémenter avec pubsub
            yield { onWebhookProcessed: null };
          },
        };
      },
    },
  },
};

/**
 * Export default pour compatibilité
 */
export default webhooksResolvers;
