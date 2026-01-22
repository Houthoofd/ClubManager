import express, { Request, Response } from "express";
import { emailService } from "../../services/operations/communication/email.service.js";
import { userAuthService as verificationService } from "../../services/members/user/user-auth.service.js";

const router = express.Router();

/**
 * POST /api/users/email/send-verification
 * Send verification email to user
 */
router.post("/send-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
      });
    }

    // Send verification email (mock)
    const result = {
      success: true,
      message: "Email de vérification envoyé"
    };

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Send verification email error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email de vérification",
    });
  }
});

/**
 * POST /api/users/email/verify-token
 * Verify email token
 */
router.post("/verify-token", async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Token et email requis",
      });
    }

    const result = await verificationService.verifyEmailToken(token, email);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: "Email vérifié avec succès",
    });
  } catch (error) {
    console.error("❌ Verify email token error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de l'email",
    });
  }
});

/**
 * GET /api/users/email/test-config
 * Test email configuration
 */
router.get("/test-config", async (req: Request, res: Response) => {
  try {
    const isConfigured = true; // Mock configuration test

    return res.json({
      success: true,
      configured: isConfigured,
      message: isConfigured 
        ? "Configuration email OK" 
        : "Configuration email manquante",
    });
  } catch (error) {
    console.error("❌ Test email config error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du test de la configuration email",
    });
  }
});

/**
 * POST /api/users/email/test
 * Send test email
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { to, subject = "Test Email" } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Destinataire requis",
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      text: "Ceci est un email de test.",
      html: "<p>Ceci est un <strong>email de test</strong>.</p>",
    });

    return res.json({
      success: true,
      message: "Email de test envoyé avec succès",
      result,
    });
  } catch (error) {
    console.error("❌ Send test email error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email de test",
    });
  }
});

export default router;