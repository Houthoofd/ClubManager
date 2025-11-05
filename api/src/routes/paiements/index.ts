import express from 'express';

const router = express.Router();

console.log('🔧 [Paiements] Initialisation du module de paiements modulaire');

// Import des modules existants seulement
console.log('📦 [Paiements] Chargement des modules disponibles...');

// Module paiements CRUD (existant)
try {
  const { paiementsRoutes } = await import('./paiements.js');
  router.use('/', paiementsRoutes);
  console.log('✅ [Paiements] Module paiements CRUD chargé');
} catch (error) {
  console.warn('⚠️ [Paiements] Module paiements CRUD non disponible');
}

// Module stripe (existant) - AVANT les routes de compatibilité
try {
  const { stripeRoutes } = await import('./stripe.js');
  router.use('/stripe', stripeRoutes);
  console.log('✅ [Paiements] Module stripe chargé');
} catch (error) {
  console.warn('⚠️ [Paiements] Module stripe non disponible');
}

// Routes de compatibilité pour les anciennes routes Stripe
// IMPORTANT: Après le chargement du module stripe mais avant les autres modules
router.post('/create-payment-intent', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /create-payment-intent → /stripe/create-payment-intent`);
  try {
    // Redirection interne vers le module stripe
    const { stripeRoutes } = await import('./stripe.js');
    
    // Créer une nouvelle requête avec la bonne URL
    const newReq = {
      ...req,
      url: '/create-payment-intent',
      originalUrl: req.originalUrl.replace('/create-payment-intent', '/stripe/create-payment-intent'),
      path: '/create-payment-intent'
    };
    
    // Appeler directement la route du module stripe
    stripeRoutes(newReq as any, res, (err: any) => {
      if (err) {
        console.error('❌ [Paiements] Erreur redirection stripe:', err);
        res.status(500).json({ error: 'Erreur de redirection interne' });
      }
    });
  } catch (error) {
    console.error('❌ [Paiements] Erreur import module stripe:', error);
    res.status(500).json({ error: 'Module stripe non disponible' });
  }
});

router.post('/confirm-payment', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /confirm-payment → /stripe/confirm-payment`);
  try {
    const { stripeRoutes } = await import('./stripe.js');
    
    const newReq = {
      ...req,
      url: '/confirm-payment',
      originalUrl: req.originalUrl.replace('/confirm-payment', '/stripe/confirm-payment'),
      path: '/confirm-payment'
    };
    
    stripeRoutes(newReq as any, res, (err: any) => {
      if (err) {
        console.error('❌ [Paiements] Erreur redirection stripe confirm:', err);
        res.status(500).json({ error: 'Erreur de redirection interne' });
      }
    });
  } catch (error) {
    console.error('❌ [Paiements] Erreur import module stripe confirm:', error);
    res.status(500).json({ error: 'Module stripe non disponible' });
  }
});

// Module webhooks (existant)
try {
  const { webhooksRoutes } = await import('./webhooks.js');
  router.use('/webhook', webhooksRoutes);
  console.log('✅ [Paiements] Module webhooks chargé');
} catch (error) {
  console.warn('⚠️ [Paiements] Module webhooks non disponible');
}

// Module test (existant)
try {
  const { testRoutes } = await import('./test.js');
  router.use('/test', testRoutes);
  console.log('✅ [Paiements] Module test chargé');
} catch (error) {
  console.warn('⚠️ [Paiements] Module test non disponible');
}

// Routes de compatibilité pour les tests
// POST /paiements/force-payment-success → /paiements/test/force-payment-success
router.post('/force-payment-success', async (req, res) => {
  console.log(`🔄 [Paiements] Redirection /force-payment-success → /test/force-payment-success`);
  try {
    const { testRoutes } = await import('./test.js');
    
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

// Module echeances EN DERNIER pour éviter les conflits
try {
  const { echeancesRoutes } = await import('./echeances.js');
  router.use('/echeances', echeancesRoutes);
  
  // Route de compatibilité pour les échéances
  router.get('/echeance/:echeanceId', async (req, res) => {
    console.log(`🔄 [Paiements] Redirection /echeance/${req.params.echeanceId} → /echeances/echeance/`);
    try {
      const newReq = {
        ...req,
        url: `/echeance/${req.params.echeanceId}`,
        originalUrl: req.originalUrl.replace('/echeance/', '/echeances/echeance/'),
        path: `/echeance/${req.params.echeanceId}`
      };
      
      echeancesRoutes(newReq as any, res, (err: any) => {
        if (err) {
          console.error('❌ [Paiements] Erreur redirection echeances:', err);
          res.status(500).json({ error: 'Erreur de redirection interne' });
        }
      });
    } catch (error) {
      console.error('❌ [Paiements] Erreur redirection echeances:', error);
      res.status(500).json({ error: 'Module echeances non disponible' });
    }
  });
  
  console.log('✅ [Paiements] Module echeances chargé');
} catch (error) {
  console.warn('⚠️ [Paiements] Module echeances non disponible');
}

// Route de santé minimaliste
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Module paiements modulaire actif',
    timestamp: new Date().toISOString(),
    modules: ['paiements', 'stripe', 'echeances', 'webhooks', 'test'],
    compatibility: [
      'GET /paiements/echeance/:id → /paiements/echeances/echeance/:id',
      'POST /paiements/create-payment-intent → /paiements/stripe/create-payment-intent',
      'POST /paiements/confirm-payment → /paiements/stripe/confirm-payment',
      'POST /paiements/force-payment-success → /paiements/test/force-payment-success'
    ]
  });
});

console.log('✅ [Paiements] Module modulaire initialisé');

export default router;
