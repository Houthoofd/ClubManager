/**
 * Resolvers GraphQL pour le module Vérification
 * ✅ MODERNISÉ : Pattern standardisé avec combineMiddlewares + withSentry
 * - Monitoring Sentry (withSentry)
 * - Validation Zod centralisée
 * - Erreurs GraphQL standardisées
 * - Endpoints publics (pas d'auth requise pour les vérifications)
 */

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
import {
  verifierEmailSchema,
  verifierNomUtilisateurSchema,
  verifierPrenomSchema,
  verifierNomSchema,
  verifierPrenomNomSchema,
  verifierEmailPrenomNomSchema,
  verifierPlanningSchema,
  verifierArticleMagasinSchema,
  verifierArticleMagasinCategorieSchema,
  verifierProfesseursSchema,
} from "@clubmanager/types/validators";
import {
  combineMiddlewares,
  withSentry,
  ValidationError,
  InternalServerError,
  type GraphQLContext,
} from "../../../../shared/index.js";

interface Context extends GraphQLContext {
  prisma: PrismaClient;
}

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
 * @param prisma - Client Prisma
 * @returns Resolvers GraphQL
 */
export const verificationResolvers = (prisma: PrismaClient) => {
  return {
    Query: {
      /**
       * ✅ Health check du service de vérification (avec Sentry)
       */
      verificationHealth: combineMiddlewares(withSentry)(
        async (_parent: any, _args: any, _context: Context) => {
          console.log("🏥 [Vérification] Health check demandé");

          const result = await verifierSanteService();

          console.log("✅ [Vérification] Health check:", result.status);

          return {
            status: result.status,
            message: result.message,
            checks: result.checks,
          };
        },
      ),

      /**
       * ✅ Vérifie si un email existe (public - avec Sentry)
       */
      verifierEmail: combineMiddlewares(withSentry)(
        async (_parent: any, args: { email: string }, _context: Context) => {
          // Validation Zod
          const validated = verifierEmailSchema.parse(args);

          console.log("🔍 [Vérification] Vérification email:", validated.email);

          const result = await verifierEmailUtilisateur(validated.email);

          console.log(
            `✅ [Vérification] Email ${validated.email} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un nom d'utilisateur existe (public - avec Sentry)
       */
      verifierNomUtilisateur: combineMiddlewares(withSentry)(
        async (
          _parent: any,
          args: { nom_utilisateur: string },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = verifierNomUtilisateurSchema.parse(args);

          console.log(
            "🔍 [Vérification] Vérification nom d'utilisateur:",
            validated.nom_utilisateur,
          );

          const result = await verifierNomUtilisateur(
            validated.nom_utilisateur,
          );

          console.log(
            `✅ [Vérification] Nom d'utilisateur ${validated.nom_utilisateur} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un prénom existe (public - avec Sentry)
       */
      verifierPrenom: combineMiddlewares(withSentry)(
        async (_parent: any, args: { prenom: string }, _context: Context) => {
          // Validation Zod
          const validated = verifierPrenomSchema.parse(args);

          console.log(
            "🔍 [Vérification] Vérification prénom:",
            validated.prenom,
          );

          const result = await verifierPrenomUtilisateur(validated.prenom);

          console.log(
            `✅ [Vérification] Prénom ${validated.prenom} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un nom existe (public - avec Sentry)
       */
      verifierNom: combineMiddlewares(withSentry)(
        async (_parent: any, args: { nom: string }, _context: Context) => {
          // Validation Zod
          const validated = verifierNomSchema.parse(args);

          console.log("🔍 [Vérification] Vérification nom:", validated.nom);

          const result = await verifierNomUtilisateurComplet(validated.nom);

          console.log(
            `✅ [Vérification] Nom ${validated.nom} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un utilisateur existe par prénom et nom (public - avec Sentry)
       */
      verifierPrenomNom: combineMiddlewares(withSentry)(
        async (
          _parent: any,
          { input }: { input: VerifierPrenomNomInput },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = verifierPrenomNomSchema.parse(input);

          console.log(
            "🔍 [Vérification] Vérification prénom et nom:",
            validated,
          );

          const result = await verifierPrenomNomUtilisateur(
            validated.prenom,
            validated.nom,
          );

          console.log(
            `✅ [Vérification] ${validated.prenom} ${validated.nom} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un utilisateur existe par email, prénom et nom (public - avec Sentry)
       */
      verifierEmailPrenomNom: combineMiddlewares(withSentry)(
        async (
          _parent: any,
          { input }: { input: VerifierEmailPrenomNomInput },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = verifierEmailPrenomNomSchema.parse(input);

          console.log(
            "🔍 [Vérification] Vérification email, prénom et nom:",
            validated,
          );

          const result = await verifierEmailPrenomNomUtilisateur(
            validated.email,
            validated.prenom,
            validated.nom,
          );

          console.log(
            `✅ [Vérification] ${validated.email} / ${validated.prenom} ${validated.nom} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un cours existe dans le planning (public - avec Sentry)
       */
      verifierPlanning: combineMiddlewares(withSentry)(
        async (
          _parent: any,
          { input }: { input: VerifierPlanningInput },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = verifierPlanningSchema.parse(input);

          console.log("🔍 [Vérification] Vérification planning:", validated);

          const result = await verifierCoursPlanning(
            validated.jour,
            validated.heure_debut,
            validated.heure_fin,
            validated.type_cours,
          );

          console.log(
            `✅ [Vérification] Planning ${validated.jour} ${validated.heure_debut}-${validated.heure_fin} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un article existe par nom (public - avec Sentry)
       */
      verifierArticle: combineMiddlewares(withSentry)(
        async (_parent: any, args: { nom: string }, _context: Context) => {
          // Validation Zod
          const validated = verifierArticleMagasinSchema.parse(args);

          console.log("🔍 [Vérification] Vérification article:", validated.nom);

          const result = await verifierArticleParNom(validated.nom);

          console.log(
            `✅ [Vérification] Article ${validated.nom} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si un article existe par nom et catégorie (public - avec Sentry)
       */
      verifierArticleCategorie: combineMiddlewares(withSentry)(
        async (
          _parent: any,
          { input }: { input: VerifierArticleCategorieInput },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = verifierArticleMagasinCategorieSchema.parse(input);

          console.log(
            "🔍 [Vérification] Vérification article dans catégorie:",
            validated,
          );

          const result = await verifierArticleParNomEtCategorie(
            validated.nom,
            validated.categorie_id,
          );

          console.log(
            `✅ [Vérification] Article ${validated.nom} (catégorie ${validated.categorie_id}) - Existe: ${result.exists}`,
          );

          return result;
        },
      ),

      /**
       * ✅ Vérifie si des utilisateurs sont professeurs (public - avec Sentry)
       */
      verifierProfesseurs: combineMiddlewares(withSentry)(
        async (
          _parent: any,
          { input }: { input: VerifierProfesseursInput },
          _context: Context,
        ) => {
          // Validation Zod
          const validated = verifierProfesseursSchema.parse(input);

          console.log(
            "🔍 [Vérification] Vérification professeurs:",
            validated.utilisateurs.length,
            "utilisateurs",
          );

          const result = await verifierUtilisateursSontProfesseurs(
            validated.utilisateurs,
          );

          console.log(
            `✅ [Vérification] ${result.professeurs.length} statuts vérifiés`,
          );

          return result;
        },
      ),
    },

    Mutation: {
      /**
       * ✅ Mutation pour vérifier un email (alias de Query - avec Sentry)
       * Certaines architectures préfèrent les mutations pour les vérifications
       */
      verifierEmailMutation: combineMiddlewares(withSentry)(
        async (_parent: any, args: { email: string }, _context: Context) => {
          // Validation Zod
          const validated = verifierEmailSchema.parse(args);

          console.log(
            "🔍 [Vérification] Mutation vérification email:",
            validated.email,
          );

          const result = await verifierEmailUtilisateur(validated.email);

          console.log(
            `✅ [Vérification] Email ${validated.email} - Existe: ${result.exists}`,
          );

          return result;
        },
      ),
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
