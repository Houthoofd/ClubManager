import express, { Request, Response } from "express";
import { auditService, AuditAction } from "../../services/infrastructure/audit/audit.service.js";
import { getTenantId } from "./utils.js";

const router = express.Router();

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);

    // Clear all possible cookie variations
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("strict" as const)
          : ("lax" as const),
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : "localhost",
      path: "/",
    };

    // Clear main token cookie
    res.clearCookie("token", cookieOptions);

    // Clear alternative cookie names (for backwards compatibility)
    res.clearCookie("authToken", cookieOptions);
    res.clearCookie("jwt", cookieOptions);

    // Also clear without domain for local environments
    res.clearCookie("token", { path: "/", httpOnly: true });

    // Log logout (audit)
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.LOGOUT,
        resource: "auth",
        resourceId: user.id.toString(),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion",
    });
  }
});

export default router;