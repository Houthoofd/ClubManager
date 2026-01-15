/**
 * Resolvers GraphQL pour le module Paiements
 */

import { getPaiementsRepository } from '../../db/clients/paiements/paiements.repository.js';
import type {
  Paiement,
  PaiementAvecDetails,
  EcheancePaiement,
  EcheanceAvecDetails,
  Commande,
  ArticleCommande,
  CreatePaiementDTO,
  UpdatePaiementDTO,
  CreateEcheanceDTO,
  UpdateEcheanceDTO,
  CreateCommandeDTO,
  PaiementFilterOptions,
} from '../../db/clients/paiements/types.js';

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
 * Options de pagination
 */
interface PaginationInput {
  limit?: number;
  offset?: number;
}

/**
 * Entrée pour créer un paiement
 */
interface CreatePaiementInput {
  utilisateur_id: number;
  montant: number;
  methode_paiement: string;
  abonnement_id?: number;
  commande_id?: number;
  echeance_id?: number;
  periode_debut?: string;
  periode_fin?: string;
  notes?: string;
}

/**
 * Entrée pour mettre à jour un paiement
 */
interface UpdatePaiementInput {
  statut?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  notes?: string;
}

/**
 * Entrée pour créer une échéance
 */
interface CreateEcheanceInput {
  utilisateur_id: number;
  montant: number;
  date_echeance: string;
  description?: string;
  abonnement_id?: number;
}

/**
 * Entrée pour mettre à jour une échéance
 */
interface UpdateEcheanceInput {
  montant?: number;
  date_echeance?: string;
  statut?: string;
  description?: string;
}

/**
 * Entrée pour créer une commande
 */
interface CreateCommandeInput {
  utilisateur_id: number;
  montant_total: number;
  articles: Array<{
    article_id: number;
    quantite: number;
    prix_unitaire: number;
  }>;
  notes?: string;
}

/**
 * Entrée pour un article de commande
 */
interface ArticleCommandeInput {
  article_id: number;
  quantite: number;
  prix_unitaire: number;
}

/**
 * Filtre pour les paiements
 */
interface PaiementFilterInput {
  utilisateur_id?: number;
  statut?: string;
  methode_paiement?: string;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
}

/**
 * Resolvers pour les paiements
 */
export const paiementsResolvers = {
  Query: {
    /**
     * Récupérer tous les paiements
     */
    paiements: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getAllPaiements(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
        throw new Error('Impossible de récupérer les paiements');
      }
    },

    /**
     * Récupérer un paiement par son ID
     */
    paiement: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const paiement = await repository.getPaiementById(id);
        return paiement || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération du paiement ${id}:`, error);
        throw new Error('Impossible de récupérer le paiement');
      }
    },

    /**
     * Récupérer les paiements avec détails
     */
    paiementsAvecDetails: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getPaiementsAvecDetails(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération des paiements avec détails:', error);
        throw new Error('Impossible de récupérer les paiements avec détails');
      }
    },

    /**
     * Récupérer les paiements d'un utilisateur
     */
    paiementsUtilisateur: async (
      _: any,
      { utilisateur_id, pagination }: { utilisateur_id: number; pagination?: PaginationInput },
      context: GraphQLContext
    ) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getPaiementsByUtilisateur(utilisateur_id, limit, offset);
      } catch (error) {
        console.error(`Erreur lors de la récupération des paiements de l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer les paiements de l\'utilisateur');
      }
    },

    /**
     * Récupérer l'historique de paiement d'un utilisateur
     */
    historiquePaiementUtilisateur: async (_: any, { utilisateur_id }: { utilisateur_id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const paiements = await repository.getPaiementsByUtilisateur(utilisateur_id);
        const total = paiements.length;
        const montant_total = paiements.reduce((sum, p) => sum + Number(p.montant), 0);

        return {
          paiements,
          total,
          montant_total,
        };
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'historique de paiement de l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer l\'historique de paiement');
      }
    },

    /**
     * Récupérer les paiements par statut
     */
    paiementsParStatut: async (
      _: any,
      { statut, pagination }: { statut: string; pagination?: PaginationInput },
      context: GraphQLContext
    ) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getPaiementsByStatut(statut, limit, offset);
      } catch (error) {
        console.error(`Erreur lors de la récupération des paiements par statut ${statut}:`, error);
        throw new Error('Impossible de récupérer les paiements par statut');
      }
    },

    /**
     * Récupérer les paiements par méthode
     */
    paiementsParMethode: async (
      _: any,
      { methode_paiement, pagination }: { methode_paiement: string; pagination?: PaginationInput },
      context: GraphQLContext
    ) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getPaiementsByMethode(methode_paiement, limit, offset);
      } catch (error) {
        console.error(`Erreur lors de la récupération des paiements par méthode ${methode_paiement}:`, error);
        throw new Error('Impossible de récupérer les paiements par méthode');
      }
    },

    /**
     * Rechercher des paiements avec filtres
     */
    rechercherPaiements: async (
      _: any,
      { filtres, pagination }: { filtres: PaiementFilterInput; pagination?: PaginationInput },
      context: GraphQLContext
    ) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;

        const options: PaiementFilterOptions = {
          ...filtres,
          limit,
          offset,
        };

        return await repository.searchPaiements(options);
      } catch (error) {
        console.error('Erreur lors de la recherche des paiements:', error);
        throw new Error('Impossible de rechercher les paiements');
      }
    },

    /**
     * Récupérer toutes les échéances
     */
    echeances: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getAllEcheances(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération des échéances:', error);
        throw new Error('Impossible de récupérer les échéances');
      }
    },

    /**
     * Récupérer une échéance par son ID
     */
    echeance: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const echeance = await repository.getEcheanceById(id);
        return echeance || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'échéance ${id}:`, error);
        throw new Error('Impossible de récupérer l\'échéance');
      }
    },

    /**
     * Récupérer les échéances avec détails
     */
    echeancesAvecDetails: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getEcheancesAvecDetails(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération des échéances avec détails:', error);
        throw new Error('Impossible de récupérer les échéances avec détails');
      }
    },

    /**
     * Récupérer les échéances d'un utilisateur
     */
    echeancesUtilisateur: async (_: any, { utilisateur_id }: { utilisateur_id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.getEcheancesByUtilisateur(utilisateur_id);
      } catch (error) {
        console.error(`Erreur lors de la récupération des échéances de l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer les échéances de l\'utilisateur');
      }
    },

    /**
     * Récupérer les échéances en attente
     */
    echeancesEnAttente: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getEcheancesEnAttente(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération des échéances en attente:', error);
        throw new Error('Impossible de récupérer les échéances en attente');
      }
    },

    /**
     * Récupérer les échéances en retard
     */
    echeancesEnRetard: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getEcheancesEnRetard(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération des échéances en retard:', error);
        throw new Error('Impossible de récupérer les échéances en retard');
      }
    },

    /**
     * Récupérer une commande par son ID
     */
    commande: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        const commande = await repository.getCommandeById(id);
        return commande || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération de la commande ${id}:`, error);
        throw new Error('Impossible de récupérer la commande');
      }
    },

    /**
     * Récupérer les commandes d'un utilisateur
     */
    commandesUtilisateur: async (_: any, { utilisateur_id }: { utilisateur_id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.getCommandesByUtilisateur(utilisateur_id);
      } catch (error) {
        console.error(`Erreur lors de la récupération des commandes de l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer les commandes de l\'utilisateur');
      }
    },

    /**
     * Récupérer les articles d'une commande
     */
    articlesCommande: async (_: any, { commande_id }: { commande_id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.getArticlesCommande(commande_id);
      } catch (error) {
        console.error(`Erreur lors de la récupération des articles de la commande ${commande_id}:`, error);
        throw new Error('Impossible de récupérer les articles de la commande');
      }
    },

    /**
     * Compter le nombre total de paiements
     */
    compterPaiements: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.countPaiements();
      } catch (error) {
        console.error('Erreur lors du comptage des paiements:', error);
        return 0;
      }
    },

    /**
     * Calculer le montant total des paiements
     */
    montantTotalPaiements: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.getMontantTotalPaiements();
      } catch (error) {
        console.error('Erreur lors du calcul du montant total des paiements:', error);
        return 0;
      }
    },

    /**
     * Obtenir les statistiques des paiements
     */
    statistiquesPaiements: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.getStatistiquesPaiements();
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques des paiements:', error);
        throw new Error('Impossible de récupérer les statistiques des paiements');
      }
    },

    /**
     * Obtenir les statistiques par méthode de paiement
     */
    statistiquesParMethode: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.getStatistiquesParMethode();
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques par méthode:', error);
        throw new Error('Impossible de récupérer les statistiques par méthode');
      }
    },

    /**
     * Obtenir les statistiques des échéances
     */
    statistiquesEcheances: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.getStatistiquesEcheances();
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques des échéances:', error);
        throw new Error('Impossible de récupérer les statistiques des échéances');
      }
    },

    /**
     * Vérifier si un utilisateur a des paiements
     */
    utilisateurAPaiements: async (_: any, { utilisateur_id }: { utilisateur_id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.utilisateurHasPaiements(utilisateur_id);
      } catch (error) {
        console.error(`Erreur lors de la vérification des paiements de l'utilisateur ${utilisateur_id}:`, error);
        return false;
      }
    },

    /**
     * Vérifier si une échéance existe
     */
    echeanceExiste: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.echeanceExists(id);
      } catch (error) {
        console.error(`Erreur lors de la vérification de l'existence de l'échéance ${id}:`, error);
        return false;
      }
    },
  },

  Mutation: {
    /**
     * Créer un nouveau paiement
     */
    creerPaiement: async (_: any, { input }: { input: CreatePaiementInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();

        const data: CreatePaiementDTO = {
          utilisateur_id: input.utilisateur_id,
          montant: input.montant,
          methode_paiement: input.methode_paiement,
          abonnement_id: input.abonnement_id,
          commande_id: input.commande_id,
          echeance_id: input.echeance_id,
          periode_debut: input.periode_debut,
          periode_fin: input.periode_fin,
          notes: input.notes,
        };

        const result = await repository.createPaiement(data);

        return {
          success: result.isConfirm,
          message: result.message,
          paiementId: result.insertId,
          stripePaymentIntentId: null,
        };
      } catch (error) {
        console.error('Erreur lors de la création du paiement:', error);
        return {
          success: false,
          message: 'Erreur lors de la création du paiement',
          paiementId: null,
          stripePaymentIntentId: null,
        };
      }
    },

    /**
     * Mettre à jour un paiement
     */
    mettreAJourPaiement: async (_: any, { id, input }: { id: number; input: UpdatePaiementInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();

        const data: UpdatePaiementDTO = {
          statut: input.statut,
          stripe_payment_intent_id: input.stripe_payment_intent_id,
          stripe_charge_id: input.stripe_charge_id,
          notes: input.notes,
        };

        return await repository.updatePaiement(id, data);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du paiement ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la mise à jour du paiement',
        };
      }
    },

    /**
     * Marquer un paiement comme réussi
     */
    marquerPaiementReussi: async (
      _: any,
      { id, stripe_payment_intent_id, stripe_charge_id }: { id: number; stripe_payment_intent_id?: string; stripe_charge_id?: string },
      context: GraphQLContext
    ) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.markPaiementAsSuccess(id, stripe_payment_intent_id, stripe_charge_id);
      } catch (error) {
        console.error(`Erreur lors du marquage du paiement ${id} comme réussi:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors du marquage du paiement comme réussi',
        };
      }
    },

    /**
     * Marquer un paiement comme échoué
     */
    marquerPaiementEchoue: async (_: any, { id, raison }: { id: number; raison?: string }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.markPaiementAsFailed(id, raison);
      } catch (error) {
        console.error(`Erreur lors du marquage du paiement ${id} comme échoué:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors du marquage du paiement comme échoué',
        };
      }
    },

    /**
     * Annuler un paiement
     */
    annulerPaiement: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.cancelPaiement(id);
      } catch (error) {
        console.error(`Erreur lors de l'annulation du paiement ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de l\'annulation du paiement',
        };
      }
    },

    /**
     * Rembourser un paiement
     */
    rembourserPaiement: async (
      _: any,
      { id, montant, raison }: { id: number; montant?: number; raison?: string },
      context: GraphQLContext
    ) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.refundPaiement(id, montant, raison);
      } catch (error) {
        console.error(`Erreur lors du remboursement du paiement ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors du remboursement du paiement',
        };
      }
    },

    /**
     * Créer une nouvelle échéance
     */
    creerEcheance: async (_: any, { input }: { input: CreateEcheanceInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();

        const data: CreateEcheanceDTO = {
          utilisateur_id: input.utilisateur_id,
          montant: input.montant,
          date_echeance: input.date_echeance,
          description: input.description,
          abonnement_id: input.abonnement_id,
        };

        const result = await repository.createEcheance(data);

        return {
          isConfirm: result.isConfirm,
          message: result.message,
          echeanceId: result.insertId,
        };
      } catch (error) {
        console.error('Erreur lors de la création de l\'échéance:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la création de l\'échéance',
        };
      }
    },

    /**
     * Mettre à jour une échéance
     */
    mettreAJourEcheance: async (_: any, { id, input }: { id: number; input: UpdateEcheanceInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();

        const data: UpdateEcheanceDTO = {
          montant: input.montant,
          date_echeance: input.date_echeance,
          statut: input.statut,
          description: input.description,
        };

        return await repository.updateEcheance(id, data);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'échéance ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la mise à jour de l\'échéance',
        };
      }
    },

    /**
     * Marquer une échéance comme payée
     */
    marquerEcheancePayee: async (_: any, { id, paiement_id }: { id: number; paiement_id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.markEcheanceAsPaid(id, paiement_id);
      } catch (error) {
        console.error(`Erreur lors du marquage de l'échéance ${id} comme payée:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors du marquage de l\'échéance comme payée',
        };
      }
    },

    /**
     * Annuler une échéance
     */
    annulerEcheance: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.cancelEcheance(id);
      } catch (error) {
        console.error(`Erreur lors de l'annulation de l'échéance ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de l\'annulation de l\'échéance',
        };
      }
    },

    /**
     * Créer des échéances automatiques pour un abonnement
     */
    creerEcheancesAbonnement: async (
      _: any,
      { utilisateur_id, abonnement_id, nombre_echeances }: { utilisateur_id: number; abonnement_id: number; nombre_echeances: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.createEcheancesForAbonnement(utilisateur_id, abonnement_id, nombre_echeances);
      } catch (error) {
        console.error('Erreur lors de la création des échéances automatiques:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la création des échéances automatiques',
        };
      }
    },

    /**
     * Créer une nouvelle commande
     */
    creerCommande: async (_: any, { input }: { input: CreateCommandeInput }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();

        const data: CreateCommandeDTO = {
          utilisateur_id: input.utilisateur_id,
          montant_total: input.montant_total,
          articles: input.articles,
          notes: input.notes,
        };

        const result = await repository.createCommande(data);

        return {
          isConfirm: result.isConfirm,
          message: result.message,
          paiementId: result.insertId,
        };
      } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la création de la commande',
        };
      }
    },

    /**
     * Marquer une commande comme payée
     */
    marquerCommandePayee: async (_: any, { commande_id, paiement_id }: { commande_id: number; paiement_id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.markCommandeAsPaid(commande_id, paiement_id);
      } catch (error) {
        console.error(`Erreur lors du marquage de la commande ${commande_id} comme payée:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors du marquage de la commande comme payée',
        };
      }
    },

    /**
     * Annuler une commande
     */
    annulerCommande: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getPaiementsRepository();
        return await repository.cancelCommande(id);
      } catch (error) {
        console.error(`Erreur lors de l'annulation de la commande ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de l\'annulation de la commande',
        };
      }
    },
  },
};
