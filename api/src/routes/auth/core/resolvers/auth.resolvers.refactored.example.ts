/**
 * EXEMPLE DE REFACTORING - Auth Resolvers avec Middleware et Custom Errors
 *
 * Ce fichier montre comment refactoriser auth.resolvers.ts pour utiliser:
 * - requireAuth middleware
 * - Custom error classes
 * - Meilleure gestion d'erreurs
 *
 * AVANT/APRÈS pour chaque resolver clé
 */

import { PrismaClient } from "@prisma/client";
import {
  authentifierUtilisateur,
  verifierTokenReset,
  genererToken,
} from "../services/auth.service.js";
import { validerLogin } from "@clubmanager/types/dist/validators.js";

// ✅ NOUVEAUX IMPORTS
import { requireAuth, AuthContext } from "../middleware/index.js";
import {
  InvalidCredentialsError,
  ValidationError,
  TokenExpiredError,
  TokenInvalidError,
  toAuthError,
} from "../errors/index.js";

// ==============================================================================
// EXEMPLE 1: Query protégée avec requireAuth
// ==============================================================================

/**
 * ❌ AVANT: Code dupliqué pour vérifier l'auth
 */
const verifyAuthAVANT = async (_: any, __: any, context: any) => {
  // ⚠️ Duplication: ce check est répété partout
  if (!context.user) {
    throw new GraphQLError("Non authentifié", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return {
    success: true,
    user: context.user,
  };
};

/**
 * ✅ APRÈS: Utilisation de requireAuth middleware
 */
const verifyAuthAPRES = requireAuth(async (_, __, context) => {
  // context.user est garanti d'exister ici (TypeScript le sait!)
  // Plus de duplication, code plus propre
  return {
    success: true,
    user: context.user, // TypeScript sait que user existe
  };
});

// ==============================================================================
// EXEMPLE 2: Mutation avec validation et erreurs custom
// ==============================================================================

/**
 * ❌ AVANT: Gestion d'erreur générique
 */
const loginAVANT = async (
  _: any,
  { email, password }: { email: string; password: string },
  context: any
) => {
  try {
    // Validation
    const validation = validerLogin({ email, password });
    if (!validation.success) {
      // ⚠️ Erreur générique, pas de code standardisé
      throw new GraphQLError("Validation échouée", {
        extensions: { code: "BAD_REQUEST", errors: validation.errors },
      });
    }

    const result = await authentifierUtilisateur(email, password);

    if (!result.success) {
      // ⚠️ Erreur générique, pas de distinction entre les cas
      throw new GraphQLError(result.message, {
        extensions: { code: "UNAUTHORIZED" },
      });
    }

    // ... reste du code
    return { success: true, token: result.token };
  } catch (error: any) {
    // ⚠️ Gestion d'erreur peu précise
    throw new GraphQLError("Erreur serveur", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * ✅ APRÈS: Erreurs custom avec codes standardisés
 */
const loginAPRES = async (
  _: any,
  { email, password }: { email: string; password: string },
  context: AuthContext
) => {
  try {
    // Validation avec erreur custom
    const validation = validerLogin({ email, password });
    if (!validation.success) {
      throw new ValidationError(
        "Données invalides",
        validation.errors?.map(e => ({ field: "input", message: e }))
      );
    }

    const result = await authentifierUtilisateur(email, password);

    if (!result.success) {
      // Erreur custom spécifique
      throw new InvalidCredentialsError();
    }

    // Set cookie (extraction vers utils recommandée)
    if (context.res && result.token) {
      context.res.cookie("authToken", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });
    }

    console.log(`✅ [Auth] Login réussi pour: ${email}`);

    return {
      success: true,
      message: "Connexion réussie",
      user: result.user,
      token: result.token,
    };
  } catch (error: any) {
    console.error("❌ [Auth] Erreur login:", error);
    // Convertir automatiquement en AuthError si nécessaire
    throw toAuthError(error);
  }
};

// ==============================================================================
// EXEMPLE 3: Query avec options requireAuth avancées
// ==============================================================================

/**
 * ✅ Query accessible uniquement aux admins avec email vérifié
 */
const getAllUsersAPRES = requireAuth(
  async (_, __, context) => {
    console.log(`🔍 [Auth] Admin ${context.user.email} consulte les utilisateurs`);
    // Logique métier...
    return [];
  },
  {
    roles: ["admin", "super_admin"],
    requireEmailVerified: true,
    requireActiveAccount: true,
  }
);

// ==============================================================================
// EXEMPLE 4: Mutation avec vérification de propriété
// ==============================================================================

import { requireOwner } from "../middleware/index.js";

/**
 * ✅ Seul le propriétaire ou un admin peut modifier le profil
 */
const updateProfileAPRES = requireOwner(
  async (_, { id, input }, context) => {
    console.log(`📝 [Auth] User ${context.user.id} modifie profil ${id}`);
    // Logique de mise à jour...
    return { success: true };
  },
  (args) => args.id // Extraire l'ID du propriétaire depuis les args
);

// ==============================================================================
// EXEMPLE 5: Vérification token avec erreurs spécifiques
// ==============================================================================

/**
 * ❌ AVANT: Messages d'erreur génériques
 */
const verifyResetTokenAVANT = async (
  _: any,
  { token }: { token: string },
  context: any
) => {
  try {
    const tokenData = await verifierTokenReset(token);

    if (!tokenData) {
      return {
        valid: false,
        error: "Token invalide ou expiré", // ⚠️ Message ambigu
      };
    }

    return { valid: true, email: tokenData.email };
  } catch (error: any) {
    return { valid: false, error: "Erreur serveur" }; // ⚠️ Peu informatif
  }
};

/**
 * ✅ APRÈS: Erreurs spécifiques selon le cas
 */
const verifyResetTokenAPRES = async (
  _: any,
  { token }: { token: string },
  context: AuthContext
) => {
  try {
    if (!token || token.length < 10) {
      throw new TokenInvalidError("Token malformé");
    }

    const tokenData = await verifierTokenReset(token);

    if (!tokenData) {
      // Distinguer expiration vs token invalide
      throw new TokenExpiredError("reset");
    }

    // Vérifier l'expiration
    if (tokenData.expires_at < new Date()) {
      throw new TokenExpiredError("Le token de réinitialisation a expiré", "reset");
    }

    console.log(`✅ [Auth] Token reset valide pour: ${tokenData.email}`);

    return {
      valid: true,
      email: tokenData.email,
      userName: `${tokenData.first_name} ${tokenData.last_name}`,
    };
  } catch (error: any) {
    console.error("❌ [Auth] Erreur verify-token:", error);
    throw toAuthError(error);
  }
};

// ==============================================================================
// EXEMPLE 6: Resolver avec helpers isAuthenticated
// ==============================================================================

import { isAuthenticated, isAdmin } from "../middleware/index.js";

/**
 * ✅ Resolver optionnellement protégé (contenu différent selon auth)
 */
const getPublicContentAPRES = async (_: any, __: any, context: AuthContext) => {
  // Utiliser helper au lieu de vérifier context.user
  const authenticated = isAuthenticated(context);
  const admin = isAdmin(context);

  console.log(`📄 [Auth] Contenu demandé - Auth: ${authenticated}, Admin: ${admin}`);

  return {
    freeContent: "Contenu public...",
    premiumContent: authenticated ? "Contenu premium..." : null,
    adminContent: admin ? "Contenu admin..." : null,
  };
};

// ==============================================================================
// RÉSUMÉ DES AMÉLIORATIONS
// ==============================================================================

/**
 * ✅ AVANTAGES DU REFACTORING:
 *
 * 1. Code plus court et lisible
 *    - Moins de duplication (if !context.user répété)
 *    - Intention claire (requireAuth, requireAdmin, etc.)
 *
 * 2. TypeScript plus intelligent
 *    - context.user garanti non-null après requireAuth
 *    - Auto-complétion améliorée
 *
 * 3. Erreurs standardisées
 *    - Codes cohérents (INVALID_CREDENTIALS, TOKEN_EXPIRED, etc.)
 *    - Messages clairs pour le frontend
 *    - Extensions personnalisables (retryAfter, unlockAt, etc.)
 *
 * 4. Maintenance facilitée
 *    - Logique auth centralisée
 *    - Facile d'ajouter nouvelles règles (ex: 2FA)
 *    - Tests plus simples
 *
 * 5. Sécurité renforcée
 *    - Vérifications cohérentes partout
 *    - Impossible d'oublier une vérification
 *    - Logs structurés pour audit
 */

// ==============================================================================
// ÉTAPES POUR REFACTORER auth.resolvers.ts
// ==============================================================================

/**
 * PLAN DE REFACTORING:
 *
 * 1. Ajouter les imports (middleware + errors)
 *
 * 2. Remplacer les queries protégées:
 *    verifyAuth    → requireAuth(...)
 *    refreshToken  → requireAuth(...)
 *
 * 3. Améliorer les mutations:
 *    login         → ValidationError + InvalidCredentialsError
 *    forgotPassword→ UserNotFoundError + RateLimitError (futur)
 *    resetPassword → TokenExpiredError + TokenInvalidError
 *
 * 4. Extraire les helpers de cookies:
 *    setCookie, clearCookie → core/utils/cookie.helpers.ts
 *
 * 5. Tester avec les tests existants
 *    Les tests GraphQL devraient continuer à passer
 *
 * 6. Ajouter tests spécifiques pour les erreurs
 *    Tester chaque code d'erreur
 */

export const authResolversRefactoredExample = (prisma: PrismaClient) => ({
  Query: {
    verifyAuth: verifyAuthAPRES,
    verifyResetToken: verifyResetTokenAPRES,
    getPublicContent: getPublicContentAPRES,
    getAllUsers: getAllUsersAPRES,
  },
  Mutation: {
    login: loginAPRES,
    updateProfile: updateProfileAPRES,
  },
});
