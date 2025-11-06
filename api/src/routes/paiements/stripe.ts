import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Paiements } from '../../db/clients/paiements/paiements.js';
import { Magasin } from '../../db/clients/magasin/magasin.js'; // AJOUTÉ: Import de la classe Magasin

// Configuration Stripe
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

console.log('🔧 [Stripe] Configuration Stripe:');
console.log('  - STRIPE_SECRET_KEY présente:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - STRIPE_SECRET_KEY préfixe:', process.env.STRIPE_SECRET_KEY?.substring(0, 12) + '...');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ La clé secrète Stripe est manquante dans le fichier .env");
  throw new Error("La clé secrète Stripe est manquante dans le fichier .env");
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (stripeSecretKey.includes('4e') && stripeSecretKey.includes('p7dc')) {
  console.error("❌ Clé Stripe expirée détectée! Veuillez mettre à jour STRIPE_SECRET_KEY dans .env");
  throw new Error("Clé Stripe expirée - Veuillez mettre à jour la configuration");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});

// Test de connectivité Stripe
stripe.balance.retrieve()
  .then(() => console.log('✅ [Stripe] Connexion validée'))
  .catch((error) => console.error('❌ [Stripe] Erreur:', error.message));

const router = express.Router();

// POST - Créer un PaymentIntent pour échéance
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', echeanceId, userId, description } = req.body;
    
    console.log('🏦 [Paiements] Création PaymentIntent pour échéance:', { 
      amount, 
      currency, 
      echeanceId, 
      userId, 
      description 
    });

    if (!amount || !echeanceId || !userId) {
      return res.status(400).json({ 
        error: 'Montant, échéance ID et utilisateur ID requis' 
      });
    }

    const paiements = new Paiements();

    // AJOUTÉ: Vérification directe de l'existence de l'échéance dans la base
    try {
      const echeanceExiste = await paiements.queryAsync(
        'SELECT id, utilisateur_id, montant, statut FROM echeances_paiements WHERE id = ?',
        [parseInt(echeanceId)]
      );

      console.log(`🔍 [Paiements] Vérification directe échéance ${echeanceId}:`, echeanceExiste);

      if (echeanceExiste.length === 0) {
        console.error(`❌ [Paiements] Échéance ${echeanceId} n'existe pas en base de données`);
        return res.status(404).json({ 
          error: `Échéance ${echeanceId} non trouvée en base de données`,
          debug: {
            echeanceId: parseInt(echeanceId),
            searchResult: echeanceExiste
          }
        });
      }

      const echeance = echeanceExiste[0];

      // Vérifier que l'échéance appartient bien à l'utilisateur
      if (echeance.utilisateur_id !== parseInt(userId)) {
        console.error(`❌ [Paiements] Échéance ${echeanceId} n'appartient pas à l'utilisateur ${userId}`);
        return res.status(403).json({ 
          error: 'Cette échéance ne vous appartient pas',
          debug: {
            echeanceUserId: echeance.utilisateur_id,
            requestUserId: parseInt(userId)
          }
        });
      }

      if (echeance.statut === 'payé') {
        console.warn(`⚠️ [Paiements] Échéance ${echeanceId} déjà payée`);
        return res.status(400).json({ 
          error: 'Cette échéance est déjà payée',
          debug: {
            echeanceStatut: echeance.statut
          }
        });
      }

      console.log(`✅ [Paiements] Échéance ${echeanceId} validée:`, {
        id: echeance.id,
        utilisateur_id: echeance.utilisateur_id,
        montant: echeance.montant,
        statut: echeance.statut
      });

    } catch (dbError: any) {
      console.error('❌ [Paiements] Erreur vérification échéance en base:', dbError);
      return res.status(500).json({ 
        error: 'Erreur lors de la vérification de l\'échéance',
        details: dbError.message 
      });
    }

    // Continuer avec la création du PaymentIntent si l'échéance est valide
    try {
      console.log('🔧 [Paiements] Création PaymentIntent avec métadonnées complètes...');
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Montant en centimes
        currency: currency,
        description: description || `Paiement échéance #${echeanceId}`,
        metadata: {
          echeance_id: echeanceId.toString(),
          utilisateur_id: userId.toString(),
          type: 'echeance_payment',
          montant_euros: (amount / 100).toString(),
          date_creation: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('✅ [Paiements] PaymentIntent créé avec métadonnées:', {
        id: paymentIntent.id,
        metadata: paymentIntent.metadata
      });

      // Enregistrer le paiement en attente
      try {
        const paiementResult = await paiements.creerPaiement({
          utilisateur_id: parseInt(userId),
          montant: amount / 100,
          methode_paiement: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          statut: 'en_attente',
          description: description || `Paiement échéance #${echeanceId}`,
          echeance_id: parseInt(echeanceId)
        });

        console.log('💾 [Paiements] Paiement enregistré en base:', paiementResult.id);

        res.status(200).json({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          paiement_id: paiementResult.id,
          metadata: paymentIntent.metadata
        });

      } catch (dbError: any) {
        console.error('❌ [Paiements] Erreur DB lors de l\'enregistrement:', dbError.message);
        
        res.status(200).json({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          paiement_id: null,
          warning: 'PaymentIntent créé mais erreur d\'enregistrement en base',
          metadata: paymentIntent.metadata
        });
      }

    } catch (stripeError: any) {
      // Gestion spécifique des erreurs Stripe avec logs détaillés
      console.error('❌ [Paiements] Erreur Stripe détaillée:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId
      });

      if (stripeError.type === 'StripeInvalidRequestError') {
        console.error('❌ [Paiements] Erreur de configuration Stripe - Paramètres invalides');
        return res.status(400).json({ 
          error: 'Configuration de paiement invalide',
          details: stripeError.message,
          stripe_error: stripeError.code || 'invalid_request',
          suggestion: 'Vérifiez la configuration des méthodes de paiement'
        });
      } else if (stripeError.type === 'StripeAuthenticationError') {
        console.error('❌ [Paiements] Problème d\'authentification Stripe - vérifiez la clé API');
        return res.status(503).json({ 
          error: 'Service de paiement temporairement indisponible - Problème d\'authentification',
          details: 'Clé API Stripe invalide ou expirée',
          stripe_error: stripeError.code,
          fallback_available: true
        });
      } else if (stripeError.type === 'StripeConnectionError') {
        console.error('❌ [Paiements] Problème de connexion réseau avec Stripe');
        return res.status(503).json({ 
          error: 'Service de paiement temporairement indisponible - Problème de connexion',
          details: 'Impossible de joindre les serveurs Stripe',
          stripe_error: stripeError.code,
          fallback_available: true
        });
      } else {
        console.error('❌ [Paiements] Autre erreur Stripe:', stripeError);
        return res.status(500).json({ 
          error: 'Erreur du service de paiement Stripe',
          details: stripeError.message,
          stripe_error: stripeError.code || 'unknown',
          stripe_type: stripeError.type || 'unknown'
        });
      }
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur générale création PaymentIntent:', error);
    console.error('❌ [Paiements] Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erreur lors de la création du PaymentIntent',
      details: error.message 
    });
  }
});

// POST - Confirmer un paiement
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, echeanceId, userId, amount } = req.body;
    
    console.log('🎉 [Paiements] Confirmation paiement échéance:', {
      paymentIntentId,
      echeanceId,
      userId,
      amount
    });

    if (!paymentIntentId || !echeanceId || !userId) {
      return res.status(400).json({ 
        error: 'PaymentIntent ID, échéance ID et utilisateur ID requis' 
      });
    }

    const paiements = new Paiements();

    // 1. Vérifier le paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé sur Stripe' 
      });
    }

    // 2. Vérifier si c'est le premier paiement AVANT de confirmer
    const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));
    console.log(`🔍 [Paiements] Premier paiement pour utilisateur ${userId}: ${premierPaiement}`);

    // 3. Mettre à jour le statut du paiement en base
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // 4. FORCER la mise à jour de l'échéance avec l'ID reçu du frontend ET debug complet
    console.log(`🎯 [Paiements] === DÉBUT MISE À JOUR ÉCHÉANCE ===`);
    console.log(`🎯 [Paiements] Échéance ID: ${echeanceId} (type: ${typeof echeanceId})`);
    console.log(`🎯 [Paiements] Utilisateur ID: ${userId} (type: ${typeof userId})`);
    
    // Vérifier d'abord que l'échéance existe avant de la mettre à jour
    const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
    console.log(`🔍 [Paiements] Toutes les échéances de l'utilisateur ${userId}:`, echeances.map(e => ({ id: e.id, statut: e.statut, montant: e.montant })));
    
    const echeanceCible = echeances.find(e => e.id === parseInt(echeanceId));
    console.log(`🎯 [Paiements] Échéance cible trouvée:`, echeanceCible);
    
    if (!echeanceCible) {
      console.error(`❌ [Paiements] ÉCHÉANCE ${echeanceId} NON TROUVÉE dans la liste des échéances de l'utilisateur ${userId}`);
      return res.status(404).json({ 
        error: `Échéance ${echeanceId} non trouvée pour cet utilisateur`,
        debug: {
          echeanceId,
          userId,
          echeancesDisponibles: echeances.map(e => e.id)
        }
      });
    }
    
    console.log(`🎯 [Paiements] Mise à jour FORCÉE de l'échéance ${echeanceId} pour l'utilisateur ${userId}`);
    const echeanceResult = await paiements.marquerEcheancePayee(parseInt(echeanceId));
    console.log(`🎯 [Paiements] Résultat mise à jour échéance:`, echeanceResult);
    
    if (echeanceResult.isConfirm) {
      console.log(`✅ [Paiements] Échéance ${echeanceId} marquée comme payée avec succès`);
    } else {
      console.error(`❌ [Paiements] Échéance ${echeanceId} NON mise à jour: ${echeanceResult.message}`);
    }

    // 5. Vérifier après coup que la mise à jour a fonctionné
    const echeancesApres = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
    const echeanceApres = echeancesApres.find(e => e.id === parseInt(echeanceId));
    console.log(`🔍 [Paiements] État de l'échéance APRÈS mise à jour:`, echeanceApres);
    console.log(`🎯 [Paiements] === FIN MISE À JOUR ÉCHÉANCE ===`);

    // 6. Créer un enregistrement de paiement d'échéance
    const enregistrementResult = await paiements.enregistrerPaiementEcheance({
      utilisateur_id: parseInt(userId),
      montant: amount,
      methode_paiement: 'stripe',
      stripe_payment_intent_id: paymentIntentId,
      statut: 'confirme'
    });

    // 7. CORRIGÉ: Mise à jour automatique du statut utilisateur pour premier paiement avec status_id
    let statutUpgrade = null;
    if (premierPaiement) {
      try {
        console.log(`🎊 [Paiements] Premier paiement détecté - Mise à jour du statut utilisateur ${userId}`);
        
        // CORRIGÉ: Récupérer le statut actuel avec status_id et nom du statut depuis la table status
        const utilisateurActuelQuery = `
          SELECT u.id, u.status_id, u.first_name, u.last_name, s.nom_role as status_nom
          FROM utilisateurs u
          LEFT JOIN status s ON u.status_id = s.id
          WHERE u.id = ?
        `;
        const utilisateurActuel = await paiements.queryAsync(utilisateurActuelQuery, [parseInt(userId)]);
        
        if (utilisateurActuel.length > 0) {
          const statusActuel = utilisateurActuel[0];
          console.log(`📊 [Paiements] Statut actuel utilisateur ${userId}:`, {
            status_id: statusActuel.status_id,
            status_nom: statusActuel.status_nom
          });
          
          // CORRIGÉ: Récupérer l'ID du statut "utilisateur" depuis la table status
          const statutUtilisateurQuery = `SELECT id, nom_role FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
          const statutUtilisateurResult = await paiements.queryAsync(statutUtilisateurQuery, []);
          
          if (statutUtilisateurResult.length === 0) {
            console.error(`❌ [Paiements] Statut 'utilisateur' non trouvé dans la table status`);
            // Essayer avec d'autres noms possibles
            const statutAlternatifQuery = `SELECT id, nom_role FROM status WHERE nom_role IN ('membre', 'actif', 'client') ORDER BY id LIMIT 1`;
            const statutAlternatif = await paiements.queryAsync(statutAlternatifQuery, []);
            
            if (statutAlternatif.length === 0) {
              console.error(`❌ [Paiements] Aucun statut approprié trouvé dans la table status`);
              statutUpgrade = `${statusActuel.status_nom} (statut cible non trouvé)`;
            } else {
              console.log(`🔄 [Paiements] Utilisation du statut alternatif:`, statutAlternatif[0]);
            }
          } else {
            const nouveauStatutId = statutUtilisateurResult[0].id;
            const nouveauStatutNom = statutUtilisateurResult[0].nom_role;
            
            console.log(`🎯 [Paiements] Statut cible trouvé:`, {
              id: nouveauStatutId,
              nom_role: nouveauStatutNom
            });
            
            // Mettre à jour seulement si le statut actuel est différent
            if (statusActuel.status_id !== nouveauStatutId) {
              const updateStatutQuery = `
                UPDATE utilisateurs 
                SET status_id = ?, 
                    date_modification = NOW() 
                WHERE id = ?
              `;
              
              const updateResult = await paiements.queryAsync(updateStatutQuery, [nouveauStatutId, parseInt(userId)]);
              
              if (updateResult.affectedRows > 0) {
                console.log(`✅ [Paiements] Utilisateur ${userId} - status_id mis à jour de ${statusActuel.status_id} vers ${nouveauStatutId}`);
                statutUpgrade = `${statusActuel.status_nom} → ${nouveauStatutNom}`;
                
                // CORRIGÉ: Utiliser le client Utilisateurs avec la bonne structure
                try {
                  const utilisateursModule = await import('../../db/clients/utilisateurs/utilisateurs.js');
                  const utilisateursClient = new utilisateursModule.Utilisateurs();
                  
                  // CORRIGÉ: Utiliser status_id au lieu de status
                  const utilisateurComplet = {
                    ...utilisateurActuel[0],
                    status_id: nouveauStatutId
                  };
                  
                  const statutResult = await utilisateursClient.mettreAjourUtilisateur(utilisateurComplet);
                  
                  if (statutResult.isConfirm) {
                    console.log(`✅ [Paiements] Statut utilisateur ${userId} mis à jour via client Utilisateurs`);
                  } else {
                    console.warn(`⚠️ [Paiements] Échec mise à jour statut via client Utilisateurs: ${statutResult.message}`);
                  }
                } catch (clientError: any) {
                  console.error(`❌ [Paiements] Erreur client Utilisateurs:`, clientError.message);
                }
                
              } else {
                console.warn(`⚠️ [Paiements] Aucune ligne affectée lors de la mise à jour du statut pour l'utilisateur ${userId}`);
              }
            } else {
              console.log(`ℹ️ [Paiements] Utilisateur ${userId} a déjà le bon statut (${statusActuel.status_nom}) - pas de mise à jour nécessaire`);
              statutUpgrade = `${statusActuel.status_nom} (inchangé)`;
            }
          }
        } else {
          console.error(`❌ [Paiements] Utilisateur ${userId} non trouvé pour mise à jour statut`);
        }
        
      } catch (statutError: any) {
        console.error(`❌ [Paiements] Erreur lors de la mise à jour du statut:`, statutError.message);
        // Ne pas faire échouer le paiement pour un problème de statut
      }
    }

    // 8. CORRIGÉ: Récupérer les données utilisateur pour l'email avec le bon statut
    console.log('📧 [Paiements] Préparation envoi email de confirmation...');
    
    const utilisateurQuery = `
      SELECT u.first_name, u.last_name, u.email, u.nom_utilisateur, u.status_id, s.nom_role as status_nom
      FROM utilisateurs u 
      LEFT JOIN status s ON u.status_id = s.id
      WHERE u.id = ?
    `;
    
    const utilisateurResults = await paiements.queryAsync(utilisateurQuery, [parseInt(userId)]);
    
    if (utilisateurResults.length === 0) {
      console.warn(`⚠️ [Paiements] Utilisateur ${userId} non trouvé pour l'email`);
    } else {
      const utilisateur = utilisateurResults[0];
      console.log(`📧 [Paiements] Données utilisateur pour email:`, {
        nom: utilisateur.first_name,
        prenom: utilisateur.last_name,
        email: utilisateur.email,
        status_id: utilisateur.status_id,
        statut_actuel: utilisateur.status_nom
      });

      // 9. CORRIGÉ: Utiliser EmailClient avec les variables correctes
      try {
        const { emailClient } = await import('../../clients/emailClient.js');

        console.log('📤 [Paiements] Envoi email de confirmation avec EmailClient...');
        
        const emailVariables = {
          userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
          amount: new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR' 
          }).format(amount),
          paymentDate: new Date().toLocaleDateString('fr-FR'),
          // AJOUTÉ: Variables manquantes dans le template
          currency: 'EUR',
          datePaiement: new Date().toLocaleDateString('fr-FR'),
          paymentIntentId: paymentIntentId,
          echeanceId: echeanceId.toString(),
          premierPaiement: premierPaiement
        };

        // CORRIGÉ: Variables enrichies pour template
        const templateVariables = premierPaiement ? {
          ...emailVariables,
          statusUpgrade: statutUpgrade || 'visiteur → utilisateur',
          newStatus: 'utilisateur',
          oldStatus: 'visiteur',
          welcomeMessage: 'Bienvenue dans notre club !',
          transactionId: paymentIntentId,
          isFirstPayment: true,
          // Variables spécifiques pour premier paiement
          premierPaiement: true,
          statutAncien: 'visiteur',
          statutNouveau: 'utilisateur'
        } : {
          ...emailVariables,
          transactionId: paymentIntentId,
          isFirstPayment: false,
          premierPaiement: false
        };
        
        // CORRIGÉ: Utiliser template existant 'confirmation-paiement'
        const emailResult = await emailClient.sendPaymentConfirmation(
          utilisateur.email,
          templateVariables,
          parseInt(userId),
          'confirmation-paiement' // Template existant
        );

        if (emailResult.success) {
          console.log('✅ [Paiements] Email de confirmation envoyé avec EmailClient:', {
            email: utilisateur.email,
            premier_paiement: premierPaiement,
            statut_upgrade: statutUpgrade,
            messageId: emailResult.messageId
          });
        } else {
          console.error('❌ [Paiements] Échec envoi email avec EmailClient:', emailResult.error);
          
          try {
            console.log('🔄 [Paiements] Tentative envoi email simple en fallback...');
            
            const fallbackResult = await emailClient.sendTestEmail(
              utilisateur.email,
              'confirmation-paiement' // Template existant
            );

            console.log('📧 [Paiements] Résultat envoi fallback:', fallbackResult);
          } catch (fallbackError: any) {
            console.error('❌ [Paiements] Erreur envoi email fallback:', fallbackError.message);
          }
        }

      } catch (emailError: any) {
        console.error('❌ [Paiements] Erreur lors de l\'envoi de l\'email:', emailError.message);
      }
    }

    console.log('✅ [Paiements] Processus de confirmation terminé pour échéance:', echeanceId);

    // 10. Message de succès adapté selon le statut
    let successMessage = 'Paiement confirmé et échéance mise à jour';
    if (premierPaiement) {
      successMessage += `. 🎉 Félicitations pour votre premier paiement !`;
      if (statutUpgrade) {
        successMessage += ` Votre statut a été automatiquement mis à jour : ${statutUpgrade}.`;
      }
    }
    successMessage += ' 📧 Un email de confirmation vous a été envoyé.';

    res.status(200).json({
      success: true,
      message: successMessage,
      echeance_id: echeanceId,
      payment_intent_id: paymentIntentId,
      premier_paiement: premierPaiement,
      statut_upgrade: statutUpgrade, // NOUVEAU: Retourner les infos de changement de statut
      echeance_mise_a_jour: echeanceResult.isConfirm,
      enregistrement_confirme: enregistrementResult.isConfirm,
      email_envoye: utilisateurResults.length > 0,
      debug: {
        echeanceAvant: echeanceCible,
        echeanceApres: echeanceApres,
        updateResult: echeanceResult
      }
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message 
    });
  }
});

// POST - Paiement Bancontact via Stripe
router.post('/bancontact', async (req, res) => {
  const { amount, currency = 'eur', commande, utilisateur_id } = req.body;
  
  console.log('Données reçues pour paiement Bancontact:', req.body);
  
  // Extraire l'utilisateur_id en priorité depuis la commande, puis depuis les données directes
  const finalUserId = commande?.utilisateur_id || utilisateur_id;
  
  console.log('utilisateur_id extrait:', finalUserId);
  
  if (!finalUserId) {
    return res.status(400).json({ 
      error: 'utilisateur_id manquant. Veuillez vous reconnecter.' 
    });
  }

  // AJOUTÉ: Validation du montant pour Bancontact
  const montantEuros = parseFloat((amount / 100).toFixed(2));
  console.log('💰 [Paiements] Montant Bancontact validé:', {
    amount_centimes: amount,
    montant_euros: montantEuros
  });

  if (isNaN(montantEuros) || montantEuros <= 0) {
    return res.status(400).json({ 
      error: 'Montant invalide',
      debug: { amount, montantEuros }
    });
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['bancontact'],
      metadata: {
        utilisateur_id: finalUserId.toString(),
        commande_data: JSON.stringify(commande)
      }
    });

    console.log('PaymentIntent créé:', paymentIntent.id);

    const paiements = new Paiements();
    const magasin = new Magasin();
    
    // CORRIGÉ: Calculer le total et passer tous les paramètres requis
    const total = commande.total || montantEuros;
    const date = new Date().toISOString();
    
    // 1. Créer la commande en base de données via la classe Magasin
    const commandeResult = await magasin.creerCommande(
      finalUserId, 
      commande.articles, 
      total, 
      date, 
      'en_attente'
    );
    
    // Vérifier si la commande a été créée avec succès
    if (!commandeResult.isConfirm) {
      throw new Error(`Erreur création commande: ${commandeResult.message}`);
    }
    
    // CORRIGÉ: Récupérer l'ID de la commande créée via une requête adaptée
    let commandeId = null;
    try {
      // CORRIGÉ: Adapter la requête pour gérer les statuts vides/NULL
      const commandeQuery = `
        SELECT id, statut FROM commandes 
        WHERE utilisateur_id = ? AND (statut = 'en attente' OR statut = '' OR statut IS NULL)
        ORDER BY date_commande DESC 
        LIMIT 1
      `;
      const commandeResults = await paiements.queryAsync(commandeQuery, [finalUserId]);
      
      if (commandeResults.length > 0) {
        commandeId = commandeResults[0].id;
        console.log('📦 [Paiements] ID commande récupéré via requête adaptée:', commandeId);
        console.log('📊 [Paiements] Statut de la commande:', `"${commandeResults[0].statut}"`);
        
        // AJOUTÉ: Corriger automatiquement le statut vide
        if (!commandeResults[0].statut || commandeResults[0].statut === '') {
          try {
            console.log('🔧 [Paiements] Correction automatique du statut vide vers "en attente"...');
            const updateStatutQuery = `
              UPDATE commandes 
              SET statut = 'en attente' 
              WHERE id = ?
            `;
            await paiements.queryAsync(updateStatutQuery, [commandeId]);
            console.log('✅ [Paiements] Statut commande corrigé automatiquement vers "en attente"');
          } catch (updateError: any) {
            console.warn('⚠️ [Paiements] Impossible de corriger automatiquement le statut:', updateError.message);
          }
        }
      } else {
        throw new Error('Impossible de récupérer l\'ID de la commande créée');
      }
    } catch (queryError: any) {
      console.error('❌ [Paiements] Erreur récupération ID commande:', queryError.message);
      
      // FALLBACK: Rechercher sans filtre de statut
      try {
        console.log('🔄 [Paiements] Tentative fallback - recherche sans filtre de statut...');
        const fallbackQuery = `
          SELECT id, statut FROM commandes 
          WHERE utilisateur_id = ? 
          ORDER BY date_commande DESC 
          LIMIT 1
        `;
        const fallbackResults = await paiements.queryAsync(fallbackQuery, [finalUserId]);
        
        if (fallbackResults.length > 0) {
          commandeId = fallbackResults[0].id;
          console.log('✅ [Paiements] ID commande récupéré via fallback:', commandeId);
          console.log('📊 [Paiements] Statut de la commande récupérée:', `"${fallbackResults[0].statut}"`);
          
          // AJOUTÉ: Corriger le statut vide si nécessaire
          if (!fallbackResults[0].statut || fallbackResults[0].statut === '') {
            try {
              console.log('🔧 [Paiements] Correction du statut vide vers "en attente"...');
              const updateStatutQuery = `
                UPDATE commandes 
                SET statut = 'en attente' 
                WHERE id = ?
              `;
              await paiements.queryAsync(updateStatutQuery, [commandeId]);
              console.log('✅ [Paiements] Statut commande corrigé vers "en attente"');
            } catch (updateError: any) {
              console.warn('⚠️ [Paiements] Impossible de corriger le statut:', updateError.message);
            }
          }
        } else {
          throw new Error('Aucune commande trouvée même sans filtre de statut');
        }
      } catch (fallbackError: any) {
        console.error('❌ [Paiements] Erreur fallback récupération ID:', fallbackError.message);
        throw new Error('Erreur lors de la récupération de l\'ID de commande');
      }
    }

    // 2. CORRIGÉ: Enregistrer le paiement avec l'ID de commande réel et montant valide
    const paiementResult = await paiements.creerPaiement({
      commande_id: commandeId,
      utilisateur_id: finalUserId,
      montant: montantEuros, // CORRIGÉ: Utiliser montantEuros validé
      methode_paiement: 'bancontact',
      stripe_payment_intent_id: paymentIntent.id,
      statut: 'en_attente'
    });

    console.log('Commande et paiement créés:', { 
      commandeId, 
      paiementId: paiementResult.id
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      commandeId: commandeId
    });
  } catch (error) {
    console.error('Erreur Bancontact:', error);
    res.status(500).json({ error: error || 'Erreur lors du paiement Bancontact' });
  }
});

// POST - Paiement PayPal
router.post('/paypal', async (req, res) => {
  const { totalAmount, userId, commande } = req.body;
  
  try {
    // Ici vous intégreriez l'API PayPal
    // Pour l'exemple, on simule une URL de redirection
    const paypalOrderId = `PAYPAL_${Date.now()}`;
    
    // Enregistrer le paiement en base - CORRIGÉ
    const paiements = new Paiements();
    const result = await paiements.creerPaiement({
      commande_id: commande?.id,
      utilisateur_id: userId,
      montant: totalAmount / 100,
      methode_paiement: 'paypal',
      paypal_order_id: paypalOrderId,
      statut: 'en_attente'
    });

    res.status(200).json({
      url: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`,
      orderId: paypalOrderId
    });
  } catch (error) {
    console.error('Erreur PayPal:', error);
    res.status(500).json({ error: 'Erreur lors du paiement PayPal' });
  }
});

// POST - Paiement Bitcoin
router.post('/bitcoin', async (req, res) => {
  const { sats, commande } = req.body;
  
  try {
    // Ici vous intégreriez une API Bitcoin (Lightning Network, etc.)
    const bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Exemple
    const amountBTC = sats * 100000000; // Conversion sats vers BTC
    
    // Enregistrer le paiement en base - CORRIGÉ
    const paiements = new Paiements();
    const result = await paiements.creerPaiement({
      commande_id: commande?.id,
      montant: amountBTC,
      methode_paiement: 'bitcoin',
      bitcoin_address: bitcoinAddress,
      statut: 'en_attente'
    });

    res.status(200).json({
      bitcoinAddress,
      amount: amountBTC,
      qrCode: `bitcoin:${bitcoinAddress}?amount=${amountBTC}`,
      paiementId: result.id // CORRECTION: Accès direct à id au lieu de data?.id
    });
  } catch (error) {
    console.error('Erreur Bitcoin:', error);
    res.status(500).json({ error: 'Erreur lors du paiement Bitcoin' });
  }
});

// POST - Créer un PaymentIntent pour commande magasin
router.post('/create-payment-intent-commande', async (req, res) => {
  try {
    const { amount, currency = 'eur', commande, description } = req.body;
    
    console.log('🛒 [Paiements] Création PaymentIntent pour commande magasin:', { 
      amount, 
      currency, 
      commande: commande?.utilisateur_id,
      articlesCount: commande?.articles?.length,
      description 
    });

    if (!amount || !commande || !commande.utilisateur_id) {
      return res.status(400).json({ 
        error: 'Montant, commande et utilisateur ID requis' 
      });
    }

    // AJOUTÉ: Validation et debug du montant
    const montantEuros = parseFloat((amount / 100).toFixed(2));
    console.log('💰 [Paiements] Montant validé:', {
      amount_centimes: amount,
      montant_euros: montantEuros,
      type_amount: typeof amount,
      type_montant: typeof montantEuros
    });

    if (isNaN(montantEuros) || montantEuros <= 0) {
      return res.status(400).json({ 
        error: 'Montant invalide',
        debug: { amount, montantEuros }
      });
    }

    // Créer le PaymentIntent pour la commande magasin
    try {
      console.log('🔧 [Paiements] Création PaymentIntent pour commande magasin...');
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Montant en centimes
        currency: currency,
        description: description || `Commande magasin - ${commande.articles.length} article(s)`,
        metadata: {
          commande_id: 'temp', // Sera mis à jour après création
          utilisateur_id: commande.utilisateur_id.toString(),
          type: 'commande_magasin',
          montant_euros: montantEuros.toString(),
          articles_count: commande.articles.length.toString(),
          date_creation: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('✅ [Paiements] PaymentIntent créé pour commande magasin:', {
        id: paymentIntent.id,
        metadata: paymentIntent.metadata
      });

      // Enregistrer la commande et le paiement en base
      try {
        const paiements = new Paiements();
        const magasin = new Magasin();
        
        // CORRIGÉ: Calculer le total et passer tous les paramètres requis
        const total = commande.total || montantEuros;
        const date = new Date().toISOString();
        
        console.log('📊 [Paiements] Données commande calculées:', {
          total,
          montantEuros,
          utilisateur_id: commande.utilisateur_id,
          nombre_articles: commande.articles.length
        });
        
        // 1. Créer la commande en base via la classe Magasin
        const commandeResult = await magasin.creerCommande(
          commande.utilisateur_id, 
          commande.articles, 
          total, 
          date, 
          'en_attente'
        );
        
        if (!commandeResult.isConfirm) {
          throw new Error(`Erreur création commande: ${commandeResult.message}`);
        }
        
        // CORRIGÉ: Récupérer l'ID de la commande créée via une requête adaptée
        let commandeId = null;
        try {
          // CORRIGÉ: Adapter la requête pour gérer les statuts vides/NULL
          const commandeQuery = `
            SELECT id, statut FROM commandes 
            WHERE utilisateur_id = ? AND (statut = 'en attente' OR statut = '' OR statut IS NULL)
            ORDER BY date_commande DESC 
            LIMIT 1
          `;
          const commandeResults = await paiements.queryAsync(commandeQuery, [commande.utilisateur_id]);
          
          if (commandeResults.length > 0) {
            commandeId = commandeResults[0].id;
            console.log('📦 [Paiements] ID commande récupéré via requête adaptée:', commandeId);
            console.log('📊 [Paiements] Statut de la commande:', `"${commandeResults[0].statut}"`);
            
            // AJOUTÉ: Corriger automatiquement le statut vide
            if (!commandeResults[0].statut || commandeResults[0].statut === '') {
              try {
                console.log('🔧 [Paiements] Correction automatique du statut vide vers "en attente"...');
                const updateStatutQuery = `
                  UPDATE commandes 
                  SET statut = 'en attente' 
                  WHERE id = ?
                `;
                await paiements.queryAsync(updateStatutQuery, [commandeId]);
                console.log('✅ [Paiements] Statut commande corrigé automatiquement vers "en attente"');
              } catch (updateError: any) {
                console.warn('⚠️ [Paiements] Impossible de corriger automatiquement le statut:', updateError.message);
              }
            }
          } else {
            throw new Error('Impossible de récupérer l\'ID de la commande créée');
          }
        } catch (queryError: any) {
          console.error('❌ [Paiements] Erreur récupération ID commande:', queryError.message);
          
          // FALLBACK: Rechercher sans filtre de statut
          try {
            console.log('🔄 [Paiements] Tentative fallback - recherche sans filtre de statut...');
            const fallbackQuery = `
              SELECT id, statut FROM commandes 
              WHERE utilisateur_id = ? 
              ORDER BY date_commande DESC 
              LIMIT 1
            `;
            const fallbackResults = await paiements.queryAsync(fallbackQuery, [commande.utilisateur_id]);
            
            if (fallbackResults.length > 0) {
              commandeId = fallbackResults[0].id;
              console.log('✅ [Paiements] ID commande récupéré via fallback:', commandeId);
              console.log('📊 [Paiements] Statut de la commande récupérée:', `"${fallbackResults[0].statut}"`);
              
              // AJOUTÉ: Corriger le statut vide si nécessaire
              if (!fallbackResults[0].statut || fallbackResults[0].statut === '') {
                try {
                  console.log('🔧 [Paiements] Correction du statut vide vers "en attente"...');
                  const updateStatutQuery = `
                    UPDATE commandes 
                    SET statut = 'en attente' 
                    WHERE id = ?
                  `;
                  await paiements.queryAsync(updateStatutQuery, [commandeId]);
                  console.log('✅ [Paiements] Statut commande corrigé vers "en attente"');
                } catch (updateError: any) {
                  console.warn('⚠️ [Paiements] Impossible de corriger le statut:', updateError.message);
                }
              }
            } else {
              throw new Error('Aucune commande trouvée même sans filtre de statut');
            }
          } catch (fallbackError: any) {
            console.error('❌ [Paiements] Erreur fallback récupération ID:', fallbackError.message);
            throw new Error('Erreur lors de la récupération de l\'ID de commande (méthodes normale et fallback échouées)');
          }
        }
        
        // 2. Mettre à jour les métadonnées du PaymentIntent avec l'ID de commande réel
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            ...paymentIntent.metadata,
            commande_id: commandeId?.toString() || 'unknown'
          }
        });

        // 3. CORRIGÉ: Enregistrer le paiement en attente avec montant valide
        console.log('💾 [Paiements] Création paiement avec données:', {
          commande_id: commandeId,
          utilisateur_id: commande.utilisateur_id,
          montant: montantEuros,
          methode_paiement: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          statut: 'en_attente'
        });

        const paiementResult = await paiements.creerPaiement({
          commande_id: commandeId,
          utilisateur_id: commande.utilisateur_id,
          montant: montantEuros, // CORRIGÉ: Utiliser montantEuros validé
          methode_paiement: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          statut: 'en_attente',
          description: description || `Commande magasin #${commandeId}`
        });

        console.log('💾 [Paiements] Paiement commande enregistré en base:', paiementResult.id);

        res.status(200).json({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          commande_id: commandeId,
          paiement_id: paiementResult.id,
          metadata: paymentIntent.metadata
        });

      } catch (dbError: any) {
        console.error('❌ [Paiements] Erreur DB lors de l\'enregistrement commande:', dbError.message);
        
        res.status(200).json({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          commande_id: null,
          paiement_id: null,
          warning: 'PaymentIntent créé mais erreur d\'enregistrement en base',
          metadata: paymentIntent.metadata
        });
      }

    } catch (stripeError: any) {
      console.error('❌ [Paiements] Erreur Stripe pour commande:', stripeError);
      return res.status(500).json({ 
        error: 'Erreur du service de paiement Stripe pour commande',
        details: stripeError.message,
        stripe_error: stripeError.code || 'unknown'
      });
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur générale création PaymentIntent commande:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du PaymentIntent pour commande',
      details: error.message 
    });
  }
});

// POST - Confirmer un paiement de commande magasin
router.post('/confirm-payment-commande', async (req, res) => {
  try {
    const { paymentIntentId, commandeId, userId } = req.body;
    
    console.log('🎉 [Paiements] Confirmation paiement commande magasin:', {
      paymentIntentId,
      commandeId,
      userId
    });

    if (!paymentIntentId || !userId) {
      return res.status(400).json({ 
        error: 'PaymentIntent ID et utilisateur ID requis' 
      });
    }

    const paiements = new Paiements();

    // 1. Vérifier le paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé sur Stripe' 
      });
    }

    // 2. Mettre à jour le statut du paiement en base
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // 3. Mettre à jour le statut de la commande via requête SQL directe
    if (commandeId) {
      try {
        // CORRIGÉ: Utiliser le bon statut 'payée' (avec accent)
        const updateCommandeQuery = `
          UPDATE commandes 
          SET statut = 'payée'
          WHERE id = ?
        `;
        
        const updateResult = await paiements.queryAsync(updateCommandeQuery, [commandeId]);
        
        if (updateResult.affectedRows > 0) {
          console.log(`✅ [Paiements] Commande ${commandeId} marquée comme payée (${updateResult.affectedRows} ligne(s) affectée(s))`);
        } else {
          console.warn(`⚠️ [Paiements] Aucune ligne affectée pour la commande ${commandeId} - vérifiez que l'ID existe`);
        }
      } catch (statutError: any) {
        console.error(`⚠️ [Paiements] Erreur mise à jour statut commande ${commandeId}:`, statutError.message);
        // Ne pas faire échouer le processus pour un problème de statut
      }
    }

    // 4. CORRIGÉ: Envoyer email de confirmation commande avec détails complets
    try {
      const { emailClient } = await import('../../clients/emailClient.js');
      
      // Récupérer les données utilisateur et commande
      const utilisateurQuery = `
        SELECT u.first_name, u.last_name, u.email
        FROM utilisateurs u 
        WHERE u.id = ?
      `;
      
      const utilisateurResults = await paiements.queryAsync(utilisateurQuery, [parseInt(userId)]);
      
      if (utilisateurResults.length > 0) {
        const utilisateur = utilisateurResults[0];
        
        // AJOUTÉ: Récupérer les détails de la commande avec la bonne structure
        let commandeDetails = null;
        let totalCommande = 0;
        
        if (commandeId) {
          try {
            // CORRIGÉ: Adapter la requête selon la vraie structure de la DB
            const commandeQuery = `
              SELECT 
                c.id,
                c.utilisateur_id,
                c.date_commande,
                c.statut,
                ca.article_id,
                ca.quantite,
                ca.prix,
                t.nom as taille_nom,
                a.nom as article_nom
              FROM commandes c
              LEFT JOIN commande_articles ca ON c.id = ca.commande_id
              LEFT JOIN articles a ON ca.article_id = a.id
              LEFT JOIN tailles t ON ca.taille_id = t.id
              WHERE c.id = ?
            `;
            
            const commandeResults = await paiements.queryAsync(commandeQuery, [commandeId]);
            
            if (commandeResults.length > 0) {
              const commande = commandeResults[0];
              
              // Calculer le total à partir des articles
              totalCommande = commandeResults
                .filter((row: any) => row.article_id) // Exclure les lignes sans articles
                .reduce((total: number, row: any) => total + (row.prix * row.quantite), 0);
              
              // Organiser les articles de la commande
              const articles = commandeResults
                .filter((row: any) => row.article_id) // Exclure les lignes sans articles
                .map((row: any) => ({
                  nom: row.article_nom,
                  quantite: row.quantite,
                  prix: row.prix,
                  taille: row.taille_nom,
                  sousTotal: (row.prix * row.quantite).toFixed(2)
                }));
              
              commandeDetails = {
                id: commande.id,
                statut: commande.statut,
                total: totalCommande,
                articles: articles,
                dateCommande: new Date(commande.date_commande).toLocaleDateString('fr-FR')
              };
              
              console.log(`📦 [Paiements] Détails commande récupérés:`, commandeDetails);
            }
          } catch (commandeError: any) {
            console.error(`❌ [Paiements] Erreur récupération détails commande ${commandeId}:`, commandeError.message);
          }
        }
        
        // AJOUTÉ: Générer le HTML des articles pour l'email
        let articlesDetailsHtml = '';
        if (commandeDetails?.articles && commandeDetails.articles.length > 0) {
          articlesDetailsHtml = commandeDetails.articles.map((article: any) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; background-color: #f9f9f9; margin-bottom: 8px; border-radius: 4px;">
              <div style="flex: 1;">
                <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${article.nom}</div>
                <div style="font-size: 14px; color: #666;">
                  Taille: ${article.taille || 'N/A'} | Quantité: ${article.quantite} | Prix unitaire: ${article.prix.toFixed(2)} €
                </div>
              </div>
              <div style="text-align: right; font-weight: bold; color: #007bff;">
                ${article.sousTotal} €
              </div>
            </div>
          `).join('');
        } else {
          articlesDetailsHtml = '<div style="text-align: center; color: #666; font-style: italic; padding: 20px;">Aucun détail d\'article disponible</div>';
        }

        console.log('🔍 [Paiements] HTML articles généré:', articlesDetailsHtml); // AJOUTÉ: Debug

        // MODIFIÉ: Utiliser sendOrderConfirmation avec articlesDetails
        const emailResult = await emailClient.sendOrderConfirmation(
          utilisateur.email,
          {
            userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
            numeroCommande: commandeId?.toString() || 'N/A',
            uniqueId: paymentIntentId,
            dateCommande: new Date().toLocaleDateString('fr-FR'),
            statutCommande: 'Confirmée et payée',
            nbArticles: (commandeDetails?.articles?.length || 0).toString(),
            totalCommande: totalCommande.toFixed(2),
            articlesDetails: articlesDetailsHtml, // CORRIGÉ: S'assurer que cette variable est bien passée
            // Variables optionnelles avec valeurs par défaut
            delaiPreparation: '24-48 heures',
            lieuRetrait: 'Accueil du club',
            horaires: 'Lundi-Vendredi: 9h-18h, Samedi: 9h-12h',
            conservation: 'Votre commande sera conservée 7 jours',
            emailContact: process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
            telephoneContact: process.env.CLUB_PHONE || '01 23 45 67 89',
            anneeActuelle: new Date().getFullYear().toString()
          },
          parseInt(userId)
        );

        if (emailResult.success) {
          console.log('📧 [Paiements] Email de confirmation commande envoyé avec le bon template');
        } else {
          console.error('❌ [Paiements] Échec envoi email commande:', emailResult.error);
        }
      }
    } catch (emailError: any) {
      console.error('❌ [Paiements] Erreur envoi email commande:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Commande payée avec succès',
      commande_id: commandeId,
      payment_intent_id: paymentIntentId
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement commande:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement de commande',
      details: error.message 
    });
  }
});

export { router as stripeRoutes };