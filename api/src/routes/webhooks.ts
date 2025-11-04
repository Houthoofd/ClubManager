import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { Message } from '../db/clients/messages/messages.js';
import { emailClient } from '../clients/emailClient.js';

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

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('✅ [Webhook] Paiement réussi:', paymentIntent.id);
  
  try {
    const paiements = new Paiements();
    const messageClient = new Message();
    
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
      const confirmationResult = await paiements.confirmerPaiementStripe(paymentIntent.id, 'reussi');
      console.log(`📝 [Webhook] PaymentIntent marqué comme réussi:`, confirmationResult);
    } catch (error: any) {
      console.warn(`⚠️ [Webhook] Erreur confirmation PaymentIntent (peut-être pas en base):`, error.message);
    }

    // 2. CRITIQUE: Mettre à jour l'échéance dans la table echeances_paiements
    if (echeanceId && utilisateurId) {
      try {
        console.log(`🎯 [Webhook] Mise à jour échéance ${echeanceId} dans echeances_paiements`);
        
        // NOUVEAU: Mettre à jour directement la table echeances_paiements
        const updateEcheanceQuery = `
          UPDATE echeances_paiements 
          SET 
            statut = 'payé', 
            date_paiement = CURDATE()
          WHERE id = ? AND utilisateur_id = ? AND statut != 'payé'
        `;
        
        const echeanceUpdateResult = await paiements.queryAsync(updateEcheanceQuery, [
          parseInt(echeanceId), 
          parseInt(utilisateurId)
        ]);
        
        console.log(`📊 [Webhook] Résultat mise à jour échéance:`, echeanceUpdateResult);
        
        if (echeanceUpdateResult.affectedRows > 0) {
          console.log(`✅ [Webhook] Échéance ${echeanceId} mise à jour: statut = 'payé', date_paiement = aujourd'hui`);
          
          // Vérifier si c'est le premier paiement de l'utilisateur
          const premierPaiement = await paiements.estPremierPaiement(parseInt(utilisateurId));
          
          if (premierPaiement) {
            console.log(`🎉 [Webhook] Premier paiement détecté pour utilisateur ${utilisateurId}`);
            // Le statut sera mis à jour automatiquement dans estPremierPaiement()
          }
          
          // 3. Envoyer email de confirmation de paiement
          try {
            const utilisateur = await messageClient.obtenirEmailsDestinataires([parseInt(utilisateurId)]);
            
            if (utilisateur.length > 0 && utilisateur[0].email) {
              console.log(`📧 [Webhook] Envoi confirmation paiement à ${utilisateur[0].email}`);
              
              await emailClient.sendTemplatedEmailFromFile({
                to: utilisateur[0].email,
                templateName: 'confirmation-paiement',
                variables: {
                  userName: `${utilisateur[0].first_name} ${utilisateur[0].last_name}`,
                  firstName: utilisateur[0].first_name,
                  lastName: utilisateur[0].last_name,
                  amount: montantPaye.toFixed(2),
                  currency: paymentIntent.currency.toUpperCase(),
                  paymentIntentId: paymentIntent.id,
                  echeanceId: echeanceId,
                  datePaiement: new Date().toLocaleDateString('fr-FR'),
                  clubName: 'Club Manager',
                  currentYear: new Date().getFullYear().toString(),
                  supportEmail: process.env.ADMIN_EMAIL || 'support@clubmanager.com',
                  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
                  premierPaiement: premierPaiement.toString()
                },
                utilisateurId: parseInt(utilisateurId),
                fallbackSubject: '[ClubManager] Confirmation de paiement'
              });
              
              console.log(`✅ [Webhook] Email de confirmation envoyé à ${utilisateur[0].email}`);
            } else {
              console.warn(`⚠️ [Webhook] Aucun email trouvé pour l'utilisateur ${utilisateurId}`);
            }
          } catch (emailError: any) {
            console.error(`❌ [Webhook] Erreur envoi email confirmation:`, emailError.message);
          }
          
        } else {
          console.warn(`⚠️ [Webhook] Échéance ${echeanceId} NON mise à jour - peut-être déjà payée ou inexistante`);
          
          // Vérifier l'état actuel de l'échéance pour debug
          const checkEcheanceQuery = `
            SELECT id, utilisateur_id, statut, date_paiement, montant 
            FROM echeances_paiements 
            WHERE id = ?
          `;
          const currentEcheance = await paiements.queryAsync(checkEcheanceQuery, [parseInt(echeanceId)]);
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
      const enregistrementResult = await paiements.enregistrerPaiementEcheance({
        utilisateur_id: parseInt(utilisateurId || '0'),
        montant: montantPaye,
        methode_paiement: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        statut: 'confirme'
      });
      
      console.log(`📝 [Webhook] Historique paiement enregistré:`, enregistrementResult);
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
    const paiements = new Paiements();
    const messageClient = new Message();
    
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
      await paiements.confirmerPaiementStripe(paymentIntent.id, 'echec');
      console.log(`📝 [Webhook] PaymentIntent marqué comme échoué`);
    } catch (error: any) {
      console.warn(`⚠️ [Webhook] Erreur mise à jour PaymentIntent (peut-être pas en base):`, error.message);
    }

    // 2. Envoyer notification d'échec à l'utilisateur
    if (utilisateurId) {
      try {
        const utilisateur = await messageClient.obtenirEmailsDestinataires([parseInt(utilisateurId)]);
        
        if (utilisateur.length > 0 && utilisateur[0].email) {
          console.log(`📧 [Webhook] Envoi notification échec à ${utilisateur[0].email}`);
          
          await emailClient.sendTemplatedEmailFromFile({
            to: utilisateur[0].email,
            templateName: 'echec-paiement',
            variables: {
              userName: `${utilisateur[0].first_name} ${utilisateur[0].last_name}`,
              firstName: utilisateur[0].first_name,
              lastName: utilisateur[0].last_name,
              amount: (paymentIntent.amount / 100).toFixed(2),
              currency: paymentIntent.currency.toUpperCase(),
              errorMessage: errorMessage,
              paymentIntentId: paymentIntent.id,
              echeanceId: echeanceId || 'N/A',
              dateEchec: new Date().toLocaleDateString('fr-FR'),
              clubName: 'Club Manager',
              currentYear: new Date().getFullYear().toString(),
              supportEmail: process.env.ADMIN_EMAIL || 'support@clubmanager.com',
              frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
              retryUrl: echeanceId ? `${process.env.FRONTEND_URL}/pages/paiement?echeance=${echeanceId}&userId=${utilisateurId}` : `${process.env.FRONTEND_URL}/pages/paiement?userId=${utilisateurId}`
            },
            utilisateurId: parseInt(utilisateurId),
            fallbackSubject: '[ClubManager] Échec de paiement - Action requise'
          });
          
          console.log(`✅ [Webhook] Email d'échec envoyé à ${utilisateur[0].email}`);
        }
      } catch (emailError: any) {
        console.error(`❌ [Webhook] Erreur envoi email échec:`, emailError.message);
      }
    }

    // 3. Enregistrer l'échec de paiement - CORRIGÉ: Retirer les propriétés non supportées
    try {
      const enregistrementResult = await paiements.enregistrerPaiementEcheance({
        utilisateur_id: parseInt(utilisateurId || '0'),
        montant: paymentIntent.amount / 100,
        methode_paiement: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        statut: 'echec'
        // SUPPRIMÉ: echeance_id et error_message car non supportés
      });
      
      console.log(`📝 [Webhook] Enregistrement échec créé:`, enregistrementResult);
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
      await emailClient.sendPaymentConfirmation(parseInt(userId), {
        echeanceId: parseInt(echeanceId),
        amount: session.amount_total ? session.amount_total / 100 : 0,
        checkoutSessionId: session.id
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

export default router;
