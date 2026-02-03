import { Request, Response } from 'express';
import { PaymentIntentService } from '../services/payment-intent.service.js';
import { createPaymentIntentEcheanceSchema } from '../validators/paiement.schema.js';
import { Paiements } from '../../../../db/clients/paiements/paiements.js';
import { z } from 'zod';

/**
 * Handler pour créer un Payment Intent Stripe pour une échéance
 * POST /api/paiements/stripe/create-payment-intent
 */
export async function createPaymentEcheance(
  req: Request,
  res: Response,
  paiementsClient?: Paiements
): Promise<void> {
  try {
    console.log('🎯 [Create Payment Echeance] Début création Payment Intent');
    console.log('📝 [Create Payment Echeance] Données reçues:', {
      body: req.body,
      user: (req as any).user?.id,
    });

    // 1. Validation des données avec Zod
    const validatedData = createPaymentIntentEcheanceSchema.parse(req.body);

    console.log('✅ [Create Payment Echeance] Données validées:', validatedData);

    // 2. Créer le payment intent via le service
    const paymentIntentService = new PaymentIntentService(paiementsClient);
    const result = await paymentIntentService.createForEcheance({
      amount: validatedData.amount,
      echeanceId: validatedData.echeanceId,
      userId: validatedData.userId,
      currency: validatedData.currency,
      description: validatedData.description,
    });

    console.log('✅ [Create Payment Echeance] Payment Intent créé:', result.payment_intent_id);

    // 3. Retourner la réponse
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ [Create Payment Echeance] Erreur:', error);

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
      // Échéance déjà payée
      if (error.message.includes('déjà été payée')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Échéance introuvable
      if (error.message.includes('introuvable')) {
        res.status(404).json({
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
      message: 'Erreur lors de la création du Payment Intent',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
}
