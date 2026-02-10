/**
 * MIGRATION GRAPHQL - MODULE COURS
 * ==================================
 * 
 * ✅ MIGRATION COMPLÈTE
 * 
 * Ce module a été migré vers GraphQL en suivant le pattern architectural
 * standardisé appliqué aux modules précédents.
 * 
 * FICHIERS CRÉÉS:
 * ---------------
 * 1. packages/types/src/graphql/cours.graphql.types.ts
 *    → TypeDefs GraphQL centralisés
 * 
 * 2. packages/types/src/validators/cours.validators.ts
 *    → Validators Zod centralisés
 * 
 * 3. api/src/routes/cours/core/resolvers/cours.resolvers.ts
 *    → Resolvers GraphQL avec middlewares
 * 
 * 4. api/src/routes/cours/core/resolvers/index.ts
 *    → Export centralisé des resolvers
 * 
 * INTÉGRATIONS:
 * -------------
 * - packages/types/src/graphql/index.ts (export coursTypeDefs)
 * - packages/types/src/validators/index.ts (export validators)
 * - packages/types/src/index.ts (export public avec renommage pour éviter conflits)
 * - api/src/graphql/schema.ts (intégration TypeDefs + resolvers)
 * 
 * API GRAPHQL DISPONIBLE:
 * -----------------------
 * 
 * Queries:
 *   tousLesCours: [CoursRecurrent!]!
 *   planningCours: [PlanningJour!]!
 *   coursUtilisateur(utilisateurId: Int!): [InscriptionCours!]!
 *   participantsCours(coursId: Int!): ParticipantsCours!
 *   inscriptionsUtilisateur(utilisateurId: Int!): [InscriptionCours!]!
 *   statistiquesCours(coursId: Int!): StatistiquesCours!
 * 
 * Mutations:
 *   ajouterCours(input: AjouterCoursInput!): AjouterCoursResult!
 *   modifierCours(coursId: Int!, input: ModifierCoursInput!): AjouterCoursResult!
 *   supprimerJourCours(coursId: Int!): AjouterCoursResult!
 *   inscrireUtilisateur(input: InscrireUtilisateurInput!): InscrireUtilisateurResult!
 *   desinscrireUtilisateur(input: DesinscrireUtilisateurInput!): DesinscrireUtilisateurResult!
 *   validerPresence(input: PresenceInput!): PresenceResult!
 *   annulerPresence(input: PresenceInput!): PresenceResult!
 *   retirerProfesseur(input: RetirerProfesseurInput!): AjouterCoursResult!
 * 
 * MIDDLEWARES APPLIQUÉS:
 * ----------------------
 * ✅ requireAuth - Authentification obligatoire (toutes les opérations)
 * ✅ requireAdmin - Droits admin (ajout, modification, suppression cours)
 * ✅ requireStaff - Droits staff/prof (validation présences, stats, participants)
 * ✅ withSentry - Observabilité et monitoring
 * ✅ Validation Zod - Validation stricte des inputs
 * 
 * SÉCURITÉ:
 * ---------
 * - Authentification requise sur toutes les routes
 * - Vérification droits admin pour gestion planning
 * - Vérification droits staff pour validation présences
 * - Contrôle accès données personnelles (utilisateur ou admin)
 * - Détection conflits horaires automatique
 * - Validation format heures (HH:MM)
 * - Validation jours semaine
 * - Protection contre inscriptions multiples
 * 
 * FONCTIONNALITÉS:
 * ----------------
 * - Gestion complète planning cours récurrents
 * - Affectation professeurs multiples par cours
 * - Inscriptions/désinscriptions utilisateurs
 * - Validation présences avec historique
 * - Statistiques fréquentation et taux présence
 * - Détection automatique conflits horaires
 * - Planning structuré par jour de semaine
 * - Gestion places maximum
 * - Liste participants par cours
 * 
 * RÉUTILISATION:
 * --------------
 * - Cours service (db/clients/cours)
 * - Méthodes existantes réutilisées
 * - Procédures stockées conservées
 * 
 * PATTERN APPLIQUÉ:
 * -----------------
 * Identique aux modules migrés précédemment:
 * 1. TypeDefs centralisés dans @clubmanager/types
 * 2. Validators Zod centralisés dans @clubmanager/types
 * 3. Resolvers avec middlewares partagés (auth, admin, staff, sentry)
 * 4. Réutilisation services existants
 * 5. Gestion erreurs cohérente (GraphQLErrors)
 * 6. Types TypeScript stricts
 * 7. Renommage exports pour éviter conflits
 * 
 * BUILD:
 * ------
 * Package @clubmanager/types buildé avec succès
 * Exports avec renommage pour éviter conflits:
 *   - coursInscrireUtilisateurInputSchema (au lieu de inscrireUtilisateurInputSchema)
 *   - coursUtilisateurIdSchema (au lieu de utilisateurIdSchema)
 *   - CoursInscrireUtilisateurInput (type renommé)
 * 
 * NEXT STEPS:
 * -----------
 * - Tests unitaires resolvers
 * - Tests validation Zod
 * - Tests middlewares auth/admin/staff
 * - Tests conflits horaires
 * - Tests inscriptions complètes
 * - Tests validation présences
 * - Tests statistiques
 * - Tests planning jour/semaine
 * - Migration frontend vers GraphQL
 * 
 * COMPATIBILITÉ:
 * --------------
 * Les routes REST existantes sont conservées pour compatibilité.
 * Migration progressive frontend possible.
 */

export const MIGRATION_STATUS = {
  module: 'cours',
  status: 'COMPLETE',
  date: '2024-02-10',
  graphqlReady: true,
  restDeprecated: false,
  testsRequired: true,
  middlewares: ['requireAuth', 'requireAdmin', 'requireStaff', 'withSentry'],
} as const;
