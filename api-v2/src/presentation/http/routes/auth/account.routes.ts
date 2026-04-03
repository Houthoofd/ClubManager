import { Router } from 'express';
import { AccountController } from '../../controllers/auth/index.js';
import { asyncHandler } from '../../middlewares/error.middleware.js';
import { verifyToken } from '../../../../middleware/auth.js';

/**
 * Routes pour le module Account (Gestion de compte)
 *
 * Base path: /api/account
 *
 * Routes disponibles:
 * - POST   /register          Créer un nouveau compte
 * - POST   /forgot-password   Demander un lien de réinitialisation
 * - POST   /reset-password    Réinitialiser le mot de passe
 * - POST   /change-password   Changer le mot de passe (authentifié)
 *
 * Note: La route /change-password nécessite une authentification
 */

/**
 * Crée le router avec toutes les routes de gestion de compte
 * @param accountController - Instance du AccountController avec ses dépendances injectées
 * @returns Router Express configuré
 */
export function createAccountRoutes(accountController: AccountController): Router {
  const router = Router();

  // ==================== ROUTES PUBLIQUES ====================

  /**
   * POST /account/register
   * Crée un nouveau compte utilisateur
   *
   * Body:
   * {
   *   email: string,
   *   password: string,
   *   firstName: string,
   *   lastName: string
   * }
   *
   * Réponse 201:
   * {
   *   success: true,
   *   message: "Compte créé avec succès",
   *   data: {
   *     user: {
   *       id: number,
   *       email: string,
   *       firstName: string,
   *       lastName: string,
   *       role: string
   *     }
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
   * Réponse 409:
   * {
   *   success: false,
   *   error: "Un compte avec cet email existe déjà",
   *   code: "EMAIL_ALREADY_EXISTS"
   * }
   */
  router.post(
    '/register',
    asyncHandler(accountController.register.bind(accountController))
  );

  /**
   * POST /account/forgot-password
   * Demande un lien de réinitialisation de mot de passe
   *
   * Body:
   * {
   *   email: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Si l'email existe, un lien de réinitialisation a été envoyé"
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Le champ email est obligatoire",
   *   code: "MISSING_REQUIRED_FIELD"
   * }
   *
   * Note: Pour des raisons de sécurité, cette route retourne toujours un succès
   * même si l'email n'existe pas dans la base de données
   */
  router.post(
    '/forgot-password',
    asyncHandler(accountController.requestPasswordReset.bind(accountController))
  );

  /**
   * POST /account/reset-password
   * Réinitialise le mot de passe avec un token de réinitialisation
   *
   * Body:
   * {
   *   token: string,
   *   newPassword: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Mot de passe réinitialisé avec succès"
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Les champs token et newPassword sont obligatoires",
   *   code: "MISSING_REQUIRED_FIELDS"
   * }
   *
   * Réponse 401:
   * {
   *   success: false,
   *   error: "Token de réinitialisation invalide ou expiré",
   *   code: "INVALID_RESET_TOKEN"
   * }
   */
  router.post(
    '/reset-password',
    asyncHandler(accountController.resetPassword.bind(accountController))
  );

  // ==================== ROUTES AUTHENTIFIÉES ====================

  /**
   * POST /account/change-password
   * Permet à un utilisateur authentifié de changer son mot de passe
   * Requiert: Authentification
   *
   * Headers:
   * - Authorization: Bearer <accessToken>
   *
   * Body:
   * {
   *   currentPassword: string,
   *   newPassword: string
   * }
   *
   * Réponse 200:
   * {
   *   success: true,
   *   message: "Mot de passe changé avec succès"
   * }
   *
   * Réponse 400:
   * {
   *   success: false,
   *   error: "Les champs currentPassword et newPassword sont obligatoires",
   *   code: "MISSING_REQUIRED_FIELDS"
   * }
   *
   * Réponse 401:
   * {
   *   success: false,
   *   error: "Mot de passe actuel incorrect",
   *   code: "INVALID_CURRENT_PASSWORD"
   * }
   */
  router.post(
    '/change-password',
    verifyToken,
    asyncHandler(accountController.changePassword.bind(accountController))
  );

  return router;
}

/**
 * Export par défaut pour une utilisation simple
 *
 * Exemple d'utilisation avec injection de dépendances:
 *
 * ```typescript
 * import { createAccountRoutes } from './routes/auth/account.routes.js';
 * import { createAccountController } from './controllers/auth/index.js';
 *
 * // Créer les use cases
 * const registerUseCase = new RegisterUseCase(...);
 * const changePasswordUseCase = new ChangePasswordUseCase(...);
 * const requestPasswordResetUseCase = new RequestPasswordResetUseCase(...);
 * const resetPasswordUseCase = new ResetPasswordUseCase(...);
 *
 * // Créer le controller
 * const accountController = createAccountController(
 *   registerUseCase,
 *   changePasswordUseCase,
 *   requestPasswordResetUseCase,
 *   resetPasswordUseCase
 * );
 *
 * // Créer les routes
 * const accountRoutes = createAccountRoutes(accountController);
 *
 * // Monter les routes dans l'application
 * app.use('/api/account', accountRoutes);
 * ```
 */
export default createAccountRoutes;
