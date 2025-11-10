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

// AJOUTÉ: Route manquante - POST /stripe/create-payment-intent
router.post('/stripe/create-payment-intent', async (req, res) => {
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

// AJOUTÉ: Route de confirmation d'échéance manquante (sans /stripe/)
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, echeanceId, userId, amount } = req.body;
    
    console.log('🎉 [Paiements] Confirmation paiement échéance via /confirm-payment:', {
      paymentIntentId, echeanceId, userId, amount
    });

    if (!paymentIntentId || !echeanceId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement'
      });
    }

    // CORRIGÉ: Vérifier stripe avant utilisation
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

    // AJOUTÉ: Vérifier si c'est le premier paiement AVANT de traiter le paiement
    const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));
    console.log(`🔍 [Paiements] Premier paiement pour utilisateur ${userId}: ${premierPaiement}`);

    // Mettre à jour le statut du paiement
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // Marquer l'échéance comme payée
    const echeanceResult = await paiements.marquerEcheancePayee(parseInt(echeanceId));

    // CORRIGÉ: Promotion automatique de visiteur à utilisateur si premier paiement
    let statutUpgrade = null;
    if (premierPaiement) {
      try {
        console.log(`🎊 [Paiements] Premier paiement détecté - Promotion automatique visiteur → utilisateur`);
        
        // Récupérer le statut actuel de l'utilisateur
        const statusActuelQuery = `
          SELECT u.status_id, s.nom_role as status_actuel
          FROM utilisateurs u
          LEFT JOIN status s ON u.status_id = s.id
          WHERE u.id = ?
        `;
        const statusActuelResult = await paiements.queryAsync(statusActuelQuery, [parseInt(userId)]);
        
        if (statusActuelResult.length > 0) {
          const statusActuel = statusActuelResult[0];
          console.log(`📊 [Paiements] Statut actuel utilisateur ${userId}:`, {
            status_id: statusActuel.status_id,
            status_nom: statusActuel.status_actuel
          });
          
          // Vérifier si l'utilisateur est bien visiteur
          if (statusActuel.status_actuel === 'visiteur') {
            // Récupérer l'ID du statut "utilisateur"
            const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
            const statutUtilisateurResult = await paiements.queryAsync(utilisateurStatusQuery, []);
            
            if (statutUtilisateurResult.length > 0) {
              const nouveauStatutId = statutUtilisateurResult[0].id;
              
              // Effectuer la promotion
              const updateUserStatusQuery = `
                UPDATE utilisateurs 
                SET status_id = ?, 
                    date_modification = NOW()
                WHERE id = ? AND status_id = ?
              `;
              
              const updateResult = await paiements.queryAsync(updateUserStatusQuery, [
                nouveauStatutId, 
                parseInt(userId), 
                statusActuel.status_id
              ]);
              
              if (updateResult.affectedRows > 0) {
                statutUpgrade = 'visiteur → utilisateur';
                console.log(`✅ [Paiements] PROMOTION RÉUSSIE: Utilisateur ${userId} promu de visiteur à utilisateur`);
                
                // AJOUTÉ: Log détaillé de la promotion
                console.log(`🎉 [Paiements] Détails promotion:`, {
                  userId: parseInt(userId),
                  ancienStatutId: statusActuel.status_id,
                  nouveauStatutId: nouveauStatutId,
                  ancienStatutNom: 'visiteur',
                  nouveauStatutNom: 'utilisateur',
                  premiereEcheance: echeanceId,
                  montantPremierPaiement: amount,
                  datePromotion: new Date().toISOString()
                });
                
              } else {
                console.warn(`⚠️ [Paiements] Aucune ligne mise à jour lors de la promotion pour utilisateur ${userId}`);
                statutUpgrade = 'visiteur (échec promotion)';
              }
            } else {
              console.error(`❌ [Paiements] Statut "utilisateur" non trouvé dans la table status`);
              statutUpgrade = 'visiteur (statut cible inexistant)';
            }
          } else {
            console.log(`ℹ️ [Paiements] L'utilisateur ${userId} n'est pas visiteur (statut: ${statusActuel.status_actuel}), pas de promotion nécessaire`);
            statutUpgrade = `${statusActuel.status_actuel} (déjà promu)`;
          }
        } else {
          console.error(`❌ [Paiements] Utilisateur ${userId} non trouvé pour vérification du statut`);
        }
        
      } catch (promotionError: any) {
        console.error('❌ [Paiements] Erreur lors de la promotion visiteur → utilisateur:', promotionError);
        statutUpgrade = 'visiteur (erreur promotion)';
        // Ne pas faire échouer le paiement si la promotion échoue
      }
    } else {
      console.log(`ℹ️ [Paiements] Pas le premier paiement pour utilisateur ${userId}, pas de promotion`);
    }

    // CORRIGÉ: Envoyer l'email avec TOUTES les variables de votre template
    try {
      const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
      const userResults = await paiements.queryAsync(userQuery, [userId]);
      
      if (userResults.length > 0) {
        const user = userResults[0];
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
        
        console.log('📧 [Paiements] Envoi email confirmation échéance à:', user.email);
        
        const emailClient = new EmailClient();
        
        // CORRIGÉ: Inclure les informations de promotion dans l'email
        const templateData = {
          userName: userName,
          amount: formatMontant(amount),
          paymentDate: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          currency: 'EUR',
          datePaiement: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          echeanceId: echeanceId.toString(),
          paymentIntentId: paymentIntentId,
          premierPaiement: premierPaiement,
          
          // AJOUTÉ: Variables spéciales pour le premier paiement
          ...(premierPaiement && {
            isFirstPayment: true,
            welcomeMessage: '🎉 Bienvenue ! Votre premier paiement a été confirmé avec succès.',
            statusUpgrade: statutUpgrade,
            newMemberBenefits: [
              'Accès complet aux équipements',
              'Participation aux événements membres',
              'Support prioritaire',
              'Remises exclusives'
            ].join(', ')
          }),
          
          // Variables additionnelles
          montantPaye: formatMontant(amount),
          transactionId: paymentIntentId,
          numeroEcheance: echeanceId.toString(),
          clubName: 'Club Manager',
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
        };
        
        console.log('📧 [Paiements] Template data avec promotion:', {
          premierPaiement,
          statutUpgrade,
          isFirstPayment: templateData.isFirstPayment || false
        });
        
        const emailResult = await emailClient.sendPaymentConfirmation(
          user.email,
          templateData,
          parseInt(userId)
        );
        
        if (emailResult.success) {
          console.log('✅ [Paiements] Email de confirmation échéance envoyé avec succès');
          if (premierPaiement && statutUpgrade?.includes('→')) {
            console.log('🎊 [Paiements] Email de bienvenue pour nouveau membre envoyé');
          }
        } else {
          console.error('❌ [Paiements] Erreur envoi email échéance:', emailResult.error);
        }
      } else {
        console.warn('⚠️ [Paiements] Utilisateur non trouvé pour l\'email échéance');
      }
    } catch (emailError) {
      console.error('❌ [Paiements] Erreur lors de l\'envoi email échéance:', emailError);
    }

    // AJOUTÉ: Message de réponse enrichi pour premier paiement
    let successMessage = 'Paiement confirmé avec succès';
    if (premierPaiement) {
      successMessage += '. 🎉 Félicitations pour votre premier paiement !';
      if (statutUpgrade?.includes('→')) {
        successMessage += ` Votre statut a été automatiquement mis à jour : ${statutUpgrade}.`;
        successMessage += ' Vous avez maintenant accès à tous les services membres.';
      }
    }

    res.status(200).json({
      success: true,
      message: successMessage,
      paiement_id: paymentIntentId,
      premier_paiement: premierPaiement,
      statut_upgrade: statutUpgrade,
      // AJOUTÉ: Informations supplémentaires pour le premier paiement
      ...(premierPaiement && {
        promotion_details: {
          ancien_statut: 'visiteur',
          nouveau_statut: statutUpgrade?.includes('→') ? 'utilisateur' : 'inchangé',
          promotion_reussie: statutUpgrade?.includes('→') || false,
          date_promotion: new Date().toISOString(),
          avantages_debloques: [
            'Accès complet aux équipements',
            'Participation aux événements',
            'Support prioritaire'
          ]
        }
      })
    });
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message
    });
  }
});

// AJOUTÉ: Route manquante - POST /stripe/confirm-payment
router.post('/stripe/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, echeanceId, userId, amount } = req.body;
    
    console.log('🎉 [Paiements] Confirmation paiement échéance via /stripe/confirm-payment:', {
      paymentIntentId, echeanceId, userId, amount
    });

    if (!paymentIntentId || !echeanceId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement'
      });
    }

    // CORRIGÉ: Vérifier stripe avant utilisation
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

    // AJOUTÉ: Vérifier si c'est le premier paiement AVANT de traiter
    const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));
    console.log(`🔍 [Paiements] Premier paiement pour utilisateur ${userId}: ${premierPaiement}`);

    // Mettre à jour le statut du paiement
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // Marquer l'échéance comme payée
    const echeanceResult = await paiements.marquerEcheancePayee(parseInt(echeanceId));

    // CORRIGÉ: Promotion automatique de visiteur à utilisateur si premier paiement
    let statutUpgrade = null;
    if (premierPaiement) {
      try {
        console.log(`🎊 [Paiements] Premier paiement détecté - Promotion automatique visiteur → utilisateur`);
        
        const statusActuelQuery = `
          SELECT u.status_id, s.nom_role as status_actuel
          FROM utilisateurs u
          LEFT JOIN status s ON u.status_id = s.id
          WHERE u.id = ?
        `;
        const statusActuelResult = await paiements.queryAsync(statusActuelQuery, [parseInt(userId)]);
        
        if (statusActuelResult.length > 0) {
          const statusActuel = statusActuelResult[0];
          
          if (statusActuel.status_actuel === 'visiteur') {
            const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
            const statutUtilisateurResult = await paiements.queryAsync(utilisateurStatusQuery, []);
            
            if (statutUtilisateurResult.length > 0) {
              const nouveauStatutId = statutUtilisateurResult[0].id;
              
              const updateUserStatusQuery = `
                UPDATE utilisateurs 
                SET status_id = ?, 
                    date_modification = NOW()
                WHERE id = ? AND status_id = ?
              `;
              
              const updateResult = await paiements.queryAsync(updateUserStatusQuery, [
                nouveauStatutId, 
                parseInt(userId), 
                statusActuel.status_id
              ]);
              
              if (updateResult.affectedRows > 0) {
                statutUpgrade = 'visiteur → utilisateur';
                console.log(`✅ [Paiements] PROMOTION RÉUSSIE (via Stripe): Utilisateur ${userId} promu`);
              }
            }
          } else {
            statutUpgrade = `${statusActuel.status_actuel} (déjà promu)`;
          }
        }
      } catch (promotionError: any) {
        console.error('❌ [Paiements] Erreur promotion (via Stripe):', promotionError);
        statutUpgrade = 'visiteur (erreur promotion)';
      }
    }

    // Récupérer et envoyer email avec les mêmes variables
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);
    
    if (userResults.length > 0) {
      const user = userResults[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
      
      try {
        const emailClient = new EmailClient();
        
        const templateData = {
          userName: userName,
          amount: formatMontant(amount),
          paymentDate: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          currency: 'EUR',
          datePaiement: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          echeanceId: echeanceId.toString(),
          paymentIntentId: paymentIntentId,
          premierPaiement: premierPaiement,
          
          // AJOUTÉ: Même logique pour premier paiement
          ...(premierPaiement && {
            isFirstPayment: true,
            welcomeMessage: '🎉 Bienvenue ! Votre premier paiement a été confirmé avec succès.',
            statusUpgrade: statutUpgrade,
            newMemberBenefits: 'Accès complet aux équipements, participation aux événements, support prioritaire'
          }),
          
          montantPaye: formatMontant(amount),
          transactionId: paymentIntentId,
          numeroEcheance: echeanceId.toString(),
          isFirstPayment: premierPaiement,
          clubName: 'Club Manager',
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
        };
        
        await emailClient.sendPaymentConfirmation(
          user.email,
          templateData,
          parseInt(userId)
        );
      } catch (emailError) {
        console.error('❌ [Paiements] Erreur envoi email confirmation:', emailError);
      }
    }

    // AJOUTÉ: Message enrichi pour premier paiement
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
      premier_paiement: premierPaiement,
      statut_upgrade: statutUpgrade
    });
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement via /stripe/confirm-payment:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message
    });
  }
});

// AJOUTÉ: Route manquante - POST /stripe/create-payment-intent-commande
router.post('/stripe/create-payment-intent-commande', async (req, res) => {
  // CORRIGÉ: Vérifier stripe avant utilisation
  if (!stripe) {
    return res.status(503).json({ error: 'Service Stripe non disponible' });
  }

  try {
    const { amount, currency = 'eur', commande, description } = req.body;
    
    console.log('🛒 [Paiements] Création PaymentIntent pour commande magasin via /stripe/:', { 
      amount, 
      currency, 
      commande: {
        utilisateur_id: commande?.utilisateur_id,
        total: commande?.total,
        articlesCount: commande?.articles?.length,
        articlesDetail: commande?.articles
      },
      description,
      fullRequestBody: req.body
    });

    // CORRIGÉ: Validation plus robuste des données d'entrée
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      console.error('❌ [Paiements] Montant invalide:', { amount, type: typeof amount });
      return res.status(400).json({ 
        error: 'Montant invalide ou manquant',
        received: { amount, type: typeof amount },
        expected: 'Nombre entier positif (centimes)'
      });
    }

    if (!commande || typeof commande !== 'object') {
      console.error('❌ [Paiements] Commande invalide:', { commande, type: typeof commande });
      return res.status(400).json({ 
        error: 'Objet commande manquant ou invalide',
        received: { commande: !!commande, type: typeof commande }
      });
    }

    if (!commande.utilisateur_id || isNaN(Number(commande.utilisateur_id)) || Number(commande.utilisateur_id) <= 0) {
      console.error('❌ [Paiements] utilisateur_id invalide:', { utilisateur_id: commande.utilisateur_id });
      return res.status(400).json({ 
        error: 'utilisateur_id manquant ou invalide dans la commande',
        received: { 
          utilisateur_id: commande.utilisateur_id, 
          type: typeof commande.utilisateur_id 
        },
        expected: 'Nombre entier positif'
      });
    }

    // CORRIGÉ: Déplacer les calculs de montant et total AVANT leur utilisation
    const montantEuros = parseFloat((Number(amount) / 100).toFixed(2));
    console.log('💰 [Paiements] Montant validé:', {
      amount_centimes: amount,
      montant_euros: montantEuros
    });

    if (isNaN(montantEuros) || montantEuros <= 0) {
      return res.status(400).json({ 
        error: 'Montant invalide après conversion',
        debug: { amount, montantEuros },
        expected: 'Montant positif en centimes'
      });
    }

    // CORRIGÉ: Déclarer les variables communes une seule fois au début
    const commandeTotal = commande?.total || montantEuros;
    const paiementsClient = new Paiements();
    const commandeDate = new Date().toISOString();

    // CRITIQUE: Vérification des articles avec fallback depuis userData côté serveur
    let articles = commande.articles;
    
    console.log('🔍 [Paiements] Vérification articles reçus:', {
      hasArticles: !!articles,
      isArray: Array.isArray(articles),
      articlesType: typeof articles,
      articlesLength: articles?.length || 0,
      articlesContent: articles,
      commandeKeys: Object.keys(commande)
    });

    // NOUVEAU: Si pas d'articles dans commande, essayer récupération étendue
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      console.log('⚠️ [Paiements] Articles manquants dans commande, tentative récupération étendue...');
      
      try {
        // FALLBACK 1: Chercher dans d'autres propriétés de la requête
        if (req.body.articles && Array.isArray(req.body.articles) && req.body.articles.length > 0) {
          articles = req.body.articles;
          console.log('✅ [Paiements] Articles trouvés dans req.body.articles:', articles.length);
        } 
        // FALLBACK 2: Chercher dans items
        else if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
          articles = req.body.items;
          console.log('✅ [Paiements] Articles trouvés dans req.body.items:', articles.length);
        }
        // FALLBACK 3: Si un ID de commande est fourni, récupérer directement ses articles
        else if (commande.id) {
          console.log('🔍 [Paiements] ID de commande fourni, récupération directe des articles...', commande.id);
          
          // CORRIGÉ: Requête directe sur la commande spécifique avec ID fourni
          const commandeSpecifiqueQuery = `
            SELECT ca.article_id, ca.taille_id, ca.quantite, ca.prix
            FROM commande_articles ca
            WHERE ca.commande_id = ?
          `;
          
          const articlesExistants = await paiementsClient.queryAsync(commandeSpecifiqueQuery, [parseInt(commande.id)]);
          console.log('🔍 [Paiements] Articles trouvés pour commande', commande.id, ':', articlesExistants);
          
          if (articlesExistants.length > 0) {
            articles = articlesExistants.map((row: any) => ({
              article_id: row.article_id,
              taille_id: row.taille_id,
              quantite: row.quantite,
              prix: row.prix
            }));
            
            console.log('✅ [Paiements] Articles récupérés depuis commande spécifique:', {
              commandeId: commande.id,
              count: articles.length,
              sample: articles[0]
            });
            
            // NOUVEAU: Utiliser cet ID de commande existant au lieu d'en créer une nouvelle
            const commandeIdExistant = parseInt(commande.id);
            
            // Créer directement le PaymentIntent sans recréer de commande
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(Number(amount)),
              currency: currency,
              description: description || `Commande magasin #${commandeIdExistant} - ${articles.length} article(s)`,
              metadata: {
                utilisateur_id: String(commande.utilisateur_id),
                commande_id: String(commandeIdExistant),
                commande_data: JSON.stringify({
                  articles: articles,
                  total: commandeTotal,
                  existing_command: true
                }),
                type: 'commande_magasin',
                montant_euros: String(montantEuros),
                date_creation: new Date().toISOString()
              },
              automatic_payment_methods: {
                enabled: true,
              },
            });

            console.log('✅ [Paiements] PaymentIntent créé pour commande existante:', paymentIntent.id);

            // Enregistrer le paiement pour la commande existante
            try {
              const paiementResult = await paiementsClient.creerPaiement({
                commande_id: commandeIdExistant,
                utilisateur_id: Number(commande.utilisateur_id),
                montant: montantEuros,
                methode_paiement: 'stripe',
                stripe_payment_intent_id: paymentIntent.id,
                statut: 'en_attente',
                description: description || `Paiement commande existante #${commandeIdExistant}`
              });

              console.log('✅ [Paiements] Paiement créé pour commande existante:', paiementResult.id);

              return res.status(200).json({
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id,
                commande_id: commandeIdExistant,
                paiement_id: paiementResult.id,
                metadata: paymentIntent.metadata,
                debug: {
                  articlesTraites: articles.length,
                  commandeExistante: true,
                  commandeId: commandeIdExistant,
                  total: commandeTotal,
                  success: true
                }
              });

            } catch (paiementError: any) {
              console.error('❌ [Paiements] Erreur création paiement pour commande existante:', paiementError);
              
              return res.status(200).json({
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id,
                commande_id: commandeIdExistant,
                paiement_id: null,
                warning: 'PaymentIntent créé mais erreur d\'enregistrement paiement',
                metadata: paymentIntent.metadata,
                debug: {
                  articlesTraites: articles.length,
                  commandeExistante: true,
                  commandeId: commandeIdExistant,
                  error: paiementError.message
                }
              });
            }
          } else {
            console.warn('⚠️ [Paiements] Commande spécifique trouvée mais sans articles:', commande.id);
          }
        } 
        // FALLBACK 4: Chercher une commande existante pour cet utilisateur (logique originale améliorée)
        else if (commande.utilisateur_id) {
          console.log('🔍 [Paiements] Tentative récupération depuis dernières commandes utilisateur...');
          
          // CORRIGÉ: Requête améliorée qui cherche dans les commandes récentes
          const dernieresCommandesQuery = `
            SELECT c.id, ca.article_id, ca.taille_id, ca.quantite, ca.prix,
                   c.date_commande, c.statut
            FROM commandes c
            LEFT JOIN commande_articles ca ON c.id = ca.commande_id
            WHERE c.utilisateur_id = ? 
              AND c.statut IN ('en_attente', 'en attente', '')
              AND c.date_commande >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            ORDER BY c.date_commande DESC, c.id DESC
            LIMIT 20
          `;
          
          const commandesRecentes = await paiementsClient.queryAsync(dernieresCommandesQuery, [commande.utilisateur_id]);
          console.log('🔍 [Paiements] Commandes récentes trouvées:', commandesRecentes.length);
          
          if (commandesRecentes.length > 0) {
            // Filtrer les lignes avec des articles et prendre la commande la plus récente
            const articlesRecents = commandesRecentes.filter((row: any) => row.article_id);
            
            if (articlesRecents.length > 0) {
              // Prendre tous les articles de la commande la plus récente
              const dernierCommandeId = articlesRecents[0].id;
              const articlesDerrièreCommande = articlesRecents
                .filter((row: any) => row.id === dernierCommandeId)
                .map((row: any) => ({
                  article_id: row.article_id,
                  taille_id: row.taille_id,
                  quantite: row.quantite,
                  prix: row.prix
                }));
              
              if (articlesDerrièreCommande.length > 0) {
                articles = articlesDerrièreCommande;
                console.log('✅ [Paiements] Articles récupérés depuis commande récente:', {
                  count: articles.length,
                  commandeId: dernierCommandeId,
                  dateCommande: articlesRecents[0].date_commande,
                  sample: articles[0]
                });
                
                // NOUVEAU: Utiliser cette commande existante
                const commandeIdExistant = dernierCommandeId;
                
                // Créer le PaymentIntent pour la commande existante
                const paymentIntent = await stripe.paymentIntents.create({
                  amount: Math.round(Number(amount)),
                  currency: currency,
                  description: description || `Paiement commande #${commandeIdExistant} - ${articles.length} article(s)`,
                  metadata: {
                    utilisateur_id: String(commande.utilisateur_id),
                    commande_id: String(commandeIdExistant),
                    commande_data: JSON.stringify({
                      articles: articles,
                      total: commandeTotal,
                      recovered_from_recent: true
                    }),
                    type: 'commande_magasin',
                    montant_euros: String(montantEuros),
                    date_creation: new Date().toISOString()
                  },
                  automatic_payment_methods: {
                    enabled: true,
                  },
                });

                console.log('✅ [Paiements] PaymentIntent créé pour commande récente récupérée:', paymentIntent.id);

                // Enregistrer le paiement
                try {
                  const paiementResult = await paiementsClient.creerPaiement({
                    commande_id: commandeIdExistant,
                    utilisateur_id: Number(commande.utilisateur_id),
                    montant: montantEuros,
                    methode_paiement: 'stripe',
                    stripe_payment_intent_id: paymentIntent.id,
                    statut: 'en_attente',
                    description: description || `Paiement commande récupérée #${commandeIdExistant}`
                  });

                  console.log('✅ [Paiements] Paiement créé pour commande récupérée:', paiementResult.id);

                  return res.status(200).json({
                    client_secret: paymentIntent.client_secret,
                    payment_intent_id: paymentIntent.id,
                    commande_id: commandeIdExistant,
                    paiement_id: paiementResult.id,
                    metadata: paymentIntent.metadata,
                    debug: {
                      articlesTraites: articles.length,
                      commandeRecuperee: true,
                      commandeId: commandeIdExistant,
                      total: commandeTotal,
                      success: true
                    }
                  });

                } catch (paiementError: any) {
                  console.error('❌ [Paiements] Erreur paiement commande récupérée:', paiementError);
                  
                  return res.status(200).json({
                    client_secret: paymentIntent.client_secret,
                    payment_intent_id: paymentIntent.id,
                    commande_id: commandeIdExistant,
                    paiement_id: null,
                    warning: 'PaymentIntent créé mais erreur paiement',
                    metadata: paymentIntent.metadata,
                    debug: {
                      articlesTraites: articles.length,
                      commandeRecuperee: true,
                      commandeId: commandeIdExistant,
                      error: paiementError.message
                    }
                  });
                }
              }
            } else {
              console.warn('⚠️ [Paiements] Commandes récentes trouvées mais sans articles');
            }
          } else {
            console.warn('⚠️ [Paiements] Aucune commande récente trouvée pour utilisateur:', commande.utilisateur_id);
          }
        }
        
        // FALLBACK 5: Si toujours rien, retourner une erreur détaillée avec suggestions
        if (!articles || !Array.isArray(articles) || articles.length === 0) {
          console.error('❌ [Paiements] Aucun article trouvé après tous les fallbacks étendus!');
          
          return res.status(400).json({
            error: 'Articles manquants dans la commande',
            debug: {
              commandeArticles: commande.articles,
              bodyArticles: req.body.articles,
              bodyItems: req.body.items,
              commandeId: commande.id,
              utilisateur_id: commande.utilisateur_id,
              suggestion: 'La commande semble avoir été créée mais les articles ont été perdus en route'
            },
            recovery_options: {
              message: 'Veuillez retourner au panier et réessayer',
              fallback_url: '/magasin',
              technical_note: 'Les articles ont été créés avec la commande mais ne sont pas transmis dans cette requête'
            }
          });
        }
        
      } catch (fallbackError) {
        console.error('❌ [Paiements] Erreur récupération articles fallback étendue:', fallbackError);
        return res.status(500).json({
          error: 'Articles manquants et erreur lors de la récupération étendue',
          details: fallbackError instanceof Error ? fallbackError.message : 'Erreur inconnue'
        });
      }
    }

    // Validation finale des articles
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      console.error('❌ [Paiements] Articles toujours vides après tous les fallbacks');
      return res.status(400).json({ 
        error: 'Articles manquants ou invalides dans la commande',
        debug: {
          message: 'Aucun article trouvé après toutes les tentatives de récupération',
          received: {
            commandeArticles: commande.articles,
            bodyArticles: req.body.articles,
            bodyItems: req.body.items
          },
          expected: 'Tableau non vide d\'articles avec article_id, taille_id, quantite, prix'
        }
      });
    }

    console.log(`✅ [Paiements] Articles finaux validés: ${articles.length} articles`);
    
    try {
      let commandeId = null;

      console.log('📦 [Paiements] Création commande AVEC articles via classe Magasin...');
      
      // Utiliser la classe Magasin pour créer la commande
      const magasin = new Magasin();
      const commandeResult = await magasin.creerCommande(
        Number(commande.utilisateur_id),
        articles, // Les articles validés
        commandeTotal,
        commandeDate,
        'en_attente'
      );
      
      console.log('📦 [Paiements] Résultat création commande:', commandeResult);
      
      if (!commandeResult.isConfirm) {
        console.error('❌ [Paiements] Erreur création commande:', commandeResult.message);
        return res.status(500).json({ 
          error: 'Erreur lors de la création de la commande',
          details: commandeResult.message,
          debug: {
            utilisateur_id: commande.utilisateur_id,
            articles_count: articles.length,
            total: commandeTotal,
            timestamp: commandeDate
          }
        });
      }
      
      // Récupérer l'ID de la commande créée
      if ('id' in commandeResult && (commandeResult as any).id) {
        commandeId = (commandeResult as any).id;
      } else if ('insertId' in commandeResult && (commandeResult as any).insertId) {
        commandeId = (commandeResult as any).insertId;
      } else {
        // Fallback: recherche par utilisateur et timestamp
        const commandeQuery = `
          SELECT id FROM commandes 
          WHERE utilisateur_id = ? 
            AND ABS(TIMESTAMPDIFF(SECOND, date_commande, ?)) <= 60
          ORDER BY date_commande DESC 
          LIMIT 1
        `;
        
        const commandeResults = await paiementsClient.queryAsync(commandeQuery, [commande.utilisateur_id, commandeDate]);
        
        if (commandeResults.length > 0) {
          commandeId = commandeResults[0].id;
          console.log('✅ [Paiements] ID commande récupéré par recherche:', commandeId);
        }
      }
      
      if (!commandeId) {
        console.error('❌ [Paiements] Impossible de récupérer l\'ID de la commande créée');
        return res.status(500).json({ 
          error: 'Impossible de récupérer l\'ID de la commande créée',
          debug: {
            commandeResult: commandeResult,
            hasId: 'id' in commandeResult,
            hasInsertId: 'insertId' in commandeResult
          }
        });
      }
      
      console.log('✅ [Paiements] Commande créée, ID:', commandeId);

      // Créer le PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount)),
        currency: currency,
        description: description || `Commande magasin #${commandeId} - ${articles.length} article(s)`,
        metadata: {
          utilisateur_id: String(commande.utilisateur_id),
          commande_id: String(commandeId),
          commande_data: JSON.stringify({
            articles: articles,
            total: commandeTotal,
            originalArticlesCount: commande.articles?.length || 0
          }),
          type: 'commande_magasin',
          montant_euros: String(montantEuros),
          date_creation: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('✅ [Paiements] PaymentIntent créé:', paymentIntent.id);

      // Enregistrer le paiement
      try {
        const paiementResult = await paiementsClient.creerPaiement({
          commande_id: commandeId,
          utilisateur_id: Number(commande.utilisateur_id),
          montant: montantEuros,
          methode_paiement: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          statut: 'en_attente',
          description: description || `Commande magasin #${commandeId}`
        });

        console.log('✅ [Paiements] Paiement créé:', paiementResult.id);

        res.status(200).json({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          commande_id: commandeId,
          paiement_id: paiementResult.id,
          metadata: paymentIntent.metadata,
          debug: {
            articlesTraites: articles.length,
            articlesOriginaux: commande.articles?.length || 0,
            commandeId: commandeId,
            total: commandeTotal,
            success: true
          }
        });

      } catch (paiementError: any) {
        console.error('❌ [Paiements] Erreur création paiement:', paiementError);
        
        // Retourner le PaymentIntent même si l'enregistrement en base échoue
        res.status(200).json({
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          commande_id: commandeId,
          paiement_id: null,
          warning: 'PaymentIntent créé mais erreur d\'enregistrement paiement en base',
          metadata: paymentIntent.metadata,
          debug: {
            articlesTraites: articles.length,
            commandeId: commandeId,
            error: paiementError.message
          }
        });
      }

    } catch (dbError: any) {
      console.error('❌ [Paiements] Erreur création commande:', dbError);
      return res.status(500).json({ 
        error: 'Erreur lors de la création de la commande',
        details: dbError.message,
        debug: {
          utilisateur_id: commande.utilisateur_id,
          articles_count: articles.length,
          total: commandeTotal,
          timestamp: commandeDate
        }
      });
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur création PaymentIntent commande via /stripe/:', error);
    
    res.status(500).json({ 
      error: 'Erreur lors de la création du PaymentIntent pour commande',
      details: error.message,
      debug: {
        hasStripe: !!stripe,
        requestBody: {
          hasAmount: !!req.body.amount,
          hasCommande: !!req.body.commande,
          hasUserId: !!req.body.commande?.utilisateur_id,
          articlesCount: req.body.commande?.articles?.length || 0,
          fullBody: req.body
        },
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

// AJOUTÉ: Route manquante - POST /confirm-payment-commande (sans préfixe /stripe/)
router.post('/confirm-payment-commande', async (req, res) => {
  try {
    const { paymentIntentId, commandeId, userId } = req.body;
    
    console.log('🛒 [Paiements] Confirmation paiement commande via /confirm-payment-commande:', {
      paymentIntentId, commandeId, userId
    });

    if (!paymentIntentId || !commandeId || !userId) {
      return res.status(400).json({
        error: 'Données manquantes pour la confirmation de paiement commande'
      });
    }

    // CORRIGÉ: Vérifier stripe avant utilisation
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

    // Mettre à jour le statut de la commande
    const updateCommandeQuery = `
      UPDATE commandes 
      SET statut = 'payée' 
      WHERE id = ?
    `;
    await paiements.queryAsync(updateCommandeQuery, [commandeId]);

    // Envoyer email de confirmation de commande
    try {
      const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
      const userResults = await paiements.queryAsync(userQuery, [userId]);
      
      if (userResults.length > 0) {
        const user = userResults[0];
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Membre';
        
        // Récupérer les détails de la commande
        const commandeQuery = `
          SELECT 
            c.id, c.total, c.numero_commande,
            COUNT(ca.id) as nb_articles,
            GROUP_CONCAT(CONCAT(a.nom, ' (', t.nom, ') x', ca.quantite) SEPARATOR ', ') as articles_details
          FROM commandes c
          LEFT JOIN commande_articles ca ON c.id = ca.commande_id
          LEFT JOIN articles a ON ca.article_id = a.id
          LEFT JOIN tailles t ON ca.taille_id = t.id
          WHERE c.id = ?
          GROUP BY c.id
        `;
        const commandeResults = await paiements.queryAsync(commandeQuery, [commandeId]);
        
        if (commandeResults.length > 0) {
          const commande = commandeResults[0];
          
          try {
            const emailClient = new EmailClient();
            
            const templateData = {
              userName: userName,
              numeroCommande: commande.numero_commande || commandeId.toString(),
              totalCommande: formatMontant(commande.total || 0),
              articlesDetails: commande.articles_details || 'Articles non détaillés',
              dateCommande: new Date().toLocaleDateString('fr-FR'),
              statutCommande: 'Confirmée et payée',
              paymentIntentId: paymentIntentId,
              nbArticles: (commande.nb_articles || 0).toString(),
              
              // Variables par défaut pour commande
              delaiPreparation: '24-48 heures',
              lieuRetrait: 'Accueil du club',
              horaires: 'Lundi-Vendredi: 9h-18h',
              clubName: 'Club Manager',
              currentYear: new Date().getFullYear().toString(),
              supportEmail: process.env.SUPPORT_EMAIL || 'support@clubmanager.com'
            };
            
            await emailClient.sendOrderConfirmation(
              user.email,
              templateData,
              parseInt(userId)
            );
            
            console.log('✅ [Paiements] Email de confirmation commande envoyé');
            
          } catch (emailError) {
            console.error('❌ [Paiements] Erreur envoi email commande:', emailError);
          }
        }
      }
    } catch (emailError) {
      console.error('❌ [Paiements] Erreur récupération données email:', emailError);
    }

    console.log('✅ [Paiements] Commande confirmée et payée');

    res.status(200).json({
      success: true,
      message: 'Commande payée avec succès',
      payment_intent_id: paymentIntentId,
      commande_id: commandeId,
      email_envoye: true
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur confirmation paiement commande:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement commande',
      details: error.message 
    });
  }
});

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
  // CORRIGÉ: Vérifier stripe avant utilisation
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

console.log('✅ [Paiements] Module consolidé initialisé (architecture unifiée)');

export default router;

// ===== ROUTES ÉCHEANCES =====

// AJOUTÉ: Routes pour les échéances sous /paiements/echeances/
router.get('/echeances/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 [Paiements] GET /echeances/${userId} - Début traitement`);
    
    if (!userId || isNaN(parseInt(userId))) {
      console.error(`❌ [Paiements] ID utilisateur invalide: ${userId}`);
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const paiements = new Paiements();
    console.log(`🔍 [Paiements] Appel de obtenirEcheancesUtilisateur(${userId})`);
    
    const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
    
    console.log(`🔍 [Paiements] Résultat de obtenirEcheancesUtilisateur:`, echeances);
    console.log(`🔍 [Paiements] Type:`, typeof echeances, 'Array?', Array.isArray(echeances));
    console.log(`🔍 [Paiements] Longueur:`, echeances?.length);

    if (!echeances || echeances.length === 0) {
      console.log(`⚠️ [Paiements] Aucune échéance trouvée pour l'utilisateur ${userId}, retour tableau vide`);
      return res.status(200).json([]); // Retourner un tableau vide plutôt qu'une 404
    }

    console.log(`✅ [Paiements] Retour de ${echeances.length} échéances pour l'utilisateur ${userId}`);
    res.status(200).json(echeances);
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur lors de la récupération des échéances:', error);
    console.error('❌ [Paiements] Stack trace:', error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des échéances' });
  }
});

// AJOUTÉ: Route pour une échéance spécifique
router.get('/echeances/detail/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const userId = req.query.userId;
    
    console.log(`🔐 [Paiements] Vérification accès sécurisé échéance ${echeanceId} pour utilisateur ${userId}`);
    
    if (!echeanceId || isNaN(parseInt(echeanceId))) {
      return res.status(400).json({ 
        error: 'ID échéance invalide',
        echeanceId: echeanceId
      });
    }

    const paiements = new Paiements();
    
    // SÉCURITÉ RENFORCÉE: Si userId fourni, vérification stricte d'appartenance
    if (userId && !isNaN(parseInt(userId as string))) {
      console.log(`🛡️ [Paiements] Vérification stricte - échéance ${echeanceId} doit appartenir à utilisateur ${userId}`);
      
      // 1. Récupérer TOUTES les échéances de cet utilisateur
      const echeancesUtilisateur = await paiements.obtenirEcheancesUtilisateur(parseInt(userId as string));
      console.log(`📋 [Paiements] Utilisateur ${userId} a ${echeancesUtilisateur.length} échéances`);
      
      // 2. Vérifier que l'échéance demandée est dans cette liste
      const echeanceAutorisee = echeancesUtilisateur.find((e: any) => e.id === parseInt(echeanceId));
      
      if (!echeanceAutorisee) {
        console.error(`❌ [Paiements] SÉCURITÉ: Échéance ${echeanceId} n'appartient pas à l'utilisateur ${userId}`);
        console.error(`📋 [Paiements] Échéances autorisées:`, echeancesUtilisateur.map((e: any) => ({ id: e.id, montant: e.montant })));
        
        return res.status(403).json({ 
          error: 'Accès refusé - Cette échéance ne vous appartient pas',
          debug: {
            echeanceId: parseInt(echeanceId),
            userId: parseInt(userId as string),
            message: 'Échéance non trouvée dans la liste des échéances autorisées pour cet utilisateur'
          }
        });
      }

      console.log(`✅ [Paiements] Accès autorisé - Échéance ${echeanceId} appartient bien à l'utilisateur ${userId}`);
      
      return res.status(200).json({
        success: true,
        data: echeanceAutorisee,
        security: {
          access_verified: true,
          user_id: parseInt(userId as string),
          echeance_owner: true
        }
      });
    } else {
      // ACCÈS SANS VÉRIFICATION UTILISATEUR (moins sécurisé, pour compatibilité)
      console.warn(`⚠️ [Paiements] Accès échéance ${echeanceId} sans vérification utilisateur (moins sécurisé)`);
      
      try {
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
            description: echeance.description || `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`,
            utilisateur_autorise: false, // Non vérifié
            verification_passed: false
          },
          security: {
            access_verified: false,
            user_id: null,
            echeance_owner: false,
            warning: 'Accès sans vérification utilisateur'
          }
        });
      } catch (dbError: any) {
        console.error(`❌ [Paiements] Erreur DB lors de la recherche directe:`, dbError);
        return res.status(500).json({ 
          error: 'Erreur lors de la recherche de l\'échéance',
          details: dbError.message 
        });
      }
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur récupération échéance sécurisée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'échéance',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route POST pour créer une échéance
router.post('/echeances', verifyToken, async (req: any, res: any) => {
  try {
    const { utilisateur_id, abonnement_id, montant, date_echeance, statut = 'en attente' } = req.body;
    
    console.log(`📝 [Paiements] Création nouvelle échéance:`, req.body);
    
    if (!utilisateur_id || !montant || !date_echeance) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        required: ['utilisateur_id', 'montant', 'date_echeance']
      });
    }

    const paiements = new Paiements();
    
    const echeanceCreee = await paiements.queryAsync(
      'INSERT INTO echeances_paiements (utilisateur_id, abonnement_id, date_echeance, montant, statut) VALUES (?, ?, ?, ?, ?)',
      [utilisateur_id, abonnement_id, date_echeance, montant, 'en attente']
    );

    // Récupérer l'échéance créée
    const echeanceCreeeDetail = await paiements.queryAsync(
      `SELECT * FROM echeances_paiements WHERE id = ?`, 
      [echeanceCreee.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Échéance créée avec succès',
      data: echeanceCreeeDetail[0]
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur création échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'échéance',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route PUT pour mettre à jour une échéance
router.put('/echeances/:id', verifyToken, async (req: any, res: any) => {
  try {
    const echeanceId = parseInt(req.params.id);
    const updates = req.body;
    
    console.log(`📝 [Paiements] Mise à jour échéance ${echeanceId}:`, updates);
    
    if (isNaN(echeanceId)) {
      return res.status(400).json({ 
        error: 'ID échéance invalide' 
      });
    }

    const paiements = new Paiements();
    
    // Vérifier que l'échéance existe
    const existingEcheance = await paiements.queryAsync(
      'SELECT * FROM echeances_paiements WHERE id = ?',
      [echeanceId]
    );
    
    if (existingEcheance.length === 0) {
      return res.status(404).json({ 
        error: 'Échéance non trouvée' 
      });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const allowedFields = ['montant', 'date_echeance', 'statut', 'date_paiement'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.keys(updates).forEach(field => {
      if (allowedFields.includes(field) && updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun champ valide à mettre à jour',
        allowedFields 
      });
    }
    
    updateValues.push(echeanceId);
    
    const updateQuery = `
      UPDATE echeances_paiements 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    const results = await paiements.queryAsync(updateQuery, updateValues);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Échéance non trouvée ou non modifiée' 
      });
    }
    
    // Récupérer l'échéance mise à jour
    const echeanceMiseAJour = await paiements.queryAsync(
      'SELECT * FROM echeances_paiements WHERE id = ?',
      [echeanceId]
    );
    
    console.log(`✅ [Paiements] Échéance ${echeanceId} mise à jour avec succès`);
    
    res.status(200).json({
      success: true,
      message: 'Échéance mise à jour avec succès',
      data: echeanceMiseAJour[0]
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur mise à jour échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de l\'échéance',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route de debug pour diagnostiquer le problème spécifique
router.get('/debug/echeance/:echeanceId/user/:userId', async (req, res) => {
  try {
    const { echeanceId, userId } = req.params;
    
    console.log(`🔍 [Debug] Diagnostic échéance ${echeanceId} pour utilisateur ${userId}`);
    
    const paiements = new Paiements();
    
    // 1. Vérifier si l'échéance existe dans la base
    const echeanceExisteQuery = `SELECT * FROM echeances_paiements WHERE id = ?`;
    const echeanceExiste = await paiements.queryAsync(echeanceExisteQuery, [parseInt(echeanceId)]);
    
    // 2. Vérifier si l'utilisateur existe
    const userExisteQuery = `SELECT id, first_name, last_name, email FROM utilisateurs WHERE id = ?`;
    const userExiste = await paiements.queryAsync(userExisteQuery, [parseInt(userId)]);
    
    // 3. Récupérer toutes les échéances de cet utilisateur
    const toutesEcheancesQuery = `SELECT * FROM echeances_paiements WHERE utilisateur_id = ?`;
    const toutesEcheances = await paiements.queryAsync(toutesEcheancesQuery, [parseInt(userId)]);
    
    // 4. Récupérer les 10 dernières échéances de la base pour contexte
    const dernieresEcheancesQuery = `
      SELECT ep.*, u.first_name, u.last_name 
      FROM echeances_paiements ep 
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id 
      ORDER BY ep.id DESC 
      LIMIT 10
    `;
    const dernieresEcheances = await paiements.queryAsync(dernieresEcheancesQuery, []);
    
    const diagnostic = {
      echeance_recherchee: {
        id: parseInt(echeanceId),
        existe: echeanceExiste.length > 0,
        details: echeanceExiste[0] || null,
        appartient_utilisateur: echeanceExiste.length > 0 && echeanceExiste[0].utilisateur_id === parseInt(userId)
      },
      utilisateur: {
        id: parseInt(userId),
        existe: userExiste.length > 0,
        details: userExiste[0] || null
      },
      echeances_utilisateur: {
        total: toutesEcheances.length,
        liste: toutesEcheances.map((e: any) => ({
          id: e.id,
          montant: e.montant,
          statut: e.statut,
          date_echeance: e.date_echeance
        }))
      },
      contexte_general: {
        dernieres_echeances_base: dernieresEcheances.map((e: any) => ({
          id: e.id,
          utilisateur_id: e.utilisateur_id,
          utilisateur_nom: `${e.first_name} ${e.last_name}`,
          montant: e.montant,
          statut: e.statut
        }))
      },
      diagnostic_final: {
        probleme_identifie: echeanceExiste.length === 0 ? 'ECHEANCE_INEXISTANTE' : 
                            echeanceExiste[0].utilisateur_id !== parseInt(userId) ? 'ECHEANCE_AUTRE_UTILISATEUR' : 
                            'OK',
        solution_suggeree: echeanceExiste.length === 0 ? 
          `Utiliser une échéance existante parmi: ${toutesEcheances.map((e: any) => e.id).join(', ')}` :
          echeanceExiste[0].utilisateur_id !== parseInt(userId) ? 
          `Cette échéance appartient à l'utilisateur ${echeanceExiste[0].utilisateur_id}, pas ${userId}` :
          'Échéance valide'
      }
    };
    
    console.log('🔍 [Debug] Diagnostic complet:', diagnostic);
    
    res.status(200).json({
      success: true,
      diagnostic,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [Debug] Erreur diagnostic échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors du diagnostic',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route pour lister toutes les échéances d'un utilisateur avec plus de détails
router.get('/debug/user/:userId/echeances', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 [Debug] Liste complète des échéances pour utilisateur ${userId}`);
    
    const paiements = new Paiements();
    
    // Requête détaillée avec jointures
    const echeancesDetailleesQuery = `
      SELECT 
        ep.*,
        u.first_name,
        u.last_name,
        u.email,
        pt.nom_plan,
        pt.prix as prix_plan
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      LEFT JOIN plans_tarifaires pt ON ep.abonnement_id = pt.id
      WHERE ep.utilisateur_id = ?
      ORDER BY ep.date_echeance DESC
    `;
    
    const echeancesDetaillees = await paiements.queryAsync(echeancesDetailleesQuery, [parseInt(userId)]);
    
    // Statistiques
    const stats = {
      total_echeances: echeancesDetaillees.length,
      en_attente: echeancesDetaillees.filter((e: any) => e.statut === 'en attente').length,
      payees: echeancesDetaillees.filter((e: any) => e.statut === 'payé').length,
      echues: echeancesDetaillees.filter((e: any) => 
        e.statut === 'en attente' && new Date(e.date_echeance) < new Date()
      ).length,
      montant_total_du: echeancesDetaillees
        .filter((e: any) => e.statut === 'en attente')
        .reduce((sum: number, e: any) => sum + parseFloat(e.montant), 0)
    };
    
    console.log(`📊 [Debug] Statistiques échéances utilisateur ${userId}:`, stats);
    
    res.status(200).json({
      success: true,
      utilisateur_id: parseInt(userId),
      echeances: echeancesDetaillees,
      statistiques: stats,
      // AJOUTÉ: Suggestions d'échéances à utiliser pour les tests
      suggestions_test: {
        echeance_la_plus_recente: echeancesDetaillees[0]?.id || null,
        echeances_en_attente: echeancesDetaillees
          .filter((e: any) => e.statut === 'en attente')
          .map((e: any) => ({
            id: e.id,
            montant: e.montant,
            date_echeance: e.date_echeance,
            url_test: `${req.protocol}://${req.get('host')}/pages/paiement?echeance=${e.id}&userId=${userId}`
          }))
          .slice(0, 3)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [Debug] Erreur liste échéances utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des échéances utilisateur',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route de compatibilité pour l'ancien format d'URL (singulier)
router.get('/echeance/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const userId = req.query.userId;
    
    console.log(`🔄 [Paiements] Route de compatibilité /echeance/${echeanceId} appelée avec userId=${userId}`);
    
    if (!echeanceId || isNaN(parseInt(echeanceId))) {
      return res.status(400).json({ 
        error: 'ID échéance invalide',
        echeanceId: echeanceId
      });
    }

    const paiements = new Paiements();
    
    // SÉCURITÉ: Si userId fourni, vérification d'appartenance
    if (userId && !isNaN(parseInt(userId as string))) {
      console.log(`🛡️ [Paiements] Vérification appartenance échéance ${echeanceId} à utilisateur ${userId}`);
      
      // Récupérer toutes les échéances de cet utilisateur
      const echeancesUtilisateur = await paiements.obtenirEcheancesUtilisateur(parseInt(userId as string));
      console.log(`📋 [Paiements] Utilisateur ${userId} a ${echeancesUtilisateur.length} échéances`);
      
      // Vérifier que l'échéance demandée existe pour cet utilisateur
      const echeanceAutorisee = echeancesUtilisateur.find((e: any) => e.id === parseInt(echeanceId));
      
      if (!echeanceAutorisee) {
        console.error(`❌ [Paiements] Échéance ${echeanceId} n'appartient pas à l'utilisateur ${userId}`);
        console.error(`📋 [Paiements] Échéances disponibles pour cet utilisateur:`, 
          echeancesUtilisateur.map((e: any) => ({ id: e.id, montant: e.montant, statut: e.statut }))
        );
        
        return res.status(404).json({ 
          error: 'Échéance non trouvée pour cet utilisateur',
          debug: {
            echeanceId: parseInt(echeanceId),
            userId: parseInt(userId as string),
            echeancesDisponibles: echeancesUtilisateur.map((e: any) => ({ 
              id: e.id, 
              montant: e.montant, 
              statut: e.statut,
              date_echeance: e.date_echeance
            })),
            suggestions: echeancesUtilisateur
              .filter((e: any) => e.statut === 'en attente')
              .slice(0, 3)
              .map((e: any) => ({
                id: e.id,
                url: `/pages/paiement?echeance=${e.id}&userId=${userId}`,
                montant: e.montant,
                date_echeance: e.date_echeance
              }))
          }
        });
      }

      // Vérifier que l'échéance n'est pas déjà payée
      if (echeanceAutorisee.statut?.toLowerCase() === 'payé') {
        console.warn(`⚠️ [Paiements] Échéance ${echeanceId} déjà payée`);
        return res.status(400).json({ 
          error: 'Cette échéance est déjà payée',
          debug: {
            echeanceId: parseInt(echeanceId),
            statut: echeanceAutorisee.statut,
            datePaiement: echeanceAutorisee.date_paiement
          }
        });
      }

      console.log(`✅ [Paiements] Échéance ${echeanceId} trouvée et accessible pour utilisateur ${userId}`);
      
      // Enrichir l'échéance avec des informations supplémentaires
      const echeanceEnrichie = {
        ...echeanceAutorisee,
        description: echeanceAutorisee.description || `Cotisation mensuelle - ${new Date(echeanceAutorisee.date_echeance).toLocaleDateString('fr-FR')}`,
        utilisateur_autorise: true,
        verification_passed: true,
        // AJOUTÉ: Informations pour le paiement
        payment_ready: true,
        currency: 'EUR'
      };

      return res.status(200).json({
        success: true,
        data: echeanceEnrichie,
        security: {
          access_verified: true,
          user_id: parseInt(userId as string),
          echeance_owner: true
        }
      });
      
    } else {
      // Accès sans vérification utilisateur (moins sécurisé)
      console.warn(`⚠️ [Paiements] Accès échéance ${echeanceId} sans userId - recherche directe en base`);
      
      try {
        const query = `SELECT * FROM echeances_paiements WHERE id = ?`;
        const results = await paiements.queryAsync(query, [parseInt(echeanceId)]);
        
        if (results.length === 0) {
          console.error(`❌ [Paiements] Échéance ${echeanceId} non trouvée en base`);
          return res.status(404).json({ 
            error: 'Échéance non trouvée',
            debug: {
              echeanceId: parseInt(echeanceId),
              userId: null,
              message: 'Aucune échéance trouvée avec cet ID en base de données'
            }
          });
        }

        const echeance = results[0];
        
        // Vérifier que l'échéance n'est pas déjà payée
        if (echeance.statut?.toLowerCase() === 'payé') {
          return res.status(400).json({ 
            error: 'Cette échéance est déjà payée',
            debug: {
              echeanceId: parseInt(echeanceId),
              statut: echeance.statut,
              datePaiement: echeance.date_paiement
            }
          });
        }

        console.log(`✅ [Paiements] Échéance ${echeanceId} trouvée en base (accès non sécurisé)`);

        return res.status(200).json({
          success: true,
          data: {
            ...echeance,
            description: echeance.description || `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`,
            utilisateur_autorise: false, // Non vérifié
            verification_passed: false,
            payment_ready: true,
            currency: 'EUR'
          },
          security: {
            access_verified: false,
            user_id: null,
            echeance_owner: false,
            warning: 'Accès sans vérification utilisateur - moins sécurisé'
          }
        });
        
      } catch (dbError: any) {
        console.error(`❌ [Paiements] Erreur DB recherche échéance ${echeanceId}:`, dbError);
        return res.status(500).json({ 
          error: 'Erreur lors de la recherche de l\'échéance en base de données',
          details: dbError.message 
        });
      }
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur route de compatibilité /echeance/:echeanceId:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'échéance',
      details: error.message 
    });
  }
});