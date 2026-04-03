/**
 * Resolvers GraphQL pour le service Utilisateurs
 */

import { prisma as defaultPrisma } from '../../infrastructure/database/prisma-client.js';
import { GraphQLError } from 'graphql';
import { UtilisateursService } from './utilisateurs.service.js';
import { UtilisateursError } from '@clubmanager/types';

export const utilisateursResolvers = (prisma: typeof defaultPrisma) => {
  const utilisateursService = new UtilisateursService(prisma);

  return {
    Query: {
      /**
       * Récupère tous les utilisateurs avec filtres et pagination
       */
      obtenirUtilisateurs: async (
        _: any,
        {
          status_id,
          grade_id,
          genre_id,
          abonnement_id,
          recherche,
          actif,
          limit,
          offset,
          dateInscriptionDebut,
          dateInscriptionFin,
          ageMin,
          ageMax,
        }: {
          status_id?: number;
          grade_id?: number;
          genre_id?: number;
          abonnement_id?: number;
          recherche?: string;
          actif?: boolean;
          limit?: number;
          offset?: number;
          dateInscriptionDebut?: Date;
          dateInscriptionFin?: Date;
          ageMin?: number;
          ageMax?: number;
        }
      ) => {
        try {
          return await utilisateursService.obtenirUtilisateurs({
            status_id,
            grade_id,
            genre_id,
            abonnement_id,
            recherche,
            actif,
            limit,
            offset,
            dateInscriptionDebut,
            dateInscriptionFin,
            ageMin,
            ageMax,
          });
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère un utilisateur par son ID
       */
      obtenirUtilisateurParId: async (_: any, { id }: { id: number }) => {
        try {
          const utilisateur = await utilisateursService.obtenirUtilisateurParId(id);
          if (!utilisateur) {
            throw new UtilisateursError('Utilisateur introuvable', 'USER_NOT_FOUND');
          }
          return utilisateur;
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère un utilisateur par son email
       */
      obtenirUtilisateurParEmail: async (_: any, { email }: { email: string }) => {
        try {
          const utilisateur = await utilisateursService.obtenirUtilisateurParEmail(email);
          if (!utilisateur) {
            throw new UtilisateursError('Utilisateur introuvable', 'USER_NOT_FOUND');
          }
          return utilisateur;
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Recherche des utilisateurs par email (recherche partielle)
       */
      rechercherUtilisateursParEmail: async (
        _: any,
        { email, limit }: { email: string; limit?: number }
      ) => {
        try {
          return await utilisateursService.rechercherUtilisateursParEmail(email, limit);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un utilisateur existe
       */
      utilisateurExiste: async (_: any, { id }: { id: number }) => {
        try {
          return await utilisateursService.utilisateurExiste(id);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un email existe déjà
       */
      verifierEmailExiste: async (_: any, { email }: { email: string }) => {
        try {
          return await utilisateursService.verifierEmailExiste(email);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Vérifie si un utilisateur existe et peut s'inscrire
       */
      verifierUtilisateurExiste: async (_: any, { email }: { email: string }) => {
        try {
          return await utilisateursService.verifierUtilisateurExiste(email);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
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
          return await utilisateursService.estProfesseur(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Compte le nombre total d'utilisateurs
       */
      compterUtilisateurs: async () => {
        try {
          return await utilisateursService.compterUtilisateurs();
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Compte le nombre d'utilisateurs actifs
       */
      compterUtilisateursActifs: async () => {
        try {
          return await utilisateursService.compterUtilisateursActifs();
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques générales des utilisateurs
       */
      statistiquesUtilisateurs: async () => {
        try {
          return await utilisateursService.statistiquesGenerales();
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Récupère les statistiques d'un utilisateur
       */
      statistiquesUtilisateur: async (
        _: any,
        { utilisateurId }: { utilisateurId: number }
      ) => {
        try {
          return await utilisateursService.statistiquesUtilisateur(utilisateurId);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Recherche des utilisateurs par nom, prénom ou email
       */
      rechercherUtilisateurs: async (
        _: any,
        { recherche }: { recherche: string }
      ) => {
        try {
          return await utilisateursService.rechercherUtilisateurs(recherche);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Obtient les informations complètes d'un utilisateur
       */
      obtenirInformationsCompletes: async (
        _: any,
        { utilisateurId }: { utilisateurId: number }
      ) => {
        try {
          const utilisateur = await utilisateursService.obtenirInformationsCompletes(utilisateurId);
          if (!utilisateur) {
            throw new UtilisateursError('Utilisateur introuvable', 'USER_NOT_FOUND');
          }
          return utilisateur;
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },
    },

    Mutation: {
      /**
       * Crée un nouvel utilisateur
       */
      creerUtilisateur: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await utilisateursService.creerUtilisateur(input);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Modifie un utilisateur existant
       */
      modifierUtilisateur: async (
        _: any,
        { input }: { input: any }
      ) => {
        try {
          return await utilisateursService.modifierUtilisateur(input);
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Désactive un utilisateur
       */
      desactiverUtilisateur: async (
        _: any,
        { id, motif }: { id: number; motif?: string }
      ) => {
        try {
          return await utilisateursService.desactiverUtilisateur({ id, motif });
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Réactive un utilisateur
       */
      reactiverUtilisateur: async (
        _: any,
        { id }: { id: number }
      ) => {
        try {
          return await utilisateursService.reactiverUtilisateur({ id });
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Valide la connexion d'un utilisateur par email et mot de passe
       */
      validerConnexion: async (
        _: any,
        { email, password }: { email: string; password: string }
      ) => {
        try {
          return await utilisateursService.validerConnexion({ email, password });
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },

      /**
       * Valide la connexion d'un utilisateur par userId et mot de passe
       */
      validerConnexionParUserId: async (
        _: any,
        { userId, password }: { userId: string; password: string }
      ) => {
        try {
          return await utilisateursService.validerConnexionParUserId({ userId, password });
        } catch (error: unknown) {
          if (error instanceof UtilisateursError) {
            throw new GraphQLError((error as Error).message);
          }
          throw error;
        }
      },
    }
  };
};

// Export d'un resolver par défaut
export const utilisateursResolversDefault = utilisateursResolvers(defaultPrisma);
