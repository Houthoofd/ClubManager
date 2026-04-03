/**
 * Module de sécurité et audit
 */

import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import type { SecurityInfo, AuthStats } from "@clubmanager/types";

/**
 * Recherche un utilisateur par email
 */
export async function rechercherUtilisateurParEmail(
  email: string,
  prisma = defaultPrisma,
): Promise<any | null> {
  console.log(`🔍 [AuthSecurity] Recherche utilisateur: ${email}`);

  const user = await prisma.utilisateurs.findFirst({
    where: { email },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      status_id: true,
    },
  });

  return user;
}

/**
 * Obtient les informations de sécurité d'un utilisateur
 */
export async function obtenirInformationsSecurite(
  userId: number,
  prisma = defaultPrisma,
): Promise<SecurityInfo | null> {
  console.log(
    `📋 [AuthSecurity] Récupération infos sécurité utilisateur ${userId}`,
  );

  const user = await prisma.utilisateurs.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      date_of_birth: true,
      date_inscription: true,
      paiements: {
        select: { id: true, date_paiement: true },
        orderBy: { date_paiement: "desc" },
      },
      inscriptions: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    dateOfBirth: user.date_of_birth || undefined,
    dateInscription: user.date_inscription,
    nbPaiements: user.paiements.length,
    nbInscriptions: user.inscriptions.length,
    dernierPaiement: user.paiements[0]?.date_paiement || undefined,
  };
}

/**
 * Obtient les statistiques d'authentification
 */
export async function obtenirStatistiquesAuth(
  prisma = defaultPrisma,
): Promise<AuthStats> {
  console.log("📊 [AuthSecurity] Calcul statistiques auth");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Gérer l'absence de certaines tables en environnement de test
  let attemptsToday = 0;
  let successfulToday = 0;
  let resetTokensActive = 0;

  try {
    [attemptsToday, successfulToday] = await Promise.all([
      // Tentatives aujourd'hui
      prisma.auth_attempts.count({
        where: {
          attempted_at: { gte: startOfDay },
        },
      }),

      // Succès aujourd'hui
      prisma.auth_attempts.count({
        where: {
          attempted_at: { gte: startOfDay },
          success: true,
        },
      }),
    ]);
  } catch (error) {
    console.warn("⚠️ [AuthSecurity] Table auth_attempts non disponible");
  }

  try {
    resetTokensActive = await prisma.password_reset_tokens.count({
      where: {
        expires_at: { gt: new Date() },
        used_at: null,
      },
    });
  } catch (error) {
    console.warn(
      "⚠️ [AuthSecurity] Table password_reset_tokens non disponible",
    );
  }

  const [totalUsers, activeUsers] = await Promise.all([
    // Total utilisateurs
    prisma.utilisateurs.count(),

    // Utilisateurs actifs
    prisma.utilisateurs.count({
      where: { status_id: 1 },
    }),
  ]);

  const failedToday = attemptsToday - successfulToday;
  const successRate =
    attemptsToday > 0 ? (successfulToday / attemptsToday) * 100 : 0;

  return {
    total_utilisateurs: totalUsers,
    totalUsers,
    activeUsers,
    authAttemptsToday: attemptsToday,
    successfulAuthsToday: successfulToday,
    failedAuthsToday: failedToday,
    successRate: Math.round(successRate * 100) / 100,
    resetTokensActive,
  };
}

/**
 * Crée une demande de récupération manuelle
 */
export async function creerDemandeRecuperationManuelle(
  userId: number,
  reason: string,
  verificationData: any,
  prisma = defaultPrisma,
): Promise<{ success: boolean; message: string }> {
  console.log(
    `📝 [AuthSecurity] Création demande récupération manuelle pour ${userId}`,
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  try {
    await prisma.manual_recovery_requests.create({
      data: {
        utilisateur_id: userId,
        reason,
        verification_data: JSON.stringify({
          ...verificationData,
          timestamp: new Date().toISOString(),
        }),
        status: "pending",
        created_at: new Date(),
        expires_at: expiresAt,
      },
    });

    return {
      success: true,
      message: "Demande de récupération créée",
    };
  } catch (error) {
    console.error("❌ [AuthSecurity] Erreur création demande:", error);
    return {
      success: false,
      message: "Erreur lors de la création",
    };
  }
}
