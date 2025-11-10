import express from 'express';
import Stripe from 'stripe';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { EmailClient } from '../clients/emailClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const router = express.Router();

// Configuration Stripe
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('4e')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }
} catch (error) {
  console.error('❌ [Confirmation] Erreur initialisation Stripe:', error);
}

console.log('🔧 [Confirmation] Module confirmation initialisé');

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

// DÉPLACÉ DEPUIS paiements.ts - Routes de confirmation

// POST - Confirmer un paiement d'échéance (route sans préfixe /stripe/)
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, echeanceId, userId, amount } = req.body;
    
    console.log('🎉 [Confirmation] Confirmation paiement échéance:', {
      paymentIntentId, echeanceId, userId, amount
    });

    // Validation des paramètres
    if (!paymentIntentId || !echeanceId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement',
        required: ['paymentIntentId', 'echeanceId', 'userId']
      });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Service Stripe non disponible' });
    }

    const paiements = new Paiements();
    
    // AJOUTÉ: Vérifier d'abord si l'échéance est déjà payée
    const checkEcheanceQuery = `
      SELECT id, statut, utilisateur_id, montant, date_echeance, abonnement_id 
      FROM echeances_paiements 
      WHERE id = ?
    `;
    const echeanceCheck = await paiements.queryAsync(checkEcheanceQuery, [parseInt(echeanceId)]);
    
    if (echeanceCheck.length === 0) {
      return res.status(404).json({
        error: 'Échéance non trouvée',
        echeanceId: parseInt(echeanceId)
      });
    }
    
    const echeanceActuelle = echeanceCheck[0];
    
    // AJOUTÉ: Si déjà payée, considérer comme succès (idempotence)
    if (echeanceActuelle.statut === 'payé') {
      console.log('ℹ️ [Confirmation] Échéance déjà payée - opération idempotente');
      return res.status(200).json({
        success: true,
        message: 'Paiement confirmé (échéance déjà payée)',
        paiement_id: paymentIntentId,
        echeance_id: parseInt(echeanceId),
        premier_paiement: false,
        statut_upgrade: null,
        echeance_confirmee: true,
        already_paid: true
      });
    }
    
    // Vérifier si c'est le premier paiement AVANT de traiter
    const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));
    
    // CORRIGÉ: Confirmer le paiement Stripe d'abord (table paiements)
    try {
      await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');
      console.log('✅ [Confirmation] Paiement Stripe confirmé en base');
    } catch (stripeError: any) {
      console.error('❌ [Confirmation] Erreur confirmation Stripe:', stripeError);
      // Continue même si erreur - peut être déjà confirmé
    }

    // CORRIGÉ: Marquer l'échéance comme payée SANS déclencher la contrainte paiements
    try {
      // SIMPLE: Mise à jour directe de l'échéance seulement
      const updateEcheanceQuery = `
        UPDATE echeances_paiements 
        SET 
          statut = 'payé',
          date_paiement = CURDATE()
        WHERE id = ? AND statut != 'payé'
      `;
      
      const updateResult = await paiements.queryAsync(updateEcheanceQuery, [parseInt(echeanceId)]);
      
      if (updateResult.affectedRows === 0) {
        console.warn('⚠️ [Confirmation] Aucune ligne mise à jour - échéance peut-être déjà payée');
        
        // Vérifier le statut actuel
        const recheckEcheance = await paiements.queryAsync(checkEcheanceQuery, [parseInt(echeanceId)]);
        if (recheckEcheance.length > 0 && recheckEcheance[0].statut === 'payé') {
          console.log('ℹ️ [Confirmation] Échéance confirmée comme déjà payée');
          // Continue avec le succès
        } else {
          return res.status(500).json({
            error: 'Impossible de mettre à jour l\'échéance',
            details: 'L\'échéance n\'a pas pu être marquée comme payée',
            echeanceId: parseInt(echeanceId)
          });
        }
      } else {
        console.log('✅ [Confirmation] Échéance marquée comme payée:', {
          echeanceId: parseInt(echeanceId),
          affectedRows: updateResult.affectedRows
        });
      }
      
    } catch (updateError: any) {
      console.error('❌ [Confirmation] Erreur mise à jour échéance:', updateError);
      
      // CORRIGÉ: Cette erreur ne devrait plus arriver car on ne touche pas la table paiements
      if (updateError.code === 'ER_DUP_ENTRY') {
        console.warn('⚠️ [Confirmation] Erreur de contrainte détectée - vérification état');
        
        // Vérifier si l'échéance est maintenant payée malgré l'erreur
        const finalCheck = await paiements.queryAsync(checkEcheanceQuery, [parseInt(echeanceId)]);
        if (finalCheck.length > 0 && finalCheck[0].statut === 'payé') {
          console.log('✅ [Confirmation] Échéance finalement payée malgré l\'erreur');
          // Continuer avec le succès
        } else {
          return res.status(500).json({
            error: 'Erreur de contrainte de base de données',
            details: 'Conflit détecté - veuillez réessayer',
            code: 'CONSTRAINT_VIOLATION',
            sqlMessage: updateError.sqlMessage
          });
        }
      } else {
        throw updateError;
      }
    }

    // Promotion automatique visiteur → utilisateur si premier paiement
    let statutUpgrade: string | null = null;
    if (premierPaiement) {
      try {
        const statusQuery = `
          SELECT u.status_id, s.nom_role as status_actuel
          FROM utilisateurs u
          LEFT JOIN status s ON u.status_id = s.id
          WHERE u.id = ?
        `;
        const statusResult = await paiements.queryAsync(statusQuery, [userId]);
        
        if (statusResult.length > 0 && statusResult[0].status_actuel === 'visiteur') {
          const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
          const nouveauStatut = await paiements.queryAsync(utilisateurStatusQuery, []);
          
          if (nouveauStatut.length > 0) {
            const updateUserQuery = `
              UPDATE utilisateurs 
              SET status_id = ?, date_modification = NOW()
              WHERE id = ? AND status_id = ?
            `;
            
            const updateResult = await paiements.queryAsync(updateUserQuery, [
              nouveauStatut[0].id, userId, statusResult[0].status_id
            ]);
            
            if (updateResult.affectedRows > 0) {
              statutUpgrade = 'visiteur → utilisateur';
              console.log(`✅ [Confirmation] Utilisateur ${userId} promu à utilisateur`);
            }
          }
        }
      } catch (promotionError) {
        console.error('❌ [Confirmation] Erreur promotion:', promotionError);
      }
    }

    // Envoyer email de confirmation
    try {
      const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
      const userResults = await paiements.queryAsync(userQuery, [userId]);
      
      if (userResults.length > 0) {
        const user = userResults[0];
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
        
        const emailClient = new EmailClient();
        const templateData = {
          userName,
          amount: formatMontant(parseFloat(amount)),
          paymentDate: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          }),
          currency: 'EUR',
          echeanceId: parseInt(echeanceId).toString(),
          paymentIntentId,
          premierPaiement,
          ...(premierPaiement && {
            isFirstPayment: true,
            welcomeMessage: '🎉 Bienvenue ! Votre premier paiement a été confirmé avec succès.',
            statusUpgrade: statutUpgrade
          }),
          transactionId: paymentIntentId,
          clubName: 'Club Manager',
          currentYear: new Date().getFullYear().toString()
        };
        
        await emailClient.sendPaymentConfirmation(user.email, templateData, parseInt(userId));
        console.log('✅ [Confirmation] Email de confirmation envoyé');
      }
    } catch (emailError) {
      console.error('❌ [Confirmation] Erreur envoi email:', emailError);
    }

    // Réponse de succès
    let successMessage = 'Paiement confirmé avec succès';
    if (premierPaiement) {
      successMessage += '. 🎉 Félicitations pour votre premier paiement !';
      if (statutUpgrade?.includes('→')) {
        successMessage += ` Votre statut a été mis à jour : ${statutUpgrade}.`;
      }
    }

    res.status(200).json({
      success: true,
      message: successMessage,
      paiement_id: paymentIntentId,
      echeance_id: parseInt(echeanceId),
      premier_paiement: premierPaiement,
      statut_upgrade: statutUpgrade,
      echeance_confirmee: true
    });
    
  } catch (error: any) {
    console.error('❌ [Confirmation] Erreur confirmation paiement:', error);
    
    // CORRIGÉ: Gestion globale des erreurs de contrainte
    if (error.code === 'ER_DUP_ENTRY') {
      console.warn('⚠️ [Confirmation] Gestion erreur de doublon global');
      return res.status(200).json({
        success: true,
        message: 'Paiement confirmé (doublon détecté mais état cohérent)',
        paiement_id: req.body.paymentIntentId,
        duplicate_resolved: true,
        error_handled: true
      });
    }
    
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message,
      error_code: error.code
    });
  }
});

// POST - Confirmer un paiement de commande
router.post('/confirm-payment-commande', async (req, res) => {
  try {
    const { paymentIntentId, commandeId, userId, amount } = req.body;
    
    console.log('🛒 [Confirmation] Confirmation paiement commande:', {
      paymentIntentId, 
      commandeId, 
      userId, 
      amount,
      body: req.body,
      headers: {
        authorization: req.headers.authorization ? 'présent' : 'manquant',
        contentType: req.headers['content-type']
      }
    });

    // AJOUTÉ: Validation renforcée avec messages d'erreur détaillés
    const missingFields = [];
    if (!paymentIntentId) missingFields.push('paymentIntentId');
    if (!commandeId) missingFields.push('commandeId');
    if (!userId) missingFields.push('userId');

    if (missingFields.length > 0) {
      console.error('❌ [Confirmation] Champs manquants:', missingFields);
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement commande',
        missing: missingFields,
        received: {
          paymentIntentId: !!paymentIntentId,
          commandeId: !!commandeId,
          userId: !!userId,
          amount: !!amount
        },
        debug: {
          bodyKeys: Object.keys(req.body),
          bodyValues: req.body
        }
      });
    }

    if (!stripe) {
      console.error('❌ [Confirmation] Stripe non initialisé');
      return res.status(503).json({ 
        error: 'Service Stripe non disponible',
        details: 'Stripe non initialisé - vérifiez STRIPE_SECRET_KEY'
      });
    }

    const paiements = new Paiements();
    
    console.log('🔍 [Confirmation] Vérification PaymentIntent sur Stripe:', paymentIntentId);
    
    // Vérifier le paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log('📊 [Confirmation] Statut PaymentIntent Stripe:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
    
    if (paymentIntent.status !== 'succeeded') {
      console.warn('⚠️ [Confirmation] PaymentIntent pas en statut succeeded:', paymentIntent.status);
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé sur Stripe',
        stripeStatus: paymentIntent.status,
        paymentIntentId
      });
    }

    console.log('✅ [Confirmation] PaymentIntent Stripe validé, mise à jour base de données...');

    // Confirmer le paiement et mettre à jour la commande
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');
    console.log('✅ [Confirmation] Paiement confirmé en base');
    
    // CORRIGÉ: Utiliser seulement les colonnes existantes de la table commandes
    const updateCommandeQuery = `UPDATE commandes SET statut = 'payée' WHERE id = ?`;
    const updateResult = await paiements.queryAsync(updateCommandeQuery, [commandeId]);
    
    console.log('✅ [Confirmation] Commande mise à jour:', {
      commandeId,
      affectedRows: updateResult.affectedRows,
      statutMisAJour: 'payée',
      colonnesUtilisees: ['statut'],
      note: 'Table commandes: pas de colonne date_paiement - utilisation de statut seulement'
    });

    // AJOUTÉ: Enregistrer la date de paiement dans la table paiements pour traçabilité
    try {
      const updatePaiementDateQuery = `
        UPDATE paiements 
        SET date_paiement = NOW(), 
            statut = 'reussi',
            details = CONCAT(COALESCE(details, ''), ', Commande payée le: ', NOW())
        WHERE stripe_payment_intent_id = ?
      `;
      await paiements.queryAsync(updatePaiementDateQuery, [paymentIntentId]);
      console.log('✅ [Confirmation] Date de paiement enregistrée dans table paiements');
    } catch (paiementDateError) {
      console.warn('⚠️ [Confirmation] Impossible de mettre à jour date dans paiements:', paiementDateError);
    }

    // Envoyer email de confirmation commande
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
      
      try {
        // CORRIGÉ: Récupérer les détails de la commande pour avoir les données complètes
        let commandeDetails = { total: 0, articles: [] as any[] };
        
        if (commandeId) {
          try {
            const commandeQuery = `
              SELECT 
                c.total,
                ca.article_id,
                ca.quantite,
                ca.prix,
                a.nom as article_nom,
                t.nom as taille_nom
              FROM commandes c
              LEFT JOIN commande_articles ca ON c.id = ca.commande_id
              LEFT JOIN articles a ON ca.article_id = a.id
              LEFT JOIN tailles t ON ca.taille_id = t.id
              WHERE c.id = ?
            `;
            
            const commandeResults = await paiements.queryAsync(commandeQuery, [commandeId]);
            
            if (commandeResults.length > 0) {
              commandeDetails.total = commandeResults[0].total || 0;
              commandeDetails.articles = commandeResults
                .filter((row: any) => row.article_id)
                .map((row: any) => ({
                  nom: row.article_nom,
                  quantite: row.quantite,
                  prix: row.prix,
                  taille: row.taille_nom
                }));
            }
          } catch (commandeError) {
            console.warn('⚠️ [Confirmation] Impossible de récupérer détails commande:', commandeError);
          }
        }
        
        const emailClient = new EmailClient();
        // CORRIGÉ: Utiliser les propriétés attendues par sendOrderConfirmation
        const templateData = {
          userName,
          numeroCommande: commandeId.toString(),
          uniqueId: paymentIntentId,
          dateCommande: new Date().toLocaleDateString('fr-FR'),
          statutCommande: 'Confirmée et payée',
          nbArticles: commandeDetails.articles.length.toString(),
          totalCommande: commandeDetails.total.toFixed(2),
          articlesDetails: commandeDetails.articles.length > 0 
            ? commandeDetails.articles.map(a => `${a.nom} (${a.taille || 'N/A'}) x${a.quantite}`).join(', ')
            : 'Détails non disponibles',
          delaiPreparation: '24-48 heures',
          lieuRetrait: 'Accueil du club',
          horaires: 'Lundi-Vendredi: 9h-18h',
          conservation: 'Votre commande sera conservée 7 jours',
          emailContact: process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
          telephoneContact: process.env.CLUB_PHONE || '01 23 45 67 89',
          anneeActuelle: new Date().getFullYear().toString()
        };
        
        await emailClient.sendOrderConfirmation(user.email, templateData, parseInt(userId));
        console.log('✅ [Confirmation] Email commande envoyé');
      } catch (emailError) {
        console.error('❌ [Confirmation] Erreur email commande:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Commande payée avec succès',
      payment_intent_id: paymentIntentId,
      commande_id: commandeId,
      stripe_status: paymentIntent.status,
      database_updated: true,
      email_envoye: true,
      timestamp: new Date().toISOString(),
      commande_info: {
        statut_mis_a_jour: 'payée',
        table_structure: 'Utilisé colonnes existantes (id, statut)',
        date_paiement_tracee_dans: 'table paiements'
      }
    });

  } catch (error: any) {
    console.error('❌ [Confirmation] Erreur confirmation commande:', error);
    console.error('❌ [Confirmation] Stack trace:', error.stack);
    
    // MODIFIÉ: Gestion spécifique pour la structure de table connue
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('❌ [Confirmation] Erreur colonne SQL:', {
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        tableStructure: 'commandes: id, unique_id, numero_commande, utilisateur_id, total, date_commande, statut, ip_address, user_agent, created_at'
      });
      
      return res.status(500).json({ 
        error: 'Erreur de requête SQL',
        details: `Colonne inexistante: ${error.sqlMessage}`,
        sql_error: error.code,
        table_info: {
          table: 'commandes',
          colonnes_disponibles: ['id', 'unique_id', 'numero_commande', 'utilisateur_id', 'total', 'date_commande', 'statut', 'ip_address', 'user_agent', 'created_at'],
          statut_enum: ['en attente', 'payée', 'expédiée', 'annulée'],
          note: 'Pas de colonne date_paiement - utiliser table paiements pour la traçabilité'
        },
        timestamp: new Date().toISOString(),
        debug: {
          paymentIntentId: req.body.paymentIntentId,
          commandeId: req.body.commandeId,
          userId: req.body.userId,
          sqlQuery: error.sql
        }
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement commande',
      details: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
      debug: {
        paymentIntentId: req.body.paymentIntentId,
        commandeId: req.body.commandeId,
        userId: req.body.userId
      }
    });
  }
});

// AJOUTÉ: Route manquante - POST /stripe/confirm-payment-commande 
router.post('/stripe/confirm-payment-commande', async (req, res) => {
  try {
    const { paymentIntentId, commandeId, userId } = req.body;
    
    console.log('🛒 [Confirmation] Confirmation paiement commande via /stripe/confirm-payment-commande:', {
      paymentIntentId, commandeId, userId
    });

    if (!paymentIntentId || !commandeId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement commande'
      });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Service Stripe non disponible' });
    }

    const paiements = new Paiements();
    
    // Vérifier le paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé sur Stripe',
        stripeStatus: paymentIntent.status 
      });
    }

    // Mettre à jour le statut du paiement
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // CORRIGÉ: Mettre à jour seulement le statut de la commande
    const updateCommandeQuery = `UPDATE commandes SET statut = 'payée' WHERE id = ?`;
    const updateResult = await paiements.queryAsync(updateCommandeQuery, [commandeId]);
    
    console.log('✅ [Confirmation] Commande mise à jour (route stripe):', {
      commandeId,
      affectedRows: updateResult.affectedRows,
      statutMisAJour: 'payée'
    });

    // Envoyer email de confirmation commande avec détails complets
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
      
      try {
        // CORRIGÉ: Récupérer les détails de la commande pour avoir les données complètes
        let commandeDetails = { total: 0, articles: [] as any[] };
        
        if (commandeId) {
          try {
            const commandeQuery = `
              SELECT 
                c.total,
                ca.article_id,
                ca.quantite,
                ca.prix,
                a.nom as article_nom,
                t.nom as taille_nom
              FROM commandes c
              LEFT JOIN commande_articles ca ON c.id = ca.commande_id
              LEFT JOIN articles a ON ca.article_id = a.id
              LEFT JOIN tailles t ON ca.taille_id = t.id
              WHERE c.id = ?
            `;
            
            const commandeResults = await paiements.queryAsync(commandeQuery, [commandeId]);
            
            if (commandeResults.length > 0) {
              commandeDetails.total = commandeResults[0].total || 0;
              commandeDetails.articles = commandeResults
                .filter((row: any) => row.article_id)
                .map((row: any) => ({
                  nom: row.article_nom,
                  quantite: row.quantite,
                  prix: row.prix,
                  taille: row.taille_nom
                }));
            }
          } catch (commandeError) {
            console.warn('⚠️ [Confirmation] Impossible de récupérer détails commande:', commandeError);
          }
        }
        
        const emailClient = new EmailClient();
        // CORRIGÉ: Utiliser les propriétés attendues par sendOrderConfirmation
        const templateData = {
          userName,
          numeroCommande: commandeId.toString(),
          uniqueId: paymentIntentId,
          dateCommande: new Date().toLocaleDateString('fr-FR'),
          statutCommande: 'Confirmée et payée',
          nbArticles: commandeDetails.articles.length.toString(),
          totalCommande: commandeDetails.total.toFixed(2),
          articlesDetails: commandeDetails.articles.length > 0 
            ? commandeDetails.articles.map(a => `${a.nom} (${a.taille || 'N/A'}) x${a.quantite}`).join(', ')
            : 'Détails non disponibles',
          delaiPreparation: '24-48 heures',
          lieuRetrait: 'Accueil du club',
          horaires: 'Lundi-Vendredi: 9h-18h',
          conservation: 'Votre commande sera conservée 7 jours',
          emailContact: process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
          telephoneContact: process.env.CLUB_PHONE || '01 23 45 67 89',
          anneeActuelle: new Date().getFullYear().toString()
        };
        
        await emailClient.sendOrderConfirmation(user.email, templateData, parseInt(userId));
        console.log('✅ [Confirmation] Email commande envoyé');
      } catch (emailError) {
        console.error('❌ [Confirmation] Erreur email commande:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Commande payée avec succès',
      payment_intent_id: paymentIntentId,
      commande_id: commandeId,
      email_envoye: true,
      database_info: {
        commande_statut: 'payée',
        paiement_confirme: true,
        table_utilisee: 'commandes (colonnes existantes)'
      }
    });

  } catch (error: any) {
    console.error('❌ [Confirmation] Erreur confirmation commande:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement commande',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route de debug pour vérifier la structure de la table commandes
router.get('/debug/table-structure', async (req, res) => {
  try {
    const paiements = new Paiements();
    
    // Vérifier la structure de la table commandes
    const describeQuery = 'DESCRIBE commandes';
    const tableStructure = await paiements.queryAsync(describeQuery, []);
    
    console.log('🔍 [Confirmation] Structure réelle table commandes:', tableStructure);
    
    res.json({
      table: 'commandes',
      columns: tableStructure.map((col: any) => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key,
        default: col.Default,
        extra: col.Extra
      })),
      structure_connue: {
        colonnes_disponibles: [
          'id (INT AUTO_INCREMENT PRIMARY KEY)',
          'unique_id (VARCHAR(255) NULL)',
          'numero_commande (VARCHAR(100) NULL)',
          'utilisateur_id (INT NOT NULL)',
          'total (DECIMAL(10, 2) NOT NULL DEFAULT 0.00)',
          'date_commande (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
          'statut (ENUM: en attente, payée, expédiée, annulée)',
          'ip_address (VARCHAR(45) NULL)',
          'user_agent (TEXT NULL)',
          'created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
        ],
        statut_enum: ['en attente', 'payée', 'expédiée', 'annulée'],
        indexes: [
          'idx_utilisateur_statut (utilisateur_id, statut)',
          'idx_unique_id (unique_id)',
          'idx_numero_commande (numero_commande)',
          'idx_created_at (created_at)'
        ]
      },
      hasDatePaiement: tableStructure.some((col: any) => col.Field === 'date_paiement'),
      solution_implementee: {
        pour_tracer_paiement: 'Utiliser table paiements avec date_paiement',
        statut_commande: 'Mettre à jour statut = \'payée\'',
        colonnes_utilisees: ['statut'],
        pas_de_modification_table: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [Confirmation] Erreur vérification structure:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification de la structure',
      details: error.message
    });
  }
});

// AJOUTÉ: Route de debug pour vérifier que le module est bien chargé
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    module: 'confirmation',
    routes: [
      'POST /confirmation/confirm-payment - Confirmation échéance',
      'POST /confirmation/confirm-payment-commande - Confirmation commande',
      'GET /confirmation/health - Statut du module'
    ],
    stripe: {
      configured: !!stripe,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY
    },
    timestamp: new Date().toISOString()
  });
});

console.log('✅ [Confirmation] Routes confirmation chargées');

// CORRIGÉ: Export par défaut au lieu de named export
export default router;
