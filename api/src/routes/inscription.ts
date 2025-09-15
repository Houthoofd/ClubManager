import express from 'express';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { Utilisateurs } from '../db/clients/utilisateurs/utilisateurs.js';
import { z } from 'zod';
import { UserData, userSchema, userInscriptionSchema } from '../../../packages/types/dist/index.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Routes protégées pour la gestion
router.use(verifyToken);

router.post('/verification', async (req: any, res: any) => {
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

router.post('/validation', async (req: any, res: any) => {
  // Vérification des données reçues via Zod
  const parseResult = userInscriptionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Données invalides" });
  }
  const { nom, prenom, email, password, date, abonnement, genre } = parseResult.data;
  try {
    const client = new Utilisateurs();
    // Vérifie si l'utilisateur existe déjà
    const check = await client.checkUtilisateurByEmail(email);
    if (check.isFind) {
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }
    // Chiffre le mot de passe avant insertion
    const hashedPassword = await bcrypt.hash(password, 10);
    // Inscription - Utiliser directement inscriptionUtilisateurSimple au lieu de inscrireUtilisateur
    const userData = {
      nom,
      prenom,
      email,
      password: hashedPassword,
      date,
      abonnement,
      genre,
    };
    const result = await client.inscriptionUtilisateurSimple(userData);
    
    if (result.isConfirm) {
      return res.status(201).json({ message: result.message });
    } else {
      return res.status(400).json({ message: "Erreur lors de l'inscription" });
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    return res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
});

export default router;