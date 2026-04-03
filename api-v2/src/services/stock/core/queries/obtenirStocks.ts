/**
 * Query: Obtenir les stocks
 * Récupère la liste des stocks avec pagination et filtres
 */

import type { PrismaClient } from '@prisma/client';
import type { StockAvecDetails, FiltrerStocksInput, StatutStock } from '@clubmanager/types';

export interface ObtenirStocksArgs extends FiltrerStocksInput {
  limit?: number;
  offset?: number;
  recherche?: string;
  statut?: StatutStock;
  article_id?: number;
  taille?: string;
}

export async function obtenirStocks(
  prisma: PrismaClient,
  args: ObtenirStocksArgs = {}
): Promise<{
  stocks: StockAvecDetails[];
  total: number;
  hasMore: boolean;
}> {
  const {
    limit = 50,
    offset = 0,
    recherche,
    statut,
    article_id,
    taille,
  } = args;

  // Construction des conditions WHERE
  const whereConditions: any = {};

  if (article_id) {
    whereConditions.article_id = article_id;
  }

  if (taille) {
    whereConditions.taille = taille;
  }

  // Si recherche, on filtre sur le nom de l'article
  let articleWhereConditions: any = {
    active: 1,
  };

  if (recherche) {
    articleWhereConditions.OR = [
      { nom: { contains: recherche } },
      { code: { contains: recherche } },
    ];
  }

  // Récupération des stocks avec les détails de l'article
  const stocks = await prisma.stocks.findMany({
    where: whereConditions,
    include: {
      articles: {
        where: articleWhereConditions,
      },
    },
    skip: offset,
    take: limit + 1, // +1 pour savoir s'il y a plus de résultats
    orderBy: [
      { article_id: 'asc' },
      { taille: 'asc' },
    ],
  });

  // Filtrer les stocks sans article (si recherche active)
  let stocksFiltres = stocks.filter(stock => stock.articles);

  // Appliquer le filtre de statut si nécessaire
  if (statut) {
    stocksFiltres = stocksFiltres.filter(stock => {
      const stockStatut = determinerStatutStock(
        stock.stock_disponible,
        stock.seuil_alerte || 0
      );
      return stockStatut === statut;
    });
  }

  const hasMore = stocksFiltres.length > limit;
  const stocksPage = hasMore ? stocksFiltres.slice(0, limit) : stocksFiltres;

  // Compter le total (approximatif si filtre statut)
  let total: number;
  if (statut || recherche) {
    // Si filtre de statut ou recherche, on ne peut pas compter précisément sans tout charger
    total = stocksPage.length + (hasMore ? 1 : 0);
  } else {
    total = await prisma.stocks.count({
      where: whereConditions,
    });
  }

  // Transformer en StockAvecDetails
  const stocksAvecDetails: StockAvecDetails[] = stocksPage.map(stock => {
    const article = stock.articles;
    const statutStock = determinerStatutStock(
      stock.stock_disponible,
      stock.seuil_alerte || 0
    );

    return {
      article_id: stock.article_id,
      taille: stock.taille,
      stock_physique: stock.stock_physique,
      stock_reserve: stock.stock_reserve,
      stock_disponible: stock.stock_disponible,
      seuil_alerte: stock.seuil_alerte || 0,
      statut: statutStock,
      article_nom: article?.nom || 'Article inconnu',
      article_code: article?.code || undefined,
      article_prix: article?.prix ? Number(article.prix) : undefined,
      created_at: stock.created_at || undefined,
      updated_at: stock.updated_at || undefined,
    };
  });

  return {
    stocks: stocksAvecDetails,
    total,
    hasMore,
  };
}

/**
 * Détermine le statut d'un stock en fonction de sa disponibilité
 */
function determinerStatutStock(stockDisponible: number, seuilAlerte: number): StatutStock {
  if (stockDisponible <= 0) {
    return 'rupture';
  }
  if (stockDisponible <= seuilAlerte) {
    return 'alerte';
  }
  return 'disponible';
}
