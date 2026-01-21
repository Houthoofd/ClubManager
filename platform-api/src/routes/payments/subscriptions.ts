import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/auth/auth.js";

const router = express.Router();

/**
 * GET /api/payments/subscriptions
 * Get user subscriptions
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    // Mock subscriptions
    const subscriptions = [
      {
        id: 1,
        name: "Abonnement Mensuel",
        price: 29.99,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    ];

    return res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("❌ Get subscriptions error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des abonnements",
    });
  }
});

/**
 * POST /api/payments/subscriptions
 * Create subscription
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { planId, paymentMethodId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    if (!planId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: "Plan et méthode de paiement requis",
      });
    }

    // Mock subscription creation
    const subscription = {
      id: Date.now(),
      userId,
      planId,
      status: "active",
      createdAt: new Date(),
    };

    return res.status(201).json({
      success: true,
      message: "Abonnement créé avec succès",
      data: subscription,
    });
  } catch (error) {
    console.error("❌ Create subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'abonnement",
    });
  }
});

/**
 * PUT /api/payments/subscriptions/:id/cancel
 * Cancel subscription
 */
router.put("/:id/cancel", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const subscriptionId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    // Mock subscription cancellation
    return res.json({
      success: true,
      message: "Abonnement annulé avec succès",
    });
  } catch (error) {
    console.error("❌ Cancel subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de l'abonnement",
    });
  }
});

export default router;