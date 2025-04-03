import express from 'express';
import { Statistiques } from '../db/clients/cours/statistiques.js';

const router = express.Router();

router.get('/:userId', async (req:any, res:any) => {
  // Récupérer userId depuis les paramètres et le convertir en nombre
  const userId = Number(req.params.userId);

  // Vérifier si la conversion a échoué (si userId n'est pas un nombre valide)
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'ID utilisateur invalide' });
  }

  try {
    const stats = new Statistiques()
    // On attend les résultats de la méthode obtenirPresenceParMois
    const results = await stats.obtenirPresenceParMois(userId);
    
    // Une fois les résultats obtenus, on les formate
    const formattedData = stats.formatPresenceData(results);
    
    // On envoie les données formatées en réponse
    res.json(formattedData);
  } catch (err) {
    // Si une erreur se produit, on renvoie une erreur 500 avec le message
    res.status(500).json({ error: 'Erreur lors de la récupération des données', details: err });
  }
});

export default router;

