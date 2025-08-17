import { Router } from 'express';
import { Utilisateurs } from '../db/clients/utilisateurs/utilisateurs.js';
import { z } from 'zod';
import { UserData, userSchema } from '../../../packages/types/dist/index.js';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/inscription/verification', async (req:any, res:any) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email requis" });
  }
  try {
    const client = new Utilisateurs();
    const result = await client.checkUtilisateurByEmail(email);
    if (result.isFind) {
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }
    return res.status(200).json({ exists: false });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post('/inscription/validation', async (req:any, res:any) => {
  const { username, email, password, date, abonnement } = req.body;
  if (!username || !email || !password || !date || !abonnement) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }
  try {
    const client = new Utilisateurs();
    // Vérifie si l'utilisateur existe déjà
    const check = await client.checkUtilisateurByEmail(email);
    if (check.isFind) {
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }
    // Chiffre le mot de passe avant insertion
    const hashedPassword = await bcrypt.hash(password, 10);
    // Inscription
    const result = await client.inscriptionUtilisateurSimple({
      username,
      email,
      password: hashedPassword,
      date,
      abonnement
    });
    if (result.affectedRows > 0) {
      return res.status(201).json({ message: "Inscription réussie", userId: result.insertId });
    } else {
      return res.status(400).json({ message: "Échec de l'inscription" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error });
  }
});

export default router;