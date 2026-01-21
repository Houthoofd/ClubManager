import express, { Request, Response } from "express";
import { userService } from "../../services/user/user.service.js";

const router = express.Router();

/**
 * POST /api/users/verify
 * Verify if user exists with given details
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { nom, prenom, date_naissance } = req.body;

    if (!nom || !prenom || !date_naissance) {
      return res.status(400).json({
        success: false,
        message: "Nom, prénom et date de naissance sont requis",
      });
    }

    const existingUser = await userService.getUserByEmail(
      `${prenom}.${nom}@example.com`,
      "default"
    );

    return res.json({
      success: true,
      exists: !!existingUser,
      message: existingUser
        ? "Utilisateur trouvé"
        : "Aucun utilisateur trouvé avec ces informations",
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
    });
  }
});

export default router;