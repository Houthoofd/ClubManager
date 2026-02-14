/**
 * Resolvers GraphQL pour le module Confirmation
 * ✅ Pattern standardisé avec middlewares partagés
 *
 * @module confirmation.resolvers
 */

import type { GraphQLContext } from "@/shared/types/context.types.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";
import { emailClient } from "@/infrastructure/external-services/email/index.js";
import { formatMontant } from "../utils/format-montant.js";
import { getStripeInstance } from "../utils/stripe-instance.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "@/shared/errors/GraphQLErrors.js";
import {
  confirmationPaymentInputSchema,
  confirmationPaymentCommandeInputSchema,
  type ConfirmationPaymentInput,
  type ConfirmationPaymentCommandeInput,
} from "@clubmanager/types/validators";
import { validateInput } from "@/shared/middleware/validation.middleware.js";
import { combineMiddlewares } from "@/shared/middleware/auth.middleware.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";

// ============================================
// QUERY RESOLVERS
// ============================================

/**
 * Vérifier le statut de santé du service
 */
const confirmationHealthResolver = async (
  _parent: unknown,
  _args: unknown,
  _context: GraphQLContext,
) => {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "confirmation",
  };
};

// ============================================
// MUTATION RESOLVERS
// ============================================

/**
 * Confirmer un paiement d'échéance
 */
const confirmPaymentResolver = async (
  _parent: unknown,
  args: { input: ConfirmationPaymentInput },
  context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(confirmationPaymentInputSchema, input);

  const { paymentIntentId, echeanceId, userId, amount } = validatedInput;

  console.log("🎉 [ConfirmPayment] Confirmation paiement échéance:", {
    paymentIntentId,
    echeanceId,
    userId,
    amount,
  });

  // Vérifier que l'utilisateur connecté est celui de la transaction
  if (context.user?.id !== userId && context.user?.status_id !== 1) {
    // 1 = admin
    throw new ValidationError("Non autorisé à confirmer ce paiement", [
      {
        field: "userId",
        message: "Vous ne pouvez confirmer que vos propres paiements",
      },
    ]);
  }

  const stripe = getStripeInstance();
  if (!stripe) {
    throw new InternalServerError(
      "Service Stripe non disponible",
      new Error("Stripe non initialisé"),
    );
  }

  // Vérifier d'abord si l'échéance est déjà payée
  const echeanceActuelle = await prisma.echeances_paiements.findUnique({
    where: { id: echeanceId },
    select: {
      id: true,
      statut: true,
      utilisateur_id: true,
      montant: true,
      date_echeance: true,
      abonnement_id: true,
    },
  });

  if (!echeanceActuelle) {
    throw new NotFoundError(`Échéance non trouvée: ${echeanceId}`);
  }

  // Si déjà payée, considérer comme succès (idempotence)
  if (echeanceActuelle.statut === "pay_") {
    console.log(
      "ℹ️ [ConfirmPayment] Échéance déjà payée - opération idempotente",
    );
    return {
      success: true,
      message: "Paiement confirmé (échéance déjà payée)",
      paiement_id: paymentIntentId,
      echeance_id: echeanceId,
      premier_paiement: false,
      statut_upgrade: null,
      echeance_confirmee: true,
      already_paid: true,
    };
  }

  // Vérifier si c'est le premier paiement AVANT de traiter
  const paiementsExistants = await prisma.paiements.count({
    where: {
      utilisateur_id: userId,
      statut: "reussi",
    },
  });
  const premierPaiement = paiementsExistants === 0;

  // Confirmer le paiement Stripe d'abord (table paiements)
  try {
    await prisma.paiements.updateMany({
      where: {
        stripe_payment_intent_id: paymentIntentId,
      },
      data: {
        statut: "reussi",
      },
    });
    console.log("✅ [ConfirmPayment] Paiement Stripe confirmé en base");
  } catch (stripeError: any) {
    console.error(
      "❌ [ConfirmPayment] Erreur confirmation Stripe:",
      stripeError,
    );
    // Continue même si erreur - peut être déjà confirmé
  }

  // Marquer l'échéance comme payée
  try {
    const updateResult = await prisma.echeances_paiements.updateMany({
      where: {
        id: echeanceId,
        statut: { not: "pay_" },
      },
      data: {
        statut: "pay_",
        date_paiement: new Date(),
      },
    });

    if (updateResult.count === 0) {
      console.warn(
        "⚠️ [ConfirmPayment] Aucune ligne mise à jour - échéance peut-être déjà payée",
      );

      // Vérifier le statut actuel
      const recheckEcheance = await prisma.echeances_paiements.findUnique({
        where: { id: echeanceId },
        select: { statut: true },
      });
      if (recheckEcheance && recheckEcheance.statut === "pay_") {
        console.log("ℹ️ [ConfirmPayment] Échéance confirmée comme déjà payée");
        // Continue avec le succès
      } else {
        throw new InternalServerError(
          "Impossible de mettre à jour l'échéance",
          new Error("L'échéance n'a pas pu être marquée comme payée"),
        );
      }
    } else {
      console.log("✅ [ConfirmPayment] Échéance marquée comme payée:", {
        echeanceId,
        count: updateResult.count,
      });
    }
  } catch (updateError: any) {
    console.error(
      "❌ [ConfirmPayment] Erreur mise à jour échéance:",
      updateError,
    );

    if (updateError.code === "ER_DUP_ENTRY") {
      console.warn(
        "⚠️ [ConfirmPayment] Erreur de contrainte détectée - vérification état",
      );

      // Vérifier si l'échéance est maintenant payée malgré l'erreur
      const finalCheck = await prisma.echeances_paiements.findUnique({
        where: { id: echeanceId },
        select: { statut: true },
      });
      if (finalCheck && finalCheck.statut === "pay_") {
        console.log(
          "✅ [ConfirmPayment] Échéance finalement payée malgré l'erreur",
        );
        // Continuer avec le succès
      } else {
        throw new InternalServerError(
          "Erreur de contrainte de base de données - conflit détecté",
          updateError,
        );
      }
    } else {
      throw updateError;
    }
  }

  // Promotion automatique visiteur → utilisateur si premier paiement
  let statutUpgrade: string | null = null;
  if (premierPaiement) {
    try {
      const utilisateurAvecStatus = await prisma.utilisateurs.findUnique({
        where: { id: userId },
        select: {
          status_id: true,
          status: {
            select: {
              id: true,
              nom_role: true,
            },
          },
        },
      });

      if (
        utilisateurAvecStatus &&
        utilisateurAvecStatus.status?.nom_role === "visiteur"
      ) {
        const nouveauStatus = await prisma.status.findFirst({
          where: { nom_role: "utilisateur" },
          select: { id: true },
        });

        if (nouveauStatus) {
          const updateResult = await prisma.utilisateurs.updateMany({
            where: {
              id: userId,
              status_id: utilisateurAvecStatus.status_id,
            },
            data: {
              status_id: nouveauStatus.id,
            },
          });

          if (updateResult.count > 0) {
            statutUpgrade = "visiteur → utilisateur";
            console.log(
              `✅ [ConfirmPayment] Utilisateur ${userId} promu à utilisateur`,
            );
          }
        }
      }
    } catch (promotionError) {
      console.error("❌ [ConfirmPayment] Erreur promotion:", promotionError);
    }
  }

  // Envoyer email de confirmation
  try {
    const user = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      select: {
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    if (user) {
      const userName =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Membre";

      const templateData: Record<string, string> = {
        userName,
        amount: formatMontant(amount),
        paymentDate: new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        currency: "EUR",
        echeanceId: echeanceId.toString(),
        paymentIntentId,
        premierPaiement: premierPaiement.toString(),
        ...(premierPaiement && {
          isFirstPayment: "true",
          welcomeMessage:
            "🎉 Bienvenue ! Votre premier paiement a été confirmé avec succès.",
          statusUpgrade: statutUpgrade || "",
        }),
        transactionId: paymentIntentId,
        clubName: "Club Manager",
        currentYear: new Date().getFullYear().toString(),
      };

      await emailClient.sendEmail({
        to: user.email,
        subject: `Confirmation de paiement - ${amount / 100}€`,
        templateTitle: "confirmation-paiement",
        variables: templateData,
        utilisateurId: userId,
      });
      console.log("✅ [ConfirmPayment] Email de confirmation envoyé");
    }
  } catch (emailError) {
    console.error("❌ [ConfirmPayment] Erreur envoi email:", emailError);
  }

  // Réponse de succès
  let successMessage = "Paiement confirmé avec succès";
  if (premierPaiement) {
    successMessage += ". 🎉 Félicitations pour votre premier paiement !";
    if (statutUpgrade?.includes("→")) {
      successMessage += ` Votre statut a été mis à jour : ${statutUpgrade}.`;
    }
  }

  return {
    success: true,
    message: successMessage,
    paiement_id: paymentIntentId,
    echeance_id: echeanceId,
    premier_paiement: premierPaiement,
    statut_upgrade: statutUpgrade,
    echeance_confirmee: true,
  };
};

/**
 * Confirmer un paiement de commande
 */
const confirmPaymentCommandeResolver = async (
  _parent: unknown,
  args: { input: ConfirmationPaymentCommandeInput },
  context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(
    confirmationPaymentCommandeInputSchema,
    input,
  );

  const { paymentIntentId, commandeId, userId, amount } = validatedInput;

  console.log("🛒 [ConfirmPaymentCommande] Confirmation paiement commande:", {
    paymentIntentId,
    commandeId,
    userId,
    amount,
  });

  // Vérifier que l'utilisateur connecté est celui de la transaction
  if (context.user?.id !== userId && context.user?.status_id !== 1) {
    // 1 = admin
    throw new ValidationError("Non autorisé à confirmer ce paiement", [
      {
        field: "userId",
        message: "Vous ne pouvez confirmer que vos propres paiements",
      },
    ]);
  }

  const stripe = getStripeInstance();
  if (!stripe) {
    console.error("❌ [ConfirmPaymentCommande] Stripe non initialisé");
    throw new InternalServerError(
      "Service Stripe non disponible",
      new Error("Stripe non initialisé - vérifiez STRIPE_SECRET_KEY"),
    );
  }

  console.log(
    "🔍 [ConfirmPaymentCommande] Vérification PaymentIntent sur Stripe:",
    paymentIntentId,
  );

  // Vérifier le paiement sur Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  console.log("📊 [ConfirmPaymentCommande] Statut PaymentIntent Stripe:", {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });

  if (paymentIntent.status !== "succeeded") {
    console.warn(
      "⚠️ [ConfirmPaymentCommande] PaymentIntent pas en statut succeeded:",
      paymentIntent.status,
    );
    throw new ValidationError("Le paiement n'a pas été confirmé sur Stripe", [
      {
        field: "paymentIntent.status",
        message: `Statut actuel: ${paymentIntent.status}, attendu: succeeded`,
      },
    ]);
  }

  console.log(
    "✅ [ConfirmPaymentCommande] PaymentIntent Stripe validé, mise à jour base de données...",
  );

  // Confirmer le paiement et mettre à jour la commande
  await prisma.paiements.updateMany({
    where: {
      stripe_payment_intent_id: paymentIntentId,
    },
    data: {
      statut: "reussi",
    },
  });
  console.log("✅ [ConfirmPaymentCommande] Paiement confirmé en base");

  // Utiliser seulement les colonnes existantes de la table commandes
  const updateResult = await prisma.commandes.updateMany({
    where: { id: commandeId },
    data: { statut: "pay_e" },
  });

  console.log("✅ [ConfirmPaymentCommande] Commande mise à jour:", {
    commandeId,
    count: updateResult.count,
    statutMisAJour: "payée",
  });

  // Enregistrer la date de paiement dans la table paiements pour traçabilité
  try {
    await prisma.paiements.updateMany({
      where: {
        stripe_payment_intent_id: paymentIntentId,
      },
      data: {
        date_paiement: new Date(),
        statut: "reussi",
      },
    });
    console.log(
      "✅ [ConfirmPaymentCommande] Date de paiement enregistrée dans table paiements",
    );
  } catch (paiementDateError) {
    console.warn(
      "⚠️ [ConfirmPaymentCommande] Impossible de mettre à jour date dans paiements:",
      paiementDateError,
    );
  }

  // Envoyer email de confirmation commande
  const user = await prisma.utilisateurs.findUnique({
    where: { id: userId },
    select: {
      email: true,
      first_name: true,
      last_name: true,
    },
  });

  if (user) {
    const userName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Membre";

    try {
      // Récupérer les détails de la commande pour avoir les données complètes
      let commandeDetails = { total: 0, articles: [] as any[] };

      if (commandeId) {
        try {
          const commande = await prisma.commandes.findUnique({
            where: { id: commandeId },
            select: {
              total: true,
              commande_articles: {
                select: {
                  quantite: true,
                  prix: true,
                  articles: {
                    select: {
                      nom: true,
                    },
                  },
                  tailles: {
                    select: {
                      nom: true,
                    },
                  },
                },
              },
            },
          });

          if (commande) {
            commandeDetails.total = Number(commande.total) || 0;
            commandeDetails.articles = commande.commande_articles.map(
              (ca: any) => ({
                nom: ca.articles?.nom || "Article",
                quantite: ca.quantite,
                prix: Number(ca.prix),
                taille: ca.tailles?.nom || null,
              }),
            );
          }
        } catch (commandeError) {
          console.warn(
            "⚠️ [ConfirmPaymentCommande] Impossible de récupérer détails commande:",
            commandeError,
          );
        }
      }
      const templateData = {
        userName,
        numeroCommande: commandeId.toString(),
        uniqueId: paymentIntentId,
        dateCommande: new Date().toLocaleDateString("fr-FR"),
        statutCommande: "Confirmée et payée",
        nbArticles: commandeDetails.articles.length.toString(),
        totalCommande: commandeDetails.total.toFixed(2),
        articlesDetails:
          commandeDetails.articles.length > 0
            ? commandeDetails.articles
                .map((a) => `${a.nom} (${a.taille || "N/A"}) x${a.quantite}`)
                .join(", ")
            : "Détails non disponibles",
        delaiPreparation: "24-48 heures",
        lieuRetrait: "Accueil du club",
        horaires: "Lundi-Vendredi: 9h-18h",
        conservation: "Votre commande sera conservée 7 jours",
        emailContact: process.env.SUPPORT_EMAIL || "support@clubmanager.com",
        telephoneContact: process.env.CLUB_PHONE || "01 23 45 67 89",
        anneeActuelle: new Date().getFullYear().toString(),
      };

      await emailClient.sendOrderConfirmationEmail(
        user.email,
        userId,
        templateData,
      );
      console.log("✅ [ConfirmPaymentCommande] Email commande envoyé");
    } catch (emailError) {
      console.error(
        "❌ [ConfirmPaymentCommande] Erreur email commande:",
        emailError,
      );
    }
  }

  return {
    success: true,
    message: "Commande payée avec succès",
    payment_intent_id: paymentIntentId,
    commande_id: commandeId,
    stripe_status: paymentIntent.status,
    database_updated: true,
    email_envoye: true,
    timestamp: new Date().toISOString(),
    commande_info: {
      statut_mis_a_jour: "payée",
      table_structure: "Utilisé colonnes existantes (id, statut)",
      date_paiement_tracee_dans: "table paiements",
    },
  };
};

// ============================================
// EXPORTS AVEC MIDDLEWARES
// ============================================

export const confirmationResolvers = {
  Query: {
    confirmationHealth: confirmationHealthResolver,
  },
  Mutation: {
    confirmPayment: combineMiddlewares(
      requireAuth,
      withSentry,
    )(confirmPaymentResolver),
    confirmPaymentCommande: combineMiddlewares(
      requireAuth,
      withSentry,
    )(confirmPaymentCommandeResolver),
  },
};
