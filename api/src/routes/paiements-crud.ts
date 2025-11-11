import express from 'express';
import { Paiements } from '../db/clients/paiements/paiements.js';

const router = express.Router();

console.log('💳 [CRUD Paiements] Initialisation du module CRUD des paiements');

// GET - Récupérer tous les paiements avec filtres
router.get('/', async (req, res) => {
  try {
    console.log('📋 [CRUD] Récupération des paiements - Paramètres:', req.query);
    
    const paiements = new Paiements();
    
    // Extraire les filtres depuis les query params
    const utilisateurId = req.query.utilisateur_id ? parseInt(req.query.utilisateur_id as string) : null;
    const statut = req.query.statut as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    let resultats;

    if (utilisateurId) {
      console.log(`👤 [CRUD] Récupération paiements pour utilisateur: ${utilisateurId}`);
      resultats = await paiements.obtenirPaiementsParUtilisateur(utilisateurId);
    } else {
      console.log('📊 [CRUD] Récupération de tous les paiements');
      resultats = await paiements.obtenirLesTousLesPaiements();
    }

    // Filtrer par statut si spécifié
    if (statut) {
      resultats = (resultats as any[]).filter((p: any) => 
        p.statut && p.statut.toLowerCase() === statut.toLowerCase()
      );
    }

    // Appliquer pagination
    const total = (resultats as any[]).length;
    const paginatedResults = (resultats as any[]).slice(offset, offset + limit);

    console.log(`✅ [CRUD] ${paginatedResults.length}/${total} paiements récupérés`);

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        utilisateurId,
        statut
      }
    });

  } catch (error: any) {
    console.error('❌ [CRUD] Erreur récupération paiements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des paiements',
      details: error.message
    });
  }
});

// POST - Créer un nouveau paiement
router.post('/', async (req, res) => {
  try {
    console.log('💳 [CRUD] Création nouveau paiement:', req.body);
    
    const {
      utilisateur_id,
      montant,
      methode_paiement,
      commande_id,
      stripe_payment_intent_id,
      paypal_order_id,
      bitcoin_address,
      statut = 'en_attente',
      description,
      abonnement_id,
      echeance_id
    } = req.body;

    // Validation des données requises
    if (!utilisateur_id || !montant || !methode_paiement) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        required: ['utilisateur_id', 'montant', 'methode_paiement']
      });
    }

    if (isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Montant invalide',
        montant
      });
    }

    const paiements = new Paiements();
    
    const paiementData = {
      commande_id: commande_id ? parseInt(commande_id) : undefined,
      utilisateur_id: parseInt(utilisateur_id),
      montant: parseFloat(montant),
      methode_paiement,
      stripe_payment_intent_id,
      paypal_order_id,
      bitcoin_address,
      statut,
      description,
      abonnement_id: abonnement_id ? parseInt(abonnement_id) : undefined,
      echeance_id: echeance_id ? parseInt(echeance_id) : undefined
    };

    console.log('📝 [CRUD] Données paiement préparées:', paiementData);

    const result = await paiements.creerPaiement(paiementData);
    
    console.log('✅ [CRUD] Paiement créé avec succès:', result.id);

    res.status(201).json({
      success: true,
      message: 'Paiement créé avec succès',
      data: result
    });

  } catch (error: any) {
    console.error('❌ [CRUD] Erreur création paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du paiement',
      details: error.message
    });
  }
});

// GET - Récupérer un paiement spécifique par ID
router.get('/:id', async (req, res) => {
  try {
    const paiementId = parseInt(req.params.id);
    
    console.log(`🔍 [CRUD] Récupération paiement ID: ${paiementId}`);

    if (isNaN(paiementId)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement invalide'
      });
    }

    const paiements = new Paiements();
    
    // Récupérer tous les paiements et filtrer par ID (méthode simple)
    const tousLesPaiements = await paiements.obtenirLesTousLesPaiements();
    const paiement = (tousLesPaiements as any[]).find(p => p.id === paiementId);

    if (!paiement) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    console.log(`✅ [CRUD] Paiement ${paiementId} récupéré`);

    res.json({
      success: true,
      data: paiement
    });

  } catch (error: any) {
    console.error('❌ [CRUD] Erreur récupération paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du paiement',
      details: error.message
    });
  }
});

// PUT - Modifier un paiement existant
router.put('/:id', async (req, res) => {
  try {
    const paiementId = parseInt(req.params.id);
    
    console.log(`📝 [CRUD] Modification paiement ID: ${paiementId}`, req.body);

    if (isNaN(paiementId)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement invalide'
      });
    }

    const paiements = new Paiements();
    
    const result = await paiements.modifierPaiement(paiementId, req.body);
    
    if (!result.isConfirm) {
      return res.status(404).json({
        success: false,
        error: result.message || 'Paiement non trouvé'
      });
    }

    console.log(`✅ [CRUD] Paiement ${paiementId} modifié avec succès`);

    res.json({
      success: true,
      message: result.message,
      paiement_id: paiementId
    });

  } catch (error: any) {
    console.error('❌ [CRUD] Erreur modification paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification du paiement',
      details: error.message
    });
  }
});

// DELETE - Supprimer un paiement
router.delete('/:id', async (req, res) => {
  try {
    const paiementId = parseInt(req.params.id);
    
    console.log(`🗑️ [CRUD] Suppression paiement ID: ${paiementId}`);

    if (isNaN(paiementId)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement invalide'
      });
    }

    const paiements = new Paiements();
    
    const result = await paiements.supprimerPaiement(paiementId);
    
    if (!result.isConfirm) {
      return res.status(404).json({
        success: false,
        error: result.message || 'Paiement non trouvé'
      });
    }

    console.log(`✅ [CRUD] Paiement ${paiementId} supprimé avec succès`);

    res.json({
      success: true,
      message: result.message,
      paiement_id: paiementId
    });

  } catch (error: any) {
    console.error('❌ [CRUD] Erreur suppression paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du paiement',
      details: error.message
    });
  }
});

// PUT - Mettre à jour le statut d'un paiement
router.put('/:id/statut', async (req, res) => {
  try {
    const paiementId = parseInt(req.params.id);
    const { statut } = req.body;
    
    console.log(`📊 [CRUD] Mise à jour statut paiement ID: ${paiementId} → ${statut}`);

    if (isNaN(paiementId)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement invalide'
      });
    }

    if (!statut) {
      return res.status(400).json({
        success: false,
        error: 'Statut requis'
      });
    }

    const paiements = new Paiements();
    
    const result = await paiements.mettreAJourStatutPaiement(paiementId, statut);
    
    if (!result.isConfirm) {
      return res.status(404).json({
        success: false,
        error: result.message || 'Paiement non trouvé'
      });
    }

    console.log(`✅ [CRUD] Statut paiement ${paiementId} mis à jour: ${statut}`);

    res.json({
      success: true,
      message: result.message,
      paiement_id: paiementId,
      nouveau_statut: statut
    });

  } catch (error: any) {
    console.error('❌ [CRUD] Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut',
      details: error.message
    });
  }
});

// GET - Récupérer les paiements d'un utilisateur spécifique
router.get('/utilisateur/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    console.log(`👤 [CRUD] Récupération paiements utilisateur: ${userId}`);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID utilisateur invalide'
      });
    }

    const paiements = new Paiements();
    
    const result = await paiements.obtenirPaiementsParUtilisateur(userId);
    
    console.log(`✅ [CRUD] ${(result as any[]).length} paiements récupérés pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      data: result,
      utilisateur_id: userId,
      count: (result as any[]).length
    });

  } catch (error: any) {
    console.error('❌ [CRUD] Erreur récupération paiements utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des paiements utilisateur',
      details: error.message
    });
  }
});

// Route de santé pour le module CRUD - AJOUTÉ: Route dédiée pour debugging
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    module: 'paiements-crud',
    description: 'Module CRUD principal pour les paiements',
    routes: [
      'GET / - Tous les paiements avec filtres',
      'POST / - Créer nouveau paiement',
      'GET /:id - Paiement spécifique',
      'PUT /:id - Modifier paiement',
      'DELETE /:id - Supprimer paiement',
      'PUT /:id/statut - Mettre à jour statut',
      'GET /utilisateur/:userId - Paiements par utilisateur',
      'GET /health - Statut du module CRUD'
    ],
    middleware: 'Authentification flexible requise pour toutes les routes',
    timestamp: new Date().toISOString()
  });
});

// AJOUTÉ: Route de test simple pour vérifier le chargement
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Module CRUD des paiements est fonctionnel',
    timestamp: new Date().toISOString(),
    user: (req as any).user || null
  });
});

console.log('✅ [CRUD Paiements] Module CRUD des paiements initialisé');

export default router;
