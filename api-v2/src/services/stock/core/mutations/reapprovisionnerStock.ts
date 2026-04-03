/**
 * Mutation: Réapprovisionner le stock
 * Ajoute du stock lors d'une réception de marchandises
 */

import type { PrismaClient } from '@prisma/client';
import type { ReapprovisionnerStockInput, ResultatAjustement } from '@clubmanager/types';
import { StockError, StockErrorType } from '@clubmanager/types';

export async function reapprovisionnerStock(
  prisma: PrismaClient,
  input: ReapprovisionnerStockInput
): Promise<ResultatAjustement> {
  const { article_id, taille, quantite, motif, utilisateur_id } = input;

  // Validation
  if (!article_id || !taille) {
    throw new StockError(
      'Article ID et taille requis',
      StockErrorType.VALIDATION_ERROR,
      400
    );
  }

  if (quantite <= 0) {
    throw new StockError(
      'La quantité doit être positive',
      StockErrorType.INVALID_QUANTITY,
      400
    );
  }

  return await prisma.$transaction(async (tx) => {
    // Vérifier que le stock existe
    const stock = await tx.stocks.findUnique({
      where: {
        article_id_taille: {
          article_id,
          taille,
        },
      },
    });

    if (!stock) {
      // Créer le stock s'il n'existe pas
      const article = await tx.articles.findUnique({
        where: { id: article_id },
      });

      if (!article) {
        throw new StockError(
          `Article ${article_id} non trouvé`,
          StockErrorType.INVALID_ARTICLE,
          404
        );
      }

      await tx.stocks.create({
        data: {
          article_id,
          taille,
          stock_physique: quantite,
          stock_reserve: 0,
          stock_disponible: quantite,
          seuil_alerte: 5,
        },
      });

      // Enregistrer le mouvement
      await tx.mouvements_stock.create({
        data: {
          article_id,
          taille,
          type_mouvement: 'reception',
          quantite_avant: 0,
          quantite_apres: quantite,
          quantite_mouvement: quantite,
          motif: motif || 'Réception de marchandises - création stock',
          utilisateur_id: utilisateur_id || null,
        },
      });

      return {
        success: true,
        message: `Stock créé et approvisionné avec succès (${quantite} unités)`,
        stock_avant: 0,
        stock_apres: quantite,
        quantite_mouvement: quantite,
      };
    }

    // Mettre à jour le stock existant
    const stockPhysiqueAvant = stock.stock_physique;
    const stockPhysiqueApres = stockPhysiqueAvant + quantite;

    await tx.stocks.update({
      where: {
        article_id_taille: {
          article_id,
          taille,
        },
      },
      data: {
        stock_physique: {
          increment: quantite,
        },
      },
    });

    // Enregistrer le mouvement
    await tx.mouvements_stock.create({
      data: {
        article_id,
        taille,
        type_mouvement: 'reception',
        quantite_avant: stockPhysiqueAvant,
        quantite_apres: stockPhysiqueApres,
        quantite_mouvement: quantite,
        motif: motif || 'Réception de marchandises',
        utilisateur_id: utilisateur_id || null,
      },
    });

    return {
      success: true,
      message: `Stock réapprovisionné avec succès (${quantite} unités ajoutées)`,
      stock_avant: stockPhysiqueAvant,
      stock_apres: stockPhysiqueApres,
      quantite_mouvement: quantite,
    };
  });
}
