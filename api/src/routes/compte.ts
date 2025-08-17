import express from 'express';
import {Compte} from '../db/clients/compte/compte.js';
import { z } from 'zod';
import { VerifyResultWithData } from '../../../packages/types/dist/index.js';

const router = express.Router();




router.post('/informations', async (req: any, res: any) => {
  const { prenom, nom } = req.body;

  // Vérifier si les paramètres nécessaires sont présents
  if (!prenom || !nom) {
    return res.status(400).json({ message: "Les champs 'prenom' et 'nom' sont requis." });
  }

  try {
    const client = new Compte();
    const utilisateur: VerifyResultWithData = await client.obtenirInformationsUtilisateur(prenom, nom);
    if (utilisateur.isFind && utilisateur.data) {
      // Renvoie toutes les données de l'utilisateur
      return res.status(200).json({ utilisateur: utilisateur.data });
    } else {
      return res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
    }
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error });
  }
});





export default router;