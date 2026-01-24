/**
 * Resolvers GraphQL pour le service Commandes
 */

import { commandesService } from './commandes.service.js';

export const commandesResolvers = {
  Query: {
    /**
     * Récupère toutes les commandes
     */
    commandes: async () => {
      return commandesService.obtenirToutesCommandes();
    },

    /**
     * Récupère une commande par ID
     */
    commande: async (_: any, { commandeId }: { commandeId: string }) => {
      return commandesService.obtenirCommandeParId(commandeId);
    },

    /**
     * Récupère les commandes d'un utilisateur
     */
    commandesUtilisateur: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
      return commandesService.obtenirCommandesUtilisateur(utilisateurId);
    },

    /**
     * Récupère les commandes par statut
     */
    commandesParStatut: async (_: any, { statut }: { statut: string }) => {
      return commandesService.obtenirCommandesParStatut(statut);
    },

    /**
     * Récupère les statistiques des commandes
     */
    statistiquesCommandes: async () => {
      return commandesService.obtenirStatistiques();
    },

    /**
     * Compte les commandes par statut
     */
    comptesCommandesParStatut: async () => {
      return commandesService.compterParStatut();
    },

    /**
     * Recherche des commandes avec filtres
     */
    rechercherCommandes: async (_: any, { filters }: { filters: any }) => {
      return commandesService.rechercherCommandes(filters);
    },
  },

  Mutation: {
    /**
     * Crée une nouvelle commande
     */
    creerCommande: async (_: any, { input }: { input: any }) => {
      const commande = await commandesService.creerCommande(input);
      return {
        success: true,
        message: 'Commande créée avec succès',
        commande,
      };
    },

    /**
     * Modifie une commande
     */
    modifierCommande: async (_: any, { commandeId, updates }: { commandeId: string; updates: any }) => {
      const commande = await commandesService.modifierCommande(commandeId, updates);
      if (!commande) {
        return {
          success: false,
          message: 'Commande introuvable',
          commande: null,
        };
      }
      return {
        success: true,
        message: 'Commande modifiée avec succès',
        commande,
      };
    },

    /**
     * Modifie le statut d'une commande
     */
    modifierStatutCommande: async (_: any, { commandeId, statut }: { commandeId: string; statut: string }) => {
      const commande = await commandesService.modifierStatutCommande(commandeId, statut);
      if (!commande) {
        return {
          success: false,
          message: 'Commande introuvable',
          commande: null,
        };
      }
      return {
        success: true,
        message: 'Statut modifié avec succès',
        commande,
      };
    },

    /**
     * Supprime une commande
     */
    supprimerCommande: async (_: any, { commandeId }: { commandeId: string }) => {
      const success = await commandesService.supprimerCommande(commandeId);
      return {
        success,
        message: success ? 'Commande supprimée avec succès' : 'Erreur lors de la suppression',
        commande: null,
      };
    },
  },
};
