/**
 * Index des resolvers du module Cours
 * ✅ Export centralisé des resolvers GraphQL
 *
 * @module cours/resolvers
 *
 * ============================================
 * MIGRATION GraphQL COMPLÈTE - Module Cours
 * ============================================
 *
 * ✅ FAIT:
 * - TypeDefs centralisés dans @clubmanager/types/graphql/cours.graphql.types.ts
 * - Validators Zod centralisés dans @clubmanager/types/validators/cours.validators.ts
 * - Resolvers GraphQL créés avec pattern standardisé (cours.resolvers.ts)
 * - Middlewares appliqués: requireAuth, requireAdmin, requireStaff, withSentry
 * - Validation Zod intégrée
 * - Intégration dans api/src/graphql/schema.ts
 * - Package @clubmanager/types buildé et exports disponibles
 *
 * QUERIES DISPONIBLES:
 * - tousLesCours: [CoursRecurrent!]! (Auth)
 * - planningCours: [PlanningJour!]! (Auth)
 * - coursUtilisateur(utilisateurId: Int!): [InscriptionCours!]! (Auth)
 * - participantsCours(coursId: Int!): ParticipantsCours! (Auth + Staff)
 * - inscriptionsUtilisateur(utilisateurId: Int!): [InscriptionCours!]! (Auth)
 * - statistiquesCours(coursId: Int!): StatistiquesCours! (Auth + Staff)
 *
 * MUTATIONS DISPONIBLES:
 * - ajouterCours(input: AjouterCoursInput!): AjouterCoursResult! (Auth + Admin)
 * - modifierCours(coursId: Int!, input: ModifierCoursInput!): AjouterCoursResult! (Auth + Admin)
 * - supprimerJourCours(coursId: Int!): AjouterCoursResult! (Auth + Admin)
 * - inscrireUtilisateur(input: InscrireUtilisateurInput!): InscrireUtilisateurResult! (Auth)
 * - desinscrireUtilisateur(input: DesinscrireUtilisateurInput!): DesinscrireUtilisateurResult! (Auth)
 * - validerPresence(input: PresenceInput!): PresenceResult! (Auth + Staff)
 * - annulerPresence(input: PresenceInput!): PresenceResult! (Auth + Staff)
 * - retirerProfesseur(input: RetirerProfesseurInput!): AjouterCoursResult! (Auth + Admin)
 *
 * SÉCURITÉ:
 * - Authentification requise sur toutes les opérations (requireAuth)
 * - Droits admin requis pour gestion cours (ajout, modification, suppression)
 * - Droits staff requis pour validation présences et statistiques
 * - Vérification utilisateur pour consultation/modification données personnelles
 * - Observabilité Sentry activée
 * - Validation stricte des inputs Zod
 * - Détection conflits d'horaires
 *
 * FONCTIONNALITÉS:
 * - Gestion complète planning cours récurrents
 * - Inscriptions/désinscriptions utilisateurs
 * - Validation présences par staff/admin
 * - Gestion professeurs affectés aux cours
 * - Statistiques de fréquentation
 * - Détection automatique conflits horaires
 * - Support planning par jour de semaine
 *
 * ARCHITECTURE:
 * - Réutilisation service Cours existant (db/clients/cours)
 * - Pattern middleware standardisé
 * - Gestion erreurs cohérente (GraphQLErrors)
 * - Types TypeScript stricts
 * - Séparation queries/mutations
 *
 * TESTS À AJOUTER:
 * - Tests unitaires resolvers
 * - Tests validation Zod
 * - Tests middlewares auth/admin/staff
 * - Tests conflits horaires
 * - Tests inscriptions/désinscriptions
 * - Tests validation présences
 * - Tests statistiques
 */

export * from "./cours.resolvers.js";
