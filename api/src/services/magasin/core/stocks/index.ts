/**
 * Module core - Gestion des stocks
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type { 
  Stock,
  MagasinConfirmationResult as ConfirmationResult
} from '@clubmanager/types';
import { 
  MagasinError,
  TAILLES_MAPPING,
  TAILLES_REVERSE_MAPPING
} from '@clubmanager/types';

/**
 * Récupère les stocks d'un article
 */
export async function obtenirStocksArticle(
  articleId: number,
  prisma = defaultPrisma
): Promise<Stock[]> {
  console.log(`📋 [MagasinStocks] Récupération stocks article ${articleId}`);
  
  try {
    const stocks = await prisma.stocks.findMany({
      where: {
        article_id: articleId
      },
      include: {
        tailles: true
      }
    });

    const result: Stock[] = stocks.map((stock: any) => ({
      taille: stock.tailles.nom,
      quantite: stock.quantite
    }));

    console.log(`✅ [MagasinStocks] ${result.length} stocks récupérés pour article ${articleId}`);
    return result;
  } catch (error: any) {
    console.error(`❌ [MagasinStocks] Erreur récupération stocks article ${articleId}:`, error);
    throw new MagasinError(
      'Erreur lors de la récupération des stocks',
      'STOCKS_FETCH_ERROR',
      error
    );
  }
}

/**
 * Met à jour le stock d'un article pour une taille donnée
 */
export async function mettreAJourStock(
  articleId: number,
  taille: string,
  nouvelleQuantite: number,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`🔄 [MagasinStocks] Mise à jour stock article ${articleId} taille ${taille} -> ${nouvelleQuantite}`);

  // Validations
  if (!articleId || articleId <= 0) {
    throw new MagasinError('L\'ID de l\'article est requis et doit être positif', 'INVALID_ARTICLE_ID');
  }

  if (!taille || taille.trim() === '') {
    throw new MagasinError('La taille est requise', 'INVALID_SIZE');
  }

  if (nouvelleQuantite === undefined || nouvelleQuantite < 0) {
    throw new MagasinError('La quantité ne peut pas être négative', 'INVALID_QUANTITY');
  }

  try {
    const tailleId = TAILLES_MAPPING[taille];
    if (!tailleId) {
      throw new MagasinError(
        `Taille "${taille}" non reconnue`,
        'INVALID_SIZE',
        { taille, validSizes: Object.keys(TAILLES_MAPPING) }
      );
    }

    // Vérifier si l'article existe
    const article = await prisma.articles.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      throw new MagasinError(
        `Article ${articleId} non trouvé`,
        'ARTICLE_NOT_FOUND',
        { articleId }
      );
    }

    // Chercher le stock existant
    const stockExistant = await prisma.stocks.findFirst({
      where: {
        article_id: articleId,
        taille_id: tailleId
      }
    });

    let result;
    if (stockExistant) {
      // Mettre à jour le stock existant
      result = await prisma.stocks.update({
        where: { id: stockExistant.id },
        data: { quantite: nouvelleQuantite }
      });
    } else {
      // Créer un nouveau stock
      result = await prisma.stocks.create({
        data: {
          article_id: articleId,
          taille_id: tailleId,
          quantite: nouvelleQuantite
        }
      });
    }

    console.log(`✅ [MagasinStocks] Stock mis à jour: article ${articleId}, taille ${taille}, quantité ${nouvelleQuantite}`);
    return {
      success: true,
      isConfirm: true,
      message: `Stock mis à jour pour l'article ${articleId}`,
      data: {
        articleId,
        taille,
        nouvelleQuantite,
        stockId: result.id
      }
    };
  } catch (error: any) {
    console.error(`❌ [MagasinStocks] Erreur mise à jour stock:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la mise à jour du stock',
      'STOCK_UPDATE_ERROR',
      error
    );
  }
}

/**
 * Ajoute du stock pour un article et une taille
 */
export async function ajouterStock(
  articleId: number,
  taille: string,
  quantiteAjoutee: number,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`➕ [MagasinStocks] Ajout stock article ${articleId} taille ${taille} +${quantiteAjoutee}`);

  try {
    const tailleId = TAILLES_MAPPING[taille];
    if (!tailleId) {
      throw new MagasinError(
        `Taille "${taille}" non reconnue`,
        'INVALID_SIZE',
        { taille, validSizes: Object.keys(TAILLES_MAPPING) }
      );
    }

    if (quantiteAjoutee <= 0) {
      throw new MagasinError(
        'La quantité à ajouter doit être positive',
        'INVALID_QUANTITY',
        { quantiteAjoutee }
      );
    }

    // Vérifier si l'article existe
    const article = await prisma.articles.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      throw new MagasinError(
        `Article ${articleId} non trouvé`,
        'ARTICLE_NOT_FOUND',
        { articleId }
      );
    }

    // Chercher le stock existant
    const stockExistant = await prisma.stocks.findFirst({
      where: {
        article_id: articleId,
        taille_id: tailleId
      }
    });

    let result;
    let nouvelleQuantite;

    if (stockExistant) {
      // Ajouter au stock existant
      nouvelleQuantite = stockExistant.quantite + quantiteAjoutee;
      result = await prisma.stocks.update({
        where: { id: stockExistant.id },
        data: { quantite: nouvelleQuantite }
      });
    } else {
      // Créer un nouveau stock
      nouvelleQuantite = quantiteAjoutee;
      result = await prisma.stocks.create({
        data: {
          article_id: articleId,
          taille_id: tailleId,
          quantite: quantiteAjoutee
        }
      });
    }

    console.log(`✅ [MagasinStocks] Stock ajouté: article ${articleId}, taille ${taille}, +${quantiteAjoutee} (total: ${nouvelleQuantite})`);
    return {
      success: true,
      isConfirm: true,
      message: `${quantiteAjoutee} unités ajoutées au stock`,
      data: {
        articleId,
        taille,
        quantiteAjoutee,
        nouvelleQuantite,
        stockId: result.id
      }
    };
  } catch (error: any) {
    console.error(`❌ [MagasinStocks] Erreur ajout stock:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de l\'ajout de stock',
      'STOCK_ADD_ERROR',
      error
    );
  }
}

/**
 * Retire du stock pour un article et une taille
 */
export async function retirerStock(
  articleId: number,
  taille: string,
  quantiteRetiree: number,
  prisma = defaultPrisma
): Promise<ConfirmationResult> {
  console.log(`➖ [MagasinStocks] Retrait stock article ${articleId} taille ${taille} -${quantiteRetiree}`);

  try {
    const tailleId = TAILLES_MAPPING[taille];
    if (!tailleId) {
      throw new MagasinError(
        `Taille "${taille}" non reconnue`,
        'INVALID_SIZE',
        { taille, validSizes: Object.keys(TAILLES_MAPPING) }
      );
    }

    if (quantiteRetiree <= 0) {
      throw new MagasinError(
        'La quantité à retirer doit être positive',
        'INVALID_QUANTITY',
        { quantiteRetiree }
      );
    }

    // Chercher le stock existant
    const stockExistant = await prisma.stocks.findFirst({
      where: {
        article_id: articleId,
        taille_id: tailleId
      }
    });

    if (!stockExistant) {
      throw new MagasinError(
        `Aucun stock trouvé pour l'article ${articleId} taille ${taille}`,
        'STOCK_NOT_FOUND',
        { articleId, taille }
      );
    }

    if (stockExistant.quantite < quantiteRetiree) {
      throw new MagasinError(
        `Stock insuffisant: ${stockExistant.quantite} disponibles, ${quantiteRetiree} demandées`,
        'INSUFFICIENT_STOCK',
        { 
          articleId, 
          taille, 
          disponible: stockExistant.quantite, 
          demandee: quantiteRetiree 
        }
      );
    }

    const nouvelleQuantite = stockExistant.quantite - quantiteRetiree;
    
    const result = await prisma.stocks.update({
      where: { id: stockExistant.id },
      data: { quantite: nouvelleQuantite }
    });

    console.log(`✅ [MagasinStocks] Stock retiré: article ${articleId}, taille ${taille}, -${quantiteRetiree} (reste: ${nouvelleQuantite})`);
    return {
      success: true,
      isConfirm: true,
      message: `${quantiteRetiree} unités retirées du stock`,
      data: {
        articleId,
        taille,
        quantiteRetiree,
        nouvelleQuantite,
        stockId: result.id
      }
    };
  } catch (error: any) {
    console.error(`❌ [MagasinStocks] Erreur retrait stock:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors du retrait de stock',
      'STOCK_REMOVE_ERROR',
      error
    );
  }
}

/**
 * Récupère tous les stocks avec leurs informations détaillées
 */
export async function obtenirTousLesStocks(prisma = defaultPrisma) {
  console.log('📋 [MagasinStocks] Récupération de tous les stocks');
  
  try {
    const stocks = await prisma.stocks.findMany({
      include: {
        articles: {
          select: {
            id: true,
            nom: true,
            prix: true
          }
        },
        tailles: {
          select: {
            id: true,
            nom: true
          }
        }
      },
      orderBy: [
        { articles: { nom: 'asc' } },
        { tailles: { id: 'asc' } }
      ]
    });

    const result = stocks.map((stock: any) => ({
      id: stock.id,
      article_id: stock.article_id,
      article_nom: stock.articles.nom,
      article_prix: stock.articles.prix,
      taille: stock.tailles.nom,
      quantite: stock.quantite
    }));

    console.log(`✅ [MagasinStocks] ${result.length} stocks récupérés`);
    return result;
  } catch (error: any) {
    console.error('❌ [MagasinStocks] Erreur récupération stocks:', error);
    throw new MagasinError(
      'Erreur lors de la récupération des stocks',
      'STOCKS_FETCH_ALL_ERROR',
      error
    );
  }
}

/**
 * Vérifie la disponibilité d'un article dans une taille donnée
 */
export async function verifierDisponibilite(
  articleId: number,
  taille: string,
  quantiteDemandee: number,
  prisma = defaultPrisma
): Promise<{ disponible: boolean; quantiteDisponible: number }> {
  console.log(`🔍 [MagasinStocks] Vérification disponibilité article ${articleId} taille ${taille} x${quantiteDemandee}`);

  try {
    const tailleId = TAILLES_MAPPING[taille];
    if (!tailleId) {
      throw new MagasinError(
        `Taille "${taille}" non reconnue`,
        'INVALID_SIZE',
        { taille, validSizes: Object.keys(TAILLES_MAPPING) }
      );
    }

    const stock = await prisma.stocks.findFirst({
      where: {
        article_id: articleId,
        taille_id: tailleId
      }
    });

    const quantiteDisponible = stock ? stock.quantite : 0;
    const disponible = quantiteDisponible >= quantiteDemandee;

    console.log(`✅ [MagasinStocks] Disponibilité vérifiée: ${disponible ? 'OUI' : 'NON'} (${quantiteDisponible}/${quantiteDemandee})`);
    return {
      disponible,
      quantiteDisponible
    };
  } catch (error: any) {
    console.error(`❌ [MagasinStocks] Erreur vérification disponibilité:`, error);
    if (error instanceof MagasinError) {
      throw error;
    }
    throw new MagasinError(
      'Erreur lors de la vérification de disponibilité',
      'AVAILABILITY_CHECK_ERROR',
      error
    );
  }
}

/**
 * Récupère les articles en rupture de stock
 */
export async function obtenirArticlesRuptureStock(
  seuilMinimum: number = 0,
  prisma = defaultPrisma
) {
  console.log(`📋 [MagasinStocks] Recherche articles en rupture (seuil: ${seuilMinimum})`);

  try {
    const stocks = await prisma.stocks.findMany({
      where: {
        quantite: {
          lte: seuilMinimum
        }
      },
      include: {
        articles: {
          select: {
            id: true,
            nom: true,
            prix: true
          }
        },
        tailles: {
          select: {
            nom: true
          }
        }
      }
    });

    const result = stocks.map((stock: any) => ({
      article_id: stock.article_id,
      article_nom: stock.articles.nom,
      taille: stock.tailles.nom,
      quantite: stock.quantite,
      prix: stock.articles.prix
    }));

    console.log(`⚠️ [MagasinStocks] ${result.length} articles en rupture détectés`);
    return result;
  } catch (error: any) {
    console.error('❌ [MagasinStocks] Erreur recherche ruptures:', error);
    throw new MagasinError(
      'Erreur lors de la recherche des ruptures de stock',
      'STOCK_SHORTAGE_SEARCH_ERROR',
      error
    );
  }
}
