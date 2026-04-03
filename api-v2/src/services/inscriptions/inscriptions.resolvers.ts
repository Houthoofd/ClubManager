/**
 * Resolvers GraphQL pour le service Inscriptions
 */

import { inscriptionsService } from './inscriptions.service.js';
import type {
  Inscription,
  InscriptionInput,
  InscriptionUpdateInput,
  InscriptionResult,
  InscriptionStats,
  InscriptionValidation,
} from '@clubmanager/types';

/**
 * Resolvers pour les queries
 */
export const inscriptionsQueries = {
  /**
   * Obtenir toutes les inscriptions
   */
  obtenirToutesLesInscriptions: async (): Promise<Inscription[]> => {
    try {
      return await inscriptionsService.obtenirToutesLesInscriptions();
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur obtenirToutesLesInscriptions:', error);
      throw new Error('Erreur lors de la récupération des inscriptions');
    }
  },

  /**
   * Obtenir une inscription par ID
   */
  obtenirInscriptionParId: async (_: any, { id }: { id: number }): Promise<Inscription | null> => {
    try {
      return await inscriptionsService.obtenirInscriptionParId(id);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur obtenirInscriptionParId:', error);
      throw new Error(`Erreur lors de la récupération de l'inscription ${id}`);
    }
  },

  /**
   * Obtenir les inscriptions d'un utilisateur
   */
  obtenirInscriptionsParUtilisateur: async (
    _: any,
    { utilisateurId }: { utilisateurId: number }
  ): Promise<Inscription[]> => {
    try {
      return await inscriptionsService.obtenirInscriptionsParUtilisateur(utilisateurId);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur obtenirInscriptionsParUtilisateur:', error);
      throw new Error(`Erreur lors de la récupération des inscriptions de l'utilisateur ${utilisateurId}`);
    }
  },

  /**
   * Obtenir les inscriptions pour un cours
   */
  obtenirInscriptionsParCours: async (
    _: any,
    { coursId }: { coursId: number }
  ): Promise<Inscription[]> => {
    try {
      return await inscriptionsService.obtenirInscriptionsParCours(coursId);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur obtenirInscriptionsParCours:', error);
      throw new Error(`Erreur lors de la récupération des inscriptions du cours ${coursId}`);
    }
  },

  /**
   * Obtenir les inscriptions actives
   */
  obtenirInscriptionsActives: async (): Promise<Inscription[]> => {
    try {
      return await inscriptionsService.obtenirInscriptionsActives();
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur obtenirInscriptionsActives:', error);
      throw new Error('Erreur lors de la récupération des inscriptions actives');
    }
  },

  /**
   * Vérifier la disponibilité d'une inscription
   */
  verifierDisponibiliteInscription: async (
    _: any,
    { utilisateurId, coursId }: { utilisateurId: number; coursId: number }
  ): Promise<InscriptionValidation> => {
    try {
      return await inscriptionsService.verifierDisponibilite(utilisateurId, coursId);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur verifierDisponibiliteInscription:', error);
      throw new Error('Erreur lors de la vérification de disponibilité');
    }
  },

  /**
   * Compter les inscriptions pour un cours
   */
  compterInscriptionsCours: async (
    _: any,
    { coursId }: { coursId: number }
  ): Promise<number> => {
    try {
      return await inscriptionsService.compterInscriptionsCours(coursId);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur compterInscriptionsCours:', error);
      throw new Error(`Erreur lors du comptage des inscriptions du cours ${coursId}`);
    }
  },

  /**
   * Vérifier si un cours est complet
   */
  verifierCoursComplet: async (
    _: any,
    { coursId }: { coursId: number }
  ): Promise<boolean> => {
    try {
      return await inscriptionsService.verifierCoursComplet(coursId);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur verifierCoursComplet:', error);
      throw new Error(`Erreur lors de la vérification de disponibilité du cours ${coursId}`);
    }
  },

  /**
   * Obtenir les statistiques des inscriptions
   */
  obtenirStatistiquesInscriptions: async (): Promise<InscriptionStats> => {
    try {
      return await inscriptionsService.obtenirStatistiques();
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur obtenirStatistiquesInscriptions:', error);
      throw new Error('Erreur lors du calcul des statistiques');
    }
  },

  /**
   * Obtenir le nombre d'inscriptions sur une période
   */
  obtenirInscriptionsParPeriode: async (
    _: any,
    { dateDebut, dateFin }: { dateDebut: string; dateFin: string }
  ): Promise<number> => {
    try {
      return await inscriptionsService.obtenirInscriptionsParPeriode(
        new Date(dateDebut),
        new Date(dateFin)
      );
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur obtenirInscriptionsParPeriode:', error);
      throw new Error('Erreur lors du calcul des inscriptions par période');
    }
  },
};

/**
 * Resolvers pour les mutations
 */
export const inscriptionsMutations = {
  /**
   * Créer une inscription
   */
  creerInscription: async (
    _: any,
    { input }: { input: InscriptionInput }
  ): Promise<InscriptionResult> => {
    try {
      return await inscriptionsService.creerInscription(input);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur creerInscription:', error);
      return {
        success: false,
        message: 'Erreur lors de la création de l\'inscription',
      };
    }
  },

  /**
   * Modifier une inscription
   */
  modifierInscription: async (
    _: any,
    { id, input }: { id: number; input: InscriptionUpdateInput }
  ): Promise<InscriptionResult> => {
    try {
      return await inscriptionsService.modifierInscription(id, input);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur modifierInscription:', error);
      return {
        success: false,
        message: 'Erreur lors de la modification de l\'inscription',
      };
    }
  },

  /**
   * Supprimer une inscription
   */
  supprimerInscription: async (
    _: any,
    { id }: { id: number }
  ): Promise<InscriptionResult> => {
    try {
      return await inscriptionsService.supprimerInscription(id);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur supprimerInscription:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression de l\'inscription',
      };
    }
  },

  /**
   * Annuler une inscription
   */
  annulerInscription: async (
    _: any,
    { id }: { id: number }
  ): Promise<InscriptionResult> => {
    try {
      return await inscriptionsService.annulerInscription(id);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur annulerInscription:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'annulation de l\'inscription',
      };
    }
  },

  /**
   * Activer une inscription
   */
  activerInscription: async (
    _: any,
    { id }: { id: number }
  ): Promise<InscriptionResult> => {
    try {
      return await inscriptionsService.activerInscription(id);
    } catch (error) {
      console.error('❌ [InscriptionsResolvers] Erreur activerInscription:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'activation de l\'inscription',
      };
    }
  },
};

// Export combiné pour faciliter l'import
export const inscriptionsResolvers = {
  Query: inscriptionsQueries,
  Mutation: inscriptionsMutations,
};
