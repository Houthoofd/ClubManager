/**
 * Resolvers GraphQL pour le module Paiements
 * ✅ MIGRÉ : Pattern standardisé avec middlewares centralisés
 * - Auth middleware (requireAuth, requireAdmin)
 * - Sentry monitoring (withSentry)
 * - Validation Zod centralisée
 * - Erreurs GraphQL standardisées
 *
 * @package api
 */

import {
  requireAuth,
  combineMiddlewares,
  type GraphQLContext,
} from "@/shared/middleware/auth.middleware.js";
import {
  ValidationError,
  InternalServerError,
} from "@/shared/errors/GraphQLErrors.js";
import { validateInput } from "@/shared/middleware/validation.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";

// Services
import { PaymentIntentService } from "../services/payment-intent.service.js";
import { ConfirmationService } from "../services/confirmation.service.js";

// Validators centralisés depuis @clubmanager/types
import {
  confirmEcheancePaymentSchema,
  confirmCommandePaymentSchema,
  getHistoriqueSchema,
  type ConfirmEcheancePaymentInput,
  type ConfirmCommandePaymentInput,
  type GetHistoriqueInput,
} from "@clubmanager/types/domains/paiements/validators";

import {
  createPaymentIntentEcheanceSchema,
  createPaymentIntentCommandeSchema,
  toStripeAmount,
  type CreatePaymentIntentEcheanceInput,
  type CreatePaymentIntentCommandeInput,
} from "@clubmanager/types/domains/paiements/validators";

/**
 * Interfaces pour les arguments GraphQL
 */
interface CreerPaymentIntentEcheanceArgs {
  amount: number;
  echeanceId: number;
  userId: number;
  currency?: string;
  description?: string;
}

interface CreerPaymentIntentCommandeArgs {
  amount: number;
  commandeId: number;
  userId?: number;
  currency?: string;
  description?: string;
}

interface ConfirmerPaiementEcheanceArgs {
  paymentIntentId: string;
  echeanceId: number;
  userId: number;
  amount: number;
}

interface ConfirmerPaiementCommandeArgs {
  paymentIntentId: string;
  commandeId: number;
  userId: number;
  amount: number;
}

interface GetHistoriquePaiementsArgs {
  utilisateurId?: number;
  limit?: number;
  offset?: number;
}

// Instances des services
const paymentIntentService = new PaymentIntentService();
const confirmationService = new ConfirmationService();

/**
 * Resolvers GraphQL pour Paiements
 */
export const paiementsResolvers = {
  Query: {
    /**
     * ✅ Récupérer l'historique des paiements d'un utilisateur
     * @requires Auth
     * @sentry enabled
     */
    historiquePaiements: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: GetHistoriquePaiementsArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Query: historiquePaiements", {
          utilisateurId: args.utilisateurId,
          limit: args.limit,
          offset: args.offset,
          requestedBy: context.user?.id,
        });

        // Si non-admin, forcer l'utilisateur connecté
        const utilisateurId =
          context.user?.status_id === 1 ? args.utilisateurId : context.user!.id;

        // Validation
        const validatedArgs = validateInput(getHistoriqueSchema, {
          utilisateurId,
          limit: args.limit || 10,
          offset: args.offset || 0,
        });

        // Récupérer l'historique des paiements depuis la DB
        const [paiements, total] = await Promise.all([
          prisma.paiements.findMany({
            where: {
              utilisateur_id: validatedArgs.utilisateurId,
            },
            include: {
              commandes: {
                select: {
                  id: true,
                  unique_id: true,
                  statut: true,
                  total: true,
                  date_commande: true,
                },
              },
            },
            orderBy: {
              date_paiement: "desc",
            },
            take: validatedArgs.limit,
            skip: validatedArgs.offset,
          }),
          prisma.paiements.count({
            where: {
              utilisateur_id: validatedArgs.utilisateurId,
            },
          }),
        ]);

        return {
          success: true,
          paiements: paiements.map((p) => ({
            id: p.id,
            montant: Number(p.montant),
            devise: "EUR", // Devise par défaut
            statut: p.statut,
            date_paiement: p.date_paiement,
            moyen_paiement: p.methode_paiement || "stripe",
            stripe_payment_intent_id: p.stripe_payment_intent_id,
            commande: p.commandes
              ? {
                  id: p.commandes.id,
                  unique_id: p.commandes.unique_id,
                  statut: p.commandes.statut,
                  total: Number(p.commandes.total),
                  date_commande: p.commandes.date_commande,
                }
              : null,
            echeance: null, // Pas de relation echeances_paiements dans le schéma
          })),
          total,
          limit: validatedArgs.limit,
          offset: validatedArgs.offset,
        };
      },
    ),
  },

  Mutation: {
    /**
     * ✅ Créer un Payment Intent pour une échéance
     * @requires Auth
     * @sentry enabled
     */
    creerPaymentIntentEcheance: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: CreerPaymentIntentEcheanceArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: creerPaymentIntentEcheance", {
          amount: args.amount,
          echeanceId: args.echeanceId,
          userId: args.userId,
        });

        // Vérification de sécurité
        if (context.user?.id !== args.userId && context.user?.status_id !== 1) {
          throw new ValidationError(
            "Vous ne pouvez créer un paiement que pour vous-même",
          );
        }

        const validatedArgs = validateInput(createPaymentIntentEcheanceSchema, {
          amount: args.amount,
          echeanceId: args.echeanceId,
          userId: args.userId,
          currency: args.currency,
          description: args.description,
        });

        const result = await paymentIntentService.createForEcheance({
          amount: validatedArgs.amount,
          echeanceId: validatedArgs.echeanceId,
          userId: validatedArgs.userId,
          description: validatedArgs.description || "Paiement échéance",
        });

        return {
          success: true,
          clientSecret: result.client_secret,
          paymentIntentId: result.payment_intent_id,
          message: "Payment Intent créé avec succès",
        };
      },
    ),

    /**
     * ✅ Créer un Payment Intent pour une commande
     * @requires Auth
     * @sentry enabled
     */
    creerPaymentIntentCommande: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: CreerPaymentIntentCommandeArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: creerPaymentIntentCommande", {
          amount: args.amount,
          commandeId: args.commandeId,
          userId: args.userId || context.user?.id,
        });

        const userId = args.userId || context.user!.id;

        // Vérification de sécurité
        if (context.user?.id !== userId && context.user?.status_id !== 1) {
          throw new ValidationError(
            "Vous ne pouvez créer un paiement que pour vous-même",
          );
        }

        const validatedArgs = validateInput(createPaymentIntentCommandeSchema, {
          amount: args.amount,
          commandeId:
            typeof args.commandeId === "number"
              ? args.commandeId
              : (args.commandeId as any)?.id || 0,
          userId: userId,
          currency: args.currency,
          description: args.description,
        });

        const result = await paymentIntentService.createForCommande({
          amount: validatedArgs.amount,
          commande: validatedArgs.commandeId,
          userId: validatedArgs.userId,
          description: validatedArgs.description || "Paiement commande",
        });

        return {
          success: true,
          clientSecret: result.client_secret,
          paymentIntentId: result.payment_intent_id,
          message: "Payment Intent créé avec succès",
        };
      },
    ),

    /**
     * ✅ Confirmer un paiement d'échéance
     * @requires Auth
     * @sentry enabled
     */
    confirmerPaiementEcheance: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: ConfirmerPaiementEcheanceArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: confirmerPaiementEcheance", {
          paymentIntentId: args.paymentIntentId,
          echeanceId: args.echeanceId,
          userId: args.userId,
        });

        // Vérification de sécurité
        if (context.user?.id !== args.userId && context.user?.status_id !== 1) {
          throw new ValidationError(
            "Vous ne pouvez confirmer que vos propres paiements",
          );
        }

        // Validation
        const validatedArgs = validateInput(confirmEcheancePaymentSchema, {
          paymentIntentId: args.paymentIntentId,
          echeanceId: args.echeanceId,
          userId: args.userId,
          amount: args.amount,
        });

        const result = await confirmationService.confirmEcheancePayment({
          paymentIntentId: validatedArgs.paymentIntentId,
          echeanceId: validatedArgs.echeanceId,
          userId: validatedArgs.userId,
          amount: validatedArgs.amount,
        });

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la confirmation du paiement",
          );
        }

        return {
          success: true,
          message: result.message || "Paiement confirmé avec succès",
          paiementId: result.paiement_id
            ? parseInt(result.paiement_id)
            : undefined,
          statut: "VALIDE",
        };
      },
    ),

    /**
     * ✅ Confirmer un paiement de commande
     * @requires Auth
     * @sentry enabled
     */
    confirmerPaiementCommande: combineMiddlewares(
      requireAuth,
      withSentry,
    )(
      async (
        _parent: any,
        args: ConfirmerPaiementCommandeArgs,
        context: GraphQLContext,
      ) => {
        console.log("🔍 [GraphQL] Mutation: confirmerPaiementCommande", {
          paymentIntentId: args.paymentIntentId,
          commandeId: args.commandeId,
          userId: args.userId,
        });

        // Vérification de sécurité
        if (context.user?.id !== args.userId && context.user?.status_id !== 1) {
          throw new ValidationError(
            "Vous ne pouvez confirmer que vos propres paiements",
          );
        }

        // Validation
        const validatedArgs = validateInput(confirmCommandePaymentSchema, {
          paymentIntentId: args.paymentIntentId,
          commandeId: args.commandeId,
          userId: args.userId,
          amount: args.amount,
        });

        const result = await confirmationService.confirmCommandePayment({
          paymentIntentId: validatedArgs.paymentIntentId,
          commandeId: validatedArgs.commandeId,
          userId: validatedArgs.userId,
          amount: validatedArgs.amount,
        });

        if (!result.success) {
          throw new InternalServerError(
            result.message || "Erreur lors de la confirmation du paiement",
          );
        }

        return {
          success: true,
          message: result.message || "Paiement confirmé avec succès",
          paiementId: undefined,
          statut: result.statut || "VALIDE",
        };
      },
    ),
  },
};

export default paiementsResolvers;
