/**
 * Resolvers GraphQL pour le service Compte
 */

import { compteService } from './compte.service.js';

export const compteResolvers = {
  Query: {
    /**
     * Récupère un compte par ID
     */
    compte: async (_: any, { id }: { id: number }) => {
      return compteService.obtenirCompteParId(id);
    },

    /**
     * Récupère un compte par prénom et nom
     */
    compteParNom: async (_: any, { prenom, nom }: { prenom: string; nom: string }) => {
      return compteService.obtenirCompteParNomPrenom(prenom, nom);
    },

    /**
     * Récupère les informations complètes d'un compte
     */
    informationsCompte: async (_: any, { prenom, nom }: { prenom: string; nom: string }) => {
      return compteService.obtenirInformationsCompte(prenom, nom);
    },
  },

  Mutation: {
    /**
     * Modifie un compte
     */
    modifierCompte: async (_: any, { id, updates }: { id: number; updates: any }) => {
      const compte = await compteService.modifierCompte(id, updates);
      if (!compte) {
        return {
          success: false,
          message: 'Compte introuvable',
          compte: null,
        };
      }
      return {
        success: true,
        message: 'Compte modifié avec succès',
        compte,
      };
    },

    /**
     * Modifie un compte avec conversion automatique
     */
    modifierCompteAvecConversion: async (_: any, { id, updates }: { id: number; updates: any }) => {
      try {
        const compte = await compteService.modifierCompteAvecConversion(id, updates);
        if (!compte) {
          return {
            success: false,
            message: 'Compte introuvable',
            compte: null,
          };
        }
        return {
          success: true,
          message: 'Compte modifié avec succès',
          compte,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la modification',
          compte: null,
        };
      }
    },

    /**
     * Supprime un compte
     */
    supprimerCompte: async (_: any, { id }: { id: number }) => {
      const success = await compteService.supprimerCompte(id);
      return {
        success,
        message: success ? 'Compte supprimé avec succès' : 'Erreur lors de la suppression',
        compte: null,
      };
    },

    /**
     * Met à jour le mot de passe
     */
    mettreAJourMotDePasse: async (_: any, { input }: { input: any }) => {
      const success = await compteService.mettreAJourMotDePasse(input);
      return {
        success,
        message: success ? 'Mot de passe mis à jour' : 'Erreur lors de la mise à jour',
      };
    },
  },
};
