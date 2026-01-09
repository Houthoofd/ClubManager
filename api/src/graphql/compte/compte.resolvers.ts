/**
 * Resolvers GraphQL pour le module Compte
 */

import { getCompteRepository } from '../../db/clients/compte/compte.repository.js';
import type {
  UpdateCompteData,
  UpdateUtilisateurData,
  CompteInfo,
  Utilisateur,
  UtilisateurAvecRelations,
} from '../../db/clients/compte/types.js';

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
 * Résultat de recherche avec pagination
 */
interface SearchResult {
  utilisateurs: UtilisateurAvecRelations[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Filtres de recherche
 */
interface SearchFilters {
  search?: string;
  genre_id?: number;
  grade_id?: number;
  abonnement_id?: number;
  status_id?: number;
  age_min?: number;
  age_max?: number;
  created_after?: string;
  created_before?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Resolvers pour les comptes
 */
export const compteResolvers = {
  Query: {
    /**
     * Récupérer tous les utilisateurs actifs
     */
    utilisateurs: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        return await repository.findAllActive();
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        throw new Error('Impossible de récupérer les utilisateurs');
      }
    },

    /**
     * Récupérer tous les utilisateurs avec relations
     */
    utilisateursAvecRelations: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        return await repository.findAllWithRelations();
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        throw new Error('Impossible de récupérer les utilisateurs');
      }
    },

    /**
     * Récupérer un utilisateur par son ID
     */
    utilisateur: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        const user = await repository.findById(id);
        return user || null;
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        throw new Error('Impossible de récupérer l\'utilisateur');
      }
    },

    /**
     * Récupérer un utilisateur avec relations par son ID
     */
    utilisateurAvecRelations: async (
      _: any,
      { id }: { id: number },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();
        const user = await repository.findByIdWithRelations(id);
        return user || null;
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        throw new Error('Impossible de récupérer l\'utilisateur');
      }
    },

    /**
     * Récupérer un utilisateur par son nom d'utilisateur
     */
    utilisateurByUsername: async (
      _: any,
      { username }: { username: string },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();
        const user = await repository.findByUsername(username);
        return user || null;
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        throw new Error('Impossible de récupérer l\'utilisateur');
      }
    },

    /**
     * Récupérer un utilisateur par son email
     */
    utilisateurByEmail: async (
      _: any,
      { email }: { email: string },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();
        const user = await repository.findByEmail(email);
        return user || null;
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        throw new Error('Impossible de récupérer l\'utilisateur');
      }
    },

    /**
     * Récupérer les informations basiques d'un compte
     */
    compteInfo: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        const info = await repository.getCompteInfo(id);
        return info || null;
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du compte:', error);
        throw new Error('Impossible de récupérer les informations du compte');
      }
    },

    /**
     * Rechercher des utilisateurs avec filtres
     */
    searchUtilisateurs: async (
      _: any,
      { filters }: { filters: SearchFilters },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();
        const limit = filters.limit || 20;
        const offset = filters.offset || 0;
        const page = Math.floor(offset / limit) + 1;

        const results = await repository.search(filters);
        const total = results.length;
        const totalPages = Math.ceil(total / limit);

        // Pagination côté application (à améliorer avec SQL LIMIT/OFFSET)
        const paginatedResults = results.slice(offset, offset + limit);

        return {
          utilisateurs: paginatedResults,
          total,
          page,
          totalPages,
        };
      } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        throw new Error('Impossible de rechercher les utilisateurs');
      }
    },

    /**
     * Vérifier si un email est disponible
     */
    checkEmailAvailability: async (
      _: any,
      { email }: { email: string },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();
        const exists = await repository.emailExists(email);
        return {
          available: !exists,
          message: exists ? 'Cet email est déjà utilisé' : 'Email disponible',
        };
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        throw new Error('Impossible de vérifier la disponibilité de l\'email');
      }
    },

    /**
     * Vérifier si un nom d'utilisateur est disponible
     */
    checkUsernameAvailability: async (
      _: any,
      { username }: { username: string },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();
        const exists = await repository.usernameExists(username);
        return {
          available: !exists,
          message: exists
            ? 'Ce nom d\'utilisateur est déjà utilisé'
            : 'Nom d\'utilisateur disponible',
        };
      } catch (error) {
        console.error('Erreur lors de la vérification du nom d\'utilisateur:', error);
        throw new Error('Impossible de vérifier la disponibilité du nom d\'utilisateur');
      }
    },

    /**
     * Vérifier si un utilisateur est actif
     */
    isUtilisateurActive: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        return await repository.isActive(id);
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        throw new Error('Impossible de vérifier le statut de l\'utilisateur');
      }
    },

    /**
     * Récupérer tous les genres
     */
    genres: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        return await repository.getAllGenres();
      } catch (error) {
        console.error('Erreur lors de la récupération des genres:', error);
        throw new Error('Impossible de récupérer les genres');
      }
    },

    /**
     * Récupérer tous les grades
     */
    grades: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        return await repository.getAllGrades();
      } catch (error) {
        console.error('Erreur lors de la récupération des grades:', error);
        throw new Error('Impossible de récupérer les grades');
      }
    },

    /**
     * Récupérer tous les status
     */
    status: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        return await repository.getAllStatus();
      } catch (error) {
        console.error('Erreur lors de la récupération des status:', error);
        throw new Error('Impossible de récupérer les status');
      }
    },

    /**
     * Récupérer tous les plans tarifaires
     */
    plansTarifaires: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();
        return await repository.getAllPlans();
      } catch (error) {
        console.error('Erreur lors de la récupération des plans tarifaires:', error);
        throw new Error('Impossible de récupérer les plans tarifaires');
      }
    },

    /**
     * Obtenir les statistiques des comptes
     */
    comptesStatistiques: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();

        const [allUsers, countByStatus, countByGenre, countByAbonnement] = await Promise.all([
          repository.findAllWithRelations(),
          repository.countByStatus(),
          repository.countByGenre(),
          repository.countByAbonnement(),
        ]);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const nouveauxCeMois = allUsers.filter((user: any) => {
          const createdAt = new Date(user.created_at || 0);
          return createdAt >= firstDayOfMonth;
        }).length;

        // Compter actifs/inactifs
        const utilisateursActifs = countByStatus['actif'] || 0;
        const utilisateursInactifs = countByStatus['inactif'] || 0;

        // Convertir les comptages en tableaux pour GraphQL
        const par_genre = Object.entries(countByGenre).map(([genre, count]) => ({
          genre,
          count,
        }));

        const par_status = Object.entries(countByStatus).map(([status, count]) => ({
          status,
          count,
        }));

        const par_abonnement = Object.entries(countByAbonnement).map(([abonnement, count]) => ({
          abonnement,
          count,
        }));

        return {
          total_utilisateurs: allUsers.length,
          utilisateurs_actifs: utilisateursActifs,
          utilisateurs_inactifs: utilisateursInactifs,
          nouveaux_ce_mois: nouveauxCeMois,
          par_genre,
          par_status,
          par_abonnement,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw new Error('Impossible de récupérer les statistiques');
      }
    },
  },

  Mutation: {
    /**
     * Mettre à jour les informations d'un compte (utilisateur final)
     */
    updateCompteInfo: async (
      _: any,
      { id, data }: { id: number; data: UpdateCompteData },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();

        // Vérifier que l'utilisateur existe
        const exists = await repository.exists(id);
        if (!exists) {
          throw new Error('Utilisateur introuvable');
        }

        // Vérifier l'email s'il est modifié
        if (data.email) {
          const emailExists = await repository.emailExists(data.email, id);
          if (emailExists) {
            throw new Error('Cet email est déjà utilisé');
          }
        }

        await repository.updateCompteInfo(id, data);
        const updatedInfo = await repository.getCompteInfo(id);

        if (!updatedInfo) {
          throw new Error('Impossible de récupérer les informations mises à jour');
        }

        return updatedInfo;
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du compte:', error);
        throw new Error(error.message || 'Impossible de mettre à jour le compte');
      }
    },

    /**
     * Mettre à jour un utilisateur (admin)
     */
    updateUtilisateur: async (
      _: any,
      { id, data }: { id: number; data: UpdateUtilisateurData },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();

        // Vérifier que l'utilisateur existe
        const exists = await repository.exists(id);
        if (!exists) {
          throw new Error('Utilisateur introuvable');
        }

        // Vérifier l'email s'il est modifié
        if (data.email) {
          const emailExists = await repository.emailExists(data.email, id);
          if (emailExists) {
            throw new Error('Cet email est déjà utilisé');
          }
        }

        await repository.updateUtilisateur(id, data);
        const updatedUser = await repository.findById(id);

        if (!updatedUser) {
          throw new Error('Impossible de récupérer l\'utilisateur mis à jour');
        }

        return updatedUser;
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        throw new Error(error.message || 'Impossible de mettre à jour l\'utilisateur');
      }
    },

    /**
     * Mettre à jour le mot de passe
     */
    updatePassword: async (
      _: any,
      {
        id,
        data,
      }: {
        id: number;
        data: { currentPassword?: string; newPassword: string };
      },
      context: GraphQLContext
    ) => {
      try {
        const repository = getCompteRepository();

        // Vérifier que l'utilisateur existe
        const exists = await repository.exists(id);
        if (!exists) {
          throw new Error('Utilisateur introuvable');
        }

        // TODO: Vérifier le currentPassword si fourni
        // TODO: Hasher le newPassword avant de l'enregistrer
        // Pour l'instant, on suppose que le hash est déjà fait côté client ou middleware

        await repository.updatePassword(id, data.newPassword);

        return {
          success: true,
          message: 'Mot de passe mis à jour avec succès',
        };
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du mot de passe:', error);
        return {
          success: false,
          message: error.message || 'Impossible de mettre à jour le mot de passe',
        };
      }
    },

    /**
     * Désactiver un compte (soft delete)
     */
    softDeleteCompte: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();

        // Vérifier que l'utilisateur existe
        const exists = await repository.exists(id);
        if (!exists) {
          throw new Error('Utilisateur introuvable');
        }

        await repository.softDelete(id);

        return {
          success: true,
          message: 'Compte désactivé avec succès',
        };
      } catch (error: any) {
        console.error('Erreur lors de la désactivation du compte:', error);
        return {
          success: false,
          message: error.message || 'Impossible de désactiver le compte',
        };
      }
    },

    /**
     * Réactiver un compte
     */
    reactivateCompte: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getCompteRepository();

        // Vérifier que l'utilisateur existe
        const exists = await repository.exists(id);
        if (!exists) {
          throw new Error('Utilisateur introuvable');
        }

        await repository.reactivate(id);

        return {
          success: true,
          message: 'Compte réactivé avec succès',
        };
      } catch (error: any) {
        console.error('Erreur lors de la réactivation du compte:', error);
        return {
          success: false,
          message: error.message || 'Impossible de réactiver le compte',
        };
      }
    },
  },

  /**
   * Resolvers pour les champs personnalisés
   */
  Utilisateur: {
    /**
     * Formater les dates
     */
    date_of_birth: (parent: any) => {
      if (!parent.date_of_birth) return null;
      return parent.date_of_birth instanceof Date
        ? parent.date_of_birth.toISOString()
        : parent.date_of_birth;
    },

    created_at: (parent: any) => {
      if (!parent.created_at) return null;
      return parent.created_at instanceof Date
        ? parent.created_at.toISOString()
        : parent.created_at;
    },

    updated_at: (parent: any) => {
      if (!parent.updated_at) return null;
      return parent.updated_at instanceof Date
        ? parent.updated_at.toISOString()
        : parent.updated_at;
    },
  },

  UtilisateurAvecRelations: {
    /**
     * Formater les dates
     */
    date_of_birth: (parent: any) => {
      if (!parent.date_of_birth) return null;
      return parent.date_of_birth instanceof Date
        ? parent.date_of_birth.toISOString()
        : parent.date_of_birth;
    },
  },

  CompteInfo: {
    /**
     * Formater les dates
     */
    date_of_birth: (parent: any) => {
      if (!parent.date_of_birth) return null;
      return parent.date_of_birth instanceof Date
        ? parent.date_of_birth.toISOString()
        : parent.date_of_birth;
    },
  },
};
