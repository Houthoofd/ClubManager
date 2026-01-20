import express, { Request, Response } from "express";
import { userService } from "../services/userService.js";
import { auditService, AuditAction } from "../services/auditService.js";

const router = express.Router();

/**
 * Extract tenantId from request
 * In production, this would come from:
 * - Subdomain: tenant1.clubmanager.com
 * - Custom domain mapping
 * - JWT token after login
 * For now, we'll use a header or default
 */
function getTenantId(req: Request): string {
  // Priority: JWT token > Header > Default
  const user = (req as any).user;
  if (user?.tenantId) {
    return user.tenantId;
  }

  // From header (for testing)
  const headerTenant = req.headers["x-tenant-id"] as string;
  if (headerTenant) {
    return headerTenant;
  }

  // From subdomain (e.g., tenant1.clubmanager.com)
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];

  // For development, use a default tenant
  // In production, this should be required
  return process.env.DEFAULT_TENANT_ID || subdomain || "default-tenant";
}

/**
 * POST /api/auth/login
 * User login with email and password
 */
router.post("/login", async (req: Request, res: Response) => {
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

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req: Request, res: Response) => {
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
      userId,
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

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
router.post("/logout", async (req: Request, res: Response) => {
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

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
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
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post("/reset-password", async (req: Request, res: Response) => {
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
      email,
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

/**
 * GET /api/auth/verify
 * Verify JWT token and get current user
 */
router.get("/verify", async (req: Request, res: Response) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        error: "Token manquant",
      });
    }

    // Verify token and get user
    const result = await userService.verifyAuth(token);

    if (!result.authenticated) {
      return res.status(401).json({
        authenticated: false,
        error: result.error || "Token invalide",
      });
    }

    return res.json({
      authenticated: true,
      user: result.user,
    });
  } catch (error) {
    console.error("❌ Verify token error:", error);
    return res.status(401).json({
      authenticated: false,
      error: "Erreur de vérification du token",
    });
  }
});

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
