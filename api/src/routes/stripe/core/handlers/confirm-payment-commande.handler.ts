/**
 * Handler POST /api/stripe/confirm-payment-commande
 * Confirme un paiement Stripe pour une commande et déclenche les actions associées
 * (enregistrement DB, upgrade statut, envoi email)
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";
import { PaymentService } from "../services/payment.service.js";
import { StatusUpgradeService } from "../services/status-upgrade.service.js";
import { EmailNotificationService } from "../services/email-notification.service.js";
import { confirmPaymentCommandeSchema } from "../validators/stripe.schema.js";

/**
 * Handler pour confirmer un paiement de commande
 * POST /api/stripe/confirm-payment-commande
 *
 * @returns 200 - Paiement confirmé avec succès
 * @returns 400 - Données invalides
 * @returns 403 - Commande n'appartient pas à l'utilisateur
 * @returns 404 - PaymentIntent ou commande non trouvé
 * @returns 500 - Erreur serveur
 */
export async function confirmPaymentCommande(
  req: Request,
  res: Response,
  stripeService?: StripeService,
  paymentService?: PaymentService,
  statusUpgradeService?: StatusUpgradeService,
  emailService?: EmailNotificationService
): Promise<void> {
  try {
    console.log("✅ [Handler Stripe] POST /confirm-payment-commande - Confirmation paiement commande");

    // 1. Validation des données avec Zod
    const validation = confirmPaymentCommandeSchema.safeParse(req.body);

    if (!validation.success) {
      console.log("⚠️ [Handler Stripe] Validation échouée:", validation.error.errors);
      res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: validation.error.errors,
      });
      return;
    }

    const { paymentIntentId, commandeId, userId, amount } = validation.data;

    // 2. Initialiser les services
    const stripe = stripeService || StripeService.getInstance();
    const payment = paymentService || PaymentService.getInstance();
    const statusUpgrade = statusUpgradeService || StatusUpgradeService.getInstance();
    const email = emailService || EmailNotificationService.getInstance();

    // 3. Vérifier le PaymentIntent dans Stripe
    const paymentIntent = await stripe.recupererPaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      console.log("⚠️ [Handler Stripe] PaymentIntent non trouvé");
      res.status(404).json({
        success: false,
        message: "PaymentIntent non trouvé",
      });
      return;
    }

    // 4. Confirmer le paiement via le service (enregistrement DB + mise à jour commande)
    const confirmationResult = await payment.confirmerPaiementCommande({
      paymentIntentId,
      commandeId,
      userId,
      amount,
    });

    if (!confirmationResult.success) {
      const status = confirmationResult.error?.includes("appartient pas") ? 403 : 404;
      console.log(`⚠️ [Handler Stripe] ${confirmationResult.error}`);
      res.status(status).json({
        success: false,
        message: confirmationResult.error,
      });
      return;
    }

    // 5. Upgrade du statut utilisateur si premier paiement
    let statusUpgradeResult;
    if (confirmationResult.premierPaiement) {
      statusUpgradeResult = await statusUpgrade.upgraderStatutUtilisateur(
        userId,
        confirmationResult.premierPaiement
      );

      if (statusUpgradeResult.upgraded) {
        console.log(`🎉 [Handler Stripe] Utilisateur ${userId} promu: ${statusUpgradeResult.ancienStatut} → ${statusUpgradeResult.nouveauStatut}`);
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
      console.warn("⚠️ [Handler Stripe] Erreur envoi email (non bloquant):", emailError);
    }

    console.log(`✅ [Handler Stripe] Paiement commande confirmé avec succès: ${paymentIntentId}`);

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
    console.error("❌ [Handler Stripe] Erreur confirmation paiement commande:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la confirmation du paiement",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
