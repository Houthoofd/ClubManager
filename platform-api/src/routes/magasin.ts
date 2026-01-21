import express, { Request, Response } from 'express';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth.js';
// Import new services replacing old clients
import { articleService } from '../services/articleService.js';
import { userService } from '../services/userService.js';
import { 
  articleCreationSchema, 
  articleDataValidationSchema, 
  nouvelleCommandeSchema, 
  ArticleCreationData 
} from '../validators/localSchemas.js';
import { z } from 'zod';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto'; // AJOUTÉ: Pour générer des IDs sécurisés


const router = express.Router();

// AJOUTÉ: Cache pour empêcher les doublons de commandes
const commandesEnCours = new Map<string, { timestamp: number, promesse: Promise<any> }>();

// AJOUTÉ: Fonction pour nettoyer le cache des commandes anciennes
const nettoyerCacheCommandes = () => {
  const maintenant = Date.now();
  const EXPIRATION = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, value] of commandesEnCours.entries()) {
    if (maintenant - value.timestamp > EXPIRATION) {
      commandesEnCours.delete(key);
    }
  }
};

// Nettoyer le cache toutes les minutes
setInterval(nettoyerCacheCommandes, 60 * 1000);

// Routes protégées pour la gestion
router.use(verifyToken);

router.get('/articles', async (req: any, res: any) => {
  try {
    // Utilisation d'articleService pour récupérer les articles
    const result = await articleService.getAllArticles();

    console.log('articles récupèrés avec succès', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
});

router.get('/articles/categories', async (req: any, res: any) => {
  try {
    // Utilisation d'articleService pour récupérer les catégories
    const result = await articleService.getCategories();

    console.log('articles récupèrés avec succès', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
});

router.post('/articles/ajouter', async (req: any, res: any) => {
  try {
    // Utilisation d'articleService pour créer un article
    
    // ✅ Valider les données avec le schéma pour la création (sans id)
    const validatedData: ArticleCreationData = articleCreationSchema.parse(req.body);

    console.log("Données validées par le schéma Zod : ", JSON.stringify(validatedData));

    const result = await articleService.createArticle(validatedData);

    if (result) {
      console.log('Article ajouté avec succès', result);
      return res.status(200).json({
        message: 'Article créé avec succès',
        article: result,
      });
    } else {
      console.error('Erreur lors de l\'ajout de l\'article');
      return res.status(500).json({
        message: 'Erreur lors de l\'ajout de l\'article.',
        error: 'Impossible de créer l\'article',
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
  // Utilisation d'articleService pour supprimer un article

  if (isNaN(articleId)) {
    return res.status(400).json({ message: 'ID invalide.' });
  }

  try {
    const result = await articleService.deleteArticle(articleId);
    if (result) {
      res.status(200).json({ message: 'Article supprimé avec succès' });
    } else {
      res.status(404).json({ message: 'Article non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l’article :', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l’article.' });
  }
});

router.put('/articles/:id', async (req: any, res: any) => {
  const articleId = parseInt(req.params.id);
  // Utilisation d'articleService pour modifier un article

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
    const result = await articleService.updateArticle(articleId, validatedData);

    if (result) {
      res.status(200).json({ 
        message: 'Article modifié avec succès',
        article: result 
      });
    } else {
      res.status(404).json({ message: 'Article non trouvé' });
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
    const { prismaClient } = await import('../db/prisma.js');
    
    const commandeFound = await prismaClient.commande.findFirst({
      where: {
        OR: [
          { id: parseInt(uniqueId) || 0 },
          { notes: { contains: uniqueId } }
        ]
      },
      select: {
        id: true,
        statut: true,
        montantTotal: true,
        utilisateurId: true,
        dateCommande: true,
        notes: true
      }
    });
    
    if (!commandeFound) {
      return res.status(404).json({ 
        exists: false,
        message: 'Commande non trouvée' 
      });
    }
    
    res.status(200).json({
      exists: true,
      commande: {
        id: commandeFound.id,
        statut: commandeFound.statut,
        montantTotal: commandeFound.montantTotal,
        utilisateurId: commandeFound.utilisateurId,
        dateCommande: commandeFound.dateCommande,
        notes: commandeFound.notes
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
    const { prismaClient } = await import('../db/prisma.js');
    
    const lastCommande = await prismaClient.commande.findFirst({
      where: {
        notes: {
          startsWith: 'CMD-'
        }
      },
      orderBy: { id: 'desc' },
      select: { notes: true }
    });
    
    let nextNumber = 1;
    if (lastCommande && lastCommande.notes && lastCommande.notes.startsWith('CMD-')) {
      // Extraire le numéro séquentiel de la dernière commande
      const lastNumber = lastCommande.notes.split('-')[1];
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
    
    // CORRIGÉ: Ne plus référencer taille_id du tout, seulement utiliser les propriétés existantes
    const cacheKey = `${utilisateur_id}-${total}-${JSON.stringify(articles.map(a => ({ 
      id: a.article_id, 
      taille: a.taille, // Utiliser uniquement la propriété 'taille' qui existe
      quantite: a.quantite 
    })))}`;
    const maintenant = Date.now();
    
    console.log('🔍 [Magasin] Vérification doublon commande:', {
      cacheKey: cacheKey.substring(0, 50) + '...',
      utilisateur_id,
      total,
      nbArticles: articles.length
    });
    
    // Vérifier si une commande identique est déjà en cours
    const commandeEnCours = commandesEnCours.get(cacheKey);
    if (commandeEnCours) {
      const delaiDepuisCommande = maintenant - commandeEnCours.timestamp;
      
      if (delaiDepuisCommande < 30000) { // 30 secondes
        console.log('⚠️ [Magasin] Commande identique détectée, attente de la première...', {
          delaiDepuisCommande: `${delaiDepuisCommande}ms`,
          cacheKey: cacheKey.substring(0, 30) + '...'
        });
        
        try {
          // Attendre que la première commande se termine
          const resultatPremiere = await commandeEnCours.promesse;
          console.log('✅ [Magasin] Première commande terminée, retour du même résultat');
          
          return res.status(201).json({
            message: "Commande existante retournée (doublon évité)",
            commande: resultatPremiere,
            isDuplicate: true
          });
          
        } catch (error) {
          console.log('❌ [Magasin] Première commande a échoué, on continue avec la nouvelle');
          commandesEnCours.delete(cacheKey);
        }
      } else {
        // Commande trop ancienne, on la supprime du cache
        commandesEnCours.delete(cacheKey);
      }
    }

    // Utilisation directe de Prisma pour les commandes
    
    // Générer les IDs de manière plus robuste
    const uniqueCommandeId = generateUniqueCommandeId(utilisateur_id);
    const numeroCommande = await generateSequentialCommandeNumber();
    
    console.log('🆔 [Magasin] IDs générés:', {
      uniqueCommandeId,
      numeroCommande,
      utilisateur_id
    });

    // Créer une promesse pour cette commande et la stocker
    const promesseCommande = (async () => {
      try {
        const { prismaClient } = await import('../db/prisma.js');
        const commandeData = {
          utilisateurId: utilisateur_id,
          dateCommande: new Date(date || new Date()),
          statut,
          montantTotal: total,
          notes: `CMD-${numeroCommande}`,
        };
        
        const result = await prismaClient.commande.create({
          data: commandeData
        });
        
        // Envoyer l'email de confirmation après succès
        try {
          const userData = await recupererDonneesUtilisateur(utilisateur_id);
          if (userData) {
            const emailData = {
              articles,
              total,
              numero_commande: numeroCommande,
              unique_id: uniqueCommandeId,
              statut,
              created_at: new Date().toISOString()
            };
            await envoyerEmailConfirmationCommande(emailData, userData.email, userData.nom);
          } else {
            console.warn('⚠️ [Magasin] Impossible d\'envoyer l\'email - utilisateur non trouvé');
          }
        } catch (emailError) {
          console.error('❌ [Magasin] Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }
        
        return {
          id: result.id,
          unique_id: uniqueCommandeId,
          numero_commande: numeroCommande,
          statut: result.statut
        };
        
      } finally {
        // Nettoyer le cache après traitement
        setTimeout(() => {
          commandesEnCours.delete(cacheKey);
        }, 5000); // Garder 5 secondes pour les requêtes très rapprochées
      }
    })();

    // Stocker la promesse dans le cache
    commandesEnCours.set(cacheKey, {
      timestamp: maintenant,
      promesse: promesseCommande
    });

    // Attendre le résultat
    const resultatCommande = await promesseCommande;
    
    console.log('✅ [Magasin] Commande créée avec protection doublon:', {
      unique_id: uniqueCommandeId,
      numero_commande: numeroCommande
    });
    
    res.status(201).json({ 
      message: "Commande créée avec succès", 
      commande: resultatCommande,
      isDuplicate: false
    });
    
  } catch (error) {
    // Nettoyer le cache en cas d'erreur
    if (req.body) {
      const data = req.body;
      // CORRIGÉ: Même correction pour la partie catch
      const cacheKey = `${data.utilisateur_id}-${data.total}-${JSON.stringify((data.articles || []).map((a: any) => ({ 
        id: a.article_id, 
        taille: a.taille, // Utiliser uniquement la propriété 'taille' qui existe
        quantite: a.quantite 
      })))}`;
      commandesEnCours.delete(cacheKey);
    }
    
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
    const { prismaClient } = await import('../db/prisma.js');
    const commandes = await prismaClient.commande.findMany({
      include: {
        utilisateur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        articles: {
          include: {
            article: true
          }
        }
      },
      orderBy: { dateCommande: 'desc' }
    });

    res.status(200).json({ commandes }); // on renvoie les données directement
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des commandes." });
  }
});

router.put('/modifier/article/:id', async (req: any, res: any) => {
  const articleId = parseInt(req.params.id);
  // Utilisation d'articleService pour les opérations d'articles

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
    const result = await articleService.updateArticle(articleId, validatedData);

    if (result) {
      return res.status(200).json({ 
        message: "Modification réussie.", 
        article: result
      });
    } else {
      return res.status(500).json({ message: "Erreur lors de la modification de l'article." });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
    }
    return res.status(500).json({ message: error || "Erreur serveur lors de la modification de l'article." });
  }
});

// AJOUTÉ: Route pour récupérer toutes les tailles disponibles
router.get('/tailles', verifyToken, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [Magasin] Récupération de toutes les tailles...');
    
    const tailles = await articleService.getAllTailles();

    console.log(`✅ [Magasin] ${tailles.length} tailles récupérées:`, 
      tailles.map(t => ({ id: t.id, nom: t.nom }))
    );
    
    res.status(200).json(tailles);
  } catch (error: any) {
    console.error('❌ [Magasin] Erreur récupération tailles:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des tailles', 
      error: error.message 
    });
  }
});

// CORRIGÉ: Route de debug avec Prisma
router.get('/debug/tailles-structure', verifyToken, async (req: Request, res: Response) => {
  try {
    // Utiliser directement Prisma pour obtenir la structure
    const { prismaClient } = await import('../db/prisma.js');
    
    const tailles = await prismaClient.taille.findMany({
      take: 10,
      select: {
        id: true,
        nom: true
      },
      orderBy: { nom: 'asc' }
    });
    
    res.status(200).json({
      message: 'Structure de la table tailles',
      structure: [
        { Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI' },
        { Field: 'nom', Type: 'varchar(50)', Null: 'NO', Key: '' }
      ],
      sampleData: tailles,
      expectedStructure: 'CREATE TABLE tailles (id INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(50) NOT NULL UNIQUE)',
      timestamp: new Date().toISOString(),
      totalCount: tailles.length
    });
    
  } catch (error: any) {
    console.error('❌ [Magasin] Erreur debug structure tailles:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la structure', 
      error: error.message 
    });
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

    const { prismaClient } = await import('../db/prisma.js');

    // Vérifier la commande par ID numérique
    const commande = await prismaClient.commande.findFirst({
      where: {
        AND: [
          { id: parseInt(commandeId) || 0 },
          { utilisateurId: parseInt(userId) }
        ]
      },
      select: {
        id: true,
        utilisateurId: true,
        statut: true,
        notes: true
      }
    });

    if (!commande) {
      return res.status(404).json({ 
        error: 'Commande non trouvée ou ne vous appartient pas' 
      });
    }

    console.log('✅ [Magasin] Commande trouvée:', {
      id: commande.id,
      notes: commande.notes
    });

    // Rechercher un paiement lié à cette commande (adaptée au modèle existant)
    const payment = await prismaClient.paiement.findFirst({
      where: {
        utilisateurId: parseInt(userId)
      },
      select: {
        transactionId: true,
        statut: true,
        montant: true
      },
      orderBy: { id: 'desc' }
    });

    if (!payment || !payment.transactionId) {
      return res.status(404).json({ 
        error: 'Aucun paiement trouvé pour cette commande' 
      });
    }

    console.log('🔍 [Magasin] PaymentIntent trouvé dans DB:', {
      transaction_id: payment.transactionId,
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

      const paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);

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
    const { emailService } = await import('../services/emailService.js');
    
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
    
    // Envoyer email de confirmation de commande simple
    const result = await emailService.sendEmail({
      to: utilisateurEmail,
      subject: `Confirmation de commande - ${templateVariables.numeroCommande}`,
      html: `
        <h2>Confirmation de votre commande</h2>
        <p>Bonjour ${utilisateurNom},</p>
        <p>Votre commande a été confirmée :</p>
        <ul>
          <li>Numéro : ${templateVariables.numeroCommande}</li>
          <li>Montant total : €${templateVariables.totalCommande}</li>
          <li>Statut : ${templateVariables.statutCommande}</li>
          <li>Nombre d'articles : ${templateVariables.nbArticles}</li>
        </ul>
        <p>Merci pour votre commande !</p>
      `
    });
    
    if (result) {
      console.log('✅ [Magasin] Email de confirmation envoyé avec succès');
    } else {
      console.error('❌ [Magasin] Échec envoi email');
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
    const { prismaClient } = await import('../db/prisma.js');
    
    const user = await prismaClient.user.findUnique({
      where: { id: utilisateurId },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (!user) {
      console.error('❤️ [Magasin] Utilisateur non trouvé:', utilisateurId);
      return null;
    }
    return {
      email: user.email,
      nom: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Membre'
    };
    
  } catch (error) {
    console.error('❌ [Magasin] Erreur récupération utilisateur:', error);
    return null;
  }
};

export default router;
