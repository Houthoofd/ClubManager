import { Router } from "express";
import { AuthController } from "../../controllers/auth/index.js";
import { asyncHandler } from "../../middlewares/error.middleware.js";
import { verifyToken } from "../../../../middleware/auth.js";

/**
 * Routes pour le module Auth
 *
 * Base path: /api/auth
 *
 * Routes disponibles:
 * - POST   /login    Connexion utilisateur
 * - POST   /refresh  Rafraîchir les tokens
 * - POST   /logout   Déconnexion utilisateur (authentifié)
 *
 * Note: La route /logout nécessite une authentification
 */

/**
 * Crée le router avec toutes les routes d'authentification
 * @param authController - Instance du AuthController avec ses dépendances injectées
 * @returns Router Express configuré
 */
export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  // ==================== ROUTES PUBLIQUES ====================

  /**
   * POST /auth/login
   * Authentifie un utilisateur et retourne les tokens d'accès
   *
   * Body:
   * {
   *   email: string,
   *   password: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Connexion réussie",
   *   data: {
   *     user: {
   *       id: number,
   *       email: string,
   *       firstName: string,
   *       lastName: string,
   *       role: string
   *     },
   *     accessToken: string,
   *     refreshToken: string
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Les champs email et password sont obligatoires",
   *   code: "MISSING_REQUIRED_FIELDS"
   * }
   *
   * Réponse 401:
   * {
   *   success: false,
   *   error: "Email ou mot de passe incorrect",
   *   code: "INVALID_CREDENTIALS"
   * }
   */
  router.post(
    "/login",
    asyncHandler(authController.login.bind(authController)),
  );

  /**
   * POST /auth/refresh
   * Rafraîchit les tokens d'accès en utilisant un refresh token valide
   *
   * Body:
   * {
   *   refreshToken: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Tokens rafraîchis avec succès",
   *   data: {
   *     accessToken: string,
   *     refreshToken: string
   *   }
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Le refresh token est requis",
   *   code: "MISSING_REFRESH_TOKEN"
   * }
   *
   * Réponse 401:
   * {
   *   success: false,
   *   error: "Refresh token invalide ou expiré",
   *   code: "INVALID_REFRESH_TOKEN"
   * }
   */
  router.post(
    "/refresh",
    asyncHandler(authController.refresh.bind(authController)),
  );

  // ==================== ROUTES AUTHENTIFIÉES ====================

  /**
   * POST /auth/logout
   * Déconnecte un utilisateur et révoque son refresh token
   * Requiert: Authentification
   *
   * Headers:
   * - Authorization: Bearer <accessToken>
   *
   * Body:
   * {
   *   refreshToken: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Déconnexion réussie"
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Le refresh token est requis",
   *   code: "MISSING_REFRESH_TOKEN"
   * }
   *
   * Réponse 401:
   * {
   *   success: false,
   *   error: "Utilisateur non authentifié",
   *   code: "NOT_AUTHENTICATED"
   * }
   */
  router.post(
    "/logout",
    verifyToken,
    asyncHandler(authController.logout.bind(authController)),
  );

  return router;
}

/**
 * Export par défaut pour une utilisation simple
 *
 * Exemple d'utilisation avec injection de dépendances:
 *
 * ```typescript
 * import { createAuthRoutes } from './routes/auth/auth.routes.js';
 * import { createAuthController } from './controllers/auth/index.js';
 *
 * // Créer les use cases
 * const loginUseCase = new LoginUseCase(...);
 * const logoutUseCase = new LogoutUseCase(...);
 * const refreshTokensUseCase = new RefreshTokensUseCase(...);
 *
 * // Créer le controller
 * const authController = createAuthController(
 *   loginUseCase,
 *   logoutUseCase,
 *   refreshTokensUseCase
 * );
 *
 * // Créer les routes
 * const authRoutes = createAuthRoutes(authController);
 *
 * // Monter les routes dans l'application
 * app.use('/api/auth', authRoutes);
 * ```
 */
export default createAuthRoutes;
