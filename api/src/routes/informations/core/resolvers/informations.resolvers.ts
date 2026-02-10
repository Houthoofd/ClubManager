/**
 * Resolvers GraphQL pour le module Informations
 * Gestion des informations du club et des référentiels
 *
 * Sécurité & Fonctionnalités :
 * - ✅ requireAuth - Authentification obligatoire (queries)
 * - ✅ requireAdmin - Droits admin (mutations informations, diagnostic)
 * - ✅ withSentry - Observabilité et monitoring
 * - ✅ Validation stricte inputs Zod
 * - ✅ Gestion référentiels : grades, genres, status, plans tarifaires
 * - ✅ Health check référentiels (diagnostic)
 * - ✅ Récupération optimisée (tous référentiels en une requête)
 *
 * @module informations/resolvers
 */

import { GraphQLError } from "graphql";
import { informationsService } from "../../../../services/informations/informations.service.js";
import { validateInput } from "../../../../shared/middleware/validation.middleware.js";
import {
  combineMiddlewares,
  requireAuth,
  requireAdmin,
} from "../../../../shared/middleware/auth.middleware.js";
import { withSentry } from "../../../../shared/middleware/sentry.middleware.js";
import {
  informationInputSchema,
  informationIdSchema,
} from "@clubmanager/types/validators";

import type {
  Information,
  InformationInput,
  InformationResult,
  Status,
  PlanTarifaire,
  Grade,
} from "@clubmanager/types";

// ============================================
// TYPES POUR LES RESOLVERS
// ============================================

interface InformationArgs {
  id: number;
}

interface InformationMutationArgs {
  input: InformationInput;
}

interface ModifierInformationArgs {
  id: number;
  input: InformationInput;
}

interface AllReferences {
  grades: Grade[];
  genres: { id: number; nom: string }[];
  status: Status[];
  abonnements: PlanTarifaire[];
}

interface ReferenceHealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    grades: boolean;
    genres: boolean;
    status: boolean;
    abonnements: boolean;
  };
  message: string;
  timestamp: string;
}

// ============================================
// QUERIES - INFORMATIONS
// ============================================

/**
 * Query: obtenirToutesLesInformations
 * Récupère toutes les informations actives du club
 * Middleware: Auth + Sentry
 */
const obtenirToutesLesInformationsResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<Information[]> => {
  try {
    const informations =
      await informationsService.obtenirToutesLesInformations();
    return informations;
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur obtenirToutesLesInformations:",
      error,
    );
    throw new GraphQLError(
      `Erreur lors de la récupération des informations: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Query: obtenirInformationParId
 * Récupère une information par son ID
 * Middleware: Auth + Validation + Sentry
 */
const obtenirInformationParIdResolver = async (
  _: unknown,
  args: InformationArgs,
  context: any,
): Promise<Information | null> => {
  try {
    // Validation de l'ID
    const validatedArgs = await validateInput(informationIdSchema, args);

    const information = await informationsService.obtenirInformationParId(
      validatedArgs.id,
    );

    if (!information) {
      throw new GraphQLError("Information non trouvée", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return information;
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur obtenirInformationParId:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la récupération de l'information: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

// ============================================
// QUERIES - RÉFÉRENTIELS
// ============================================

/**
 * Query: obtenirLesStatus
 * Récupère tous les status (référentiel)
 * Middleware: Auth + Sentry
 */
const obtenirLesStatusResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<Status[]> => {
  try {
    const status = await informationsService.obtenirLesStatus();
    return status;
  } catch (error: any) {
    console.error("❌ [InformationsResolver] Erreur obtenirLesStatus:", error);
    throw new GraphQLError(
      `Erreur lors de la récupération des status: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Query: obtenirLesPlansTarifaires
 * Récupère tous les plans tarifaires (référentiel)
 * Middleware: Auth + Sentry
 */
const obtenirLesPlansTarifairesResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<PlanTarifaire[]> => {
  try {
    const plans = await informationsService.obtenirLesPlansTarifaires();
    return plans;
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur obtenirLesPlansTarifaires:",
      error,
    );
    throw new GraphQLError(
      `Erreur lors de la récupération des plans tarifaires: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Query: obtenirLesGenres
 * Récupère tous les genres (référentiel)
 * Middleware: Auth + Sentry
 */
const obtenirLesGenresResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<{ id: number; nom: string }[]> => {
  try {
    const genres = await informationsService.obtenirLesGenres();
    return genres;
  } catch (error: any) {
    console.error("❌ [InformationsResolver] Erreur obtenirLesGenres:", error);
    throw new GraphQLError(
      `Erreur lors de la récupération des genres: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Query: obtenirLesGrades
 * Récupère tous les grades (référentiel)
 * Middleware: Auth + Sentry
 */
const obtenirLesGradesResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<Grade[]> => {
  try {
    const grades = await informationsService.obtenirLesGrades();
    return grades;
  } catch (error: any) {
    console.error("❌ [InformationsResolver] Erreur obtenirLesGrades:", error);
    throw new GraphQLError(
      `Erreur lors de la récupération des grades: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Query: obtenirTousLesReferentiels
 * Récupère tous les référentiels en une seule requête (optimisation)
 * Middleware: Auth + Sentry
 */
const obtenirTousLesReferentielsResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<AllReferences> => {
  try {
    const [grades, genres, status, abonnements] = await Promise.all([
      informationsService.obtenirLesGrades(),
      informationsService.obtenirLesGenres(),
      informationsService.obtenirLesStatus(),
      informationsService.obtenirLesPlansTarifaires(),
    ]);

    return {
      grades,
      genres,
      status,
      abonnements,
    };
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur obtenirTousLesReferentiels:",
      error,
    );
    throw new GraphQLError(
      `Erreur lors de la récupération des référentiels: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Query: verifierSanteReferentiels
 * Health check des référentiels (diagnostic admin)
 * Middleware: Auth + Admin + Sentry
 */
const verifierSanteReferentielsResolver = async (
  _: unknown,
  __: unknown,
  context: any,
): Promise<ReferenceHealthCheck> => {
  try {
    const checks = {
      grades: false,
      genres: false,
      status: false,
      abonnements: false,
    };

    // Vérification de chaque référentiel
    const [grades, genres, status, abonnements] = await Promise.allSettled([
      informationsService.obtenirLesGrades(),
      informationsService.obtenirLesGenres(),
      informationsService.obtenirLesStatus(),
      informationsService.obtenirLesPlansTarifaires(),
    ]);

    checks.grades = grades.status === "fulfilled" && grades.value.length > 0;
    checks.genres = genres.status === "fulfilled" && genres.value.length > 0;
    checks.status = status.status === "fulfilled" && status.value.length > 0;
    checks.abonnements =
      abonnements.status === "fulfilled" && abonnements.value.length > 0;

    // Déterminer le statut global
    const allHealthy = Object.values(checks).every((check) => check === true);
    const someHealthy = Object.values(checks).some((check) => check === true);

    let globalStatus: "healthy" | "degraded" | "unhealthy";
    let message: string;

    if (allHealthy) {
      globalStatus = "healthy";
      message = "Tous les référentiels sont opérationnels";
    } else if (someHealthy) {
      globalStatus = "degraded";
      const failedRefs = Object.entries(checks)
        .filter(([_, healthy]) => !healthy)
        .map(([ref]) => ref);
      message = `Référentiels dégradés: ${failedRefs.join(", ")}`;
    } else {
      globalStatus = "unhealthy";
      message = "Aucun référentiel n'est accessible";
    }

    return {
      status: globalStatus,
      checks,
      message,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur verifierSanteReferentiels:",
      error,
    );
    throw new GraphQLError(
      `Erreur lors de la vérification de santé des référentiels: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

// ============================================
// MUTATIONS - INFORMATIONS
// ============================================

/**
 * Mutation: ajouterInformation
 * Ajoute une nouvelle information (admin uniquement)
 * Middleware: Auth + Admin + Validation + Sentry
 */
const ajouterInformationResolver = async (
  _: unknown,
  args: InformationMutationArgs,
  context: any,
): Promise<InformationResult> => {
  try {
    // Validation de l'input
    const validatedInput = await validateInput(
      informationInputSchema,
      args.input,
    );

    const result = await informationsService.ajouterInformation(validatedInput);

    if (!result.success) {
      throw new GraphQLError(result.message, {
        extensions: { code: "BAD_REQUEST" },
      });
    }

    return result;
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur ajouterInformation:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de l'ajout de l'information: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Mutation: modifierInformation
 * Modifie une information existante (admin uniquement)
 * Middleware: Auth + Admin + Validation + Sentry
 */
const modifierInformationResolver = async (
  _: unknown,
  args: ModifierInformationArgs,
  context: any,
): Promise<InformationResult> => {
  try {
    // Validation de l'ID et de l'input
    const validatedId = await validateInput(informationIdSchema, {
      id: args.id,
    });
    const validatedInput = await validateInput(
      informationInputSchema,
      args.input,
    );

    const result = await informationsService.modifierInformation(
      validatedId.id,
      validatedInput,
    );

    if (!result.success) {
      throw new GraphQLError(result.message, {
        extensions: { code: "BAD_REQUEST" },
      });
    }

    return result;
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur modifierInformation:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la modification de l'information: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

/**
 * Mutation: supprimerInformation
 * Supprime une information (soft delete, admin uniquement)
 * Middleware: Auth + Admin + Validation + Sentry
 */
const supprimerInformationResolver = async (
  _: unknown,
  args: InformationArgs,
  context: any,
): Promise<InformationResult> => {
  try {
    // Validation de l'ID
    const validatedArgs = await validateInput(informationIdSchema, args);

    const result = await informationsService.supprimerInformation(
      validatedArgs.id,
    );

    if (!result.success) {
      throw new GraphQLError(result.message, {
        extensions: { code: "BAD_REQUEST" },
      });
    }

    return result;
  } catch (error: any) {
    console.error(
      "❌ [InformationsResolver] Erreur supprimerInformation:",
      error,
    );
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Erreur lors de la suppression de l'information: ${error.message}`,
      {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          originalError: error,
        },
      },
    );
  }
};

// ============================================
// EXPORT DES RESOLVERS AVEC MIDDLEWARES
// ============================================

export const informationsResolvers = {
  Query: {
    // Informations (Auth)
    obtenirToutesLesInformations: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirToutesLesInformationsResolver),
    obtenirInformationParId: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirInformationParIdResolver),

    // Référentiels (Auth)
    obtenirLesStatus: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirLesStatusResolver),
    obtenirLesPlansTarifaires: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirLesPlansTarifairesResolver),
    obtenirLesGenres: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirLesGenresResolver),
    obtenirLesGrades: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirLesGradesResolver),
    obtenirTousLesReferentiels: combineMiddlewares(
      requireAuth,
      withSentry,
    )(obtenirTousLesReferentielsResolver),

    // Diagnostic (Auth + Admin)
    verifierSanteReferentiels: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(verifierSanteReferentielsResolver),
  },

  Mutation: {
    // Gestion Informations (Auth + Admin)
    ajouterInformation: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(ajouterInformationResolver),
    modifierInformation: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(modifierInformationResolver),
    supprimerInformation: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(supprimerInformationResolver),
  },
};
