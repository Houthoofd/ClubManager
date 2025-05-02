import express from 'express';
import { Professeurs } from '../db/clients/professeurs/professeurs.js';
import { } from '@clubmanager/types';
import { z } from 'zod';

const router = express.Router();

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

export default router;