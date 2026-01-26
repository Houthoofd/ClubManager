/**
 * Resolvers GraphQL pour le service Professeurs
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import { GraphQLError } from 'graphql';
import { ProfesseursService } from './professeurs.service.js';
import { ProfesseursError } from '@clubmanager/types';

export const professeursResolvers = (prisma: typeof defaultPrisma) => {
  const professeursService = new ProfesseursService(prisma);

  return {
    Query: {
      /**
       * Récupère tous les professeurs avec filtres et pagination
       */
      obtenirProfesseurs: async (
        _: any,
        {
          status_id,
          grade_id,
          genre_id,
          recherche,
          limit,
          offset
        }: {
          status_id?: number;
          grade_id?: number;
          genre_id?: number;
          recherche?: string;
          limit?: number;
          offset?: number;
        }
      ) => {
        try {
          return await professeursService.obtenirProfesseurs({
            status_id,
            grade_id,
            genre_id,
            recherche,
            limit,
            offset
          });
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère un professeur par son ID
       */
      obtenirProfesseurParId: async (_: any, { id }: { id: number }) => {
        try {
          const professeur = await professeursService.obtenirProfesseurParId(id);
          if (!professeur) {
            throw new ProfesseursError('Professeur introuvable', 'PROFESSEUR_INTROUVABLE');
          }
          return professeur;
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère le planning des cours d'un professeur
       */
      obtenirPlanningProfesseur: async (
        _: any,
        { professeurId }: { professeurId: number }
      ) => {
        try {
          return await professeursService.obtenirPlanningProfesseur(professeurId);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un professeur existe
       */
      professeurExiste: async (_: any, { id }: { id: number }) => {
        try {
          return await professeursService.professeurExiste(id);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un utilisateur est professeur
       */
      estProfesseur: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await professeursService.estProfesseur(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Compte le nombre de cours d'un professeur
       */
      compterCoursProfesseur: async (
        _: any,
        { professeurId }: { professeurId: number }
      ) => {
        try {
          return await professeursService.compterCoursProfesseur(professeurId);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Compte le nombre d'élèves d'un professeur
       */
      compterElevesProfesseur: async (
        _: any,
        { professeurId }: { professeurId: number }
      ) => {
        try {
          return await professeursService.compterElevesProfesseur(professeurId);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques générales des professeurs
       */
      statistiquesProfesseurs: async () => {
        try {
          return await professeursService.statistiquesGenerales();
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques d'un professeur
       */
      statistiquesProfesseur: async (
        _: any,
        { professeurId }: { professeurId: number }
      ) => {
        try {
          return await professeursService.statistiquesProfesseur(professeurId);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Recherche des professeurs par nom
       */
      rechercherProfesseurs: async (
        _: any,
        { recherche }: { recherche: string }
      ) => {
        try {
          return await professeursService.rechercherProfesseurs(recherche);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      }
    },

    Mutation: {
      /**
       * Ajoute un ou plusieurs professeurs
       */
      ajouterProfesseur: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await professeursService.ajouterProfesseur(input);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Modifie le statut d'un professeur
       */
      modifierStatutProfesseur: async (
        _: any,
        { id, status_id }: { id: number; status_id: number }
      ) => {
        try {
          return await professeursService.modifierStatutProfesseur({
            id,
            status_id
          });
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Retire la promotion professeur
       */
      retirerPromotionProfesseur: async (
        _: any,
        { id, motif }: { id: number; motif?: string }
      ) => {
        try {
          return await professeursService.retirerPromotionProfesseur(id, motif);
        } catch (error: unknown) {
          if (error instanceof ProfesseursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      }
    }
  };
};

// Export d'un resolver par défaut
export const professeursResolversDefault = professeursResolvers(defaultPrisma);
