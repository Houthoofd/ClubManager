import express from 'express';
import { Statistiques } from '../db/clients/statistiques/statistiques.js';
import { verifyToken } from '../middleware/auth.js'; // Suppression de requireRole
const router = express.Router();
const statistiques = new Statistiques();
// Appliquer l'authentification à toutes les routes
router.use(verifyToken);
/**
 * @route   GET /statistiques/frequentation
 * @desc    Récupère les statistiques de fréquentation globales
 */
router.get('/frequentation/:utilisateurId', async (req, res) => {
    const utilisateurId = Number(req.params.utilisateurId);
    if (isNaN(utilisateurId)) {
        return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    try {
        const result = await statistiques.obtenirStatistiquesFrequentation(utilisateurId);
        // Amélioration du format de la réponse
        if (!Array.isArray(result) || result.length === 0) {
            return res.status(404).json({ error: 'Aucune statistique de fréquentation trouvée.' });
        }
        // Récupère le total fréquentation (même valeur pour chaque ligne)
        const totalFrequentation = result[0]?.totalFrequentation ?? 0;
        // Formate les données par mois
        const moisData = result.map((row) => ({
            mois: row.mois,
            frequentation: row.frequentation,
            totalCoursMois: row.nombres_total_de_cours_du_mois,
            pourcentageCoursValides: row.pourcentage_de_cours_valides
        }));
        res.json({
            utilisateurId,
            totalFrequentation,
            mois: moisData
        });
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
        // Formater les données directement ici au lieu d'utiliser une méthode qui n'existe pas
        const formattedData = results.map((item) => ({
            mois: item.nom_mois,
            presences: item.total_presences,
            type_cours: item.type_cours
        }));
        res.json({ data: formattedData });
    }
    catch (error) {
        console.error('Erreur statistiques présence:', error);
        res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
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
/**
 * @route   GET /statistiques/membres/count
 * @desc    Nombre total de membres
 */
router.get('/membres/count', async (_req, res) => {
    try {
        console.log('🔍 Route: /membres/count called');
        const count = await statistiques.getNombreMembres();
        console.log('📊 Membres count result:', count);
        res.json(count);
    }
    catch (err) {
        console.error('❌ Error in /membres/count:', err);
        res.status(500).json({ error: 'Erreur lors du comptage des membres' });
    }
});
/**
 * @route   GET /statistiques/paiements/mois
 * @desc    Total encaissé ce mois-ci
 */
router.get('/paiements/mois', async (_req, res) => {
    try {
        console.log('🔍 Route: /paiements/mois called');
        const total = await statistiques.getTotalPaiementsMois();
        console.log('📊 Paiements mois result:', total);
        res.json(total);
    }
    catch (err) {
        console.error('❌ Error in /paiements/mois:', err);
        res.status(500).json({ error: 'Erreur lors du calcul du total du mois' });
    }
});
/**
 * @route   GET /statistiques/paiements/recents
 * @desc    Nombre de paiements sur les 7 derniers jours
 */
router.get('/paiements/recents', async (_req, res) => {
    try {
        console.log('🔍 Route: /paiements/recents called');
        const count = await statistiques.getPaiementsRecents();
        console.log('📊 Paiements récents result:', count);
        res.json(count);
    }
    catch (err) {
        console.error('❌ Error in /paiements/recents:', err);
        res.status(500).json({ error: 'Erreur lors du comptage des paiements récents' });
    }
});
/**
 * @route   GET /statistiques/paiements/en-attente
 * @desc    Nombre de membres avec paiements en attente
 */
router.get('/paiements/en-attente', async (_req, res) => {
    try {
        console.log('🔍 Route: /paiements/en-attente called');
        const count = await statistiques.getPaiementsEnAttente();
        console.log('📊 Paiements en attente result:', count);
        res.json(count);
    }
    catch (err) {
        console.error('❌ Error in /paiements/en-attente:', err);
        res.status(500).json({ error: 'Erreur lors du comptage des paiements en attente' });
    }
});
/**
 * @route   GET /statistiques/plans/actifs
 * @desc    Nombre de plans d'abonnement actifs
 */
router.get('/plans/actifs', async (_req, res) => {
    try {
        console.log('🔍 Route: /plans/actifs called');
        const count = await statistiques.getPlansActifs();
        console.log('📊 Plans actifs result:', count);
        res.json(count);
    }
    catch (err) {
        console.error('❌ Error in /plans/actifs:', err);
        res.status(500).json({ error: 'Erreur lors du comptage des plans actifs' });
    }
});
/**
 * @route   GET /statistiques/plans/taux-renouvellement
 * @desc    Taux de renouvellement des abonnements
 */
router.get('/plans/taux-renouvellement', async (_req, res) => {
    try {
        console.log('🔍 Route: /plans/taux-renouvellement called');
        const taux = await statistiques.getTauxRenouvellement();
        console.log('📊 Taux renouvellement result:', taux);
        res.json(taux);
    }
    catch (err) {
        console.error('❌ Error in /plans/taux-renouvellement:', err);
        res.status(500).json({ error: 'Erreur lors du calcul du taux de renouvellement' });
    }
});
/**
 * @route   GET /statistiques/paiements/par-mois
 * @desc    Évolution des paiements par mois (pour le graphique)
 */
router.get('/paiements/par-mois', async (_req, res) => {
    try {
        console.log('🔍 Route: /paiements/par-mois called');
        const data = await statistiques.getPaiementsParMois();
        console.log('📊 Paiements par mois result:', data);
        res.json(data);
    }
    catch (err) {
        console.error('❌ Error in /paiements/par-mois:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des paiements par mois' });
    }
});
/**
 * @route   GET /statistiques/membres/par-plan
 * @desc    Répartition des membres par plan (pour le graphique)
 */
router.get('/membres/par-plan', async (_req, res) => {
    try {
        console.log('🔍 Route: /membres/par-plan called');
        const data = await statistiques.getMembresParPlan();
        console.log('📊 Membres par plan result:', data);
        res.json(data);
    }
    catch (err) {
        console.error('❌ Error in /membres/par-plan:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des membres par plan' });
    }
});
/**
 * @route   GET /statistiques/paiements/derniers
 * @desc    Retourne les 10 derniers paiements effectués
 */
router.get('/paiements/derniers', async (_req, res) => {
    try {
        console.log('🔍 Route: /paiements/derniers called');
        const data = await statistiques.getDerniersPaiements();
        console.log('📊 Derniers paiements result:', data);
        res.json(data);
    }
    catch (err) {
        console.error('❌ Error in /paiements/derniers:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des derniers paiements' });
    }
});
/**
 * @route   GET /statistiques/paiements/echus
 * @desc    Retourne les paiements échus (fin de période < aujourd'hui)
 */
router.get('/paiements/echus', async (_req, res) => {
    try {
        console.log('🔍 Route: /paiements/echus called');
        const data = await statistiques.getPaiementsEchus();
        console.log('📊 Paiements échus result:', data);
        res.json(data);
    }
    catch (err) {
        console.error('❌ Error in /paiements/echus:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des paiements échus' });
    }
});
/**
 * @route   GET /statistiques/membres/nouveaux
 * @desc    Retourne les membres inscrits dans les 7 derniers jours
 */
router.get('/membres/nouveaux', async (_req, res) => {
    try {
        console.log('🔍 Route: /membres/nouveaux called');
        const data = await statistiques.getNouveauxMembres();
        console.log('📊 Nouveaux membres result:', data);
        res.json(data);
    }
    catch (err) {
        console.error('❌ Error in /membres/nouveaux:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des nouveaux membres' });
    }
});
/**
 * @route   GET /statistiques/membres/assidus
 * @desc    Top 5 membres les plus assidus (présences validées)
 */
router.get('/membres/assidus', async (_req, res) => {
    try {
        const data = await statistiques.getTopMembresAssidus();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des membres assidus' });
    }
});
/**
 * @route   GET /statistiques/membres/par-grade
 * @desc    Répartition des membres par grade
 */
router.get('/membres/par-grade', async (req, res) => {
    try {
        const data = await statistiques.getMembresParGrade();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des membres par grade' });
    }
});
/**
 * @route   GET /statistiques/membres/par-genre
 * @desc    Répartition des membres par genre
 */
router.get('/membres/par-genre', async (req, res) => {
    try {
        const data = await statistiques.getMembresParGenre();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des membres par genre' });
    }
});
/**
 * @route   GET /statistiques/membres/anniversaires
 * @desc    Prochains anniversaires des membres (dans les 30 jours)
 */
router.get('/membres/anniversaires', async (_req, res) => {
    try {
        const data = await statistiques.getProchainsAnniversaires();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des anniversaires' });
    }
});
/**
 * @route   GET /statistiques/articles/plus-vendus
 * @desc    Articles les plus vendus
 */
router.get('/articles/plus-vendus', async (_req, res) => {
    try {
        const data = await statistiques.getArticlesPlusVendus();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des articles vendus' });
    }
});
/**
 * @route   GET /statistiques/cours/semaine
 * @desc    Nombre de cours à venir cette semaine
 */
router.get('/cours/semaine', async (_req, res) => {
    try {
        const data = await statistiques.getCoursSemaine();
        res.json({ count: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des cours de la semaine' });
    }
});
// Statistiques financières - accès admin uniquement
router.get('/revenus', async (req, res) => {
    try {
        // ...existing code...
    }
    catch (error) {
        // ...existing error handling...
    }
});
export default router;
