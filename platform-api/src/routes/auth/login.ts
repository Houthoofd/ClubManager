import express, { Request, Response } from "express";
import { userService } from "../../services/members/user/user.service.js";
import { auditService, AuditAction } from "../../services/infrastructure/audit/audit.service.js";
import { getTenantId } from "./utils.js";

const router = express.Router();

/**
 * POST /api/auth/login
 * User login with email and password
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tenantId = getTenantId(req);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // Attempt login
    const result = await userService.login({ email, password, tenantId });

    if (!result.success) {
      return res.status(401).json({
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
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    // Log successful login (audit)
    await auditService.log({
      tenantId,
      userId: result.user?.id || 0,
      action: AuditAction.LOGIN,
      resource: "auth",
      resourceId: result.user?.id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || undefined,
    });

    return res.json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
    });
  }
});

export default router;