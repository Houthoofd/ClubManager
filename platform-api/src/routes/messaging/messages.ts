import express, { Request, Response } from "express";
import { messageService } from "../../services/message/message.service.js";
import { verifyToken } from "../../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/messaging/messages
 * Get messages for current user
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

    const messages = await messageService.getByRecipient(userId, "default");

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("❌ Get messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des messages",
    });
  }
});

/**
 * POST /api/messaging/messages
 * Send new message
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { subject, body, type = "private", recipientId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Sujet et contenu requis",
      });
    }

    const message = await messageService.create(
      { subject, body, type },
      {
        tenantId: "default",
        senderId: userId,
        recipientId,
        type,
      },
      userId
    );

    return res.status(201).json({
      success: true,
      message: "Message envoyé avec succès",
      data: message,
    });
  } catch (error) {
    console.error("❌ Send message error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du message",
    });
  }
});

/**
 * PUT /api/messaging/messages/:id/read
 * Mark message as read
 */
router.put("/:id/read", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const messageId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    const message = await messageService.markAsRead(messageId, userId);

    return res.json({
      success: true,
      message: "Message marqué comme lu",
      data: message,
    });
  } catch (error) {
    console.error("❌ Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du marquage du message",
    });
  }
});

/**
 * DELETE /api/messaging/messages/:id
 * Delete message
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const messageId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    await messageService.delete(messageId, userId);

    return res.json({
      success: true,
      message: "Message supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Delete message error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du message",
    });
  }
});

export default router;