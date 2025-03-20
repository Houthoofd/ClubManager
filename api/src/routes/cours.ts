import express from 'express';
import { Cours } from '../db/clients/cours/cours.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const client = new Cours();
    
    // Appel de la méthode pour obtenir les grades
    const cours = await client.obtenirLesCours();

    if (cours && cours.length > 0) {
      console.log('Cours récupérés:', cours);
      res.status(200).json(cours);
    } else {
      console.log('Aucun cours trouvé.');
      res.status(404).json({ message: 'Aucun cours trouvé.' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des cours :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours.' });
  }
});

export default router;