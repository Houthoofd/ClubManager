import express from 'express';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { Magasin } from '../db/clients/magasin/magasin.js';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { Verifiation } from '../db/clients/verification/verifications.js';
import { EmailClient } from '../clients/emailClient.js'; // AJOUTÉ: Import EmailClient
import { ArticleCreationData, articleCreationSchema, articleDataValidationSchema, nouvelleCommandeSchema, articleCommandeSchema  } from '@clubmanager/types';
import { z } from 'zod';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto'; // AJOUTÉ: Pour générer des IDs sécurisés


const router = express.Router();

// Routes protégées pour la gestion
router.use(verifyToken);

router.get('/articles', async (req: any, res: any) => {
  try {
    const client = new Magasin();


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.obtenirArticlesParCategories();

    console.log('articles récupèrés avec succès', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
});

router.get('/articles/categories', async (req: any, res: any) => {
  try {
    const client = new Magasin();


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.obtenirLesCategories();

    console.log('articles récupèrés avec succès', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
});

router.post('/articles/ajouter', async (req: any, res: any) => {
  try {
    const client = new Magasin();

    // ✅ Valider les données avec le schéma pour la création (sans id)
    const validatedData: ArticleCreationData = articleCreationSchema.parse(req.body);

    console.log("Données validées par le schéma Zod : ", JSON.stringify(validatedData));

    const result = await client.ajouterArticle(validatedData);

    if (result.isConfirm) {
      console.log('Article ajouté avec succès', result);
      return res.status(200).json({
        message: result.message,
      });
    } else {
      console.error('Erreur lors de l\'ajout de l\'article', result.message);
      return res.status(500).json({
        message: 'Erreur lors de l\'ajout de l\'article.',
        error: result.message,
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erreur de validation Zod :', error);
      return res.status(400).json({
        message: 'Erreur de validation des données.',
        errors: error.errors,
      });
    }

    console.error("Erreur lors de l'ajout de l'article :", error);
    return res.status(500).json({
      message: 'Erreur lors de l\'ajout de l\'article.',
      error: error,
    });
  }
});

router.delete('/articles/:id', async (req:any, res:any) => {
  const articleId = parseInt(req.params.id);
  const client = new Magasin();

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'ID invalide.' });
  }

  try {
    const result = await client.supprimerArticle(articleId);
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Erreur lors de la suppression de l’article :', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l’article.' });
  }
});

router.put('/articles/:id', async (req: any, res: any) => {
  const articleId = parseInt(req.params.id);
  const client = new Magasin();

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'ID invalide.' });
  }

  try {
    // Ajoute l'id dans le body pour la validation Zod
    const validatedData = articleDataValidationSchema.parse({
      ...req.body,
      id: articleId
    });

    // Puis passe l'id séparément
    const result = await client.modifierArticle(articleId, validatedData);

    if (result.isConfirm) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
    }

    console.error("Erreur lors de la modification :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification de l'article." });
  }
});

// AJOUTÉ: Fonction pour générer un ID unique de commande
const generateUniqueCommandeId = (userId: number): string => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  const userPrefix = userId.toString().padStart(3, '0');
  
  // Format: CMD-{userId}-{timestamp}-{random}
  // Exemple: CMD-154-1704123456789-A1B2
  return `CMD-${userPrefix}-${timestamp}-${randomBytes}`;
};

// CORRIGÉ: Route pour vérifier l'unicité d'une commande
router.get('/commande/:uniqueId/verify', async (req: any, res: any) => {
  try {
    const { uniqueId } = req.params;
    const paiements = new Paiements(); // CORRIGÉ: Utiliser Paiements au lieu de Magasin
    
    const verifyQuery = `
      SELECT id, unique_id, numero_commande, statut, total, utilisateur_id, date
      FROM commandes 
      WHERE unique_id = ? OR numero_commande = ?
    `;
    
    const results = await paiements.queryAsync(verifyQuery, [uniqueId, uniqueId]); // CORRIGÉ: Utiliser paiements
    
    if (results.length === 0) {
      return res.status(404).json({ 
        exists: false,
        message: 'Commande non trouvée' 
      });
    }
    
    const commande = results[0];
    res.status(200).json({
      exists: true,
      commande: {
        id: commande.id,
        unique_id: commande.unique_id,
        numero_commande: commande.numero_commande,
        statut: commande.statut,
        total: commande.total,
        utilisateur_id: commande.utilisateur_id,
        date: commande.date
      }
    });
    
  } catch (error: any) {
    console.error('❌ [Magasin] Erreur vérification unicité:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification',
      details: error.message 
    });
  }
});

// AJOUTÉ: Fonction pour générer un numéro de commande séquentiel
const generateSequentialCommandeNumber = async (): Promise<string> => {
  try {
    const paiements = new Paiements(); // CORRIGÉ: Utiliser Paiements
    
    // Récupérer le dernier numéro de commande
    const lastCommandeQuery = `
      SELECT numero_commande 
      FROM commandes 
      WHERE numero_commande LIKE 'CMD-%' 
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    const results = await paiements.queryAsync(lastCommandeQuery, []); // CORRIGÉ: Utiliser paiements
    
    let nextNumber = 1;
    if (results.length > 0 && results[0].numero_commande) {
      // Extraire le numéro séquentiel de la dernière commande
      const lastNumber = results[0].numero_commande.split('-')[1];
      nextNumber = parseInt(lastNumber) + 1;
    }
    
    // Format: CMD-000001, CMD-000002, etc.
    return `CMD-${nextNumber.toString().padStart(6, '0')}`;
    
  } catch (error) {
    console.error('❌ Erreur génération numéro commande:', error);
    // Fallback vers timestamp en cas d'erreur
    return `CMD-${Date.now()}`;
  }
};

router.post('/commandes/ajouter', async (req:any, res:any) => {
  try {
    console.log('Corps reçu:', req.body);

    const data = nouvelleCommandeSchema.parse(req.body);
    const { utilisateur_id, articles, statut, date, total } = data;
    const client = new Magasin();

    // CORRIGÉ: Générer un ID unique pour la commande sans paramètre
    const uniqueCommandeId = generateUniqueCommandeId(utilisateur_id);
    const numeroCommande = await generateSequentialCommandeNumber();
    
    console.log('🆔 [Magasin] IDs générés:', {
      uniqueCommandeId,
      numeroCommande,
      utilisateur_id
    });

    try {
      const commandeData = {
        utilisateur_id,
        articles,
        total,
        date,
        statut,
        // AJOUTÉ: Inclure les nouveaux identifiants
        unique_id: uniqueCommandeId,
        numero_commande: numeroCommande,
        // SUPPRIMÉ: ip_address et user_agent pour l'instant
        // ip_address: req.ip || req.connection.remoteAddress,
        // user_agent: req.headers['user-agent'],
        created_at: new Date().toISOString()
      };
      
      const result = await client.ajouterCommande(commandeData);
      
      // AJOUTÉ: Envoyer l'email de confirmation après succès de la commande
      try {
        const userData = await recupererDonneesUtilisateur(utilisateur_id);
        if (userData) {
          await envoyerEmailConfirmationCommande(commandeData, userData.email, userData.nom);
        } else {
          console.warn('⚠️ [Magasin] Impossible d\'envoyer l\'email - utilisateur non trouvé');
        }
      } catch (emailError) {
        console.error('❌ [Magasin] Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        // Continue sans faire échouer la commande
      }
      
      // AJOUTÉ: Retourner les nouveaux identifiants dans la réponse
      res.status(201).json({ 
        message: "Commande créée avec succès", 
        commande: {
          ...result,
          unique_id: uniqueCommandeId,
          numero_commande: numeroCommande
        }
      });
    } catch (error) {
      console.error('Erreur création commande:', error);
      res.status(500).json({ message: "Erreur lors de la création de la commande" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Données de commande invalides.",
        errors: error.errors,
      });
    }
    console.error('Erreur lors de la création de la commande :', error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande.' });
  }
});

router.get('/commandes', async (req: any, res: any) => {
  try {
    const client = new Magasin();
    const commandes = await client.obtenirLesCommandes(); // ATTENTION AU await

    res.status(200).json({ commandes }); // on renvoie les données directement
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des commandes." });
  }
});

router.put('/modifier/article/:id', async (req: any, res: any) => {
  const articleId = parseInt(req.params.id);
  const magasinClient = new Magasin();

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'ID invalide.' });
  }

  try {
    // Valide et prépare les données selon la structure attendue
    const validatedData = articleDataValidationSchema.parse({
      ...req.body,
      id: articleId
    });

    console.log(articleId)

    // Appel avec la bonne structure
    const result = await magasinClient.modifierArticle(articleId, validatedData);

    if (result && typeof result === 'object' && 'isConfirm' in result) {
      if (result.isConfirm) {
        return res.status(200).json({ message: result.message ?? "Modification réussie." });
      } else {
        return res.status(500).json({ message: result.message ?? "Erreur lors de la modification de l'article." });
      }
    } else {
      return res.status(500).json({ message: "Erreur inconnue lors de la modification de l'article." });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
    }
    return res.status(500).json({ message: error || "Erreur serveur lors de la modification de l'article." });
  }
});

// Endpoint pour obtenir les tailles existantes depuis la base de données
router.get('/tailles', async (_req: any, res: any) => {
  try {
    const client = new Magasin();
    const tailles = await client.obtenirLesTailles(); // Cette méthode doit retourner [{ id, nom }, ...]
    res.status(200).json({ tailles });
  } catch (error) {
    console.error('Erreur lors de la récupération des tailles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tailles.' });
  }
});

// AJOUTÉ: Route pour récupérer le PaymentIntent d'une commande (pour la page de paiement)
router.get('/commande/:commandeId/payment-intent', async (req: any, res: any) => {
  try {
    const { commandeId } = req.params;
    const userId = req.query.userId;

    console.log('🔍 [Magasin] Récupération PaymentIntent pour commande:', { commandeId, userId });

    if (!commandeId || !userId) {
      return res.status(400).json({ 
        error: 'ID de commande et utilisateur requis' 
      });
    }

    const paiements = new Paiements();

    // MODIFIÉ: Vérifier la commande par ID numérique OU unique_id
    const commandeQuery = `
      SELECT id, utilisateur_id, statut, unique_id, numero_commande
      FROM commandes 
      WHERE (id = ? OR unique_id = ? OR numero_commande = ?) AND utilisateur_id = ?
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
    console.log('✅ [Magasin] Commande trouvée:', {
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande
    });

    // MODIFIÉ: Rechercher le paiement par l'ID réel de la commande
    const paymentQuery = `
      SELECT stripe_payment_intent_id, statut, montant
      FROM paiements 
      WHERE commande_id = ? AND utilisateur_id = ? 
      ORDER BY id DESC 
      LIMIT 1
    `;
    const paymentResults = await paiements.queryAsync(paymentQuery, [commande.id, parseInt(userId)]);

    if (paymentResults.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun paiement trouvé pour cette commande' 
      });
    }

    const payment = paymentResults[0];

    console.log('🔍 [Magasin] PaymentIntent trouvé dans DB:', {
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
      statut: payment.statut,
      montant: payment.montant
    });

    // Récupérer les détails du PaymentIntent depuis Stripe
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('Clé Stripe non configurée');
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-02-24.acacia',
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);

      console.log('✅ [Magasin] PaymentIntent récupéré depuis Stripe:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

      res.status(200).json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        statut: payment.statut,
        montant: payment.montant,
        metadata: paymentIntent.metadata || {}
      });

    } catch (stripeError: any) {
      console.error('❌ [Magasin] Erreur Stripe:', stripeError);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des détails de paiement',
        details: stripeError.message 
      });
    }

  } catch (error: any) {
    console.error('❌ [Magasin] Erreur récupération PaymentIntent commande:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du PaymentIntent',
      details: error.message 
    });
  }
});

// CORRIGÉ: Fonction pour envoyer l'email de confirmation de commande avec template uniquement
const envoyerEmailConfirmationCommande = async (
  commandeData: any, 
  utilisateurEmail: string, 
  utilisateurNom: string
): Promise<void> => {
  try {
    const emailClient = new EmailClient();
    
    // Générer la liste des articles pour le template
    const articlesFormatted = commandeData.articles.map((article: any) => ({
      nom: article.nom || 'Article',
      quantite: article.quantite || 1,
      taille: article.taille || 'N/A',
      prixUnitaire: (article.prix || 0).toFixed(2),
      prixTotal: ((article.prix || 0) * (article.quantite || 1)).toFixed(2)
    }));
    
    // Préparer les variables pour le template
    const templateVariables = {
      userName: utilisateurNom,
      numeroCommande: commandeData.numero_commande,
      uniqueId: commandeData.unique_id,
      dateCommande: new Date(commandeData.created_at).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      statutCommande: commandeData.statut || 'En attente',
      totalCommande: commandeData.total.toFixed(2),
      nbArticles: commandeData.articles.length.toString(),
      // Articles sous forme de chaîne JSON pour le template
      articlesJson: JSON.stringify(articlesFormatted),
      // Variables individuelles pour les articles (si besoin dans le template)
      article1Nom: articlesFormatted[0]?.nom || '',
      article1Quantite: articlesFormatted[0]?.quantite || '',
      article1Taille: articlesFormatted[0]?.taille || '',
      article1Prix: articlesFormatted[0]?.prixTotal || '',
      // Informations pratiques
      delaiPreparation: '2-3 jours ouvrables',
      lieuRetrait: 'Accueil du club',
      horaires: 'Lundi-Vendredi 9h-18h, Samedi 9h-12h',
      conservation: '30 jours',
      emailContact: 'magasin@clubmanager.com',
      telephoneContact: '+32 XXX XX XX XX',
      anneeActuelle: new Date().getFullYear().toString()
    };
    
    console.log('📧 [Magasin] Envoi email confirmation commande avec template:', {
      destinataire: utilisateurEmail,
      templateName: 'confirmation-commande',
      numeroCommande: commandeData.numero_commande,
      nbVariables: Object.keys(templateVariables).length
    });
    
    // Utiliser uniquement sendTemplatedEmail avec le template confirmation-commande
    const result = await emailClient.sendTemplatedEmail({
      to: utilisateurEmail,
      templateTitle: 'confirmation-commande',
      variables: templateVariables,
      utilisateurId: commandeData.utilisateur_id
    });
    
    if (result.success) {
      console.log('✅ [Magasin] Email de confirmation envoyé avec succès via template');
    } else {
      console.error('❌ [Magasin] Échec envoi email via template:', result.error);
      // On log l'erreur mais on ne fait pas échouer la commande
    }
    
  } catch (error) {
    console.error('❌ [Magasin] Erreur envoi email confirmation avec template:', error);
    // Ne pas faire échouer la commande si l'email échoue
  }
};

// MODIFIÉ: Fonction pour récupérer les données utilisateur
const recupererDonneesUtilisateur = async (utilisateurId: number): Promise<{ email: string; nom: string } | null> => {
  try {
    const paiements = new Paiements();
    
    const userQuery = `
      SELECT email, nom, prenom
      FROM utilisateurs 
      WHERE id = ?
    `;
    
    const results = await paiements.queryAsync(userQuery, [utilisateurId]);
    
    if (results.length === 0) {
      console.error('❌ [Magasin] Utilisateur non trouvé:', utilisateurId);
      return null;
    }
    
    const user = results[0];
    return {
      email: user.email,
      nom: `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Membre'
    };
    
  } catch (error) {
    console.error('❌ [Magasin] Erreur récupération utilisateur:', error);
    return null;
  }
};

export default router;