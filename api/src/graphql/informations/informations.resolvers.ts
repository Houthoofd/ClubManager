/**
 * Resolvers GraphQL pour le module Informations
 */

import { GraphQLError } from 'graphql';
import { getInformationsRepository } from '../../db/clients/informations/informations.repository.js';
import type {
  Information,
  InformationAvecRelations,
  CreateInformationData,
  UpdateInformationData,
  InformationSearchFilters,
} from '../../db/clients/informations/types.js';

/**
 * Contexte GraphQL
 */
interface GraphQLContext {
  user?: {
    id: number;
    role: string;
  };
}

/**
 * Helpers d'authentification
 */
const requireAuth = (context: GraphQLContext) => {
  if (!context.user) {
    throw new GraphQLError('Non authentifié', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
};

const requireAdmin = (context: GraphQLContext) => {
  const user = requireAuth(context);
  if (!['admin', 'manager'].includes(user.role?.toLowerCase())) {
    throw new GraphQLError('Permissions insuffisantes', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
};

/**
 * Resolvers pour les informations
 */
export const informationsResolvers = {
  Query: {
    /**
     * Récupérer toutes les informations actives
     */
    informations: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.findAll();
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        throw new GraphQLError('Impossible de récupérer les informations');
      }
    },

    /**
     * Récupérer toutes les informations avec relations
     */
    informationsAvecRelations: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.findAllWithRelations();
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        throw new GraphQLError('Impossible de récupérer les informations');
      }
    },

    /**
     * Récupérer une information par son ID
     */
    information: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        const info = await repository.findById(id);
        return info || null;
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'information:', error);
        throw new GraphQLError('Impossible de récupérer l\'information');
      }
    },

    /**
     * Récupérer une information avec relations par son ID
     */
    informationAvecRelations: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getInformationsRepository();
        const info = await repository.findByIdWithRelations(id);
        return info || null;
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'information:', error);
        throw new GraphQLError('Impossible de récupérer l\'information');
      }
    },

    /**
     * Récupérer les informations par catégorie
     */
    informationsByCategorie: async (
      _: any,
      { categorieId }: { categorieId: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getInformationsRepository();
        return await repository.findByCategorie(categorieId);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        throw new GraphQLError('Impossible de récupérer les informations');
      }
    },

    /**
     * Récupérer les informations par auteur
     */
    informationsByAuteur: async (
      _: any,
      { auteurId }: { auteurId: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getInformationsRepository();
        return await repository.findByAuteur(auteurId);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        throw new GraphQLError('Impossible de récupérer les informations');
      }
    },

    /**
     * Récupérer les informations récentes
     */
    informationsRecentes: async (
      _: any,
      { days = 7, limit = 10 }: { days?: number; limit?: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getInformationsRepository();
        return await repository.findRecent(days, limit);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        throw new GraphQLError('Impossible de récupérer les informations');
      }
    },

    /**
     * Récupérer les informations prioritaires
     */
    informationsPrioritaires: async (
      _: any,
      { limit = 10 }: { limit?: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getInformationsRepository();
        return await repository.findHighPriority(limit);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        throw new GraphQLError('Impossible de récupérer les informations');
      }
    },

    /**
     * Rechercher des informations avec filtres
     */
    searchInformations: async (
      _: any,
      { filters }: { filters: InformationSearchFilters },
      context: GraphQLContext
    ) => {
      try {
        const repository = getInformationsRepository();
        return await repository.search(filters);
      } catch (error) {
        console.error('Erreur lors de la recherche des informations:', error);
        throw new GraphQLError('Impossible de rechercher les informations');
      }
    },

    /**
     * Récupérer tous les status
     */
    allStatus: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.getAllStatus();
      } catch (error) {
        console.error('Erreur lors de la récupération des status:', error);
        throw new GraphQLError('Impossible de récupérer les status');
      }
    },

    /**
     * Récupérer tous les genres
     */
    allGenres: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.getAllGenres();
      } catch (error) {
        console.error('Erreur lors de la récupération des genres:', error);
        throw new GraphQLError('Impossible de récupérer les genres');
      }
    },

    /**
     * Récupérer tous les grades
     */
    allGrades: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.getAllGrades();
      } catch (error) {
        console.error('Erreur lors de la récupération des grades:', error);
        throw new GraphQLError('Impossible de récupérer les grades');
      }
    },

    /**
     * Récupérer tous les plans tarifaires
     */
    allPlansTarifaires: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.getAllPlansTarifaires();
      } catch (error) {
        console.error('Erreur lors de la récupération des plans tarifaires:', error);
        throw new GraphQLError('Impossible de récupérer les plans tarifaires');
      }
    },

    /**
     * Récupérer toutes les catégories d'informations
     */
    allCategories: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.getAllCategories();
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        throw new GraphQLError('Impossible de récupérer les catégories');
      }
    },

    /**
     * Récupérer tous les référentiels en une seule requête
     */
    referentiels: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        const [status, genres, grades, plansTarifaires, categories] = await Promise.all([
          repository.getAllStatus(),
          repository.getAllGenres(),
          repository.getAllGrades(),
          repository.getAllPlansTarifaires(),
          repository.getAllCategories(),
        ]);

        return {
          status,
          genres,
          grades,
          plansTarifaires,
          categories,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des référentiels:', error);
        throw new GraphQLError('Impossible de récupérer les référentiels');
      }
    },

    /**
     * Obtenir les statistiques des informations
     */
    informationsStatistiques: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.getStatistiques();
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw new GraphQLError('Impossible de récupérer les statistiques');
      }
    },

    /**
     * Vérifier si une information existe
     */
    informationExists: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getInformationsRepository();
        return await repository.exists(id);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'information:', error);
        throw new GraphQLError('Impossible de vérifier l\'information');
      }
    },
  },

  Mutation: {
    /**
     * Créer une nouvelle information
     */
    createInformation: async (
      _: any,
      { data }: { data: CreateInformationData },
      context: GraphQLContext
    ) => {
      try {
        requireAuth(context);
        const repository = getInformationsRepository();
        return await repository.create(data);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Erreur lors de la création de l\'information:', error);
        throw new GraphQLError('Impossible de créer l\'information');
      }
    },

    /**
     * Mettre à jour une information
     */
    updateInformation: async (
      _: any,
      { id, data }: { id: number; data: UpdateInformationData },
      context: GraphQLContext
    ) => {
      try {
        requireAuth(context);
        const repository = getInformationsRepository();

        // Vérifier si l'information existe
        const exists = await repository.exists(id);
        if (!exists) {
          return {
            isConfirm: false,
            message: 'Information non trouvée',
          };
        }

        return await repository.update(id, data);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Erreur lors de la mise à jour de l\'information:', error);
        throw new GraphQLError('Impossible de mettre à jour l\'information');
      }
    },

    /**
     * Supprimer une information (soft delete)
     */
    deleteInformation: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ) => {
      try {
        requireAuth(context);
        const repository = getInformationsRepository();
        return await repository.softDelete(id);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Erreur lors de la suppression de l\'information:', error);
        throw new GraphQLError('Impossible de supprimer l\'information');
      }
    },

    /**
     * Supprimer définitivement une information
     */
    permanentDeleteInformation: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ) => {
      try {
        requireAdmin(context);
        const repository = getInformationsRepository();
        return await repository.delete(id);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Erreur lors de la suppression définitive de l\'information:', error);
        throw new GraphQLError('Impossible de supprimer définitivement l\'information');
      }
    },

    /**
     * Archiver une information
     */
    archiveInformation: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ) => {
      try {
        requireAuth(context);
        const repository = getInformationsRepository();
        return await repository.archive(id);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Erreur lors de l\'archivage de l\'information:', error);
        throw new GraphQLError('Impossible d\'archiver l\'information');
      }
    },

    /**
     * Restaurer une information archivée
     */
    restoreInformation: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ) => {
      try {
        requireAuth(context);
        const repository = getInformationsRepository();
        return await repository.restore(id);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Erreur lors de la restauration de l\'information:', error);
        throw new GraphQLError('Impossible de restaurer l\'information');
      }
    },

    /**
     * Publier une information
     */
    publishInformation: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ) => {
      try {
        requireAuth(context);
        const repository = getInformationsRepository();
        return await repository.publish(id);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Erreur lors de la publication de l\'information:', error);
        throw new GraphQLError('Impossible de publier l\'information');
      }
    },
  },

  // Field Resolvers
  Information: {
    date_creation: (parent: Information) => {
      return parent.date_creation ? new Date(parent.date_creation).toISOString() : null;
    },
    date_modification: (parent: Information) => {
      return parent.date_modification ? new Date(parent.date_modification).toISOString() : null;
    },
    created_at: (parent: Information) => {
      return parent.created_at ? new Date(parent.created_at).toISOString() : null;
    },
    updated_at: (parent: Information) => {
      return parent.updated_at ? new Date(parent.updated_at).toISOString() : null;
    },
  },

  InformationAvecRelations: {
    date_creation: (parent: InformationAvecRelations) => {
      return parent.date_creation ? new Date(parent.date_creation).toISOString() : null;
    },
    date_modification: (parent: InformationAvecRelations) => {
      return parent.date_modification ? new Date(parent.date_modification).toISOString() : null;
    },
  },
};
