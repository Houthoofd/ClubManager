import express from 'express';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { userService } from '../services/index.js';
import { userInscriptionSchema } from '../validators/localSchemas.js';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getTenantId } from '../utils/tenant.util.js';

const router = express.Router();


router.post('/verification', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email requis" });
  }
  try {
    const tenantId = getTenantId(req);
    const user = await userService.findByEmail(email, tenantId);
    if (user) {
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }
    return res.status(200).json({ exists: false });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post('/validation', async (req: any, res: any) => {
  // Vérification des données reçues via Zod
  // Validation avec Zod
  const parseResult = userInscriptionSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log("Erreur de validation :", parseResult.error.issues);
    return res.status(400).json({ message: parseResult.error.issues[0]?.message || "Données invalides" });
  }
  const { firstName, lastName, email, password, dateOfBirth, genderId } = parseResult.data;
  try {
    const tenantId = getTenantId(req);
    // Vérifie si l'utilisateur existe déjà
    const existingUser = await userService.findByEmail(email, tenantId);
    if (existingUser) {
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }
    
    // Inscription - Utiliser userService pour créer l'utilisateur
    const userData = {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      genderId,
      tenantId,
    };
    
    const result = await userService.create(userData);
    
    if (result) {
      return res.status(201).json({ message: "Inscription réussie" });
    } else {
      return res.status(400).json({ message: "Erreur lors de l'inscription" });
    }
  } catch (error) {
    console.error('Erreur inscription:', error);
    return res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
});

export default router;