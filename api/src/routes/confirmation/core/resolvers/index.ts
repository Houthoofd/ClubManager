/**
 * Index des resolvers du module Confirmation
 * ✅ Export centralisé des resolvers GraphQL
 *
 * @module confirmation/resolvers
 *
 * ============================================
 * MIGRATION GraphQL COMPLÈTE - Module Confirmation
 * ============================================
 *
 * ✅ FAIT:
 * - TypeDefs centralisés dans @clubmanager/types/graphql/confirmation.graphql.types.ts
 * - Validators Zod centralisés dans @clubmanager/types/validators/confirmation.validators.ts
 * - Resolvers GraphQL créés avec pattern standardisé (confirmation.resolvers.ts)
 * - Middlewares appliqués: requireAuth, withSentry
 * - Validation Zod intégrée
 * - Intégration dans api/src/graphql/schema.ts
 * - Package @clubmanager/types buildé et exports disponibles
 *
 * MUTATIONS DISPONIBLES:
 * - confirmPayment(input: ConfirmPaymentInput!): ConfirmationPaiementResult!
 * - confirmPaymentCommande(input: ConfirmPaymentCommandeInput!): ConfirmationCommandeResult!
 *
 * QUERIES DISPONIBLES:
 * - confirmationHealth: ConfirmationHealthStatus!
 *
 * SÉCURITÉ:
 * - Authentification requise (requireAuth)
 * - Vérification utilisateur/admin
 * - Observabilité Sentry activée
 * - Validation stricte des inputs
 * - Gestion idempotence (already_paid, duplicate_resolved)
 *
 * FONCTIONNALITÉS:
 * - Confirmation paiement échéance avec promotion auto visiteur→utilisateur
 * - Confirmation paiement commande avec envoi email
 * - Détection premier paiement
 * - Mise à jour statuts (échéances, commandes)
 * - Intégration Stripe PaymentIntent
 * - Emails de confirmation automatiques
 *
 * ARCHITECTURE:
 * - Réutilisation services existants (Paiements, EmailClient)
 * - Pattern middleware standardisé
 * - Gestion erreurs cohérente (GraphQLErrors)
 * - Types TypeScript stricts
 *
 * TESTS À AJOUTER:
 * - Tests unitaires resolvers
 * - Tests validation Zod
 * - Tests middlewares auth/sentry
 * - Tests idempotence
 * - Tests intégration Stripe
 */

export * from "./confirmation.resolvers.js";
