/**
 * Resolvers GraphQL pour le module Utilisateurs
 * Convertit les handlers REST en resolvers GraphQL
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
} from "../services/utilisateurs.service.js";
import { inscriptionUtilisateurSchema } from "../validators/utilisateurs.schema.js";
import { emailClient } from "../../../../clients/emailClient.js";
import { EmailService } from "../../../../services/emailService.js";

interface Context {
  prisma: PrismaClient;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    status_id: number;
    role: string;
    status: string;
  };
  req?: any;
  res?: any;
}

const emailService = new EmailService();

export const utilisateursResolvers = (prisma: PrismaClient) => ({
  Query: {
    /**
     * Vérifier l'existence d'un utilisateur
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
          return {
            message: "Nom, prénom et date de naissance requis",
            type: "VALIDATION_ERROR",
            userExists: false,
          };
        }

        console.log("🔍 [Utilisateurs] Vérification existence:", {
          nom,
          prenom,
          date_naissance,
        });

        const utilisateursClient = new Utilisateurs();
        const result = await utilisateursClient.verifierExistenceUtilisateur(
          nom,
          prenom,
          date_naissance,
        );

        if (result.userExists) {
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
          message: "Utilisateur disponible pour inscription",
          type: "USER_AVAILABLE",
          userExists: false,
          canRegister: true,
          userData: null,
        };
      } catch (error: any) {
        console.error(
          "❌ [Utilisateurs] Erreur vérification existence:",
          error,
        );
        throw new GraphQLError("Erreur serveur lors de la vérification", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
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

    /**
     * Récupérer tous les utilisateurs
     */
    getUtilisateurs: async (
      _: any,
      { includeInactive }: { includeInactive?: boolean },
      context: Context,
    ) => {
      if (!context.user) {
        throw new GraphQLError("Non authentifié", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      try {
        console.log("👥 [Utilisateurs] Récupération des utilisateurs");
        const includeInactiveFlag = includeInactive || false;

        const utilisateurs =
          await obtenirTousLesUtilisateurs(includeInactiveFlag);

        if (!utilisateurs || utilisateurs.length === 0) {
          console.log("⚠️ [Utilisateurs] Aucun utilisateur trouvé");
          return [];
        }

        console.log(
          `✅ [Utilisateurs] ${utilisateurs.length} utilisateur(s) récupéré(s)`,
        );
        return utilisateurs;
      } catch (error: any) {
        console.error(
          "❌ [Utilisateurs] Erreur récupération utilisateurs:",
          error,
        );
        throw new GraphQLError(
          "Erreur serveur lors de la récupération des utilisateurs",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        );
      }
    },

    /**
     * Récupérer un utilisateur par ID
     */
    getUtilisateur: async (
      _: any,
      { id }: { id: number },
      context: Context,
    ) => {
      if (!context.user) {
        throw new GraphQLError("Non authentifié", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      try {
        if (isNaN(id) || id <= 0) {
          throw new GraphQLError("ID utilisateur invalide", {
            extensions: { code: "BAD_REQUEST" },
          });
        }

        console.log(`👤 [Utilisateurs] Récupération utilisateur ID: ${id}`);

        const utilisateur = await obtenirUtilisateurParId(id);

        if (!utilisateur) {
          throw new GraphQLError("Utilisateur non trouvé", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        console.log("✅ [Utilisateurs] Utilisateur récupéré avec succès");
        return utilisateur;
      } catch (error: any) {
        console.error(
          "❌ [Utilisateurs] Erreur récupération utilisateur:",
          error,
        );

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError(
          "Erreur serveur lors de la récupération de l'utilisateur",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        );
      }
    },

    /**
     * Récupérer les statistiques des utilisateurs
     */
    getUtilisateursStats: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Non authentifié", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      try {
        console.log("📊 [Utilisateurs] Récupération des statistiques");

        const stats = await obtenirStatistiques();

        console.log("✅ [Utilisateurs] Statistiques récupérées:", stats);
        return stats;
      } catch (error: any) {
        console.error(
          "❌ [Utilisateurs] Erreur récupération statistiques:",
          error,
        );
        throw new GraphQLError(
          "Erreur serveur lors de la récupération des statistiques",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        );
      }
    },

    /**
     * Vérifier un token de validation d'email
     */
    verifyEmailToken: async (
      _: any,
      { token, userId }: { token: string; userId: string },
      context: Context,
    ) => {
      try {
        if (!token || !userId) {
          return {
            success: false,
            error: "Token et userId requis",
            redirect_to: "/pages/connexion?error=missing_params",
          };
        }

        console.log("🔍 [Utilisateurs] Validation token email:", {
          token: token.substring(0, 8) + "...",
          userId,
        });

        const result = await emailClient.validateEmailToken(token, userId);

        if (result.success) {
          console.log("✅ [Utilisateurs] Token validé avec succès");
          return {
            success: true,
            message: result.message,
            data: result.data,
            redirect_to: "/pages/connexion?verified=true",
          };
        } else {
          console.warn(
            "⚠️ [Utilisateurs] Échec validation token:",
            result.message,
          );
          return {
            success: false,
            error: result.message,
            redirect_to: "/pages/connexion?error=invalid_token",
          };
        }
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur validation token:", error);
        return {
          success: false,
          error: error.message,
          redirect_to: "/pages/connexion?error=server_error",
        };
      }
    },

    /**
     * Tester la configuration email
     */
    testEmailConfig: async () => {
      try {
        console.log("🔧 [Utilisateurs] Test de configuration email");

        const configTest = await emailService.testerConfiguration();

        return {
          success: configTest.success,
          message: configTest.success
            ? "Configuration email OK"
            : "Problèmes de configuration détectés",
          details: configTest.details,
        };
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur test config email:", error);
        return {
          success: false,
          message: "Erreur lors du test de configuration",
          details: { error: error.message },
        };
      }
    },
  },

  Mutation: {
    /**
     * Inscription d'un nouvel utilisateur
     */
    inscrireUtilisateur: async (
      _: any,
      { input }: { input: any },
      context: Context,
    ) => {
      try {
        console.log("📝 [Utilisateurs] Inscription utilisateur");
        console.log("[Utilisateurs] Input reçu:", input);

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
          throw new GraphQLError(
            validationResult.error.issues[0]?.message || "Données invalides",
            {
              extensions: {
                code: "BAD_REQUEST",
                errors: validationResult.error.issues,
              },
            },
          );
        }

        const validatedData = validationResult.data;
        console.log("[Utilisateurs] Données validées:", validatedData);

        // Mapper vers le format attendu
        const mappedData = {
          prenom: validatedData.prenom,
          nom: validatedData.nom,
          nom_utilisateur: validatedData.nom_utilisateur,
          email: validatedData.email,
          password: validatedData.password,
          genre_id: validatedData.genre_id,
          abonnement_id: validatedData.abonnement_id,
          date_naissance: validatedData.date_naissance,
          date_inscription: validatedData.date_inscription,
          status_id: validatedData.status_id,
          grade_id: validatedData.grade_id,
        };

        console.log("[Utilisateurs] Données mappées:", mappedData);

        // Appel du service d'inscription
        const result = await inscrireUtilisateur(mappedData);

        console.log("[Utilisateurs] Résultat inscription:", result);

        // Envoi email de vérification
        if (result.userId && result.generatedUserId) {
          try {
            console.log("📧 [Utilisateurs] Envoi email de vérification...");
            console.log(`📧 [Utilisateurs] Email: ${validatedData.email}`);
            console.log(`📧 [Utilisateurs] UserId: ${result.userId}`);

            const emailResult = await envoyerEmailVerification(
              validatedData.email,
              validatedData.prenom,
              validatedData.nom,
              result.generatedUserId,
              result.userId,
            );

            if (emailResult.success) {
              console.log("✅ [Utilisateurs] Email de vérification envoyé");

              return {
                message: "Inscription réussie et email de vérification envoyé",
                generatedUserId: result.userId,
                inscriptionDetails: {
                  userId: result.userId,
                  prenom: validatedData.prenom,
                  nom: validatedData.nom,
                  email: validatedData.email,
                  nom_utilisateur: validatedData.nom_utilisateur,
                },
                emailStatus: {
                  sent: true,
                  message: emailResult.message,
                  details: emailResult.details,
                  emailDestination: validatedData.email,
                  isTestMode: false,
                },
              };
            } else {
              console.warn("⚠️ [Utilisateurs] Échec envoi email");

              return {
                message:
                  "Inscription réussie mais échec envoi email de vérification",
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
                  message: emailResult.message,
                  details: emailResult.details,
                  emailDestination: validatedData.email,
                  isTestMode: false,
                },
                warning: "L'email de vérification n'a pas pu être envoyé.",
              };
            }
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
                details: { originalError: emailError.message },
                emailDestination: validatedData.email,
                isTestMode: false,
              },
              warning:
                "Une erreur technique s'est produite lors de l'envoi de l'email.",
            };
          }
        } else {
          console.warn("⚠️ [Utilisateurs] Inscription sans UserId généré");

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
            emailStatus: {
              sent: false,
              reason: "Aucun UserId généré",
            },
          };
        }
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur inscription:", error);

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError(
          error.message || "Erreur lors de l'inscription",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        );
      }
    },

    /**
     * Connexion par userId
     */
    connexionUserId: async (
      _: any,
      { input }: { input: { userId: string; password: string } },
      context: Context,
    ) => {
      try {
        const { userId, password } = input;

        if (!userId || !password) {
          throw new GraphQLError("UserId et mot de passe requis", {
            extensions: { code: "BAD_REQUEST" },
          });
        }

        console.log("🔐 [Utilisateurs] Connexion userId:", userId);

        const utilisateursClient = new Utilisateurs();
        const result = await utilisateursClient.validerConnexion({
          userId,
          password,
        });

        if (result.isFind) {
          console.log("✅ [Utilisateurs] Connexion réussie");
          return {
            success: true,
            message: result.message,
            data: result.dataToStore,
          };
        } else {
          throw new GraphQLError(result.message || "Identifiants invalides", {
            extensions: { code: "UNAUTHORIZED" },
          });
        }
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur connexion userId:", error);

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError("Erreur serveur lors de la connexion", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    /**
     * Connexion par email (legacy)
     */
    connexionEmail: async (
      _: any,
      { input }: { input: { email: string; password: string } },
      context: Context,
    ) => {
      try {
        const { email, password } = input;

        if (!email || !password) {
          throw new GraphQLError("Email et mot de passe requis", {
            extensions: { code: "BAD_REQUEST" },
          });
        }

        console.log("🔐 [Utilisateurs] Connexion email:", email);

        const utilisateursClient = new Utilisateurs();
        const result = await utilisateursClient.validerConnexion({
          email,
          password,
        });

        if (result.isFind) {
          console.log("✅ [Utilisateurs] Connexion réussie");
          return {
            success: true,
            message: result.message,
            data: result.dataToStore,
          };
        } else {
          throw new GraphQLError(result.message || "Identifiants invalides", {
            extensions: { code: "UNAUTHORIZED" },
          });
        }
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur connexion email:", error);

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError("Erreur serveur lors de la connexion", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    /**
     * Mettre à jour un utilisateur
     */
    updateUtilisateur: async (
      _: any,
      { id, input }: { id: number; input: any },
      context: Context,
    ) => {
      if (!context.user) {
        throw new GraphQLError("Non authentifié", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      try {
        if (isNaN(id) || id <= 0) {
          throw new GraphQLError("ID utilisateur invalide", {
            extensions: { code: "BAD_REQUEST" },
          });
        }

        console.log(`📝 [Utilisateurs] Mise à jour utilisateur ID: ${id}`);
        console.log("[Utilisateurs] Données:", input);

        const updatedUtilisateur = await mettreAJourUtilisateur(id, input);

        console.log("✅ [Utilisateurs] Utilisateur mis à jour");
        return {
          message: "Utilisateur mis à jour avec succès",
          data: updatedUtilisateur,
        };
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur mise à jour:", error);

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError(
          "Erreur serveur lors de la mise à jour de l'utilisateur",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        );
      }
    },

    /**
     * Supprimer définitivement un utilisateur
     */
    deleteUtilisateur: async (
      _: any,
      { id, input }: { id: number; input: { isConfirm: boolean } },
      context: Context,
    ) => {
      if (!context.user) {
        throw new GraphQLError("Non authentifié", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      try {
        if (isNaN(id) || id <= 0) {
          throw new GraphQLError("ID utilisateur invalide", {
            extensions: { code: "BAD_REQUEST" },
          });
        }

        if (!input.isConfirm) {
          throw new GraphQLError(
            "Confirmation requise pour supprimer l'utilisateur",
            {
              extensions: { code: "BAD_REQUEST" },
            },
          );
        }

        console.log(
          `🗑️ [Utilisateurs] Suppression définitive utilisateur ID: ${id}`,
        );

        await supprimerUtilisateur(id);

        console.log("✅ [Utilisateurs] Utilisateur supprimé définitivement");
        return {
          isConfirm: true,
          message: "Utilisateur supprimé avec succès",
          action: "hard_delete",
        };
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur suppression:", error);

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError(
          "Erreur serveur lors de la suppression de l'utilisateur",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        );
      }
    },

    /**
     * Désactiver un utilisateur (soft delete)
     */
    softDeleteUtilisateur: async (
      _: any,
      { id, input }: { id: number; input: { isConfirm: boolean } },
      context: Context,
    ) => {
      if (!context.user) {
        throw new GraphQLError("Non authentifié", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      try {
        if (isNaN(id) || id <= 0) {
          throw new GraphQLError("ID utilisateur invalide", {
            extensions: { code: "BAD_REQUEST" },
          });
        }

        if (!input.isConfirm) {
          throw new GraphQLError(
            "Confirmation requise pour désactiver l'utilisateur",
            {
              extensions: { code: "BAD_REQUEST" },
            },
          );
        }

        console.log(`🗑️ [Utilisateurs] Désactivation utilisateur ID: ${id}`);

        const utilisateursClient = new Utilisateurs();
        await utilisateursClient.supprimerSoft(id);

        console.log("✅ [Utilisateurs] Utilisateur désactivé");
        return {
          isConfirm: true,
          message: "Utilisateur désactivé avec succès",
          action: "soft_delete",
        };
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur désactivation:", error);

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError(
          "Erreur serveur lors de la désactivation de l'utilisateur",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        );
      }
    },

    /**
     * Envoyer un email de test
     */
    sendTestEmail: async (
      _: any,
      { email }: { email: string },
      context: Context,
    ) => {
      try {
        if (!email) {
          throw new GraphQLError("Email requis pour le test", {
            extensions: { code: "BAD_REQUEST" },
          });
        }

        console.log("🧪 [Utilisateurs] Test email vers:", email);

        const result = await emailService.envoyerEmailTest(email);

        if (result.success) {
          return {
            success: true,
            message: "Email de test envoyé avec succès",
            messageId: result.messageId,
            details: result.details,
          };
        } else {
          return {
            success: false,
            message: "Échec de l'envoi de l'email de test",
            error: result.error,
            details: result.details,
          };
        }
      } catch (error: any) {
        console.error("❌ [Utilisateurs] Erreur test email:", error);
        return {
          success: false,
          message: "Erreur lors du test d'envoi d'email",
          error: error.message,
        };
      }
    },
  },
});
