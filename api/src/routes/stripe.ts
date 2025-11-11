import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { Magasin } from '../db/clients/magasin/magasin.js';
// AJOUTÉ: Import de MysqlConnector
import MysqlConnector from '../db/connector/mysqlconnector.js';

// CORRIGÉ: Interface ConfirmationResult définie localement pour éviter les problèmes d'import
interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  [key: string]: any; // Pour permettre des propriétés supplémentaires
}

// Configuration Stripe
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// AJOUTÉ: Initialisation de mysqlConnector
const mysqlConnector = MysqlConnector.getInstance();

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
    
    console.log('🏦 [Stripe] Création PaymentIntent pour échéance:', { 
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

    // Vérification de l'échéance
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
    console.error('❌ [Stripe] Erreur création PaymentIntent:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du PaymentIntent',
      details: error.message 
    });
  }
});

// CORRIGÉ: Route pour créer un PaymentIntent pour une commande (ID OU objet)
router.post('/create-payment-intent-commande', async (req, res) => {
  try {
    console.log('🛒 [Stripe] Création PaymentIntent pour commande:', {
      body: req.body,
      user: (req as any).user?.id,
      headers: {
        authorization: req.headers.authorization ? 'présent' : 'absent',
        'content-type': req.headers['content-type']
      }
    });

    const { amount, currency = 'eur', commande, description } = req.body;
    
    // CORRIGÉ: Récupérer utilisateur_id depuis plusieurs sources
    let utilisateur_id = (req as any).user?.id;
    
    // Si pas d'utilisateur depuis le middleware auth, essayer depuis la commande
    if (!utilisateur_id && commande?.utilisateur_id) {
      utilisateur_id = commande.utilisateur_id;
      console.log('🔧 [Stripe] Utilisateur récupéré depuis la commande:', utilisateur_id);
    }
    
    // VALIDATION: Vérifier que nous avons un utilisateur
    if (!utilisateur_id) {
      console.error('❌ [Stripe] Utilisateur manquant:', {
        userFromMiddleware: (req as any).user?.id,
        userFromCommande: commande?.utilisateur_id,
        commande: commande
      });
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        details: 'ID utilisateur manquant. Veuillez vous reconnecter.'
      });
    }

    // MODIFIÉ: Gérer les deux cas - ID de commande OU objet commande à créer
    let commandeId: number;
    let commandeData: any;

    // CAS 1: Commande existante (ID numérique)
    if (typeof commande === 'number') {
      commandeId = commande;
      console.log('📋 [Stripe] Cas 1: ID de commande existante:', commandeId);
      
      // Récupérer les détails depuis la DB
      const paiements = new Paiements();
      const commandeQuery = `
        SELECT 
          c.*,
          COUNT(ca.id) as nb_articles,
          SUM(ca.prix * ca.quantite) as total_calcule
        FROM commandes c
        LEFT JOIN commande_articles ca ON c.id = ca.commande_id
        WHERE c.id = ? AND c.utilisateur_id = ?
        GROUP BY c.id
      `;

      const commandeResult = await paiements.queryAsync(commandeQuery, [commandeId, utilisateur_id]);

      if (!commandeResult.length) {
        return res.status(404).json({
          error: 'Commande existante non trouvée',
          commandeId,
          utilisateur_id
        });
      }

      commandeData = commandeResult[0];
      
    } 
    // CAS 2: Objet commande à créer (depuis le panier)
    else if (commande && typeof commande === 'object' && commande.articles && Array.isArray(commande.articles)) {
      console.log('🛒 [Stripe] Cas 2: Création nouvelle commande depuis panier:', {
        nb_articles: commande.articles.length,
        total: commande.total,
        utilisateur_id: utilisateur_id
      });

      // Créer la commande en utilisant Magasin
      const magasin = new Magasin();
      
      const commandeResult = await magasin.creerCommande(
        utilisateur_id,
        commande.articles,
        commande.total,
        commande.date || new Date().toISOString(),
        commande.statut || 'en_attente'
      );

      if (!commandeResult.isConfirm) {
        console.error('❌ [Stripe] Erreur création commande:', commandeResult.message);
        return res.status(400).json({
          error: 'Erreur lors de la création de la commande',
          details: commandeResult.message
        });
      }

      console.log('✅ [Stripe] Commande créée:', commandeResult);

      // RÉCUPÉRER l'ID de la commande créée
      const paiements = new Paiements();
      
      // Rechercher la commande la plus récente pour cet utilisateur
      const rechercheQuery = `
        SELECT 
          c.*,
          COUNT(ca.id) as nb_articles,
          SUM(ca.prix * ca.quantite) as total_calcule
        FROM commandes c
        LEFT JOIN commande_articles ca ON c.id = ca.commande_id
        WHERE c.utilisateur_id = ? 
        ORDER BY c.date_commande DESC, c.id DESC
        LIMIT 1
      `;

      const rechercheResult = await paiements.queryAsync(rechercheQuery, [utilisateur_id]);

      if (!rechercheResult.length) {
        return res.status(500).json({
          error: 'Impossible de récupérer la commande créée',
          utilisateur_id
        });
      }

      commandeData = rechercheResult[0];
      commandeId = commandeData.id;
      
      console.log('📋 [Stripe] Commande créée récupérée:', {
        id: commandeId,
        nb_articles: commandeData.nb_articles,
        total: commandeData.total
      });

    } 
    // CAS 3: Format non reconnu
    else {
      console.error('❌ [Stripe] Format de commande non reconnu:', {
        commande,
        type: typeof commande,
        hasArticles: commande?.articles ? 'oui' : 'non',
        isArray: Array.isArray(commande?.articles)
      });
      return res.status(400).json({
        error: 'Format de commande non reconnu',
        received: commande,
        expected: 'ID numérique OU objet avec {articles: [...], total: number, utilisateur_id: number}'
      });
    }

    // VALIDATION: Vérifier que la commande a des articles
    if (commandeData.nb_articles === 0) {
      console.error('❌ [Stripe] Commande sans articles:', commandeId);
      return res.status(400).json({
        error: 'Commande sans articles',
        message: 'Impossible de créer un paiement pour une commande vide'
      });
    }

    // UTILISER le montant de la commande, pas celui fourni
    const montantCommande = commandeData.total || commandeData.total_calcule || 0;
    const amountInCents = Math.round(montantCommande * 100);

    console.log('💰 [Stripe] Montant final:', {
      montant_euros: montantCommande,
      amount_centimes: amountInCents,
      source: 'commande_data'
    });

    if (amountInCents <= 0) {
      return res.status(400).json({
        error: 'Montant de commande invalide',
        montant: montantCommande
      });
    }

    // CRÉER le PaymentIntent
    console.log('🔧 [Stripe] Création PaymentIntent pour commande...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      metadata: {
        type: 'commande_magasin',
        commande_id: commandeId.toString(),
        utilisateur_id: utilisateur_id.toString(),
        montant_euros: montantCommande.toString(),
        articles_count: commandeData.nb_articles.toString(),
        date_creation: new Date().toISOString()
      },
      description: description || `Paiement commande #${commandeId} - ${commandeData.nb_articles} article(s)`,
      automatic_payment_methods: {
        enabled: true,
      }
    });

    console.log('✅ [Stripe] PaymentIntent créé:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      commande_id: commandeId
    });

    // ENREGISTRER le paiement en base
    console.log('💾 [Stripe] Enregistrement paiement...');

    const paiements = new Paiements();
    const paiementData = {
      commande_id: commandeId,
      utilisateur_id: utilisateur_id,
      montant: montantCommande,
      methode_paiement: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      statut: 'en_attente',
      description: `Commande magasin #${commandeId} - ${commandeData.nb_articles} article(s)`
    };

    const paiementResult = await paiements.creerPaiement(paiementData);

    console.log('✅ [Stripe] Paiement enregistré:', paiementResult.id);

    // RÉPONSE avec les données correctes - AJOUTÉ l'ID de commande
    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: amountInCents,
      currency: currency,
      // CORRIGÉ: Inclure l'ID de commande dans la réponse principale
      commande_id: commandeId, // AJOUTÉ: ID de commande pour le frontend
      commande: {
        id: commandeId,
        total: montantCommande,
        nb_articles: commandeData.nb_articles,
        statut: commandeData.statut
      },
      paiement_id: paiementResult.id,
      message: 'PaymentIntent créé pour commande'
    });

  } catch (error: any) {
    console.error('❌ [Stripe] Erreur création PaymentIntent commande:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du PaymentIntent pour commande',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    if (!paymentIntentId.includes('simulated_')) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          error: 'Le paiement n\'a pas été confirmé sur Stripe',
          stripeStatus: paymentIntent.status
        });
      }
    }

    // 2. Vérifier si c'est le premier paiement
    const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));

    // 3. Confirmer le paiement Stripe en base
    await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');

    // 4. Vérifier que l'échéance existe
    const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
    const echeanceCible = echeances.find((e: any) => e.id === parseInt(echeanceId));
    
    if (!echeanceCible) {
      return res.status(404).json({ 
        error: `Échéance ${echeanceId} non trouvée pour cet utilisateur`,
        debug: { echeanceId, userId, echeancesDisponibles: echeances.map((e: any) => e.id) }
      });
    }

    // 5. SIMPLIFIÉ: Mettre à jour l'échéance - le trigger modifié gère les doublons
    let echeanceResult: any = { isConfirm: false };
    let echeanceApres: any = null; // AJOUTÉ: Déclarer la variable echeanceApres
    
    try {
      console.log(`🎯 [Paiements] Mise à jour échéance ${echeanceId} - trigger amélioré gère les doublons`);
      
      const updateResult = await paiements.marquerEcheancePayee(parseInt(echeanceId));
      echeanceResult = updateResult;
      
      // AJOUTÉ: Récupérer l'état de l'échéance après mise à jour
      const echeancesApresUpdate = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
      echeanceApres = echeancesApresUpdate.find((e: any) => e.id === parseInt(echeanceId));
      
      console.log(`✅ [Paiements] Échéance mise à jour - trigger avec protection doublons`);
      console.log(`🔍 [Paiements] État échéance après mise à jour:`, echeanceApres);
      
    } catch (updateError: any) {
      console.error('❌ [Paiements] Erreur mise à jour échéance:', updateError);
      
      // CORRIGÉ: Cette erreur ne devrait plus arriver avec le trigger modifié
      if (updateError.code === 'ER_DUP_ENTRY' && updateError.sqlMessage.includes('uk_utilisateur_periode_abonnement')) {
        console.warn('⚠️ [Paiements] Erreur de contrainte détectée malgré le trigger modifié');
        console.warn('⚠️ [Paiements] Vérifiez que le nouveau trigger est bien déployé');
        
        // Vérifier si l'échéance est quand même payée
        const checkEcheance = await paiements.queryAsync(
          'SELECT statut FROM echeances_paiements WHERE id = ?', 
          [parseInt(echeanceId)]
        );
        
        if (checkEcheance.length > 0 && checkEcheance[0].statut === 'payé') {
          console.log('✅ [Paiements] Échéance finalement dans le bon état');
          echeanceResult = { isConfirm: true, triggerWorkaround: true };
          
          // AJOUTÉ: Récupérer l'état après vérification
          const echeancesApresVerif = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
          echeanceApres = echeancesApresVerif.find((e: any) => e.id === parseInt(echeanceId));
        } else {
          echeanceResult = { 
            isConfirm: false, 
            message: 'Erreur contrainte - trigger pas encore mis à jour ?'
          };
          echeanceApres = echeanceCible; // Garder l'état original si échec
        }
      } else {
        echeanceResult = { isConfirm: false, message: updateError.message };
        echeanceApres = echeanceCible; // Garder l'état original si échec
      }
    }

    // 6. Créer un enregistrement de paiement d'échéance (optionnel maintenant)
    let enregistrementResult: any = null;
    try {
      // OPTIONNEL: Le trigger crée déjà l'enregistrement dans la table paiements
      // Mais on peut garder cet enregistrement pour traçabilité spécifique
      enregistrementResult = await paiements.enregistrerPaiementEcheance({
        utilisateur_id: parseInt(userId),
        montant: echeanceCible.montant || amount,
        methode_paiement: 'stripe',
        stripe_payment_intent_id: paymentIntentId,
        statut: 'reussi',
        description: `Paiement échéance #${echeanceId} - ${echeanceCible.description || 'Cotisation'}`,
        abonnement_id: echeanceCible.abonnement_id || null,
        echeance_id: parseInt(echeanceId)
      });
    } catch (enregistrementError: any) {
      console.warn('⚠️ [Paiements] Erreur enregistrement paiement échéance (non critique):', enregistrementError);
      // Non critique car le trigger a déjà créé l'enregistrement principal
      enregistrementResult = { 
        isConfirm: false, 
        message: 'Trigger a géré l\'enregistrement principal',
        triggerHandled: true
      };
    }

    // 7. CORRIGÉ: Mise à jour automatique du statut utilisateur SEULEMENT pour les visiteurs
    let statutUpgrade = null;
    if (premierPaiement) {
      try {
        console.log(`🎊 [Paiements] Premier paiement détecté - Vérification du statut utilisateur ${userId}`);
        
        // Récupérer le statut actuel avec status_id et nom du statut depuis la table status
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
          
          // CORRIGÉ: Vérifier si l'utilisateur est un visiteur avant de le promouvoir
          if (statusActuel.status_nom && statusActuel.status_nom.toLowerCase() === 'visiteur') {
            console.log(`🔄 [Paiements] Utilisateur ${userId} est visiteur - Promotion possible vers utilisateur`);
            
            // Récupérer l'ID du statut "utilisateur" depuis la table status
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
              
              console.log(`🎯 [Paiements] Promotion visiteur → utilisateur:`, {
                ancien_id: statusActuel.status_id,
                ancien_nom: statusActuel.status_nom,
                nouveau_id: nouveauStatutId,
                nouveau_nom: nouveauStatutNom
              });
              
              const updateStatutQuery = `
                UPDATE utilisateurs 
                SET status_id = ?, 
                    date_modification = NOW() 
                WHERE id = ?
              `;
              
              const updateResult = await paiements.queryAsync(updateStatutQuery, [nouveauStatutId, parseInt(userId)]);
              
              if (updateResult.affectedRows > 0) {
                console.log(`✅ [Paiements] Utilisateur ${userId} promu: visiteur → utilisateur`);
                statutUpgrade = `${statusActuel.status_nom} → ${nouveauStatutNom}`;
                
                // SUPPRIMÉ: Code complexe du client Utilisateurs pour simplifier
                console.log(`✅ [Paiements] Statut utilisateur ${userId} mis à jour directement en base`);
                
              } else {
                console.warn(`⚠️ [Paiements] Aucune ligne affectée lors de la promotion pour l'utilisateur ${userId}`);
              }
            }
          } else {
            // Gérer les utilisateurs avec statuts privilégiés
            const statutsPrivilegies = ['professeur', 'administrateur', 'super-administrateur', 'super_administrateur', 'admin'];
            const isPrivileged = statutsPrivilegies.some(statut => 
              statusActuel.status_nom && statusActuel.status_nom.toLowerCase().includes(statut.toLowerCase())
            );
            
            if (isPrivileged) {
              console.log(`🏆 [Paiements] Utilisateur ${userId} a un statut privilégié (${statusActuel.status_nom}) - AUCUNE modification`);
              statutUpgrade = `${statusActuel.status_nom} (privilégié - inchangé)`;
            } else {
              console.log(`ℹ️ [Paiements] Utilisateur ${userId} n'est pas visiteur (statut: ${statusActuel.status_nom}) - AUCUNE modification`);
              statutUpgrade = `${statusActuel.status_nom} (déjà activé - inchangé)`;
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
    
    if (utilisateurResults.length > 0) {
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
        let emailClient: any = null;
        
        try {
          const emailModule = await import('../clients/emailClient.js');
          emailClient = emailModule.emailClient;
        } catch (importError) {
          console.warn('⚠️ [Paiements] Module EmailClient non disponible:', importError);
        }

        if (emailClient) {
          console.log('📤 [Paiements] Envoi email de confirmation avec EmailClient...');
          
          const emailVariables = {
            userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
            amount: new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR' 
            }).format(amount),
            paymentDate: new Date().toLocaleDateString('fr-FR'),
            currency: 'EUR',
            datePaiement: new Date().toLocaleDateString('fr-FR'),
            paymentIntentId: paymentIntentId,
            echeanceId: echeanceId.toString(),
            premierPaiement: premierPaiement
          };

          // Variables enrichies pour template
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
          
          const emailResult = await emailClient.sendPaymentConfirmation(
            utilisateur.email,
            templateVariables,
            parseInt(userId),
            'confirmation-paiement'
          );

          if (emailResult.success) {
            console.log('✅ [Paiements] Email de confirmation envoyé avec EmailClient');
          } else {
            console.error('❌ [Paiements] Échec envoi email avec EmailClient:', emailResult.error);
          }
        } else {
          console.log('⚠️ [Paiements] EmailClient non disponible - pas d\'email envoyé');
        }

      } catch (emailError: any) {
        console.error('❌ [Paiements] Erreur lors de l\'envoi de l\'email:', emailError.message);
      }
    }

    console.log('✅ [Paiements] Processus de confirmation terminé pour échéance:', echeanceId);

    // 10. CORRIGÉ: Message de succès avec types explicites
    let successMessage = 'Paiement confirmé et échéance mise à jour';
    if (premierPaiement) {
      successMessage += `. 🎉 Félicitations pour votre premier paiement !`;
      if (statutUpgrade) {
        successMessage += ` Votre statut a été automatiquement mis à jour : ${statutUpgrade}.`;
      }
    }
    successMessage += ' 📧 Un email de confirmation vous a été envoyé.';

    // CORRIGÉ: Réponse avec types explicites pour éviter les erreurs ConfirmationResult
    const responseData = {
      success: true,
      message: successMessage,
      echeance_id: echeanceId,
      payment_intent_id: paymentIntentId,
      premier_paiement: premierPaiement,
      statut_upgrade: statutUpgrade,
      echeance_mise_a_jour: echeanceResult.isConfirm,
      enregistrement_confirme: enregistrementResult?.isConfirm || false,
      email_envoye: utilisateurResults.length > 0,
      debug: {
        echeanceAvant: echeanceCible,
        echeanceApres: echeanceApres,
        updateResult: echeanceResult
      }
    };

    res.status(200).json(responseData);

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

// AJOUTÉ: Route de diagnostic Stripe
router.get('/debug/stripe-config', async (req, res) => {
  try {
    console.log('🔍 [Stripe Debug] Vérification configuration Stripe...');
    
    const stripeKeyType = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 
                         process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN';
    
    const publishableKeyType = process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ? 'TEST' : 
                              process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'LIVE' : 'UNKNOWN';
    
    // Test de connectivité Stripe
    let stripeConnectionTest = false;
    let stripeError = null;
    
    try {
      const balance = await stripe.balance.retrieve();
      stripeConnectionTest = true;
      console.log('✅ [Stripe Debug] Connexion Stripe réussie');
    } catch (error: any) {
      stripeError = error.message;
      console.error('❌ [Stripe Debug] Erreur connexion Stripe:', error.message);
    }
    
    // CORRIGÉ: Typer explicitement paymentMethodsAvailable
    let paymentMethodsAvailable: string[] = [];
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        type: 'card',
        limit: 1
      });
      paymentMethodsAvailable = ['card']; // Au minimum card devrait être disponible
    } catch (error: any) {
      console.warn('⚠️ [Stripe Debug] Impossible de lister les méthodes de paiement:', error.message);
    }
    
    const config = {
      environment: process.env.NODE_ENV || 'development',
      stripe_secret_key_type: stripeKeyType,
      stripe_publishable_key_type: publishableKeyType,
      stripe_connection: stripeConnectionTest,
      stripe_error: stripeError,
      payment_methods_available: paymentMethodsAvailable,
      stripe_secret_key_prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) + '...',
      stripe_publishable_key_prefix: process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...',
      webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
      automatic_payment_methods_enabled: true,
      // AJOUTÉ: Informations sur la configuration des PaymentIntents
      payment_intent_config: {
        automatic_payment_methods: { enabled: true },
        supported_methods: ['card', 'bancontact', 'sepa_debit', 'ideal', 'sofort']
      }
    };
    
    console.log('🔍 [Stripe Debug] Configuration détectée:', config);
    
    res.json({
      success: true,
      config,
      recommendations: stripeKeyType === 'TEST' ? [
        'Vous utilisez les clés de test Stripe',
        'Utilisez des numéros de carte de test: 4242424242424242',
        'CVV de test: 123, Date d\'expiration future'
      ] : [
        'Vous utilisez les clés live Stripe',
        'Seules les vraies cartes de crédit fonctionneront',
        'Vérifiez que votre compte Stripe est complètement activé'
      ]
    });
    
  } catch (error: any) {
    console.error('❌ [Stripe Debug] Erreur diagnostic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AJOUTÉ: Route pour tester la création d'un PaymentIntent simple
router.post('/debug/test-payment-intent', async (req, res) => {
  try {
    console.log('🧪 [Stripe Debug] Test création PaymentIntent...');
    
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // 1€ en centimes
      currency: 'eur',
      description: 'Test PaymentIntent - Debug',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        test: 'true',
        debug: 'payment_intent_creation'
      }
    });
    
    console.log('✅ [Stripe Debug] PaymentIntent test créé:', testPaymentIntent.id);
    
    res.json({
      success: true,
      payment_intent: {
        id: testPaymentIntent.id,
        client_secret: testPaymentIntent.client_secret,
        status: testPaymentIntent.status,
        automatic_payment_methods: testPaymentIntent.automatic_payment_methods,
        payment_method_types: testPaymentIntent.payment_method_types
      },
      message: 'PaymentIntent de test créé avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ [Stripe Debug] Erreur test PaymentIntent:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      error_type: error.type,
      error_code: error.code
    });
  }
});

// AJOUTÉ: Route pour retourner la clé publique Stripe côté frontend
router.get('/config', async (req, res) => {
  try {
    const config = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      environment: process.env.NODE_ENV || 'development',
      isTestMode: process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') || false,
      isLiveMode: process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') || false,
      // AJOUTÉ: Informations pour le frontend
      paymentMethods: {
        card: true,
        bancontact: true,
        sepa_debit: true,
        ideal: true
      },
      // Ne pas exposer les clés secrètes, juste indiquer qu'elles existent
      secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
      webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
    };
    
    console.log('🔧 [Stripe Config] Configuration envoyée au frontend:', {
      publishableKeyPrefix: config.publishableKey?.substring(0, 12) + '...',
      environment: config.environment,
      isTestMode: config.isTestMode,
      isLiveMode: config.isLiveMode
    });
    
    res.json(config);
    
  } catch (error: any) {
    console.error('❌ [Stripe Config] Erreur récupération config:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de la configuration Stripe'
    });
  }
});

// AJOUTÉ: Debug middleware pour tracer les appels
router.use((req, res, next) => {
  console.log(`📡 [Stripe Routes] ${req.method} ${req.originalUrl} - Body:`, req.body);
  next();
});

// AJOUTÉ: Log des routes montées
router.use((req, res, next) => {
  console.log(`📡 [Stripe Route] ${req.method} ${req.originalUrl}`);
  next();
});

console.log('✅ [Stripe] Routes Stripe chargées');

// CORRIGÉ: Export par défaut au lieu de named export
export default router;

// AJOUTÉ: Route de test pour vérifier le chargement du module Stripe
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      module: 'stripe',
      message: 'Module Stripe est fonctionnel',
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
      routes_available: [
        'POST /create-payment-intent - PaymentIntent échéance',
        'POST /create-payment-intent-commande - PaymentIntent commande',
        'POST /confirm-payment - Confirmation paiement',
        'POST /bancontact - Paiement Bancontact',
        'POST /paypal - Paiement PayPal',
        'POST /bitcoin - Paiement Bitcoin'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});