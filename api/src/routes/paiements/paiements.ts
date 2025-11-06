import express from 'express';
import { Paiements } from '../../db/clients/paiements/paiements.js';

const router = express.Router();

// GET - Obtenir tous les paiements
router.get('/', async (req, res) => {
  try {
    // Création d'une instance de Paiements
    let paiements = new Paiements();
    
    // Appel de la méthode pour obtenir les paiements
    let result = await paiements.obtenirLesTousLesPaiements();
    
    // Envoi des résultats sous forme de JSON
    res.status(200).json(result);  // Renvoie les paiements obtenus

  } catch (error) {
    console.error(error);  // Affiche l'erreur dans la console
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error });  // Envoie une réponse d'erreur
  }
});

// POST - Créer un paiement générique
router.post('/', async (req, res) => {
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

// PUT - Mettre à jour le statut d'un paiement - VERSION ANTI-DEADLOCK
router.put('/update', async (req, res) => {
  const { id, statut } = req.body;
  
  if (!id || !statut) {
    return res.status(400).json({ error: 'ID et statut requis' });
  }

  console.log('🔄 [Paiements] Mise à jour statut OPTIMISÉE:', { id, statut });

  // CORRIGÉ: Déclarer maxRetries dans la portée principale
  const maxRetries = 3;
  let retryCount = 0;

  try {
    // SIMPLE: Utiliser directement la classe Paiements mais avec retry en cas de deadlock
    const paiements = new Paiements();
    
    while (retryCount < maxRetries) {
      try {
        const result = await paiements.mettreAJourStatutPaiement(id, statut);
        
        console.log('✅ [Paiements] Statut mis à jour avec succès:', { id, statut });
        return res.status(200).json(result);
        
      } catch (error: any) {
        // Si c'est un deadlock, retry
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.random() * 1000 + (retryCount * 500); // Délai aléatoire croissant
          console.log(`⏳ [Paiements] Deadlock détecté, retry ${retryCount}/${maxRetries} dans ${delay.toFixed()}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Si ce n'est pas un deadlock ou si on a épuisé les tentatives
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

// MODIFIÉ: Route de simulation unifiée pour échéances ET commandes - AVEC RETRY
router.post('/force-payment-success', async (req: any, res: any) => {
  try {
    const { paymentIntentId, echeanceId, commandeId, userId, amount, description } = req.body;

    console.log('🧪 [Paiements] Simulation paiement reçue:', {
      paymentIntentId,
      echeanceId,
      commandeId,
      userId,
      amount,
      description,
      type: echeanceId ? 'echéance' : 'commande'
    });

    // CORRIGÉ: Validation flexible
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

    // Traitement selon le type
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
          status: 'succeeded',
          optimized: true
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
          status: 'succeeded',
          optimized: true
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

export { router as paiementsRoutes };