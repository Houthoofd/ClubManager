import express, { Request, Response } from "express";
import { userService } from "../../services/user/user.service.js";
import { auditService, AuditAction } from "../../services/audit/audit.service.js";
import { getTenantId } from "./utils.js";

const router = express.Router();

/**
 * POST /api/auth/password/forgot
 * Request password reset email
 */
router.post("/forgot", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const tenantId = getTenantId(req);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
      });
    }

    const result = await userService.requestPasswordReset(email, tenantId);

    // Always return success to prevent email enumeration
    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la demande de réinitialisation",
    });
  }
});

/**
 * POST /api/auth/password/reset
 * Reset password with token
 */
router.post("/reset", async (req: Request, res: Response) => {
  try {
    const { token, email, newPassword } = req.body;
    const tenantId = getTenantId(req);

    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token, email et nouveau mot de passe requis",
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    const result = await userService.resetPassword(
      token,
      newPassword,
      tenantId,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Log password reset (audit)
    const user = await userService.getUserByEmail(email, tenantId);
    if (user) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.PASSWORD_RESET,
        resource: "auth",
        resourceId: user.id.toString(),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe",
    });
  }
});

export default router;
