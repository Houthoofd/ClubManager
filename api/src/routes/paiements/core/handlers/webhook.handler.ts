import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service.js';
import { Paiements } from '../../../../db/clients/paiements/paiements.js';
import Stripe from 'stripe';

/**
 * Handler pour gérer les webhooks Stripe
 * POST /api/paiements/webhook
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response,
  paiementsClient?: Paiements
): Promise<void> {
  try {
    console.log('🔔 [Webhook] Réception webhook Stripe');

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      console.error('❌ [Webhook] Signature Stripe manquante');
      res.status(400).json({
        success: false,
        message: 'Signature Stripe manquante',
      });
      return;
    }

    if (!endpointSecret) {
      console.error('❌ [Webhook] Secret webhook non configuré');
      res.status(500).json({
        success: false,
        message: 'Configuration webhook manquante',
      });
      return;
    }

    const stripeService = StripeService.getInstance();
    let event: Stripe.Event;

    try {
      // Vérifier la signature du webhook
      event = stripeService.constructWebhookEvent(
        req.body,
        sig as string,
        endpointSecret
      );

      console.log('✅ [Webhook] Événement vérifié:', {
        type: event.type,
        id: event.id,
      });
    } catch (err) {
      console.error('❌ [Webhook] Erreur de signature:', err);
      res.status(400).json({
        success: false,
        message: 'Signature webhook invalide',
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      });
      return;
    }

    const client = paiementsClient || new Paiements();

    // Traiter les différents types d'événements
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 [Webhook] Payment Intent réussi:', paymentIntent.id);

        try {
          // Extraire les métadonnées
          const metadata = paymentIntent.metadata;
          const type = metadata?.type;

          if (type === 'echeance' && metadata?.echeance_id && metadata?.utilisateur_id) {
            // Mise à jour de l'échéance
            const echeanceId = parseInt(metadata.echeance_id);
            await client.mettreAJourStatutEcheance(echeanceId, 'payé');

            console.log('✅ [Webhook] Échéance mise à jour:', echeanceId);
          } else if (type === 'commande' && metadata?.commande_id && metadata?.utilisateur_id) {
            // Mise à jour de la commande
            const commandeId = parseInt(metadata.commande_id);
            await client.mettreAJourStatutCommande(commandeId, 'payé');

            // Enregistrer le paiement
            await client.enregistrerPaiement({
              stripe_payment_intent_id: paymentIntent.id,
              commande_id: commandeId,
              utilisateur_id: parseInt(metadata.utilisateur_id),
              montant: paymentIntent.amount / 100,
              statut: 'completed',
            });

            console.log('✅ [Webhook] Commande mise à jour:', commandeId);
          }
        } catch (dbError) {
          console.error('❌ [Webhook] Erreur mise à jour DB:', dbError);
          // Ne pas bloquer le webhook, retourner 200 quand même
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ [Webhook] Payment Intent échoué:', paymentIntent.id);

        try {
          const metadata = paymentIntent.metadata;
          const type = metadata?.type;

          if (type === 'echeance' && metadata?.echeance_id) {
            const echeanceId = parseInt(metadata.echeance_id);
            await client.mettreAJourStatutEcheance(echeanceId, 'échec');
            console.log('✅ [Webhook] Échéance marquée en échec:', echeanceId);
          } else if (type === 'commande' && metadata?.commande_id) {
            const commandeId = parseInt(metadata.commande_id);
            await client.mettreAJourStatutCommande(commandeId, 'échec');
            console.log('✅ [Webhook] Commande marquée en échec:', commandeId);
          }
        } catch (dbError) {
          console.error('❌ [Webhook] Erreur mise à jour DB:', dbError);
        }

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('⚠️ [Webhook] Payment Intent annulé:', paymentIntent.id);

        try {
          const metadata = paymentIntent.metadata;
          const type = metadata?.type;

          if (type === 'echeance' && metadata?.echeance_id) {
            const echeanceId = parseInt(metadata.echeance_id);
            await client.mettreAJourStatutEcheance(echeanceId, 'annulé');
            console.log('✅ [Webhook] Échéance marquée annulée:', echeanceId);
          } else if (type === 'commande' && metadata?.commande_id) {
            const commandeId = parseInt(metadata.commande_id);
            await client.mettreAJourStatutCommande(commandeId, 'annulé');
            console.log('✅ [Webhook] Commande marquée annulée:', commandeId);
          }
        } catch (dbError) {
          console.error('❌ [Webhook] Erreur mise à jour DB:', dbError);
        }

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 [Webhook] Remboursement effectué:', charge.id);

        try {
          const paymentIntent = charge.payment_intent;
          if (typeof paymentIntent === 'string') {
            // Rechercher le paiement dans la DB et le marquer comme remboursé
            await client.marquerPaiementRembourse(paymentIntent);
            console.log('✅ [Webhook] Paiement marqué remboursé');
          }
        } catch (dbError) {
          console.error('❌ [Webhook] Erreur mise à jour DB:', dbError);
        }

        break;
      }

      default:
        console.log('ℹ️ [Webhook] Type d\'événement non géré:', event.type);
    }

    // Toujours retourner 200 pour confirmer la réception du webhook
    res.status(200).json({
      success: true,
      received: true,
      processed: true,
      event_type: event.type,
    });
  } catch (error) {
    console.error('❌ [Webhook] Erreur traitement webhook:', error);

    // Toujours retourner 200 pour éviter que Stripe réessaye indéfiniment
    res.status(200).json({
      success: false,
      received: true,
      processed: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
  }
}
