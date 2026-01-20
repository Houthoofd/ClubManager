import express, { Request, Response } from "express";
import {
  paymentService,
  PaymentStatus,
  PaymentMethod,
} from "../services/paymentService.js";
import { auditService, AuditAction } from "../services/auditService.js";

const router = express.Router();

/**
 * Extract tenantId from request
 */
function getTenantId(req: Request): string {
  const user = (req as any).user;
  if (user?.tenantId) {
    return user.tenantId;
  }

  const headerTenant = req.headers["x-tenant-id"] as string;
  if (headerTenant) {
    return headerTenant;
  }

  return process.env.DEFAULT_TENANT_ID || "default-tenant";
}

/**
 * GET /api/paiements
 * List all payments with filters and pagination
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page, limit, utilisateurId, statut, startDate, endDate, methode } =
      req.query;

    // If not admin, only show user's own payments
    const filterUserId =
      user?.role === "admin"
        ? utilisateurId
          ? parseInt(utilisateurId as string)
          : undefined
        : user?.id;

    const result = await paymentService.listPayments({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      utilisateurId: filterUserId,
      statut: statut as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      methode: methode as string,
    });

    return res.json({
      success: true,
      data: result,
      message: "Paiements récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ List payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paiements",
    });
  }
});

/**
 * GET /api/paiements/stats
 * Get payment statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { utilisateurId, startDate, endDate } = req.query;

    // If not admin, only show user's own stats
    const filterUserId =
      user?.role === "admin"
        ? utilisateurId
          ? parseInt(utilisateurId as string)
          : undefined
        : user?.id;

    const stats = await paymentService.getPaymentStats({
      utilisateurId: filterUserId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.json({
      success: true,
      data: stats,
      message: "Statistiques récupérées avec succès",
    });
  } catch (error) {
    console.error("❌ Get payment stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
});

/**
 * GET /api/paiements/:paymentId
 * Get payment by ID with details
 */
router.get("/:paymentId", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const paymentId = parseInt(req.params.paymentId);

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paiement invalide",
      });
    }

    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé",
      });
    }

    // Check access rights
    if (user?.role !== "admin" && payment.utilisateurId !== user?.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    return res.json({
      success: true,
      data: payment,
      message: "Paiement récupéré avec succès",
    });
  } catch (error) {
    console.error("❌ Get payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du paiement",
    });
  }
});

/**
 * POST /api/paiements
 * Create a new payment
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);

    const {
      utilisateurId,
      montant,
      statut,
      datePaiement,
      abonnementId,
      periodeDebut,
      periodeFin,
      methode,
      transactionId,
    } = req.body;

    // Validate required fields
    if (!utilisateurId || !montant) {
      return res.status(400).json({
        success: false,
        message: "utilisateurId et montant sont requis",
      });
    }

    // Check access rights (admin or own payment)
    if (user?.role !== "admin" && utilisateurId !== user?.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const result = await paymentService.createPayment({
      utilisateurId: parseInt(utilisateurId),
      montant: parseFloat(montant),
      statut: statut || PaymentStatus.PENDING,
      datePaiement: datePaiement ? new Date(datePaiement) : undefined,
      abonnementId: abonnementId ? parseInt(abonnementId) : undefined,
      periodeDebut: periodeDebut ? new Date(periodeDebut) : undefined,
      periodeFin: periodeFin ? new Date(periodeFin) : undefined,
      methode: methode || PaymentMethod.CARD,
      transactionId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.CREATE,
        resource: "paiement",
        resourceId: result.payment?.id.toString(),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.status(201).json({
      success: true,
      data: result.payment,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Create payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement",
    });
  }
});

/**
 * PUT /api/paiements/:paymentId
 * Update a payment (admin only)
 */
router.put("/:paymentId", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const paymentId = parseInt(req.params.paymentId);

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paiement invalide",
      });
    }

    const { montant, statut, datePaiement, methode, transactionId } = req.body;

    const result = await paymentService.updatePayment(paymentId, {
      montant: montant ? parseFloat(montant) : undefined,
      statut,
      datePaiement: datePaiement ? new Date(datePaiement) : undefined,
      methode,
      transactionId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.UPDATE,
        resource: "paiement",
        resourceId: paymentId.toString(),
        changes: { montant, statut, datePaiement, methode, transactionId },
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.json({
      success: true,
      data: result.payment,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Update payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du paiement",
    });
  }
});

/**
 * PATCH /api/paiements/:paymentId/status
 * Update payment status
 */
router.patch("/:paymentId/status", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const paymentId = parseInt(req.params.paymentId);
    const { statut, transactionId } = req.body;

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paiement invalide",
      });
    }

    if (!statut) {
      return res.status(400).json({
        success: false,
        message: "Statut requis",
      });
    }

    const result = await paymentService.updatePaymentStatus(
      paymentId,
      statut,
      transactionId,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.UPDATE,
        resource: "paiement_status",
        resourceId: paymentId.toString(),
        changes: { statut, transactionId },
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Update payment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
    });
  }
});

/**
 * DELETE /api/paiements/:paymentId
 * Delete a payment (admin only)
 */
router.delete("/:paymentId", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = getTenantId(req);
    const paymentId = parseInt(req.params.paymentId);

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paiement invalide",
      });
    }

    const result = await paymentService.deletePayment(paymentId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Audit log
    if (user?.id) {
      await auditService.log({
        tenantId,
        userId: user.id,
        action: AuditAction.DELETE,
        resource: "paiement",
        resourceId: paymentId.toString(),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || undefined,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Delete payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du paiement",
    });
  }
});

/**
 * GET /api/paiements/user/:userId/history
 * Get user payment history
 */
router.get("/user/:userId/history", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const utilisateurId = parseInt(req.params.userId);
    const { limit } = req.query;

    if (isNaN(utilisateurId)) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    // Check access rights
    if (user?.role !== "admin" && utilisateurId !== user?.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const history = await paymentService.getUserPaymentHistory(
      utilisateurId,
      limit ? parseInt(limit as string) : undefined,
    );

    return res.json({
      success: true,
      data: history,
      message: "Historique récupéré avec succès",
    });
  } catch (error) {
    console.error("❌ Get payment history error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
    });
  }
});

/**
 * POST /api/paiements/:paymentId/send-confirmation
 * Send payment confirmation email (admin only)
 */
router.post(
  "/:paymentId/send-confirmation",
  async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.paymentId);

      if (isNaN(paymentId)) {
        return res.status(400).json({
          success: false,
          message: "ID de paiement invalide",
        });
      }

      const success = await paymentService.sendPaymentConfirmation(paymentId);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Erreur lors de l'envoi de la confirmation",
        });
      }

      return res.json({
        success: true,
        message: "Email de confirmation envoyé",
      });
    } catch (error) {
      console.error("❌ Send confirmation error:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de la confirmation",
      });
    }
  },
);

/**
 * GET /api/paiements/:paymentId/invoice
 * Generate invoice for a payment
 */
router.get("/:paymentId/invoice", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const paymentId = parseInt(req.params.paymentId);

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paiement invalide",
      });
    }

    // Check access rights
    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé",
      });
    }

    if (user?.role !== "admin" && payment.utilisateurId !== user?.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const result = await paymentService.generateInvoice(paymentId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      data: {
        invoiceUrl: result.invoiceUrl,
      },
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Generate invoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la génération de la facture",
    });
  }
});

/**
 * POST /api/paiements/stripe/payment-intent
 * Create Stripe payment intent (Phase 2 - placeholder)
 */
router.post("/stripe/payment-intent", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { montant, abonnementId, paymentMethodId } = req.body;

    if (!user?.id || !montant) {
      return res.status(400).json({
        success: false,
        message: "Données manquantes",
      });
    }

    const result = await paymentService.processStripePayment({
      utilisateurId: user.id,
      montant: parseFloat(montant),
      abonnementId: abonnementId ? parseInt(abonnementId) : undefined,
      paymentMethodId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      data: {
        payment: result.payment,
        stripePaymentIntentId: result.stripePaymentIntentId,
      },
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Stripe payment intent error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement Stripe",
    });
  }
});

/**
 * POST /api/paiements/stripe/webhook
 * Handle Stripe webhooks (Phase 2 - placeholder)
 */
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      // TODO: Verify Stripe signature
      // const sig = req.headers['stripe-signature'];
      // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      const event = req.body;

      const result = await paymentService.handleStripeWebhook(event);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("❌ Stripe webhook error:", error);
      return res.status(400).json({
        success: false,
        message: "Erreur lors du traitement du webhook",
      });
    }
  },
);

/**
 * GET /api/paiements/pending
 * Get pending payments for reminders (admin only)
 */
router.get("/pending/reminders", async (req: Request, res: Response) => {
  try {
    const { daysOverdue } = req.query;

    const payments = await paymentService.getPendingPayments(
      daysOverdue ? parseInt(daysOverdue as string) : undefined,
    );

    return res.json({
      success: true,
      data: payments,
      message: "Paiements en attente récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ Get pending payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paiements en attente",
    });
  }
});

export default router;
