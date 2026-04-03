/**
 * Mutation: Ajuster le stock
 * Permet d'ajuster manuellement le stock physique (ajout ou retrait)
 */

import type { PrismaClient } from '@prisma/client';
import type { AjusterStockInput, ResultatAjustement } from '@clubmanager/types';
import { StockError, StockErrorType } from '@clubmanager/types';

export async function ajusterStock(
  prisma: PrismaClient,
  input: AjusterStockInput
): Promise<ResultatAjustement> {
  const { article_id, taille, quantite, type_ajustement, motif, utilisateur_id } = input;

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

  if (!motif || motif.trim().length === 0) {
    throw new StockError(
      'Un motif est requis pour ajuster le stock',
      StockErrorType.VALIDATION_ERROR,
      400
    );
  }

  if (!['ajout', 'retrait'].includes(type_ajustement)) {
    throw new StockError(
      'Type d\'ajustement invalide (doit être "ajout" ou "retrait")',
      StockErrorType.VALIDATION_ERROR,
      400
    );
  }

  return await prisma.$transaction(async (tx) => {
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

    // Vérifier l'article existe et est actif
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

    const stockPhysiqueAvant = stock.stock_physique;
    let stockPhysiqueApres: number;
    let quantiteMouvement: number;

    if (type_ajustement === 'ajout') {
      stockPhysiqueApres = stockPhysiqueAvant + quantite;
      quantiteMouvement = quantite;
    } else {
      // Vérifier qu'il y a assez de stock à retirer
      if (stockPhysiqueAvant < quantite) {
        throw new StockError(
          `Stock physique insuffisant pour retirer ${quantite} unités. ` +
          `Disponible: ${stockPhysiqueAvant}`,
          StockErrorType.INSUFFICIENT_STOCK,
          400,
          {
            article_id,
            taille,
            stock_actuel: stockPhysiqueAvant,
            quantite_demandee: quantite,
          }
        );
      }
      stockPhysiqueApres = stockPhysiqueAvant - quantite;
      quantiteMouvement = -quantite;
    }

    // Mettre à jour le stock
    await tx.stocks.update({
      where: {
        article_id_taille: {
          article_id,
          taille,
        },
      },
      data: {
        stock_physique: stockPhysiqueApres,
      },
    });

    // Enregistrer le mouvement
    await tx.mouvements_stock.create({
      data: {
        article_id,
        taille,
        type_mouvement: 'ajustement',
        quantite_avant: stockPhysiqueAvant,
        quantite_apres: stockPhysiqueApres,
        quantite_mouvement: quantiteMouvement,
        motif: `Ajustement manuel: ${motif}`,
        utilisateur_id: utilisateur_id || null,
      },
    });

    return {
      success: true,
      message: `Stock ajusté avec succès (${type_ajustement} de ${quantite} unités)`,
      stock_avant: stockPhysiqueAvant,
      stock_apres: stockPhysiqueApres,
      quantite_mouvement: quantiteMouvement,
    };
  });
}
