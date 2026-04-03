/**
 * Resolvers GraphQL pour le service Paiements
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import { GraphQLError } from 'graphql';
import { PaiementsService } from './paiements.service.js';
import { PaiementsError } from '@clubmanager/types';

export const paiementsResolvers = (prisma: typeof defaultPrisma) => {
  const paiementsService = new PaiementsService(prisma);

  return {
    Query: {
      /**
       * Récupère tous les paiements avec filtres et pagination
       */
      obtenirPaiements: async (
        _: any,
        {
          utilisateurId,
          statut,
          dateDebut,
          dateFin,
          methodePaiement,
          abonnementId,
          limit,
          offset
        }: {
          utilisateurId?: number;
          statut?: string;
          dateDebut?: Date;
          dateFin?: Date;
          methodePaiement?: string;
          abonnementId?: number;
          limit?: number;
          offset?: number;
        }
      ) => {
        try {
          return await paiementsService.obtenirPaiements({
            utilisateurId,
            statut,
            dateDebut,
            dateFin,
            methodePaiement,
            abonnementId,
            limit,
            offset
          });
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère un paiement par son ID
       */
      obtenirPaiementParId: async (_: any, { id }: { id: number }) => {
        try {
          const paiement = await paiementsService.obtenirPaiementParId(id);
          if (!paiement) {
            throw new PaiementsError('Paiement introuvable', 'PAIEMENT_INTROUVABLE');
          }
          return paiement;
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les paiements d'un utilisateur
       */
      obtenirPaiementsUtilisateur: async (
        _: any,
        {
          utilisateurId,
          statut,
          limit,
          offset
        }: {
          utilisateurId: number;
          statut?: string;
          limit?: number;
          offset?: number;
        }
      ) => {
        try {
          return await paiementsService.obtenirPaiementsUtilisateur({
            utilisateurId,
            statut,
            limit,
            offset
          });
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les échéances de paiement
       */
      obtenirEcheances: async (
        _: any,
        {
          utilisateurId,
          abonnementId,
          statut,
          dateDebut,
          dateFin,
          limit,
          offset
        }: {
          utilisateurId?: number;
          abonnementId?: number;
          statut?: string;
          dateDebut?: Date;
          dateFin?: Date;
          limit?: number;
          offset?: number;
        }
      ) => {
        try {
          return await paiementsService.obtenirEcheances({
            utilisateurId,
            abonnementId,
            statut,
            dateDebut,
            dateFin,
            limit,
            offset
          });
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les échéances d'un utilisateur
       */
      obtenirEcheancesUtilisateur: async (
        _: any,
        { utilisateurId, limit }: { utilisateurId: number; limit?: number }
      ) => {
        try {
          return await paiementsService.obtenirEcheancesUtilisateur(utilisateurId, limit);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les échéances échues
       */
      obtenirEcheancesEchues: async () => {
        try {
          return await paiementsService.obtenirEcheancesEchues();
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques générales des paiements
       */
      statistiquesPaiements: async (
        _: any,
        { dateDebut, dateFin }: { dateDebut?: Date; dateFin?: Date }
      ) => {
        try {
          return await paiementsService.statistiquesGenerales(dateDebut, dateFin);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques d'un utilisateur
       */
      statistiquesPaiementsUtilisateur: async (
        _: any,
        { utilisateurId }: { utilisateurId: number }
      ) => {
        try {
          return await paiementsService.statistiquesUtilisateur(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques par période
       */
      statistiquesPaiementsParPeriode: async (
        _: any,
        {
          dateDebut,
          dateFin,
          groupBy
        }: {
          dateDebut: Date;
          dateFin: Date;
          groupBy?: 'jour' | 'semaine' | 'mois';
        }
      ) => {
        try {
          return await paiementsService.statistiquesParPeriode(dateDebut, dateFin, groupBy);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un paiement existe
       */
      paiementExiste: async (_: any, { id }: { id: number }) => {
        try {
          return await paiementsService.paiementExiste(id);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un utilisateur a des paiements en attente
       */
      aDesPaiementsEnAttente: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await paiementsService.aDesPaiementsEnAttente(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Obtient le montant total payé par un utilisateur
       */
      obtenirMontantTotalUtilisateur: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await paiementsService.obtenirMontantTotalUtilisateur(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Obtient le nombre de paiements valides d'un utilisateur
       */
      compterPaiementsValides: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await paiementsService.compterPaiementsValides(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Obtient le dernier paiement d'un utilisateur
       */
      obtenirDernierPaiement: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
        try {
          return await paiementsService.obtenirDernierPaiement(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      }
    },

    Mutation: {
      /**
       * Crée un nouveau paiement
       */
      creerPaiement: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await paiementsService.creerPaiement(input);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Valide un paiement
       */
      validerPaiement: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await paiementsService.validerPaiement(input);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Refuse un paiement
       */
      refuserPaiement: async (
        _: any,
        { paiementId, motif }: { paiementId: number; motif?: string }
      ) => {
        try {
          return await paiementsService.refuserPaiement(paiementId, motif);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Annule un paiement
       */
      annulerPaiement: async (
        _: any,
        { paiementId, motif }: { paiementId: number; motif?: string }
      ) => {
        try {
          return await paiementsService.annulerPaiement(paiementId, motif);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Rembourse un paiement
       */
      rembourserPaiement: async (
        _: any,
        { paiementId, motif }: { paiementId: number; motif?: string }
      ) => {
        try {
          return await paiementsService.rembourserPaiement(paiementId, motif);
        } catch (error: unknown) {
          if (error instanceof PaiementsError) {
            throw new Error((error as Error).message);
          }
          throw error;
        }
      }
    }
  };
};

// Export d'un resolver par défaut
export const paiementsResolversDefault = paiementsResolvers(defaultPrisma);
