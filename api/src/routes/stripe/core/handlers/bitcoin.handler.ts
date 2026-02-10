/**
 * Handler POST /api/stripe/bitcoin
 * Crée un paiement via Bitcoin (méthode de paiement alternative)
 */

import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service.js";
import { alternativePaymentSchema } from "@clubmanager/types/validators";

/**
 * Handler pour créer un paiement Bitcoin
 * POST /api/stripe/bitcoin
 *
 * @returns 200 - Paiement Bitcoin créé avec succès
 * @returns 400 - Données invalides
 * @returns 500 - Erreur serveur
 */
export async function bitcoin(
  req: Request,
  res: Response,
  paymentService?: PaymentService,
): Promise<void> {
  try {
    console.log(
      "💳 [Handler Stripe] POST /bitcoin - Création paiement Bitcoin",
    );

    // 1. Validation des données avec Zod
    const validation = alternativePaymentSchema.safeParse(req.body);

    if (!validation.success) {
      console.log(
        "⚠️ [Handler Stripe] Validation échouée:",
        validation.error.errors,
      );
      res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: validation.error.errors,
      });
      return;
    }

    const { amount, commande, userId } = validation.data;

    // 2. Créer la commande si nécessaire
    const payment = paymentService || PaymentService.getInstance();

    const commandeResult = await payment.creerCommandeSiNecessaire(
      commande,
      userId,
    );

    // 3. Enregistrer le paiement avec méthode Bitcoin
    const paiementId = await payment.enregistrerPaiement({
      userId,
      montant: amount,
      methodePaiement: "bitcoin",
      statut: "en_attente",
      commandeId: commandeResult.commandeId,
    });

    console.log(`✅ [Handler Stripe] Paiement Bitcoin créé: ID ${paiementId}`);

    res.status(200).json({
      success: true,
      message: "Paiement Bitcoin créé avec succès",
      data: {
        paiementId,
        commandeId: commandeResult.commandeId,
        methodePaiement: "bitcoin",
      },
    });
  } catch (error) {
    console.error(
      "❌ [Handler Stripe] Erreur création paiement Bitcoin:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du paiement Bitcoin",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
