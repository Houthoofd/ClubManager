import express from 'express';
import { Compte } from '../db/clients/compte/compte.js';
import bcrypt from 'bcrypt';
const router = express.Router();
router.post('/informations', async (req, res) => {
    const { prenom, nom } = req.body;
    // Vérifier si les paramètres nécessaires sont présents
    if (!prenom || !nom) {
        return res.status(400).json({ message: "Les champs 'prenom' et 'nom' sont requis." });
    }
    try {
        const client = new Compte();
        const utilisateur = await client.obtenirInformationsUtilisateur(prenom, nom);
        if (utilisateur.isFind && utilisateur.data) {
            // Renvoie toutes les données de l'utilisateur
            return res.status(200).json({ utilisateur: utilisateur.data });
        }
        else {
            return res.status(404).json({ message: "Aucun utilisateur trouvé.", data: [] });
        }
    }
    catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error });
    }
});
// Endpoint pour créer un mot de passe (si le compte n'en a pas)
router.put('/creer-mot-de-passe', async (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) {
        return res.status(400).json({ message: "L'id et le mot de passe sont requis." });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        const client = new Compte();
        const result = await client.mettreAJourMotDePasse(id, hash, true); // true = création
        if (result.isConfirm) {
            return res.status(200).json({ message: "Mot de passe créé avec succès." });
        }
        else {
            return res.status(400).json({ message: "Échec de la création du mot de passe." });
        }
    }
    catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error });
    }
});
// Endpoint pour modifier le mot de passe (si le compte en a déjà un)
router.put('/changer-mot-de-passe', async (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) {
        return res.status(400).json({ message: "L'id et le mot de passe sont requis." });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        const client = new Compte();
        const result = await client.mettreAJourMotDePasse(id, hash, false); // false = modification
        if (result.isConfirm) {
            return res.status(200).json({ message: "Mot de passe modifié avec succès." });
        }
        else {
            return res.status(400).json({ message: "Échec de la modification du mot de passe." });
        }
    }
    catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error });
    }
});
export default router;
