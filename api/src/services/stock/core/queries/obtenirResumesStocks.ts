/**
 * Query: Obtenir les résumés de stocks
 * Récupère un résumé consolidé des stocks par article
 */

import type { PrismaClient } from '@prisma/client';
import type { ResumeStock, StatutStock } from '@clubmanager/types';

export interface ObtenirResumesStocksArgs {
  article_id?: number;
  recherche?: string;
  statut_filtre?: StatutStock;
  limit?: number;
  offset?: number;
}

export async function obtenirResumesStocks(
  prisma: PrismaClient,
  args: ObtenirResumesStocksArgs = {}
): Promise<{
  resumes: ResumeStock[];
  total: number;
  hasMore: boolean;
}> {
  const {
    article_id,
    recherche,
    statut_filtre,
    limit = 50,
    offset = 0,
  } = args;

  // Construction des conditions WHERE pour les articles
  const articleWhereConditions: any = {
    active: 1,
  };

  if (article_id) {
    articleWhereConditions.id = article_id;
  }

  if (recherche) {
    articleWhereConditions.OR = [
      { nom: { contains: recherche } },
      { code: { contains: recherche } },
    ];
  }

  // Récupération des articles avec leurs stocks
  const articles = await prisma.articles.findMany({
    where: articleWhereConditions,
    include: {
      stocks: {
        orderBy: {
          taille: 'asc',
        },
      },
    },
    skip: offset,
    take: limit + 1, // +1 pour savoir s'il y a plus de résultats
    orderBy: {
      nom: 'asc',
    },
  });

  const hasMore = articles.length > limit;
  const articlesPage = hasMore ? articles.slice(0, limit) : articles;

  // Transformer en ResumeStock
  let resumes: ResumeStock[] = articlesPage.map(article => {
    const tailles = article.stocks.map(stock => ({
      taille: stock.taille,
      stock_physique: stock.stock_physique,
      stock_reserve: stock.stock_reserve,
      stock_disponible: stock.stock_disponible,
      statut: determinerStatutStock(stock.stock_disponible, stock.seuil_alerte || 0),
    }));

    const stock_total_physique = tailles.reduce((sum, t) => sum + t.stock_physique, 0);
    const stock_total_disponible = tailles.reduce((sum, t) => sum + t.stock_disponible, 0);
    const valeur_totale = article.prix ? Number(article.prix) * stock_total_physique : 0;

    return {
      article_id: article.id,
      article_nom: article.nom,
      article_code: article.code || undefined,
      tailles,
      stock_total_physique,
      stock_total_disponible,
      valeur_totale,
    };
  });

  // Appliquer le filtre de statut si nécessaire
  if (statut_filtre) {
    resumes = resumes.filter(resume => {
      // Un article est considéré avec ce statut si au moins une taille a ce statut
      return resume.tailles.some(t => t.statut === statut_filtre);
    });
  }

  // Compter le total
  let total: number;
  if (statut_filtre) {
    // Si filtre de statut, on ne peut pas compter précisément
    total = resumes.length + (hasMore ? 1 : 0);
  } else {
    total = await prisma.articles.count({
      where: articleWhereConditions,
    });
  }

  return {
    resumes,
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
