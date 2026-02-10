/**
 * Resolvers GraphQL pour le module Utilisateurs
 * ✅ MIGRÉ : Utilise les middlewares partagés depuis @shared
 * - Authentification (requireAuth, requireAdmin)
 * - Autorisation (requireOwner)
 * - Validation (withValidation)
 * - Rate limiting
 * - Erreurs GraphQL standardisées
 */

import { GraphQLError } from "graphql";
import { PrismaClient } from "@prisma/client";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import {
  obtenirTousLesUtilisateurs,
  obtenirUtilisateurParId,
  inscrireUtilisateur,
  envoyerEmailVerification,
  mettreAJourUtilisateur,
  supprimerUtilisateur,
  obtenirStatistiques,
  verifierExistenceUtilisateur,
} from "../services/utilisateurs.service.js";
import { inscriptionUtilisateurSchema } from "@clubmanager/types/validators";

// ✅ NOUVEAU : Middlewares partagés depuis @shared
import {
  requireAuth,
  requireAdmin,
  requireOwner,
  combineMiddlewares,
  withValidation,
  withMutationRateLimit,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  type GraphQLContext,
} from "../../../../shared/index.js";

interface Context extends GraphQLContext {
  prisma: PrismaClient;
}

export const utilisateursResolvers = (prisma: PrismaClient) => ({
  Query: {
    /**
     * ✅ MIGRÉ : Obtenir tous les utilisateurs (requiert admin)
     */
    utilisateurs: requireAdmin(
      async (
        _: any,
        { includeInactive }: { includeInactive?: boolean } = {},
        context: Context,
      ) => {
        try {
          console.log("📋 [Utilisateurs] Liste des utilisateurs demandée");
          const utilisateurs = await obtenirTousLesUtilisateurs(
            includeInactive || false,
          );

          console.log(
            `✅ [Utilisateurs] ${utilisateurs.length} utilisateur(s) récupéré(s)`,
          );

          return utilisateurs;
        } catch (error: any) {
          console.error("❌ [Utilisateurs] Erreur récupération liste:", error);
          throw new InternalServerError(
            "Erreur lors de la récupération des utilisateurs",
            error,
          );
        }
      },
    ),

    /**
     * ✅ MIGRÉ : Obtenir un utilisateur par ID (requiert auth + owner ou admin)
     */
    utilisateur: requireOwner(
      (args: { id: number }) => args.id,
      async (_: any, { id }: { id: number }, context: Context) => {
        try {
          if (isNaN(id) || id <= 0) {
            throw new ValidationError("ID utilisateur invalide");
          }

          console.log(`🔍 [Utilisateurs] Utilisateur demandé: ${id}`);
          const utilisateur = await obtenirUtilisateurParId(id);

          if (!utilisateur) {
            throw new NotFoundError("Utilisateur non trouvé");
          }

          console.log("✅ [Utilisateurs] Utilisateur récupéré avec succès");
          return utilisateur;
        } catch (error: any) {
          console.error(
            "❌ [Utilisateurs] Erreur récupération utilisateur:",
            error,
          );

          if (
            error instanceof NotFoundError ||
            error instanceof ValidationError
          ) {
            throw error;
          }

          throw new InternalServerError(
            "Erreur lors de la récupération de l'utilisateur",
            error,
          );
        }
      },
    ),

    /**
     * ✅ MIGRÉ : Obtenir les statistiques (requiert admin)
     */
    statistiquesUtilisateurs: requireAdmin(
      async (_: any, __: any, context: Context) => {
        try {
          console.log("📊 [Utilisateurs] Statistiques demandées");
          const stats = await obtenirStatistiques();

          console.log("✅ [Utilisateurs] Statistiques récupérées:", stats);
          return stats;
        } catch (error: any) {
          console.error("❌ [Utilisateurs] Erreur statistiques:", error);
          throw new InternalServerError(
            "Erreur lors de la récupération des statistiques",
            error,
          );
        }
      },
    ),

    /**
     * Vérifier l'existence d'un utilisateur (public - pas d'auth requise)
     */
    verifierExistenceUtilisateur: async (
      _: any,
      {
        input,
      }: { input: { nom: string; prenom: string; date_naissance: string } },
      context: Context,
    ) => {
      try {
        const { nom, prenom, date_naissance } = input;

        if (!nom || !prenom || !date_naissance) {
          throw new ValidationError("Nom, prénom et date de naissance requis");
        }

        console.log("🔍 [Utilisateurs] Vérification existence:", {
          nom,
          prenom,
          date_naissance,
        });

        const result = await verifierExistenceUtilisateur(
          nom,
          prenom,
          date_naissance,
        );

        if (result.exists) {
          console.log("✅ [Utilisateurs] Utilisateur trouvé:", result.userData);
          return {
            message: result.message,
            type: "USER_EXISTS",
            userExists: true,
            canRegister: false,
            userData: result.userData,
          };
        }

        console.log(
          "✅ [Utilisateurs] Utilisateur non trouvé - disponible pour inscription",
        );
        return {
          message: result.message,
          type: "USER_AVAILABLE",
          userExists: false,
          canRegister: result.canRegister,
          userData: null,
        };
      } catch (error: any) {
        console.error(
          "❌ [Utilisateurs] Erreur vérification existence:",
          error,
        );

        if (error instanceof ValidationError) {
          throw error;
        }

        throw new InternalServerError(
          "Erreur lors de la vérification de l'existence",
          error,
        );
      }
    },

    /**
     * Health check du module
     */
    healthCheckUtilisateurs: async () => {
      return {
        status: "healthy",
        module: "utilisateurs",
        timestamp: new Date().toISOString(),
      };
    },
  },

  Mutation: {
    /**
     * ✅ MIGRÉ : Créer un utilisateur (requiert admin + validation + rate limit)
     */
    creerUtilisateur: requireAdmin(
      async (_: any, { input }: { input: any }, context: Context) => {
        try {
          console.log("➕ [Utilisateurs] Création utilisateur:", input.email);

          // Validation avec Zod
          const validationResult =
            inscriptionUtilisateurSchema.safeParse(input);
          if (!validationResult.success) {
            throw new ValidationError(
              validationResult.error.issues[0]?.message || "Données invalides",
              validationResult.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
              })),
            );
          }

          // Générer automatiquement le nom_utilisateur s'il n'est pas fourni
          if (!input.nom_utilisateur || input.nom_utilisateur.trim() === "") {
            const prenom = input.prenom
              ? input.prenom.toLowerCase().replace(/\s+/g, "")
              : "";
            const nom = input.nom
              ? input.nom.toLowerCase().replace(/\s+/g, "")
              : "";
            const timestamp = Date.now().toString().slice(-4);

            input.nom_utilisateur = `${prenom}_${nom}_${timestamp}`;
            console.log(
              "[Utilisateurs] Nom d'utilisateur généré:",
              input.nom_utilisateur,
            );
          }

          const result = await inscrireUtilisateur(input);

          if (!result.success) {
            throw new ValidationError(result.message || "Échec de la création");
          }

          // Envoyer email de vérification
          if (result.userId) {
            try {
              await envoyerEmailVerification(
                input.email,
                input.prenom,
                input.nom,
                String(result.generatedUserId || result.userId),
                result.userId,
              );
              console.log("✅ [Utilisateurs] Email de vérification envoyé");
            } catch (emailError) {
              console.warn(
                "⚠️ [Utilisateurs] Erreur envoi email (non bloquant):",
                emailError,
              );
            }
          }

          console.log("✅ [Utilisateurs] Utilisateur créé:", result.userId);

          return {
            success: true,
            message: result.message,
            userId: result.userId,
            generatedUserId: result.generatedUserId,
          };
        } catch (error: any) {
          console.error("❌ [Utilisateurs] Erreur création:", error);

          if (
            error instanceof ValidationError ||
            error instanceof ConflictError
          ) {
            throw error;
          }

          throw new InternalServerError(
            "Erreur lors de la création de l'utilisateur",
            error,
          );
        }
      },
    ),

    /**
     * Inscription d'un nouvel utilisateur (endpoint public)
     */
    inscrireUtilisateur: async (
      _: any,
      { input }: { input: any },
      context: Context,
    ) => {
      try {
        console.log("📝 [Utilisateurs] Inscription utilisateur:", input.email);

        // Générer automatiquement le nom_utilisateur s'il n'est pas fourni
        if (!input.nom_utilisateur || input.nom_utilisateur.trim() === "") {
          const prenom = input.prenom
            ? input.prenom.toLowerCase().replace(/\s+/g, "")
            : "";
          const nom = input.nom
            ? input.nom.toLowerCase().replace(/\s+/g, "")
            : "";
          const timestamp = Date.now().toString().slice(-4);

          input.nom_utilisateur = `${prenom}_${nom}_${timestamp}`;
          console.log(
            "[Utilisateurs] Nom d'utilisateur généré:",
            input.nom_utilisateur,
          );
        }

        // Validation avec Zod
        const validationResult = inscriptionUtilisateurSchema.safeParse(input);

        if (!validationResult.success) {
          console.log(
            "[Utilisateurs] Erreur validation:",
            validationResult.error.issues,
          );
          throw new ValidationError(
            validationResult.error.issues[0]?.message || "Données invalides",
            validationResult.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          );
        }

        const validatedData = validationResult.data;

        // Appel du service d'inscription
        const result = await inscrireUtilisateur(validatedData);

        if (!result.success) {
          throw new ValidationError(result.message || "Échec de l'inscription");
        }

        // Envoi email de vérification
        if (result.userId && result.generatedUserId) {
          try {
            console.log("📧 [Utilisateurs] Envoi email de vérification...");

            const emailResult = await envoyerEmailVerification(
              validatedData.email,
              validatedData.prenom,
              validatedData.nom,
              String(result.generatedUserId || result.userId),
              result.userId,
            );

            return {
              message: emailResult.success
                ? "Inscription réussie et email de vérification envoyé"
                : "Inscription réussie mais échec envoi email de vérification",
              generatedUserId: result.userId,
              inscriptionDetails: {
                userId: result.userId,
                prenom: validatedData.prenom,
                nom: validatedData.nom,
                email: validatedData.email,
                nom_utilisateur: validatedData.nom_utilisateur,
              },
              emailStatus: {
                sent: emailResult.success,
                message: emailResult.message,
                details: emailResult.details,
                emailDestination: validatedData.email,
              },
            };
          } catch (emailError: any) {
            console.error("❌ [Utilisateurs] Erreur envoi email:", emailError);

            return {
              message:
                "Inscription réussie mais erreur lors de l'envoi de l'email",
              generatedUserId: result.userId,
              inscriptionDetails: {
                userId: result.userId,
                prenom: validatedData.prenom,
                nom: validatedData.nom,
                email: validatedData.email,
                nom_utilisateur: validatedData.nom_utilisateur,
              },
              emailStatus: {
                sent: false,
                error: "Erreur technique lors de l'envoi",
                emailDestination: validatedData.email,
              },
            };
          }
        }

        return {
          message: "Inscription réussie",
          generatedUserId: result.userId || 0,
          inscriptionDetails: {
            userId: result.userId || 0,
            prenom: validatedData.prenom,
            nom: validatedData.nom,
            email: validatedData.email,
            nom_utilisateur: validatedData.nom_utilisateur,
          },
        };
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur inscription:", error);

        if (
          error instanceof ValidationError ||
          error instanceof ConflictError
        ) {
          throw error;
        }

        throw new InternalServerError("Erreur lors de l'inscription", error);
      }
    },

    /**
     * ✅ MIGRÉ : Mettre à jour un utilisateur (requiert owner ou admin + rate limit)
     */
    mettreAJourUtilisateur: requireOwner(
      (args: { id: number; input: any }) => args.id,
      async (
        _: any,
        { id, input }: { id: number; input: any },
        context: Context,
      ) => {
        try {
          if (isNaN(id) || id <= 0) {
            throw new ValidationError("ID utilisateur invalide");
          }

          console.log(`✏️ [Utilisateurs] Mise à jour utilisateur: ${id}`);

          const result = await mettreAJourUtilisateur(id, input);

          if (!result.success) {
            throw new ValidationError(
              result.message || "Échec de la mise à jour",
            );
          }

          console.log("✅ [Utilisateurs] Utilisateur mis à jour:", id);

          return {
            success: true,
            message: result.message,
            data: result.data,
          };
        } catch (error: any) {
          console.error("❌ [Utilisateurs] Erreur mise à jour:", error);

          if (
            error instanceof ValidationError ||
            error instanceof NotFoundError
          ) {
            throw error;
          }

          throw new InternalServerError(
            "Erreur lors de la mise à jour de l'utilisateur",
            error,
          );
        }
      },
    ),

    /**
     * ✅ MIGRÉ : Supprimer un utilisateur (requiert admin)
     */
    supprimerUtilisateur: requireAdmin(
      async (
        _: any,
        { id, input }: { id: number; input?: { isConfirm?: boolean } },
        context: Context,
      ) => {
        try {
          if (isNaN(id) || id <= 0) {
            throw new ValidationError("ID utilisateur invalide");
          }

          if (input && !input.isConfirm) {
            throw new ValidationError(
              "Confirmation requise pour supprimer l'utilisateur",
            );
          }

          console.log(`🗑️ [Utilisateurs] Suppression utilisateur: ${id}`);

          const result = await supprimerUtilisateur(id);

          if (!result.success) {
            throw new NotFoundError(result.message || "Utilisateur non trouvé");
          }

          console.log("✅ [Utilisateurs] Utilisateur supprimé:", id);

          return {
            isConfirm: true,
            success: true,
            message: result.message,
            action: "hard_delete",
          };
        } catch (error: any) {
          console.error("❌ [Utilisateurs] Erreur suppression:", error);

          if (
            error instanceof NotFoundError ||
            error instanceof ValidationError
          ) {
            throw error;
          }

          throw new InternalServerError(
            "Erreur lors de la suppression de l'utilisateur",
            error,
          );
        }
      },
    ),

    /**
     * ✅ MIGRÉ : Désactiver un utilisateur (soft delete - requiert admin)
     */
    desactiverUtilisateur: requireAdmin(
      async (
        _: any,
        { id, input }: { id: number; input?: { isConfirm?: boolean } },
        context: Context,
      ) => {
        try {
          if (isNaN(id) || id <= 0) {
            throw new ValidationError("ID utilisateur invalide");
          }

          if (input && !input.isConfirm) {
            throw new ValidationError(
              "Confirmation requise pour désactiver l'utilisateur",
            );
          }

          console.log(`🗑️ [Utilisateurs] Désactivation utilisateur: ${id}`);

          const utilisateursClient = new Utilisateurs();
          await utilisateursClient.supprimerSoft(id);

          console.log("✅ [Utilisateurs] Utilisateur désactivé:", id);

          return {
            isConfirm: true,
            success: true,
            message: "Utilisateur désactivé avec succès",
            action: "soft_delete",
          };
        } catch (error: any) {
          console.error("❌ [Utilisateurs] Erreur désactivation:", error);

          if (error instanceof ValidationError) {
            throw error;
          }

          throw new InternalServerError(
            "Erreur lors de la désactivation de l'utilisateur",
            error,
          );
        }
      },
    ),
  },
});

export default utilisateursResolvers;
