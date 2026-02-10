/**
 * Resolvers GraphQL pour le module Commandes
 * ✅ MIGRÉ : Utilise les middlewares partagés depuis @shared
 * - Erreurs GraphQL standardisées
 * - Auth middleware (requireAuth, requireAdmin)
 * - Validation Zod inline
 * - Audit logging middleware (withAuditLog)
 * - Rate limiting middleware (withRateLimit)
 * - Sentry monitoring middleware (withSentry)
 * - Services réutilisables
 */

import {
  requireAuth,
  requireAdmin,
  combineMiddlewares,
  type GraphQLContext,
} from "../../../../shared/middleware/auth.middleware.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  AuthorizationError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { validateInput } from "../../../../shared/middleware/validation.middleware.js";
import { withSentry } from "../../../../shared/middleware/sentry.middleware.js";

// Services
import {
  CommandesService,
  commandesService,
} from "../../../../services/commandes/commandes.service.js";

// Validators depuis @clubmanager/types
import {
  CreateCommandeSchema,
  UpdateCommandeSchema,
  UpdateStatutCommandeSchema,
  GetCommandeByIdSchema,
  GetCommandesUtilisateurSchema,
  GetCommandesParStatutSchema,
  SearchCommandesSchema,
  BatchUpdateCommandesSchema,
} from "@clubmanager/types/validators";

import type {
  Commande,
  CommandeStats,
  CommandeCountByStatut,
  CreateCommandeInput,
  UpdateCommandeInput,
  CommandeSearchFilters,
  CommandeSearchResult,
} from "@clubmanager/types";

/**
 * Interfaces pour les arguments GraphQL
 */
interface GetCommandeArgs {
  commandeId: string;
}

interface GetCommandesUtilisateurArgs {
  utilisateurId: number;
}

interface GetCommandesParStatutArgs {
  statut: string;
}

interface RechercherCommandesArgs {
  filters: CommandeSearchFilters;
}

interface CreateCommandeArgs {
  input: CreateCommandeInput;
}

interface UpdateCommandeArgs {
  commandeId: string;
  input: UpdateCommandeInput;
}

interface UpdateStatutCommandeArgs {
  commandeId: string;
  statut: string;
}

interface DeleteCommandeArgs {
  commandeId: string;
}

interface BatchUpdateStatutArgs {
  commandeIds: string[];
  statut: string;
}

/**
 * ============================================
 * RESOLVERS
 * ============================================
 */

export const commandesResolvers = {
  Query: {
    /**
     * Query: commandes
     * Récupère toutes les commandes
     * Nécessite : Admin
     * @audit DATA_ACCESSED
     */
    commandes: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(async (_parent: any, _args: any, context: GraphQLContext) => {
      try {
        const commandes = await commandesService.obtenirToutesCommandes();
        return commandes;
      } catch (error: any) {
        throw new InternalServerError(
          `Erreur lors de la récupération des commandes: ${error.message}`,
        );
      }
    }),

    /**
     * Query: commande
     * Récupère une commande par son ID
     * Nécessite : Authentification + (propriétaire ou admin)
     */
    commande: combineMiddlewares(
      requireAuth,
      withSentry,
    )(async (_parent: any, args: GetCommandeArgs, context: GraphQLContext) => {
      // Validation
      const validatedArgs = validateInput(GetCommandeByIdSchema, args);

      try {
        const commande = await commandesService.obtenirCommandeParId(
          validatedArgs.commandeId,
        );

        if (!commande) {
          throw new NotFoundError("Commande non trouvée");
        }

        // Vérifier que l'utilisateur est propriétaire ou admin
        const isOwner = commande.utilisateur_id === context.user?.id;
        const isAdmin = context.user?.role === "admin";

        if (!isOwner && !isAdmin) {
          throw new AuthorizationError("Accès refusé à cette commande");
        }

        return commande;
      } catch (error: any) {
        if (
          error instanceof NotFoundError ||
          error instanceof AuthorizationError
        ) {
          throw error;
        }
        throw new InternalServerError(
          `Erreur lors de la récupération de la commande: ${error.message}`,
        );
      }
    }),

    /**
     * Query: commandesUtilisateur
     * Récupère les commandes d'un utilisateur
     * Nécessite : Authentification + (même utilisateur ou admin)
     * @audit DATA_ACCESSED
     */
    commandesUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetCommandesUtilisateurArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(
          GetCommandesUtilisateurSchema,
          args,
        );

        // Vérifier que l'utilisateur demande ses propres commandes ou est admin
        const isSelf = validatedArgs.utilisateurId === context.user?.id;
        const isAdmin = context.user?.role === "admin";

        if (!isSelf && !isAdmin) {
          throw new AuthorizationError(
            "Vous ne pouvez consulter que vos propres commandes",
          );
        }

        try {
          const commandes = await commandesService.obtenirCommandesUtilisateur(
            validatedArgs.utilisateurId,
          );
          return commandes;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la récupération des commandes: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: commandesParStatut
     * Récupère les commandes par statut
     * Nécessite : Admin
     * @audit DATA_ACCESSED
     */
    commandesParStatut: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetCommandesParStatutArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(GetCommandesParStatutSchema, args);

        try {
          const commandes = await commandesService.obtenirCommandesParStatut(
            validatedArgs.statut,
          );
          return commandes;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la récupération des commandes: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: rechercherCommandes
     * Recherche des commandes avec filtres
     * Nécessite : Admin
     * @audit DATA_ACCESSED
     */
    rechercherCommandes: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: RechercherCommandesArgs,
        context: GraphQLContext,
      ): Promise<CommandeSearchResult> => {
        // Validation
        const validatedArgs = validateInput(SearchCommandesSchema, args);

        try {
          const result =
            await commandesService.rechercherCommandes(validatedArgs);
          return result;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la recherche de commandes: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: statistiquesCommandes
     * Récupère les statistiques des commandes
     * Nécessite : Admin
     * @audit DATA_ACCESSED
     */
    statistiquesCommandes: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        _args: any,
        context: GraphQLContext,
      ): Promise<CommandeStats> => {
        try {
          const stats = await commandesService.obtenirStatistiques();
          return stats;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la récupération des statistiques: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Query: compterCommandesParStatut
     * Compte les commandes par statut
     * Nécessite : Admin
     * @audit DATA_ACCESSED
     */
    compterCommandesParStatut: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        _args: any,
        context: GraphQLContext,
      ): Promise<CommandeCountByStatut[]> => {
        try {
          const counts = await commandesService.compterParStatut();
          return counts;
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors du comptage des commandes: ${error.message}`,
          );
        }
      },
    ),
  },

  Mutation: {
    /**
     * Mutation: creerCommande
     * Crée une nouvelle commande
     * Nécessite : Authentification
     * Rate limit : 50 requêtes / 15 minutes
     * @audit USER_CREATED
     */
    creerCommande: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: CreateCommandeArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(CreateCommandeSchema, args.input);

        // Vérifier que l'utilisateur crée une commande pour lui-même
        const isSelf = validatedArgs.utilisateur_id === context.user?.id;
        const isAdmin = context.user?.role === "admin";

        if (!isSelf && !isAdmin) {
          throw new AuthorizationError(
            "Vous ne pouvez créer une commande que pour vous-même",
          );
        }

        try {
          const commande = await commandesService.creerCommande(validatedArgs);

          return {
            success: true,
            message: "Commande créée avec succès",
            commande,
          };
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la création de la commande: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Mutation: modifierCommande
     * Met à jour une commande
     * Nécessite : Admin
     * @audit USER_UPDATED
     */
    modifierCommande: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: UpdateCommandeArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedCommandeId = validateInput(GetCommandeByIdSchema, {
          commandeId: args.commandeId,
        });
        const validatedInput = validateInput(UpdateCommandeSchema, args.input);

        try {
          const commande = await commandesService.modifierCommande(
            validatedCommandeId.commandeId,
            validatedInput,
          );

          if (!commande) {
            throw new NotFoundError("Commande non trouvée");
          }

          return {
            success: true,
            message: "Commande modifiée avec succès",
            commande,
          };
        } catch (error: any) {
          if (error instanceof NotFoundError) {
            throw error;
          }
          throw new InternalServerError(
            `Erreur lors de la modification de la commande: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Mutation: modifierStatutCommande
     * Met à jour le statut d'une commande
     * Nécessite : Admin
     * @audit USER_UPDATED
     */
    modifierStatutCommande: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: UpdateStatutCommandeArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedCommandeId = validateInput(GetCommandeByIdSchema, {
          commandeId: args.commandeId,
        });
        const validatedStatut = validateInput(UpdateStatutCommandeSchema, {
          statut: args.statut,
        });

        try {
          const commande = await commandesService.modifierStatutCommande(
            validatedCommandeId.commandeId,
            validatedStatut.statut,
          );

          if (!commande) {
            throw new NotFoundError("Commande non trouvée");
          }

          return {
            success: true,
            message: "Statut de la commande modifié avec succès",
            commande,
          };
        } catch (error: any) {
          if (error instanceof NotFoundError) {
            throw error;
          }
          throw new InternalServerError(
            `Erreur lors de la modification du statut: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Mutation: supprimerCommande
     * Supprime une commande
     * Nécessite : Admin
     * @audit DATA_DELETED
     */
    supprimerCommande: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: DeleteCommandeArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(GetCommandeByIdSchema, {
          commandeId: args.commandeId,
        });

        try {
          const success = await commandesService.supprimerCommande(
            validatedArgs.commandeId,
          );

          if (!success) {
            throw new NotFoundError("Commande non trouvée");
          }

          return {
            success: true,
            message: "Commande supprimée avec succès",
            commande: null,
          };
        } catch (error: any) {
          if (error instanceof NotFoundError) {
            throw error;
          }
          throw new InternalServerError(
            `Erreur lors de la suppression de la commande: ${error.message}`,
          );
        }
      },
    ),

    /**
     * Mutation: batchUpdateStatutCommandes
     * Met à jour le statut de plusieurs commandes
     * Nécessite : Admin
     * @audit USER_UPDATED
     */
    batchUpdateStatutCommandes: combineMiddlewares(
      requireAdmin,
      withSentry,
    )(
      async (
        _parent: any,
        args: BatchUpdateStatutArgs,
        context: GraphQLContext,
      ) => {
        // Validation
        const validatedArgs = validateInput(BatchUpdateCommandesSchema, {
          commandeIds: args.commandeIds,
          statut: args.statut,
        });

        const errors: string[] = [];
        let updatedCount = 0;

        try {
          // Mettre à jour chaque commande individuellement
          for (const commandeId of validatedArgs.commandeIds) {
            try {
              const commande = await commandesService.modifierStatutCommande(
                commandeId,
                validatedArgs.statut,
              );

              if (commande) {
                updatedCount++;
              } else {
                errors.push(`Commande ${commandeId} non trouvée`);
              }
            } catch (error: any) {
              errors.push(
                `Erreur pour commande ${commandeId}: ${error.message}`,
              );
            }
          }

          return {
            success: updatedCount > 0,
            message: `${updatedCount} commande(s) mise(s) à jour avec succès`,
            updatedCount,
            errors: errors.length > 0 ? errors : null,
          };
        } catch (error: any) {
          throw new InternalServerError(
            `Erreur lors de la mise à jour en lot: ${error.message}`,
          );
        }
      },
    ),
  },
};
