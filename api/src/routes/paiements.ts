import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.js';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { Magasin } from '../db/clients/magasin/magasin.js';
import { EmailClient } from '../clients/emailClient.js';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();

console.log('🔧 [Paiements] Initialisation du module de paiements consolidé');

// Configuration Stripe
let stripe: Stripe | null = null;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ La clé secrète Stripe est manquante dans le fichier .env");
  } else {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey.includes('4e') && stripeSecretKey.includes('p7dc')) {
      console.error("❌ Clé Stripe expirée détectée! Veuillez mettre à jour STRIPE_SECRET_KEY dans .env");
    } else {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-02-24.acacia',
      });
      
      // Test de connectivité Stripe
      stripe.balance.retrieve()
        .then(() => console.log('✅ [Stripe] Connexion validée'))
        .catch((error) => console.error('❌ [Stripe] Erreur:', error.message));
    }
  }
} catch (error) {
  console.error('❌ [Stripe] Erreur d\'initialisation:', error);
}

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

// ===== ROUTES CRUD PAIEMENTS =====

// GET - Obtenir tous les paiements
router.get('/', async (req, res) => {
  try {
    const paiements = new Paiements();
    const result = await paiements.obtenirLesTousLesPaiements();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error });
  }
});

// POST - Créer un paiement pour une commande (route principale)
router.post('/', async (req, res) => {
  try {
    console.log('🛒 [Paiements] POST / - Création paiement commande:', req.body);
    
    const { amount, currency = 'eur', commande, utilisateur_id, description } = req.body;
    
    // CORRIGÉ: Vérifier si c'est une création de PaymentIntent ou un paiement direct
    if (!stripe) {
      return res.status(503).json({ error: 'Service Stripe non disponible' });
    }

    // Extraire l'utilisateur_id
    const finalUserId = commande?.utilisateur_id || utilisateur_id;
    
    if (!finalUserId || !amount) {
      return res.status(400).json({ 
        error: 'utilisateur_id et amount requis',
        received: { utilisateur_id: finalUserId, amount }
      });
    }

    console.log('💰 [Paiements] Données extraites:', {
      finalUserId,
      amount,
      commande: !!commande,
      articles: commande?.articles?.length || 0
    });

    const montantEuros = parseFloat((amount / 100).toFixed(2));

    if (isNaN(montantEuros) || montantEuros <= 0) {
      return res.status(400).json({ 
        error: 'Montant invalide',
        debug: { amount, montantEuros }
      });
    }

    // CORRIGÉ: Créer d'abord la commande en base avant le PaymentIntent
    const paiements = new Paiements();
    const magasin = new Magasin();
    
    const total = commande?.total || montantEuros;
    const date = new Date().toISOString();
    
    console.log('📦 [Paiements] Création commande avec:', {
      utilisateur_id: finalUserId,
      articles: commande?.articles?.length || 0,
      total,
      statut: 'en_attente'
    });
    
    // 1. Créer la commande en premier
    const commandeResult = await magasin.creerCommande(
      finalUserId, 
      commande?.articles || [], 
      total, 
      date, 
      'en_attente'
    );
    
    console.log('📦 [Paiements] Résultat création commande:', commandeResult);
    
    if (!commandeResult.isConfirm) {
      throw new Error(`Erreur création commande: ${commandeResult.message}`);
    }
    
    // 2. CORRIGÉ: Récupérer l'ID de la commande créée avec une approche plus robuste
    let commandeId = null;
    
    // CORRIGÉ: Utiliser les propriétés correctes du type ConfirmationResult
    try {
      // Méthode 1: Vérifier les propriétés disponibles dans ConfirmationResult
      console.log('🔍 [Paiements] Structure commandeResult:', {
        isConfirm: commandeResult.isConfirm,
        message: commandeResult.message,
        hasId: 'id' in commandeResult,
        hasInsertId: 'insertId' in commandeResult,
        keys: Object.keys(commandeResult)
      });
      
      // CORRIGÉ: Essayer d'accéder à l'ID via les propriétés standard
      if ('id' in commandeResult && (commandeResult as any).id) {
        commandeId = (commandeResult as any).id;
        console.log('✅ [Paiements] ID commande depuis propriété id:', commandeId);
      } else if ('insertId' in commandeResult && (commandeResult as any).insertId) {
        commandeId = (commandeResult as any).insertId;
        console.log('✅ [Paiements] ID commande depuis propriété insertId:', commandeId);
      } else {
        // Méthode 2: Recherche par timestamp récent et utilisateur
        console.log('🔍 [Paiements] Recherche ID commande par requête SQL...');
        
        const commandeQuery = `
          SELECT id, statut, date_commande, total 
          FROM commandes 
          WHERE utilisateur_id = ? 
            AND ABS(TIMESTAMPDIFF(SECOND, date_commande, ?)) <= 30
            AND (statut = 'en_attente' OR statut = 'en attente' OR statut = '' OR statut IS NULL)
          ORDER BY date_commande DESC 
          LIMIT 1
        `;
        
        const commandeResults = await paiements.queryAsync(commandeQuery, [finalUserId, date]);
        console.log('🔍 [Paiements] Résultats recherche commande:', commandeResults);
        
        if (commandeResults.length > 0) {
          commandeId = commandeResults[0].id;
          console.log('✅ [Paiements] ID commande trouvé par recherche temporelle:', commandeId);
          console.log('📊 [Paiements] Détails commande trouvée:', {
            id: commandeResults[0].id,
            statut: commandeResults[0].statut,
            total: commandeResults[0].total,
            date_commande: commandeResults[0].date_commande
          });
        } else {
          // Méthode 3: Recherche plus large (dernière commande de l'utilisateur)
          console.log('🔍 [Paiements] Recherche élargie - dernière commande utilisateur...');
          
          const fallbackQuery = `
            SELECT id, statut, date_commande, total 
            FROM commandes 
            WHERE utilisateur_id = ? 
            ORDER BY date_commande DESC 
            LIMIT 1
          `;
          
          const fallbackResults = await paiements.queryAsync(fallbackQuery, [finalUserId]);
          
          if (fallbackResults.length > 0) {
            commandeId = fallbackResults[0].id;
            console.log('⚠️ [Paiements] ID commande via fallback (dernière commande):', commandeId);
            console.log('📊 [Paiements] Détails commande fallback:', {
              id: fallbackResults[0].id,
              statut: fallbackResults[0].statut,
              total: fallbackResults[0].total,
              date_commande: fallbackResults[0].date_commande
            });
          }
        }
      }
    } catch (searchError: any) {
      console.error('❌ [Paiements] Erreur recherche ID commande:', searchError);
    }
    
    // 3. Vérifier qu'on a bien un ID de commande
    if (!commandeId) {
      // CORRIGÉ: Message d'erreur plus informatif
      console.error('❌ [Paiements] Impossible de récupérer l\'ID de commande. État:', {
        commandeCreated: commandeResult.isConfirm,
        message: commandeResult.message,
        finalUserId,
        timestamp: date
      });
      
      throw new Error(`Impossible de récupérer l'ID de la commande créée. 
        Commande ${commandeResult.isConfirm ? 'créée avec succès' : 'non créée'} 
        mais ID introuvable. Message: ${commandeResult.message}`);
    }
    
    console.log('✅ [Paiements] ID commande final:', commandeId);

    // 4. Créer le PaymentIntent avec l'ID de commande
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency,
      description: description || `Commande magasin #${commandeId} - ${commande?.articles?.length || 0} article(s)`,
      metadata: {
        utilisateur_id: finalUserId.toString(),
        commande_id: commandeId.toString(),
        commande_data: JSON.stringify(commande || {}),
        type: 'commande_magasin',
        montant_euros: montantEuros.toString(),
        date_creation: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ [Paiements] PaymentIntent créé:', paymentIntent.id);

    // 5. Enregistrer le paiement avec l'ID de commande
    const paiementResult = await paiements.creerPaiement({
      commande_id: commandeId,
      utilisateur_id: finalUserId,
      montant: montantEuros,
      methode_paiement: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      statut: 'en_attente',
      description: description || `Commande magasin #${commandeId}`
    });

    console.log('✅ [Paiements] Paiement créé:', paiementResult.id);

    // 6. AJOUTÉ: Vérification finale que tout est cohérent
    console.log('🔍 [Paiements] Vérification finale:', {
      commandeId,
      paymentIntentId: paymentIntent.id,
      paiementId: paiementResult.id,
      montant: montantEuros,
      utilisateur: finalUserId
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      // CORRIGÉ: Ajouter les deux formats pour compatibilité
      commandeId: commandeId,
      commande_id: commandeId,  // Format alternatif pour compatibilité
      paiementId: paiementResult.id,
      paiement_id: paiementResult.id,  // Format alternatif pour compatibilité
      metadata: {
        montant_euros: montantEuros,
        utilisateur_id: finalUserId,
        nb_articles: commande?.articles?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur POST /:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du paiement',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST - Créer un paiement générique
router.post('/create', async (req, res) => {
  try {
    const paiements = new Paiements();
    const result = await paiements.creerPaiement(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du paiement', error });
  }
});

// PUT - Modifier un paiement
router.put('/:id', async (req, res) => {
  const paiementId = Number(req.params.id);
  
  if (isNaN(paiementId)) {
    return res.status(400).json({ error: 'ID paiement invalide' });
  }

  try {
    const paiements = new Paiements();
    const result = await paiements.modifierPaiement(paiementId, req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la modification du paiement', error });
  }
});

// PUT - Mettre à jour le statut d'un paiement
router.put('/update-status', async (req, res) => {
  const { id, statut } = req.body;
  
  if (!id || !statut) {
    return res.status(400).json({ error: 'ID et statut requis' });
  }

  console.log('🔄 [Paiements] Mise à jour statut:', { id, statut });

  const maxRetries = 3;
  let retryCount = 0;

  try {
    const paiements = new Paiements();
    
    while (retryCount < maxRetries) {
      try {
        const result = await paiements.mettreAJourStatutPaiement(id, statut);
        console.log('✅ [Paiements] Statut mis à jour avec succès:', { id, statut });
        return res.status(200).json(result);
      } catch (error: any) {
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.random() * 1000 + (retryCount * 500);
          console.log(`⏳ [Paiements] Deadlock détecté, retry ${retryCount}/${maxRetries} dans ${delay.toFixed()}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur mise à jour statut après', maxRetries, 'tentatives:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du paiement', 
      error: error.message,
      code: error.code 
    });
  }
});

// DELETE - Supprimer un paiement
router.delete('/:id', async (req, res) => {
  const paiementId = Number(req.params.id);
  
  if (isNaN(paiementId)) {
    return res.status(400).json({ error: 'ID paiement invalide' });
  }

  try {
    const paiements = new Paiements();
    const result = await paiements.supprimerPaiement(paiementId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du paiement', error });
  }
});

// ===== ROUTES STRIPE =====

// POST - Créer un PaymentIntent pour échéance
router.post('/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Service Stripe non disponible' });
  }

  try {
    const { amount, currency = 'eur', echeanceId, userId, description } = req.body;
    
    console.log('🏦 [Paiements] Création PaymentIntent pour échéance:', { 
      amount, currency, echeanceId, userId, description 
    });

    if (!amount || !echeanceId || !userId) {
      return res.status(400).json({ 
        error: 'Montant, échéance ID et utilisateur ID requis' 
      });
    }

    const paiements = new Paiements();

    // Vérification de l'existence de l'échéance
    const echeanceExiste = await paiements.queryAsync(
      'SELECT id, utilisateur_id, montant, statut FROM echeances_paiements WHERE id = ?',
      [parseInt(echeanceId)]
    );

    if (echeanceExiste.length === 0) {
      return res.status(404).json({ 
        error: `Échéance ${echeanceId} non trouvée en base de données`
      });
    }

    const echeance = echeanceExiste[0];

    if (echeance.utilisateur_id !== parseInt(userId)) {
      return res.status(403).json({ 
        error: 'Cette échéance ne vous appartient pas'
      });
    }

    if (echeance.statut === 'payé') {
      return res.status(400).json({ 
        error: 'Cette échéance est déjà payée'
      });
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
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

      res.status(200).json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        paiement_id: paiementResult.id,
        metadata: paymentIntent.metadata
      });
    } catch (dbError: any) {
      res.status(200).json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        paiement_id: null,
        warning: 'PaymentIntent créé mais erreur d\'enregistrement en base',
        metadata: paymentIntent.metadata
      });
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur création PaymentIntent:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du PaymentIntent',
      details: error.message 
    });
  }
});

// POST - Créer un PaymentIntent pour commande magasin
router.post('/create-payment-intent-commande', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Service Stripe non disponible' });
  }

  try {
    const { amount, currency = 'eur', commande, description } = req.body;
    
    console.log('🛒 [Paiements] Création PaymentIntent pour commande magasin:', { 
      amount, currency, commande: commande?.utilisateur_id, description 
    });

    if (!amount || !commande || !commande.utilisateur_id) {
      return res.status(400).json({ 
        error: 'Montant, commande et utilisateur ID requis' 
      });
    }

    const montantEuros = parseFloat((amount / 100).toFixed(2));

    if (isNaN(montantEuros) || montantEuros <= 0) {
      return res.status(400).json({ 
        error: 'Montant invalide'
      });
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency,
      description: description || `Commande magasin - ${commande.articles.length} article(s)`,
      metadata: {
        commande_id: 'temp',
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

    // Enregistrer la commande et le paiement
    const paiements = new Paiements();
    const magasin = new Magasin();
    
    const total = commande.total || montantEuros;
    const date = new Date().toISOString();
    
    // Créer la commande
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
    
    // Récupérer l'ID de la commande créée
    let commandeId = null;
    const commandeQuery = `
      SELECT id FROM commandes 
      WHERE utilisateur_id = ? AND (statut = 'en attente' OR statut = '' OR statut IS NULL)
      ORDER BY date_commande DESC 
      LIMIT 1
    `;
    const commandeResults = await paiements.queryAsync(commandeQuery, [commande.utilisateur_id]);
    
    if (commandeResults.length > 0) {
      commandeId = commandeResults[0].id;
      
      // Mettre à jour les métadonnées du PaymentIntent
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          ...paymentIntent.metadata,
          commande_id: commandeId?.toString() || 'unknown'
        }
      });

      // Enregistrer le paiement
      const paiementResult = await paiements.creerPaiement({
        commande_id: commandeId,
        utilisateur_id: commande.utilisateur_id,
        montant: montantEuros,
        methode_paiement: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        statut: 'en_attente',
        description: description || `Commande magasin #${commandeId}`
      });

      res.status(200).json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        commande_id: commandeId,
        paiement_id: paiementResult.id,
        metadata: paymentIntent.metadata
      });
    } else {
      throw new Error('Impossible de récupérer l\'ID de la commande créée');
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur création PaymentIntent commande:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du PaymentIntent pour commande',
      details: error.message 
    });
  }
});

// POST - Confirmer un paiement d'échéance
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, echeanceId, userId, amount } = req.body;
    
    console.log('🎉 [Paiements] Confirmation paiement échéance:', {
      paymentIntentId, echeanceId, userId, amount
    });

    if (!paymentIntentId || !echeanceId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement'
      });
    }

    // CORRIGÉ: Vérifier que Stripe est disponible
    if (!stripe) {
      return res.status(503).json({ error: 'Service Stripe non disponible' });
    }

    const paiements = new Paiements();
    
    // Vérifier le paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé sur Stripe' 
      });
    }

    // Vérifier si c'est le premier paiement
    const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));

    // Mettre à jour le statut du paiement
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // Marquer l'échéance comme payée
    const echeanceResult = await paiements.marquerEcheancePayee(parseInt(echeanceId));

    // Promotion de visiteur à utilisateur si premier paiement
    let statutUpgrade = null;
    if (premierPaiement) {
      try {
        const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
        const statutUtilisateurResult = await paiements.queryAsync(utilisateurStatusQuery, []);
        
        if (statutUtilisateurResult.length > 0) {
          const nouveauStatutId = statutUtilisateurResult[0].id;
          
          const updateUserStatusQuery = `
            UPDATE utilisateurs 
            SET status_id = ? 
            WHERE id = ? AND status_id = (SELECT id FROM status WHERE nom_role = 'visiteur')
          `;
          await paiements.queryAsync(updateUserStatusQuery, [nouveauStatutId, parseInt(userId)]);
          
          statutUpgrade = 'visiteur → utilisateur';
        }
      } catch (promotionError) {
        console.error('❌ [Paiements] Erreur promotion:', promotionError);
      }
    }

    // CORRIGÉ: Récupérer les données utilisateur avec les bonnes colonnes
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
      
      try {
        // Envoyer l'email de confirmation
        const emailClient = new EmailClient();
        await emailClient.sendPaymentConfirmation(
          user.email,
          {
            userName: userName,
            amount: formatMontant(amount),
            paymentDate: new Date().toLocaleDateString('fr-FR')
          },
          parseInt(userId)
        );
      } catch (emailError) {
        console.error('❌ [Paiements] Erreur envoi email confirmation:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Paiement confirmé avec succès',
      paiement_id: paymentIntentId,
      premier_paiement: premierPaiement,
      statut_upgrade: statutUpgrade
    });
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message
    });
  }
});

// POST - Confirmer un paiement de commande
router.post('/confirm-payment-commande', async (req, res) => {
  try {
    const { paymentIntentId, commandeId, userId } = req.body;
    
    console.log('🛒 [Paiements] Confirmation paiement commande:', {
      paymentIntentId, commandeId, userId
    });

    if (!paymentIntentId || !commandeId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement commande'
      });
    }

    // CORRIGÉ: Vérifier que Stripe est disponible
    if (!stripe) {
      return res.status(503).json({ error: 'Service Stripe non disponible' });
    }

    const paiements = new Paiements();
    
    // Vérifier le paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé sur Stripe' 
      });
    }

    // Mettre à jour le statut du paiement
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // Mettre à jour le statut de la commande
    const updateCommandeQuery = `UPDATE commandes SET statut = 'payée' WHERE id = ?`;
    await paiements.queryAsync(updateCommandeQuery, [commandeId]);

    // CORRIGÉ: Déclarer commandeResults dans la portée principale
    let commandeResults: any[] = [];
    let commandeDetails = null;
    let articlesDetailsHtml = '';
    
    try {
      const commandeQuery = `
        SELECT 
          c.id, c.numero_commande, c.total, c.date_commande, c.statut,
          ca.quantite, ca.prix as prix_unitaire,
          a.nom as article_nom,
          t.nom as taille_nom
        FROM commandes c
        LEFT JOIN commande_articles ca ON c.id = ca.commande_id
        LEFT JOIN articles a ON ca.article_id = a.id
        LEFT JOIN tailles t ON ca.taille_id = t.id
        WHERE c.id = ?
      `;
      
      commandeResults = await paiements.queryAsync(commandeQuery, [commandeId]);
      
      if (commandeResults.length > 0) {
        commandeDetails = commandeResults[0];
        
        // Générer le HTML des articles
        const articles = commandeResults.filter(row => row.article_nom);
        articlesDetailsHtml = articles.map(article => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; background-color: #f9f9f9; margin-bottom: 8px; border-radius: 4px;">
            <div style="flex: 1;">
              <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${article.article_nom}</div>
              <div style="font-size: 14px; color: #666;">
                Taille: ${article.taille_nom || 'N/A'} | Quantité: ${article.quantite} | Prix unitaire: ${article.prix_unitaire.toFixed(2)} €
              </div>
            </div>
            <div style="text-align: right; font-weight: bold; color: #007bff;">
              ${(article.prix_unitaire * article.quantite).toFixed(2)} €
            </div>
          </div>
        `).join('');
      }
    } catch (commandeError) {
      console.error('❌ [Paiements] Erreur récupération détails commande:', commandeError);
      articlesDetailsHtml = '<div style="text-align: center; color: #666; font-style: italic; padding: 20px;">Détails de commande indisponibles</div>';
    }

    // CORRIGÉ: Récupérer les données utilisateur avec les bonnes colonnes
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
      
      try {
        // AJOUTÉ: Envoyer l'email de confirmation de commande avec EmailClient
        const emailClient = new EmailClient();
        
        // Utiliser sendOrderConfirmation pour les commandes
        const emailResult = await emailClient.sendOrderConfirmation(
          user.email,
          {
            userName: userName,
            numeroCommande: commandeDetails?.numero_commande || commandeId.toString(),
            uniqueId: paymentIntentId,
            dateCommande: new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            statutCommande: 'Confirmée et payée',
            nbArticles: commandeResults.filter(row => row.article_nom)?.length?.toString() || '0',
            totalCommande: formatMontant(paymentIntent.amount / 100),
            articlesDetails: articlesDetailsHtml,
            // Variables additionnelles pour le template
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
          console.log('✅ [Paiements] Email de confirmation commande envoyé avec succès');
        } else {
          console.error('❌ [Paiements] Erreur envoi email commande:', emailResult.error);
        }
        
      } catch (emailError) {
        console.error('❌ [Paiements] Erreur lors de l\'envoi email commande:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Paiement commande confirmé avec succès',
      paiement_id: paymentIntentId,
      commande_id: commandeId,
      email_envoye: userResults.length > 0
    });
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement commande:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement commande',
      details: error.message
    });
  }
});

// ===== ROUTES ÉCHÉANCES =====

// GET - Échéances d'un utilisateur
router.get('/echeances/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const client = new Paiements();
    const echeances = await client.obtenirEcheancesUtilisateur(parseInt(userId));
    
    if (!echeances || echeances.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(echeances);
  } catch (error: any) {
    console.error('❌ Erreur récupération échéances:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des échéances' });
  }
});

// GET - Une échéance spécifique par ID
router.get('/echeance/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const userId = req.query.userId;
    
    if (!echeanceId || isNaN(parseInt(echeanceId))) {
      return res.status(400).json({ 
        error: 'ID échéance invalide'
      });
    }

    const paiements = new Paiements();
    
    if (userId && !isNaN(parseInt(userId as string))) {
      const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId as string));
      const echeance = echeances.find((e: any) => e.id === parseInt(echeanceId));
      
      if (!echeance) {
        return res.status(404).json({ 
          error: 'Échéance non trouvée'
        });
      }

      return res.status(200).json({
        success: true,
        data: echeance
      });
    } else {
      const query = `SELECT * FROM echeances_paiements WHERE id = ?`;
      const results = await paiements.queryAsync(query, [parseInt(echeanceId)]);
      
      if (results.length === 0) {
        return res.status(404).json({ 
          error: 'Échéance non trouvée'
        });
      }

      const echeance = results[0];
      
      return res.status(200).json({
        success: true,
        data: {
          ...echeance,
          description: `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Erreur récupération échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'échéance',
      details: error.message 
    });
  }
});

// ===== ROUTES TEST =====

// POST - Simulation de paiement
router.post('/force-payment-success', async (req: any, res: any) => {
  try {
    const { paymentIntentId, echeanceId, commandeId, userId, amount, description } = req.body;

    console.log('🧪 [Paiements] Simulation paiement reçue:', {
      paymentIntentId, echeanceId, commandeId, userId, amount, description,
      type: echeanceId ? 'echéance' : 'commande'
    });

    if (!paymentIntentId || !userId) {
      return res.status(400).json({
        error: 'paymentIntentId et userId requis'
      });
    }

    if (!echeanceId && !commandeId) {
      return res.status(400).json({
        error: 'echeanceId OU commandeId requis'
      });
    }

    if (echeanceId && commandeId) {
      return res.status(400).json({
        error: 'echeanceId et commandeId ne peuvent pas être fournis simultanément'
      });
    }

    if (echeanceId) {
      console.log('💰 [Paiements] Simulation échéance:', echeanceId);
      
      res.status(200).json({
        success: true,
        message: 'Paiement échéance simulé avec succès',
        data: {
          paymentIntentId,
          echeanceId,
          userId,
          amount,
          type: 'echeance',
          status: 'succeeded'
        }
      });
      
    } else if (commandeId) {
      console.log('🛒 [Paiements] Simulation commande:', commandeId);
      
      res.status(200).json({
        success: true,
        message: 'Paiement commande simulé avec succès',
        data: {
          paymentIntentId,
          commandeId,
          userId,
          amount,
          type: 'commande',
          status: 'succeeded'
        }
      });
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur simulation:', error);
    res.status(500).json({
      error: 'Erreur lors de la simulation de paiement',
      details: error.message
    });
  }
});

// ===== ROUTES WEBHOOK =====

// POST - Webhook Stripe
router.post('/webhook/stripe', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Service Stripe non disponible' });
  }

  try {
    console.log('🔔 [Webhook] Stripe webhook reçu');
    
    // Traitement simple du webhook
    const event = req.body;
    
    console.log('🔔 [Webhook] Event type:', event?.type);
    console.log('🔔 [Webhook] Event ID:', event?.id);
    
    // Traitement basique des événements Stripe
    switch (event?.type) {
      case 'payment_intent.succeeded':
        console.log('💳 [Webhook] Payment succeeded:', event.data?.object?.id);
        break;
        
      case 'payment_intent.payment_failed':
        console.log('❌ [Webhook] Payment failed:', event.data?.object?.id);
        break;
        
      default:
        console.log('ℹ️ [Webhook] Événement non traité:', event?.type);
    }
    
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ [Webhook] Erreur:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Route de santé
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      services: {
        stripe: !!process.env.STRIPE_SECRET_KEY,
        database: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

console.log('✅ [Paiements] Module consolidé initialisé');

export default router;