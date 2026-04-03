/**
 * Repository: RefreshTokenRepository
 * Implémentation Prisma du repository de tokens de rafraîchissement
 *
 * Responsabilités:
 * - Gestion des refresh tokens (CRUD)
 * - Révocation de tokens
 * - Nettoyage des tokens expirés
 * - Conversion entre les Value Objects et les données de la DB
 */

import { PrismaClient, refresh_tokens } from "@prisma/client";
import {
  IRefreshTokenRepository,
  RefreshToken,
  RefreshTokenMetadata,
} from "../../../../core/domain/interfaces/auth/index.js";
import { Token } from "../../../../core/domain/value-objects/auth/Token.js";

/**
 * Implémentation Prisma du RefreshTokenRepository
 */
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Crée un nouveau refresh token
   */
  async create(
    userId: number,
    token: Token,
    metadata?: RefreshTokenMetadata,
  ): Promise<RefreshToken> {
    try {
      const dbToken = await this.prisma.refresh_tokens.create({
        data: {
          utilisateur_id: userId,
          token: token.getValue(),
          expires_at: token.getExpiresAt(),
          ip_address: metadata?.ipAddress,
          user_agent: metadata?.userAgent,
        },
      });

      return this.mapToRefreshToken(dbToken);
    } catch (error) {
      throw new Error(
        `Erreur lors de la création du refresh token: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Trouve un refresh token par sa valeur
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const dbToken = await this.prisma.refresh_tokens.findUnique({
        where: {
          token,
        },
      });

      if (!dbToken) {
        return null;
      }

      return this.mapToRefreshToken(dbToken);
    } catch (error) {
      throw new Error(
        `Erreur lors de la recherche du refresh token: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Révoque un refresh token spécifique
   */
  async revoke(tokenId: number): Promise<void> {
    try {
      await this.prisma.refresh_tokens.update({
        where: {
          id: tokenId,
        },
        data: {
          revoked_at: new Date(),
        },
      });
    } catch (error) {
      throw new Error(
        `Erreur lors de la révocation du refresh token: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Révoque tous les refresh tokens d'un utilisateur
   */
  async revokeAllForUser(userId: number): Promise<number> {
    try {
      const result = await this.prisma.refresh_tokens.updateMany({
        where: {
          utilisateur_id: userId,
          revoked_at: null,
        },
        data: {
          revoked_at: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(
        `Erreur lors de la révocation des refresh tokens de l'utilisateur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Trouve tous les refresh tokens actifs (non révoqués, non expirés) d'un utilisateur
   */
  async findActiveByUser(userId: number): Promise<RefreshToken[]> {
    try {
      const now = new Date();

      const dbTokens = await this.prisma.refresh_tokens.findMany({
        where: {
          utilisateur_id: userId,
          revoked_at: null,
          expires_at: {
            gt: now,
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return dbTokens.map((dbToken: refresh_tokens) =>
        this.mapToRefreshToken(dbToken),
      );
    } catch (error) {
      throw new Error(
        `Erreur lors de la recherche des refresh tokens actifs: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Supprime les refresh tokens expirés
   */
  async deleteExpired(daysRetention: number = 0): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysRetention);

      const result = await this.prisma.refresh_tokens.deleteMany({
        where: {
          expires_at: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(
        `Erreur lors de la suppression des refresh tokens expirés: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Convertit une ligne de la base de données en objet RefreshToken
   */
  private mapToRefreshToken(dbToken: refresh_tokens): RefreshToken {
    return {
      id: dbToken.id,
      userId: dbToken.utilisateur_id,
      token: dbToken.token,
      expiresAt: new Date(dbToken.expires_at),
      createdAt: new Date(dbToken.created_at),
      revokedAt: dbToken.revoked_at ? new Date(dbToken.revoked_at) : undefined,
      ipAddress: dbToken.ip_address || undefined,
      userAgent: dbToken.user_agent || undefined,
    };
  }
}
