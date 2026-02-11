/**
 * ============================================================================
 * MODULE WEBHOOKS STRIPE - Index Principal
 * ============================================================================
 *
 * Ce module gère l'ensemble du système de webhooks Stripe avec :
 * - Validation de signature Stripe
 * - Traitement des événements de paiement
 * - Persistance en base de données (Prisma)
 * - API GraphQL pour l'administration
 * - Monitoring Sentry complet
 *
 * ============================================================================
 * ÉVÉNEMENTS SUPPORTÉS
 * ============================================================================
 *
 * ✅ payment_intent.succeeded - Paiement réussi
 * ✅ payment_intent.payment_failed - Paiement échoué
 * ✅ checkout.session.completed - Session checkout complétée
 * ✅ invoice.payment_succeeded - Facture payée
 * ✅ invoice.payment_failed - Échec paiement facture
 * ✅ customer.subscription.created - Abonnement créé
 * ✅ customer.subscription.updated - Abonnement mis à jour
 * ✅ customer.subscription.deleted - Abonnement supprimé
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 *
 * 1. REST API (webhooks.routes.ts)
 *    - POST /api/stripe/webhooks/stripe - Endpoint principal
 *    - POST /api/stripe/webhooks/test - Test (dev only)
 *    - GET /api/stripe/webhooks/health - Health check
 *
 * 2. Service Layer (webhook.service.ts)
 *    - validateSignature() - Validation Stripe
 *    - handle*() - Handlers par type d'événement
 *    - Méthodes GraphQL (logs, stats, retry)
 *    - Persistance Prisma (createWebhookLog, markSuccess/Failure)
 *
 * 3. GraphQL API (resolvers/webhooks.resolvers.ts)
 *    - Queries: webhookLogs, webhookStats, webhookLog
 *    - Mutations: retryWebhook, processWebhookManually, cleanOldWebhookLogs
 *    - Subscriptions: onWebhookProcessed
 *
 * 4. Base de données (Prisma - webhook_logs table)
 *    - Logs de tous les événements
 *    - Statuts: PENDING, SUCCESS, FAILURE, RETRYING
 *    - Retry automatique avec exponential backoff
 *
 * ============================================================================
 * CONFIGURATION REQUISE
 * ============================================================================
 *
 * Variables d'environnement :
 * - STRIPE_SECRET_KEY - Clé API Stripe
 * - STRIPE_WEBHOOK_SECRET - Secret pour validation signature
 * - SENTRY_DSN - Pour monitoring (optionnel)
 * - DATABASE_URL - Connexion Prisma
 *
 * ============================================================================
 * UTILISATION
 * ============================================================================
 *
 * // Importer le router REST dans index.ts
 * import { webhooksRouter } from './routes/stripe/core/webhooks';
 * app.use('/api/stripe/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);
 *
 * // Utiliser le service programmatiquement
 * import { WebhookService } from './routes/stripe/core/webhooks';
 * const service = new WebhookService();
 * await service.handlePaymentSuccess(paymentIntent);
 *
 * // Les resolvers GraphQL sont automatiquement intégrés au schéma principal
 *
 * ============================================================================
 * MONITORING & LOGS
 * ============================================================================
 *
 * - Chaque webhook crée une transaction Sentry
 * - Logs persisteront en BDD pour audit
 * - Dashboard admin via GraphQL pour stats en temps réel
 * - Retry automatique des échecs (max 3 tentatives)
 *
 * @module webhooks
 * @version 2.0.0
 * @author ClubManager Team
 */

export { WebhookService } from "./webhook.service.js";
export { default as webhooksRouter } from "./webhooks.routes.js";

// Export des resolvers et typedefs GraphQL
export { webhooksResolvers, webhooksTypeDefs } from "./resolvers/index.js";
