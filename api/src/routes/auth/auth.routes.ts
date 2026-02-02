import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  login,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyAuth,
  refreshToken,
  checkStatus,
  confirmEmail,
  testPublic
} from './core/index.js';

const router = express.Router();

// Routes publiques
router.get('/test', testPublic);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/verify-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.get('/status', checkStatus);
router.get('/confirm-email', confirmEmail);

// Routes protégées (nécessitent une authentification)
router.post('/logout', verifyToken, logout);
router.get('/verify', verifyToken, verifyAuth);
router.post('/refresh', verifyToken, refreshToken);

export default router;
