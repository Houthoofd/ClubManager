/**
 * ================================================================================
 * STRUCTURE DU MODULE AUTH - ARCHITECTURE GRAPHQL
 * ================================================================================
 *
 * Ce module suit l'architecture modulaire avec séparation des responsabilités :
 * - Services : Logique métier
 * - Validators : Validation des données
 * - Resolvers : Interface GraphQL
 * - Handlers : [DEPRECATED] Anciens handlers REST
 *
 * ================================================================================
 * ARBORESCENCE
 * ================================================================================
 *
 * auth/
 * ├── core/
 * │   ├── services/              [NEW - Logique métier]
 * │   │   └── auth.service.ts
 * │   ├── validators/            [NEW - Validation Zod]
 * │   │   └── auth.schema.ts
 * │   ├── resolvers/             [NEW - GraphQL]
 * │   │   ├── auth.resolvers.ts
 * │   │   ├── auth.typeDefs.ts
 * │   │   └── index.ts
 * │   ├── handlers/              [DEPRECATED - REST]
 * │   │   └── ...
 * │   └── index.ts
 * ├── __tests__/
 * │   └── auth.graphql.test.ts
 * ├── auth.routes.ts             [DEPRECATED - À supprimer après migration]
 * ├── index.ts                   [Exporte GraphQL]
 * ├── STRUCTURE.js               [Ce fichier]
 * ├── README_GRAPHQL.txt         [Documentation]
 * └── INTEGRATION_EXAMPLE.ts     [Exemple d'intégration]
 *
 * ================================================================================
 * SERVICES (core/services/auth.service.ts)
 * ================================================================================
 *
 * Contient toute la logique métier pour l'authentification :
 *
 * Fonctions exportées :
 * - authentifierUtilisateur(email, password) : Authentifier un utilisateur
 * - verifierTokenReset(token) : Vérifier un token de réinitialisation
 * - demanderResetMotDePasse(email) : Demander un reset de mot de passe
 * - envoyerEmailResetMotDePasse(email, prenom, token) : Envoyer l'email de reset
 * - reinitialiserMotDePasse(token, newPassword) : Réinitialiser le mot de passe
 * - verifierTokenValidation(token, userId) : Vérifier un token de validation email
 * - confirmerEmail(userId) : Confirmer l'email d'un utilisateur
 * - emailExiste(email) : Vérifier si un email existe
 * - rechercherUtilisateurParEmail(email) : Rechercher un utilisateur par email
 * - genererToken(userData) : Générer un JWT
 *
 * Principe :
 * - Toutes les interactions avec Auth client passent par ces services
 * - Les resolvers appellent ces services au lieu d'instancier directement Auth
 * - Facilite les tests (mock des services)
 * - Centralise la logique métier
 *
 * ================================================================================
 * VALIDATORS (core/validators/auth.schema.ts)
 * ================================================================================
 *
 * Validation des données d'entrée avec Zod :
 *
 * Schémas disponibles :
 * - loginSchema : Validation email + password
 * - forgotPasswordSchema : Validation email
 * - resetPasswordSchema : Validation token + newPassword
 * - verifyTokenSchema : Validation token
 * - confirmEmailSchema : Validation token + userId
 *
 * Fonctions de validation :
 * - validerLogin(data) : Valide les données de connexion
 * - validerForgotPassword(data) : Valide l'email pour reset
 * - validerResetPassword(data) : Valide les données de reset
 * - validerVerifyToken(data) : Valide le token
 * - validerConfirmEmail(data) : Valide token + userId
 *
 * Retour : { success: boolean, data?: T, errors?: string[] }
 *
 * ================================================================================
 * RESOLVERS (core/resolvers/auth.resolvers.ts)
 * ================================================================================
 *
 * Interface GraphQL qui utilise les services :
 *
 * Queries :
 * - verifyAuth : Vérifier l'authentification
 * - verifyResetToken : Vérifier un token de reset
 * - checkAuthStatus : Vérifier le statut d'authentification
 * - confirmEmail : Confirmer l'email
 * - testAuth : Test du module
 *
 * Mutations :
 * - login : Connexion utilisateur
 * - logout : Déconnexion utilisateur
 * - forgotPassword : Demande de réinitialisation
 * - resetPassword : Réinitialiser le mot de passe
 * - refreshToken : Rafraîchir le token JWT
 *
 * Pattern de chaque resolver :
 * 1. Valider les données d'entrée (validators)
 * 2. Appeler le service correspondant (services)
 * 3. Gérer les cookies si nécessaire (helpers)
 * 4. Retourner le résultat ou lever une GraphQLError
 *
 * ================================================================================
 * TYPEDEFS (core/resolvers/auth.typeDefs.ts)
 * ================================================================================
 *
 * Définitions des types GraphQL :
 *
 * Types :
 * - User : Utilisateur authentifié
 * - AuthPayload : Résultat de connexion
 * - LogoutResult : Résultat de déconnexion
 * - VerifyAuthResult : Résultat de vérification auth
 * - ForgotPasswordResult : Résultat de demande de reset
 * - VerifyTokenResult : Résultat de vérification de token
 * - ResetPasswordResult : Résultat de reset de mot de passe
 * - RefreshTokenResult : Résultat de rafraîchissement de token
 * - StatusResult : Résultat de statut d'authentification
 * - ConfirmEmailResult : Résultat de confirmation d'email
 * - TestResult : Résultat de test
 *
 * Inputs :
 * - LoginInput : Données de connexion
 * - ForgotPasswordInput : Email pour reset
 * - ResetPasswordInput : Token + nouveau mot de passe
 * - ConfirmEmailInput : Token + userId
 *
 * ================================================================================
 * FLUX DE DONNÉES
 * ================================================================================
 *
 * EXEMPLE : Connexion utilisateur
 *
 * Client GraphQL
 *    ↓
 * Mutation login (auth.resolvers.ts)
 *    ↓
 * 1. validerLogin() (auth.schema.ts)
 *    → Validation Zod de email + password
 *    ↓
 * 2. authentifierUtilisateur() (auth.service.ts)
 *    → Appel Auth client
 *    → Vérification credentials
 *    → Génération JWT
 *    ↓
 * 3. setCookie() (helper dans resolver)
 *    → Définir cookie httpOnly
 *    ↓
 * 4. Retour AuthPayload
 *    → { success, message, user, token }
 *
 * ================================================================================
 * GESTION DES COOKIES
 * ================================================================================
 *
 * Les resolvers utilisent des helpers pour gérer les cookies :
 *
 * - setCookie(context, name, value, options)
 *   → Définit un cookie via context.res
 *
 * - clearCookie(context, name, options)
 *   → Supprime un cookie via context.res
 *
 * - setHeader(context, name, value)
 *   → Définit un header via context.res
 *
 * Configuration des cookies :
 * - httpOnly: true (protection XSS)
 * - secure: true en production (HTTPS)
 * - sameSite: 'strict' en production, 'lax' en dev
 * - domain: 'clubmanagment.com' en prod, 'localhost' en dev
 * - maxAge: 24h
 *
 * ================================================================================
 * TESTS
 * ================================================================================
 *
 * __tests__/auth.graphql.test.ts :
 * - Tests unitaires de tous les resolvers
 * - Mock des services
 * - Mock du contexte (prisma, user, req, res)
 * - Couverture complète des cas d'erreur
 *
 * Commande : npm test -- auth.graphql
 *
 * ================================================================================
 * MIGRATION DEPUIS REST
 * ================================================================================
 *
 * Anciennes routes REST (handlers/) → Nouveaux resolvers GraphQL
 *
 * Les services encapsulent la logique qui était dans les handlers
 * Les validators remplacent la validation manuelle
 * Les resolvers remplacent les routes Express
 *
 * Avantages :
 * - Code plus testable (services isolés)
 * - Validation forte avec Zod
 * - Typage GraphQL complet
 * - Séparation claire des responsabilités
 * - Réutilisabilité des services
 *
 * ================================================================================
 * INTÉGRATION
 * ================================================================================
 *
 * Pour intégrer ce module dans le schéma GraphQL principal :
 *
 * import { authResolvers, authTypeDefs } from './routes/auth/index.js';
 *
 * const typeDefs = [baseTypeDefs, authTypeDefs, ...];
 *
 * const resolvers = {
 *   Query: {
 *     ...authResolvers(prisma).Query,
 *   },
 *   Mutation: {
 *     ...authResolvers(pris