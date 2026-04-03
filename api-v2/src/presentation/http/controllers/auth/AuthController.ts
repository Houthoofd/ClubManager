import { Request, Response, NextFunction } from "express";
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshTokensUseCase,
} from "../../../../core/use-cases/auth/index.js";
import { AuthError } from "../../../../core/domain/errors/auth/AuthError.js";

/**
 * AuthController
 *
 * Responsabilités :
 * - Gérer les endpoints d'authentification (login, logout, refresh)
 * - Valider les données d'entrée
 * - Extraire les métadonnées de la requête (IP, User-Agent)
 * - Gérer les cookies httpOnly pour les tokens en production
 * - Appeler les use cases appropriés
 * - Retourner les réponses avec les codes HTTP appropriés
 *
 * Ce controller ne contient PAS de logique métier.
 * Toute la logique est déléguée aux use cases.
 */
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
  ) {}

  /**
   * POST /auth/login
   * Authentifie un utilisateur et retourne les tokens d'accès
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Extraire les données de la requête
      const { email, password } = req.body;

      // 2. Validation basique
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Les champs email et password sont obligatoires",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      // 3. Extraire les métadonnées de la requête
      const ipAddress = this.getIpAddress(req);
      const userAgent = this.getUserAgent(req);

      // 4. Appeler le use case
      const result = await this.loginUseCase.execute({
        email,
        password,
        ipAddress,
        userAgent,
      });

      // 5. En production, définir les cookies httpOnly pour les tokens
      if (
        process.env.NODE_ENV === "production" &&
        result.accessToken &&
        result.refreshToken
      ) {
        this.setTokenCookies(res, result.accessToken, result.refreshToken);
      }

      // 6. Retourner la réponse
      res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
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
   * POST /auth/logout
   * Déconnecte un utilisateur et révoque son refresh token
   * Requiert : Authentification
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // 2. Extraire le refresh token
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: "Le refresh token est requis",
          code: "MISSING_REFRESH_TOKEN",
        });
        return;
      }

      // 3. Appeler le use case
      await this.logoutUseCase.execute({
        userId,
        refreshToken,
      });

      // 4. Nettoyer les cookies en production
      if (process.env.NODE_ENV === "production") {
        this.clearTokenCookies(res);
      }

      // 5. Retourner la réponse
      res.status(200).json({
        success: true,
        message: "Déconnexion réussie",
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
   * POST /auth/refresh
   * Rafraîchit les tokens d'accès en utilisant un refresh token valide
   */
  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Extraire le refresh token
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      // 2. Validation
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: "Le refresh token est requis",
          code: "MISSING_REFRESH_TOKEN",
        });
        return;
      }

      // 3. Extraire les métadonnées de la requête
      const ipAddress = this.getIpAddress(req);
      const userAgent = this.getUserAgent(req);

      // 4. Appeler le use case
      const result = await this.refreshTokensUseCase.execute({
        refreshToken,
        ipAddress,
        userAgent,
      });

      // 5. En production, mettre à jour les cookies httpOnly
      if (
        process.env.NODE_ENV === "production" &&
        result.accessToken &&
        result.refreshToken
      ) {
        this.setTokenCookies(res, result.accessToken, result.refreshToken);
      }

      // 6. Retourner la réponse
      res.status(200).json({
        success: true,
        message: "Tokens rafraîchis avec succès",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
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

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Récupère l'ID de l'utilisateur connecté depuis le token JWT
   */
  private getCurrentUserId(req: Request): number | null {
    const user = (req as any).user;
    return user?.id || null;
  }

  /**
   * Extrait l'adresse IP de la requête
   */
  private getIpAddress(req: Request): string {
    // Vérifier les headers de proxy
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      const ips =
        typeof forwarded === "string" ? forwarded.split(",") : forwarded;
      return Array.isArray(ips) ? ips[0].trim() : ips.toString().trim();
    }

    // Fallback sur req.ip
    return req.ip || "unknown";
  }

  /**
   * Extrait le User-Agent de la requête
   */
  private getUserAgent(req: Request): string {
    return req.headers["user-agent"] || "unknown";
  }

  /**
   * Définit les cookies httpOnly pour les tokens (production uniquement)
   */
  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    // Cookie pour l'access token (durée courte)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true, // HTTPS uniquement
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Cookie pour le refresh token (durée longue)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS uniquement
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });
  }

  /**
   * Nettoie les cookies de tokens
   */
  private clearTokenCookies(res: Response): void {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
  }
}

/**
 * Fonction factory pour créer une instance du controller avec les dépendances
 * Cette fonction sera utilisée lors de la configuration de l'injection de dépendances
 */
export function createAuthController(
  loginUseCase: LoginUseCase,
  logoutUseCase: LogoutUseCase,
  refreshTokensUseCase: RefreshTokensUseCase,
): AuthController {
  return new AuthController(loginUseCase, logoutUseCase, refreshTokensUseCase);
}
