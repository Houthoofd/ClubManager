import express from 'express';
import { Professeurs } from '../db/clients/professeurs/professeurs.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { } from '@clubmanager/types';
import { z } from 'zod';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(verifyToken);


// route pour ajouter un professeur //
router.get('/', async (req: any, res: any) => {
  try {
    const client = new Professeurs();
    const { coursId } = req.params; // Récupère l'ID du cours depuis l'URL


    // Récupérer les utilisateurs associés à ce cours
    const professeurs = await client.obtenirLesProfesseurs();

    console.log('Professeurs récupèrés:', professeurs);
    res.status(200).json(professeurs);

  } catch (error) {
    console.error('Erreur lors de la récupération du cours avec utilisateurs :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
  }
});

// route pour ajouter un professeur //
router.post('/ajouter', async (req: any, res: any) => {
  try {
    const client = new Professeurs();
    const data = req.body;
    console.log(data)


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.ajouterUnProfesseur(data);

    console.log('Professeur ajouté avec succès:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error("Erreur lors de l'ajout ou de la modification :", error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.' });
  }
});

// endpoint pour modifier le statut d'un professeur (anciennement retirer)
router.post('/modifier', async (req: any, res: any) => {
  try {
    const { id, status_id } = req.body;
    if (!id || !status_id) {
      return res.status(400).json({ success: false, message: "ID et status_id requis." });
    }
    const client = new Professeurs();
    // Mettre à jour le status à la valeur choisie
    const result = await client.modifierStatutProfesseur(id, status_id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur lors de la modification du statut :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification du statut." });
  }
});

// Route pour récupérer le planning d'un professeur spécifique
router.get('/:id/planning', async (req: any, res: any) => {
  try {
    const client = new Professeurs();
    const { id } = req.params; // Récupère l'ID du professeur depuis l'URL
    
    // Valider que l'ID est un nombre
    const professeurId = parseInt(id);
    if (isNaN(professeurId)) {
      return res.status(400).json({
        isFind: false,
        message: 'ID du professeur invalide',
        data: []
      });
    }

    console.log(`Récupération du planning pour le professeur ID: ${professeurId}`);

    // Récupérer le planning du professeur
    const planningResult = await client.obtenirPlanningCoursProfesseur(professeurId);

    console.log('Planning récupéré:', planningResult);
    res.status(200).json(planningResult);

  } catch (error) {
    console.error('Erreur lors de la récupération du planning du professeur :', error);
    res.status(500).json({
      isFind: false,
      message: 'Erreur serveur lors de la récupération du planning',
      data: []
    });
  }
});

export default router;