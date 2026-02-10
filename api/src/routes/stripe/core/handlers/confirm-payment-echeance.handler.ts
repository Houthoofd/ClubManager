/**
 * Handler POST /api/stripe/confirm-payment
 * Confirme un paiement Stripe pour une échéance et déclenche les actions associées
 * (enregistrement DB, upgrade statut, envoi email)
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";
import { PaymentService } from "../services/payment.service.js";
import { StatusUpgradeService } from "../services/status-upgrade.service.js";
import { EmailNotificationService } from "../services/email-notification.service.js";
import { confirmPaymentEcheanceSchema } from "@clubmanager/types/validators";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  InternalServerError,
  EmailError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour confirmer un paiement d'échéance
 * POST /api/stripe/confirm-payment
 *
 * @returns 200 - Paiement confirmé avec succès
 * @returns 400 - Données invalides
 * @returns 403 - Échéance n'appartient pas à l'utilisateur
 * @returns 404 - PaymentIntent ou échéance non trouvé
 * @returns 500 - Erreur serveur
 */
export async function confirmPaymentEcheance(
  req: Request,
  res: Response,
  stripeService?: StripeService,
  paymentService?: PaymentService,
  statusUpgradeService?: StatusUpgradeService,
  emailService?: EmailNotificationService,
): Promise<void> {
  try {
    console.log(
      "✅ [Handler Stripe] POST /confirm-payment - Confirmation paiement échéance",
    );

    // 1. Validation des données avec Zod
    const validation = confirmPaymentEcheanceSchema.safeParse(req.body);

    if (!validation.success) {
      console.log(
        "⚠️ [Handler Stripe] Validation échouée:",
        validation.error.errors,
      );
      throw new ValidationError("Données invalides", validation.error.errors);
    }

    const { paymentIntentId, echeanceId, userId, amount } = validation.data;

    // 2. Initialiser les services
    const stripe = stripeService || StripeService.getInstance();
    const payment = paymentService || PaymentService.getInstance();
    const statusUpgrade =
      statusUpgradeService || StatusUpgradeService.getInstance();
    const email = emailService || EmailNotificationService.getInstance();

    // 3. Vérifier le PaymentIntent dans Stripe
    const paymentIntent = await stripe.recupererPaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      console.log("⚠️ [Handler Stripe] PaymentIntent non trouvé");
      throw new NotFoundError("PaymentIntent non trouvé");
    }

    // 4. Confirmer le paiement via le service (enregistrement DB + mise à jour échéance)
    const confirmationResult = await payment.confirmerPaiementEcheance({
      paymentIntentId,
      echeanceId,
      userId,
      amount,
    });

    if (!confirmationResult.success) {
      console.log(`⚠️ [Handler Stripe] ${confirmationResult.error}`);

      if (confirmationResult.error?.includes("appartient pas")) {
        throw new AuthorizationError(confirmationResult.error);
      } else {
        throw new NotFoundError(
          confirmationResult.error || "Ressource non trouvée",
        );
      }
    }

    // 5. Upgrade du statut utilisateur si premier paiement
    let statusUpgradeResult;
    if (confirmationResult.premierPaiement) {
      statusUpgradeResult = await statusUpgrade.upgraderStatutUtilisateur(
        userId,
        confirmationResult.premierPaiement,
      );

      if (statusUpgradeResult.upgraded) {
        console.log(
          `🎉 [Handler Stripe] Utilisateur ${userId} promu: ${statusUpgradeResult.ancienStatut} → ${statusUpgradeResult.nouveauStatut}`,
        );
      }
    }

    // 6. Envoi email de confirmation (ne bloque pas si erreur)
    try {
      await email.envoyerConfirmationPaiement({
        email: confirmationResult.userEmail || "",
        userId,
        userName: confirmationResult.userName || "",
        amount,
        paymentIntentId,
        premierPaiement: confirmationResult.premierPaiement || false,
        statusUpgrade: statusUpgradeResult,
      });
    } catch (emailError) {
      console.warn(
        "⚠️ [Handler Stripe] Erreur envoi email (non bloquant):",
        emailError,
      );
      // L'erreur email ne bloque pas le paiement, mais on la log
      // Si vous voulez rendre l'email obligatoire, décommentez :
      // throw new EmailError(
      //   "Impossible d'envoyer l'email de confirmation",
      //   emailError instanceof Error ? emailError : undefined,
      // );
    }

    console.log(
      `✅ [Handler Stripe] Paiement confirmé avec succès: ${paymentIntentId}`,
    );

    res.status(200).json({
      success: true,
      message: "Paiement confirmé avec succès",
      data: {
        paiementId: confirmationResult.paiementId,
        premierPaiement: confirmationResult.premierPaiement,
        statusUpgrade: statusUpgradeResult,
      },
    });
  } catch (error) {
    console.error(
      "❌ [Handler Stripe] Erreur confirmation paiement échéance:",
      error,
    );

    // Re-throw si c'est déjà une erreur applicative
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthorizationError ||
      error instanceof EmailError
    ) {
      throw error;
    }

    // Sinon, wrapper dans InternalServerError
    throw new InternalServerError(
      "Erreur serveur lors de la confirmation du paiement",
      error instanceof Error ? error : undefined,
    );
  }
}
