import express, { Request, Response, Router } from 'express';
import { statisticsService } from '../services/index.js';
import { verifyToken } from '../middleware/auth.js';
import { getTenantId } from '../utils/tenant.util.js';

const router: Router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(verifyToken);

/**
 * @route   GET /statistiques/frequentation
 * @desc    Récupère les statistiques de fréquentation globales
 */
router.get('/frequentation/:utilisateurId', async (req: Request, res: Response) => {
  const utilisateurId = Number(req.params.utilisateurId);

  if (isNaN(utilisateurId)) {
    return res.status(400).json({ error: 'ID utilisateur invalide' });
  }

  try {
    const tenantId = getTenantId(req);
    const result = await statisticsService.getUserStats({ tenantId, userId: utilisateurId });
    
    if (!result) {
      return res.status(404).json({ error: 'Aucune statistique de fréquentation trouvée.' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de fréquentation:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * @route   GET /statistiques/dashboard
 * @desc    Récupère les statistiques du tableau de bord
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await statisticsService.getDashboardStats({ tenantId });
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * @route   GET /statistiques/membres
 * @desc    Récupère le nombre de membres
 */
router.get('/membres/count', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await statisticsService.getDashboardStats({ tenantId });
    
    res.status(200).json({ count: stats.users.totalUsers });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de membres:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * @route   GET /statistiques/paiements
 * @desc    Récupère les statistiques de paiements
 */
router.get('/paiements/total', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await statisticsService.getPaymentStats({ tenantId });
    
    res.status(200).json({ total: stats.totalRevenue });
  } catch (error) {
    console.error('Erreur lors de la récupération du total des paiements:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

router.get('/paiements/recents', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await statisticsService.getPaymentStats({ tenantId });
    
    // Get recent payments count from payment breakdown
    const recentCount = stats.paymentsByStatus.find(s => s.status === 'completed')?.count || 0;
    res.status(200).json({ count: recentCount });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements récents:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

router.get('/paiements/attente', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await statisticsService.getPaymentStats({ tenantId });
    
    // Get pending payments count from payment breakdown
    const pendingCount = stats.paymentsByStatus.find(s => s.status === 'pending')?.count || 0;
    res.status(200).json({ count: pendingCount });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements en attente:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * @route   GET /statistiques/commandes
 * @desc    Récupère les statistiques de commandes
 */
router.get('/commandes/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await statisticsService.getOrderStats({ tenantId });
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de commandes:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;