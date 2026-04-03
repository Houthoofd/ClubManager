/**
 * Mutation: Annuler une commande
 * Annule une commande et libère le stock réservé
 */

import type { PrismaClient } from '@prisma/client';
import type { AnnulerCommandeInput, ResultatAnnulation, ArticleCommande } from '@clubmanager/types';
import { StockError, StockErrorType } from '@clubmanager/types';

export async function annulerCommande(
  prisma: PrismaClient,
  input: AnnulerCommandeInput
): Promise<ResultatAnnulation> {
  const { commande_id, motif, utilisateur_id } = input;

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

    // Vérifier que la commande n'est pas déjà annulée
    if (commande.statut === 'annule') {
      throw new StockError(
        `La commande ${commande_id} est déjà annulée`,
        StockErrorType.ALREADY_CANCELLED,
        400
      );
    }

    // Vérifier que la commande n'est pas déjà livrée
    if (commande.statut === 'livre') {
      throw new StockError(
        `La commande ${commande_id} a déjà été livrée et ne peut pas être annulée`,
        StockErrorType.ALREADY_DELIVERED,
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

      // Vérifier qu'il y a assez de stock réservé à libérer
      if (stock.stock_reserve < quantite) {
        // Log warning mais ne bloque pas l'annulation
        console.warn(
          `Stock réservé insuffisant pour l'article ${article_id} taille ${taille}. ` +
          `Réservé: ${stock.stock_reserve}, À libérer: ${quantite}`
        );
      }

      // Libérer la réservation
      const stockReserveAvant = stock.stock_reserve;
      const quantiteALiberer = Math.min(quantite, stock.stock_reserve);

      await tx.stocks.update({
        where: {
          article_id_taille: {
            article_id,
            taille,
          },
        },
        data: {
          stock_reserve: {
            decrement: quantiteALiberer,
          },
        },
      });

      // Enregistrer le mouvement
      await tx.mouvements_stock.create({
        data: {
          article_id,
          taille,
          type_mouvement: 'annulation',
          quantite_avant: stockReserveAvant,
          quantite_apres: stockReserveAvant - quantiteALiberer,
          quantite_mouvement: quantiteALiberer,
          commande_id,
          motif: motif || 'Commande annulée - stock libéré',
          utilisateur_id: utilisateur_id || null,
        },
      });
    }

    // Mettre à jour le statut de la commande
    await tx.commandes.update({
      where: { commande_id },
      data: {
        statut: 'annule',
        motif_annulation: motif || null,
      },
    });

    return {
      success: true,
      message: `Commande ${commande_id} annulée avec succès`,
      commande_id,
      articles_liberes: articles,
    };
  });
}
