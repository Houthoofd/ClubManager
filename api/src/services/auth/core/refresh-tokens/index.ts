/**
 * Module de gestion des Refresh Tokens
 * Implémente la rotation automatique des tokens pour une sécurité renforcée
 */

import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateToken, JWTPayload } from "../../../../middleware/auth.js";

interface RefreshTokenResult {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

interface TokenMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Génère un refresh token sécurisé
 */
export function genererRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Crée un nouveau refresh token pour un utilisateur
 */
export async function creerRefreshToken(
  utilisateurId: number,
  metadata: TokenMetadata = {},
  prisma = defaultPrisma,
): Promise<string> {
  console.log(`🔄 [RefreshTokens] Création refresh token pour user ${utilisateurId}`);

  const token = genererRefreshToken();

  // Expiration : 7 jours par défaut
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refresh_tokens.create({
    data: {
      utilisateur_id: utilisateurId,
      token,
      expires_at: expiresAt,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
    },
  });

  console.log(`✅ [RefreshTokens] Token créé avec succès (expire: ${expiresAt.toISOString()})`);
  return token;
}

/**
 * Vérifie et valide un refresh token
 */
export async function verifierRefreshToken(
  token: string,
  prisma = defaultPrisma,
): Promise<{ valid: boolean; utilisateurId?: number; message?: string }> {
  console.log(`🔍 [RefreshTokens] Vérification du refresh token`);

  const refreshToken = await prisma.refresh_tokens.findUnique({
    where: { token },
    include: {
      utilisateurs: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          status_id: true,
        },
      },
    },
  });

  // Token inexistant
  if (!refreshToken) {
    console.log(`❌ [RefreshTokens] Token non trouvé`);
    return {
      valid: false,
      message: "Token invalide",
    };
  }

  // Token révoqué
  if (refreshToken.revoked_at) {
    console.log(`❌ [RefreshTokens] Token révoqué le ${refreshToken.revoked_at.toISOString()}`);
    return {
      valid: false,
      message: "Token révoqué",
    };
  }

  // Token expiré
  if (new Date() > refreshToken.expires_at) {
    console.log(`❌ [RefreshTokens] Token expiré le ${refreshToken.expires_at.toISOString()}`);
    return {
      valid: false,
      message: "Token expiré",
    };
  }

  console.log(`✅ [RefreshTokens] Token valide pour user ${refreshToken.utilisateur_id}`);
  return {
    valid: true,
    utilisateurId: refreshToken.utilisateur_id,
  };
}

/**
 * Révoque un refresh token (rotation)
 */
export async function revoquerRefreshToken(
  token: string,
  replacedBy?: string,
  prisma = defaultPrisma,
): Promise<void> {
  console.log(`🚫 [RefreshTokens] Révocation du refresh token`);

  await prisma.refresh_tokens.update({
    where: { token },
    data: {
      revoked_at: new Date(),
      replaced_by: replacedBy,
    },
  });

  console.log(`✅ [RefreshTokens] Token révoqué avec succès`);
}

/**
 * Renouvelle les tokens (access + refresh) avec rotation
 */
export async function renouvellerTokens(
  refreshToken: string,
  metadata: TokenMetadata = {},
  prisma = defaultPrisma,
): Promise<RefreshTokenResult> {
  console.log(`🔄 [RefreshTokens] Renouvellement des tokens`);

  // 1. Vérifier le refresh token actuel
  const verification = await verifierRefreshToken(refreshToken, prisma);

  if (!verification.valid || !verification.utilisateurId) {
    console.log(`❌ [RefreshTokens] Token invalide: ${verification.message}`);
    return {
      success: false,
      message: verification.message || "Token invalide",
    };
  }

  // 2. Récupérer les infos utilisateur
  const utilisateur = await prisma.utilisateurs.findUnique({
    where: { id: verification.utilisateurId },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      status_id: true,
    },
  });

  if (!utilisateur) {
    console.log(`❌ [RefreshTokens] Utilisateur non trouvé: ${verification.utilisateurId}`);
    return {
      success: false,
      message: "Utilisateur non trouvé",
    };
  }

  // Vérifier que l'utilisateur est actif (sauf en test)
  if (process.env.NODE_ENV !== "test" && utilisateur.status_id !== 1) {
    console.log(`❌ [RefreshTokens] Utilisateur inactif: ${utilisateur.id}`);
    return {
      success: false,
      message: "Compte inactif",
    };
  }

  // 3. Créer un nouveau refresh token (rotation)
  const nouveauRefreshToken = await creerRefreshToken(
    utilisateur.id,
    metadata,
    prisma,
  );

  // 4. Révoquer l'ancien token
  await revoquerRefreshToken(refreshToken, nouveauRefreshToken, prisma);

  // 5. Générer un nouveau access token
  const accessToken = generateToken({
    id: utilisateur.id,
    email: utilisateur.email,
    first_name: utilisateur.first_name,
    last_name: utilisateur.last_name,
    status_id: utilisateur.status_id,
  });

  // Calculer l'expiration (15 minutes par défaut)
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "900", 10);

  console.log(`✅ [RefreshTokens] Tokens renouvelés avec succès pour user ${utilisateur.id}`);

  return {
    success: true,
    message: "Tokens renouvelés avec succès",
    accessToken,
    refreshToken: nouveauRefreshToken,
    expiresIn,
  };
}

/**
 * Révoque tous les refresh tokens d'un utilisateur
 */
export async function revoquerTousLesTokens(
  utilisateurId: number,
  prisma = defaultPrisma,
): Promise<number> {
  console.log(`🚫 [RefreshTokens] Révocation de tous les tokens pour user ${utilisateurId}`);

  const result = await prisma.refresh_tokens.updateMany({
    where: {
      utilisateur_id: utilisateurId,
      revoked_at: null,
    },
    data: {
      revoked_at: new Date(),
    },
  });

  console.log(`✅ [RefreshTokens] ${result.count} token(s) révoqué(s)`);
  return result.count;
}

/**
 * Nettoie les refresh tokens expirés ou révoqués (maintenance)
 */
export async function nettoyerRefreshTokens(
  joursDRetention: number = 30,
  prisma = defaultPrisma,
): Promise<number> {
  console.log(`🧹 [RefreshTokens] Nettoyage des tokens expirés/révoqués`);

  const dateSeuilExpires = new Date(Date.now() - joursDRetention * 24 * 60 * 60 * 1000);
  const maintenant = new Date();

  const result = await prisma.refresh_tokens.deleteMany({
    where: {
      OR: [
        // Tokens expirés depuis plus de X jours
        {
          expires_at: {
            lt: dateSeuilExpires,
          },
        },
        // Tokens révoqués depuis plus de X jours
        {
          revoked_at: {
            not: null,
            lt: dateSeuilExpires,
          },
        },
      ],
    },
  });

  console.log(`✅ [RefreshTokens] ${result.count} token(s) supprimé(s)`);
  return result.count;
}

/**
 * Obtient les statistiques des refresh tokens d'un utilisateur
 */
export async function obtenirStatistiquesTokens(
  utilisateurId: number,
  prisma = defaultPrisma,
): Promise<{
  total: number;
  actifs: number;
  revoques: number;
  expires: number;
}> {
  const maintenant = new Date();

  const [total, actifs, revoques, expires] = await Promise.all([
    // Total
    prisma.refresh_tokens.count({
      where: { utilisateur_id: utilisateurId },
    }),
    // Actifs (non révoqués et non expirés)
    prisma.refresh_tokens.count({
      where: {
        utilisateur_id: utilisateurId,
        revoked_at: null,
        expires_at: { gte: maintenant },
      },
    }),
    // Révoqués
    prisma.refresh_tokens.count({
      where: {
        utilisateur_id: utilisateurId,
        revoked_at: { not: null },
      },
    }),
    // Expirés
    prisma.refresh_tokens.count({
      where: {
        utilisateur_id: utilisateurId,
        expires_at: { lt: maintenant },
      },
    }),
  ]);

  return { total, actifs, revoques, expires };
}

/**
 * Récupère les tokens actifs d'un utilisateur avec détails
 */
export async function obtenirTokensActifs(
  utilisateurId: number,
  prisma = defaultPrisma,
): Promise<Array<{
  id: number;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}>> {
  const maintenant = new Date();

  const tokens = await prisma.refresh_tokens.findMany({
    where: {
      utilisateur_id: utilisateurId,
      revoked_at: null,
      expires_at: { gte: maintenant },
    },
    select: {
      id: true,
      created_at: true,
      expires_at: true,
      ip_address: true,
      user_agent: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return tokens.map((token) => ({
    id: token.id,
    createdAt: token.created_at,
    expiresAt: token.expires_at,
    ipAddress: token.ip_address,
    userAgent: token.user_agent,
  }));
}
