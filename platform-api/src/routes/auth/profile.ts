import express, { Request, Response } from "express";
import { userService } from "../../services/members/user/user.service.js";
import { auditService, AuditAction } from "../../services/infrastructure/audit/audit.service.js";
import { getTenantId } from "./utils.js";

const router = express.Router();

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get("/me", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    const profile = await userService.getUserById(user.id, tenantId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    return res.json({
      success: true,
      data: { user: profile },
    });
  } catch (error) {
    console.error("❌ Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update current user profile (requires authentication)
 */
router.put("/profile", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const { firstName, lastName, dateOfBirth, genderId } = req.body;

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    const result = await userService.updateUser(user.id, tenantId, {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      genderId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Log profile update (audit)
    await auditService.log({
      tenantId,
      userId: user.id,
      action: AuditAction.UPDATE,
      resource: "user_profile",
      resourceId: user.id.toString(),
      changes: { firstName, lastName, dateOfBirth, genderId },
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || undefined,
    });

    return res.json({
      success: true,
      message: result.message,
      data: { user: result.user },
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
    });
  }
});

export default router;