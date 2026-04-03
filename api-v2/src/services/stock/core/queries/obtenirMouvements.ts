/**
 * Query: Obtenir les mouvements de stock
 * Récupère l'historique des mouvements avec pagination et filtres
 */

import type { PrismaClient } from '@prisma/client';
import type { MouvementStockAvecDetails, FiltrerMouvementsInput, TypeMouvementStock } from '@clubmanager/types';

export interface ObtenirMouvementsArgs extends FiltrerMouvementsInput {
  limit?: number;
  offset?: number;
  article_id?: number;
  taille?: string;
  type_mouvement?: TypeMouvementStock;
  commande_id?: string;
  date_debut?: Date;
  date_fin?: Date;
}

export async function obtenirMouvements(
  prisma: PrismaClient,
  args: ObtenirMouvementsArgs = {}
): Promise<{
  mouvements: MouvementStockAvecDetails[];
  total: number;
  hasMore: boolean;
}> {
  const {
    limit = 100,
    offset = 0,
    article_id,
    taille,
    type_mouvement,
    commande_id,
    date_debut,
    date_fin,
  } = args;

  // Construction des conditions WHERE
  const whereConditions: any = {};

  if (article_id) {
    whereConditions.article_id = article_id;
  }

  if (taille) {
    whereConditions.taille = taille;
  }

  if (type_mouvement) {
    whereConditions.type_mouvement = type_mouvement;
  }

  if (commande_id) {
    whereConditions.commande_id = commande_id;
  }

  if (date_debut || date_fin) {
    whereConditions.created_at = {};
    if (date_debut) {
      whereConditions.created_at.gte = date_debut;
    }
    if (date_fin) {
      whereConditions.created_at.lte = date_fin;
    }
  }

  // Récupération des mouvements avec les détails
  const mouvements = await prisma.mouvements_stock.findMany({
    where: whereConditions,
    include: {
      articles: true,
      utilisateurs: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    },
    skip: offset,
    take: limit + 1, // +1 pour savoir s'il y a plus de résultats
    orderBy: {
      created_at: 'desc',
    },
  });

  const hasMore = mouvements.length > limit;
  const mouvementsPage = hasMore ? mouvements.slice(0, limit) : mouvements;

  // Compter le total
  const total = await prisma.mouvements_stock.count({
    where: whereConditions,
  });

  // Transformer en MouvementStockAvecDetails
  const mouvementsAvecDetails: MouvementStockAvecDetails[] = mouvementsPage.map(mouvement => ({
    id: mouvement.id,
    article_id: mouvement.article_id,
    taille: mouvement.taille,
    type_mouvement: mouvement.type_mouvement as TypeMouvementStock,
    quantite_avant: mouvement.quantite_avant,
    quantite_apres: mouvement.quantite_apres,
    quantite_mouvement: mouvement.quantite_mouvement,
    commande_id: mouvement.commande_id || undefined,
    motif: mouvement.motif || undefined,
    utilisateur_id: mouvement.utilisateur_id || undefined,
    created_at: mouvement.created_at || undefined,
    article_nom: mouvement.articles?.nom || 'Article inconnu',
    utilisateur_nom: mouvement.utilisateurs?.nom || undefined,
    utilisateur_prenom: mouvement.utilisateurs?.prenom || undefined,
  }));

  return {
    mouvements: mouvementsAvecDetails,
    total,
    hasMore,
  };
}
