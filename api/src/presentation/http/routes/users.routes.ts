import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Routes pour le module User
 *
 * Base path: /api/users
 *
 * Routes disponibles:
 * - POST   /           Créer un nouvel utilisateur (inscription)
 * - GET    /           Lister tous les utilisateurs (pagination)
 * - GET    /me         Récupérer le profil de l'utilisateur connecté
 * - GET    /search     Rechercher des utilisateurs
 * - GET    /:id        Récupérer un utilisateur par ID
 * - PUT    /:id        Mettre à jour un utilisateur
 * - PATCH  /:id/activate  Activer un compte utilisateur
 * - DELETE /:id        Supprimer un utilisateur (soft delete)
 *
 * Note: Certaines routes nécessitent une authentification (middleware à ajouter)
 */

/**
 * Crée le router avec toutes les routes utilisateur
 * @param userController - Instance du UserController avec ses dépendances injectées
 * @returns Router Express configuré
 */
export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  // ==================== ROUTES PUBLIQUES ====================

  /**
   * POST /users
   * Créer un nouvel utilisateur (inscription)
   *
   * Body:
   * {
   *   email: string,
   *   password: string,
   *   nom: string,
   *   prenom: string,
   *   telephone?: string,
   *   dateNaissance?: string (ISO 8601),
   *   adresse?: string,
   *   codePostal?: string,
   *   ville?: string,
   *   requireParentalConsent?: boolean
   * }
   *
   * Réponse 201:
   * {
   *   success: true,
   *   message: "Utilisateur créé avec succès",
   *   data: {
   *     user: { ... },
   *     verificationToken: string
   *   }
   * }
   */
  router.post(
    '/',
    asyncHandler(userController.createUser.bind(userController))
  );

  // ==================== ROUTES AUTHENTIFIÉES ====================
  // Note: Ajouter un middleware d'authentification ici
  // router.use(authMiddleware);

  /**
   * GET /users/me
   * Récupérer le profil de l'utilisateur connecté
   * Requiert: Authentification
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: { id, email, nom, prenom, ... }
   * }
   */
  router.get(
    '/me',
    // authMiddleware, // À décommenter quand le middleware auth est prêt
    asyncHandler(userController.getCurrentUser.bind(userController))
  );

  /**
   * GET /users
   * Lister tous les utilisateurs avec pagination
   * Requiert: Authentification (optionnel selon les besoins)
   *
   * Query params:
   * - page?: number (défaut: 1)
   * - limit?: number (défaut: 20, max: 100)
   * - sortBy?: string (défaut: 'created_at')
   * - sortOrder?: 'ASC' | 'DESC' (défaut: 'DESC')
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: {
   *     users: [...],
   *     pagination: {
   *       page: number,
   *       limit: number,
   *       total: number,
   *       totalPages: number
   *     }
   *   }
   * }
   */
  router.get(
    '/',
    // authMiddleware, // À décommenter
    asyncHandler(userController.listUsers.bind(userController))
  );

  /**
   * GET /users/search
   * Rechercher des utilisateurs par nom, prénom ou email
   * Requiert: Authentification
   *
   * Query params:
   * - q: string (terme de recherche, min 2 caractères)
   * - page?: number
   * - limit?: number
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: {
   *     users: [...],
   *     pagination: { ... }
   *   }
   * }
   */
  router.get(
    '/search',
    // authMiddleware, // À décommenter
    asyncHandler(userController.searchUsers.bind(userController))
  );

  /**
   * GET /users/:id
   * Récupérer un utilisateur par son ID
   * Requiert: Authentification
   *
   * Permissions:
   * - L'utilisateur peut voir son propre profil complet
   * - Les autres voient une version publique
   * - Les admins voient tout
   *
   * Params:
   * - id: number
   *
   * Réponse 200:
   * {
   *   success: true,
   *   data: { id, email, nom, prenom, ... }
   * }
   *
   * Réponse 404:
   * {
   *   success: false,
   *   error: "L'utilisateur avec l'identifiant \"123\" n'existe pas",
   *   code: "USER_NOT_FOUND"
   * }
   */
  router.get(
    '/:id',
    // authMiddleware, // À décommenter
    asyncHandler(userController.getUserById.bind(userController))
  );

  /**
   * PUT /users/:id
   * Mettre à jour un utilisateur
   * Requiert: Authentification + Permissions
   *
   * Permissions:
   * - L'utilisateur peut modifier son propre profil
   * - Les admins peuvent modifier n'importe quel profil
   *
   * Params:
   * - id: number
   *
   * Body (tous optionnels):
   * {
   *   nom?: string,
   *   prenom?: string,
   *   telephone?: string,
   *   dateNaissance?: string (ISO 8601),
   *   adresse?: string,
   *   codePostal?: string,
   *   ville?: string,
   *   photoUrl?: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Utilisateur mis à jour avec succès",
   *   data: { ... }
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Vous n'avez pas les permissions pour modifier ce profil",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   */
  router.put(
    '/:id',
    // authMiddleware, // À décommenter
    asyncHandler(userController.updateUser.bind(userController))
  );

  // ==================== ROUTES ADMIN ====================
  // Note: Ajouter un middleware de vérification du rôle admin
  // router.use(requireAdminMiddleware);

  /**
   * PATCH /users/:id/activate
   * Activer un compte utilisateur
   * Requiert: Authentification + Rôle Admin
   *
   * Params:
   * - id: number
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Utilisateur activé avec succès"
   * }
   */
  router.patch(
    '/:id/activate',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(userController.activateUser.bind(userController))
  );

  /**
   * DELETE /users/:id
   * Supprimer un utilisateur (soft delete)
   * Requiert: Authentification + Rôle Admin
   *
   * Note: Cette opération marque l'utilisateur comme "deleted"
   * sans supprimer définitivement les données (conformité RGPD)
   *
   * Params:
   * - id: number
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Utilisateur supprimé avec succès"
   * }
   *
   * Réponse 403:
   * {
   *   success: false,
   *   error: "Seuls les administrateurs peuvent supprimer des utilisateurs",
   *   code: "INSUFFICIENT_PERMISSIONS"
   * }
   */
  router.delete(
    '/:id',
    // authMiddleware, // À décommenter
    // requireAdminMiddleware, // À décommenter
    asyncHandler(userController.deleteUser.bind(userController))
  );

  return router;
}

/**
 * Export par défaut pour une utilisation simple
 *
 * Exemple d'utilisation avec injection de dépendances:
 *
 * ```typescript
 * import { createUserRoutes } from './routes/users.routes.js';
 * import { createUserController } from './controllers/UserController.js';
 *
 * // Créer les use cases
 * const createUserUseCase = new CreateUserUseCase(...);
 * const getUserUseCase = new GetUserUseCase(...);
 * const updateUserUseCase = new UpdateUserUseCase(...);
 *
 * // Créer le controller
 * const userController = createUserController(
 *   createUserUseCase,
 *   getUserUseCase,
 *   updateUserUseCase
 * );
 *
 * // Créer les routes
 * const userRoutes = createUserRoutes(userController);
 *
 * // Monter les routes dans l'application
 * app.use('/api/users', userRoutes);
 * ```
 */
export default createUserRoutes;
