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

// MODIFIÉ: Route de simulation unifiée pour échéances ET commandes - CORRIGÉE
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
      type: echeanceId ? 'echéance' : commandeId ? 'commande' : 'unknown'
    });

    // CORRIGÉ: Validation stricte
    if (!paymentIntentId || !userId) {
      return res.status(400).json({
        error: 'paymentIntentId et userId requis',
        received: { paymentIntentId, userId }
      });
    }

    if (!echeanceId && !commandeId) {
      return res.status(400).json({
        error: 'echeanceId OU commandeId requis',
        received: { echeanceId, commandeId }
      });
    }

    if (echeanceId && commandeId) {
      return res.status(400).json({
        error: 'echeanceId et commandeId ne peuvent pas être fournis simultanément',
        received: { echeanceId, commandeId }
      });
    }

    const paiements = new Paiements();

    // CORRIGÉ: Traitement selon le type avec vraie simulation
    if (echeanceId) {
      console.log('💰 [Paiements] Simulation échéance:', echeanceId);
      
      try {
        // AJOUTÉ: Simuler vraiment la confirmation de paiement d'échéance
        console.log('🔄 [Paiements] Simulation confirmation paiement échéance...');
        
        // 1. Vérifier que l'échéance existe
        const echeanceQuery = `
          SELECT id, utilisateur_id, montant, statut 
          FROM echeances_paiements 
          WHERE id = ? AND utilisateur_id = ?
        `;
        const echeanceResults = await paiements.queryAsync(echeanceQuery, [parseInt(echeanceId), parseInt(userId)]);
        
        if (echeanceResults.length === 0) {
          return res.status(404).json({
            error: 'Échéance non trouvée ou n\'appartient pas à cet utilisateur',
            debug: { echeanceId, userId }
          });
        }

        const echeance = echeanceResults[0];
        
        if (echeance.statut === 'payé') {
          return res.status(400).json({
            error: 'Cette échéance est déjà payée',
            debug: { echeanceId, currentStatus: echeance.statut }
          });
        }

        // 2. SIMULER: Marquer l'échéance comme payée
        const updateEcheanceQuery = `
          UPDATE echeances_paiements 
          SET statut = 'payé', date_paiement = CURDATE()
          WHERE id = ?
        `;
        await paiements.queryAsync(updateEcheanceQuery, [parseInt(echeanceId)]);

        // 3. SIMULER: Créer un enregistrement de paiement
        const paiementData = {
          utilisateur_id: parseInt(userId),
          montant: parseFloat(amount) || echeance.montant,
          methode_paiement: 'stripe',
          stripe_payment_intent_id: paymentIntentId,
          statut: 'validé',
          description: description || `Paiement simulé échéance #${echeanceId}`,
          date_paiement: new Date().toISOString().split('T')[0]
        };

        const paiementResult = await paiements.creerPaiement(paiementData);
        
        console.log('✅ [Paiements] Simulation échéance terminée avec succès');

        return res.status(200).json({
          success: true,
          message: 'Paiement échéance simulé avec succès',
          data: {
            type: 'echeance',
            echeanceId: parseInt(echeanceId),
            paiementId: paiementResult.id,
            paymentIntentId,
            userId: parseInt(userId),
            amount: paiementData.montant,
            status: 'succeeded',
            simulated: true,
            echeanceStatus: 'payé',
            dateSimulation: new Date().toISOString()
          }
        });

      } catch (echeanceError: any) {
        console.error('❌ [Paiements] Erreur simulation échéance:', echeanceError);
        return res.status(500).json({
          error: 'Erreur lors de la simulation de paiement d\'échéance',
          details: echeanceError.message
        });
      }
      
    } else if (commandeId) {
      console.log('🛒 [Paiements] Simulation commande:', commandeId);
      
      try {
        // AJOUTÉ: Simuler vraiment la confirmation de paiement de commande
        console.log('🔄 [Paiements] Simulation confirmation paiement commande...');
        
        // 1. Vérifier que la commande existe
        const commandeQuery = `
          SELECT c.id, c.utilisateur_id, c.statut, c.total,
                 COUNT(ca.id) as nb_articles
          FROM commandes c
          LEFT JOIN commande_articles ca ON c.id = ca.commande_id
          WHERE c.id = ? AND c.utilisateur_id = ?
          GROUP BY c.id
        `;
        const commandeResults = await paiements.queryAsync(commandeQuery, [parseInt(commandeId), parseInt(userId)]);
        
        if (commandeResults.length === 0) {
          return res.status(404).json({
            error: 'Commande non trouvée ou n\'appartient pas à cet utilisateur',
            debug: { commandeId, userId }
          });
        }

        const commande = commandeResults[0];
        
        if (commande.statut === 'payée') {
          return res.status(400).json({
            error: 'Cette commande est déjà payée',
            debug: { commandeId, currentStatus: commande.statut }
          });
        }

        // 2. SIMULER: Marquer la commande comme payée
        const updateCommandeQuery = `
          UPDATE commandes 
          SET statut = 'payée'
          WHERE id = ?
        `;
        await paiements.queryAsync(updateCommandeQuery, [parseInt(commandeId)]);

        // 3. SIMULER: Créer un enregistrement de paiement
        const paiementData = {
          commande_id: parseInt(commandeId),
          utilisateur_id: parseInt(userId),
          montant: parseFloat(amount) || commande.total,
          methode_paiement: 'stripe',
          stripe_payment_intent_id: paymentIntentId,
          statut: 'validé',
          description: description || `Paiement simulé commande #${commandeId}`,
          date_paiement: new Date().toISOString().split('T')[0]
        };

        const paiementResult = await paiements.creerPaiement(paiementData);
        
        console.log('✅ [Paiements] Simulation commande terminée avec succès');

        return res.status(200).json({
          success: true,
          message: 'Paiement commande simulé avec succès',
          data: {
            type: 'commande',
            commandeId: parseInt(commandeId),
            paiementId: paiementResult.id,
            paymentIntentId,
            userId: parseInt(userId),
            amount: paiementData.montant,
            status: 'succeeded',
            simulated: true,
            commandeStatus: 'payée',
            nbArticles: commande.nb_articles,
            dateSimulation: new Date().toISOString()
          }
        });

      } catch (commandeError: any) {
        console.error('❌ [Paiements] Erreur simulation commande:', commandeError);
        return res.status(500).json({
          error: 'Erreur lors de la simulation de paiement de commande',
          details: commandeError.message
        });
      }
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur générale simulation:', error);
    res.status(500).json({
      error: 'Erreur lors de la simulation de paiement',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export { router as paiementsRoutes };