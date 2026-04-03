/**
 * Repository: SecurityRepository
 * Implémentation Prisma du repository de sécurité et d'audit
 *
 * Responsabilités:
 * - Récupération des informations de sécurité d'un utilisateur
 * - Statistiques d'authentification globales
 * - Comptage des tentatives d'authentification récentes
 * - Comptage des tentatives de réinitialisation récentes
 */

import { PrismaClient } from '@prisma/client';
import { ISecurityRepository } from '../../../../core/domain/interfaces/auth/index.js';
import { Email } from '../../../../core/domain/value-objects/auth/Email.js';
import { SecurityInfo, AuthStats } from '@clubmanager/types';

/**
 * Implémentation Prisma du SecurityRepository
 */
export class SecurityRepository implements ISecurityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Récupère les informations de sécurité d'un utilisateur
   */
  async getSecurityInfo(userId: number): Promise<SecurityInfo | null> {
    try {
      // Récupérer l'utilisateur
      const user = await this.prisma.utilisateurs.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          date_of_birth: true,
          date_inscription: true,
        },
      });

      if (!user) {
        return null;
      }

      // Compter le nombre de paiements
      const nbPaiements = await this.prisma.paiements.count({
        where: {
          utilisateur_id: userId,
        },
      });

      // Compter le nombre d'inscriptions
      const nbInscriptions = await this.prisma.inscriptions.count({
        where: {
          utilisateur_id: userId,
        },
      });

      // Récupérer le dernier paiement
      const dernierPaiement = await this.prisma.paiements.findFirst({
        where: {
          utilisateur_id: userId,
        },
        orderBy: {
          date_paiement: 'desc',
        },
        select: {
          date_paiement: true,
        },
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth) : undefined,
        dateInscription: new Date(user.date_inscription),
        nbPaiements,
        nbInscriptions,
        dernierPaiement: dernierPaiement
          ? new Date(dernierPaiement.date_paiement)
          : undefined,
      };
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des informations de sécurité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  /**
   * Récupère les statistiques d'authentification globales
   */
  async getAuthStats(): Promise<AuthStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Nombre total d'utilisateurs
      const totalUsers = await this.prisma.utilisateurs.count();

      // Nombre d'utilisateurs actifs (active = true et email_verified = true)
      const activeUsers = await this.prisma.utilisateurs.count({
        where: {
          active: true,
          email_verified: true,
        },
      });

      // Tentatives d'authentification aujourd'hui
      const authAttemptsToday = await this.prisma.auth_attempts.count({
        where: {
          attempted_at: {
            gte: today,
          },
        },
      });

      // Tentatives réussies aujourd'hui
      const successfulAuthsToday = await this.prisma.auth_attempts.count({
        where: {
          attempted_at: {
            gte: today,
          },
          success: true,
        },
      });

      // Tentatives échouées aujourd'hui
      const failedAuthsToday = authAttemptsToday - successfulAuthsToday;

      // Taux de succès (éviter la division par zéro)
      const successRate =
        authAttemptsToday > 0 ? (successfulAuthsToday / authAttemptsToday) * 100 : 0;

      // Nombre de tokens de réinitialisation actifs (non expirés, non utilisés)
      const now = new Date();
      const resetTokensActive = await this.prisma.password_reset_tokens.count({
        where: {
          expires_at: {
            gt: now,
          },
          used_at: null,
        },
      });

      return {
        totalUsers,
        activeUsers,
        authAttemptsToday,
        successfulAuthsToday,
        failedAuthsToday,
        successRate: Math.round(successRate * 100) / 100, // Arrondir à 2 décimales
        resetTokensActive,
      };
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des statistiques d'authentification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  /**
   * Compte le nombre de tentatives d'authentification récentes pour un email
   */
  async getRecentAuthAttempts(email: Email, minutes: number): Promise<number> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

      const count = await this.prisma.auth_attempts.count({
        where: {
          email: email.getValue(),
          attempted_at: {
            gte: cutoffTime,
          },
        },
      });

      return count;
    } catch (error) {
      throw new Error(
        `Erreur lors du comptage des tentatives d'authentification récentes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  /**
   * Compte le nombre de tentatives de réinitialisation de mot de passe récentes pour un email
   */
  async getRecentResetAttempts(email: string, minutes: number): Promise<number> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

      const count = await this.prisma.password_reset_attempts.count({
        where: {
          email,
          attempted_at: {
            gte: cutoffTime,
          },
        },
      });

      return count;
    } catch (error) {
      throw new Error(
        `Erreur lors du comptage des tentatives de réinitialisation récentes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }
}
