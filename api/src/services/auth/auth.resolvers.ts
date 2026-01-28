/**
 * Resolvers GraphQL pour l'authentification
 */

import { authService } from "./auth.service.js";

export const authResolvers = {
  Query: {
    // Vérifier si un email existe
    checkEmail: async (_: any, { email }: { email: string }) => {
      return authService.verifierEmail(email);
    },

    // Obtenir les infos de sécurité d'un utilisateur
    securityInfo: async (_: any, { userId }: { userId: number }) => {
      return authService.obtenirInformationsSecurite(userId);
    },

    // Obtenir les statistiques d'authentification
    authStats: async () => {
      return authService.obtenirStatistiques();
    },

    // Vérifier un token de récupération
    verifyResetToken: async (_: any, { token }: { token: string }) => {
      return authService.verifierTokenRecuperation(token);
    },
  },

  Mutation: {
    // Authentifier un utilisateur
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      context: any,
    ) => {
      const metadata = {
        ipAddress: context.request?.ip || context.req?.ip,
        userAgent:
          context.request?.headers?.get("user-agent") ||
          context.req?.get("user-agent"),
      };
      return authService.authentifier(email, password, metadata);
    },

    // Créer un compte
    register: async (_: any, { input }: { input: any }, context: any) => {
      const metadata = {
        ipAddress: context.request?.ip || context.req?.ip,
        userAgent:
          context.request?.headers?.get("user-agent") ||
          context.req?.get("user-agent"),
      };
      return authService.creerCompte(input, metadata);
    },

    // Changer le mot de passe
    changePassword: async (_: any, { input }: { input: any }) => {
      return authService.changerMotDePasse(input);
    },

    // Demander la récupération du mot de passe
    requestPasswordReset: async (_: any, { email }: { email: string }) => {
      return authService.demanderRecuperationMotDePasse(email);
    },

    // Réinitialiser le mot de passe avec un token
    resetPassword: async (
      _: any,
      { token, newPassword }: { token: string; newPassword: string },
    ) => {
      return authService.reinitialiserMotDePasse(token, newPassword);
    },

    // Créer une demande de récupération manuelle
    createManualRecovery: async (
      _: any,
      {
        userId,
        reason,
        verificationData,
      }: { userId: number; reason: string; verificationData: any },
    ) => {
      return authService.creerDemandeRecuperationManuelle(
        userId,
        reason,
        verificationData,
      );
    },

    // Nettoyer les tokens expirés
    cleanExpiredTokens: async () => {
      return authService.nettoyerTokensExpires();
    },

    // Renouveler les tokens avec refresh token
    refreshToken: async (
      _: any,
      { refreshToken }: { refreshToken: string },
      context: any,
    ) => {
      const metadata = {
        ipAddress: context.request?.ip || context.req?.ip,
        userAgent:
          context.request?.headers?.get("user-agent") ||
          context.req?.get("user-agent"),
      };
      return authService.renouvellerTokens(refreshToken, metadata);
    },

    // Révoquer un refresh token
    revokeRefreshToken: async (
      _: any,
      { refreshToken }: { refreshToken: string },
    ) => {
      try {
        await authService.revoquerRefreshToken(refreshToken);
        return {
          success: true,
          message: "Token révoqué avec succès",
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erreur lors de la révocation du token",
        };
      }
    },

    // Révoquer tous les refresh tokens d'un utilisateur
    revokeAllUserTokens: async (_: any, { userId }: { userId: number }) => {
      try {
        const count =
          await authService.revoquerTousLesTokensUtilisateur(userId);
        return {
          success: true,
          message: `${count} token(s) révoqué(s)`,
          count,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erreur lors de la révocation des tokens",
          count: 0,
        };
      }
    },
  },
};
