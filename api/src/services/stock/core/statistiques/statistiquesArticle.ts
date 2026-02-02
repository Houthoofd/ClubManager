/**
 * Statistiques: Statistiques pour un article spécifique
 * Calcule les statistiques détaillées pour un article donné
 */

import type { PrismaClient } from '@prisma/client';
import type { StatistiquesArticle } from '@clubmanager/types';
import { StockError, StockErrorType } from '@clubmanager/types';

export interface StatistiquesArticleArgs {
  article_id: number;
}

export async function statistiquesArticle(
  prisma: PrismaClient,
  args: StatistiquesArticleArgs
): Promise<StatistiquesArticle> {
  const { article_id } = args;

  // Vérifier que l'article existe
  const article = await prisma.articles.findUnique({
    where: { id: article_id },
    select: {
      id: true,
      nom: true,
      prix: true,
      active: true,
    },
  });

  if (!article) {
    throw new StockError(
      `Article ${article_id} non trouvé`,
      StockErrorType.INVALID_ARTICLE,
      404
    );
  }

  // Récupérer tous les stocks pour cet article
  const stocks = await prisma.stocks.findMany({
    where: { article_id },
    orderBy: { taille: 'asc' },
  });

  // Calculer les totaux de stock
  const stock_total_physique = stocks.reduce((sum, stock) => sum + stock.stock_physique, 0);
  const stock_total_reserve = stocks.reduce((sum, stock) => sum + stock.stock_reserve, 0);
  const stock_total_disponible = stocks.reduce((sum, stock) => sum + stock.stock_disponible, 0);
  const nombre_tailles = stocks.length;

  // Calculer la valeur du stock
  const valeur_stock = article.prix
    ? Math.round(stock_total_physique * Number(article.prix) * 100) / 100
    : 0;

  // Calculer les mouvements des 30 derniers jours
  const il_y_a_30_jours = new Date();
  il_y_a_30_jours.setDate(il_y_a_30_jours.getDate() - 30);

  const mouvements_30_jours = await prisma.mouvements_stock.count({
    where: {
      article_id,
      created_at: {
        gte: il_y_a_30_jours,
      },
    },
  });

  // Calculer la quantité vendue (livraisons)
  const mouvements_ventes = await prisma.mouvements_stock.findMany({
    where: {
      article_id,
      type_mouvement: 'livraison',
      created_at: {
        gte: il_y_a_30_jours,
      },
    },
    select: {
      quantite_mouvement: true,
    },
  });

  const quantite_vendue_30_jours = mouvements_ventes.reduce(
    (sum, mouvement) => sum + Math.abs(mouvement.quantite_mouvement),
    0
  );

  // Calculer la quantité reçue (réceptions)
  const mouvements_receptions = await prisma.mouvements_stock.findMany({
    where: {
      article_id,
      type_mouvement: 'reception',
      created_at: {
        gte: il_y_a_30_jours,
      },
    },
    select: {
      quantite_mouvement: true,
    },
  });

  const quantite_recue_30_jours = mouvements_receptions.reduce(
    (sum, mouvement) => sum + mouvement.quantite_mouvement,
    0
  );

  // Calculer la rotation du stock (ventes / stock moyen)
  const rotation_stock = stock_total_physique > 0
    ? Math.round((quantite_vendue_30_jours / stock_total_physique) * 100) / 100
    : 0;

  // Trouver la dernière vente
  const derniere_vente_mouvement = await prisma.mouvements_stock.findFirst({
    where: {
      article_id,
      type_mouvement: 'livraison',
    },
    orderBy: {
      created_at: 'desc',
    },
    select: {
      created_at: true,
    },
  });

  const derniere_vente = derniere_vente_mouvement?.created_at || undefined;

  // Trouver le dernier approvisionnement
  const dernier_appro_mouvement = await prisma.mouvements_stock.findFirst({
    where: {
      article_id,
      type_mouvement: 'reception',
    },
    orderBy: {
      created_at: 'desc',
    },
    select: {
      created_at: true,
    },
  });

  const dernier_approvisionnement = dernier_appro_mouvement?.created_at || undefined;

  return {
    article_id,
    article_nom: article.nom,
    stock_total_physique,
    stock_total_reserve,
    stock_total_disponible,
    valeur_stock,
    nombre_tailles,
    mouvements_30_jours,
    quantite_vendue_30_jours,
    quantite_recue_30_jours,
    rotation_stock,
    derniere_vente,
    dernier_approvisionnement,
  };
}
