/**
 * Resolvers GraphQL pour le module Statistiques
 * Gestion des statistiques de fréquentation, progression, et statistiques globales
 */

import { GraphQLError, GraphQLResolveInfo } from "graphql";
import { z } from "zod";
import {
  requireAuth,
  requireAdmin,
  withSentry,
  combineMiddlewares,
} from "@/shared/middleware/index.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "@/shared/errors/GraphQLErrors.js";
import {
  utilisateurIdGraphQLSchema,
  userIdGraphQLSchema,
} from "@clubmanager/types/validators";
import {
  obtenirStatistiquesFrequentation,
  obtenirProgressionUtilisateur,
  obtenirPresenceParMois,
  getNombreMembres,
  getTotalPaiementsMois,
  getPaiementsRecents,
  getPaiementsEnAttente,
  getPlansActifs,
  getTauxRenouvellement,
  getPaiementsParMois,
  getMembresParPlan,
  getCoursSemaine,
  getDerniersPaiements,
  getPaiementsEchus,
  getNouveauxMembres,
  getTopMembresAssidus,
  getMembresParGrade,
  getMembresParGenre,
  getProchainsAnniversaires,
  getArticlesPlusVendus,
} from "../services/index.js";

/**
 * Context GraphQL avec utilisateur authentifié
 */
interface GraphQLContext {
  user?: {
    id: number;
    email: string;
    role_id: number;
  };
}

/**
 * Queries pour les statistiques
 */
export const statistiquesQueries = {
  /**
   * Statistiques de fréquentation d'un utilisateur
   * Accessible aux utilisateurs authentifiés
   */
  frequentationUtilisateur: combineMiddlewares(
    requireAuth,
    withSentry,
  )(
    async (
      _: any,
      args: { utilisateurId: number },
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        `📊 [GraphQL Query] frequentationUtilisateur - Récupération fréquentation utilisateur ${args.utilisateurId}`,
      );

      try {
        // Validation de l'ID
        const validatedData = utilisateurIdGraphQLSchema.parse(args);

        const data = await obtenirStatistiquesFrequentation(
          validatedData.utilisateurId,
        );

        console.log(
          `✅ [GraphQL Query] Statistiques de fréquentation récupérées pour l'utilisateur ${validatedData.utilisateurId}`,
        );

        return {
          success: true,
          message: "Statistiques de fréquentation récupérées avec succès",
          data,
        };
      } catch (error) {
        console.error(
          `❌ [GraphQL Query] Erreur récupération fréquentation utilisateur ${args.utilisateurId}:`,
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID utilisateur invalide",
            formatZodErrors(error.errors),
          );
        }

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        if (errorMessage.includes("Aucune statistique")) {
          throw new NotFoundError(
            "Aucune statistique de fréquentation trouvée",
          );
        }

        throw new InternalServerError(
          "Erreur serveur lors de la récupération des statistiques de fréquentation",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Progression d'un utilisateur
   * Accessible aux utilisateurs authentifiés
   */
  progressionUtilisateur: combineMiddlewares(
    requireAuth,
    withSentry,
  )(
    async (
      _: any,
      args: { userId: number },
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        `📊 [GraphQL Query] progressionUtilisateur - Récupération progression utilisateur ${args.userId}`,
      );

      try {
        // Validation de l'ID
        const validatedData = userIdGraphQLSchema.parse(args);

        const data = await obtenirProgressionUtilisateur(validatedData.userId);

        console.log(
          `✅ [GraphQL Query] Progression récupérée pour l'utilisateur ${validatedData.userId}`,
        );

        return {
          success: true,
          message: "Progression récupérée avec succès",
          data,
        };
      } catch (error) {
        console.error(
          `❌ [GraphQL Query] Erreur récupération progression utilisateur ${args.userId}:`,
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID utilisateur invalide",
            formatZodErrors(error.errors),
          );
        }

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        if (errorMessage.includes("Aucune progression")) {
          throw new NotFoundError("Aucune progression trouvée");
        }

        throw new InternalServerError(
          "Erreur serveur lors de la récupération de la progression",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Présences par mois d'un utilisateur
   * Accessible aux utilisateurs authentifiés
   */
  presenceUtilisateur: combineMiddlewares(
    requireAuth,
    withSentry,
  )(
    async (
      _: any,
      args: { userId: number },
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        `📊 [GraphQL Query] presenceUtilisateur - Récupération présences utilisateur ${args.userId}`,
      );

      try {
        // Validation de l'ID
        const validatedData = userIdGraphQLSchema.parse(args);

        const data = await obtenirPresenceParMois(validatedData.userId);

        console.log(
          `✅ [GraphQL Query] Présences récupérées pour l'utilisateur ${validatedData.userId}`,
        );

        return {
          success: true,
          message: "Présences récupérées avec succès",
          data,
        };
      } catch (error) {
        console.error(
          `❌ [GraphQL Query] Erreur récupération présences utilisateur ${args.userId}:`,
          error,
        );

        if (error instanceof z.ZodError) {
          throw new ValidationError(
            "ID utilisateur invalide",
            formatZodErrors(error.errors),
          );
        }

        throw new InternalServerError(
          "Erreur serveur lors de la récupération des présences",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Statistiques globales du dashboard
   * Accessible aux administrateurs uniquement
   */
  statistiquesGlobales: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      __: any,
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        "📊 [GraphQL Query] statistiquesGlobales - Récupération statistiques globales",
      );

      try {
        // Récupérer toutes les statistiques en parallèle
        const [
          nombreMembres,
          totalPaiementsMois,
          paiementsRecents,
          paiementsEnAttente,
          plansActifs,
          tauxRenouvellement,
          coursSemaine,
        ] = await Promise.all([
          getNombreMembres(),
          getTotalPaiementsMois(),
          getPaiementsRecents(),
          getPaiementsEnAttente(),
          getPlansActifs(),
          getTauxRenouvellement(),
          getCoursSemaine(),
        ]);

        const data = {
          nombreMembres,
          totalPaiementsMois,
          paiementsRecents,
          paiementsEnAttente,
          plansActifs,
          tauxRenouvellement,
          coursSemaine,
        };

        console.log("✅ [GraphQL Query] Statistiques globales récupérées");

        return {
          success: true,
          message: "Statistiques globales récupérées avec succès",
          data,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Query] Erreur récupération statistiques globales:",
          error,
        );

        throw new InternalServerError(
          "Erreur serveur lors de la récupération des statistiques globales",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Nombre total de membres
   * Accessible aux administrateurs uniquement
   */
  nombreMembres: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      __: any,
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        "📊 [GraphQL Query] nombreMembres - Récupération nombre de membres",
      );

      try {
        const data = await getNombreMembres();

        console.log("✅ [GraphQL Query] Nombre de membres récupéré");

        return {
          success: true,
          message: "Nombre de membres récupéré avec succès",
          data,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Query] Erreur récupération nombre membres:",
          error,
        );

        throw new InternalServerError(
          "Erreur serveur lors de la récupération du nombre de membres",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Total des paiements du mois
   * Accessible aux administrateurs uniquement
   */
  totalPaiementsMois: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      __: any,
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        "📊 [GraphQL Query] totalPaiementsMois - Récupération total paiements mois",
      );

      try {
        const data = await getTotalPaiementsMois();

        console.log("✅ [GraphQL Query] Total paiements mois récupéré");

        return {
          success: true,
          message: "Total des paiements du mois récupéré avec succès",
          data,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Query] Erreur récupération total paiements mois:",
          error,
        );

        throw new InternalServerError(
          "Erreur serveur lors de la récupération du total des paiements",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Paiements récents (7 derniers jours)
   * Accessible aux administrateurs uniquement
   */
  paiementsRecents: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      __: any,
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        "📊 [GraphQL Query] paiementsRecents - Récupération paiements récents",
      );

      try {
        const data = await getPaiementsRecents();

        console.log("✅ [GraphQL Query] Paiements récents récupérés");

        return {
          success: true,
          message: "Paiements récents récupérés avec succès",
          data,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Query] Erreur récupération paiements récents:",
          error,
        );

        throw new InternalServerError(
          "Erreur serveur lors de la récupération des paiements récents",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Paiements en attente
   * Accessible aux administrateurs uniquement
   */
  paiementsEnAttente: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      __: any,
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        "📊 [GraphQL Query] paiementsEnAttente - Récupération paiements en attente",
      );

      try {
        const data = await getPaiementsEnAttente();

        console.log("✅ [GraphQL Query] Paiements en attente récupérés");

        return {
          success: true,
          message: "Paiements en attente récupérés avec succès",
          data,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Query] Erreur récupération paiements en attente:",
          error,
        );

        throw new InternalServerError(
          "Erreur serveur lors de la récupération des paiements en attente",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Plans actifs
   * Accessible aux administrateurs uniquement
   */
  plansActifs: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      __: any,
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log("📊 [GraphQL Query] plansActifs - Récupération plans actifs");

      try {
        const data = await getPlansActifs();

        console.log("✅ [GraphQL Query] Plans actifs récupérés");

        return {
          success: true,
          message: "Plans actifs récupérés avec succès",
          data,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Query] Erreur récupération plans actifs:",
          error,
        );

        throw new InternalServerError(
          "Erreur serveur lors de la récupération des plans actifs",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Taux de renouvellement des abonnements
   * Accessible aux administrateurs uniquement
   */
  tauxRenouvellement: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(
    async (
      _: any,
      __: any,
      context: GraphQLContext,
      info: GraphQLResolveInfo,
    ) => {
      console.log(
        "📊 [GraphQL Query] tauxRenouvellement - Récupération taux de renouvellement",
      );

      try {
        const data = await getTauxRenouvellement();

        console.log("✅ [GraphQL Query] Taux de renouvellement récupéré");

        return {
          success: true,
          message: "Taux de renouvellement récupéré avec succès",
          data,
        };
      } catch (error) {
        console.error(
          "❌ [GraphQL Query] Erreur récupération taux de renouvellement:",
          error,
        );

        throw new InternalServerError(
          "Erreur serveur lors de la récupération du taux de renouvellement",
          error instanceof Error ? error : undefined,
        );
      }
    },
  ),

  /**
   * Nombre de cours de la semaine
   * Accessible aux administrateurs uniquement
   */
  coursSemaine: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] coursSemaine - Récupération cours de la semaine",
    );

    try {
      const data = await getCoursSemaine();

      console.log("✅ [GraphQL Query] Cours de la semaine récupérés");

      return {
        success: true,
        message: "Cours de la semaine récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération cours semaine:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des cours de la semaine",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Évolution des paiements par mois
   * Accessible aux administrateurs uniquement
   */
  paiementsParMois: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] paiementsParMois - Récupération paiements par mois",
    );

    try {
      const data = await getPaiementsParMois();

      console.log("✅ [GraphQL Query] Paiements par mois récupérés");

      return {
        success: true,
        message: "Paiements par mois récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération paiements par mois:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des paiements par mois",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Répartition des membres par plan
   * Accessible aux administrateurs uniquement
   */
  membresParPlan: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] membresParPlan - Récupération membres par plan",
    );

    try {
      const data = await getMembresParPlan();

      console.log("✅ [GraphQL Query] Membres par plan récupérés");

      return {
        success: true,
        message: "Membres par plan récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération membres par plan:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des membres par plan",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Les 10 derniers paiements
   * Accessible aux administrateurs uniquement
   */
  derniersPaiements: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] derniersPaiements - Récupération derniers paiements",
    );

    try {
      const data = await getDerniersPaiements();

      console.log("✅ [GraphQL Query] Derniers paiements récupérés");

      return {
        success: true,
        message: "Derniers paiements récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération derniers paiements:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des derniers paiements",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Paiements échus
   * Accessible aux administrateurs uniquement
   */
  paiementsEchus: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] paiementsEchus - Récupération paiements échus",
    );

    try {
      const data = await getPaiementsEchus();

      console.log("✅ [GraphQL Query] Paiements échus récupérés");

      return {
        success: true,
        message: "Paiements échus récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération paiements échus:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des paiements échus",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Nouveaux membres (7 derniers jours)
   * Accessible aux administrateurs uniquement
   */
  nouveauxMembres: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] nouveauxMembres - Récupération nouveaux membres",
    );

    try {
      const data = await getNouveauxMembres();

      console.log("✅ [GraphQL Query] Nouveaux membres récupérés");

      return {
        success: true,
        message: "Nouveaux membres récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération nouveaux membres:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des nouveaux membres",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Top 5 des membres les plus assidus
   * Accessible aux administrateurs uniquement
   */
  topMembresAssidus: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] topMembresAssidus - Récupération top membres assidus",
    );

    try {
      const data = await getTopMembresAssidus();

      console.log("✅ [GraphQL Query] Top membres assidus récupérés");

      return {
        success: true,
        message: "Top membres assidus récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération top membres assidus:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des membres les plus assidus",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Répartition des membres par grade
   * Accessible aux administrateurs uniquement
   */
  membresParGrade: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] membresParGrade - Récupération membres par grade",
    );

    try {
      const data = await getMembresParGrade();

      console.log("✅ [GraphQL Query] Membres par grade récupérés");

      return {
        success: true,
        message: "Membres par grade récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération membres par grade:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des membres par grade",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Répartition des membres par genre
   * Accessible aux administrateurs uniquement
   */
  membresParGenre: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] membresParGenre - Récupération membres par genre",
    );

    try {
      const data = await getMembresParGenre();

      console.log("✅ [GraphQL Query] Membres par genre récupérés");

      return {
        success: true,
        message: "Membres par genre récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération membres par genre:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des membres par genre",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Prochains anniversaires (30 jours)
   * Accessible aux administrateurs uniquement
   */
  prochainsAnniversaires: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] prochainsAnniversaires - Récupération prochains anniversaires",
    );

    try {
      const data = await getProchainsAnniversaires();

      console.log("✅ [GraphQL Query] Prochains anniversaires récupérés");

      return {
        success: true,
        message: "Prochains anniversaires récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération prochains anniversaires:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des prochains anniversaires",
        error instanceof Error ? error : undefined,
      );
    }
  }),

  /**
   * Articles les plus vendus
   * Accessible aux administrateurs uniquement
   */
  articlesPlusVendus: combineMiddlewares(
    requireAdmin,
    withSentry,
  )(async (_: any, __: any, context: GraphQLContext) => {
    console.log(
      "📊 [GraphQL Query] articlesPlusVendus - Récupération articles plus vendus",
    );

    try {
      const data = await getArticlesPlusVendus();

      console.log("✅ [GraphQL Query] Articles plus vendus récupérés");

      return {
        success: true,
        message: "Articles les plus vendus récupérés avec succès",
        data,
      };
    } catch (error) {
      console.error(
        "❌ [GraphQL Query] Erreur récupération articles plus vendus:",
        error,
      );

      throw new InternalServerError(
        "Erreur serveur lors de la récupération des articles les plus vendus",
        error instanceof Error ? error : undefined,
      );
    }
  }),
};

/**
 * Mutations pour les statistiques (aucune pour le moment)
 */
export const statistiquesMutations = {
  // Pas de mutations pour les statistiques
};

/**
 * Resolvers combinés pour export
 */
export const statistiquesResolvers = {
  Query: statistiquesQueries,
  Mutation: statistiquesMutations,
};
