/**
 * Resolvers GraphQL pour le service Statistiques
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import { GraphQLError } from 'graphql';
import { StatistiquesService } from './statistiques.service.js';
import { StatistiquesError } from '@clubmanager/types';

export const statistiquesResolvers = (prisma: typeof defaultPrisma) => {
  const statistiquesService = new StatistiquesService(prisma);

  return {
    Query: {
      /**
       * Obtenir les statistiques générales du club
       */
      statistiquesGenerales: async (_: any, __: any, context: any) => {
        try {
          return await statistiquesService.obtenirStatistiquesGenerales();
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les statistiques par cours
       */
      statistiquesParCours: async (_: any, args: { dateDebut?: string; dateFin?: string }, context: any) => {
        try {
          const dateDebut = args.dateDebut ? new Date(args.dateDebut) : undefined;
          const dateFin = args.dateFin ? new Date(args.dateFin) : undefined;
          return await statistiquesService.obtenirStatistiquesParCours(dateDebut, dateFin);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les statistiques de présence globales
       */
      statistiquesPresence: async (_: any, args: { joursHistorique?: number }, context: any) => {
        try {
          return await statistiquesService.obtenirStatistiquesPresence(args.joursHistorique);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les statistiques de présence par mois
       */
      statistiquesPresenceParMois: async (_: any, args: { moisHistorique?: number }, context: any) => {
        try {
          return await statistiquesService.obtenirStatistiquesPresenceParMois(args.moisHistorique);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir la fréquentation d'un utilisateur
       */
      frequentationUtilisateur: async (_: any, args: { utilisateurId: number }, context: any) => {
        try {
          return await statistiquesService.obtenirFrequentationUtilisateur(args.utilisateurId);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les présences par mois d'un utilisateur
       */
      presencesParMois: async (_: any, args: { utilisateurId: number; valide?: boolean }, context: any) => {
        try {
          return await statistiquesService.obtenirPresencesParMois(args.utilisateurId, args.valide);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les présences validées par mois d'un utilisateur
       */
      presencesValideesParMois: async (_: any, args: { utilisateurId: number }, context: any) => {
        try {
          return await statistiquesService.obtenirPresencesValideesParMois(args.utilisateurId);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les présences non validées par mois d'un utilisateur
       */
      presencesNonValideesParMois: async (_: any, args: { utilisateurId: number }, context: any) => {
        try {
          return await statistiquesService.obtenirPresencesNonValideesParMois(args.utilisateurId);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir la progression d'un utilisateur
       */
      progressionUtilisateur: async (_: any, args: { utilisateurId: number }, context: any) => {
        try {
          return await statistiquesService.obtenirProgressionUtilisateur(args.utilisateurId);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir l'évolution des inscriptions
       */
      evolutionInscriptions: async (_: any, args: { joursHistorique?: number }, context: any) => {
        try {
          return await statistiquesService.obtenirEvolutionInscriptions(args.joursHistorique);
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les statistiques financières
       */
      statistiquesFinancieres: async (_: any, __: any, context: any) => {
        try {
          return await statistiquesService.obtenirStatistiquesFinancieres();
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir les statistiques des membres
       */
      statistiquesMembres: async (_: any, __: any, context: any) => {
        try {
          return await statistiquesService.obtenirStatistiquesMembres();
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      },

      /**
       * Obtenir le tableau de bord complet
       */
      tableauDeBord: async (_: any, __: any, context: any) => {
        try {
          return await statistiquesService.obtenirTableauDeBord();
        } catch (error: unknown) {
          if (error instanceof StatistiquesError) {
            throw new GraphQLError(error.message, {
              extensions: { code: error.code, statusCode: error.statusCode }
            });
          }
          throw new GraphQLError((error as Error).message);
        }
      }
    }
  };
};
