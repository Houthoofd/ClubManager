import express from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  getDashboard,
  getAlertesActives,
  getAlertesUtilisateur,
  detecterAlertes,
  resoudreAlerte,
  ignorerAlerte
} from './core/index.js';

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est super-admin
router.use(verifyToken);
router.use(requireRole(['super-administrateur']));

// Routes
router.get('/dashboard', getDashboard);
router.get('/actives', getAlertesActives);
router.get('/utilisateur/:userId', getAlertesUtilisateur);
router.post('/detecter', detecterAlertes);
router.put('/:alerteId/resoudre', resoudreAlerte);
router.put('/:alerteId/ignorer', ignorerAlerte);

export default router;
