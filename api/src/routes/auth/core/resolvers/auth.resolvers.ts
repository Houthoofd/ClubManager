/**
 * Resolvers GraphQL pour le module Auth
 * ✅ MODERNISÉ : Utilise combineMiddlewares + withSentry
 * - Pattern standardisé avec combineMiddlewares
 * - Monitoring Sentry sur tous les resolvers
 * - Rate limiting partagé
 * - Validation centralisée via @clubmanager/types
 */

import { GraphQLError } from "graphql";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedContext } from "@/shared/types/context.types.js";

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

// Validators centralisés
import {
  validerLogin,
  validerForgotPassword,
  validerResetPassword,
  validerVerifyToken,
  validerConfirmEmail,
} from "@clubmanager/types/validators";

// Configuration
import { TOKEN_CONFIG } from "../config/auth.config.js";

// Middlewares partagés
import {
  requireAuth,
  withLoginRateLimit,
  withPasswordResetRateLimit,
  combineMiddlewares,
  withSentry,
  ValidationError,
  AuthenticationError,
  InternalServerError,
  setCookie,
  clearCookie,
  type GraphQLContext,
} from "@/shared/index.js";

// Cookie helpers locaux
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  clearAllAuthCookies,
} from "../utils/cookie.helpers.js";

// Erreurs locales
import {
  InvalidCredentialsError,
  UnauthenticatedError,
  TokenInvalidError,
  TokenExpiredError,
  toAuthError,
} from "../errors/auth.errors.js";

export const createAuthResolvers = (prisma: PrismaClient) => ({
  Query: {
    /**
     * ✅ MODERNISÉ : Vérifier l'authentification de l'utilisateur
     * Middleware: requireAuth, withSentry
     */
    verifyAuth: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: unknown,
        _args: unknown,
        context: AuthenticatedContext,
      ) => {
        // requireAuth garantit que context.user existe
        console.log("✅ [Auth] Vérification auth pour:", context.user.email);

        return {
          success: true,
          user: context.user,
        };
      },
    ),

    /**
     * ✅ MODERNISÉ : Vérifier un token de reset
     * Middleware: withSentry seulement (public)
     */
    verifyResetToken: combineMiddlewares(withSentry)(
      async (
        _parent: unknown,
        { input }: { input: { token: string } },
        context: GraphQLContext,
      ) => {
        console.log("🔍 [Auth] Vérification token reset");

        // Validation
        const validation = validerVerifyToken(input);
        if (!validation.success) {
          console.warn("⚠️ [Auth] Token invalide:", validation.errors);
          return {
            valid: false,
            error: validation.errors?.[0] || "Token invalide",
          };
        }

        const { token } = validation.data!;

        // Vérifier le token
        const tokenData = await verifierTokenReset(token);

        if (!tokenData) {
          console.warn("⚠️ [Auth] Token non trouvé ou expiré");
          return {
            valid: false,
            error: "Token invalide ou expiré",
          };
        }

        console.log("✅ [Auth] Token valide pour:", tokenData.email);

        return {
          valid: true,
          email: tokenData.email,
          userName: `${tokenData.first_name} ${tokenData.last_name}`,
        };
      },
    ),

    /**
     * ✅ MODERNISÉ : Vérifier le statut d'authentification
     * Middleware: withSentry seulement (public)
     */
    checkAuthStatus: combineMiddlewares(withSentry)(
      async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
        console.log("🔍 [Auth] Vérification statut auth");

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
      },
    ),

    /**
     * ✅ MODERNISÉ : Confirmer l'email
     * Middleware: withSentry seulement (public)
     */
    confirmEmail: combineMiddlewares(withSentry)(
      async (
        _parent: unknown,
        { input }: { input: { token: string } },
        context: GraphQLContext,
      ) => {
        console.log("📧 [Auth] Confirmation email");

        // Validation
        const validation = validerConfirmEmail(input);
        if (!validation.success) {
          console.warn("⚠️ [Auth] Token invalide:", validation.errors);
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
          console.warn("⚠️ [Auth] Échec confirmation email");
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
      },
    ),

    /**
     * ✅ MODERNISÉ : Test d'authentification (pour debug)
     * Middleware: withSentry seulement (public)
     */
    testAuth: combineMiddlewares(withSentry)(
      async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
        console.log("🧪 [Auth] Test auth");

        return {
          success: true,
          message: "Auth module fonctionne correctement",
          timestamp: new Date().toISOString(),
        };
      },
    ),
  },

  Mutation: {
    /**
     * ✅ MODERNISÉ : Login avec rate limiting et Sentry
     * Middleware: withLoginRateLimit, withSentry
     */
    login: combineMiddlewares(
      withLoginRateLimit(),
      withSentry,
    )(
      async (
        _parent: unknown,
        { input }: { input: { email: string; password: string } },
        context: GraphQLContext,
      ) => {
        console.log("🔐 [Auth] Tentative login pour:", input.email);

        // Validation
        const validation = validerLogin(input);
        if (!validation.success) {
          console.warn(
            "⚠️ [Auth] Validation login échouée:",
            validation.errors,
          );
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
          console.warn("⚠️ [Auth] Échec authentification:", result.message);
          throw new InvalidCredentialsError(result.message);
        }

        // Définir le cookie d'authentification
        if (result.token) {
          setCookie(context.res, "token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            domain:
              process.env.NODE_ENV === "production"
                ? process.env.COOKIE_DOMAIN || "clubmanagment.com"
                : "localhost",
            maxAge: 15 * 60 * 1000, // 15 minutes in ms
          });

          console.log("✅ [Auth] Cookie défini pour:", email);
        }

        console.log("✅ [Auth] Login réussi pour:", email);

        return {
          success: true,
          message: result.message,
          user: result.user,
          token: result.token,
        };
      },
    ),

    /**
     * ✅ MODERNISÉ : Logout avec auth et Sentry
     * Middleware: requireAuth, withSentry
     */
    logout: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: unknown,
        _args: unknown,
        context: AuthenticatedContext,
      ) => {
        console.log("👋 [Auth] Déconnexion:", context.user.email);
        console.log(
          "🚪 [Auth] Déconnexion demandée pour utilisateur:",
          context.user?.id,
        );

        // Supprimer tous les cookies d'auth
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
            console.debug(
              "❌ [Auth] Erreur clearCookie (ignorée):",
              error.message,
            );
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

        console.log("✅ [Auth] Déconnexion terminée");

        return {
          success: true,
          message: "Déconnexion réussie",
          cookiesCleared: ["token", "refreshToken", "sessionId"],
          headersSet: 4,
        };
      },
    ),

    /**
     * ✅ MODERNISÉ : Forgot Password avec rate limiting et Sentry
     * Middleware: withPasswordResetRateLimit, withSentry
     */
    forgotPassword: combineMiddlewares(
      withPasswordResetRateLimit(),
      withSentry,
    )(
      async (
        _parent: unknown,
        { input }: { input: { email: string } },
        context: GraphQLContext,
      ) => {
        console.log(
          "🔄 [Auth] Demande réinitialisation mot de passe pour:",
          input.email,
        );

        // Validation
        const validation = validerForgotPassword(input);
        if (!validation.success) {
          console.warn(
            "⚠️ [Auth] Validation forgot password échouée:",
            validation.errors,
          );
          throw new ValidationError(
            validation.errors?.[0] || "Email invalide",
            validation.errors?.map((msg) => ({
              field: "email",
              message: msg,
            })),
          );
        }

        const { email } = validation.data!;

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
            console.log("✅ [Auth] Email de reset envoyé à:", email);
          }
        }

        // ✅ Toujours retourner le même message (sécurité)
        // Ne pas révéler si l'email existe ou non
        return {
          message:
            "Si cet email existe, vous recevrez un lien de réinitialisation",
        };
      },
    ),

    /**
     * ✅ MODERNISÉ : Reset Password avec rate limiting et Sentry
     * Middleware: withPasswordResetRateLimit, withSentry
     */
    resetPassword: combineMiddlewares(
      withPasswordResetRateLimit(),
      withSentry,
    )(
      async (
        _parent: unknown,
        { input }: { input: { token: string; newPassword: string } },
        context: GraphQLContext,
      ) => {
        console.log(
          "🔄 [Auth] Réinitialisation mot de passe avec token:",
          input.token.substring(0, 10) + "...",
        );

        // Validation
        const validation = validerResetPassword(input);
        if (!validation.success) {
          console.warn(
            "⚠️ [Auth] Validation reset password échouée:",
            validation.errors,
          );
          return {
            message: "",
            error: validation.errors?.[0] || "Données invalides",
          };
        }

        const { token, newPassword } = validation.data!;

        // Réinitialiser le mot de passe
        const result = await reinitialiserMotDePasse(token, newPassword);

        if (!result.success) {
          console.warn("⚠️ [Auth] Échec réinitialisation mot de passe");
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
      },
    ),

    /**
     * ✅ MODERNISÉ : Refresh Token avec auth et Sentry
     * Middleware: requireAuth, withSentry
     */
    refreshToken: combineMiddlewares(
      requireAuth,
      withSentry,
    )(async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      console.log(
        "🔄 [Auth] Rafraîchissement token pour utilisateur:",
        context.user?.id,
      );

      // requireAuth() garantit que context.user existe
      const user = context.user!;

      // Générer un nouveau token
      const newToken = genererToken({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status_id: user.status_id,
      });

      // Définir le nouveau cookie
      setCookie(context.res, "token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        domain:
          process.env.NODE_ENV === "production"
            ? process.env.COOKIE_DOMAIN || "clubmanagment.com"
            : "localhost",
        maxAge: TOKEN_CONFIG.ACCESS_TOKEN.expiresInMs,
      });

      console.log("✅ [Auth] Token rafraîchi pour utilisateur:", user.id);

      return {
        success: true,
        message: "Token rafraîchi avec succès",
        token: newToken,
        user: user,
      };
    }),
  },
});

// Export par défaut pour compatibilité
export const authResolvers = createAuthResolvers;
export default authResolvers;
