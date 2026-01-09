/**
 * Façade pour le module Commandes
 * Fournit une API simple et unifiée pour la gestion des commandes
 * Compatible avec l'ancien code (backward compatibility)
 */

import { getCommandesRepository } from "./commandes.repository.js";
import { getCommandesService } from "../../../services/commandes/commandesService.js";
import { getStockService } from "../../../services/commandes/stockService.js";
import type { CommandesRepository } from "./commandes.repository.js";
import type { CommandesService } from "../../../services/commandes/commandesService.js";
import type { StockService } from "../../../services/commandes/stockService.js";
import type {
  Commande,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeSearchFilters,
  CommandeStatistiques,
  CommandeStatsPeriode,
  TopProduit,
} from "./types.js";

/**
 * Façade pour la gestion des commandes
 *
 * Cette classe compose le repository, les services métier et fournit une API unifiée.
 * Elle maintient la compatibilité avec l'ancienne API CommandesClient.
 *
 * @example
 * ```typescript
 * // Récupérer toutes les commandes
 * const commandes = await Commandes.findAll();
 *
 * // Créer une commande
 * const commande = await Commandes.create({
 *   commande_id: 'CMD-123',
 *   utilisateur_id: 1,
 *   total: 99.99,
 *   articles: [...]
 * });
 *
 * // Mettre à jour le statut
 * await Commandes.updateStatut('CMD-123', 'confirmee');
 * ```
 */
export class Commandes {
  private static repository: CommandesRepository;
  private static service: CommandesService;
  private static stockService: StockService;

  /**
   * Initialisation lazy des dépendances
   */
  private static initialize(): void {
    if (!this.repository) {
      this.repository = getCommandesRepository();
      this.service = getCommandesService();
      this.stockService = getStockService();
    }
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (BACKWARD COMPATIBLE)
  // ==========================================================================

  /**
   * Récupérer toutes les commandes avec informations utilisateur
   * @returns Promise<Commande[]>
   */
  static async findAll(): Promise<Commande[]> {
    this.initialize();
    return this.service.getAllCommandes();
  }

  /**
   * Récupérer une commande par son ID
   * @param commandeId - ID de la commande
   * @returns Promise<Commande | null>
   */
  static async findById(commandeId: string): Promise<Commande | null> {
    this.initialize();
    try {
      return await this.service.getCommandeById(commandeId);
    } catch (error: any) {
      if (error.code === "NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Récupérer les commandes d'un utilisateur
   * @param utilisateurId - ID de l'utilisateur
   * @returns Promise<Commande[]>
   */
  static async findByUserId(utilisateurId: number): Promise<Commande[]> {
    this.initialize();
    return this.service.getCommandesByUserId(utilisateurId);
  }

  /**
   * Récupérer les commandes par statut
   * @param statut - Statut des commandes
   * @returns Promise<Commande[]>
   */
  static async findByStatut(statut: string): Promise<Commande[]> {
    this.initialize();
    return this.service.getCommandesByStatut(statut);
  }

  /**
   * Récupérer une commande par payment_intent_id
   * @param paymentIntentId - ID du payment intent Stripe
   * @returns Promise<Commande | null>
   */
  static async findByPaymentIntent(
    paymentIntentId: string,
  ): Promise<Commande | null> {
    this.initialize();
    try {
      return await this.service.getCommandeByPaymentIntent(paymentIntentId);
    } catch (error: any) {
      if (error.code === "NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (BACKWARD COMPATIBLE)
  // ==========================================================================

  /**
   * Créer une nouvelle commande
   * @param data - Données de la commande
   * @returns Promise<string> - ID de la commande créée
   */
  static async create(data: CreateCommandeData): Promise<string> {
    this.initialize();
    const commande = await this.service.createCommande(data);
    return commande.commande_id;
  }

  /**
   * Mettre à jour le statut d'une commande
   * @param commandeId - ID de la commande
   * @param nouveauStatut - Nouveau statut
   * @returns Promise<boolean> - true si mise à jour réussie
   */
  static async updateStatut(
    commandeId: string,
    nouveauStatut: string,
  ): Promise<boolean> {
    this.initialize();
    try {
      await this.service.updateCommandeStatut(commandeId, nouveauStatut);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      return false;
    }
  }

  /**
   * Mettre à jour une commande
   * @param commandeId - ID de la commande
   * @param data - Données à mettre à jour
   * @returns Promise<boolean> - true si mise à jour réussie
   */
  static async update(
    commandeId: string,
    data: UpdateCommandeData,
  ): Promise<boolean> {
    this.initialize();
    try {
      await this.service.updateCommande(commandeId, data);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      return false;
    }
  }

  /**
   * Supprimer une commande
   * @param commandeId - ID de la commande
   * @returns Promise<boolean> - true si suppression réussie
   */
  static async delete(commandeId: string): Promise<boolean> {
    this.initialize();
    try {
      await this.service.deleteCommande(commandeId);
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      return false;
    }
  }

  // ==========================================================================
  // MÉTHODES DE STATISTIQUES (BACKWARD COMPATIBLE)
  // ==========================================================================

  /**
   * Récupérer les statistiques des commandes
   * @returns Promise<CommandeStatistiques>
   */
  static async getStatistiques(): Promise<CommandeStatistiques> {
    this.initialize();
    return this.service.getStatistiques();
  }

  /**
   * Rechercher des commandes avec filtres
   * @param filters - Filtres de recherche
   * @returns Promise<Commande[]>
   */
  static async search(filters: CommandeSearchFilters): Promise<Commande[]> {
    this.initialize();
    const result = await this.service.searchCommandes(filters);
    return result.commandes;
  }

  /**
   * Compter les commandes par statut
   * @returns Promise<Record<string, number>>
   */
  static async countByStatut(): Promise<Record<string, number>> {
    this.initialize();
    return this.service.countByStatut();
  }

  // ==========================================================================
  // NOUVELLES MÉTHODES (API ÉTENDUE)
  // ==========================================================================

  /**
   * Rechercher des commandes avec pagination
   * @param filters - Filtres de recherche
   * @returns Promise avec résultats paginés
   */
  static async searchWithPagination(filters: CommandeSearchFilters): Promise<{
    commandes: Commande[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.initialize();
    return this.service.searchCommandes(filters);
  }

  /**
   * Annuler une commande
   * @param commandeId - ID de la commande
   * @returns Promise<Commande>
   */
  static async cancel(commandeId: string): Promise<Commande> {
    this.initialize();
    return this.service.cancelCommande(commandeId);
  }

  /**
   * Obtenir les statistiques par période
   * @param period - Période (day, week, month)
   * @param duration - Durée
   * @returns Promise<CommandeStatsPeriode[]>
   */
  static async getStatsByPeriod(
    period: "day" | "week" | "month",
    duration: number = 30,
  ): Promise<CommandeStatsPeriode[]> {
    this.initialize();
    return this.service.getStatsByPeriod(period, duration);
  }

  /**
   * Obtenir les top produits vendus
   * @param limit - Nombre de produits
   * @returns Promise<TopProduit[]>
   */
  static async getTopProduits(limit: number = 10): Promise<TopProduit[]> {
    this.initialize();
    return this.service.getTopProduits(limit);
  }

  // ==========================================================================
  // MÉTHODES DE GESTION DU STOCK
  // ==========================================================================

  /**
   * Vérifier la disponibilité du stock pour une commande
   * @param articles - Articles de la commande
   * @returns Promise<boolean>
   */
  static async checkStockAvailability(articles: any[]): Promise<boolean> {
    this.initialize();
    return this.stockService.areArticlesInStock(articles);
  }

  /**
   * Réserver du stock pour une commande
   * @param commandeId - ID de la commande
   * @param articles - Articles à réserver
   * @returns Promise<void>
   */
  static async reserveStock(
    commandeId: string,
    articles: any[],
  ): Promise<void> {
    this.initialize();
    return this.stockService.reserveStock(commandeId, articles);
  }

  /**
   * Libérer le stock d'une commande annulée
   * @param commandeId - ID de la commande
   * @param articles - Articles à libérer
   * @returns Promise<void>
   */
  static async releaseStock(
    commandeId: string,
    articles: any[],
  ): Promise<void> {
    this.initialize();
    return this.stockService.releaseStock(commandeId, articles);
  }

  // ==========================================================================
  // MÉTHODES D'ACCÈS AUX SERVICES (pour usage avancé)
  // ==========================================================================

  /**
   * Obtenir l'instance du repository
   * @returns CommandesRepository
   */
  static getRepository(): CommandesRepository {
    this.initialize();
    return this.repository;
  }

  /**
   * Obtenir l'instance du service
   * @returns CommandesService
   */
  static getService(): CommandesService {
    this.initialize();
    return this.service;
  }

  /**
   * Obtenir l'instance du service de stock
   * @returns StockService
   */
  static getStockService(): StockService {
    this.initialize();
    return this.stockService;
  }
}

/**
 * Export de la classe pour compatibilité avec l'ancien code
 * @deprecated Utilisez la classe Commandes à la place
 */
export class CommandesClient extends Commandes {}

/**
 * Export par défaut
 */
export default Commandes;
