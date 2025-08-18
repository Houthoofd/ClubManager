import express from 'express';
import { Statistiques } from '../db/clients/statistiques/statistiques.js';
const router = express.Router();
const statistiques = new Statistiques();
/**
 * @route   GET /statistiques/frequentation
 * @desc    Récupère les statistiques de fréquentation globales
 */
router.get('/frequentation/:utilisateurId', async (req, res) => {
    // Récupérer utilisateurId depuis les paramètres et le convertir en nombre
    const utilisateurId = Number(req.params.utilisateurId);
    // Vérifier si la conversion a échoué (si utilisateurId n'est pas un nombre valide)
    if (isNaN(utilisateurId)) {
        return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    try {
        const result = await statistiques.obtenirStatistiquesFrequentation(utilisateurId);
        // Vérifie que le résultat est bien défini et a le format attendu
        if (!result || typeof result.totalFrequentation !== 'number') {
            return res.status(400).json({ error: 'Aucune statistique de fréquentation trouvée.' });
        }
        res.json(result);
    }
    catch (err) {
        console.error(`Erreur lors de la récupération des statistiques de fréquentation pour l'utilisateur ${utilisateurId}:`, err);
        res.status(500).json({
            error: 'Erreur lors de la récupération des statistiques de fréquentation',
            details: err instanceof Error ? err.message : 'Erreur inconnue',
        });
    }
});
/**
 * @route   GET /statistiques/progression/:userId
 * @desc    Récupère les statistiques de progression pour un utilisateur
 */
router.get('/progression/:userId', async (req, res) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    try {
        const result = await statistiques.obtenirProgressionUtilisateur(userId);
        // Si aucun résultat, retourne 404
        if (!result || typeof result.utilisateur_id !== 'number') {
            return res.status(404).json({ error: 'Aucune progression trouvée pour cet utilisateur.' });
        }
        res.json(result);
    }
    catch (err) {
        console.error(`Erreur lors de la récupération de la progression pour l'utilisateur ${userId}:`, err);
        res.status(500).json({
            error: 'Erreur lors de la récupération de la progression',
            details: err instanceof Error ? err.message : 'Erreur inconnue',
        });
    }
});
/**
 * @route   GET /statistiques/presence/:userId
 * @desc    Récupère les présences par mois pour un utilisateur
 * @access  Public (ou protégé selon ton besoin)
 */
router.get('/presence/:userId', async (req, res) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    try {
        const results = await statistiques.obtenirPresenceParMois(userId);
        const formattedData = statistiques.formatPresenceData(results);
        res.json(formattedData);
    }
    catch (err) {
        console.error(`Erreur lors de la récupération des présences pour l'utilisateur ${userId}:`, err);
        res.status(500).json({
            error: 'Erreur lors de la récupération des présences',
            details: err instanceof Error ? err.message : 'Erreur inconnue',
        });
    }
});
/**
 * @route   GET /statistiques/presence-raw/:userId
 * @desc    Récupère les présences brutes (non formatées) pour un utilisateur
 * @access  Public (ou protégé selon ton besoin)
 */
router.get('/presence-raw/:userId', async (req, res) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    try {
        const results = await statistiques.obtenirPresenceParMois(userId);
        res.json(results);
    }
    catch (err) {
        console.error(`Erreur lors de la récupération des présences brutes pour l'utilisateur ${userId}:`, err);
        res.status(500).json({
            error: 'Erreur lors de la récupération des présences brutes',
            details: err instanceof Error ? err.message : 'Erreur inconnue',
        });
    }
});
export default router;
