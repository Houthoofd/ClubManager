/**
 * @clubmanager/types - Main Entry Point
 *
 * This package provides centralized types for ClubManager.
 * Use namespace imports to avoid conflicts:
 *
 * @example
 * import { Auth, Magasin, Cours } from '@clubmanager/types';
 * const user: Auth.LoginInput = { email: '...', password: '...' };
 * const product: Magasin.Produit = { ... };
 */

// ============================================================================
// CORE TYPES
// ============================================================================
export * from "./core/index.js";

// ============================================================================
// INFRASTRUCTURE TYPES
// ============================================================================
export type {
  EmailSendRequest,
  EmailSendResult,
  EmailValidationRequest,
  EmailValidationResult,
  EmailTemplate,
  EmailTemplateVariables,
  SendGridOptions,
  PromotionEmailOptions,
  WelcomeEmailVariables,
  OrderConfirmationVariables,
  // Advanced Email System v2.1 Types
  TemplateVariablesMap,
  TemplateName,
  TemplateVariables,
  BulkEmailRecipient,
  BulkEmailRequest,
  BulkEmailResult,
  EmailBuilderOptions,
  DryRunResult,
  UserEmailData,
  EmailHook,
  EnrichedEmailRequest,
  EmailPartial,
  EmailStats,
} from "./infrastructure/email.js";

export * from "./infrastructure/s3.js";

export type {
  WebhookRequest,
  PaymentMetadata,
  WebhookProcessingResult,
  WebhookEventLog,
  WebhookLog,
  WebhookStats,
} from "./infrastructure/webhooks.js";

export {
  StripeEventType,
  SubscriptionStatus,
  WebhookError,
  WebhookLogStatus,
} from "./infrastructure/webhooks.js";

// ============================================================================
// GRAPHQL TYPEDEFS
// ============================================================================
export { authTypeDefs } from "./domains/auth/index.js";
export { alertesTypeDefs } from "./domains/alertes/index.js";
export { commandesTypeDefs } from "./domains/commandes/index.js";
export { compteTypeDefs } from "./domains/compte/index.js";
export { coursTypeDefs } from "./domains/cours/index.js";
export { informationsTypeDefs } from "./domains/informations/index.js";
export { inscriptionTypeDefs } from "./domains/inscription/index.js";
export { magasinTypeDefs } from "./domains/magasin/index.js";
export { stocksTypeDefs } from "./domains/magasin/index.js";
export { messagesTypeDefs } from "./domains/messages/index.js";
export { paiementsTypeDefs } from "./domains/paiements/index.js";
export { echeancesTypeDefs } from "./domains/paiements/index.js";
export { confirmationTypeDefs } from "./domains/paiements/index.js";
export { professeursTypeDefs } from "./domains/professeurs/index.js";
export { statistiquesTypeDefs } from "./domains/statistiques/index.js";
export { uploadTypeDefs } from "./domains/upload/index.js";
export { utilisateursTypeDefs } from "./domains/utilisateurs/index.js";
export { verificationTypeDefs } from "./domains/verification/index.js";
export { webhooksTypeDefs } from "./infrastructure/webhooks.js";

// New domains
export { sportsTypeDefs } from "./domains/sports/index.js";
export { sessionsTypeDefs } from "./domains/sessions/index.js";
export { auditTypeDefs } from "./domains/audit/index.js";
export { gdprTypeDefs } from "./domains/gdpr/index.js";

// ============================================================================
// DOMAIN TYPES - Namespace Exports (RECOMMENDED WAY)
// ============================================================================
// Use these namespace imports to avoid naming conflicts:
// import { Auth, Magasin, Cours, ... } from '@clubmanager/types';

export * as Alertes from "./domains/alertes/index.js";
export * as Auth from "./domains/auth/index.js";
export * as Commandes from "./domains/commandes/index.js";
export * as Compte from "./domains/compte/index.js";
export * as Cours from "./domains/cours/index.js";
export * as Informations from "./domains/informations/index.js";
export * as Inscription from "./domains/inscription/index.js";
export * as Magasin from "./domains/magasin/index.js";
export * as Messages from "./domains/messages/index.js";
export * as Paiements from "./domains/paiements/index.js";
export * as Professeurs from "./domains/professeurs/index.js";
export * as Statistiques from "./domains/statistiques/index.js";
export * as Upload from "./domains/upload/index.js";
export * as Utilisateurs from "./domains/utilisateurs/index.js";
export * as Verification from "./domains/verification/index.js";

// New domains
export * as Sports from "./domains/sports/index.js";
export * as Sessions from "./domains/sessions/index.js";
export * as Audit from "./domains/audit/index.js";
export * as Gdpr from "./domains/gdpr/index.js";

// ============================================================================
// LEGACY COMPATIBILITY - Direct path imports
// ============================================================================
// If you need direct imports without namespace, use:
// import { Categorie } from '@clubmanager/types/domains/magasin';
// import { LoginInput } from '@clubmanager/types/domains/auth';
