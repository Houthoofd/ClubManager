import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// CORRIGÉ: Utiliser les VRAIES routes du module paiements modulaire selon paiements.ts
const PAYMENT_ENDPOINTS = {
  createPaymentIntent: '/paiements/stripe/create-payment-intent-commande',
  confirmPayment: '/paiements/confirmation/confirm-payment-commande', 
  webhook: '/paiements/webhooks/stripe',
  // AJOUTÉ: Nouvelles routes selon la structure réelle
  health: '/paiements/health',
  debug: '/paiements/debug/routes'
};

/**
 * GET /api/commandes
 * Récupérer toutes les commandes avec leurs détails
 */
router.get('/', verifyToken, async (req: Request, res: Response) => {
  try {
    console.log('🔄 [API] Récupération des commandes avec détails...');
    console.log('👤 [API] Utilisateur authentifié:', (req as any).user?.id);
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // CORRIGÉ: Requête pour récupérer les commandes avec les bonnes relations
    const commandesQuery = `
      SELECT 
        c.*,
        u.nom_utilisateur,
        u.email as utilisateur_email,
        u.first_name,
        u.last_name,
        u.userId as user_id
      FROM commandes c
      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
      ORDER BY c.created_at DESC
    `;
    
    const commandes = await new Promise((resolve, reject) => {
      mysqlConnector.query(commandesQuery, [], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    }) as any[];

    // CORRIGÉ: Récupérer les articles pour chaque commande avec les bonnes relations
    const commandesAvecArticles = await Promise.all(
      commandes.map(async (commande) => {
        try {
          // CORRIGÉ: Requête avec les bonnes relations selon votre structure DB
          const articlesQuery = `
            SELECT 
              ca.id as commande_article_id,
              ca.commande_id,
              ca.article_id,
              ca.taille_id,
              ca.quantite,
              ca.prix,
              a.nom as article_nom,
              a.description as article_description,
              a.prix as prix_unitaire,
              t.nom as taille,
              cat.nom as categorie_nom
            FROM commande_articles ca
            LEFT JOIN articles a ON ca.article_id = a.id
            LEFT JOIN tailles t ON ca.taille_id = t.id
            LEFT JOIN categories cat ON a.categorie_id = cat.id
            WHERE ca.commande_id = ?
            ORDER BY ca.id
          `;
          
          const articles = await new Promise((resolve, reject) => {
            mysqlConnector.query(articlesQuery, [commande.id], (error: any, results: any) => {
              if (error) {
                console.error('❌ [API] Erreur récupération articles commande:', commande.id, error);
                resolve([]); // En cas d'erreur, retourner un tableau vide
              } else {
                resolve(results);
              }
            });
          });

          console.log(`📦 [API] Commande ${commande.id}: ${(articles as any[]).length} articles trouvés`);

          return {
            ...commande,
            articles: articles || []
          };
        } catch (error) {
          console.error(`❌ [API] Erreur pour commande ${commande.id}:`, error);
          return {
            ...commande,
            articles: []
          };
        }
      })
    );
    
    console.log('✅ [API] Commandes avec détails récupérées:', {
      count: commandesAvecArticles.length,
      statuts: commandesAvecArticles.reduce((acc: any, cmd: any) => {
        acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
        return acc;
      }, {}),
      totalArticles: commandesAvecArticles.reduce((sum, cmd) => sum + (cmd.articles?.length || 0), 0),
      sample: commandesAvecArticles.slice(0, 2).map(cmd => ({
        id: cmd.id,
        numero: cmd.numero_commande,
        statut: cmd.statut,
        total: cmd.total,
        nbArticles: cmd.articles?.length || 0,
        articlesDetails: cmd.articles?.slice(0, 2).map((a: any) => ({
          nom: a.article_nom,
          taille: a.taille,
          quantite: a.quantite,
          prix: a.prix
        }))
      }))
    });
    
    res.json(commandesAvecArticles);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération commandes:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des commandes', 
      error: error.message 
    });
  }
});

/**
 * GET /api/commandes/:id
 * Récupérer une commande par son ID avec tous ses détails
 */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const commandeId = req.params.id;
    console.log('🔄 [API] Récupération commande détaillée:', commandeId);
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // CORRIGÉ: Récupérer la commande avec les bonnes relations
    const commandeQuery = `
      SELECT 
        c.*,
        u.nom_utilisateur,
        u.email as utilisateur_email,
        u.first_name,
        u.last_name,
        u.userId as user_id
      FROM commandes c
      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE c.id = ? OR c.unique_id = ? OR c.numero_commande = ?
    `;
    
    const commandeResult = await new Promise((resolve, reject) => {
      mysqlConnector.query(commandeQuery, [commandeId, commandeId, commandeId], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    }) as any[];
    
    if (!commandeResult.length) {
      return res.status(404).json({ 
        message: 'Commande non trouvée' 
      });
    }

    const commande = commandeResult[0];

    // CORRIGÉ: Récupérer les articles avec toutes les relations
    const articlesQuery = `
      SELECT 
        ca.id as commande_article_id,
        ca.commande_id,
        ca.article_id,
        ca.taille_id,
        ca.quantite,
        ca.prix,
        a.nom as article_nom,
        a.description as article_description,
        a.prix as prix_unitaire,
        a.image_url,
        t.nom as taille,
        cat.nom as categorie_nom,
        -- Récupérer aussi les images de l'article
        (SELECT GROUP_CONCAT(img.url) 
         FROM images img 
         WHERE img.article_id = a.id) as images_urls
      FROM commande_articles ca
      LEFT JOIN articles a ON ca.article_id = a.id
      LEFT JOIN tailles t ON ca.taille_id = t.id
      LEFT JOIN categories cat ON a.categorie_id = cat.id
      WHERE ca.commande_id = ?
      ORDER BY ca.id
    `;
    
    const articles = await new Promise((resolve, reject) => {
      mysqlConnector.query(articlesQuery, [commande.id], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    const commandeComplete = {
      ...commande,
      articles: (articles as any[]).map((article: any) => ({
        ...article,
        // Traiter les images si elles existent
        images: article.images_urls ? article.images_urls.split(',') : (article.image_url ? [article.image_url] : [])
      }))
    };

    console.log('✅ [API] Commande détaillée récupérée:', {
      id: commande.id,
      nbArticles: (articles as any[]).length,
      articlesDetails: (articles as any[]).map(a => ({
        nom: a.article_nom,
        taille: a.taille,
        quantite: a.quantite,
        prix: a.prix
      }))
    });
    
    res.json(commandeComplete);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération commande:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la commande', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/commandes/:id/statut
 * Mettre à jour le statut d'une commande avec gestion optimisée des stocks
 */
router.put('/:id/statut', verifyToken, async (req: Request, res: Response) => {
  try {
    const commandeId = req.params.id;
    const { statut } = req.body;
    
    console.log('🚀 [API] Mise à jour OPTIMISÉE statut:', { commandeId, statut });
    
    const statutsValides = ['en attente', 'payée', 'expédiée', 'annulée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ 
        message: 'Statut invalide. Statuts autorisés: ' + statutsValides.join(', ')
      });
    }
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // ÉTAPE 1: Récupérer TOUTES les données nécessaires en lecture seule d'abord
    const getAllDataQuery = `
      SELECT 
        c.id as commande_id,
        c.statut as ancien_statut,
        ca.article_id,
        ca.taille_id,
        ca.quantite as quantite_commandee,
        s.quantite as stock_actuel,
        a.nom as article_nom,
        t.nom as taille_nom
      FROM commandes c
      LEFT JOIN commande_articles ca ON c.id = ca.commande_id
      LEFT JOIN stocks s ON ca.article_id = s.article_id AND ca.taille_id = s.taille_id
      LEFT JOIN articles a ON ca.article_id = a.id
      LEFT JOIN tailles t ON ca.taille_id = t.id
      WHERE c.id = ? OR c.unique_id = ? OR c.numero_commande = ?
    `;
    
    const allData = await new Promise((resolve, reject) => {
      mysqlConnector.query(getAllDataQuery, [commandeId, commandeId, commandeId], (error: any, results: any) => {
        if (error) reject(error);
        else resolve(results);
      });
    }) as any[];

    if (!allData.length) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const commande = allData[0];
    const ancienStatut = commande.ancien_statut;
    const articlesData = allData.filter(item => item.article_id);

    console.log('⚡ [API] Données récupérées:', {
      commande_id: commande.commande_id,
      ancienStatut,
      nouveauStatut: statut,
      nbArticles: articlesData.length
    });

    // ÉTAPE 2: Déterminer quelles opérations sont nécessaires AVANT la transaction
    const operations = [];
    const stocksAffectes = articlesData.filter(item => {
      return (statut === 'expédiée' && ancienStatut !== 'expédiée') ||
             (ancienStatut === 'expédiée' && statut !== 'expédiée');
    });

    // Préparer toutes les opérations de stock
    for (const item of stocksAffectes) {
      const { article_id, taille_id, quantite_commandee, stock_actuel, article_nom, taille_nom } = item;
      
      let nouvelleQuantite: number;
      if (statut === 'expédiée' && ancienStatut !== 'expédiée') {
        nouvelleQuantite = Math.max(0, (stock_actuel || 0) - quantite_commandee);
        console.log(`📉 [API] Préparation: ${article_nom} ${taille_nom}: ${stock_actuel || 0} - ${quantite_commandee} = ${nouvelleQuantite}`);
      } else if (ancienStatut === 'expédiée' && statut !== 'expédiée') {
        nouvelleQuantite = (stock_actuel || 0) + quantite_commandee;
        console.log(`📈 [API] Préparation: ${article_nom} ${taille_nom}: ${stock_actuel || 0} + ${quantite_commandee} = ${nouvelleQuantite}`);
      } else {
        nouvelleQuantite = stock_actuel || 0;
      }

      operations.push({
        type: 'stock_update',
        query: 'UPDATE stocks SET quantite = ? WHERE article_id = ? AND taille_id = ?',
        params: [nouvelleQuantite, article_id, taille_id],
        description: `${article_nom} ${taille_nom} = ${nouvelleQuantite}`
      });
    }

    // Ajouter la mise à jour de commande
    operations.push({
      type: 'commande_update',
      query: 'UPDATE commandes SET statut = ? WHERE id = ?',
      params: [statut, commande.commande_id],
      description: `Commande ${commande.commande_id} = ${statut}`
    });

    // ÉTAPE 3: Exécuter TOUTES les opérations en UNE SEULE transaction rapide
    if (operations.length > 0) {
      console.log('🔧 [API] Transaction rapide avec', operations.length, 'opérations');
      
      // Démarrer la transaction
      await new Promise((resolve, reject) => {
        mysqlConnector.query('START TRANSACTION', [], (error: any) => {
          if (error) reject(error);
          else resolve(true);
        });
      });

      try {
        // Exécuter toutes les opérations rapidement
        for (const operation of operations) {
          await new Promise((resolve, reject) => {
            mysqlConnector.query(operation.query, operation.params, (error: any, results: any) => {
              if (error) {
                console.error(`❌ [API] Erreur ${operation.type}:`, error);
                reject(error);
              } else {
                console.log(`✅ [API] ${operation.description}`);
                resolve(results);
              }
            });
          });
        }

        // Commit immédiat
        await new Promise((resolve, reject) => {
          mysqlConnector.query('COMMIT', [], (error: any) => {
            if (error) reject(error);
            else resolve(true);
          });
        });

        console.log('✅ [API] Transaction rapide terminée avec succès');

      } catch (transactionError: any) {
        // Rollback en cas d'erreur
        await new Promise((resolve) => {
          mysqlConnector.query('ROLLBACK', [], () => resolve(true));
        });
        
        console.error('❌ [API] Erreur transaction, rollback effectué:', transactionError);
        throw transactionError;
      }
    } else {
      // Pas de stocks à modifier, juste mettre à jour le statut
      await new Promise((resolve, reject) => {
        mysqlConnector.query(
          'UPDATE commandes SET statut = ? WHERE id = ?',
          [statut, commande.commande_id],
          (error: any, results: any) => {
            if (error) reject(error);
            else resolve(results);
          }
        );
      });
      console.log('✅ [API] Statut mis à jour sans transaction');
    }
    
    res.json({ 
      message: 'Statut mis à jour avec succès',
      commandeId: commande.commande_id,
      ancienStatut,
      nouveauStatut: statut,
      stocksAffectes: stocksAffectes.length > 0,
      articlesTraites: stocksAffectes.length,
      optimized: true
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erreur mise à jour optimisée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du statut', 
      error: error.message 
    });
  }
});

// AJOUTÉ: Route pour batch update avec moins de risque de deadlock
router.put('/batch/statuts-safe', verifyToken, async (req: Request, res: Response) => {
  try {
    const { updates } = req.body; // Array de { commandeId, statut }
    
    console.log('🚀 [API] Batch update SÉCURISÉ de', updates.length, 'commandes');
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // Traiter une commande à la fois pour éviter les deadlocks
    const results = [];
    for (const update of updates) {
      try {
        await new Promise((resolve, reject) => {
          mysqlConnector.query(
            'UPDATE commandes SET statut = ? WHERE id = ?',
            [update.statut, update.commandeId],
            (error: any, result: any) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });
        
        results.push({ commandeId: update.commandeId, success: true });
        console.log(`✅ [API] Commande ${update.commandeId} -> ${update.statut}`);
        
      } catch (error: any) {
        results.push({ 
          commandeId: update.commandeId, 
          success: false, 
          error: error.message 
        });
        console.error(`❌ [API] Erreur commande ${update.commandeId}:`, error);
      }
    }
    
    res.json({ 
      message: 'Batch update terminé',
      results,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erreur batch update:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour en lot', 
      error: error.message 
    });
  }
});

// AJOUTÉ: Route pour debug et test de la gestion des stocks
router.get('/debug/stocks/:commandeId', verifyToken, async (req: Request, res: Response) => {
  try {
    const commandeId = req.params.commandeId;
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // Récupérer les informations de la commande et stocks actuels
    const debugQuery = `
      SELECT 
        c.id as commande_id,
        c.statut as commande_statut,
        ca.article_id,
        ca.taille_id,
        ca.quantite as quantite_commandee,
        a.nom as article_nom,
        t.nom as taille_nom,
        s.quantite as stock_actuel,
        s.id as stock_id
      FROM commandes c
      LEFT JOIN commande_articles ca ON c.id = ca.commande_id
      LEFT JOIN articles a ON ca.article_id = a.id
      LEFT JOIN tailles t ON ca.taille_id = t.id
      LEFT JOIN stocks s ON ca.article_id = s.article_id AND ca.taille_id = s.taille_id
      WHERE c.id = ?
    `;
    
    const debugData = await new Promise((resolve, reject) => {
      mysqlConnector.query(debugQuery, [commandeId], (error: any, results: any) => {
        if (error) reject(error);
        else resolve(results);
      });
    }) as any[];
    
    res.json({
      message: 'Debug informations commande et stocks',
      data: debugData,
      structure: {
        stocks_table: 'stocks(id, article_id, taille_id, quantite)',
        commande_articles_table: 'commande_articles(id, commande_id, article_id, taille_id, quantite, prix)'
      }
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erreur debug stocks commande:', error);
    res.status(500).json({ 
      message: 'Erreur lors du debug', 
      error: error.message 
    });
  }
});

// AJOUTÉ: Route pour debug de la structure des données
router.get('/debug/structure', verifyToken, async (req: Request, res: Response) => {
  try {
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // Structure des tables principales
    const structures = {};
    const tables = ['commandes', 'commande_articles', 'articles', 'tailles', 'utilisateurs'];
    
    for (const table of tables) {
      const structure = await new Promise((resolve, reject) => {
        mysqlConnector.query(`DESCRIBE ${table}`, [], (error: any, results: any) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
      (structures as any)[table] = structure;
    }
    
    // Exemple de données avec la vraie structure
    const sampleQuery = `
      SELECT 
        c.id, 
        c.numero_commande, 
        c.statut, 
        c.total,
        COUNT(ca.id) as nb_articles,
        GROUP_CONCAT(CONCAT(a.nom, ' (', t.nom, ')') SEPARATOR ', ') as articles_list
      FROM commandes c
      LEFT JOIN commande_articles ca ON c.id = ca.commande_id
      LEFT JOIN articles a ON ca.article_id = a.id
      LEFT JOIN tailles t ON ca.taille_id = t.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 3
    `;
    
    const sampleData = await new Promise((resolve, reject) => {
      mysqlConnector.query(sampleQuery, [], (error: any, results: any) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    res.json({
      message: 'Structure des tables avec relations correctes',
      structures: structures,
      sampleData: sampleData,
      relations: {
        'commandes -> utilisateurs': 'commandes.utilisateur_id = utilisateurs.id',
        'commandes -> commande_articles': 'commandes.id = commande_articles.commande_id',
        'commande_articles -> articles': 'commande_articles.article_id = articles.id',
        'commande_articles -> tailles': 'commande_articles.taille_id = tailles.id',
        'articles -> categories': 'articles.categorie_id = categories.id',
        'articles -> images': 'articles.id = images.article_id'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ [API] Erreur debug structure commandes:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la structure', 
      error: error.message 
    });
  }
});

// CORRIGÉ: Exemple de route utilisant le bon endpoint de confirmation de paiement
router.post('/paiement/confirmation', verifyToken, async (req: Request, res: Response) => {
  try {
    const { commandeId } = req.body;
    
    console.log('🔄 [API] Confirmation de paiement pour la commande:', commandeId);
    
    // Exemple d'utilisation du endpoint de confirmation de paiement
    const paymentResult = await processPayment({ commandeId });
    
    res.json({
      message: 'Paiement confirmé',
      data: paymentResult
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erreur confirmation paiement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la confirmation du paiement', 
      error: error.message 
    });
  }
});

// CORRIGÉ: Utiliser le bon endpoint dans la fonction de traitement de paiement
async function processPayment(commandeData: any) {
  try {
    console.log(`🔄 [Commandes] Appel endpoint de confirmation:`, PAYMENT_ENDPOINTS.confirmPayment);
    
    // CRITIQUE: Vérifier que l'endpoint existe avant l'appel
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Test de santé du module paiements
    try {
      const healthResponse = await fetch(`${baseUrl}${PAYMENT_ENDPOINTS.health}`);
      const healthData = await healthResponse.json();
      console.log(`🏥 [Commandes] Santé module paiements:`, healthData.status);
    } catch (healthError) {
      console.warn(`⚠️ [Commandes] Module paiements possiblement indisponible:`, healthError);
    }

    // CORRIGÉ: Utiliser le bon endpoint avec structure modulaire
    const response = await fetch(`${baseUrl}${PAYMENT_ENDPOINTS.confirmPayment}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || ''}`
      },
      body: JSON.stringify(commandeData)
    });

    console.log(`📡 [Commandes] Réponse confirmation paiement:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Commandes] Erreur confirmation paiement:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        endpoint: PAYMENT_ENDPOINTS.confirmPayment
      });
      
      throw new Error(`Erreur de confirmation: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ [Commandes] Paiement confirmé avec succès:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ [Commandes] Erreur lors de la confirmation de paiement:', error);
    throw error;
  }
}

// AJOUTÉ: Fonction pour valider que les endpoints de paiement existent
async function validatePaymentEndpoints() {
  const endpoints = Object.values(PAYMENT_ENDPOINTS);
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, { method: 'GET' });
      if (response.status === 404) {
        console.warn(`⚠️ [Commandes] Endpoint non disponible: ${endpoint}`);
      } else {
        console.log(`✅ [Commandes] Endpoint validé: ${endpoint}`);
      }
    } catch (error) {
      console.warn(`⚠️ [Commandes] Impossible de valider: ${endpoint}`, error);
    }
  }
}

// Dans la route de test ou d'initialisation - MISE À JOUR:
router.get('/debug/payment-endpoints', async (req, res) => {
  try {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // Tester tous les endpoints
    const endpointTests = await Promise.all(
      Object.entries(PAYMENT_ENDPOINTS).map(async ([name, endpoint]) => {
        try {
          const testResponse = await fetch(`${baseUrl}${endpoint}`, { method: 'GET' });
          return {
            name,
            endpoint,
            status: testResponse.status,
            available: testResponse.status !== 404
          };
        } catch (error) {
          return {
            name,
            endpoint,
            status: 'ERROR',
            available: false,
            error: (error as Error).message
          };
        }
      })
    );

    res.json({
      message: 'Endpoints de paiement utilisés par le module commandes',
      endpoints: PAYMENT_ENDPOINTS,
      tests: endpointTests,
      note: 'Structure modulaire selon paiements.ts: /paiements/{sous-module}/{action}',
      availableSubmodules: {
        crud: 'CRUD principal - /paiements/crud/',
        stripe: 'Intégration Stripe - /paiements/stripe/',
        confirmation: 'Confirmation paiements - /paiements/confirmation/',
        webhooks: 'Webhooks - /paiements/webhooks/',
        echeances: 'Échéances - /paiements/echeances/'
      },
      correctRoutes: {
        confirmPaymentCommande: '/paiements/confirmation/confirm-payment-commande',
        confirmPaymentEcheance: '/paiements/confirmation/confirm-payment',
        createPaymentIntentCommande: '/paiements/stripe/create-payment-intent-commande',
        createPaymentIntentEcheance: '/paiements/stripe/create-payment-intent',
        webhookStripe: '/paiements/webhooks/stripe'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du test des endpoints',
      error: (error as Error).message
    });
  }
});

export default router;