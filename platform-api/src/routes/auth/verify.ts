import express, { Request, Response } from "express";
import { userService } from "../../services/members/user/user.service.js";

const router = express.Router();

/**
 * GET /api/auth/verify
 * Verify JWT token and get current user
 */
router.get("/", async (req: Request, res: Response) => {
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

    if (!result.success) {
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

export default router;