import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/auth/auth.js";

const router = express.Router();

/**
 * GET /api/admin/statistics
 * Get platform statistics
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // Mock statistics
    const stats = {
      users: {
        total: 1250,
        active: 980,
        newThisMonth: 47,
      },
      courses: {
        total: 85,
        active: 72,
        enrollments: 2340,
      },
      revenue: {
        thisMonth: 15420,
        lastMonth: 14280,
        growth: 8.0,
      },
      messages: {
        total: 5680,
        unread: 142,
        thisWeek: 234,
      },
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Get statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
});

export default router;