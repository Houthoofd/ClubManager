import express from 'express';
import { Verifiation } from '../db/clients/verification/verifications.js';
const router = express.Router();
// Toutes les méthodes utilisent maintenant le type VerifyResult et renvoient { exists, message }
router.post('/verifier-email', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: "Email requis." });
    try {
        const client = new Verifiation();
        const result = await client.checkUtilisateurByEmail(email);
        res.json({ exists: result.isFind, message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
router.post('/verifier-nom-utilisateur', async (req, res) => {
    const { nom_utilisateur } = req.body;
    if (!nom_utilisateur)
        return res.status(400).json({ message: "Nom d'utilisateur requis." });
    try {
        const client = new Verifiation();
        const result = await client.checkUtilisateurByNomUtilisateur(nom_utilisateur);
        res.json({ exists: result.isFind, message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
router.post('/verifier-prenom', async (req, res) => {
    const { prenom } = req.body;
    if (!prenom)
        return res.status(400).json({ message: "Prénom requis." });
    try {
        const client = new Verifiation();
        const result = await client.checkUtilisateurByPrenom(prenom);
        res.json({ exists: result.isFind, message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
router.post('/verifier-nom', async (req, res) => {
    const { nom } = req.body;
    if (!nom)
        return res.status(400).json({ message: "Nom requis." });
    try {
        const client = new Verifiation();
        const result = await client.checkUtilisateurByNom(nom);
        res.json({ exists: result.isFind, message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
router.post('/verifier-prenom-nom', async (req, res) => {
    const { prenom, nom } = req.body;
    if (!prenom || !nom)
        return res.status(400).json({ message: "Prénom et nom requis." });
    try {
        const client = new Verifiation();
        const result = await client.checkUtilisateurByPrenomNom(prenom, nom);
        res.json({ exists: result.isFind, message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
// Ajoute un endpoint pour vérifier via email, prénom et nom
router.post('/verifier-email-prenom-nom', async (req, res) => {
    const { email, prenom, nom } = req.body;
    if (!email || !prenom || !nom)
        return res.status(400).json({ message: "Email, prénom et nom requis." });
    try {
        const client = new Verifiation();
        const result = await client.checkUtilisateurByEmailPrenomNom(email, prenom, nom);
        res.json({ exists: result.isFind, message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
// Vérification d'un cours récurrent dans le planning (jour, heure, type)
router.post('/planning', async (req, res) => {
    const { jour, heure_debut, heure_fin, type_cours } = req.body;
    if (!jour || !heure_debut || !heure_fin || !type_cours) {
        return res.status(400).json({ message: "Jour, heure_debut, heure_fin et type_cours requis." });
    }
    try {
        const client = new Verifiation();
        // Méthode à créer dans la classe Verifiation
        const result = await client.checkCoursPlanning(jour, heure_debut, heure_fin, type_cours);
        res.json({ exists: result.exists, message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur lors de la vérification du planning." });
    }
});
export default router;
