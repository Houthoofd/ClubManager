/**
 * Resolvers GraphQL pour le module Professeurs
 */

import { getProfesseursRepository } from '../../db/clients/professeurs/professeurs.repository.js';
import type {
  Professeur,
  ProfesseurComplet,
  CoursRecurrent,
  AjouterProfesseurDTO,
  AjouterProfesseursBatchDTO,
  ModifierStatutProfesseurDTO,
  ConfirmationResult,
  VerifyResultWithData,
  ProfesseursSearchResult,
} from '../../db/clients/professeurs/types.js';

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
 * Entrée pour ajouter un professeur
 */
interface AjouterProfesseurInput {
  id: number;
}

/**
 * Entrée pour ajouter plusieurs professeurs
 */
interface AjouterProfesseursBatchInput {
  utilisateurs: number[];
}

/**
 * Entrée pour modifier le statut
 */
interface ModifierStatutProfesseurInput {
  id: number;
  status_id: number;
}

/**
 * Entrée pour mettre à jour un utilisateur
 */
interface UpdateUtilisateurInput {
  firstName: string;
  lastName: string;
  email: string;
  genreId: number;
  dateOfBirth: string;
  gradeId: number;
}

/**
 * Resolvers pour les professeurs
 */
export const professeursResolvers = {
  Query: {
    /**
     * Récupérer tous les professeurs
     */
    professeurs: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.obtenirLesProfesseurs();
      } catch (error) {
        console.error('Erreur lors de la récupération des professeurs:', error);
        throw new Error('Impossible de récupérer les professeurs');
      }
    },

    /**
     * Récupérer un professeur par son ID
     */
    professeur: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        const professeur = await repository.obtenirProfesseurParId(id);
        return professeur || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération du professeur ${id}:`, error);
        throw new Error('Impossible de récupérer le professeur');
      }
    },

    /**
     * Récupérer le planning des cours d'un professeur
     */
    planningCoursProfesseur: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.obtenirPlanningCoursProfesseur(id);
      } catch (error) {
        console.error(`Erreur lors de la récupération du planning du professeur ${id}:`, error);
        throw new Error('Impossible de récupérer le planning');
      }
    },

    /**
     * Rechercher des professeurs
     */
    rechercherProfesseurs: async (
      _: any,
      { searchTerm, limit = 50, offset = 0 }: { searchTerm: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.rechercherProfesseurs(searchTerm, limit, offset);
      } catch (error) {
        console.error('Erreur lors de la recherche des professeurs:', error);
        throw new Error('Impossible de rechercher les professeurs');
      }
    },

    /**
     * Compter le nombre total de professeurs
     */
    compterProfesseurs: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.compterProfesseurs();
      } catch (error) {
        console.error('Erreur lors du comptage des professeurs:', error);
        throw new Error('Impossible de compter les professeurs');
      }
    },

    /**
     * Vérifier si un utilisateur est professeur
     */
    estProfesseur: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.professeurExiste(id);
      } catch (error) {
        console.error(`Erreur lors de la vérification du statut professeur pour l'utilisateur ${id}:`, error);
        return false;
      }
    },

    /**
     * Vérifier si un professeur a des cours actifs
     */
    professeurACoursActifs: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.aProfesseurDesCoursActifs(id);
      } catch (error) {
        console.error(`Erreur lors de la vérification des cours actifs du professeur ${id}:`, error);
        return false;
      }
    },

    /**
     * Compter les cours d'un professeur
     */
    compterCoursProfesseur: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.compterCoursProfesseur(id);
      } catch (error) {
        console.error(`Erreur lors du comptage des cours du professeur ${id}:`, error);
        return 0;
      }
    },

    /**
     * Vérifier les dépendances d'un professeur
     */
    verifierDependancesProfesseur: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.verifierDependancesProfesseur(id);
      } catch (error) {
        console.error(`Erreur lors de la vérification des dépendances du professeur ${id}:`, error);
        return {
          coursCount: 0,
          coursPonctuelsCount: 0,
          hasDependencies: false,
        };
      }
    },

    /**
     * Obtenir le statut d'un utilisateur
     */
    obtenirStatutUtilisateur: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getProfesseursRepository();
        return await repository.obtenirStatutUtilisateur(id);
      } catch (error) {
        console.error(`Erreur lors de la récupération du statut de l'utilisateur ${id}:`, error);
        return null;
      }
    },
  },

  Mutation: {
    /**
     * Ajouter/promouvoir un utilisateur en professeur
     */
    ajouterProfesseur: async (
      _: any,
      { input }: { input: AjouterProfesseurInput },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.ajouterUnProfesseur({ id: input.id });
      } catch (error) {
        console.error('Erreur lors de l\'ajout du professeur:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de l\'ajout du professeur',
        };
      }
    },

    /**
     * Ajouter/promouvoir plusieurs utilisateurs en professeurs
     */
    ajouterProfesseursBatch: async (
      _: any,
      { input }: { input: AjouterProfesseursBatchInput },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.ajouterUnProfesseur({
          utilisateurs: input.utilisateurs,
        });
      } catch (error) {
        console.error('Erreur lors de l\'ajout des professeurs en batch:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de l\'ajout des professeurs',
        };
      }
    },

    /**
     * Modifier le statut d'un professeur
     */
    modifierStatutProfesseur: async (
      _: any,
      { input }: { input: ModifierStatutProfesseurInput },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.modifierStatutProfesseur(input.id, input.status_id);
      } catch (error) {
        console.error('Erreur lors de la modification du statut:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la modification du statut',
        };
      }
    },

    /**
     * Retirer la promotion d'un professeur
     */
    retirerPromotionProfesseur: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.retirerPromotionProfesseur(id);
      } catch (error) {
        console.error('Erreur lors du retrait de la promotion:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors du retrait de la promotion',
        };
      }
    },

    /**
     * Assigner un professeur à un cours
     */
    assignerProfesseurACours: async (
      _: any,
      { coursId, professeurId }: { coursId: number; professeurId: number },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.assignerProfesseurACours(coursId, professeurId);
      } catch (error) {
        console.error('Erreur lors de l\'assignation du professeur au cours:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de l\'assignation du professeur au cours',
        };
      }
    },

    /**
     * Retirer un professeur d'un cours
     */
    retirerProfesseurDuCours: async (
      _: any,
      { coursId, professeurId }: { coursId: number; professeurId: number },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.retirerProfesseurDuCours(coursId, professeurId);
      } catch (error) {
        console.error('Erreur lors du retrait du professeur du cours:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors du retrait du professeur du cours',
        };
      }
    },

    /**
     * Retirer un professeur de tous ses cours
     */
    retirerProfesseurDeTousLesCours: async (
      _: any,
      { professeurId }: { professeurId: number },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.retirerProfesseurDeTousLesCours(professeurId);
      } catch (error) {
        console.error('Erreur lors du retrait du professeur de tous ses cours:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors du retrait du professeur de tous ses cours',
        };
      }
    },

    /**
     * Mettre à jour les informations d'un utilisateur/professeur
     */
    mettreAJourUtilisateur: async (
      _: any,
      { id, input }: { id: number; input: UpdateUtilisateurInput },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.mettreAJourUtilisateur(
          id,
          input.firstName,
          input.lastName,
          input.email,
          input.genreId,
          input.dateOfBirth,
          input.gradeId
        );
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la mise à jour de l\'utilisateur',
        };
      }
    },

    /**
     * Mettre à jour l'email d'un utilisateur
     */
    mettreAJourEmail: async (
      _: any,
      { id, email }: { id: number; email: string },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.mettreAJourEmail(id, email);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'email:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la mise à jour de l\'email',
        };
      }
    },

    /**
     * Mettre à jour le grade d'un utilisateur
     */
    mettreAJourGrade: async (
      _: any,
      { id, gradeId }: { id: number; gradeId: number },
      context: GraphQLContext
    ): Promise<ConfirmationResult> => {
      try {
        const repository = getProfesseursRepository();
        return await repository.mettreAJourGrade(id, gradeId);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du grade:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la mise à jour du grade',
        };
      }
    },
  },
};
