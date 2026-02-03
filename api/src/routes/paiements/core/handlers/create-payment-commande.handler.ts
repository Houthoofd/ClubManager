import { Request, Response } from 'express';
import { PaymentIntentService } from '../services/payment-intent.service.js';
import { createPaymentIntentCommandeSchema } from '../validators/paiement.schema.js';
import { Paiements } from '../../../../db/clients/paiements/paiements.js';
import { z } from 'zod';

/**
 * Handler pour créer un Payment Intent Stripe pour une commande
 * POST /api/paiements/stripe/create-payment-intent/commande
 */
export async function createPaymentCommande(
  req: Request,
  res: Response,
  paiementsClient?: Paiements
): Promise<void> {
  try {
    console.log('🎯 [Create Payment Commande] Début création Payment Intent');
    console.log('📝 [Create Payment Commande] Données reçues:', {
      body: req.body,
      user: (req as any).user?.id,
    });

    // 1. Validation des données avec Zod
    const validatedData = createPaymentIntentCommandeSchema.parse(req.body);

    console.log('✅ [Create Payment Commande] Données validées:', validatedData);

    // 2. Créer le payment intent via le service
    const paymentIntentService = new PaymentIntentService(paiementsClient);
    const result = await paymentIntentService.createForCommande({
      amount: validatedData.amount,
      commande: validatedData.commande,
      userId: validatedData.userId,
      currency: validatedData.currency,
      description: validatedData.description,
    });

    console.log('✅ [Create Payment Commande] Payment Intent créé:', result.payment_intent_id);

    // 3. Retourner la réponse
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ [Create Payment Commande] Erreur:', error);

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
      if (error.message.includes('déjà été payée')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Commande introuvable
      if (error.message.includes('introuvable')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Format de commande invalide
      if (error.message.includes('Format de commande invalide')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Montant invalide
      if (error.message.includes('montant')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    // Erreur serveur générique
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du Payment Intent pour la commande',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
}
