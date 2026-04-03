/**
 * Module de gestion des tokens de récupération de mot de passe
 */

import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import crypto from "crypto";
import type { AuthResult, PasswordResetToken } from "@clubmanager/types";

/**
 * Génère un token sécurisé
 */
export function genererTokenSecurise(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Crée un token de récupération pour un utilisateur
 */
export async function creerTokenRecuperation(
  userId: number,
  expirationHours: number = 1,
  prisma = defaultPrisma,
): Promise<{ success: boolean; token?: string; message: string }> {
  console.log(
    `🎫 [AuthTokens] Création token récupération pour utilisateur ${userId}`,
  );

  const token = genererTokenSecurise();
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

  try {
    // Supprimer les anciens tokens de cet utilisateur
    await prisma.password_reset_tokens.deleteMany({
      where: { utilisateur_id: userId },
    });

    // Créer le nouveau token
    await prisma.password_reset_tokens.create({
      data: {
        utilisateur_id: userId,
        token,
        expires_at: expiresAt,
        created_at: new Date(),
      },
    });

    console.log(
      `✅ [AuthTokens] Token créé avec succès, expire à ${expiresAt.toISOString()}`,
    );

    return {
      success: true,
      token,
      message: "Token de récupération créé",
    };
  } catch (error) {
    console.error("❌ [AuthTokens] Erreur création token:", error);
    return {
      success: false,
      message: "Erreur lors de la création du token",
    };
  }
}

/**
 * Vérifie un token de récupération
 */
export async function verifierTokenRecuperation(
  token: string,
  prisma = defaultPrisma,
): Promise<PasswordResetToken | null> {
  console.log("🔍 [AuthTokens] Vérification token récupération");

  // Valider que le token n'est pas vide
  if (!token || token.trim() === "") {
    console.log("❌ [AuthTokens] Token vide");
    return null;
  }

  const resetToken = await prisma.password_reset_tokens.findFirst({
    where: {
      token,
      expires_at: {
        gt: new Date(), // Token non expiré
      },
    },
    include: {
      utilisateurs: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });

  if (!resetToken) {
    console.log("❌ [AuthTokens] Token invalide ou expiré");
    return null;
  }

  console.log(
    `✅ [AuthTokens] Token valide pour utilisateur ${resetToken.utilisateur_id}`,
  );

  return {
    id: resetToken.id,
    userId: resetToken.utilisateur_id,
    token: resetToken.token,
    expiresAt: resetToken.expires_at,
    createdAt: resetToken.created_at,
    user: {
      id: resetToken.utilisateurs.id,
      email: resetToken.utilisateurs.email,
      firstName: resetToken.utilisateurs.first_name,
      lastName: resetToken.utilisateurs.last_name,
    },
  };
}

/**
 * Supprime un token après utilisation
 */
export async function marquerTokenUtilise(
  token: string,
  prisma = defaultPrisma,
): Promise<AuthResult> {
  console.log("🗑️ [AuthTokens] Suppression token utilisé");

  const deleted = await prisma.password_reset_tokens.deleteMany({
    where: { token },
  });

  if (deleted.count === 0) {
    return {
      success: false,
      message: "Token non trouvé",
    };
  }

  return {
    success: true,
    message: "Token supprimé",
  };
}

/**
 * Réinitialise le mot de passe avec un token valide
 */
export async function reinitialiserMotDePasseAvecToken(
  token: string,
  newPasswordHash: string,
  prisma = defaultPrisma,
): Promise<AuthResult> {
  console.log("🔄 [AuthTokens] Réinitialisation mot de passe avec token");

  // Vérifier le token
  const tokenData = await verifierTokenRecuperation(token, prisma);

  if (!tokenData) {
    return {
      success: false,
      message: "Token invalide ou expiré",
    };
  }

  try {
    // Mettre à jour le mot de passe dans une transaction
    await prisma.$transaction(async (tx: any) => {
      // Mettre à jour le mot de passe
      await tx.utilisateurs.update({
        where: { id: tokenData.userId },
        data: { password: newPasswordHash },
      });

      // Supprimer tous les tokens de cet utilisateur
      await tx.password_reset_tokens.deleteMany({
        where: { utilisateur_id: tokenData.userId },
      });
    });

    console.log(
      `✅ [AuthTokens] Mot de passe réinitialisé pour utilisateur ${tokenData.userId}`,
    );

    return {
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    };
  } catch (error) {
    console.error("❌ [AuthTokens] Erreur réinitialisation:", error);
    return {
      success: false,
      message: "Erreur lors de la réinitialisation",
    };
  }
}

/**
 * Nettoie les tokens expirés
 */
export async function nettoyerTokensExpires(
  prisma = defaultPrisma,
): Promise<{ count: number }> {
  console.log("🧹 [AuthTokens] Nettoyage tokens expirés");

  const deleted = await prisma.password_reset_tokens.deleteMany({
    where: {
      expires_at: {
        lt: new Date(),
      },
    },
  });

  console.log(`✅ [AuthTokens] ${deleted.count} tokens expirés supprimés`);

  return { count: deleted.count };
}

/**
 * Enregistre une tentative de récupération
 */
export async function enregistrerTentativeRecuperation(
  email: string,
  success: boolean,
  prisma = defaultPrisma,
): Promise<void> {
  try {
    await prisma.password_reset_attempts.create({
      data: {
        email,
        success,
        attempted_at: new Date(),
      },
    });
  } catch (error) {
    console.error("⚠️ [AuthTokens] Erreur enregistrement tentative:", error);
    // Ne pas bloquer le processus
  }
}

/**
 * Vérifie le nombre de tentatives de récupération récentes
 */
export async function verifierTentativesRecuperationRecentes(
  email: string,
  minutes: number = 15,
  prisma = defaultPrisma,
): Promise<number> {
  const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

  const count = await prisma.password_reset_attempts.count({
    where: {
      email,
      attempted_at: {
        gte: timeAgo,
      },
    },
  });

  return count;
}
