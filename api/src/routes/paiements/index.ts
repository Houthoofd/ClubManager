import express from 'express';

const router = express.Router();

console.log('🔧 [Paiements] Initialisation du module de paiements modulaire');

// Variables pour stocker les modules une fois chargés
let stripeRoutes: any = null;
let paiementsRoutes: any = null;
let webhooksRoutes: any = null;
let testRoutes: any = null;
let echeancesRoutes: any = null;
let modulesLoaded = false;

// Fonction pour charger tous les modules
async function loadAllModules() {
  if (modulesLoaded) return;
  
  console.log('📦 [Paiements] Chargement des modules disponibles...');

  // Module stripe (existant) - EN PREMIER
  try {
    const stripeModule = await import('./stripe.js');
    stripeRoutes = stripeModule.stripeRoutes;
    router.use('/stripe', stripeRoutes);
    console.log('✅ [Paiements] Module stripe chargé');
  } catch (error) {
    console.warn('⚠️ [Paiements] Module stripe non disponible');
  }

  // Module paiements CRUD (existant) - APRÈS les routes spécifiques
  try {
    const paiementsModule = await import('./paiements.js');
    paiementsRoutes = paiementsModule.paiementsRoutes;
    router.use('/', paiementsRoutes);
    console.log('✅ [Paiements] Module paiements CRUD chargé');
  } catch (error) {
    console.warn('⚠️ [Paiements] Module paiements CRUD non disponible');
  }

  // Module webhooks (existant)
  try {
    const webhooksModule = await import('./webhooks.js');
    webhooksRoutes = webhooksModule.webhooksRoutes;
    router.use('/webhook', webhooksRoutes);
    console.log('✅ [Paiements] Module webhooks chargé');
  } catch (error) {
    console.warn('⚠️ [Paiements] Module webhooks non disponible');
  }

  // Module test (existant)
  try {
    const testModule = await import('./test.js');
    testRoutes = testModule.testRoutes;
    router.use('/test', testRoutes);
    console.log('✅ [Paiements] Module test chargé');
  } catch (error) {
    console.warn('⚠️ [Paiements] Module test non disponible');
  }

  // Module echeances EN DERNIER pour éviter les conflits - UNE SEULE FOIS
  try {
    const echeancesModule = await import('./echeances.js');
    echeancesRoutes = echeancesModule.echeancesRoutes;
    router.use('/echeances', echeancesRoutes);
    console.log('✅ [Paiements] Module echeances chargé');
  } catch (error) {
    console.warn('⚠️ [Paiements] Module echeances non disponible');
  }

  modulesLoaded = true;
  console.log('✅ [Paiements] Module modulaire initialisé');
}

// Route de compatibilité pour POST /paiements - Détection automatique du type
// IMPORTANT: AVANT les autres routes pour éviter les conflits
router.post('/', async (req, res) => {
  console.log('🔄 [Paiements] Route POST / appelée - Détection automatique du type:', req.body);
  
  try {
    await loadAllModules();
    
    const { amount, echeanceId, commande, userId, currency = 'eur', description } = req.body;
    
    // Détection automatique du type de paiement
    if (echeanceId && userId && !commande) {
      // PAIEMENT D'ÉCHÉANCE
      console.log('🏦 [Paiements] Détecté: Paiement d\'échéance - Redirection vers /stripe/create-payment-intent');
      
      if (!stripeRoutes) {
        return res.status(503).json({ error: 'Module stripe non disponible' });
      }
      
      const newReq = {
        ...req,
        url: '/create-payment-intent',
        originalUrl: req.originalUrl.replace('/', '/stripe/create-payment-intent'),
        path: '/create-payment-intent',
        body: {
          amount,
          currency,
          echeanceId,
          userId,
          description: description || `Paiement échéance #${echeanceId}`
        }
      };
      
      stripeRoutes(newReq as any, res, (err: any) => {
        if (err) {
          console.error('❌ [Paiements] Erreur redirection échéance:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur de redirection interne pour échéance' });
          }
        }
      });
      
    } else if (commande && commande.articles && commande.utilisateur_id) {
      // PAIEMENT DE COMMANDE MAGASIN
      console.log('🛒 [Paiements] Détecté: Paiement de commande magasin - Redirection vers /stripe/create-payment-intent-commande');
      
      if (!stripeRoutes) {
        return res.status(503).json({ error: 'Module stripe non disponible' });
      }
      
      const newReq = {
        ...req,
        url: '/create-payment-intent-commande',
        originalUrl: req.originalUrl.replace('/', '/stripe/create-payment-intent-commande'),
        path: '/create-payment-intent-commande',
        body: {
          amount,
          currency,
          commande,
          description: description || `Commande magasin - ${commande.articles.length} article(s)`
        }
      };
      
      stripeRoutes(newReq as any, res, (err: any) => {
        if (err) {
          console.error('❌ [Paiements] Erreur redirection commande:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur de redirection interne pour commande' });
          }
        }
      });
      
    } else {
      // TYPE DE PAIEMENT NON RECONNU
      console.error('❌ [Paiements] Type de paiement non reconnu:', {
        hasEcheanceId: !!echeanceId,
        hasUserId: !!userId,
        hasCommande: !!commande,
        hasArticles: !!(commande?.articles),
        hasUtilisateurId: !!(commande?.utilisateur_id)
      });
      
      res.status(400).json({ 
        error: 'Type de paiement non reconnu',
        debug: {
          received: { echeanceId, userId, commande: !!commande },
          expectedForEcheance: 'echeanceId + userId (sans commande)',
          expectedForCommande: 'commande avec articles et utilisateur_id'
        },
        suggestion: 'Vérifiez que vous envoyez les bonnes données selon le type de paiement'
      });
    }
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur route POST / :', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erreur lors de la détection du type de paiement',
        details: error.message 
      });
    }
  }
});

// Routes de compatibilité pour les anciennes routes Stripe
router.post('/create-payment-intent', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /create-payment-intent → /stripe/create-payment-intent`);
  try {
    await loadAllModules();
    
    if (!stripeRoutes) {
      return res.status(503).json({ error: 'Module stripe non disponible' });
    }
    
    const newReq = {
      ...req,
      url: '/create-payment-intent',
      originalUrl: req.originalUrl.replace('/create-payment-intent', '/stripe/create-payment-intent'),
      path: '/create-payment-intent'
    };
    
    stripeRoutes(newReq as any, res, (err: any) => {
      if (err) {
        console.error('❌ [Paiements] Erreur redirection stripe:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de redirection interne' });
        }
      }
    });
  } catch (error) {
    console.error('❌ [Paiements] Erreur import module stripe:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Module stripe non disponible' });
    }
  }
});

// Route de compatibilité pour POST /confirm-payment - Détection automatique
router.post('/confirm-payment', async (req, res) => {
  console.log('🔄 [Paiements] Route POST /confirm-payment appelée - Détection automatique:', req.body);
  
  try {
    await loadAllModules();
    
    const { paymentIntentId, echeanceId, commandeId, userId } = req.body;
    
    if (!stripeRoutes) {
      return res.status(503).json({ error: 'Module stripe non disponible' });
    }
    
    if (echeanceId && !commandeId) {
      // CONFIRMATION PAIEMENT D'ÉCHÉANCE
      console.log('🏦 [Paiements] Détecté: Confirmation paiement échéance - Redirection vers /stripe/confirm-payment');
      
      const newReq = {
        ...req,
        url: '/confirm-payment',
        originalUrl: req.originalUrl.replace('/confirm-payment', '/stripe/confirm-payment'),
        path: '/confirm-payment'
      };
      
      stripeRoutes(newReq as any, res, (err: any) => {
        if (err) {
          console.error('❌ [Paiements] Erreur redirection confirmation échéance:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur de redirection interne pour confirmation échéance' });
          }
        }
      });
      
    } else if (commandeId && !echeanceId) {
      // CONFIRMATION PAIEMENT DE COMMANDE
      console.log('🛒 [Paiements] Détecté: Confirmation paiement commande - Redirection vers /stripe/confirm-payment-commande');
      
      const newReq = {
        ...req,
        url: '/confirm-payment-commande',
        originalUrl: req.originalUrl.replace('/confirm-payment', '/stripe/confirm-payment-commande'),
        path: '/confirm-payment-commande'
      };
      
      stripeRoutes(newReq as any, res, (err: any) => {
        if (err) {
          console.error('❌ [Paiements] Erreur redirection confirmation commande:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur de redirection interne pour confirmation commande' });
          }
        }
      });
      
    } else {
      // TYPE DE CONFIRMATION NON RECONNU
      console.error('❌ [Paiements] Type de confirmation non reconnu:', {
        hasEcheanceId: !!echeanceId,
        hasCommandeId: !!commandeId,
        hasUserId: !!userId
      });
      
      res.status(400).json({ 
        error: 'Type de confirmation non reconnu',
        debug: {
          received: { echeanceId, commandeId, userId },
          expectedForEcheance: 'echeanceId (sans commandeId)',
          expectedForCommande: 'commandeId (sans echeanceId)'
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ [Paiements] Erreur route POST /confirm-payment :', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erreur lors de la détection du type de confirmation',
        details: error.message 
      });
    }
  }
});

// Routes de compatibilité pour les commandes magasin
router.post('/create-payment-intent-commande', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /create-payment-intent-commande → /stripe/create-payment-intent-commande`);
  try {
    await loadAllModules();
    
    if (!stripeRoutes) {
      return res.status(503).json({ error: 'Module stripe non disponible' });
    }
    
    const newReq = {
      ...req,
      url: '/create-payment-intent-commande',
      originalUrl: req.originalUrl.replace('/create-payment-intent-commande', '/stripe/create-payment-intent-commande'),
      path: '/create-payment-intent-commande'
    };
    
    stripeRoutes(newReq as any, res, (err: any) => {
      if (err) {
        console.error('❌ [Paiements] Erreur redirection stripe commande:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de redirection interne' });
        }
      }
    });
  } catch (error) {
    console.error('❌ [Paiements] Erreur import module stripe commande:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Module stripe non disponible' });
    }
  }
});

router.post('/confirm-payment-commande', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /confirm-payment-commande → /stripe/confirm-payment-commande`);
  try {
    await loadAllModules();
    
    if (!stripeRoutes) {
      return res.status(503).json({ error: 'Module stripe non disponible' });
    }
    
    const newReq = {
      ...req,
      url: '/confirm-payment-commande',
      originalUrl: req.originalUrl.replace('/confirm-payment-commande', '/stripe/confirm-payment-commande'),
      path: '/confirm-payment-commande'
    };
    
    stripeRoutes(newReq as any, res, (err: any) => {
      if (err) {
        console.error('❌ [Paiements] Erreur redirection stripe confirm commande:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de redirection interne' });
        }
      }
    });
  } catch (error) {
    console.error('❌ [Paiements] Erreur import module stripe confirm commande:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Module stripe non disponible' });
    }
  }
});

// Routes de compatibilité pour les tests
router.post('/force-payment-success', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /force-payment-success → /test/force-payment-success`);
  try {
    await loadAllModules();
    
    if (!testRoutes) {
      return res.status(503).json({ error: 'Module test non disponible' });
    }
    
    const newReq = {
      ...req,
      url: '/force-payment-success',
      originalUrl: req.originalUrl.replace('/force-payment-success', '/test/force-payment-success'),
      path: '/force-payment-success'
    };
    
    testRoutes(newReq as any, res, (err: any) => {
      if (err) {
        console.error('❌ [Paiements] Erreur redirection test:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de redirection interne' });
        }
      }
    });
  } catch (error) {
    console.error('❌ [Paiements] Erreur import module test:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Module test non disponible' });
    }
  }
});

// Route de compatibilité pour les échéances
router.get('/echeance/:echeanceId', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /echeance/${req.params.echeanceId} → /echeances/echeance/`);
  try {
    await loadAllModules();
    
    if (!echeancesRoutes) {
      return res.status(503).json({ error: 'Module echeances non disponible' });
    }
    
    const newReq = {
      ...req,
      url: `/echeance/${req.params.echeanceId}`,
      originalUrl: req.originalUrl.replace('/echeance/', '/echeances/echeance/'),
      path: `/echeance/${req.params.echeanceId}`
    };
    
    echeancesRoutes(newReq as any, res, (err: any) => {
      if (err) {
        console.error('❌ [Paiements] Erreur redirection echeances:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de redirection interne' });
        }
      }
    });
  } catch (error) {
    console.error('❌ [Paiements] Erreur redirection echeances:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Module echeances non disponible' });
    }
  }
});

// Route de santé minimaliste
router.get('/health', async (req, res) => {
  await loadAllModules();
  
  res.json({ 
    status: 'Module paiements modulaire actif',
    timestamp: new Date().toISOString(),
    modules: {
      stripe: !!stripeRoutes,
      paiements: !!paiementsRoutes,
      webhooks: !!webhooksRoutes,
      test: !!testRoutes,
      echeances: !!echeancesRoutes
    },
    compatibility: [
      'GET /paiements/echeance/:id → /paiements/echeances/echeance/:id',
      'POST /paiements/create-payment-intent → /paiements/stripe/create-payment-intent',
      'POST /paiements/confirm-payment → /paiements/stripe/confirm-payment',
      'POST /paiements/create-payment-intent-commande → /paiements/stripe/create-payment-intent-commande',
      'POST /paiements/confirm-payment-commande → /paiements/stripe/confirm-payment-commande',
      'POST /paiements/force-payment-success → /paiements/test/force-payment-success',
      'POST /paiements → Auto-détection (échéance ou commande)',
      'POST /paiements/confirm-payment → Auto-détection (échéance ou commande)'
    ]
  });
});

export default router;
