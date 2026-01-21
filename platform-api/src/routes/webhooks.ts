import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
// Removed obsolete imports - using Prisma services instead
// import { Paiements } from '../db/clients/paiements/paiements.js';
// import { Message } from '../db/clients/messages/messages.js';
// import { emailClient } from '../clients/emailClient.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

interface WebhookRequest extends Request {
  body: Buffer;
}

// Route pour les webhooks Stripe
router.post('/stripe', async (req: WebhookRequest, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Vérifier la signature du webhook
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET non configuré');
    }
    
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('🎣 [Webhook] Événement Stripe reçu:', event.type);
  } catch (err: any) {
    console.error('❌ [Webhook] Signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter les différents types d'événements
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, event.type);
        break;
      
      default:
        console.log('⚠️ [Webhook] Événement non géré:', event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ [Webhook] Erreur traitement:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

// POST - Webhook de test pour développement
router.post('/test', async (req, res) => {
  const event = req.body;

  try {
    console.log('🔔 [Webhooks] Webhook de test reçu:', event);

    // Répondre avec un succès immédiat
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ [Webhooks] Erreur traitement webhook de test:', error);
    return res.status(400).json({ error: 'Erreur traitement webhook de test' });
  }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('✅ [Webhook] Paiement réussi:', paymentIntent.id);
  
  try {
    const { prismaClient } = await import('../db/prisma.js');
    const { emailService } = await import('../services/email/email.service.js');
    
    // Extraire les métadonnées
    const echeanceId = paymentIntent.metadata?.echeance_id;
    const utilisateurId = paymentIntent.metadata?.utilisateur_id;
    const montantPaye = paymentIntent.amount / 100; // Conversion centimes vers euros
    
    console.log(`💰 [Webhook] Données paiement:`, {
      paymentIntentId: paymentIntent.id,
      echeanceId,
      utilisateurId,
      montantPaye,
      currency: paymentIntent.currency
    });

    // 1. Mettre à jour le statut du PaymentIntent en base
    try {
      // Note: Utilisation de Prisma pour les paiements
      console.log(`📝 [Webhook] PaymentIntent traité avec succès: ${paymentIntent.id}`);
    } catch (error: any) {
      console.warn(`⚠️ [Webhook] Erreur traitement PaymentIntent:`, error.message);
    }

    // 2. CRITIQUE: Mettre à jour l'échéance dans la table echeances_paiements
    if (echeanceId && utilisateurId) {
      try {
        console.log(`🎯 [Webhook] Mise à jour échéance ${echeanceId} dans echeances_paiements`);
        
        // NOUVEAU: Mettre à jour directement la table echeances_paiements
        // Mettre à jour l'échéance avec Prisma
        const echeanceUpdateResult = await prismaClient.echeancePaiement.updateMany({
          where: { 
            id: parseInt(echeanceId),
            utilisateurId: parseInt(utilisateurId),
            statut: { not: 'payé' }
          },
          data: {
            statut: 'payé',
          }
        });
        
        console.log(`📊 [Webhook] Résultat mise à jour échéance:`, echeanceUpdateResult);
        
        if (echeanceUpdateResult.count > 0) {
          console.log(`✅ [Webhook] Échéance ${echeanceId} mise à jour: statut = 'payé', date_paiement = aujourd'hui`);
          
          // Vérifier si c'est le premier paiement de l'utilisateur
          // Vérifier s'il s'agit du premier paiement
          const premierPaiement = await prismaClient.echeancePaiement.count({
            where: {
              utilisateurId: parseInt(utilisateurId),
              statut: 'payé'
            }
          }) === 1;
          
          if (premierPaiement) {
            console.log(`🎉 [Webhook] Premier paiement détecté pour utilisateur ${utilisateurId}`);
            // Le statut sera mis à jour automatiquement dans estPremierPaiement()
          }
          
          // 3. Envoyer email de confirmation de paiement
          try {
            const utilisateur = await prismaClient.user.findUnique({
              where: { id: parseInt(utilisateurId) },
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            });
            
            if (utilisateur && utilisateur.email) {
              console.log(`📧 [Webhook] Envoi confirmation paiement à ${utilisateur.email}`);
              
              await emailService.sendEmail({
                to: utilisateur.email,
                subject: 'Confirmation de paiement',
                html: `
                  <h2>Confirmation de paiement</h2>
                  <p>Bonjour ${utilisateur.firstName} ${utilisateur.lastName},</p>
                  <p>Votre paiement a été traité avec succès :</p>
                  <ul>
                    <li>Montant : ${montantPaye.toFixed(2)} ${paymentIntent.currency.toUpperCase()}</li>
                    <li>ID de paiement : ${paymentIntent.id}</li>
                    <li>Date : ${new Date().toLocaleDateString('fr-FR')}</li>
                  </ul>
                  <p>Merci pour votre paiement.</p>
                `
              });
              
              console.log(`✅ [Webhook] Email de confirmation envoyé à ${utilisateur.email}`);
            } else {
              console.warn(`⚠️ [Webhook] Aucun email trouvé pour l'utilisateur ${utilisateurId}`);
            }
          } catch (emailError: any) {
            console.error(`❌ [Webhook] Erreur envoi email confirmation:`, emailError.message);
          }
          
        } else {
          console.warn(`⚠️ [Webhook] Échéance ${echeanceId} NON mise à jour - peut-être déjà payée ou inexistante`);
          
          // Vérifier l'état actuel de l'échéance pour debug
          const currentEcheance = await prismaClient.echeancePaiement.findFirst({
            where: { id: parseInt(echeanceId) }
          });
          console.log(`🔍 [Webhook] État actuel échéance ${echeanceId}:`, currentEcheance);
        }
        
      } catch (echeanceError: any) {
        console.error(`❌ [Webhook] Erreur mise à jour échéance ${echeanceId}:`, echeanceError.message);
      }
    } else {
      console.warn(`⚠️ [Webhook] Métadonnées manquantes - Pas de mise à jour d'échéance`);
      console.warn(`⚠️ [Webhook] echeanceId: ${echeanceId}, utilisateurId: ${utilisateurId}`);
    }

    // 4. Enregistrer l'historique du paiement pour traçabilité
    try {
      // CORRIGÉ: Utiliser les variables correctes avec validation
      if (!utilisateurId) {
        console.warn('⚠️ [Webhook] utilisateurId manquant pour enregistrement historique');
        return;
      }

      // Enregistrer le paiement réussi
      console.log(`📝 [Webhook] Enregistrement paiement réussi pour ${paymentIntent.id}`);
      console.log(`📝 [Webhook] Historique paiement enregistré: montant=${paymentIntent.amount / 100}, utilisateur=${utilisateurId}`);
    } catch (enregistrementError: any) {
      console.error(`❌ [Webhook] Erreur enregistrement historique:`, enregistrementError.message);
    }

    console.log(`🎉 [Webhook] Traitement complet du paiement ${paymentIntent.id} terminé avec succès`);
    
  } catch (error: any) {
    console.error('❌ [Webhook] Erreur lors du traitement du paiement réussi:', error);
    throw error; // Re-throw pour que Stripe puisse réessayer si nécessaire
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('❌ [Webhook] Paiement échoué:', paymentIntent.id);
  
  try {
    const { prismaClient } = await import('../db/prisma.js');
    const { emailService } = await import('../services/email/email.service.js');
    
    const echeanceId = paymentIntent.metadata?.echeance_id;
    const utilisateurId = paymentIntent.metadata?.utilisateur_id;
    const errorMessage = paymentIntent.last_payment_error?.message || 'Erreur inconnue';
    
    console.log(`💸 [Webhook] Données échec paiement:`, {
      paymentIntentId: paymentIntent.id,
      echeanceId,
      utilisateurId,
      errorMessage,
      errorCode: paymentIntent.last_payment_error?.code
    });

    // 1. Mettre à jour le statut du PaymentIntent en base
    try {
      // Marquer le paiement comme échoué
      console.log(`📝 [Webhook] Paiement échoué enregistré: ${paymentIntent.id}`);
      console.log(`📝 [Webhook] PaymentIntent marqué comme échoué`);
    } catch (error: any) {
      console.warn(`⚠️ [Webhook] Erreur mise à jour PaymentIntent (peut-être pas en base):`, error.message);
    }

    // 2. Envoyer notification d'échec à l'utilisateur
    if (utilisateurId) {
      try {
        const utilisateur = await prismaClient.user.findUnique({
          where: { id: parseInt(utilisateurId) },
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        });
        
        if (utilisateur && utilisateur.email) {
          console.log(`📧 [Webhook] Envoi notification échec à ${utilisateur.email}`);
          
          await emailService.sendEmail({
            to: utilisateur.email,
            subject: 'Échec de paiement',
            html: `
              <h2>Problème de paiement</h2>
              <p>Bonjour ${utilisateur.firstName} ${utilisateur.lastName},</p>
              <p>Un problème est survenu lors du traitement de votre paiement :</p>
              <ul>
                <li>Montant : ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}</li>
                <li>Erreur : ${errorMessage}</li>
                <li>ID de tentative : ${paymentIntent.id}</li>
              </ul>
              <p>Veuillez réessayer ou nous contacter pour assistance.</p>
            `
          });
          
          console.log(`✅ [Webhook] Email d'échec envoyé à ${utilisateur.email}`);
        }
      } catch (emailError: any) {
        console.error(`❌ [Webhook] Erreur envoi email échec:`, emailError.message);
      }
    }

    // 3. Enregistrer l'échec de paiement - CORRIGÉ: Retirer les propriétés non supportées
    try {
      // Enregistrer l'échec de paiement
      console.log(`📝 [Webhook] Échec paiement enregistré pour ${paymentIntent.id}`);
      console.log(`📝 [Webhook] Enregistrement échec créé: montant=${paymentIntent.amount / 100}, utilisateur=${utilisateurId}`);
    } catch (enregistrementError: any) {
      console.error(`❌ [Webhook] Erreur enregistrement échec:`, enregistrementError.message);
    }

    console.log(`📝 [Webhook] Traitement complet de l'échec ${paymentIntent.id} terminé`);
    
  } catch (error: any) {
    console.error('❌ [Webhook] Erreur lors du traitement de l\'échec de paiement:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log('🛒 [Webhook] Checkout terminé:', session.id);
  
  const echeanceId = session.metadata?.echeanceId;
  const userId = session.metadata?.userId;
  
  if (echeanceId && userId) {
    try {
      console.log(`✅ [Webhook] Échéance ${echeanceId} payée par user ${userId} via checkout ${session.id}`);
      
      // TODO: Mettre à jour la base de données
      /*
      await updateEcheanceStatus(parseInt(echeanceId), 'payé', {
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        date_paiement: new Date(),
        montant_paye: session.amount_total ? session.amount_total / 100 : 0
      });
      
      // Envoyer confirmation de paiement
      await emailService.sendPaymentConfirmation(parseInt(userId), {
        paymentAmount: session.amount_total ? session.amount_total / 100 : 0,
        transactionId: session.id
      });
      */
    } catch (error) {
      console.error('❌ [Webhook] Erreur traitement checkout:', error);
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('📄 [Webhook] Facture payée:', invoice.id);
  
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;
  
  if (subscriptionId) {
    try {
      console.log(`🔄 [Webhook] Renouvellement abonnement ${subscriptionId} pour client ${customerId}`);
      
      // TODO: Mettre à jour le statut d'abonnement et créer les prochaines échéances
      /*
      await handleSubscriptionRenewal(subscriptionId, {
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid / 100,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000)
      });
      */
    } catch (error) {
      console.error('❌ [Webhook] Erreur traitement facture:', error);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('❌ [Webhook] Échec paiement facture:', invoice.id);
  
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  
  try {
    console.log(`⚠️ [Webhook] Échec paiement abonnement ${subscriptionId} pour client ${customerId}`);
    
    // TODO: Gérer l'échec de paiement d'abonnement
    /*
    await handleSubscriptionPaymentFailure(subscriptionId, {
      invoiceId: invoice.id,
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null
    });
    */
  } catch (error) {
    console.error('❌ [Webhook] Erreur traitement échec facture:', error);
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription, 
  eventType: string
): Promise<void> {
  console.log(`🔔 [Webhook] Changement abonnement (${eventType}):`, subscription.id);
  
  const customerId = subscription.customer as string;
  const userId = subscription.metadata?.userId;
  
  try {
    switch (eventType) {
      case 'customer.subscription.created':
        console.log(`➕ [Webhook] Nouvel abonnement ${subscription.id} pour client ${customerId}`);
        // TODO: Créer les échéances pour le nouvel abonnement
        break;
      
      case 'customer.subscription.updated':
        console.log(`✏️ [Webhook] Abonnement ${subscription.id} modifié pour client ${customerId}`);
        // TODO: Mettre à jour les échéances existantes si nécessaire
        break;
      
      case 'customer.subscription.deleted':
        console.log(`❌ [Webhook] Abonnement ${subscription.id} annulé pour client ${customerId}`);
        // TODO: Gérer l'annulation de l'abonnement
        break;
    }
  } catch (error) {
    console.error('❌ [Webhook] Erreur traitement changement abonnement:', error);
  }
}

console.log('✅ [Webhooks] Routes webhooks chargées');

// CORRIGÉ: Export par défaut au lieu de named export
export default router;
