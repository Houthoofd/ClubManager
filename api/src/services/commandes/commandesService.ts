/**
 * Service principal pour la gestion des commandes
 * Responsabilité: Orchestration de la logique métier
 */

import { getCommandesRepository } from '../../db/clients/commandes/commandes.repository.js';
import type { CommandesRepository } from '../../db/clients/commandes/commandes.repository.js';
import type {
  Commande,
  CreateCommandeData,
  UpdateCommandeData,
  CommandeSearchFilters,
  CommandeStatistiques,
  CommandeStatsPeriode,
  TopProduit,
} from '../../db/clients/commandes/types.js';
import {
  validateCreateCommandeData,
  validateUpdateCommandeData,
  validateCommandeId,
  validateSearchFilters,
  isCommandeModifiable,
  isCommandeAnnulable,
  isValidStatusTransition,
} from '../../db/clients/commandes/utils/index.js';

/**
 * Erreur métier pour les commandes
 */
export class CommandeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CommandeError';
  }
}

/**
 * Service de gestion des commandes
 */
export class CommandesService {
  private repository: CommandesRepository;

  constructor() {
    this.repository = getCommandesRepository();
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE
  // ==========================================================================

  /**
   * Récupérer toutes les commandes
   */
  async getAllCommandes(): Promise<Commande[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw new CommandeError(
        'Impossible de récupérer les commandes',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Récupérer une commande par son ID
   */
  async getCommandeById(commandeId: string): Promise<Commande> {
    if (!validateCommandeId(commandeId)) {
      throw new CommandeError('ID de commande invalide', 'INVALID_ID', 400);
    }

    try {
      const commande = await this.repository.findById(commandeId);
      if (!commande) {
        throw new CommandeError(
          `Commande ${commandeId} introuvable`,
          'NOT_FOUND',
          404
        );
      }
      return commande;
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      console.error('Erreur lors de la récupération de la commande:', error);
      throw new CommandeError(
        'Impossible de récupérer la commande',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getCommandesByUserId(utilisateurId: number): Promise<Commande[]> {
    if (typeof utilisateurId !== 'number' || utilisateurId <= 0) {
      throw new CommandeError('ID utilisateur invalide', 'INVALID_USER_ID', 400);
    }

    try {
      return await this.repository.findByUserId(utilisateurId);
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes utilisateur:', error);
      throw new CommandeError(
        'Impossible de récupérer les commandes utilisateur',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Récupérer les commandes par statut
   */
  async getCommandesByStatut(statut: string): Promise<Commande[]> {
    if (!statut || typeof statut !== 'string') {
      throw new CommandeError('Statut invalide', 'INVALID_STATUS', 400);
    }

    try {
      return await this.repository.findByStatut(statut);
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes par statut:', error);
      throw new CommandeError(
        'Impossible de récupérer les commandes',
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Récupérer une commande par payment intent ID
   */
  async getCommandeByPaymentIntent(paymentIntentId: string): Promise<Commande> {
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      throw new CommandeError('Payment Intent ID invalide', 'INVALID_PAYMENT_INTENT', 400);
    }

    try {
      const commande = await this.repository.findByPaymentIntent(paymentIntentId);
      if (!commande) {
        throw new CommandeError(
          `Commande avec payment intent ${paymentIntentId} introuvable`,
          'NOT_FOUND',
          404
        );
      }
      return commande;
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      console.error('Erreur lors de la récupération de la commande:', error);
      throw new CommandeError(
        'Impossible de récupérer la commande',
        'FETCH_ERROR',
        500
      );
    }
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE
  // ==========================================================================

  /**
   * Créer une nouvelle commande
   */
  async createCommande(data: CreateCommandeData): Promise<Commande> {
    // Validation des données
    const validation = validateCreateCommandeData(data);
    if (!validation.isValid) {
      throw new CommandeError(
        `Données invalides: ${validation.errors.join(', ')}`,
        'VALIDATION_ERROR',
        400
      );
    }

    // Vérifier que l'utilisateur existe
    try {
      const userExists = await this.repository.userExists(data.utilisateur_id);
      if (!userExists) {
        throw new CommandeError(
          `Utilisateur ${data.utilisateur_id} introuvable`,
          'USER_NOT_FOUND',
          404
        );
      }
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      throw new CommandeError(
        'Erreur lors de la vérification de l\'utilisateur',
        'USER_CHECK_ERROR',
        500
      );
    }

    // Vérifier que la commande n'existe pas déjà
    try {
      const exists = await this.repository.exists(data.commande_id);
      if (exists) {
        throw new CommandeError(
          `La commande ${data.commande_id} existe déjà`,
          'DUPLICATE_COMMANDE',
          409
        );
      }
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      throw new CommandeError(
        'Erreur lors de la vérification de la commande',
        'CHECK_ERROR',
        500
      );
    }

    // Créer la commande
    try {
      const commandeId = await this.repository.create(data);
      const commande = await this.repository.findById(commandeId);
      if (!commande) {
        throw new CommandeError(
          'Commande créée mais introuvable',
          'CREATE_ERROR',
          500
        );
      }
      return commande;
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      console.error('Erreur lors de la création de la commande:', error);
      throw new CommandeError(
        'Impossible de créer la commande',
        'CREATE_ERROR',
        500
      );
    }
  }

  /**
   * Mettre à jour une commande
   */
  async updateCommande(commandeId: string, data: UpdateCommandeData): Promise<Commande> {
    // Validation de l'ID
    if (!validateCommandeId(commandeId)) {
      throw new CommandeError('ID de commande invalide', 'INVALID_ID', 400);
    }

    // Validation des données
    const validation = validateUpdateCommandeData(data);
    if (!validation.isValid) {
      throw new CommandeError(
        `Données invalides: ${validation.errors.join(', ')}`,
        'VALIDATION_ERROR',
        400
      );
    }

    // Récupérer la commande existante
    const existingCommande = await this.getCommandeById(commandeId);

    // Vérifier si la commande est modifiable
    if (!isCommandeModifiable(existingCommande.statut)) {
      throw new CommandeError(
        `La commande ne peut pas être modifiée (statut: ${existingCommande.statut})`,
        'NOT_MODIFIABLE',
        403
      );
    }

    // Si changement de statut, vérifier la transition
    if (data.statut && data.statut !== existingCommande.statut) {
      if (!isValidStatusTransition(existingCommande.statut, data.statut)) {
        throw new CommandeError(
          `Transition de statut invalide: ${existingCommande.statut} -> ${data.statut}`,
          'INVALID_STATUS_TRANSITION',
          400
        );
      }
    }

    // Mettre à jour
    try {
      const success = await this.repository.update(commandeId, data);
      if (!success) {
        throw new CommandeError(
          'Aucune modification effectuée',
          'UPDATE_ERROR',
          400
        );
      }

      const updatedCommande = await this.repository.findById(commandeId);
      if (!updatedCommande) {
        throw new CommandeError(
          'Commande mise à jour mais introuvable',
          'UPDATE_ERROR',
          500
        );
      }

      return updatedCommande;
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw new CommandeError(
        'Impossible de mettre à jour la commande',
        'UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateCommandeStatut(commandeId: string, nouveauStatut: string): Promise<Commande> {
    return this.updateCommande(commandeId, { statut: nouveauStatut });
  }

  /**
   * Annuler une commande
   */
  async cancelCommande(commandeId: string): Promise<Commande> {
    const commande = await this.getCommandeById(commandeId);

    if (!isCommandeAnnulable(commande.statut)) {
      throw new CommandeError(
        `La commande ne peut pas être annulée (statut: ${commande.statut})`,
        'NOT_CANCELLABLE',
        403
      );
    }

    return this.updateCommandeStatut(commandeId, 'annulee');
  }

  /**
   * Supprimer une commande
   */
  async deleteCommande(commandeId: string): Promise<void> {
    if (!validateCommandeId(commandeId)) {
      throw new CommandeError('ID de commande invalide', 'INVALID_ID', 400);
    }

    // Vérifier que la commande existe
    await this.getCommandeById(commandeId);

    try {
      const success = await this.repository.delete(commandeId);
      if (!success) {
        throw new CommandeError(
          'Impossible de supprimer la commande',
          'DELETE_ERROR',
          500
        );
      }
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      console.error('Erreur lors de la suppression de la commande:', error);
      throw new CommandeError(
        'Impossible de supprimer la commande',
        'DELETE_ERROR',
        500
      );
    }
  }

  // ==========================================================================
  // MÉTHODES DE RECHERCHE
  // ==========================================================================

  /**
   * Rechercher des commandes
   */
  async searchCommandes(filters: CommandeSearchFilters): Promise<{
    commandes: Commande[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Validation des filtres
    const validation = validateSearchFilters(filters);
    if (!validation.isValid) {
      throw new CommandeError(
        `Filtres invalides: ${validation.errors.join(', ')}`,
        'VALIDATION_ERROR',
        400
      );
    }

    try {
      const { commandes, total } = await this.repository.search(filters);
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        commandes,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      if (error instanceof CommandeError) throw error;
      console.error('Erreur lors de la recherche de commandes:', error);
      throw new CommandeError(
        'Impossible de rechercher les commandes',
        'SEARCH_ERROR',
        500
      );
    }
  }

  // ==========================================================================
  // MÉTHODES DE STATISTIQUES
  // ==========================================================================

  /**
   * Obtenir les statistiques des commandes
   */
  async getStatistiques(): Promise<CommandeStatistiques> {
    try {
      return await this.repository.getStatistiques();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new CommandeError(
        'Impossible de récupérer les statistiques',
        'STATS_ERROR',
        500
      );
    }
  }

  /**
   * Compter les commandes par statut
   */
  async countByStatut(): Promise<Record<string, number>> {
    try {
      return await this.repository.countByStatut();
    } catch (error) {
      console.error('Erreur lors du comptage par statut:', error);
      throw new CommandeError(
        'Impossible de compter les commandes',
        'COUNT_ERROR',
        500
      );
    }
  }

  /**
   * Obtenir les statistiques par période
   */
  async getStatsByPeriod(
    period: 'day' | 'week' | 'month',
    duration: number = 30
  ): Promise<CommandeStatsPeriode[]> {
    if (!['day', 'week', 'month'].includes(period)) {
      throw new CommandeError('Période invalide', 'INVALID_PERIOD', 400);
    }

    if (typeof duration !== 'number' || duration <= 0 || duration > 365) {
      throw new CommandeError(
        'Durée invalide (doit être entre 1 et 365)',
        'INVALID_DURATION',
        400
      );
    }

    try {
      return await this.repository.getStatsByPeriod(period, duration);
    } catch (error) {
      console.error('Erreur lors de la récupération des stats par période:', error);
      throw new CommandeError(
        'Impossible de récupérer les statistiques',
        'STATS_ERROR',
        500
      );
    }
  }

  /**
   * Obtenir les top produits vendus
   */
  async getTopProduits(limit: number = 10): Promise<TopProduit[]> {
    if (typeof limit !== 'number' || limit <= 0 || limit > 100) {
      throw new CommandeError(
        'Limite invalide (doit être entre 1 et 100)',
        'INVALID_LIMIT',
        400
      );
    }

    try {
      return await this.repository.getTopProduits(limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des top produits:', error);
      throw new CommandeError(
        'Impossible de récupérer les top produits',
        'STATS_ERROR',
        500
      );
    }
  }
}

// Instance singleton
let serviceInstance: CommandesService | null = null;

/**
 * Obtenir l'instance singleton du service
 */
export function getCommandesService(): CommandesService {
  if (!serviceInstance) {
    serviceInstance = new CommandesService();
  }
  return serviceInstance;
}
