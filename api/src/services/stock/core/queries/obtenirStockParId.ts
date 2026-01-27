/**
 * Query: Obtenir un stock par ID
 * Récupère les informations détaillées d'un stock pour un article et une taille spécifiques
 */

import type { PrismaClient } from '@prisma/client';
import type { StockAvecDetails, StatutStock } from '@clubmanager/types';

export interface ObtenirStockParIdArgs {
  article_id: number;
  taille: string;
}

export async function obtenirStockParId(
  prisma: PrismaClient,
  args: ObtenirStockParIdArgs
): Promise<StockAvecDetails | null> {
  const { article_id, taille } = args;

  const stock = await prisma.stocks.findUnique({
    where: {
      article_id_taille: {
        article_id,
        taille,
      },
    },
    include: {
      articles: true,
    },
  });

  if (!stock || !stock.articles) {
    return null;
  }

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
    article_nom: stock.articles.nom,
    article_code: stock.articles.code || undefined,
    article_prix: stock.articles.prix ? Number(stock.articles.prix) : undefined,
    created_at: stock.created_at || undefined,
    updated_at: stock.updated_at || undefined,
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
