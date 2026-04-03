/**
 * Resolvers GraphQL pour le service Informations
 */

import { informationsService } from './informations.service.js';
import type { InformationInput } from '@clubmanager/types';

export const informationsResolvers = {
  Query: {
    /**
     * Récupérer toutes les informations actives
     */
    obtenirToutesLesInformations: async () => {
      try {
        return await informationsService.obtenirToutesLesInformations();
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur obtenirToutesLesInformations:', error);
        throw new Error(`Erreur lors de la récupération des informations: ${error.message}`);
      }
    },

    /**
     * Récupérer une information par ID
     */
    obtenirInformationParId: async (_: any, { id }: { id: number }) => {
      try {
        return await informationsService.obtenirInformationParId(id);
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur obtenirInformationParId:', error);
        throw new Error(`Erreur lors de la récupération de l'information: ${error.message}`);
      }
    },

    /**
     * Récupérer tous les status
     */
    obtenirLesStatus: async () => {
      try {
        return await informationsService.obtenirLesStatus();
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur obtenirLesStatus:', error);
        throw new Error(`Erreur lors de la récupération des status: ${error.message}`);
      }
    },

    /**
     * Récupérer tous les plans tarifaires
     */
    obtenirLesPlansTarifaires: async () => {
      try {
        return await informationsService.obtenirLesPlansTarifaires();
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur obtenirLesPlansTarifaires:', error);
        throw new Error(`Erreur lors de la récupération des plans tarifaires: ${error.message}`);
      }
    },

    /**
     * Récupérer tous les genres
     */
    obtenirLesGenres: async () => {
      try {
        return await informationsService.obtenirLesGenres();
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur obtenirLesGenres:', error);
        throw new Error(`Erreur lors de la récupération des genres: ${error.message}`);
      }
    },

    /**
     * Récupérer tous les grades
     */
    obtenirLesGrades: async () => {
      try {
        return await informationsService.obtenirLesGrades();
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur obtenirLesGrades:', error);
        throw new Error(`Erreur lors de la récupération des grades: ${error.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Ajouter une nouvelle information
     */
    ajouterInformation: async (_: any, { input }: { input: InformationInput }) => {
      try {
        return await informationsService.ajouterInformation(input);
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur ajouterInformation:', error);
        throw new Error(`Erreur lors de l'ajout de l'information: ${error.message}`);
      }
    },

    /**
     * Modifier une information
     */
    modifierInformation: async (_: any, { id, input }: { id: number; input: InformationInput }) => {
      try {
        return await informationsService.modifierInformation(id, input);
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur modifierInformation:', error);
        throw new Error(`Erreur lors de la modification de l'information: ${error.message}`);
      }
    },

    /**
     * Supprimer une information
     */
    supprimerInformation: async (_: any, { id }: { id: number }) => {
      try {
        return await informationsService.supprimerInformation(id);
      } catch (error: any) {
        console.error('❌ [InformationsResolver] Erreur supprimerInformation:', error);
        throw new Error(`Erreur lors de la suppression de l'information: ${error.message}`);
      }
    },
  },
};
