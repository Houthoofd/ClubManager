import { Request, Response } from "express";

// Configuration des endpoints de paiement
const PAYMENT_ENDPOINTS = {
  createPaymentIntent: "/paiements/stripe/create-payment-intent-commande",
  confirmPayment: "/paiements/confirmation/confirm-payment-commande",
  webhook: "/paiements/webhooks/stripe",
  health: "/paiements/health",
  debug: "/paiements/debug/routes",
};

/**
 * Traite le paiement d'une commande en appelant le module de paiement
 */
async function processPayment(commandeData: any): Promise<any> {
  try {
    console.log(
      `🔄 [Commandes] Appel endpoint de confirmation:`,
      PAYMENT_ENDPOINTS.confirmPayment,
    );

    // Vérifier que l'endpoint existe avant l'appel
    const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

    // Test de santé du module paiements
    try {
      const healthResponse = await fetch(
        `${baseUrl}${PAYMENT_ENDPOINTS.health}`,
      );
      const healthData = await healthResponse.json();
      console.log(`🏥 [Commandes] Santé module paiements:`, healthData.status);
    } catch (healthError) {
      console.warn(
        `⚠️ [Commandes] Module paiements possiblement indisponible:`,
        healthError,
      );
    }

    // Utiliser le bon endpoint avec structure modulaire
    const response = await fetch(
      `${baseUrl}${PAYMENT_ENDPOINTS.confirmPayment}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN || ""}`,
        },
        body: JSON.stringify(commandeData),
      },
    );

    console.log(`📡 [Commandes] Réponse confirmation paiement:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Commandes] Erreur confirmation paiement:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        endpoint: PAYMENT_ENDPOINTS.confirmPayment,
      });

      throw new Error(
        `Erreur de confirmation: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log(`✅ [Commandes] Paiement confirmé avec succès:`, result);
    return result;
  } catch (error) {
    console.error(
      "❌ [Commandes] Erreur lors de la confirmation de paiement:",
      error,
    );
    throw error;
  }
}

/**
 * Confirme le paiement d'une commande
 */
export async function paymentConfirmation(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { commandeId } = req.body;

    if (!commandeId) {
      res.status(400).json({
        message: "ID de commande requis",
      });
      return;
    }

    console.log(
      "🔄 [API] Confirmation de paiement pour la commande:",
      commandeId,
    );

    // Utiliser la fonction de traitement de paiement
    const paymentResult = await processPayment({ commandeId });

    res.json({
      message: "Paiement confirmé",
      data: paymentResult,
    });
  } catch (error: any) {
    console.error("❌ [API] Erreur confirmation paiement:", error);
    res.status(500).json({
      message: "Erreur lors de la confirmation du paiement",
      error: error.message,
    });
  }
}
