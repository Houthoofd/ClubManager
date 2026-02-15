/**
 * Resolvers GraphQL pour le module Compte
 * ✅ MIGRÉ : Utilise les middlewares partagés depuis @shared
 * - Erreurs GraphQL standardisées
 * - Auth middleware (requireAuth, requireAdmin)
 * - Validation Zod inline
 * - Sentry monitoring middleware (withSentry)
 * - Services réutilisables
 */

import {
  requireAuth,
  requireAdmin,
  combineMiddlewares,
  type GraphQLContext,
} from "@/shared/middleware/auth.middleware.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  AuthorizationError,
} from "@/shared/errors/GraphQLErrors.js";
import { validateInput } from "@/shared/middleware/validation.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";

// Services
import { CompteService, compteService } from "../services/compte.service.js";

// Validators depuis @clubmanager/types
import {
  GetCompteByIdSchema,
  GetCompteByNomPrenomSchema,
  GetInformationsCompteSchema,
  UpdateCompteSchema,
  ChangePasswordSchema,
  CreatePasswordSchema,
  DeleteCompteSchema,
  GetGenreIdSchema,
  GetGradeIdSchema,
  GetStatusIdSchema,
  GetAbonnementIdSchema,
  ConversionInputSchema,
} from "@clubmanager/types/domains/compte/validators";

import { Compte } from "@clubmanager/types";

type CompteInfo = Compte.CompteInfo;
type CompteUpdateInput = Compte.UpdateCompteInput;
type ConversionInput = Compte.ConversionInput;
type ConversionResult = Compte.ConversionResult;

/**
 * Interfaces pour les arguments GraphQL
 */
interface GetCompteByIdArgs {
  utilisateurId: number;
}

interface GetCompteByNomPrenomArgs {
  prenom: string;
  nom: string;
}

interface GetInformationsCompteArgs {
  prenom: string;
  nom: string;
}

interface UpdateCompteArgs {
  utilisateurId: number;
  input: CompteUpdateInput;
}

interface ChangePasswordArgs {
  input: {
    utilisateur_id: number;
    current_password?: string;
    new_password: string;
    confirm_password: string;
  };
}

interface CreatePasswordArgs {
  input: {
    utilisateur_id: number;
    new_password: string;
    confirm_password: string;
  };
}

interface DeleteCompteArgs {
  utilisateurId: number;
}

interface GetGenreIdArgs {
  genreName: string;
}

interface GetGradeIdArgs {
  gradeName: string;
}

interface GetStatusIdArgs {
  statusName: string;
}

interface GetAbonnementIdArgs {
  abonnementName: string;
}

interface ConvertirNomsEnIdsArgs {
  input: ConversionInput;
}

/**
 * ============================================
 * RESOLVERS
 * ============================================
 */

export const compteResolvers = {
  Query: {
    /**
     * Query: compteParId
     * Récupère un compte par son ID
     * Nécessite : Authentification + (même utilisateur ou admin)
     * @audit DATA_ACCESSED
     */
    compteParId: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetCompteByIdArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(GetCompteByIdSchema, args);

        // Vérifier que l'utilisateur demande son propre compte ou est admin
        const isSelf = validatedArgs.utilisateurId === context.user?.id;
        const isAdmin = context.user?.status_id === 1; // 1 = admin

        if (!isSelf && !isAdmin) {
          throw new AuthorizationError(
            "Vous ne pouvez consulter que votre propre compte",
          );
        }

        try {
          const compte = await compteService.obtenirCompteParId(
            validatedArgs.utilisateurId,
          );

          if (!compte) {
            throw new NotFoundError("Compte non trouvé");
          }

          return compte;
        } catch (error: any) {
          if (
            error instanceof NotFoundError ||
            error instanceof AuthorizationError
          ) {
            throw error;
          }
          throw new InternalServerError(
            `Erreur lors de la récupération du compte: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: compteParNomPrenom
     * Récupère un ou plusieurs comptes par nom et prénom
     * Nécessite : Admin
     * @audit DATA_ACCESSED
     */
    compteParNomPrenom: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetCompteByNomPrenomArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(GetCompteByNomPrenomSchema, args);

        try {
          const comptes = await compteService.obtenirCompteParNomPrenom(
            validatedArgs.prenom,
            validatedArgs.nom,
          );
          return comptes;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la recherche de comptes: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: informationsCompte
     * Récupère les informations complètes d'un compte
     * Nécessite : Admin
     * @audit DATA_ACCESSED
     */
    informationsCompte: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetInformationsCompteArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(GetInformationsCompteSchema, args);

        try {
          const compte = await compteService.obtenirInformationsCompte(
            validatedArgs.prenom,
            validatedArgs.nom,
          );

          if (!compte) {
            throw new NotFoundError("Compte non trouvé");
          }

          return compte;
        } catch (error: any) {
          if (error instanceof NotFoundError) {
            throw error;
          }
          throw new InternalServerError(
            `Erreur lors de la récupération des informations: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: genreId
     * Obtient l'ID d'un genre par son nom
     * Nécessite : Admin
     */
    genreId: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, args: GetGenreIdArgs, context: GraphQLContext) => {
      // Validation
      const validatedArgs = validateInput(GetGenreIdSchema, args);

      try {
        const id = await compteService.obtenirIdGenre(validatedArgs.genreName);
        return id;
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération de l'ID du genre: ${error.message}`,
        );
      }
    }),

    /**
     * Query: gradeId
     * Obtient l'ID d'un grade par son nom
     * Nécessite : Admin
     */
    gradeId: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, args: GetGradeIdArgs, context: GraphQLContext) => {
      // Validation
      const validatedArgs = validateInput(GetGradeIdSchema, args);

      try {
        const id = await compteService.obtenirIdGrade(validatedArgs.gradeName);
        return id;
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération de l'ID du grade: ${error.message}`,
        );
      }
    }),

    /**
     * Query: statusId
     * Obtient l'ID d'un status par son nom
     * Nécessite : Admin
     */
    statusId: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, args: GetStatusIdArgs, context: GraphQLContext) => {
      // Validation
      const validatedArgs = validateInput(GetStatusIdSchema, args);

      try {
        const id = await compteService.obtenirIdStatus(
          validatedArgs.statusName,
        );
        return id;
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération de l'ID du status: ${error.message}`,
        );
      }
    }),

    /**
     * Query: abonnementId
     * Obtient l'ID d'un abonnement par son nom
     * Nécessite : Admin
     */
    abonnementId: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetAbonnementIdArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(GetAbonnementIdSchema, args);

        try {
          const id = await compteService.obtenirIdAbonnement(
            validatedArgs.abonnementName,
          );
          return id;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la récupération de l'ID de l'abonnement: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: convertirNomsEnIds
     * Convertit automatiquement les noms en IDs
     * Nécessite : Admin
     */
    convertirNomsEnIds: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: ConvertirNomsEnIdsArgs,
        context: GraphQLContext,
      ): Promise<ConversionResult> => {
        // Validation
        const validatedArgs = validateInput(ConversionInputSchema, args.input);

        try {
          const result = await compteService.convertirNomsEnIds(validatedArgs);
          return result;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la conversion: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: genres
     * Liste tous les genres disponibles
     * Nécessite : Authentification
     */
    genres: combineMiddlewares(
      requireAuth,
      withSentry,
    )(async (_parent: any, _args: any, context: GraphQLContext) => {
      try {
        const genres = await prisma.genres.findMany({
          select: {
            id: true,
            genre_name: true,
          },
          orderBy: {
            genre_name: "asc",
          },
        });

        return genres.map((genre) => ({
          id: genre.id,
          genre_name: genre.genre_name,
        }));
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération des genres: ${error.message}`,
        );
      }
    }),

    /**
     * Query: grades
     * Liste tous les grades disponibles
     * Nécessite : Authentification
     */
    grades: combineMiddlewares(
      requireAuth,
      withSentry,
    )(async (_parent: any, _args: any, context: GraphQLContext) => {
      try {
        const grades = await prisma.grades.findMany({
          select: {
            id: true,
            grade_id: true,
          },
          orderBy: {
            id: "asc",
          },
        });

        return grades.map((grade) => ({
          id: grade.id,
          grade_id: grade.grade_id,
          grade_name: grade.grade_id, // Utiliser grade_id comme nom
        }));
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération des grades: ${error.message}`,
        );
      }
    }),

    /**
     * Query: statuses
     * Liste tous les status disponibles
     * Nécessite : Admin
     */
    statuses: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, _args: any, context: GraphQLContext) => {
      try {
        const statuses = await prisma.status.findMany({
          select: {
            id: true,
            nom_role: true,
          },
          orderBy: {
            nom_role: "asc",
          },
        });

        return statuses.map((status) => ({
          id: status.id,
          nom_role: status.nom_role,
        }));
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération des statuts: ${error.message}`,
        );
      }
    }),

    /**
     * Query: plansTarifaires
     * Liste tous les plans tarifaires disponibles
     * Nécessite : Authentification
     */
    plansTarifaires: combineMiddlewares(
      requireAuth,
      withSentry,
    )(async (_parent: any, _args: any, context: GraphQLContext) => {
      try {
        const plans = await prisma.plans_tarifaires.findMany({
          select: {
            id: true,
            nom_plan: true,
            prix: true,
            description: true,
          },
          orderBy: {
            prix: "asc",
          },
        });

        return plans.map((plan) => ({
          id: plan.id,
          nom_plan: plan.nom_plan,
          prix: plan.prix,
          description: plan.description,
        }));
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération des plans tarifaires: ${error.message}`,
        );
      }
    }),
  },

  Mutation: {
    /**
     * Mutation: modifierCompte
     * Met à jour un compte utilisateur
     * Nécessite : Authentification + (même utilisateur ou admin)
     * @audit USER_UPDATED
     */
    modifierCompte: combineMiddlewares(
      requireAuth,
      withSentry,
    )(async (_parent: any, args: UpdateCompteArgs, context: GraphQLContext) => {
      // Validation
      const validatedInput = validateInput(UpdateCompteSchema, args.input);

      // Vérifier que l'utilisateur modifie son propre compte ou est admin
      const isSelf = args.utilisateurId === context.user?.id;
      const isAdmin = context.user?.status_id === 1; // 1 = admin

      if (!isSelf && !isAdmin) {
        throw new AuthorizationError(
          "Vous ne pouvez modifier que votre propre compte",
        );
      }

      try {
        const compte = await compteService.modifierCompte(
          args.utilisateurId,
          validatedInput as CompteUpdateInput,
        );

        if (!compte) {
          throw new NotFoundError("Compte non trouvé");
        }

        return {
          success: true,
          message: "Compte modifié avec succès",
          compte,
        };
      } catch (error: any) {
        if (
          error instanceof NotFoundError ||
          error instanceof AuthorizationError
        ) {
          throw error;
        }
        throw new InternalServerError(
          `Erreur lors de la modification du compte: ${error.message}`,
        );
      }
    }),

    /**
     * Mutation: changerMotDePasse
     * Change le mot de passe d'un utilisateur
     * Nécessite : Authentification + même utilisateur
     * @audit USER_UPDATED
     */
    changerMotDePasse: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: ChangePasswordArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedInput = validateInput(ChangePasswordSchema, args.input);

        // Vérifier que l'utilisateur change son propre mot de passe
        if (validatedInput.utilisateur_id !== context.user?.id) {
          throw new AuthorizationError(
            "Vous ne pouvez changer que votre propre mot de passe",
          );
        }

        try {
          const success = await compteService.mettreAJourMotDePasse({
            utilisateur_id: validatedInput.utilisateur_id,
            new_password: validatedInput.new_password,
            is_creation: false,
          });

          if (!success) {
            throw new InternalServerError(
              "Erreur lors du changement de mot de passe",
            );
          }

          return {
            success: true,
            message: "Mot de passe changé avec succès",
            compte: null,
          };
        } catch (error: any) {
          if (error instanceof AuthorizationError) {
            throw error;
          }
          throw new InternalServerError(
            `Erreur lors du changement de mot de passe: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Mutation: creerMotDePasse
     * Crée un mot de passe (premier login)
     * Nécessite : Authentification + même utilisateur
     * @audit USER_UPDATED
     */
    creerMotDePasse: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: CreatePasswordArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedInput = validateInput(CreatePasswordSchema, args.input);

        // Vérifier que l'utilisateur crée son propre mot de passe
        if (validatedInput.utilisateur_id !== context.user?.id) {
          throw new AuthorizationError(
            "Vous ne pouvez créer que votre propre mot de passe",
          );
        }

        try {
          const success = await compteService.mettreAJourMotDePasse({
            utilisateur_id: validatedInput.utilisateur_id,
            new_password: validatedInput.new_password,
            is_creation: true,
          });

          if (!success) {
            throw new InternalServerError(
              "Erreur lors de la création du mot de passe",
            );
          }

          return {
            success: true,
            message: "Mot de passe créé avec succès",
            compte: null,
          };
        } catch (error: any) {
          if (error instanceof AuthorizationError) {
            throw error;
          }
          throw new InternalServerError(
            `Erreur lors de la création du mot de passe: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Mutation: supprimerCompte
     * Supprime un compte (soft delete)
     * Nécessite : Admin
     * @audit DATA_DELETED
     */
    supprimerCompte: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, args: DeleteCompteArgs, context: GraphQLContext) => {
      // Validation
      const validatedArgs = validateInput(DeleteCompteSchema, args);

      try {
        const success = await compteService.supprimerCompte(
          validatedArgs.utilisateurId,
        );

        if (!success) {
          throw new NotFoundError("Compte non trouvé");
        }

        return {
          success: true,
          message: "Compte supprimé avec succès",
          compte: null,
        };
      } catch (error: any) {
        if (error instanceof NotFoundError) {
          throw error;
        }
        throw new InternalServerError(
          `Erreur lors de la suppression du compte: ${error.message}`,
        );
      }
    }),
  },
};
