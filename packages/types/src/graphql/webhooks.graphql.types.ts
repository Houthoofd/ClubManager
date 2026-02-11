/**
 * Types GraphQL pour les webhooks Stripe
 */

import { z } from 'zod';

/**
 * Arguments pour la query getWebhookLogs
 */
export interface GetWebhookLogsArgs {
  eventType?: string;
  success?: boolean;
  dateDebut?: string;
  dateFin?: string;
  limit?: number;
  offset?: number;
}

/**
 * Schéma de validation pour getWebhookLogs
 */
export const GetWebhookLogsArgsSchema = z.object({
  eventType: z.string().optional(),
  success: z.boolean().optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * Arguments pour la query getWebhookLog
 */
export interface GetWebhookLogArgs {
  id?: number;
  eventId?: string;
}

/**
 * Schéma de validation pour getWebhookLog
 */
export const GetWebhookLogArgsSchema = z.object({
  id: z.number().int().positive().optional(),
  eventId: z.string().optional(),
}).refine(
  (data) => data.id !== undefined || data.eventId !== undefined,
  {
    message: "Au moins un paramètre (id ou eventId) doit être fourni",
  }
);

/**
 * Arguments pour la query getWebhookStats
 */
export interface GetWebhookStatsArgs {
  dateDebut?: string;
  dateFin?: string;
}

/**
 * Schéma de validation pour getWebhookStats
 */
export const GetWebhookStatsArgsSchema = z.object({
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
});

/**
 * Arguments pour la mutation retryWebhookEvent
 */
export interface RetryWebhookEventArgs {
  eventId: string;
}

/**
 * Schéma de validation pour retryWebhookEvent
 */
export const RetryWebhookEventArgsSchema = z.object({
  eventId: z.string().min(1, 'Event ID requis'),
});

/**
 * Arguments pour la mutation processWebhookManually
 */
export interface ProcessWebhookManuallyArgs {
  eventType: string;
  payload: string; // JSON stringifié
}

/**
 * Schéma de validation pour processWebhookManually
 */
export const ProcessWebhookManuallyArgsSchema = z.object({
  eventType: z.string().min(1, 'Event type requis'),
  payload: z.string().min(1, 'Payload requis'),
});

/**
 * Type de retour pour un log de webhook
 */
export interface WebhookLogResponse {
  id: number;
  eventId: string;
  eventType: string;
  processedAt: string;
  success: boolean;
  error?: string;
  metadata?: string; // JSON stringifié
  retryCount: number;
  nextRetryAt?: string;
}

/**
 * Type de retour pour les statistiques des webhooks
 */
export interface WebhookStatsResponse {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  successRate: number;
  eventsByType: WebhookEventTypeStats[];
  recentEvents: WebhookLogResponse[];
}

/**
 * Statistiques par type d'événement
 */
export interface WebhookEventTypeStats {
  eventType: string;
  count: number;
  successCount: number;
  failureCount: number;
  lastProcessedAt?: string;
}

/**
 * Type de retour pour retry webhook
 */
export interface RetryWebhookResponse {
  success: boolean;
  message: string;
  eventId: string;
  retryCount: number;
  processedAt: string;
  error?: string;
}

/**
 * Type de retour pour process webhook manually
 */
export interface ProcessWebhookManuallyResponse {
  success: boolean;
  message: string;
  eventType: string;
  processedAt: string;
  result?: any;
  error?: string;
}

/**
 * Context GraphQL pour les webhooks
 */
export interface WebhookGraphQLContext {
  userId?: number;
  isAdmin?: boolean;
  webhookService?: any;
}

/**
 * Input pour filtrer les logs de webhooks
 */
export interface WebhookLogsFilterInput {
  eventTypes?: string[];
  success?: boolean;
  dateDebut?: string;
  dateFin?: string;
  hasError?: boolean;
  minRetryCount?: number;
}

/**
 * Schéma de validation pour le filtre
 */
export const WebhookLogsFilterInputSchema = z.object({
  eventTypes: z.array(z.string()).optional(),
  success: z.boolean().optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  hasError: z.boolean().optional(),
  minRetryCount: z.number().int().nonnegative().optional(),
});

/**
 * Résultat paginé pour les logs de webhooks
 */
export interface PaginatedWebhookLogsResponse {
  logs: WebhookLogResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Arguments pour subscription onWebhookProcessed
 */
export interface OnWebhookProcessedArgs {
  eventTypes?: string[];
}

/**
 * Schéma de validation pour subscription
 */
export const OnWebhookProcessedArgsSchema = z.object({
  eventTypes: z.array(z.string()).optional(),
});

/**
 * Payload de subscription pour webhook traité
 */
export interface WebhookProcessedPayload {
  eventId: string;
  eventType: string;
  success: boolean;
  processedAt: string;
  error?: string;
}
