/**
 * Statistiques: Statistiques générales des stocks
 * Calcule les statistiques globales pour tous les stocks
 */

import type { PrismaClient } from '@prisma/client';
import type { StatistiquesStocks, AlerteStock } from '@clubmanager/types';

export async function statistiquesGenerales(
  prisma: PrismaClient
): Promise<StatistiquesStocks> {
  // Compter le nombre d'articles total
  const nombre_articles_total = await prisma.articles.count();

  // Compter le nombre d'articles actifs
  const nombre_articles_actifs = await prisma.articles.count({
    where: { active: 1 },
  });

  // Récupérer tous les stocks pour calculer les statistiques
  const stocks = await prisma.stocks.findMany({
    include: {
      articles: {
        select: {
          id: true,
          nom: true,
          prix: true,
          active: true,
        },
      },
    },
  });

  // Calculer les articles en rupture et en alerte
  let nombre_articles_en_rupture = 0;
  let nombre_articles_alerte = 0;
  const alertes_actives: AlerteStock[] = [];
  const articlesVus = new Set<number>();

  for (const stock of stocks) {
    if (!stock.articles || stock.articles.active !== 1) continue;

    // Éviter de compter plusieurs fois le même article
    if (!articlesVus.has(stock.article_id)) {
      articlesVus.add(stock.article_id);

      if (stock.stock_disponible <= 0) {
        nombre_articles_en_rupture++;
      } else if (stock.stock_disponible <= (stock.seuil_alerte || 0)) {
        nombre_articles_alerte++;
      }
    }

    // Ajouter aux alertes si nécessaire
    if (stock.stock_disponible <= 0) {
      alertes_actives.push({
        article_id: stock.article_id,
        article_nom: stock.articles.nom,
        taille: stock.taille,
        stock_disponible: stock.stock_disponible,
        seuil_alerte: stock.seuil_alerte || 0,
        statut: 'rupture',
      });
    } else if (stock.stock_disponible <= (stock.seuil_alerte || 0)) {
      alertes_actives.push({
        article_id: stock.article_id,
        article_nom: stock.articles.nom,
        taille: stock.taille,
        stock_disponible: stock.stock_disponible,
        seuil_alerte: stock.seuil_alerte || 0,
        statut: 'alerte',
      });
    }
  }

  // Calculer la valeur totale du stock
  let valeur_stock_total = 0;
  for (const stock of stocks) {
    if (stock.articles && stock.articles.prix) {
      valeur_stock_total += stock.stock_physique * Number(stock.articles.prix);
    }
  }

  // Compter le nombre total de mouvements
  const nombre_mouvements_total = await prisma.mouvements_stock.count();

  // Compter le nombre de mouvements du mois en cours
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const nombre_mouvements_mois = await prisma.mouvements_stock.count({
    where: {
      created_at: {
        gte: debutMois,
      },
    },
  });

  // Calculer les articles les plus vendus (30 derniers jours)
  const il_y_a_30_jours = new Date();
  il_y_a_30_jours.setDate(il_y_a_30_jours.getDate() - 30);

  const mouvements_ventes = await prisma.mouvements_stock.findMany({
    where: {
      type_mouvement: 'livraison',
      created_at: {
        gte: il_y_a_30_jours,
      },
    },
    include: {
      articles: {
        select: {
          id: true,
          nom: true,
        },
      },
    },
  });

  // Agréger les ventes par article
  const ventesParArticle = new Map<number, { nom: string; quantite: number }>();
  for (const mouvement of mouvements_ventes) {
    if (!mouvement.articles) continue;

    const article_id = mouvement.article_id;
    const quantite = Math.abs(mouvement.quantite_mouvement);

    if (ventesParArticle.has(article_id)) {
      const current = ventesParArticle.get(article_id)!;
      current.quantite += quantite;
    } else {
      ventesParArticle.set(article_id, {
        nom: mouvement.articles.nom,
        quantite: quantite,
      });
    }
  }

  // Trier et prendre les 10 meilleurs
  const top_articles_vendus = Array.from(ventesParArticle.entries())
    .map(([article_id, data]) => ({
      article_id,
      article_nom: data.nom,
      quantite_vendue: data.quantite,
    }))
    .sort((a, b) => b.quantite_vendue - a.quantite_vendue)
    .slice(0, 10);

  return {
    nombre_articles_total,
    nombre_articles_actifs,
    nombre_articles_en_rupture,
    nombre_articles_alerte,
    valeur_stock_total: Math.round(valeur_stock_total * 100) / 100,
    nombre_mouvements_total,
    nombre_mouvements_mois,
    top_articles_vendus,
    alertes_actives: alertes_actives.slice(0, 20), // Limiter à 20 alertes
  };
}
