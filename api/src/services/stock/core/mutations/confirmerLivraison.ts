/**
 * Mutation: Confirmer une livraison
 * Confirme la livraison d'une commande (décrémente stock_physique et stock_reserve)
 */

import type { PrismaClient } from '@prisma/client';
import type { ConfirmerLivraisonInput, ResultatLivraison, ArticleCommande } from '@clubmanager/types';
import { StockError, StockErrorType } from '@clubmanager/types';

export async function confirmerLivraison(
  prisma: PrismaClient,
  input: ConfirmerLivraisonInput
): Promise<ResultatLivraison> {
  const { commande_id, utilisateur_id, date_livraison } = input;

  // Validation
  if (!commande_id) {
    throw new StockError(
      'ID de commande requis',
      StockErrorType.VALIDATION_ERROR,
      400
    );
  }

  return await prisma.$transaction(async (tx) => {
    // Récupérer la commande
    const commande = await tx.commandes.findUnique({
      where: { commande_id },
      select: {
        commande_id: true,
        articles: true,
        statut: true,
      },
    });

    if (!commande) {
      throw new StockError(
        `Commande ${commande_id} non trouvée`,
        StockErrorType.COMMANDE_NOT_FOUND,
        404
      );
    }

    // Vérifier que la commande n'est pas déjà livrée
    if (commande.statut === 'livre') {
      throw new StockError(
        `La commande ${commande_id} a déjà été livrée`,
        StockErrorType.ALREADY_DELIVERED,
        400
      );
    }

    // Vérifier que la commande n'est pas annulée
    if (commande.statut === 'annule') {
      throw new StockError(
        `La commande ${commande_id} est annulée`,
        StockErrorType.ALREADY_CANCELLED,
        400
      );
    }

    // Parser les articles
    let articles: ArticleCommande[];
    try {
      articles = typeof commande.articles === 'string'
        ? JSON.parse(commande.articles)
        : commande.articles;
    } catch (error) {
      throw new StockError(
        `Erreur lors du parsing des articles de la commande ${commande_id}`,
        StockErrorType.DATABASE_ERROR,
        500
      );
    }

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

      // Vérifier qu'il y a assez de stock réservé
      if (stock.stock_reserve < quantite) {
        throw new StockError(
          `Stock réservé insuffisant pour l'article ${article_id} taille ${taille}. ` +
          `Réservé: ${stock.stock_reserve}, Demandé: ${quantite}`,
          StockErrorType.INSUFFICIENT_STOCK,
          400
        );
      }

      // Vérifier qu'il y a assez de stock physique
      if (stock.stock_physique < quantite) {
        throw new StockError(
          `Stock physique insuffisant pour l'article ${article_id} taille ${taille}. ` +
          `Disponible: ${stock.stock_physique}, Demandé: ${quantite}`,
          StockErrorType.INSUFFICIENT_STOCK,
          400
        );
      }

      // Décrémenter le stock physique et libérer la réservation
      const stockPhysiqueAvant = stock.stock_physique;
      await tx.stocks.update({
        where: {
          article_id_taille: {
            article_id,
            taille,
          },
        },
        data: {
          stock_physique: {
            decrement: quantite,
          },
          stock_reserve: {
            decrement: quantite,
          },
        },
      });

      // Enregistrer le mouvement
      await tx.mouvements_stock.create({
        data: {
          article_id,
          taille,
          type_mouvement: 'livraison',
          quantite_avant: stockPhysiqueAvant,
          quantite_apres: stockPhysiqueAvant - quantite,
          quantite_mouvement: -quantite,
          commande_id,
          motif: 'Livraison confirmée',
          utilisateur_id: utilisateur_id || null,
        },
      });
    }

    // Mettre à jour le statut de la commande
    await tx.commandes.update({
      where: { commande_id },
      data: {
        statut: 'livre',
        date_livraison: date_livraison || new Date(),
      },
    });

    return {
      success: true,
      message: `Livraison confirmée pour la commande ${commande_id}`,
      commande_id,
      articles_livres: articles,
      date_livraison: date_livraison || new Date(),
    };
  });
}
