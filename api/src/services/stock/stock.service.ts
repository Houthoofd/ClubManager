/**
 * Service de stock
 * Gère les stocks, les mouvements et les statistiques
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import type {
  StockAvecDetails,
  MouvementStockAvecDetails,
  ResumeStock,
  ReserverStockInput,
  VerifierDisponibiliteInput,
  ConfirmerLivraisonInput,
  AnnulerCommandeInput,
  AjusterStockInput,
  ReapprovisionnerStockInput,
  ResultatDisponibilite,
  ResultatReservation,
  ResultatLivraison,
  ResultatAnnulation,
  ResultatAjustement,
  StatistiquesStocks,
  StatistiquesArticle,
} from '@clubmanager/types';
import { StockError } from '@clubmanager/types';

// Import des modules core
import * as stocksQuery from './core/queries/obtenirStocks.js';
import * as stockQuery from './core/queries/obtenirStockParId.js';
import * as mouvementsQuery from './core/queries/obtenirMouvements.js';
import * as resumesQuery from './core/queries/obtenirResumesStocks.js';

import * as reserverMutation from './core/mutations/reserverStock.js';
import * as livraison from './core/mutations/confirmerLivraison.js';
import * as annulation from './core/mutations/annulerCommande.js';
import * as ajustement from './core/mutations/ajusterStock.js';
import * as reappro from './core/mutations/reapprovisionnerStock.js';

import * as statsGenerales from './core/statistiques/statistiquesStocks.js';
import * as statsArticle from './core/statistiques/statistiquesArticle.js';

export class StockService {
  private prisma: typeof defaultPrisma;

  constructor(prisma: typeof defaultPrisma) {
    this.prisma = prisma;
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Récupère tous les stocks avec pagination et filtres
   */
  async obtenirStocks(args?: stocksQuery.ObtenirStocksArgs): Promise<{
    stocks: StockAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return stocksQuery.obtenirStocks(this.prisma, args || {});
  }

  /**
   * Récupère un stock par article ID et taille
   */
  async obtenirStockParId(article_id: number, taille: string): Promise<StockAvecDetails | null> {
    return stockQuery.obtenirStockParId(this.prisma, { article_id, taille });
  }

  /**
   * Récupère l'historique des mouvements de stock
   */
  async obtenirMouvements(args?: mouvementsQuery.ObtenirMouvementsArgs): Promise<{
    mouvements: MouvementStockAvecDetails[];
    total: number;
    hasMore: boolean;
  }> {
    return mouvementsQuery.obtenirMouvements(this.prisma, args || {});
  }

  /**
   * Récupère les résumés consolidés des stocks par article
   */
  async obtenirResumesStocks(args?: resumesQuery.ObtenirResumesStocksArgs): Promise<{
    resumes: ResumeStock[];
    total: number;
    hasMore: boolean;
  }> {
    return resumesQuery.obtenirResumesStocks(this.prisma, args || {});
  }

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Réserve du stock pour une commande
   */
  async reserverStock(input: ReserverStockInput): Promise<ResultatReservation> {
    return reserverMutation.reserverStock(this.prisma, input);
  }

  /**
   * Confirme une livraison (décrémente le stock physique)
   */
  async confirmerLivraison(input: ConfirmerLivraisonInput): Promise<ResultatLivraison> {
    return livraison.confirmerLivraison(this.prisma, input);
  }

  /**
   * Annule une commande (libère le stock réservé)
   */
  async annulerCommande(input: AnnulerCommandeInput): Promise<ResultatAnnulation> {
    return annulation.annulerCommande(this.prisma, input);
  }

  /**
   * Ajuste manuellement le stock (ajout ou retrait)
   */
  async ajusterStock(input: AjusterStockInput): Promise<ResultatAjustement> {
    return ajustement.ajusterStock(this.prisma, input);
  }

  /**
   * Réapprovisionne le stock (réception de marchandises)
   */
  async reapprovisionnerStock(input: ReapprovisionnerStockInput): Promise<ResultatAjustement> {
    return reappro.reapprovisionnerStock(this.prisma, input);
  }

  // ============================================
  // VÉRIFICATIONS
  // ============================================

  /**
   * Vérifie la disponibilité du stock pour une liste d'articles
   */
  async verifierDisponibilite(input: VerifierDisponibiliteInput): Promise<ResultatDisponibilite> {
    const { articles } = input;

    if (!articles || articles.length === 0) {
      return {
        disponible: true,
        details: [],
      };
    }

    const details: ResultatDisponibilite['details'] = [];
    let toutDisponible = true;

    for (const article of articles) {
      const { article_id, taille, quantite } = article;

      const stock = await this.prisma.stocks.findUnique({
        where: {
          article_id_taille: {
            article_id,
            taille,
          },
        },
      });

      const stockDisponible = stock?.stock_disponible || 0;
      const estDisponible = stockDisponible >= quantite;

      if (!estDisponible) {
        toutDisponible = false;
      }

      details.push({
        article_id,
        taille,
        quantite_demandee: quantite,
        stock_disponible: stockDisponible,
        disponible: estDisponible,
      });
    }

    return {
      disponible: toutDisponible,
      details,
    };
  }

  /**
   * Vérifie si un stock existe
   */
  async stockExiste(article_id: number, taille: string): Promise<boolean> {
    const count = await this.prisma.stocks.count({
      where: {
        article_id,
        taille,
      },
    });
    return count > 0;
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques générales des stocks
   */
  async statistiquesGenerales(): Promise<StatistiquesStocks> {
    return statsGenerales.statistiquesGenerales(this.prisma);
  }

  /**
   * Récupère les statistiques d'un article spécifique
   */
  async statistiquesArticle(article_id: number): Promise<StatistiquesArticle> {
    return statsArticle.statistiquesArticle(this.prisma, { article_id });
  }

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  /**
   * Obtient le stock disponible pour un article/taille
   */
  async obtenirStockDisponible(article_id: number, taille: string): Promise<number> {
    const stock = await this.prisma.stocks.findUnique({
      where: {
        article_id_taille: {
          article_id,
          taille,
        },
      },
      select: {
        stock_disponible: true,
      },
    });

    return stock?.stock_disponible || 0;
  }

  /**
   * Obtient tous les stocks en rupture
   */
  async obtenirStocksEnRupture(): Promise<StockAvecDetails[]> {
    const result = await this.obtenirStocks({
      statut: 'rupture',
      limit: 1000,
    });
    return result.stocks;
  }

  /**
   * Obtient tous les stocks en alerte
   */
  async obtenirStocksEnAlerte(): Promise<StockAvecDetails[]> {
    const result = await this.obtenirStocks({
      statut: 'alerte',
      limit: 1000,
    });
    return result.stocks;
  }

  /**
   * Obtient le nombre de mouvements pour un article
   */
  async compterMouvementsArticle(article_id: number): Promise<number> {
    return await this.prisma.mouvements_stock.count({
      where: { article_id },
    });
  }

  /**
   * Définit un seuil d'alerte pour un stock
   */
  async definirSeuilAlerte(article_id: number, taille: string, seuil_alerte: number): Promise<void> {
    await this.prisma.stocks.update({
      where: {
        article_id_taille: {
          article_id,
          taille,
        },
      },
      data: {
        seuil_alerte,
      },
    });
  }

  /**
   * Recherche des stocks par nom d'article
   */
  async rechercherStocks(recherche: string): Promise<StockAvecDetails[]> {
    const result = await this.obtenirStocks({ recherche, limit: 50 });
    return result.stocks;
  }
}

// Export d'une instance par défaut
let stockServiceInstance: StockService | null = null;

export function initStockService(prisma: typeof defaultPrisma): StockService {
  stockServiceInstance = new StockService(prisma);
  return stockServiceInstance;
}

export function getStockService(): StockService {
  if (!stockServiceInstance) {
    throw new Error('StockService n\'a pas été initialisé');
  }
  return stockServiceInstance;
}
