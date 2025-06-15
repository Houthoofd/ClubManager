import express from 'express';
import {Compte} from '../db/clients/compte/compte.js';
import { z } from 'zod';
import { VerifyResultWithData } from '../../../packages/types/dist/index.js';

const router = express.Router();




router.post('/informations', async (req: any, res: any) => {
  const { prenom, nom } = req.body;

  console.log(prenom, nom)

  // Vérifier si les paramètres nécessaires sont présents
  if (!prenom || !nom) {
    return res.status(400).json({ message: "Les champs 'prenom' et 'nom' sont requis." });
  }

  console.log('Prénom :', prenom, 'Nom :', nom);

  try {
    const client = new Compte();
    const utilisateur: VerifyResultWithData = await client.obtenirUnUtilisateurParSonNomEtPrenom(prenom, nom);
    console.log(utilisateur)
    if (utilisateur.isFind) {
      return res.status(200).json(utilisateur.data);  // Renvoie les données de l'utilisateur trouvé
    } else {
      return res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur : ", error);
    return res.status(500).json({ message: "Erreur serveur", error: error });
  }
});





export default router;