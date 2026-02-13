/**
 * Exports du module Stripe (GraphQL-only)
 * ✅ Architecture moderne : GraphQL uniquement
 */

// Export des resolvers et typeDefs GraphQL (webhooks)
export { webhooksResolvers } from "./core/webhooks/index.js";

// Export des services (réutilisables)
export * from "./core/services/payment.service.js";
export * from "./core/services/stripe.service.js";
export * from "./core/services/status-upgrade.service.js";
export * from "./core/services/email-notification.service.js";

// Export du service webhook
export * from "./core/webhooks/webhook.service.js";
