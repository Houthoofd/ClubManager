import { Request, Response, NextFunction } from "express";
import {
  RegisterUseCase,
  ChangePasswordUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from "../../../../core/use-cases/auth/index.js";
import { AuthError } from "../../../../core/domain/errors/auth/AuthError.js";

/**
 * AccountController
 *
 * Responsabilités :
 * - Gérer les endpoints de gestion de compte (inscription, changement de mot de passe, réinitialisation)
 * - Valider les données d'entrée
 * - Appeler les use cases appropriés
 * - Retourner les réponses avec les codes HTTP appropriés
 *
 * Ce controller ne contient PAS de logique métier.
 * Toute la logique est déléguée aux use cases.
 */
export class AccountController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  /**
   * POST /auth/register
   * Crée un nouveau compte utilisateur
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Extraire les données de la requête
      const { email, password, firstName, lastName } = req.body;

      // 2. Validation basique
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Les champs email et password sont obligatoires",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      if (!firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: "Les champs firstName et lastName sont obligatoires",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      // 3. Appeler le use case
      const result = await this.registerUseCase.execute({
        email,
        password,
        firstName,
        lastName,
      });

      // 4. Retourner la réponse
      res.status(201).json({
        success: true,
        message: "Compte créé avec succès",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      // Gérer les erreurs AuthError avec les codes HTTP appropriés
      if (AuthError.isAuthError(error)) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /auth/change-password
   * Permet à un utilisateur authentifié de changer son mot de passe
   * Requiert : Authentification
   */
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Récupérer l'ID de l'utilisateur connecté
      const userId = this.getCurrentUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Utilisateur non authentifié",
          code: "NOT_AUTHENTICATED",
        });
        return;
      }

      // 2. Extraire les données de la requête
      const { currentPassword, newPassword } = req.body;

      // 3. Validation basique
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: "Les champs currentPassword et newPassword sont obligatoires",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      // 4. Appeler le use case
      const result = await this.changePasswordUseCase.execute({
        userId,
        currentPassword,
        newPassword,
      });

      // 5. Retourner la réponse
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      // Gérer les erreurs AuthError avec les codes HTTP appropriés
      if (AuthError.isAuthError(error)) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /auth/forgot-password
   * Demande un lien de réinitialisation de mot de passe
   */
  async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Extraire les données de la requête
      const { email } = req.body;

      // 2. Validation basique
      if (!email) {
        res.status(400).json({
          success: false,
          error: "Le champ email est obligatoire",
          code: "MISSING_REQUIRED_FIELD",
        });
        return;
      }

      // 3. Appeler le use case
      const result = await this.requestPasswordResetUseCase.execute({
        email,
      });

      // 4. Retourner la réponse
      // Note : On retourne toujours un succès même si l'email n'existe pas
      // pour des raisons de sécurité (ne pas révéler si un email est enregistré)
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      // Gérer les erreurs AuthError avec les codes HTTP appropriés
      if (AuthError.isAuthError(error)) {
        // Pour les requêtes de réinitialisation, on retourne toujours 200
        // même en cas d'erreur pour ne pas révéler l'existence d'un email
        res.status(200).json({
          success: true,
          message:
            "Si l'email existe, un lien de réinitialisation a été envoyé",
        });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /auth/reset-password
   * Réinitialise le mot de passe avec un token de réinitialisation
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Extraire les données de la requête
      const { token, newPassword } = req.body;

      // 2. Validation basique
      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: "Les champs token et newPassword sont obligatoires",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      // 3. Appeler le use case
      const result = await this.resetPasswordUseCase.execute({
        token,
        newPassword,
      });

      // 4. Retourner la réponse
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      // Gérer les erreurs AuthError avec les codes HTTP appropriés
      if (AuthError.isAuthError(error)) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }
      next(error);
    }
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Récupère l'ID de l'utilisateur connecté depuis le token JWT
   */
  private getCurrentUserId(req: Request): number | null {
    const user = (req as any).user;
    return user?.id || null;
  }
}

/**
 * Fonction factory pour créer une instance du controller avec les dépendances
 * Cette fonction sera utilisée lors de la configuration de l'injection de dépendances
 */
export function createAccountController(
  registerUseCase: RegisterUseCase,
  changePasswordUseCase: ChangePasswordUseCase,
  requestPasswordResetUseCase: RequestPasswordResetUseCase,
  resetPasswordUseCase: ResetPasswordUseCase,
): AccountController {
  return new AccountController(
    registerUseCase,
    changePasswordUseCase,
    requestPasswordResetUseCase,
    resetPasswordUseCase,
  );
}
