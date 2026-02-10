/**
 * Resolvers GraphQL pour le module Auth
 * ✅ MIGRÉ : Utilise les middlewares partagés depuis @shared
 * - Configuration centralisée
 * - Cookie helpers
 * - Rate limiting partagé
 * - Erreurs GraphQL standardisées
 * - Auth middleware partagé
 */

import { GraphQLError } from "graphql";
import { PrismaClient } from "@prisma/client";

// Services
import {
  authentifierUtilisateur,
  verifierTokenReset,
  demanderResetMotDePasse,
  envoyerEmailResetMotDePasse,
  reinitialiserMotDePasse,
  verifierTokenValidation,
  confirmerEmail,
  genererToken,
  rechercherUtilisateurParEmail,
} from "../services/auth.service.js";

// Validators
import {
  validerLogin,
  validerForgotPassword,
  validerResetPassword,
  validerVerifyToken,
  validerConfirmEmail,
} from "@clubmanager/types/dist/validators.js";

// ✅ NOUVEAU : Middlewares partagés depuis @shared
import {
  requireAuth,
  withLoginRateLimit,
  withPasswordResetRateLimit,
  ValidationError,
  AuthenticationError,
  InternalServerError,
  setCookie,
  clearCookie,
  type GraphQLContext,
} from "../../../../shared/index.js";

// Cookie helpers locaux (si non disponibles dans shared)
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  clearAllAuthCookies,
} from "../utils/cookie.helpers.js";

// ✅ Erreurs locales (à terme, migrer vers @shared)
import {
  InvalidCredentialsError,
  UnauthenticatedError,
  TokenInvalidError,
  TokenExpiredError,
  toAuthError,
} from "../errors/auth.errors.js";

// ✅ Configuration locale
import { TOKEN_CONFIG } from "../config/auth.config.js";

interface Context extends GraphQLContext {
  prisma: PrismaClient;
}

export const authResolvers = (prisma: PrismaClient) => ({
  Query: {
    /**
     * ✅ MIGRÉ : Vérifier l'authentification de l'utilisateur
     */
    verifyAuth: requireAuth(async (_: any, __: any, context: any) => {
      // requireAuth garantit que context.user existe
      return {
        success: true,
        user: context.user!,
      };
    }) as any,

    /**
     * ✅ MIGRÉ : Vérifier un token de reset
     */
    verifyResetToken: async (
      _: any,
      { input }: { input: { token: string } },
      context: Context,
    ) => {
      try {
        // Validation
        const validation = validerVerifyToken(input);
        if (!validation.success) {
          return {
            valid: false,
            error: validation.errors?.[0] || "Token invalide",
          };
        }

        const { token } = validation.data!;

        // Vérifier le token
        const tokenData = await verifierTokenReset(token);

        if (!tokenData) {
          return {
            valid: false,
            error: "Token invalide ou expiré",
          };
        }

        return {
          valid: true,
          email: tokenData.email,
          userName: `${tokenData.first_name} ${tokenData.last_name}`,
        };
      } catch (error: any) {
        console.error("❌ [Auth] Erreur verify-reset-token:", error);
        return {
          valid: false,
          error: "Erreur lors de la vérification du token",
        };
      }
    },

    /**
     * ✅ MIGRÉ : Vérifier le statut d'authentification
     */
    checkAuthStatus: async (_: any, __: any, context: Context) => {
      try {
        if (!context.user) {
          return {
            authenticated: false,
            message: "Non authentifié",
          };
        }

        return {
          authenticated: true,
          user: context.user,
        };
      } catch (error: any) {
        console.error("❌ [Auth] Erreur check-auth-status:", error);
        throw new GraphQLError("Erreur serveur", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    /**
     * ✅ MIGRÉ : Confirmer l'email (sans rate limiting pour l'instant)
     */
    confirmEmail: async (
      _: any,
      { input }: { input: { token: string } },
      context: Context,
    ) => {
      try {
        // Validation
        const validation = validerConfirmEmail(input);
        if (!validation.success) {
          return {
            success: false,
            message: validation.errors?.[0] || "Token invalide",
            redirect_to: "/auth/login",
          };
        }

        const { token } = validation.data!;

        // Confirmer l'email avec le token
        const result = await confirmerEmail(token as any);

        if (!result.success) {
          return {
            success: false,
            message:
              result.message || "Erreur lors de la confirmation de l'email",
            redirect_to: "/auth/login",
          };
        }

        console.log("✅ [Auth] Email confirmé avec succès");

        return {
          success: true,
          message: result.message || "Email confirmé avec succès",
          redirect_to: "/auth/login?verified=true",
        };
      } catch (error: any) {
        console.error("❌ [Auth] Erreur confirm-email:", error);
        return {
          success: false,
          message: "Erreur lors de la confirmation de l'email",
          redirect_to: "/auth/login",
        };
      }
    },

    /**
     * ✅ NOUVEAU : Test d'authentification (pour debug)
     */
    testAuth: async (_: any, __: any, context: Context) => {
      return {
        success: true,
        message: "Auth module fonctionne correctement",
        timestamp: new Date().toISOString(),
      };
    },
  },

  Mutation: {
    /**
     * ✅ MIGRÉ : Login avec rate limiting partagé
     */
    login: withLoginRateLimit(
      async (
        _: any,
        { input }: { input: { email: string; password: string } },
        context: Context,
      ) => {
        try {
          // Validation
          const validation = validerLogin(input);
          if (!validation.success) {
            throw new ValidationError(
              validation.errors?.[0] || "Données invalides",
              validation.errors?.map((msg) => ({
                field: "input",
                message: msg,
              })),
            );
          }

          const { email, password } = validation.data!;

          // Authentifier
          const result = await authentifierUtilisateur(email, password);

          if (!result.success) {
            throw new InvalidCredentialsError(result.message);
          }

          // ✅ Utiliser le cookie helper partagé
          if (result.token) {
            setCookie(context.res, "token", result.token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite:
                process.env.NODE_ENV === "production" ? "strict" : "lax",
              domain:
                process.env.NODE_ENV === "production"
                  ? process.env.COOKIE_DOMAIN || "clubmanagment.com"
                  : "localhost",
              maxAge: TOKEN_CONFIG.access.expiresInMs,
            });
          }

          console.log("✅ [Auth] Login réussi pour:", email);

          return {
            success: true,
            message: result.message,
            user: result.user,
            token: result.token,
          };
        } catch (error: any) {
          console.error("❌ [Auth] Erreur lors de la connexion:", error);
          throw toAuthError(error);
        }
      },
    ),

    /**
     * ✅ MIGRÉ : Logout avec cookie helpers
     */
    logout: requireAuth(async (_: any, __: any, context: any) => {
      try {
        console.log(
          "🚪 Déconnexion demandée pour utilisateur:",
          context.user?.id,
        );

        // ✅ Utiliser le helper pour supprimer tous les cookies d'auth
        clearAllAuthCookies(context.res);

        // Supprimer aussi le cookie "token" (custom)
        const cookieVariants = [
          {
            httpOnly: true,
            secure: true,
            sameSite: "strict" as const,
            domain: "clubmanagment.com",
            path: "/",
          },
          {
            httpOnly: true,
            secure: false,
            sameSite: "lax" as const,
            domain: "localhost",
            path: "/",
          },
          {
            httpOnly: true,
            secure: false,
            sameSite: "lax" as const,
            path: "/",
          },
          { httpOnly: true, path: "/" },
          { path: "/" },
        ];

        // Supprimer le cookie "token" avec toutes les variantes
        cookieVariants.forEach((variant) => {
          try {
            if (context.res && typeof context.res.clearCookie === "function") {
              context.res.clearCookie("token", variant);
            }
          } catch (error: any) {
            // Ignorer les erreurs silencieusement
          }
        });

        // Headers de sécurité additionnels
        if (context.res && typeof context.res.setHeader === "function") {
          context.res.setHeader("Clear-Site-Data", '"cookies", "storage"');
          context.res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate",
          );
          context.res.setHeader("Pragma", "no-cache");
          context.res.setHeader("Expires", "0");
        }

        console.log("✅ [Logout] Déconnexion terminée");

        return {
          success: true,
          message: "Déconnexion réussie",
          cookiesCleared: ["token", "refreshToken", "sessionId"],
          headersSet: 4,
        };
      } catch (error: any) {
        console.error("❌ [Logout] Erreur lors de la déconnexion:", error);
        throw toAuthError(error);
      }
    }) as any,

    /**
     * ✅ MIGRÉ : Forgot Password avec rate limiting partagé
     */
    forgotPassword: withPasswordResetRateLimit(
      async (
        _: any,
        { input }: { input: { email: string } },
        context: Context,
      ) => {
        try {
          // Validation
          const validation = validerForgotPassword(input);
          if (!validation.success) {
            throw new ValidationError(
              validation.errors?.[0] || "Email invalide",
              validation.errors?.map((msg) => ({
                field: "email",
                message: msg,
              })),
            );
          }

          const { email } = validation.data!;

          console.log(
            "🔄 [Auth] Demande réinitialisation mot de passe pour:",
            email,
          );

          // Demander le reset
          const result = await demanderResetMotDePasse(email);

          // Envoyer l'email si un token a été généré
          if (result.token) {
            const user = await rechercherUtilisateurParEmail(email);

            if (user) {
              await envoyerEmailResetMotDePasse(
                email,
                user.first_name,
                result.token,
              );
            }
          }

          // ✅ Toujours retourner le même message (sécurité)
          // Ne pas révéler si l'email existe ou non
          return {
            message:
              "Si cet email existe, vous recevrez un lien de réinitialisation",
          };
        } catch (error: any) {
          console.error("❌ [Auth] Erreur forgot-password:", error);
          throw toAuthError(error);
        }
      },
    ),

    /**
     * ✅ MIGRÉ : Reset Password avec rate limiting partagé
     */
    resetPassword: withPasswordResetRateLimit(
      async (
        _: any,
        { input }: { input: { token: string; newPassword: string } },
        context: Context,
      ) => {
        try {
          // Validation
          const validation = validerResetPassword(input);
          if (!validation.success) {
            return {
              message: "",
              error: validation.errors?.[0] || "Données invalides",
            };
          }

          const { token, newPassword } = validation.data!;

          console.log(
            "🔄 [Auth] Réinitialisation mot de passe avec token:",
            token.substring(0, 10) + "...",
          );

          // Réinitialiser le mot de passe
          const result = await reinitialiserMotDePasse(token, newPassword);

          if (!result.success) {
            return {
              message: "",
              error: result.message || result.errors?.join(", "),
            };
          }

          console.log("✅ [Auth] Mot de passe réinitialisé avec succès");

          return {
            message: result.message || "Mot de passe réinitialisé avec succès",
            error: null,
          };
        } catch (error: any) {
          console.error("❌ [Auth] Erreur reset-password:", error);
          return {
            message: "",
            error: "Erreur lors de la réinitialisation du mot de passe",
          };
        }
      },
    ),

    /**
     * ✅ MIGRÉ : Refresh Token avec auth partagée
     */
    refreshToken: requireAuth(async (_: any, __: any, context: Context) => {
      try {
        // requireAuth() garantit que context.user existe
        const user = context.user!;

        // Générer un nouveau token
        const newToken = genererToken({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          status_id: user.status_id,
          role: user.role,
          status: user.status,
        });

        // ✅ Définir le nouveau cookie avec helper
        setCookie(context.res, "token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          domain:
            process.env.NODE_ENV === "production"
              ? process.env.COOKIE_DOMAIN || "clubmanagment.com"
              : "localhost",
          maxAge: TOKEN_CONFIG.access.expiresInMs,
        });

        console.log("✅ [Auth] Token rafraîchi pour utilisateur:", user.id);

        return {
          success: true,
          message: "Token rafraîchi avec succès",
          token: newToken,
          user: user,
        };
      } catch (error: any) {
        console.error("❌ [Auth] Erreur refresh-token:", error);
        throw toAuthError(error);
      }
    }) as any,
  },
});

export default authResolvers;
