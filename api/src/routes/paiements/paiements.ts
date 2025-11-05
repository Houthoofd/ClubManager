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

// PUT - Mettre à jour le statut d'un paiement
router.put('/update', async (req, res) => {
  const { id, statut } = req.body;
  
  if (!id || !statut) {
    return res.status(400).json({ error: 'ID et statut requis' });
  }

  try {
    const paiements = new Paiements();
    const result = await paiements.mettreAJourStatutPaiement(id, statut);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du paiement', error });
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

export { router as paiementsRoutes };