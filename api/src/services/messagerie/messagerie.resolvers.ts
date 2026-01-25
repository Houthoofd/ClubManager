/**
 * Resolvers GraphQL pour le service Messagerie
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import { MessagerieService } from './messagerie.service.js';
import { MessagerieError } from '@clubmanager/types';

export const messagerieResolvers = (prisma) => {
  const messagerieService = new MessagerieService(prisma);

  return {
    Query: {
      /**
       * Récupère tous les messages d'un utilisateur
       */
      obtenirTousMessages: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await messagerieService.obtenirTousMessages(utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère les messages personnalisés d'un utilisateur
       */
      obtenirMessagesPersonnalises: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await messagerieService.obtenirMessagesPersonnalises(utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère les messages standards d'un utilisateur
       */
      obtenirMessagesUtilisateur: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await messagerieService.obtenirMessagesUtilisateur(utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère un message par son ID
       */
      obtenirMessageParId: async (
        _: any,
        { messageId, utilisateurId }: { messageId: number; utilisateurId: number }
      ) => {
        try {
          return await messagerieService.obtenirMessageParId(messageId, utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère un message personnalisé par son ID
       */
      obtenirMessagePersonnaliseParId: async (
        _: any,
        { messageId, utilisateurId }: { messageId: number; utilisateurId: number }
      ) => {
        try {
          return await messagerieService.obtenirMessagePersonnaliseParId(messageId, utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère les messages d'un groupe
       */
      obtenirMessagesGroupe: async (
        _: any,
        { groupeId, utilisateurId }: { groupeId: number; utilisateurId: number }
      ) => {
        try {
          return await messagerieService.obtenirMessagesGroupe(groupeId, utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Compte les messages non vus d'un utilisateur
       */
      compterMessagesNonVus: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await messagerieService.compterMessagesNonVus(utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère le statut d'un message
       */
      obtenirStatutMessage: async (
        _: any,
        { messageId, utilisateurId }: { messageId: number; utilisateurId: number }
      ) => {
        try {
          return await messagerieService.obtenirStatutMessage(messageId, utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques générales
       */
      obtenirStatistiquesGenerales: async (
        _: any,
        { utilisateurId }: { utilisateurId?: number }
      ) => {
        try {
          return await messagerieService.obtenirStatistiquesGenerales(utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques d'un utilisateur
       */
      obtenirStatistiquesUtilisateur: async (
        _: any,
        { utilisateurId }: { utilisateurId: number }
      ) => {
        try {
          return await messagerieService.obtenirStatistiquesUtilisateur(utilisateurId);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques des messages personnalisés
       */
      obtenirStatistiquesMessagesPersonnalises: async () => {
        try {
          const stats = await messagerieService.obtenirStatistiquesMessagesPersonnalises();
          return {
            ...stats,
            parStatutEnvoi: JSON.stringify(stats.parStatutEnvoi)
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      }
    },

    Mutation: {
      /**
       * Envoie un message à un utilisateur
       */
      envoyerMessageUtilisateur: async (
        _: any,
        { input }: { input: { senderId: number; receiverId: number; contenu: string } }
      ) => {
        try {
          const result = await messagerieService.envoyerMessageUtilisateur(
            input.senderId,
            input.receiverId,
            input.contenu
          );
          return {
            success: result.success,
            id: result.data?.id,
            message: result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Envoie un message à un groupe
       */
      envoyerMessageGroupe: async (
        _: any,
        { input }: { input: { senderId: number; groupeId: number; contenu: string } }
      ) => {
        try {
          const result = await messagerieService.envoyerMessageGroupe(
            input.senderId,
            input.groupeId,
            input.contenu
          );
          return {
            success: result.success,
            id: result.data?.id,
            message: result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Envoie un message à plusieurs destinataires
       */
      envoyerMessageMultiple: async (
        _: any,
        {
          input
        }: { input: { senderId: number; destinataireIds: number[]; contenu: string } }
      ) => {
        try {
          return await messagerieService.envoyerMessageMultipleAvecContenu(
            input.senderId,
            input.destinataireIds,
            input.contenu
          );
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Envoie un message personnalisé
       */
      envoyerMessagePersonnalise: async (
        _: any,
        {
          input
        }: {
          input: { destinataireId: number; contenu: string; expediteurId?: number };
        }
      ) => {
        try {
          return await messagerieService.envoyerMessagePersonnalise(input);
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Envoie un message à plusieurs groupes
       */
      envoyerMessageGroupes: async (
        _: any,
        { input }: { input: { senderId: number; groupeIds: number[]; contenu: string } }
      ) => {
        try {
          return await messagerieService.envoyerMessageGroupes(
            input.senderId,
            input.groupeIds,
            input.contenu
          );
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Marque un message comme vu
       */
      marquerMessageVu: async (
        _: any,
        { messageId, utilisateurId }: { messageId: number; utilisateurId: number }
      ) => {
        try {
          const result = await messagerieService.marquerMessageVu(messageId, utilisateurId);
          return {
            success: result.success,
            message: result.data?.message || result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Marque un message personnalisé comme lu
       */
      marquerMessagePersonnaliseLu: async (
        _: any,
        { input }: { input: { messageId: number; userId: number } }
      ) => {
        try {
          const result = await messagerieService.marquerMessagePersonnaliseLu(input);
          return {
            success: result.success,
            message: result.data?.message || result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Marque tous les messages d'un utilisateur comme vus
       */
      marquerTousMessagesVus: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          const result = await messagerieService.marquerTousMessagesVus(utilisateurId);
          return {
            success: result.success,
            message: result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Supprime un message
       */
      supprimerMessage: async (
        _: any,
        { messageId, utilisateurId }: { messageId: number; utilisateurId: number }
      ) => {
        try {
          const result = await messagerieService.supprimerMessage(messageId, utilisateurId);
          return {
            success: result.success,
            message: result.data?.message || result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Supprime un message personnalisé
       */
      supprimerMessagePersonnalise: async (
        _: any,
        { messageId, utilisateurId }: { messageId: number; utilisateurId: number }
      ) => {
        try {
          const result = await messagerieService.supprimerMessagePersonnalise(
            messageId,
            utilisateurId
          );
          return {
            success: result.success,
            message: result.data?.message || result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Crée un message personnalisé
       */
      creerMessagePersonnalise: async (
        _: any,
        { utilisateurId, contenu }: { utilisateurId: number; contenu: string }
      ) => {
        try {
          const result = await messagerieService.creerMessagePersonnalise(
            utilisateurId,
            contenu
          );
          return {
            success: result.success,
            id: result.data?.id,
            message: result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      },

      /**
       * Nettoie les anciens messages supprimés
       */
      nettoyerAnciennesMessages: async (
        _: any,
        { joursAnciennete }: { joursAnciennete?: number }
      ) => {
        try {
          const result = await messagerieService.nettoyerAnciennesMessages(joursAnciennete);
          return {
            success: result.success,
            message: result.message
          };
        } catch (error) {
          if (error instanceof MessagerieError) {
            throw new Error(error.message);
          }
          throw error;
        }
      }
    }
  };
};
