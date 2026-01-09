/**
 * Resolvers GraphQL pour le module Commandes
 */

import { getCommandesService } from '../../services/commandes/commandesService.js';
import { getStockService } from '../../services/commandes/stockService.js';
import type { CommandeSearchFilters } from '../../db/clients/commandes/types.js';

/**
 * Contexte GraphQL (à typer selon votre configuration)
 */
interface GraphQLContext {
  user?: {
    id: number;
    role: string;
  };
}

/**
 * Convertir le StatsPeriod enum GraphQL en type repository
 */
function convertPeriod(period: 'DAY' | 'WEEK' | 'MONTH'): 'day' | 'week' | 'month' {
  const map = {
    DAY: 'day' as const,
    WEEK: 'week' as const,
    MONTH: 'month' as const,
  };
  return map[period];
}

/**
 * Resolvers pour les commandes
 */
export const commandesResolvers = {
  Query: {
    /**
     * Récupérer toutes les commandes
     */
    commandes: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const service = getCommandesService();
        return await service.getAllCommandes();
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        throw new Error('Impossible de récupérer les commandes');
      }
    },

    /**
     * Récupérer une commande par son ID
     */
    commande: async (_: any, { commandeId }: { commandeId: string }, context: GraphQLContext) => {
      try {
        const service = getCommandesService();
        return await service.getCommandeById(commandeId);
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') {
          return null;
        }
        console.error('Erreur lors de la récupération de la commande:', error);
        throw new Error('Impossible de récupérer la commande');
      }
    },

    /**
     * Récupérer les commandes d'un utilisateur
     */
    commandesByUserId: async (
      _: any,
      { utilisateurId }: { utilisateurId: number },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.getCommandesByUserId(utilisateurId);
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes utilisateur:', error);
        throw new Error('Impossible de récupérer les commandes');
      }
    },

    /**
     * Récupérer les commandes par statut
     */
    commandesByStatut: async (
      _: any,
      { statut }: { statut: string },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.getCommandesByStatut(statut);
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes par statut:', error);
        throw new Error('Impossible de récupérer les commandes');
      }
    },

    /**
     * Récupérer une commande par payment intent ID
     */
    commandeByPaymentIntent: async (
      _: any,
      { paymentIntentId }: { paymentIntentId: string },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.getCommandeByPaymentIntent(paymentIntentId);
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') {
          return null;
        }
        console.error('Erreur lors de la récupération de la commande:', error);
        throw new Error('Impossible de récupérer la commande');
      }
    },

    /**
     * Rechercher des commandes avec filtres
     */
    searchCommandes: async (
      _: any,
      { filters }: { filters: CommandeSearchFilters },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.searchCommandes(filters);
      } catch (error: any) {
        console.error('Erreur lors de la recherche de commandes:', error);
        if (error.code === 'VALIDATION_ERROR') {
          throw new Error(`Filtres invalides: ${error.message}`);
        }
        throw new Error('Impossible de rechercher les commandes');
      }
    },

    /**
     * Obtenir les statistiques des commandes
     */
    commandesStatistiques: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const service = getCommandesService();
        return await service.getStatistiques();
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw new Error('Impossible de récupérer les statistiques');
      }
    },

    /**
     * Compter les commandes par statut
     */
    commandesCountByStatut: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const service = getCommandesService();
        const counts = await service.countByStatut();

        // Convertir l'objet en tableau pour GraphQL
        return Object.entries(counts).map(([statut, count]) => ({
          statut,
          count,
        }));
      } catch (error) {
        console.error('Erreur lors du comptage par statut:', error);
        throw new Error('Impossible de compter les commandes');
      }
    },

    /**
     * Obtenir les statistiques par période
     */
    commandesStatsByPeriod: async (
      _: any,
      { period, duration = 30 }: { period: 'DAY' | 'WEEK' | 'MONTH'; duration?: number },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        const convertedPeriod = convertPeriod(period);
        return await service.getStatsByPeriod(convertedPeriod, duration);
      } catch (error: any) {
        console.error('Erreur lors de la récupération des stats par période:', error);
        if (error.code === 'INVALID_PERIOD' || error.code === 'INVALID_DURATION') {
          throw new Error(error.message);
        }
        throw new Error('Impossible de récupérer les statistiques');
      }
    },

    /**
     * Obtenir les top produits vendus
     */
    topProduits: async (
      _: any,
      { limit = 10 }: { limit?: number },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.getTopProduits(limit);
      } catch (error) {
        console.error('Erreur lors de la récupération des top produits:', error);
        throw new Error('Impossible de récupérer les top produits');
      }
    },

    /**
     * Vérifier la disponibilité du stock
     */
    checkStockAvailability: async (
      _: any,
      { articles }: { articles: any[] },
      context: GraphQLContext
    ) => {
      try {
        const stockService = getStockService();
        return await stockService.checkStockAvailability(articles);
      } catch (error) {
        console.error('Erreur lors de la vérification du stock:', error);
        throw new Error('Impossible de vérifier le stock');
      }
    },
  },

  Mutation: {
    /**
     * Créer une nouvelle commande
     */
    createCommande: async (
      _: any,
      { data }: { data: any },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.createCommande(data);
      } catch (error: any) {
        console.error('Erreur lors de la création de la commande:', error);
        if (error.code === 'VALIDATION_ERROR') {
          throw new Error(`Données invalides: ${error.message}`);
        }
        if (error.code === 'USER_NOT_FOUND') {
          throw new Error('Utilisateur introuvable');
        }
        if (error.code === 'DUPLICATE_COMMANDE') {
          throw new Error('Cette commande existe déjà');
        }
        throw new Error('Impossible de créer la commande');
      }
    },

    /**
     * Mettre à jour une commande
     */
    updateCommande: async (
      _: any,
      { commandeId, data }: { commandeId: string; data: any },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.updateCommande(commandeId, data);
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la commande:', error);
        if (error.code === 'NOT_FOUND') {
          throw new Error('Commande introuvable');
        }
        if (error.code === 'VALIDATION_ERROR') {
          throw new Error(`Données invalides: ${error.message}`);
        }
        if (error.code === 'NOT_MODIFIABLE') {
          throw new Error('Cette commande ne peut pas être modifiée');
        }
        if (error.code === 'INVALID_STATUS_TRANSITION') {
          throw new Error('Transition de statut invalide');
        }
        throw new Error('Impossible de mettre à jour la commande');
      }
    },

    /**
     * Mettre à jour le statut d'une commande
     */
    updateCommandeStatut: async (
      _: any,
      { commandeId, nouveauStatut }: { commandeId: string; nouveauStatut: string },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.updateCommandeStatut(commandeId, nouveauStatut);
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        if (error.code === 'NOT_FOUND') {
          throw new Error('Commande introuvable');
        }
        if (error.code === 'NOT_MODIFIABLE') {
          throw new Error('Cette commande ne peut pas être modifiée');
        }
        if (error.code === 'INVALID_STATUS_TRANSITION') {
          throw new Error(`Transition invalide: ${error.message}`);
        }
        throw new Error('Impossible de mettre à jour le statut');
      }
    },

    /**
     * Annuler une commande
     */
    cancelCommande: async (
      _: any,
      { commandeId }: { commandeId: string },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        return await service.cancelCommande(commandeId);
      } catch (error: any) {
        console.error('Erreur lors de l\'annulation de la commande:', error);
        if (error.code === 'NOT_FOUND') {
          throw new Error('Commande introuvable');
        }
        if (error.code === 'NOT_CANCELLABLE') {
          throw new Error('Cette commande ne peut pas être annulée');
        }
        throw new Error('Impossible d\'annuler la commande');
      }
    },

    /**
     * Supprimer une commande
     */
    deleteCommande: async (
      _: any,
      { commandeId }: { commandeId: string },
      context: GraphQLContext
    ) => {
      try {
        const service = getCommandesService();
        await service.deleteCommande(commandeId);
        return true;
      } catch (error: any) {
        console.error('Erreur lors de la suppression de la commande:', error);
        if (error.code === 'NOT_FOUND') {
          throw new Error('Commande introuvable');
        }
        throw new Error('Impossible de supprimer la commande');
      }
    },

    /**
     * Réserver du stock pour une commande
     */
    reserveStock: async (
      _: any,
      { commandeId, articles }: { commandeId: string; articles: any[] },
      context: GraphQLContext
    ) => {
      try {
        const stockService = getStockService();
        await stockService.reserveStock(commandeId, articles);
        return true;
      } catch (error: any) {
        console.error('Erreur lors de la réservation du stock:', error);
        if (error.code === 'INSUFFICIENT_STOCK') {
          throw new Error(`Stock insuffisant: ${error.message}`);
        }
        throw new Error('Impossible de réserver le stock');
      }
    },

    /**
     * Libérer le stock d'une commande
     */
    releaseStock: async (
      _: any,
      { commandeId, articles }: { commandeId: string; articles: any[] },
      context: GraphQLContext
    ) => {
      try {
        const stockService = getStockService();
        await stockService.releaseStock(commandeId, articles);
        return true;
      } catch (error) {
        console.error('Erreur lors de la libération du stock:', error);
        throw new Error('Impossible de libérer le stock');
      }
    },
  },

  /**
   * Resolvers pour les champs personnalisés
   */
  Commande: {
    /**
     * Parser les articles JSON si nécessaire
     */
    articles: (parent: any) => {
      if (typeof parent.articles === 'string') {
        try {
          return JSON.parse(parent.articles);
        } catch {
          return [];
        }
      }
      return parent.articles || [];
    },

    /**
     * Formater les dates
     */
    date_commande: (parent: any) => {
      return parent.date_commande instanceof Date
        ? parent.date_commande.toISOString()
        : parent.date_commande;
    },

    updated_at: (parent: any) => {
      return parent.updated_at instanceof Date
        ? parent.updated_at.toISOString()
        : parent.updated_at;
    },
  },
};
