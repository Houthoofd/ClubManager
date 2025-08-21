import express from 'express';
import { Verifiation } from '../db/clients/verification/verifications.js';

const router = express.Router();

// Toutes les méthodes utilisent maintenant le type VerifyResult et renvoient { exists, message }
router.post('/verifier-email', async (req:any, res:any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis." });
  try {
    const client = new Verifiation();
    const result = await client.checkUtilisateurByEmail(email);
    res.json({ exists: result.isFind, message: result.message });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.post('/verifier-nom-utilisateur', async (req:any, res:any) => {
  const { nom_utilisateur } = req.body;
  if (!nom_utilisateur) return res.status(400).json({ message: "Nom d'utilisateur requis." });
  try {
    const client = new Verifiation();
    const result = await client.checkUtilisateurByNomUtilisateur(nom_utilisateur);
    res.json({ exists: result.isFind, message: result.message });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.post('/verifier-prenom', async (req:any, res:any) => {
  const { prenom } = req.body;
  if (!prenom) return res.status(400).json({ message: "Prénom requis." });
  try {
    const client = new Verifiation();
    const result = await client.checkUtilisateurByPrenom(prenom);
    res.json({ exists: result.isFind, message: result.message });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.post('/verifier-nom', async (req:any, res:any) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ message: "Nom requis." });
  try {
    const client = new Verifiation();
    const result = await client.checkUtilisateurByNom(nom);
    res.json({ exists: result.isFind, message: result.message });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.post('/verifier-prenom-nom', async (req:any, res:any) => {
  const { prenom, nom } = req.body;
  if (!prenom || !nom) return res.status(400).json({ message: "Prénom et nom requis." });
  try {
    const client = new Verifiation();
    const result = await client.checkUtilisateurByPrenomNom(prenom, nom);
    res.json({ exists: result.isFind, message: result.message });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});


export default router;
