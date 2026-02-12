/**
 * Resolvers GraphQL pour le module Professeurs
 * Gestion des professeurs, promotions, statuts et planning
 */

import { GraphQLError } from "graphql";
import { z } from "zod";
import {
  requireAuth,
  requireAdmin,
  withSentry,
  combineMiddlewares,
} from "../../../../shared/middleware/index.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";
import {
  getProfesseursSchema,
  getProfesseurByIdGraphQLSchema,
  ajouterProfesseurSchema,
  modifierStatutProfesseurSchema,
  getPlanningProfesseurGraphQLSchema,
} from "@clubmanager/types/validators";
import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import { emailClient } from "../../../../infrastructure/external-services/emailClient.js";
import type { EmailClient } from "../../../../infrastructure/external-services/emailClient.js";

/**
 * Context GraphQL avec utilisateur authentifié
 */
interface GraphQLContext {
  user?: {
    id: number;
    email: string;
    role_id: number;
  };
  emailClient?: EmailClient;
}

/**
 * Extraire les IDs des utilisateurs depuis différents formats de données
 */
function extraireIdsUtilisateurs(data: any): number[] {
  console.log(
    "🔍 [extractUserIds] Extraction des IDs depuis:",
    JSON.stringify(data, null, 2),
  );

  let userIds: number[] = [];

  // Cas 1: data.utilisateurs est un tableau
  if (data.utilisateurs && Array.isArray(data.utilisateurs)) {
    console.log("🔍 [extractUserIds] Cas 1: data.utilisateurs est un tableau");

    // Vérifier si c'est un tableau de strings/numbers (IDs directs)
    if (
      data.utilisateurs.every(
        (item: any) => typeof item === "string" || typeof item === "number",
      )
    ) {
      console.log(
        "🔍 [extractUserIds] Cas 1a: Tableau d'IDs directs (strings/numbers)",
      );
      userIds = data.utilisateurs
        .map((id: any) => {
          console.log(
            "🔍 [extractUserIds] ID direct:",
            id,
            "converti en:",
            parseInt(id),
          );
          return parseInt(id);
        })
        .filter((id: number) => !isNaN(id));
    }
    // Sinon c'est un tableau d'objets
    else {
      console.log("🔍 [extractUserIds] Cas 1b: Tableau d'objets");
      userIds = data.utilisateurs
        .map((user: any) => {
          const id = user.id || user.userId || user.user_id;
          console.log("🔍 [extractUserIds] User:", user, "ID extrait:", id);
          return parseInt(id);
        })
        .filter((id: number) => !isNaN(id));
    }
  }
  // Cas 2: data est directement un tableau
  else if (Array.isArray(data)) {
    console.log("🔍 [extractUserIds] Cas 2: data est directement un tableau");
    userIds = data
      .map((item: any) => {
        const id =
          typeof item === "object"
            ? item.id || item.userId || item.user_id
            : item;
        return parseInt(id);
      })
      .filter((id: number) => !isNaN(id));
  }
  // Cas 3: data contient un seul utilisateur
  else if (data.id || data.userId || data.user_id) {
    console.log("🔍 [extractUserIds] Cas 3: data contient un seul utilisateur");
    const id = data.id || data.userId || data.user_id;
    userIds = [parseInt(id)].filter((id: number) => !isNaN(id));
  }
  // Cas 4: autres propriétés possibles
  else if (data.users && Array.isArray(data.users)) {
    console.log("🔍 [extractUserIds] Cas 4: data.users existe");
    userIds = data.users
      .map((user: any) => {
        const id = user.id || user.userId || user.user_id || user;
        return parseInt(id);
      })
      .filter((id: number) => !isNaN(id));
  }

  console.log("🔍 [extractUserIds] IDs extraits:", userIds);
  return userIds;
}

/**
 * Queries pour les professeurs
 */
export const professeursQueries = {
  /**
   * Récupérer tous les professeurs
   * Accessible aux utilisateurs authentifiés
   */
  professeurs: combineMiddlewares(
    requireAuth,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📋 [GraphQL Query] professeurs - Récupération de tous les professeurs",
    );

    try {
      // Validation (pas de paramètres requis)
      getProfesseursSchema.parse({});

      // Récupérer tous les professeurs
      const professeurs = await prisma.professeurs.findMany({
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          grade_id: true,
          status_id: true,
        },
      });

      console.log(
        `✅ [GraphQL Query] ${professeurs.length} professeurs récupérés`,
      );

      return {
        success: true,
        message: `${professeurs.length} professeur(s) trouvé(s)`,
        data: professeurs,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération professeurs:",
        error,
      );

      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Données invalides",
          formatZodErrors(error.errors),
        );
      }

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des professeurs",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Récupérer un professeur par son ID
   * Accessible aux utilisateurs authentifiés
   */
  professeur: combineMiddlewares(
    requireAuth,
    withSentry,
  )(async (_: any, args: { id: number }, context: GraphQLContext) => {
    console.log(
      `📋 [GraphQL Query] professeur - Récupération professeur ID: ${args.id}`,
    );

    try {
      // Validation de l'ID
      const validatedData = getProfesseurByIdGraphQLSchema.parse(args);

      const professeur = await prisma.professeurs.findUnique({
        where: {
          id: validatedData.id,
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          grade_id: true,
          status_id: true,
        },
      });

      if (!professeur) {
        console.log(
          `⚠️ [GraphQL Query] Professeur ${validatedData.id} non trouvé`,
        );
        throw new NotFoundError(
          `Aucun professeur avec l'ID ${validatedData.id}`,
        );
      }

      console.log(`✅ [GraphQL Query] Professeur ${validatedData.id} trouvé`);

      return {
        success: true,
        message: "Professeur trouvé",
        data: professeur,
      };
    } catch (error) {
      console.error(
        `❌ [GraphQL Query] Erreur récupération professeur ${args.id}:`,
        error,
      );

      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "ID du professeur invalide",
          formatZodErrors(error.errors),
        );
      }

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw new InternalServerError(
        "Erreur serveur lors de la récupération du professeur",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Récupérer le planning d'un professeur
   * Accessible aux utilisateurs authentifiés
   */
  planningProfesseur: combineMiddlewares(
    requireAuth,
    withSentry,
  )(async (_: any, args: { id: number }, context: GraphQLContext) => {
    console.log(
      `📅 [GraphQL Query] planningProfesseur - Récupération planning professeur ID: ${args.id}`,
    );

    try {
      // Validation de l'ID
      const validatedData = getPlanningProfesseurGraphQLSchema.parse(args);

      console.log(
        `🔍 [GraphQL Query] Récupération planning pour professeur ID: ${validatedData.id}`,
      );

      // Récupérer les cours récurrents du professeur via la table de liaison
      const coursRecurrentsProf =
        await prisma.cours_recurrent_professeur.findMany({
          where: {
            professeur_id: validatedData.id,
          },
          include: {
            cours_recurrent: true,
          },
        });

      // Formater les données pour correspondre au format CoursProfesseur
      const planning = coursRecurrentsProf.map((crp) => ({
        id: crp.cours_recurrent.id,
        nom_cours: crp.cours_recurrent.type_cours || "",
        description: "",
        jour_semaine: crp.cours_recurrent.jour_semaine?.toString() || "",
        heure_debut: crp.cours_recurrent.heure_debut?.toString() || "",
        heure_fin: crp.cours_recurrent.heure_fin?.toString() || "",
        salle: "",
        niveau: "",
        capacite_max: undefined,
        professeur_id: crp.professeur_id,
        nombre_inscrits: 0,
      }));

      console.log(
        `✅ [GraphQL Query] Planning récupéré: ${planning.length} cours`,
      );

      return {
        success: true,
        isFind: planning.length > 0,
        message:
          planning.length > 0
            ? `${planning.length} cours trouvé(s)`
            : "Aucun cours trouvé",
        data: planning,
        count: planning.length,
        professeur_id: validatedData.id,
      };
    } catch (error) {
      console.error(
        `❌ [GraphQL Query] Erreur récupération planning professeur ${args.id}:`,
        error,
      );

      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "ID du professeur invalide",
          formatZodErrors(error.errors),
        );
      }

      throw new InternalServerError(
        "Erreur serveur lors de la récupération du planning",
        error instanceof Error ? error : undefined,
      );
    }
  }),
};

/**
 * Mutations pour les professeurs
 */
export const professeursMutations = {
  /**
   * Ajouter/promouvoir un ou plusieurs utilisateurs comme professeurs
   * Accessible uniquement aux administrateurs
   */
  ajouterProfesseur: combineMiddlewares(
    requireAuth,
    requireAdmin,
    withSentry,
  )(async (_: any, args: { input: any }, context: GraphQLContext) => {
    console.log(
      "📝 [GraphQL Mutation] ajouterProfesseur - Promotion de professeur(s)",
    );

    try {
      const data = args.input;

      console.log(
        "📋 [GraphQL Mutation] Données reçues:",
        JSON.stringify(data, null, 2),
      );

      // Validation avec Zod
      const validatedData = ajouterProfesseurSchema.parse(data);

      // Extraire les IDs des utilisateurs
      const userIds = extraireIdsUtilisateurs(validatedData);

      if (userIds.length === 0) {
        throw new ValidationError("Aucun utilisateur valide fourni", [
          {
            field: "utilisateurs",
            message: "Au moins un ID utilisateur valide est requis",
          },
        ]);
      }

      console.log(
        `📝 [GraphQL Mutation] Promotion de ${userIds.length} utilisateur(s): ${userIds.join(", ")}`,
      );

      // Vérifier que les utilisateurs existent
      const utilisateurs = await prisma.utilisateurs.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      if (utilisateurs.length === 0) {
        throw new NotFoundError(
          "Aucun utilisateur trouvé avec les IDs fournis",
        );
      }

      // Vérifier quels utilisateurs ne sont pas déjà professeurs
      const professeursExistants = await prisma.professeurs.findMany({
        where: {
          email: {
            in: utilisateurs.map((u) => u.email),
          },
        },
      });

      const emailsProfsExistants = new Set(
        professeursExistants.map((p) => p.email),
      );
      const utilisateursAPromouvoir = utilisateurs.filter(
        (u) => !emailsProfsExistants.has(u.email),
      );
      const dejaProfs = utilisateurs.filter((u) =>
        emailsProfsExistants.has(u.email),
      );

      if (dejaProfs.length > 0) {
        console.log(
          `⚠️ [GraphQL Mutation] ${dejaProfs.length} utilisateur(s) déjà professeur(s): ${dejaProfs.map((u) => u.id).join(", ")}`,
        );
      }

      if (utilisateursAPromouvoir.length === 0) {
        return {
          success: true,
          message: "Tous les utilisateurs sont déjà professeurs",
          data: {
            promus: [],
            dejaProfs: dejaProfs.map((u) => u.id),
          },
        };
      }

      // Créer les professeurs dans la table professeurs
      const nouveauxProfs = await Promise.all(
        utilisateursAPromouvoir.map((utilisateur) =>
          prisma.professeurs.create({
            data: {
              nom: utilisateur.last_name,
              prenom: utilisateur.first_name,
              email: utilisateur.email,
              grade_id: utilisateur.grade_id,
              status_id: utilisateur.status_id || 1,
            },
          }),
        ),
      );

      console.log(
        `✅ [GraphQL Mutation] ${nouveauxProfs.length} utilisateur(s) promu(s) professeur(s)`,
      );

      // Envoyer les emails de promotion
      try {
        const emailClientToUse = context.emailClient || emailClient;

        for (const utilisateur of utilisateursAPromouvoir) {
          try {
            console.log(
              `📧 [GraphQL Mutation] Envoi email de promotion à ${utilisateur.email}`,
            );

            const emailResult = await emailClientToUse.sendPromotionEmail(
              utilisateur,
              {
                templateName: "promotion-professeur",
                variables: {
                  customMessage: "Bienvenue dans l'équipe des professeurs !",
                  supportEmail:
                    process.env.SUPPORT_EMAIL || "support@clubmanager.com",
                },
              },
            );

            if (emailResult.success) {
              console.log(
                `✅ [GraphQL Mutation] Email envoyé avec succès à ${utilisateur.email}`,
              );
            } else {
              console.error(
                `❌ [GraphQL Mutation] Erreur envoi email à ${utilisateur.email}:`,
                emailResult.error,
              );
            }
          } catch (emailError) {
            console.error(
              `❌ [GraphQL Mutation] Erreur envoi email à ${utilisateur.email}:`,
              emailError,
            );
            // On ne fait pas échouer la promotion pour une erreur d'email
          }
        }
      } catch (emailError) {
        console.error(
          "❌ [GraphQL Mutation] Erreur générale lors de l'envoi des emails:",
          emailError,
        );
        // On ne fait pas échouer la promotion pour une erreur d'email
      }

      return {
        success: true,
        message: `${nouveauxProfs.length} utilisateur(s) promu(s) professeur(s) avec succès`,
        data: {
          promus: nouveauxProfs.map((p) => p.id),
          dejaProfs: dejaProfs.map((u) => u.id),
        },
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Mutation] Erreur lors de l'ajout/promotion:",
        error,
      );

      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Données invalides",
          formatZodErrors(error.errors),
        );
      }

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      throw new InternalServerError(
        "Erreur serveur lors de la promotion des professeurs",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Modifier le statut d'un professeur
   * Accessible uniquement aux administrateurs
   */
  modifierStatutProfesseur: combineMiddlewares(
    requireAuth,
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      args: { input: { id: number; status_id: number } },
      context: GraphQLContext,
    ) => {
      console.log(
        "📝 [GraphQL Mutation] modifierStatutProfesseur - Modification statut professeur",
      );

      try {
        const { id, status_id } = args.input;

        console.log(
          `📋 [GraphQL Mutation] Données reçues: id=${id}, status_id=${status_id}`,
        );

        // Validation avec Zod
        const validatedData = modifierStatutProfesseurSchema.parse({
          id,
          status_id,
        });

        // Vérifier que le professeur existe
        const professeur = await prisma.professeurs.findUnique({
          where: {
            id: validatedData.id,
          },
        });

        if (!professeur) {
          throw new NotFoundError(
            `Aucun professeur trouvé avec l'ID ${validatedData.id}`,
          );
        }

        // Mettre à jour le statut
        await prisma.professeurs.update({
          where: {
            id: validatedData.id,
          },
          data: {
            status_id: validatedData.status_id,
          },
        });

        console.log(
          `✅ [GraphQL Mutation] Statut du professeur ${validatedData.id} modifié à ${validatedData.status_id}`,
        );

        return {
          success: true,
          message: "Statut du professeur modifié avec succès",
          data: {
            id: validatedData.id,
            status_id: validatedData.status_id,
          },
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Mutation] Erreur lors de la modification du statut:",
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "Données invalides",
            formatZodErrors(error.errors),
          );
        }

        if (
          error instanceof NotFoundError ||
          error instanceof ValidationError
        ) {
          throw error;
        }

        throw new InternalServerError(
          "Erreur serveur lors de la modification du statut",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),
};

/**
 * Resolvers combinés pour export
 */
export const professeursResolvers = {
  Query: professeursQueries,
  Mutation: professeursMutations,
};
