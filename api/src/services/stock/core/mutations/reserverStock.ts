/**
 * Mutation: Réserver du stock
 * Réserve du stock pour une commande (incrémente stock_reserve)
 */

import type { PrismaClient } from '@prisma/client';
import type { ReserverStockInput, ResultatReservation, MouvementStock } from '@clubmanager/types';
import { StockError, StockErrorType } from '@clubmanager/types';

export async function reserverStock(
  prisma: PrismaClient,
  input: ReserverStockInput
): Promise<ResultatReservation> {
  const { articles, commande_id, utilisateur_id } = input;

  // Validation
  if (!articles || articles.length === 0) {
    throw new StockError(
      'Aucun article à réserver',
      StockErrorType.VALIDATION_ERROR,
      400
    );
  }

  if (!commande_id) {
    throw new StockError(
      'ID de commande requis',
      StockErrorType.VALIDATION_ERROR,
      400
    );
  }

  // Vérifier que toutes les quantités sont valides
  for (const article of articles) {
    if (article.quantite <= 0) {
      throw new StockError(
        `Quantité invalide pour l'article ${article.article_id}`,
        StockErrorType.INVALID_QUANTITY,
        400
      );
    }
  }

  return await prisma.$transaction(async (tx) => {
    const mouvementsCreated: MouvementStock[] = [];

    // Traiter chaque article
    for (const article of articles) {
      const { article_id, taille, quantite } = article;

      // Récupérer le stock actuel
      const stock = await tx.stocks.findUnique({
        where: {
          article_id_taille: {
            article_id,
            taille,
          },
        },
      });

      if (!stock) {
        throw new StockError(
          `Stock non trouvé pour l'article ${article_id} taille ${taille}`,
          StockErrorType.STOCK_NOT_FOUND,
          404
        );
      }

      // Vérifier la disponibilité
      if (stock.stock_disponible < quantite) {
        throw new StockError(
          `Stock insuffisant pour l'article ${article_id} taille ${taille}. ` +
          `Disponible: ${stock.stock_disponible}, Demandé: ${quantite}`,
          StockErrorType.INSUFFICIENT_STOCK,
          400,
          {
            article_id,
            taille,
            disponible: stock.stock_disponible,
            demande: quantite,
          }
        );
      }

      // Réserver le stock
      const stockAvant = stock.stock_reserve;
      await tx.stocks.update({
        where: {
          article_id_taille: {
            article_id,
            taille,
          },
        },
        data: {
          stock_reserve: {
            increment: quantite,
          },
        },
      });

      // Enregistrer le mouvement
      const mouvement = await tx.mouvements_stock.create({
        data: {
          article_id,
          taille,
          type_mouvement: 'commande',
          quantite_avant: stockAvant,
          quantite_apres: stockAvant + quantite,
          quantite_mouvement: quantite,
          commande_id,
          motif: 'Réservation stock pour commande',
          utilisateur_id: utilisateur_id || null,
        },
      });

      mouvementsCreated.push({
        id: mouvement.id,
        article_id: mouvement.article_id,
        taille: mouvement.taille,
        type_mouvement: mouvement.type_mouvement as any,
        quantite_avant: mouvement.quantite_avant,
        quantite_apres: mouvement.quantite_apres,
        quantite_mouvement: mouvement.quantite_mouvement,
        commande_id: mouvement.commande_id || undefined,
        motif: mouvement.motif || undefined,
        utilisateur_id: mouvement.utilisateur_id || undefined,
        created_at: mouvement.created_at || undefined,
      });
    }

    return {
      success: true,
      message: `Stock réservé avec succès pour la commande ${commande_id}`,
      commande_id,
      articles_reserves: articles,
      mouvements: mouvementsCreated,
    };
  });
}
