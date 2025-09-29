import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { Alerte } from '../db/clients/alertes/alertes.js';
const router = express.Router();
// Middleware pour vérifier que l'utilisateur est super-admin
router.use(verifyToken);
router.use(requireRole(['super-administrateur']));
// Obtenir le dashboard des alertes
router.get('/dashboard', async (req, res) => {
    try {
        const client = new Alerte();
        const dashboard = await client.obtenirDashboardAlertes();
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération du dashboard:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});
// Obtenir toutes les alertes actives
router.get('/actives', async (req, res) => {
    try {
        const client = new Alerte();
        const alertes = await client.obtenirAlertesActives();
        res.json({
            success: true,
            data: alertes
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});
// Obtenir les alertes d'un utilisateur spécifique
router.get('/utilisateur/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ success: false, error: 'ID utilisateur invalide.' });
    }
    try {
        const client = new Alerte();
        const alertes = await client.obtenirAlertesUtilisateur(parseInt(userId));
        res.json({
            success: true,
            data: alertes
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des alertes utilisateur:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});
// Déclencher manuellement la détection des alertes
router.post('/detecter', async (req, res) => {
    try {
        const client = new Alerte();
        await client.detecterAlertes();
        res.json({
            success: true,
            message: 'Détection des alertes effectuée avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la détection des alertes:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});
// Résoudre une alerte
router.put('/:alerteId/resoudre', async (req, res) => {
    const { alerteId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;
    if (!alerteId || isNaN(parseInt(alerteId))) {
        return res.status(400).json({ success: false, error: 'ID alerte invalide.' });
    }
    try {
        const client = new Alerte();
        await client.resoudreAlerte(parseInt(alerteId), notes || '', userId);
        res.json({
            success: true,
            message: 'Alerte résolue avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de la résolution de l\'alerte:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});
// Ignorer une alerte
router.put('/:alerteId/ignorer', async (req, res) => {
    const { alerteId } = req.params;
    const { notes } = req.body;
    if (!alerteId || isNaN(parseInt(alerteId))) {
        return res.status(400).json({ success: false, error: 'ID alerte invalide.' });
    }
    try {
        const client = new Alerte();
        await client.ignorerAlerte(parseInt(alerteId), notes || '');
        res.json({
            success: true,
            message: 'Alerte ignorée avec succès'
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'ignorement de l\'alerte:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur.' });
    }
});
export default router;
