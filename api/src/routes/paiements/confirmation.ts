import express from 'express';
import { Paiements } from '../../db/clients/paiements/paiements.js';
import { EmailClient } from '../../clients/emailClient.js';

const router = express.Router();

// Fonction utilitaire pour formater les montants
function formatMontant(montant: number): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant);
  } catch (e) {
    return `${montant} €`;
  }
}

// Route pour confirmer un paiement d'échéance
router.post('/confirm-payment', async (req: any, res: any) => {
  try {
    const { paymentIntentId, echeanceId, userId, amount } = req.body;
    
    console.log('💳 [Paiements] Confirmation paiement échéance:', {
      paymentIntentId,
      echeanceId,
      userId,
      amount
    });

    if (!paymentIntentId || !echeanceId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement'
      });
    }

    const paiements = new Paiements();
    
    // 1. Vérifier que l'échéance existe et appartient à l'utilisateur
    const echeanceQuery = `
      SELECT ep.*, pt.nom_plan, pt.periode 
      FROM echeances_paiements ep
      JOIN plans_tarifaires pt ON ep.abonnement_id = pt.id
      WHERE ep.id = ? AND ep.utilisateur_id = ?
    `;
    const echeanceResults = await paiements.queryAsync(echeanceQuery, [echeanceId, userId]);
    
    if (echeanceResults.length === 0) {
      return res.status(404).json({
        error: 'Échéance non trouvée'
      });
    }
    
    const echeance = echeanceResults[0];
    
    // AJOUTÉ: Vérifier le statut actuel de l'utilisateur pour promotion éventuelle
    const userStatusQuery = `
      SELECT u.status_id, s.nom_role,
        (SELECT COUNT(*) FROM paiements WHERE utilisateur_id = ? AND statut = 'validé') as paiements_count
      FROM utilisateurs u
      JOIN status s ON u.status_id = s.id
      WHERE u.id = ?
    `;
    const userStatusResults = await paiements.queryAsync(userStatusQuery, [userId, userId]);
    
    const userStatus = userStatusResults[0];
    const isFirstPayment = userStatus?.paiements_count === 0;
    const isVisiteur = userStatus?.nom_role === 'visiteur';
    
    console.log('👤 [Paiements] Statut utilisateur:', {
      userId,
      currentStatus: userStatus?.nom_role,
      isFirstPayment,
      isVisiteur,
      paiementsCount: userStatus?.paiements_count
    });
    
    // 2. Créer l'enregistrement de paiement
    const paiementData = {
      utilisateur_id: parseInt(userId),
      montant: parseFloat(amount),
      stripe_payment_intent_id: paymentIntentId,
      methode_paiement: 'stripe',
      date_paiement: new Date().toISOString().split('T')[0],
      statut: 'validé',
      description: `Paiement échéance ${echeance.nom_plan} - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`,
      date_confirmation: new Date().toISOString(),
      abonnement_id: echeance.abonnement_id,
      periode_debut: new Date(echeance.date_echeance).toISOString().split('T')[0],
      periode_fin: new Date(new Date(echeance.date_echeance).setMonth(new Date(echeance.date_echeance).getMonth() + 1)).toISOString().split('T')[0]
    };
    
    const insertPaiementQuery = `
      INSERT INTO paiements (
        utilisateur_id, montant, stripe_payment_intent_id, methode_paiement,
        date_paiement, statut, description, date_confirmation,
        abonnement_id, periode_debut, periode_fin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await paiements.queryAsync(insertPaiementQuery, [
      paiementData.utilisateur_id,
      paiementData.montant,
      paiementData.stripe_payment_intent_id,
      paiementData.methode_paiement,
      paiementData.date_paiement,
      paiementData.statut,
      paiementData.description,
      paiementData.date_confirmation,
      paiementData.abonnement_id,
      paiementData.periode_debut,
      paiementData.periode_fin
    ]);
    
    // 3. Mettre à jour l'échéance comme payée
    const updateEcheanceQuery = `
      UPDATE echeances_paiements 
      SET statut = 'payé', date_paiement = ?
      WHERE id = ?
    `;
    await paiements.queryAsync(updateEcheanceQuery, [paiementData.date_paiement, echeanceId]);
    
    // AJOUTÉ: 4. Promotion de visiteur à utilisateur si c'est le premier paiement
    let premierPaiement = false;
    if (isFirstPayment && isVisiteur) {
      try {
        // Récupérer l'ID du statut 'utilisateur'
        const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
        const utilisateurStatusResults = await paiements.queryAsync(utilisateurStatusQuery, []);
        
        if (utilisateurStatusResults.length > 0) {
          const utilisateurStatusId = utilisateurStatusResults[0].id;
          
          const updateUserStatusQuery = `
            UPDATE utilisateurs 
            SET status_id = ? 
            WHERE id = ? AND status_id = (SELECT id FROM status WHERE nom_role = 'visiteur')
          `;
          await paiements.queryAsync(updateUserStatusQuery, [utilisateurStatusId, userId]);
          
          premierPaiement = true;
          console.log('🎉 [Paiements] Promotion réussie: visiteur → utilisateur pour userId:', userId);
        } else {
          console.warn('⚠️ [Paiements] Statut "utilisateur" non trouvé dans la base');
        }
      } catch (promotionError) {
        console.error('❌ [Paiements] Erreur lors de la promotion visiteur → utilisateur:', promotionError);
        // Ne pas faire échouer le paiement si la promotion échoue
      }
    }
    
    // 5. Récupérer les données utilisateur pour l'email
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
      
      try {
        // 6. Envoyer l'email de confirmation
        const emailClient = new EmailClient();
        await emailClient.sendPaymentConfirmation(
          user.email,
          {
            userName: userName,
            amount: formatMontant(paiementData.montant),
            paymentDate: new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          },
          parseInt(userId)
        );
        
        console.log('✅ [Paiements] Email de confirmation envoyé pour échéance');
      } catch (emailError) {
        console.error('❌ [Paiements] Erreur envoi email confirmation échéance:', emailError);
      }
    }
    
    console.log('✅ [Paiements] Paiement échéance confirmé et sauvegardé');
    res.status(200).json({
      success: true,
      message: 'Paiement confirmé avec succès',
      paiement_id: paymentIntentId,
      premier_paiement: premierPaiement // AJOUTÉ: Indiquer si c'est le premier paiement
    });
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement échéance:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message
    });
  }
});

// Route pour confirmer un paiement de commande
router.post('/confirm-payment-commande', async (req: any, res: any) => {
  try {
    const { paymentIntentId, commandeId, userId } = req.body;
    
    console.log('🛒 [Paiements] Confirmation paiement commande:', {
      paymentIntentId,
      commandeId,
      userId
    });

    if (!paymentIntentId || !commandeId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement commande'
      });
    }

    const paiements = new Paiements();
    
    // 1. Vérifier que la commande existe et appartient à l'utilisateur
    const commandeQuery = `
      SELECT c.*, 
        GROUP_CONCAT(CONCAT(a.nom, ' (', t.nom, ') x', ca.quantite) SEPARATOR ', ') as articles_details
      FROM commandes c
      LEFT JOIN commande_articles ca ON c.id = ca.commande_id
      LEFT JOIN articles a ON ca.article_id = a.id
      LEFT JOIN tailles t ON ca.taille_id = t.id
      WHERE (c.id = ? OR c.unique_id = ? OR c.numero_commande = ?) AND c.utilisateur_id = ?
      GROUP BY c.id
    `;
    const commandeResults = await paiements.queryAsync(commandeQuery, [
      parseInt(commandeId) || 0, 
      commandeId, 
      commandeId, 
      parseInt(userId)
    ]);
    
    if (commandeResults.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée ou ne vous appartient pas'
      });
    }
    
    const commande = commandeResults[0];
    
    // AJOUTÉ: Vérifier le statut actuel de l'utilisateur pour promotion éventuelle
    const userStatusQuery = `
      SELECT u.status_id, s.nom_role,
        (SELECT COUNT(*) FROM paiements WHERE utilisateur_id = ? AND statut = 'validé') as paiements_count
      FROM utilisateurs u
      JOIN status s ON u.status_id = s.id
      WHERE u.id = ?
    `;
    const userStatusResults = await paiements.queryAsync(userStatusQuery, [userId, userId]);
    
    const userStatus = userStatusResults[0];
    const isFirstPayment = userStatus?.paiements_count === 0;
    const isVisiteur = userStatus?.nom_role === 'visiteur';
    
    console.log('👤 [Paiements] Statut utilisateur pour commande:', {
      userId,
      currentStatus: userStatus?.nom_role,
      isFirstPayment,
      isVisiteur,
      paiementsCount: userStatus?.paiements_count
    });
    
    // 2. Créer l'enregistrement de paiement
    const paiementData = {
      commande_id: commande.id,
      utilisateur_id: parseInt(userId),
      montant: parseFloat(commande.total),
      stripe_payment_intent_id: paymentIntentId,
      methode_paiement: 'stripe',
      date_paiement: new Date().toISOString().split('T')[0],
      statut: 'validé',
      description: `Paiement commande ${commande.numero_commande || commande.unique_id || `#${commande.id}`}`,
      date_confirmation: new Date().toISOString()
    };
    
    const insertPaiementQuery = `
      INSERT INTO paiements (
        commande_id, utilisateur_id, montant, stripe_payment_intent_id, 
        methode_paiement, date_paiement, statut, description, date_confirmation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await paiements.queryAsync(insertPaiementQuery, [
      paiementData.commande_id,
      paiementData.utilisateur_id,
      paiementData.montant,
      paiementData.stripe_payment_intent_id,
      paiementData.methode_paiement,
      paiementData.date_paiement,
      paiementData.statut,
      paiementData.description,
      paiementData.date_confirmation
    ]);
    
    // 3. Mettre à jour la commande comme payée
    const updateCommandeQuery = `
      UPDATE commandes 
      SET statut = 'payée' 
      WHERE id = ?
    `;
    await paiements.queryAsync(updateCommandeQuery, [commande.id]);
    
    // AJOUTÉ: 4. Promotion de visiteur à utilisateur si c'est le premier paiement
    let premierPaiement = false;
    if (isFirstPayment && isVisiteur) {
      try {
        // Récupérer l'ID du statut 'utilisateur'
        const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
        const utilisateurStatusResults = await paiements.queryAsync(utilisateurStatusQuery, []);
        
        if (utilisateurStatusResults.length > 0) {
          const utilisateurStatusId = utilisateurStatusResults[0].id;
          
          const updateUserStatusQuery = `
            UPDATE utilisateurs 
            SET status_id = ? 
            WHERE id = ? AND status_id = (SELECT id FROM status WHERE nom_role = 'visiteur')
          `;
          await paiements.queryAsync(updateUserStatusQuery, [utilisateurStatusId, userId]);
          
          premierPaiement = true;
          console.log('🎉 [Paiements] Promotion réussie: visiteur → utilisateur pour userId:', userId, '(commande)');
        } else {
          console.warn('⚠️ [Paiements] Statut "utilisateur" non trouvé dans la base');
        }
      } catch (promotionError) {
        console.error('❌ [Paiements] Erreur lors de la promotion visiteur → utilisateur (commande):', promotionError);
        // Ne pas faire échouer le paiement si la promotion échoue
      }
    }
    
    // 5. Récupérer les données utilisateur pour l'email
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
      
      try {
        // 6. Envoyer l'email de confirmation de paiement
        const emailClient = new EmailClient();
        await emailClient.sendPaymentConfirmation(
          user.email,
          {
            userName: userName,
            amount: formatMontant(paiementData.montant),
            paymentDate: new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          },
          parseInt(userId)
        );
        
        console.log('✅ [Paiements] Email de confirmation paiement envoyé pour commande');
      } catch (emailError) {
        console.error('❌ [Paiements] Erreur envoi email confirmation paiement commande:', emailError);
      }
    }
    
    console.log('✅ [Paiements] Paiement commande confirmé et sauvegardé');
    res.status(200).json({
      success: true,
      message: 'Paiement commande confirmé avec succès',
      paiement_id: paymentIntentId,
      commande_id: commande.id,
      premier_paiement: premierPaiement // AJOUTÉ: Indiquer si c'est le premier paiement
    });
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement commande:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement commande',
      details: error.message
    });
  }
});

export default router;
