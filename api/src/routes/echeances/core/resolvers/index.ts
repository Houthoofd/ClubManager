/**
 * Index des resolvers du module Écheances
 * ✅ Export centralisé des resolvers GraphQL
 *
 * @module echeances/resolvers
 *
 * ============================================
 * MIGRATION GraphQL COMPLÈTE - Module Écheances
 * ============================================
 *
 * ✅ FAIT:
 * - TypeDefs centralisés dans @clubmanager/types/graphql/echeances.graphql.types.ts
 * - Validators Zod centralisés dans @clubmanager/types/validators/echeances.validators.ts
 * - Resolvers GraphQL créés avec pattern standardisé (echeances.resolvers.ts)
 * - Middlewares appliqués: requireAuth, requireAdmin, withSentry
 * - Validation Zod intégrée
 * - Intégration dans api/src/graphql/schema.ts
 * - Package @clubmanager/types buildé et exports disponibles
 *
 * QUERIES DISPONIBLES:
 * - echeancesUtilisateur(utilisateurId: Int!, filters: EcheancesFiltersInput): [EcheanceDetail!]! (Auth)
 * - echeanceDetail(echeanceId: Int!): EcheanceDetail! (Auth)
 * - statistiquesEcheances(utilisateurId: Int!): StatistiquesEcheances! (Auth)
 * - diagnosticEcheance(echeanceId: Int!): DiagnosticEcheance! (Auth + Admin)
 * - echeancesHealth: HealthStatus!
 *
 * MUTATIONS DISPONIBLES:
 * - creerEcheance(input: CreateEcheanceInput!): EcheanceResult! (Auth + Admin)
 * - modifierEcheance(echeanceId: Int!, input: UpdateEcheanceInput!): EcheanceResult! (Auth + Admin)
 * - supprimerEcheance(echeanceId: Int!): DeleteEcheanceResult! (Auth + Admin)
 * - marquerEcheancePayee(echeanceId: Int!): EcheanceResult! (Auth + Admin)
 *
 * SÉCURITÉ:
 * - Authentification requise sur toutes les opérations sensibles (requireAuth)
 * - Droits admin requis pour gestion échéances (création, modification, suppression)
 * - Vérification utilisateur pour consultation données personnelles
 * - Observabilité Sentry activée
 * - Validation stricte des inputs Zod
 * - Filtres de recherche avancés (statut, dates, montants)
 *
 * FONCTIONNALITÉS:
 * - Gestion complète cycle de vie échéances
 * - Consultation échéances par utilisateur avec filtres
 * - Statistiques détaillées (taux paiement, montants, retards)
 * - Diagnostic échéances pour troubleshooting admin
 * - Marquage automatique échéances payées
 * - Calcul automatique jours de retard
 * - Support filtres multiples (statut, période, montant)
 *
 * ARCHITECTURE:
 * - Réutilisation service Écheances existant (services/echeances.service)
 * - Réutilisation client Paiements (db/clients/paiements)
 * - Pattern middleware standardisé
 * - Gestion erreurs cohérente (GraphQLErrors)
 * - Types TypeScript stricts
 * - Séparation queries/mutations
 *
 * TESTS À AJOUTER:
 * - Tests unitaires resolvers
 * - Tests validation Zod
 * - Tests middlewares auth/admin
 * - Tests filtres de recherche
 * - Tests statistiques
 * - Tests diagnostic
 * - Tests marquage paiement
 * - Tests calcul retards
 */

export * from "./echeances.resolvers.js";
