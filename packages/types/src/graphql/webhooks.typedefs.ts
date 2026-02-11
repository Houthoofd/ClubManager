/**
 * TypeDefs GraphQL pour les webhooks Stripe
 */

export const webhooksTypeDefs = `#graphql
  """
  Types d'événements webhook Stripe
  """
  enum StripeEventType {
    PAYMENT_INTENT_SUCCEEDED
    PAYMENT_INTENT_FAILED
    CHECKOUT_SESSION_COMPLETED
    INVOICE_PAYMENT_SUCCEEDED
    INVOICE_PAYMENT_FAILED
    SUBSCRIPTION_CREATED
    SUBSCRIPTION_UPDATED
    SUBSCRIPTION_DELETED
  }

  """
  Statut d'abonnement Stripe
  """
  enum SubscriptionStatus {
    ACTIVE
    PAST_DUE
    UNPAID
    CANCELED
    INCOMPLETE
    INCOMPLETE_EXPIRED
    TRIALING
    PAUSED
  }

  """
  Log d'un événement webhook
  """
  type WebhookLog {
    id: ID!
    eventId: String!
    eventType: String!
    processedAt: String!
    success: Boolean!
    error: String
    metadata: String
    retryCount: Int!
    nextRetryAt: String
  }

  """
  Statistiques par type d'événement
  """
  type WebhookEventTypeStats {
    eventType: String!
    count: Int!
    successCount: Int!
    failureCount: Int!
    lastProcessedAt: String
  }

  """
  Statistiques des webhooks
  """
  type WebhookStats {
    totalEvents: Int!
    successfulEvents: Int!
    failedEvents: Int!
    successRate: Float!
    eventsByType: [WebhookEventTypeStats!]!
    recentEvents: [WebhookLog!]!
  }

  """
  Pagination pour les logs de webhooks
  """
  type WebhookLogsPagination {
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  """
  Résultat paginé des logs de webhooks
  """
  type PaginatedWebhookLogs {
    logs: [WebhookLog!]!
    pagination: WebhookLogsPagination!
  }

  """
  Résultat de retry d'un webhook
  """
  type RetryWebhookResult {
    success: Boolean!
    message: String!
    eventId: String!
    retryCount: Int!
    processedAt: String!
    error: String
  }

  """
  Résultat de traitement manuel d'un webhook
  """
  type ProcessWebhookManuallyResult {
    success: Boolean!
    message: String!
    eventType: String!
    processedAt: String!
    result: String
    error: String
  }

  """
  Input pour filtrer les logs de webhooks
  """
  input WebhookLogsFilterInput {
    eventTypes: [String!]
    success: Boolean
    dateDebut: String
    dateFin: String
    hasError: Boolean
    minRetryCount: Int
  }

  """
  Input pour retry d'un webhook
  """
  input RetryWebhookInput {
    eventId: String!
  }

  """
  Input pour traitement manuel d'un webhook
  """
  input ProcessWebhookManuallyInput {
    eventType: String!
    payload: String!
  }

  """
  Payload pour subscription webhook traité
  """
  type WebhookProcessedPayload {
    eventId: String!
    eventType: String!
    success: Boolean!
    processedAt: String!
    error: String
  }

  extend type Query {
    """
    Récupérer les logs de webhooks avec filtres et pagination
    Requiert: Admin
    """
    webhookLogs(
      filter: WebhookLogsFilterInput
      limit: Int = 20
      offset: Int = 0
    ): PaginatedWebhookLogs!

    """
    Récupérer un log de webhook spécifique
    Requiert: Admin
    """
    webhookLog(
      id: ID
      eventId: String
    ): WebhookLog

    """
    Récupérer les statistiques des webhooks
    Requiert: Admin
    """
    webhookStats(
      dateDebut: String
      dateFin: String
    ): WebhookStats!

    """
    Vérifier la santé du système de webhooks
    Requiert: Admin
    """
    webhooksHealth: Boolean!
  }

  extend type Mutation {
    """
    Réessayer le traitement d'un événement webhook
    Requiert: Admin
    """
    retryWebhookEvent(input: RetryWebhookInput!): RetryWebhookResult!

    """
    Traiter manuellement un webhook (pour tests/debug)
    Requiert: Admin
    """
    processWebhookManually(input: ProcessWebhookManuallyInput!): ProcessWebhookManuallyResult!
  }

  extend type Subscription {
    """
    S'abonner aux événements webhook traités
    Requiert: Admin
    """
    onWebhookProcessed(
      eventTypes: [String!]
    ): WebhookProcessedPayload!
  }
`;
