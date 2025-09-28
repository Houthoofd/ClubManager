import express from 'express';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { Informations } from '../db/clients/informations/informations.js';

const router = express.Router();


router.get('/grades', async (req, res) => {
  try {
    const client = new Informations();
    const grades = await client.obtenirLesGrades();
    
    if (grades && grades.data && grades.data.length > 0) {
      res.json({
        isFind: true,
        message: "Grades trouvés",
        data: grades.data
      });
    } else {
      res.json({
        isFind: false,
        message: "Aucun grade trouvé",
        data: []
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des grades:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/genres', async (req, res) => {
  try {
    const client = new Informations();
    const genres = await client.obtenirLesGenres();
    
    if (genres && genres.data && genres.data.length > 0) {
      res.json({
        isFind: true,
        message: "Genres trouvés",
        data: genres.data
      });
    } else {
      res.json({
        isFind: false,
        message: "Aucun genre trouvé",
        data: []
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des genres:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const client = new Informations();
    const status = await client.obtenirLesStatus();
    
    if (status && status.data) {
      res.json(status);
    } else {
      res.json({
        isFind: false,
        message: "Aucun statut trouvé",
        data: []
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statuts:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const client = new Informations();
    const plansTarifaires = await client.obtenirLesPlans();
    
    if (plansTarifaires && plansTarifaires.data) {
      res.json(plansTarifaires);
    } else {
      res.json({
        isFind: false,
        message: "Aucun plan trouvé",
        data: []
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des plans tarifaires:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


export default router;
