/**
 * Repository: PasswordResetTokenRepository
 * Implémentation Prisma du repository de tokens de réinitialisation de mot de passe
 *
 * Responsabilités:
 * - Gestion des tokens de réinitialisation (CRUD)
 * - Marquage des tokens comme utilisés
 * - Nettoyage des tokens expirés
 * - Enregistrement des tentatives de réinitialisation pour l'audit
 * - Conversion entre les Value Objects et les données de la DB
 */

import {
  PrismaClient,
  password_reset_tokens,
  utilisateurs,
} from "@prisma/client";
import { IPasswordResetTokenRepository } from "../../../../core/domain/interfaces/auth/index.js";
import { Token } from "../../../../core/domain/value-objects/auth/Token.js";
import { PasswordResetToken } from "@clubmanager/types";

/**
 * Type pour les données de token avec les informations utilisateur
 */
type PasswordResetTokenWithUser = password_reset_tokens & {
  utilisateurs?: Pick<
    utilisateurs,
    "id" | "email" | "first_name" | "last_name"
  >;
};

/**
 * Implémentation Prisma du PasswordResetTokenRepository
 */
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Crée un nouveau token de réinitialisation de mot de passe
   */
  async create(userId: number, token: Token): Promise<PasswordResetToken> {
    try {
      const dbToken = await this.prisma.password_reset_tokens.create({
        data: {
          utilisateur_id: userId,
          token: token.getValue(),
          expires_at: token.getExpiresAt(),
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

      return this.mapToPasswordResetToken(dbToken);
    } catch (error) {
      throw new Error(
        `Erreur lors de la création du token de réinitialisation: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Trouve un token de réinitialisation par sa valeur
   */
  async findByToken(token: string): Promise<PasswordResetToken | null> {
    try {
      const dbToken = await this.prisma.password_reset_tokens.findUnique({
        where: {
          token,
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

      if (!dbToken) {
        return null;
      }

      return this.mapToPasswordResetToken(dbToken);
    } catch (error) {
      throw new Error(
        `Erreur lors de la recherche du token de réinitialisation: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Marque un token comme utilisé
   */
  async markAsUsed(tokenId: number): Promise<void> {
    try {
      await this.prisma.password_reset_tokens.update({
        where: {
          id: tokenId,
        },
        data: {
          used_at: new Date(),
        },
      });
    } catch (error) {
      throw new Error(
        `Erreur lors du marquage du token comme utilisé: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Supprime tous les tokens de réinitialisation d'un utilisateur
   */
  async deleteAllForUser(userId: number): Promise<void> {
    try {
      await this.prisma.password_reset_tokens.deleteMany({
        where: {
          utilisateur_id: userId,
        },
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la suppression des tokens de l'utilisateur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Supprime tous les tokens expirés
   */
  async deleteExpired(): Promise<number> {
    try {
      const now = new Date();

      const result = await this.prisma.password_reset_tokens.deleteMany({
        where: {
          expires_at: {
            lt: now,
          },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(
        `Erreur lors de la suppression des tokens expirés: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Enregistre une tentative de réinitialisation de mot de passe pour l'audit
   */
  async recordResetAttempt(email: string, success: boolean): Promise<void> {
    try {
      await this.prisma.password_reset_attempts.create({
        data: {
          email,
          success,
          attempted_at: new Date(),
        },
      });
    } catch (error) {
      // Log l'erreur mais ne la propage pas - l'audit ne doit pas bloquer l'opération
      console.error(
        "[PasswordResetTokenRepository] Erreur lors de l'enregistrement de la tentative de réinitialisation:",
        error,
      );
    }
  }

  /**
   * Convertit une ligne de la base de données en objet PasswordResetToken
   */
  private mapToPasswordResetToken(
    dbToken: PasswordResetTokenWithUser,
  ): PasswordResetToken {
    const result: PasswordResetToken = {
      id: dbToken.id,
      userId: dbToken.utilisateur_id,
      token: dbToken.token,
      expiresAt: new Date(dbToken.expires_at),
      createdAt: new Date(dbToken.created_at),
    };

    // Ajouter les informations utilisateur si disponibles
    if (dbToken.utilisateurs) {
      result.user = {
        id: dbToken.utilisateurs.id,
        email: dbToken.utilisateurs.email,
        firstName: dbToken.utilisateurs.first_name,
        lastName: dbToken.utilisateurs.last_name,
      };
    }

    return result;
  }
}
