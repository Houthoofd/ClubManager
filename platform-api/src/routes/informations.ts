import express from 'express';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { informationService } from '../services/index.js';

const router = express.Router();


router.get('/grades', async (req:any, res:any) => {
  try {
    // Use new informationService instead of legacy client
    const grades = await informationService.getGrades();

    if (grades && grades.length > 0) {
      console.log('Grades récupérés:', grades);
      res.status(200).json(grades);
    } else {
      console.log('Aucun grade trouvé.');
      res.status(404).json({ message: 'Aucun grade trouvé.' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des grades :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des grades.' });
  }
});

router.get('/genres', async (req:any, res:any) => {
  try {
    // Use new informationService instead of legacy client
    const genres = await informationService.getGenres();

    if (genres && genres.length > 0) {
      console.log('Genres récupérés:', genres);
      res.status(200).json(genres); 
    } else {
      console.log('Aucun genres trouvé.');
      res.status(404).json({ message: 'Aucun genres trouvé.' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des genres :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des genres.' });
  }
});

router.get('/status', async (req:any, res:any) => {
  try {
    // Use new informationService instead of legacy client
    const status = await informationService.getStatus();

    if (status && status.length > 0) {
      console.log('Status récupérés:', status);
      res.status(200).json(status);
    } else {
      console.log('Aucun status trouvé.');
      res.status(404).json({ message: 'Aucun status trouvé.' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des status :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des status.' });
  }
});

router.get('/abonnements', async (req:any, res:any) => {
  try {
    // Use new informationService instead of legacy client
    const plansTarifaires = await informationService.getPlansTarifaires();

    if (plansTarifaires && plansTarifaires.length > 0) {
      console.log('plans tarifaires récupérés:', plansTarifaires);
      res.status(200).json(plansTarifaires);
    } else {
      console.log('Aucun plans tarifaires trouvé.');
      res.status(404).json({ message: 'Aucun plans tarifaires trouvé.' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des plans tarifaires :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des plans tarifaires.' });
  }
});


export default router;
