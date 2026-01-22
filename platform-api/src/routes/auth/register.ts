import express, { Request, Response } from "express";
import { userManagerService as userService } from "../../services/members/users/user-manager.service.js";
import { auditService, AuditAction } from "../../services/infrastructure/audit/audit.service.js";
import { getTenantId } from "./utils.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      genderId,
      userId,
    } = req.body;
    const tenantId = getTenantId(req);

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être remplis",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    // Register user
    const result = await userService.register({
      tenantId,
      firstName,
      lastName,
      email,
      password,
      dateOfBirth: new Date(dateOfBirth),
      genderId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Set HTTP-only cookie with JWT token
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : "localhost",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Log registration (audit)
    await auditService.log({
      tenantId,
      userId: result.user?.id || 0,
      action: AuditAction.CREATE,
      resource: "auth",
      resourceId: result.user?.id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || undefined,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'inscription",
    });
  }
});

export default router;