import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Paiements } from '../../db/clients/paiements/paiements.js';

// Configuration Stripe pour les tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const router = express.Router();

// GET - Route de test simple
router.get('/', (req, res) => {
  res.json({ 
    message: 'Route de test fonctionne', 
    timestamp: new Date().toISOString() 
  });
});

// POST - Confirmer paiement de test
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

      // 9. CORRIGÉ: Utiliser EmailClient avec template existant
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
          // AJOUTÉ: Variables manquantes
          currency: 'EUR',
          datePaiement: new Date().toLocaleDateString('fr-FR'),
          paymentIntentId: paymentIntentId,
          echeanceId: echeanceId.toString(),
          premierPaiement: premierPaiement
        };

        // CORRIGÉ: Variables complètes pour template
        const templateVariables = premierPaiement ? {
          ...emailVariables,
          statusUpgrade: statutUpgrade || 'visiteur → utilisateur',
          newStatus: 'utilisateur',
          oldStatus: 'visiteur',
          welcomeMessage: 'Bienvenue dans notre club !',
          transactionId: paymentIntentId,
          isFirstPayment: true,
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

// POST - Forcer succès d'un paiement
router.post('/force-payment-success', async (req, res) => {
  try {
    const { paymentIntentId, echeanceId, userId } = req.body;
    
    console.log(`🔧 [Test] Simulation paiement réussi:`, {
      paymentIntentId,
      echeanceId,
      userId
    });
    
    if (!paymentIntentId || !echeanceId || !userId) {
      return res.status(400).json({ 
        error: 'paymentIntentId, echeanceId et userId requis' 
      });
    }

    const paiements = new Paiements();
    
    // 1. Confirmer le paiement en base
    const confirmationResult = await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');
    console.log(`✅ [Test] Paiement confirmé:`, confirmationResult);
    
    // 2. Marquer l'échéance comme payée
    const echeanceResult = await paiements.marquerEcheancePayee(parseInt(echeanceId));
    console.log(`✅ [Test] Échéance mise à jour:`, echeanceResult);
    
    // 3. Vérifier si c'est le premier paiement
    const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));
    console.log(`🔍 [Test] Premier paiement:`, premierPaiement);
    
    // 4. CORRIGÉ: Mise à jour du statut pour la simulation avec status_id et table status
    let statutUpgrade = null;
    if (premierPaiement) {
      try {
        // CORRIGÉ: Récupérer l'ID du statut "utilisateur" depuis la table status
        const statutUtilisateurQuery = `SELECT id, nom_role FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
        const statutUtilisateurResult = await paiements.queryAsync(statutUtilisateurQuery, []);
        
        if (statutUtilisateurResult.length > 0) {
          const nouveauStatutId = statutUtilisateurResult[0].id;
          
          const updateStatutQuery = `
            UPDATE utilisateurs 
            SET status_id = ?, 
                date_modification = NOW() 
            WHERE id = ? AND status_id != ?
          `;
          
          const updateResult = await paiements.queryAsync(updateStatutQuery, [
            nouveauStatutId, 
            parseInt(userId), 
            nouveauStatutId
          ]);
          
          if (updateResult.affectedRows > 0) {
            console.log(`✅ [Test] Utilisateur ${userId} - status_id mis à jour vers ${nouveauStatutId} (simulation)`);
            statutUpgrade = 'visiteur → utilisateur';
          }
        }
      } catch (statutError: any) {
        console.error(`❌ [Test] Erreur mise à jour statut:`, statutError.message);
      }
    }
    
    // 5. Enregistrer l'historique
    const historiqueResult = await paiements.enregistrerPaiementEcheance({
      utilisateur_id: parseInt(userId),
      montant: 150.21,
      methode_paiement: 'stripe_test',
      stripe_payment_intent_id: paymentIntentId,
      statut: 'confirme'
    });
    console.log(`📝 [Test] Historique créé:`, historiqueResult);

    // 6. CORRIGÉ: Email avec template existant
    try {
      const utilisateurQuery = `
        SELECT u.first_name, u.last_name, u.email, u.nom_utilisateur, u.status_id, s.nom_role as status_nom
        FROM utilisateurs u 
        LEFT JOIN status s ON u.status_id = s.id
        WHERE u.id = ?
      `;
      
      const utilisateurResults = await paiements.queryAsync(utilisateurQuery, [parseInt(userId)]);
      
      if (utilisateurResults.length > 0) {
        const utilisateur = utilisateurResults[0];
        console.log(`📧 [Test] Envoi email de simulation à:`, {
          email: utilisateur.email,
          status_id: utilisateur.status_id,
          status_nom: utilisateur.status_nom
        });

        const { emailClient } = await import('../../clients/emailClient.js');

        const baseEmailVariables = {
          userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
          amount: '150,21 €',
          paymentDate: new Date().toLocaleDateString('fr-FR'),
          // AJOUTÉ: Variables manquantes
          currency: 'EUR',
          datePaiement: new Date().toLocaleDateString('fr-FR'),
          paymentIntentId: paymentIntentId,
          echeanceId: echeanceId.toString(),
          premierPaiement: premierPaiement
        };

        // CORRIGÉ: Variables enrichies pour template
        const templateVariables = premierPaiement ? {
          ...baseEmailVariables,
          statusUpgrade: 'visiteur → utilisateur',
          newStatus: 'utilisateur',
          oldStatus: 'visiteur',
          welcomeMessage: 'Bienvenue dans notre club ! (Mode Test)',
          transactionId: paymentIntentId,
          testMode: 'true',
          isFirstPayment: true,
          premierPaiement: true,
          statutAncien: 'visiteur',
          statutNouveau: 'utilisateur'
        } : {
          ...baseEmailVariables,
          transactionId: paymentIntentId,
          testMode: 'true',
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
          console.log('📧 [Test] Email de simulation envoyé avec succès:', emailResult);
        } else {
          console.error('❌ [Test] Échec envoi email:', emailResult.error);
        }
      }
    } catch (emailError: any) {
      console.error('❌ [Test] Erreur email simulation:', emailError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Paiement forcé avec succès (mode test)',
      results: {
        confirmation: confirmationResult,
        echeance: echeanceResult,
        premier_paiement: premierPaiement,
        statut_upgrade: statutUpgrade, // NOUVEAU: Retourner les infos de changement
        historique: historiqueResult,
        email_envoye: true
      }
    });
    
  } catch (error: any) {
    console.error('❌ [Test] Erreur simulation paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la simulation du paiement',
      details: error.message 
    });
  }
});

export { router as testRoutes };