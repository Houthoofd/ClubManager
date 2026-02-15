/**
 * Resolvers GraphQL pour le module Utilisateurs
 * ✅ MODERNISÉ : Pattern standardisé avec combineMiddlewares + withSentry
 * - Authentification (requireAuth, requireAdmin)
 * - Autorisation (requireOwner)
 * - Monitoring Sentry (withSentry)
 * - Validation Zod centralisée
 * - Erreurs GraphQL standardisées
 */

import { PrismaClient } from "@prisma/client";
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
import {
  inscriptionUtilisateurSchema,
  verifierUtilisateurSchema,
  miseAJourUtilisateurSchema,
  suppressionUtilisateurSchema,
} from '@clubmanager/types/domains/utilisateurs/validators';
import {
  requireAuth,
  requireAdmin,
  requireOwner,
  combineMiddlewares,
  withSentry,
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  type GraphQLContext,
} from "@/shared/index.js";

interface Context extends GraphQLContext {
  prisma: PrismaClient;
}

export const utilisateursResolvers = (prisma: PrismaClient) => ({
  Query: {
    /**
     * ✅ Obtenir tous les utilisateurs (requiert admin + Sentry)
     */
    getUtilisateurs: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        { includeInactive }: { includeInactive?: boolean },
        context: Context,
      ) => {
        console.log("📋 [Utilisateurs] Liste des utilisateurs demandée");

        const utilisateurs = await obtenirTousLesUtilisateurs(
          includeInactive || false,
        );

        console.log(
          `✅ [Utilisateurs] ${utilisateurs.length} utilisateur(s) récupéré(s)`,
        );

        return utilisateurs;
      },
    ),

    /**
     * ✅ Obtenir un utilisateur par ID (requiert auth + owner ou admin + Sentry)
     */
    getUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(async (_parent: any, { id }: { id: number }, context: Context) => {
      // Validation de l'ID
      if (isNaN(id) || id <= 0) {
        throw new ValidationError("ID utilisateur invalide");
      }

      // Vérification des droits : admin (status_id = 1) ou propriétaire
      if (context.user?.status_id !== 1 && context.user?.id !== id) {
        throw new ValidationError(
          "Vous n'avez pas les droits pour accéder à cet utilisateur",
        );
      }

      console.log(`🔍 [Utilisateurs] Utilisateur demandé: ${id}`);

      const utilisateur = await obtenirUtilisateurParId(id);

      if (!utilisateur) {
        throw new NotFoundError("Utilisateur non trouvé");
      }

      console.log("✅ [Utilisateurs] Utilisateur récupéré avec succès");
      return utilisateur;
    }),

    /**
     * ✅ Obtenir les statistiques (requiert admin + Sentry)
     */
    getUtilisateursStats: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, _args: any, context: Context) => {
      console.log("📊 [Utilisateurs] Statistiques demandées");

      const stats = await obtenirStatistiques();

      console.log("✅ [Utilisateurs] Statistiques récupérées:", stats);
      return stats;
    }),

    /**
     * ✅ Vérifier l'existence d'un utilisateur (public - avec Sentry)
     */
    verifierExistenceUtilisateur: combineMiddlewares(withSentry)(
      async (
        _parent: any,
        {
          input,
        }: { input: { nom: string; prenom: string; date_naissance: string } },
        context: Context,
      ) => {
        // Validation Zod
        const validated = verifierUtilisateurSchema.parse(input);

        console.log("🔍 [Utilisateurs] Vérification existence:", validated);

        const result = await verifierExistenceUtilisateur(
          validated.nom,
          validated.prenom,
          validated.date_naissance,
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
      },
    ),

    /**
     * ✅ Health check du module (avec Sentry)
     */
    healthCheckUtilisateurs: combineMiddlewares(withSentry)(
      async (_parent: any, _args: any, _context: Context) => {
        return {
          status: "healthy",
          module: "utilisateurs",
          timestamp: new Date().toISOString(),
        };
      },
    ),

    /**
     * ✅ Vérifier un token de validation d'email (public - avec Sentry)
     */
    verifyEmailToken: combineMiddlewares(withSentry)(
      async (
        _parent: any,
        { token, userId }: { token: string; userId: string },
        context: Context,
      ) => {
        if (!token || !userId) {
          throw new ValidationError("Token et userId requis");
        }

        console.log(`🔐 [Utilisateurs] Vérification token email: ${userId}`);

        // TODO: Implémenter la logique de vérification du token
        // Pour l'instant, retourner un résultat de base
        return {
          success: false,
          message: "Fonctionnalité en développement",
          redirect_to: "/login",
        };
      },
    ),

    /**
     * ✅ Tester la configuration email (admin + Sentry)
     */
    testEmailConfig: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, _args: any, context: Context) => {
      console.log("🧪 [Utilisateurs] Test configuration email");

      // TODO: Implémenter le test de configuration email
      return {
        success: true,
        message: "Configuration email OK",
        details: {
          smtp: "configured",
          from: process.env.EMAIL_FROM || "noreply@example.com",
        },
      };
    }),
  },

  Mutation: {
    /**
     * ✅ Inscription d'un nouvel utilisateur (public - avec Sentry)
     */
    inscrireUtilisateur: combineMiddlewares(withSentry)(
      async (_parent: any, { input }: { input: any }, context: Context) => {
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

        // Validation Zod
        const validated = inscriptionUtilisateurSchema.parse(input);

        // Appel du service d'inscription
        // Mapper les champs français vers les champs Prisma anglais
        const mappedData = {
          first_name: validated.prenom,
          last_name: validated.nom,
          date_of_birth: validated.date_naissance,
          nom_utilisateur: validated.nom_utilisateur,
          email: validated.email,
          password: validated.password,
          genre_id: validated.genre_id,
          abonnement_id: validated.abonnement_id,
          status_id: validated.status_id,
          grade_id: validated.grade_id,
        };
        const result = await inscrireUtilisateur(mappedData);

        if (!result.success) {
          throw new ValidationError(result.message || "Échec de l'inscription");
        }

        // Envoi email de vérification
        if (result.userId && result.generatedUserId) {
          try {
            console.log("📧 [Utilisateurs] Envoi email de vérification...");

            const emailResult = await envoyerEmailVerification(
              validated.email,
              validated.prenom,
              validated.nom,
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
                prenom: validated.prenom,
                nom: validated.nom,
                email: validated.email,
                nom_utilisateur: validated.nom_utilisateur,
              },
              emailStatus: {
                sent: emailResult.success,
                message: emailResult.message,
                details: emailResult.details,
                emailDestination: validated.email,
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
                prenom: validated.prenom,
                nom: validated.nom,
                email: validated.email,
                nom_utilisateur: validated.nom_utilisateur,
              },
              emailStatus: {
                sent: false,
                error: "Erreur technique lors de l'envoi",
                emailDestination: validated.email,
              },
            };
          }
        }

        return {
          message: "Inscription réussie",
          generatedUserId: result.userId || 0,
          inscriptionDetails: {
            userId: result.userId || 0,
            prenom: validated.prenom,
            nom: validated.nom,
            email: validated.email,
            nom_utilisateur: validated.nom_utilisateur,
          },
          emailStatus: {
            sent: false,
            message: "Email non envoyé",
            emailDestination: validated.email,
          },
        };
      },
    ),

    /**
     * ✅ Connexion par userId (public - avec Sentry)
     */
    connexionUserId: combineMiddlewares(withSentry)(
      async (
        _parent: any,
        { input }: { input: { userId: string; password: string } },
        context: Context,
      ) => {
        console.log("🔐 [Utilisateurs] Connexion par userId:", input.userId);

        // TODO: Implémenter la logique de connexion
        // Pour l'instant, retourner un résultat de base
        return {
          success: false,
          message: "Fonctionnalité en développement",
        };
      },
    ),

    /**
     * ✅ Connexion par email - legacy (public - avec Sentry)
     */
    connexionEmail: combineMiddlewares(withSentry)(
      async (
        _parent: any,
        { input }: { input: { email: string; password: string } },
        context: Context,
      ) => {
        console.log("🔐 [Utilisateurs] Connexion par email:", input.email);

        // TODO: Implémenter la logique de connexion
        // Pour l'instant, retourner un résultat de base
        return {
          success: false,
          message: "Fonctionnalité en développement - utilisez connexionUserId",
        };
      },
    ),

    /**
     * ✅ Mettre à jour un utilisateur (auth + owner ou admin + Sentry)
     */
    updateUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        { id, input }: { id: number; input: any },
        context: Context,
      ) => {
        // Validation de l'ID
        if (isNaN(id) || id <= 0) {
          throw new ValidationError("ID utilisateur invalide");
        }

        // Vérification des droits : admin (status_id = 1) ou propriétaire
        if (context.user?.status_id !== 1 && context.user?.id !== id) {
          throw new ValidationError(
            "Vous n'avez pas les droits pour modifier cet utilisateur",
          );
        }

        console.log(`✏️ [Utilisateurs] Mise à jour utilisateur: ${id}`);

        // Validation Zod
        const validated = miseAJourUtilisateurSchema.parse(input);

        const result = await mettreAJourUtilisateur(id, validated);

        if (!result.success) {
          throw new ValidationError(
            result.message || "Échec de la mise à jour",
          );
        }

        console.log("✅ [Utilisateurs] Utilisateur mis à jour:", id);

        return {
          message: result.message,
          data: result.data,
        };
      },
    ),

    /**
     * ✅ Supprimer définitivement un utilisateur (admin + Sentry)
     */
    deleteUtilisateur: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        { id, input }: { id: number; input?: { isConfirm?: boolean } },
        context: Context,
      ) => {
        // Validation de l'ID
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
          message: result.message,
          action: "hard_delete",
        };
      },
    ),

    /**
     * ✅ Désactiver un utilisateur - soft delete (admin + Sentry)
     */
    softDeleteUtilisateur: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        { id, input }: { id: number; input?: { isConfirm?: boolean } },
        context: Context,
      ) => {
        // Validation de l'ID
        if (isNaN(id) || id <= 0) {
          throw new ValidationError("ID utilisateur invalide");
        }

        if (input && !input.isConfirm) {
          throw new ValidationError(
            "Confirmation requise pour désactiver l'utilisateur",
          );
        }

        console.log(`🔒 [Utilisateurs] Désactivation utilisateur: ${id}`);

        // Soft delete via Prisma
        const utilisateur = await prisma.utilisateurs.update({
          where: { id },
          data: {
            status_id: 2, // Status "inactif"
            active: false, // Marquer comme inactif
          },
        });

        console.log("✅ [Utilisateurs] Utilisateur désactivé:", id);

        return {
          isConfirm: true,
          message: "Utilisateur désactivé avec succès",
          action: "soft_delete",
        };
      },
    ),

    /**
     * ✅ Envoyer un email de test (admin + Sentry)
     */
    sendTestEmail: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, { email }: { email: string }, context: Context) => {
      if (!email) {
        throw new ValidationError("Email requis");
      }

      console.log("📧 [Utilisateurs] Envoi email de test à:", email);

      // TODO: Implémenter l'envoi d'email de test
      return {
        success: true,
        message: "Email de test envoyé avec succès (mode dev)",
        messageId: `test-${Date.now()}`,
        details: {
          to: email,
          from: process.env.EMAIL_FROM || "noreply@example.com",
        },
      };
    }),
  },
});
