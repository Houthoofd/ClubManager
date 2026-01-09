/**
 * Service de gestion du stock lié aux commandes
 * Responsabilité: Vérification et mise à jour du stock lors des commandes
 */

import type { ArticleCommande } from '../../db/clients/commandes/types.js';

/**
 * Erreur liée au stock
 */
export class StockError extends Error {
  constructor(
    message: string,
    public code: string,
    public articleId?: string
  ) {
    super(message);
    this.name = 'StockError';
  }
}

/**
 * Interface pour un article en stock
 */
export interface StockArticle {
  article_id: string;
  nom: string;
  quantite_disponible: number;
  quantite_reservee: number;
  seuil_alerte: number;
}

/**
 * Résultat de vérification de stock
 */
export interface StockCheckResult {
  available: boolean;
  insufficientItems: {
    article_id: string;
    nom: string;
    requested: number;
    available: number;
  }[];
}

/**
 * Service de gestion du stock
 */
export class StockService {
  // ==========================================================================
  // VÉRIFICATION DU STOCK
  // ==========================================================================

  /**
   * Vérifier la disponibilité du stock pour une liste d'articles
   */
  async checkStockAvailability(articles: ArticleCommande[]): Promise<StockCheckResult> {
    const insufficientItems: StockCheckResult['insufficientItems'] = [];

    for (const article of articles) {
      const stockInfo = await this.getStockInfo(article.article_id);

      if (!stockInfo) {
        insufficientItems.push({
          article_id: article.article_id,
          nom: article.nom,
          requested: article.quantite,
          available: 0,
        });
        continue;
      }

      const availableQuantity = stockInfo.quantite_disponible - stockInfo.quantite_reservee;

      if (availableQuantity < article.quantite) {
        insufficientItems.push({
          article_id: article.article_id,
          nom: article.nom,
          requested: article.quantite,
          available: availableQuantity,
        });
      }
    }

    return {
      available: insufficientItems.length === 0,
      insufficientItems,
    };
  }

  /**
   * Vérifier si tous les articles sont en stock
   */
  async areArticlesInStock(articles: ArticleCommande[]): Promise<boolean> {
    const checkResult = await this.checkStockAvailability(articles);
    return checkResult.available;
  }

  // ==========================================================================
  // RÉSERVATION DU STOCK
  // ==========================================================================

  /**
   * Réserver du stock pour une commande
   */
  async reserveStock(commandeId: string, articles: ArticleCommande[]): Promise<void> {
    // Vérifier d'abord la disponibilité
    const checkResult = await this.checkStockAvailability(articles);

    if (!checkResult.available) {
      const insufficientList = checkResult.insufficientItems
        .map(item => `${item.nom} (demandé: ${item.requested}, disponible: ${item.available})`)
        .join(', ');

      throw new StockError(
        `Stock insuffisant pour: ${insufficientList}`,
        'INSUFFICIENT_STOCK'
      );
    }

    // Réserver chaque article
    for (const article of articles) {
      try {
        await this.reserveArticle(article.article_id, article.quantite, commandeId);
      } catch (error) {
        // En cas d'erreur, annuler les réservations précédentes
        await this.rollbackReservations(commandeId, articles.slice(0, articles.indexOf(article)));
        throw error;
      }
    }

    console.log(`Stock réservé pour la commande ${commandeId}`);
  }

  /**
   * Réserver un article spécifique
   */
  private async reserveArticle(
    articleId: string,
    quantite: number,
    commandeId: string
  ): Promise<void> {
    // TODO: Implémenter la logique de réservation dans la base de données
    // Ceci est un placeholder qui devra être connecté au client stock
    console.log(`Réservation de ${quantite} unités de l'article ${articleId} pour ${commandeId}`);
  }

  /**
   * Annuler les réservations en cas d'erreur
   */
  private async rollbackReservations(
    commandeId: string,
    articles: ArticleCommande[]
  ): Promise<void> {
    for (const article of articles) {
      await this.releaseArticle(article.article_id, article.quantite, commandeId);
    }
    console.log(`Réservations annulées pour la commande ${commandeId}`);
  }

  // ==========================================================================
  // LIBÉRATION DU STOCK
  // ==========================================================================

  /**
   * Libérer le stock réservé pour une commande (annulation)
   */
  async releaseStock(commandeId: string, articles: ArticleCommande[]): Promise<void> {
    for (const article of articles) {
      await this.releaseArticle(article.article_id, article.quantite, commandeId);
    }
    console.log(`Stock libéré pour la commande ${commandeId}`);
  }

  /**
   * Libérer un article spécifique
   */
  private async releaseArticle(
    articleId: string,
    quantite: number,
    commandeId: string
  ): Promise<void> {
    // TODO: Implémenter la logique de libération dans la base de données
    console.log(`Libération de ${quantite} unités de l'article ${articleId} pour ${commandeId}`);
  }

  // ==========================================================================
  // CONFIRMATION DU STOCK (SORTIE DÉFINITIVE)
  // ==========================================================================

  /**
   * Confirmer la sortie du stock (commande livrée/expédiée)
   */
  async confirmStockOut(commandeId: string, articles: ArticleCommande[]): Promise<void> {
    for (const article of articles) {
      await this.confirmArticleOut(article.article_id, article.quantite, commandeId);
    }
    console.log(`Sortie de stock confirmée pour la commande ${commandeId}`);
  }

  /**
   * Confirmer la sortie d'un article
   */
  private async confirmArticleOut(
    articleId: string,
    quantite: number,
    commandeId: string
  ): Promise<void> {
    // TODO: Implémenter la logique de sortie définitive dans la base de données
    // Décrémenter quantite_disponible et quantite_reservee
    console.log(`Sortie confirmée de ${quantite} unités de l'article ${articleId} pour ${commandeId}`);
  }

  // ==========================================================================
  // REMBOURSEMENT (RETOUR EN STOCK)
  // ==========================================================================

  /**
   * Remettre du stock (commande remboursée)
   */
  async restockArticles(commandeId: string, articles: ArticleCommande[]): Promise<void> {
    for (const article of articles) {
      await this.restockArticle(article.article_id, article.quantite, commandeId);
    }
    console.log(`Stock remis pour la commande ${commandeId}`);
  }

  /**
   * Remettre un article en stock
   */
  private async restockArticle(
    articleId: string,
    quantite: number,
    commandeId: string
  ): Promise<void> {
    // TODO: Implémenter la logique de remise en stock dans la base de données
    console.log(`Remise en stock de ${quantite} unités de l'article ${articleId} pour ${commandeId}`);
  }

  // ==========================================================================
  // INFORMATIONS SUR LE STOCK
  // ==========================================================================

  /**
   * Obtenir les informations de stock pour un article
   */
  async getStockInfo(articleId: string): Promise<StockArticle | null> {
    // TODO: Implémenter la récupération depuis la base de données
    // Pour l'instant, retourner des données de test
    console.log(`Récupération des infos de stock pour ${articleId}`);

    // Placeholder - à remplacer par vraie requête DB
    return {
      article_id: articleId,
      nom: 'Article placeholder',
      quantite_disponible: 100,
      quantite_reservee: 10,
      seuil_alerte: 20,
    };
  }

  /**
   * Vérifier si un article nécessite un réapprovisionnement
   */
  async needsRestock(articleId: string): Promise<boolean> {
    const stockInfo = await this.getStockInfo(articleId);
    if (!stockInfo) return true;

    const availableQuantity = stockInfo.quantite_disponible - stockInfo.quantite_reservee;
    return availableQuantity <= stockInfo.seuil_alerte;
  }

  /**
   * Obtenir la liste des articles nécessitant un réapprovisionnement
   */
  async getArticlesNeedingRestock(): Promise<StockArticle[]> {
    // TODO: Implémenter la requête pour récupérer les articles sous le seuil
    console.log('Récupération des articles nécessitant un réapprovisionnement');
    return [];
  }

  // ==========================================================================
  // GESTION DES ÉTATS DE COMMANDE ET STOCK
  // ==========================================================================

  /**
   * Gérer le stock en fonction du changement de statut d'une commande
   */
  async handleCommandeStatusChange(
    commandeId: string,
    articles: ArticleCommande[],
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    switch (newStatus) {
      case 'confirmee':
        // Réserver le stock si pas déjà fait
        if (oldStatus === 'en_attente') {
          await this.reserveStock(commandeId, articles);
        }
        break;

      case 'expedie':
      case 'livree':
        // Confirmer la sortie du stock
        await this.confirmStockOut(commandeId, articles);
        break;

      case 'annulee':
        // Libérer le stock réservé
        if (['en_attente', 'confirmee', 'en_preparation'].includes(oldStatus)) {
          await this.releaseStock(commandeId, articles);
        }
        break;

      case 'remboursee':
        // Remettre en stock
        await this.restockArticles(commandeId, articles);
        break;

      default:
        // Pas d'action sur le stock pour les autres statuts
        break;
    }
  }
}

// Instance singleton
let stockServiceInstance: StockService | null = null;

/**
 * Obtenir l'instance singleton du service de stock
 */
export function getStockService(): StockService {
  if (!stockServiceInstance) {
    stockServiceInstance = new StockService();
  }
  return stockServiceInstance;
}
