/**
 * Handler POST /api/stripe/bancontact
 * Crée un paiement via Bancontact (méthode de paiement alternative)
 */

import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service.js";
import { alternativePaymentSchema } from "../validators/stripe.schema.js";

/**
 * Handler pour créer un paiement Bancontact
 * POST /api/stripe/bancontact
 *
 * @returns 200 - Paiement Bancontact créé avec succès
 * @returns 400 - Données invalides
 * @returns 500 - Erreur serveur
 */
export async function bancontact(
  req: Request,
  res: Response,
  paymentService?: PaymentService,
): Promise<void> {
  try {
    console.log(
      "💳 [Handler Stripe] POST /bancontact - Création paiement Bancontact",
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

    // 3. Enregistrer le paiement avec méthode Bancontact
    const paiementId = await payment.enregistrerPaiement({
      userId,
      montant: amount,
      methodePaiement: "bancontact",
      statut: "en_attente",
      commandeId: commandeResult.commandeId,
    });

    console.log(
      `✅ [Handler Stripe] Paiement Bancontact créé: ID ${paiementId}`,
    );

    res.status(200).json({
      success: true,
      message: "Paiement Bancontact créé avec succès",
      data: {
        paiementId,
        commandeId: commandeResult.commandeId,
        methodePaiement: "bancontact",
      },
    });
  } catch (error) {
    console.error(
      "❌ [Handler Stripe] Erreur création paiement Bancontact:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du paiement Bancontact",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
