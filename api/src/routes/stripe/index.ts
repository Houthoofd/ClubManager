/**
 * Module Stripe - Point d'entrée principal
 *
 * Architecture:
 * - routes: Définition des endpoints Express
 * - handlers: Gestion des requêtes HTTP et validation
 * - services: Logique métier (Stripe, Payment, StatusUpgrade, Email)
 * - validators: Schémas Zod pour validation des données
 *
 * @module stripe
 * @version 2.0.0
 */

import stripeRoutes from "./stripe.routes.js";

// Exporter le router principal
export default stripeRoutes;

// Exporter les handlers pour utilisation dans les tests
export * from "./core/handlers/index.js";

// Exporter les services pour réutilisation
export { StripeService } from "./core/services/stripe.service.js";
export { PaymentService } from "./core/services/payment.service.js";
export { StatusUpgradeService } from "./core/services/status-upgrade.service.js";
export { EmailNotificationService } from "./core/services/email-notification.service.js";

// Exporter les webhooks (REST & GraphQL)
export {
  WebhookService,
  webhooksRouter,
  webhooksResolvers,
  webhooksTypeDefs,
} from "./core/webhooks/index.js";

// Exporter les validators pour réutilisation
export * from "./core/validators/stripe.schema.js";
