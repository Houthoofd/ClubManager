import { Request, Response } from "express";
import { ConfirmationService } from "../services/confirmation.service.js";
import { confirmCommandePaymentSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../../db/clients/messagerie/emailClient.js";
import { z } from "zod";

/**
 * Handler pour confirmer un paiement de commande après validation Stripe
 * POST /api/paiements/stripe/confirm-commande
 */
export async function confirmCommandePayment(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
  emailClient?: EmailClient,
): Promise<void> {
  try {
    console.log("🎯 [Confirm Commande] Début confirmation paiement commande");
    console.log("📝 [Confirm Commande] Données reçues:", req.body);

    // 1. Validation des données avec Zod
    const validatedData = confirmCommandePaymentSchema.parse(req.body);

    console.log("✅ [Confirm Commande] Données validées:", validatedData);

    // 2. Confirmer le paiement via le service
    const confirmationService = new ConfirmationService(
      paiementsClient,
      emailClient,
    );
    const result = await confirmationService.confirmCommandePayment({
      paymentIntentId: validatedData.paymentIntentId,
      commandeId: validatedData.commandeId,
      userId: validatedData.userId,
      amount: validatedData.amount,
    });

    console.log("✅ [Confirm Commande] Paiement confirmé:", result);

    // 3. Retourner la réponse
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ [Confirm Commande] Erreur:", error);

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      res.status(400).json({
        success: false,
        message: firstError.message,
        errors: error.errors,
      });
      return;
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
      // Commande déjà payée
      if (
        error.message.includes("déjà payée") ||
        error.message.includes("déjà enregistré")
      ) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Commande introuvable
      if (error.message.includes("introuvable")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Payment Intent non validé
      if (error.message.includes("succeeded")) {
        res.status(400).json({
          success: false,
          message: "Le paiement n'a pas été validé par Stripe",
          details: error.message,
        });
        return;
      }
    }

    // Erreur serveur générique
    res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation du paiement de la commande",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
