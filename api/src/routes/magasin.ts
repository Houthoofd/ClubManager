import express from 'express';
import { Magasin } from '../db/clients/magasin/magasin.js';
import { } from '@clubmanager/types';
import { z } from 'zod';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const client = new Magasin();
    const { coursId } = req.params; // Récupère l'ID du cours depuis l'URL


    // Récupérer les utilisateurs associés à ce cours
    const result = await client.obtenirLesArticles();

    console.log('articles récipèrés avec succès', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
});


export default router;