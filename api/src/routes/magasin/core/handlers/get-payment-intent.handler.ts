import { Request, Response } from "express";
import { z } from "zod";
import { obtenirPaymentIntentCommande } from "../services/index.js";
import { getPaymentIntentSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer le PaymentIntent Stripe d'une commande
 * GET /api/magasin/payment-intent
 */
export async function getPaymentIntent(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log(
      "🔍 [Handler Payment Intent] Récupération PaymentIntent pour commande",
    );

    const { commandeId } = req.params;
    const { userId } = req.query;

    // Validation des paramètres
    const validatedData = getPaymentIntentSchema.parse({
      commandeId,
      userId,
    });

    if (!validatedData.commandeId || !validatedData.userId) {
      throw new ValidationError("ID de commande et utilisateur requis");
    }

    const userIdNumber = parseInt(validatedData.userId);

    const paymentIntent = await obtenirPaymentIntentCommande(
      validatedData.commandeId,
      userIdNumber,
      paiementsClient,
    );

    console.log(
      "✅ [Handler Payment Intent] PaymentIntent récupéré avec succès",
    );

    res.status(200).json(paymentIntent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Payment Intent] Erreur de validation:",
        error.errors,
      );
      throw new ValidationError(
        "Erreur de validation des paramètres",
        formatZodErrors(error.errors),
      );
    }

    console.error(
      "❌ [Handler Payment Intent] Erreur récupération PaymentIntent:",
      error,
    );

    // Gérer les erreurs spécifiques
    if (error instanceof Error) {
      if (
        error.message.includes("non trouvée") ||
        error.message.includes("appartient pas")
      ) {
        throw new NotFoundError(error.message);
      }
    }

    throw new InternalServerError(
      "Erreur lors de la récupération du PaymentIntent",
    );
  }
}
