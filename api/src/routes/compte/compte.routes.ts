import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  getInformations,
  createPassword,
  changePassword,
  updateAccount
} from './core/index.js';

const router = express.Router();

// Toutes les routes de compte nécessitent une authentification
router.use(verifyToken);

// Routes protégées
router.post('/informations', getInformations);
router.put('/creer-mot-de-passe', createPassword);
router.put('/changer-mot-de-passe', changePassword);
router.put('/update', updateAccount);

export default router;
