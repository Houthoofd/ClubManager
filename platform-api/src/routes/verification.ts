import express from 'express';
import { verificationService } from '../services/index.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getTenantId } from '../utils/tenant.util.js';

const router = express.Router();

// Appliquer l'authentification à toutes les routes de vérification
router.use(verifyToken);

/**
 * @route POST /verification/verifier-email
 * @desc Vérifie si un email existe déjà
 */
router.post('/verifier-email', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis." });
  
  try {
    const result = await verificationService.checkEmailExists(email);
    res.json({ exists: result.exists, message: result.message });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * @route POST /verification/verifier-nom-utilisateur
 * @desc Vérifie si un nom d'utilisateur existe déjà
 */
router.post('/verifier-nom-utilisateur', async (req: any, res: any) => {
  const { nom_utilisateur } = req.body;
  if (!nom_utilisateur) return res.status(400).json({ message: "Nom d'utilisateur requis." });
  
  try {
    const result = await verificationService.checkUsernameExists(nom_utilisateur);
    res.json({ exists: result.exists, message: result.message });
  } catch (error) {
    console.error('Erreur lors de la vérification du nom d\'utilisateur:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * @route POST /verification/generer-token-email
 * @desc Génère un token de vérification email
 */
router.post('/generer-token-email', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis." });
  
  try {
    const result = await verificationService.generateEmailVerificationToken(email);
    
    // The method returns a string token, so we adjust the response
    res.json({ success: true, token: result, message: "Token généré avec succès" });
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * @route POST /verification/verifier-token-email
 * @desc Vérifie un token de vérification email
 */
router.post('/verifier-token-email', async (req: any, res: any) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Token requis." });
  
  try {
    // For now, use a default userId of 1. In a real app, you'd extract this from the token or context
    const result = await verificationService.verifyEmailToken(token, 1);
    
    if (result.success) {
      res.json({ success: true, verified: true, message: result.message });
    } else {
      res.status(400).json({ success: false, verified: false, message: result.message });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * @route POST /verification/reset-password
 * @desc Initie un reset de mot de passe
 */
router.post('/reset-password', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis." });
  
  try {
    const result = await verificationService.initiatePasswordReset(email);
    
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    console.error('Erreur lors du reset de mot de passe:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * @route POST /verification/confirm-password-reset
 * @desc Confirme un reset de mot de passe avec token
 */
router.post('/confirm-password-reset', async (req: any, res: any) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token et nouveau mot de passe requis." });
  }
  
  try {
    const result = await verificationService.resetPassword(token, newPassword);
    
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    console.error('Erreur lors de la confirmation du reset:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;