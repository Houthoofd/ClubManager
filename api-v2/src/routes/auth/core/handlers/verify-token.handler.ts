import { Request, Response } from "express";
import { Auth } from "../../../../db/clients/auth/auth.js";

/**
 * Handler pour vérifier un token de réinitialisation
 */
export async function verifyResetToken(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        valid: false,
        error: "Token requis",
      });
      return;
    }

    console.log(
      "🔍 [Auth] Vérification token:",
      token.substring(0, 10) + "...",
    );

    const authClient = new Auth();
    const tokenData = await authClient.verifierTokenRecuperation(token);

    if (!tokenData) {
      res.status(400).json({
        valid: false,
        error: "Token invalide ou expiré",
      });
      return;
    }

    res.json({
      valid: true,
      email: tokenData.email,
      userName: `${tokenData.first_name} ${tokenData.last_name}`,
    });
  } catch (error: any) {
    console.error("❌ [Auth] Erreur verify-token:", error);
    res.status(500).json({
      valid: false,
      error: "Erreur serveur",
    });
  }
}
