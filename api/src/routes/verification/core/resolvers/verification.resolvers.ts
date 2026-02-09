/**
 * Resolvers GraphQL pour le module Vérification
 * Gère les opérations de vérification via GraphQL
 */

import { GraphQLError } from "graphql";
import { PrismaClient } from "@prisma/client";
import {
  verifierEmailUtilisateur,
  verifierNomUtilisateur,
  verifierPrenomUtilisateur,
  verifierNomUtilisateurComplet,
  verifierPrenomNomUtilisateur,
  verifierEmailPrenomNomUtilisateur,
  verifierCoursPlanning,
  verifierArticleParNom,
  verifierArticleParNomEtCategorie,
  verifierUtilisateursSontProfesseurs,
  verifierSanteService,
} from "../services/verification.service.js";

/**
 * Types d'input pour les resolvers
 */
export interface VerifierPrenomNomInput {
  prenom: string;
  nom: string;
}

export interface VerifierEmailPrenomNomInput {
  email: string;
  prenom: string;
  nom: string;
}

export interface VerifierPlanningInput {
  jour: string;
  heure_debut: string;
  heure_fin: string;
  type_cours: string;
}

export interface VerifierArticleCategorieInput {
  nom: string;
  categorie_id: number;
}

export interface UtilisateurInput {
  nom: string;
  prenom: string;
}

export interface VerifierProfesseursInput {
  utilisateurs: UtilisateurInput[];
}

/**
 * Crée les resolvers GraphQL pour le module Vérification
 * @param prisma - Client Prisma (pour compatibilité, non utilisé directement)
 * @returns Resolvers GraphQL
 */
export const verificationResolvers = (prisma: PrismaClient) => {
  return {
    Query: {
      /**
       * Health check du service de vérification
       */
      verificationHealth: async () => {
        try {
          const result = await verifierSanteService();
          return {
            status: result.status,
            message: result.message,
            checks: result.checks,
          };
        } catch (error: any) {
          throw new GraphQLError(
            error.message || "Erreur lors de la vérification de santé"
          );
        }
      },

      /**
       * Vérifie si un email existe
       */
      verifierEmail: async (_: any, { email }: { email: string }) => {
        try {
          if (!email) {
            throw new GraphQLError("Email requis");
          }
          return await verifierEmailUtilisateur(email);
        } catch (error: any) {
          throw new GraphQLError(
            error.message || "Erreur lors de la vérification de l'email"
          );
        }
      },

      /**
       * Vérifie si un nom d'utilisateur existe
       */
      verifierNomUtilisateur: async (
        _: any,
        { nom_utilisateur }: { nom_utilisateur: string }
      ) => {
        try {
          if (!nom_utilisateur) {
            throw new GraphQLError("Nom d'utilisateur requis");
          }
          return await verifierNomUtilisateur(nom_utilisateur);
        } catch (error: any) {
          throw new GraphQLError(
            error.message ||
              "Erreur lors de la vérification du nom d'utilisateur"
          );
        }
      },

      /**
       * Vérifie si un prénom existe
       */
      verifierPrenom: async (_: any, { prenom }: { prenom: string }) => {
        try {
          if (!prenom) {
            throw new GraphQLError("Prénom requis");
          }
          return await verifierPrenomUtilisateur(prenom);
        } catch (error: any) {
          throw new GraphQLError(
            error.message || "Erreur lors de la vérification du prénom"
          );
        }
      },

      /**
       * Vérifie si un nom existe
       */
      verifierNom: async (_: any, { nom }: { nom: string }) => {
        try {
          if (!nom) {
            throw new GraphQLError("Nom requis");
          }
          return await verifierNomUtilisateurComplet(nom);
        } catch (error: any) {
          throw new GraphQLError(
            error.message || "Erreur lors de la vérification du nom"
          );
        }
      },

      /**
       * Vérifie si un utilisateur existe par prénom et nom
       */
      verifierPrenomNom: async (
        _: any,
        { input }: { input: VerifierPrenomNomInput }
      ) => {
        try {
          if (!input.prenom || !input.nom) {
            throw new GraphQLError("Prénom et nom requis");
          }
          return await verifierPrenomNomUtilisateur(input.prenom, input.nom);
        } catch (error: any) {
          throw new GraphQLError(
            error.message ||
              "Erreur lors de la vérification du prénom et nom"
          );
        }
      },

      /**
       * Vérifie si un utilisateur existe par email, prénom et nom
       */
      verifierEmailPrenomNom: async (
        _: any,
        { input }: { input: VerifierEmailPrenomNomInput }
      ) => {
        try {
          if (!input.email || !input.prenom || !input.nom) {
            throw new GraphQLError("Email, prénom et nom requis");
          }
          return await verifierEmailPrenomNomUtilisateur(
            input.email,
            input.prenom,
            input.nom
          );
        } catch (error: any) {
          throw new GraphQLError(
            error.message ||
              "Erreur lors de la vérification de l'email, prénom et nom"
          );
        }
      },

      /**
       * Vérifie si un cours existe dans le planning
       */
      verifierPlanning: async (
        _: any,
        { input }: { input: VerifierPlanningInput }
      ) => {
        try {
          if (
            !input.jour ||
            !input.heure_debut ||
            !input.heure_fin ||
            !input.type_cours
          ) {
            throw new GraphQLError(
              "Jour, heure_debut, heure_fin et type_cours requis"
            );
          }
          return await verifierCoursPlanning(
            input.jour,
            input.heure_debut,
            input.heure_fin,
            input.type_cours
          );
        } catch (error: any) {
          throw new GraphQLError(
            error.message || "Erreur lors de la vérification du planning"
          );
        }
      },

      /**
       * Vérifie si un article existe par nom
       */
      verifierArticle: async (_: any, { nom }: { nom: string }) => {
        try {
          if (!nom) {
            throw new GraphQLError("Nom de l'article requis");
          }
          return await verifierArticleParNom(nom);
        } catch (error: any) {
          throw new GraphQLError(
            error.message || "Erreur lors de la vérification de l'article"
          );
        }
      },

      /**
       * Vérifie si un article existe par nom et catégorie
       */
      verifierArticleCategorie: async (
        _: any,
        { input }: { input: VerifierArticleCategorieInput }
      ) => {
        try {
          if (!input.nom || !input.categorie_id) {
            throw new GraphQLError("Nom et catégorie_id requis");
          }
          return await verifierArticleParNomEtCategorie(
            input.nom,
            input.categorie_id
          );
        } catch (error: any) {
          throw new GraphQLError(
            error.message ||
              "Erreur lors de la vérification de l'article dans la catégorie"
          );
        }
      },

      /**
       * Vérifie si des utilisateurs sont professeurs
       */
      verifierProfesseurs: async (
        _: any,
        { input }: { input: VerifierProfesseursInput }
      ) => {
        try {
          if (!Array.isArray(input.utilisateurs) || input.utilisateurs.length === 0) {
            throw new GraphQLError("Liste d'utilisateurs requise");
          }
          return await verifierUtilisateursSontProfesseurs(input.utilisateurs);
        } catch (error: any) {
          throw new GraphQLError(
            error.message ||
              "Erreur lors de la vérification des professeurs"
          );
        }
      },
    },

    Mutation: {
      /**
       * Mutation factice pour vérifier un email (alias de Query)
       * Certaines architectures préfèrent les mutations pour les vérifications
       */
      verifierEmailMutation: async (_: any, { email }: { email: string }) => {
        try {
          if (!email) {
            throw new GraphQLError("Email requis");
          }
          return await verifierEmailUtilisateur(email);
        } catch (error: any) {
          throw new GraphQLError(
            error.message || "Erreur lors de la vérification de l'email"
          );
        }
      },
    },
  };
};

/**
 * Types de retour pour les resolvers
 */
export interface VerificationResult {
  exists: boolean;
  message: string;
}

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  checks: {
    database: boolean;
    verification: boolean;
  };
}

export interface ProfesseurResult {
  nom: string;
  prenom: string;
  isProf: boolean;
}

export interface VerifierProfesseursResult {
  professeurs: ProfesseurResult[];
  message: string;
}
